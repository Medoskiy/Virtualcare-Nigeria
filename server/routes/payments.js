const crypto = require('crypto');
const express = require('express');
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const { calculateDiscount } = require('../services/discountService');
const {
  initializePayment,
  verifyPayment,
  listBanks,
  createTransferRecipient,
  transferToDoctorAccount,
  buildPaymentRecord,
  isPaystackConfigured
} = require('../services/paystackService');
const { sendSuccess, sendError } = require('../utils/response');
const { notifyAppointmentBooked, notifyPaymentConfirmed, createInAppNotification } = require('../services/notificationService');
const { sendAppointmentConfirmationEmail, sendDoctorInvoiceEmail } = require('../services/emailService');

const router = express.Router();

async function completePaymentByReference(reference, io) {
  const payment = await Payment.findOne({ paystackReference: reference });
  if (!payment || payment.status === 'completed') return payment;

  payment.status = 'completed';
  await payment.save();

  const appointment = await Appointment.findById(payment.appointment);
  if (appointment) {
    appointment.status = 'confirmed';
    appointment.paymentId = payment._id;
    await appointment.save();
    try {
      const patientUser = await User.findById(payment.patient);
      const doctorUser = await Doctor.findById(payment.doctor);
      if (patientUser && doctorUser) {
        await sendAppointmentConfirmationEmail(patientUser, doctorUser, appointment, payment);
      }
    } catch (e) { console.error('Confirmation email failed:', e.message); }
  }

  await User.findByIdAndUpdate(payment.patient, {
    $inc: { consultationCount: 1 },
    isReturningPatient: true
  });

  const doctor = await Doctor.findById(payment.doctor);
  if (doctor?.paystackRecipientCode) {
    await transferToDoctorAccount({
      amount: payment.doctorEarning,
      recipientCode: doctor.paystackRecipientCode,
      reason: `Virtualcare consultation payout — ${reference}`
    });
  }

  if (doctor) {
    await notifyPaymentConfirmed(payment.patient, payment.finalAmount, doctor.surname, io);
  }

  if (appointment && io) {
    io.to(`doctor:${payment.doctor}`).emit('appointment:incoming', { appointment });
  }

  return payment;
}

router.get('/config', (_req, res) => {
  sendSuccess(res, {
    paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
    currency: 'NGN',
    currencySymbol: '₦'
  });
});

