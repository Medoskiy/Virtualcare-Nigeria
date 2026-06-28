const express = require('express');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const { calculateDiscount } = require('../services/discountService');
const { initializePayment, buildPaymentRecord } = require('../services/paystackService');
const { completePaymentByReference } = require('../routes/payments');
const { notifyAppointmentBooked } = require('../services/notificationService');
const { createVideoRoom } = require('../services/videoService');
const { sendSuccess, sendError } = require('../utils/response');

const router = express.Router();

router.use(auth);

router.post('/book', requireRole('patient'), async (req, res) => {
  try {
    const { doctorId, specialty, sessionType, scheduledAt, notes } = req.body;
    const doctor = await Doctor.findOne({ _id: doctorId, isApproved: true });
    if (!doctor) return sendError(res, 'Doctor not found', 404);

    const patient = await User.findById(req.user._id);
    const discount = calculateDiscount(patient, doctor.pricePerSession);

    const appointment = await Appointment.create({
      patient: patient._id,
      doctor: doctor._id,
      specialty: specialty || doctor.specialty,
      sessionType: sessionType || 'video',
      scheduledAt: new Date(scheduledAt),
      notes,
      isReturnVisit: discount.isReturning,
      discountApplied: discount.discountPercent,
      status: 'pending'
    });

    const paymentData = buildPaymentRecord({
      patient, doctor, appointment,
      grossAmount: doctor.pricePerSession,
      discount
    });

    const paystack = await initializePayment({
      email: patient.email,
      amount: paymentData.finalAmount,
      metadata: { appointmentId: appointment._id.toString() }
    });

    const payment = await Payment.create({
      ...paymentData,
      paystackReference: paystack.data.reference,
      status: paystack.mock ? 'completed' : 'pending'
    });

    appointment.paymentId = payment._id;

    if (paystack.mock) {
      appointment.status = 'confirmed';
      await appointment.save();
      try {
        const videoRoom = await createVideoRoom(appointment._id.toString());
        appointment.videoRoom = videoRoom;
        await appointment.save();
      } catch (e) { console.error('Video/Audio room creation failed:', e.message); }
      await completePaymentByReference(paystack.data.reference, req.app.get('io'));
      await notifyAppointmentBooked(patient, doctor, appointment, req.app.get('io'));
      const io = req.app.get('io');
      if (io) io.to(`doctor:${doctor._id}`).emit('appointment:incoming', { appointment });

      return res.status(201).json({
        success: true,
        message: 'Appointment booked and paid (demo mode)',
        data: { appointment, payment, discount, mock: true },
        errors: null
      });
    }

    await appointment.save();
    try {
      const videoRoom = await createVideoRoom(appointment._id.toString());
      appointment.videoRoom = videoRoom;
      await appointment.save();
    } catch (e) { console.error('Video/Audio room creation failed:', e.message); }
    res.status(201).json({
      success: true,
      message: 'Appointment created — complete payment via Paystack',
      data: {
        appointment,
        payment,
        authorizationUrl: paystack.data.authorization_url,
        reference: paystack.data.reference,
        discount
      },
      errors: null
    });
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name surname email avatar')
      .populate('doctor', 'name surname specialty avatar availabilityStatus stateOfPractice');
    if (!appointment) return sendError(res, 'Not found', 404);

    const isPatient = appointment.patient._id.toString() === req.user._id.toString();
    const isDoctor = req.userRole === 'doctor' && appointment.doctor._id.toString() === req.user._id.toString();
    if (!isPatient && !isDoctor && req.userRole !== 'admin') {
      return sendError(res, 'Access denied', 403);
    }

    sendSuccess(res, { appointment });
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

router.put('/:id/cancel', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return sendError(res, 'Not found', 404);

    appointment.status = 'cancelled';
    await appointment.save();

    const io = req.app.get('io');
    if (io) io.to(`appointment:${appointment._id}`).emit('appointment:cancelled', { appointmentId: appointment._id });

    sendSuccess(res, { appointment }, 'Appointment cancelled');
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

router.put('/:id/complete', requireRole('doctor'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return sendError(res, 'Not found', 404);

    appointment.status = 'completed';
    await appointment.save();

    const patient = await User.findById(appointment.patient);
    if (patient) {
      patient.consultationCount += 1;
      patient.isReturningPatient = true;
      await patient.save();
    }

    const doctor = await Doctor.findById(appointment.doctor);
    if (doctor) {
      doctor.totalConsultations += 1;
      doctor.lastSessionAt = new Date();
      doctor.availabilityStatus = 'green';
      await doctor.save();
    }

    sendSuccess(res, { appointment }, 'Appointment completed');
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

router.post('/:id/video-room', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return sendError(res, 'Not found', 404);

    if (!appointment.videoRoomUrl) {
      const room = await createVideoRoom(appointment._id);
      appointment.videoRoomUrl = room.url;
      appointment.status = 'active';
      appointment.sessionStartedAt = new Date();
      await appointment.save();

      const doctor = await Doctor.findById(appointment.doctor);
      if (doctor) {
        doctor.availabilityStatus = 'red';
        await doctor.save();
        const io = req.app.get('io');
        if (io) io.emit('doctor:status-update', { doctorId: doctor._id, status: 'red' });
      }
    }

    sendSuccess(res, { videoRoomUrl: appointment.videoRoomUrl });
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

router.get('/patient/all', requireRole('patient'), async (req, res) => {
  const appointments = await Appointment.find({ patient: req.user._id })
    .populate('doctor', 'name surname specialty avatar stateOfPractice')
    .sort({ scheduledAt: -1 });
  sendSuccess(res, { appointments });
});

router.get('/doctor/all', requireRole('doctor'), async (req, res) => {
  const appointments = await Appointment.find({ doctor: req.user._id })
    .populate('patient', 'name surname avatar state')
    .sort({ scheduledAt: -1 });
  sendSuccess(res, { appointments });
});

module.exports = router;