router.get('/banks', auth, async (_req, res) => {
  try {
    const result = await listBanks();
    sendSuccess(res, { banks: result.data || [] });
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

router.post('/initialize', auth, requireRole('patient'), async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointment = await Appointment.findById(appointmentId).populate('doctor');
    if (!appointment) return sendError(res, 'Appointment not found', 404);

    const patient = await User.findById(req.user._id);
    const discount = calculateDiscount(patient, appointment.doctor.pricePerSession);
    const paymentData = buildPaymentRecord({
      patient, doctor: appointment.doctor, appointment,
      grossAmount: appointment.doctor.pricePerSession,
      discount
    });

    const result = await initializePayment({
      email: patient.email,
      amount: paymentData.finalAmount,
      metadata: {
        appointmentId: appointment._id.toString(),
        patientId: patient._id.toString(),
        doctorId: appointment.doctor._id.toString()
      }
    });

    let payment = await Payment.findOne({ appointment: appointment._id });
    if (!payment) {
      payment = await Payment.create({
        ...paymentData,
        paystackReference: result.data.reference,
        status: 'pending'
      });
      appointment.paymentId = payment._id;
      await appointment.save();
    } else {
      payment.paystackReference = result.data.reference;
      await payment.save();
    }

    if (result.mock) {
      await completePaymentByReference(result.data.reference, req.app.get('io'));
      const patientFull = await User.findById(patient._id);
      const doctor = await Doctor.findById(appointment.doctor._id);
      await notifyAppointmentBooked(patientFull, doctor, appointment);
    }

    sendSuccess(res, {
      authorizationUrl: result.data.authorization_url,
      reference: result.data.reference,
      amountInKobo: paymentData.finalAmount * 100,
      payment,
      discount,
      mock: Boolean(result.mock)
    }, result.mock ? 'Payment completed (demo mode)' : 'Payment initialized');
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

router.get('/verify/:reference', auth, async (req, res) => {
  try {
    const result = await verifyPayment(req.params.reference);
    if (result.mock || result.data?.status === 'success') {
      const payment = await completePaymentByReference(req.params.reference, req.app.get('io'));
      return sendSuccess(res, { payment }, 'Payment verified successfully');
    }
    sendError(res, 'Payment verification failed', 400);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

router.post('/connect-bank', auth, requireRole('doctor'), async (req, res) => {
  try {
    const { bankCode, bankName, accountNumber, accountName, bvn } = req.body;
    const recipient = await createTransferRecipient({
      name: accountName || `Dr. ${req.doctor.surname}`,
      accountNumber,
      bankCode
    });
    req.doctor.bankCode = bankCode;
    req.doctor.bankName = bankName;
    req.doctor.accountNumber = accountNumber;
    req.doctor.accountName = accountName;
    req.doctor.bvn = bvn;
    req.doctor.paystackRecipientCode = recipient.data?.recipient_code || '';
    await req.doctor.save();
    sendSuccess(res, { doctor: req.doctor }, 'Bank account linked for Paystack payouts');
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

router.post('/withdrawal-request', auth, requireRole('doctor'), async (req, res) => {
  try {
    const {
      bankName, bankCode, accountNumber,
      accountName, accountType, amount
    } = req.body;

    const doctor = await Doctor.findById(req.user._id);
    if (!doctor) return sendError(res, 'Doctor not found', 404);

    const formattedAmount = Number(amount).toLocaleString('en-NG');
    const maskedAccount = `${accountNumber.slice(0, 3)}***${accountNumber.slice(-2)}`;
    const doctorLabel = `Dr. ${doctor.name} ${doctor.surname}`;
    const notificationBody = `${doctorLabel} has requested a withdrawal of ₦${formattedAmount} to ${bankName} account ending ${accountNumber.slice(-4)}`;

    const admins = await User.find({ role: 'admin' });
    const io = req.io;

    await Promise.all(admins.map((admin) => createInAppNotification({
      user: admin._id,
      userRole: 'admin',
      type: 'system',
      title: '💳 New Withdrawal Request',
      body: notificationBody,
      link: '/admin/payouts'
    }, io)));

    io?.to('role:admin').emit('notification:new', {
      type: 'withdrawal',
      title: 'New Withdrawal Request',
      body: `${doctorLabel} · ₦${formattedAmount}`,
      doctorId: req.user._id,
      amount,
      bankName,
      accountNumber: maskedAccount,
      timestamp: new Date()
    });

    sendSuccess(res, {
      reference: `WD-${Date.now().toString().slice(-8)}`,
      amount,
      bankName,
      accountType,
      bankCode,
      accountName,
      processingDays: '1-2 business days'
    }, 'Withdrawal request submitted successfully. Admin has been notified.');
    try {
      if (doctor) {
        await sendDoctorInvoiceEmail(doctor, {
          reference: `WD-${Date.now().toString().slice(-8)}`,
          amount,
          bankName,
          accountNumber
        });
      }
    } catch (e) { console.error('Invoice email failed:', e.message); }
  } catch (error) {
    sendError(res, error.message, 500);
  }
});

router.get('/history', auth, requireRole('patient'), async (req, res) => {
  const payments = await Payment.find({ patient: req.user._id })
    .populate('doctor', 'name surname')
    .sort({ createdAt: -1 });
  sendSuccess(res, { payments });
});

module.exports = router;

async function handlePaystackWebhook(req, res) {
  if (!isPaystackConfigured()) return res.sendStatus(200);

  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(400).send('Invalid signature');
  }

  const event = req.body;
  const io = req.app?.get?.('io');

  if (event.event === 'charge.success') {
    await completePaymentByReference(event.data.reference, io);
  }

  res.sendStatus(200);
}

module.exports.handlePaystackWebhook = handlePaystackWebhook;
module.exports.completePaymentByReference = completePaymentByReference;
