const express = require('express');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const { notifyDoctorApproved } = require('../services/notificationService');

const router = express.Router();

router.use(auth, requireRole('admin'));

router.get('/dashboard', async (_req, res) => {
  try {
    const [patients, doctors, appointments, payments] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      Doctor.countDocuments({ isApproved: true }),
      Appointment.countDocuments(),
      Payment.find({ status: 'completed' })
    ]);
    const revenue = payments.reduce((sum, p) => sum + p.platformFee, 0);
    res.json({
      success: true,
      data: {
        stats: {
          patients,
          doctors,
          appointments,
          revenue,
          sessions: appointments
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/pending-doctors', async (_req, res) => {
  const doctors = await Doctor.find({ isApproved: false }).select('-password');
  res.json({ success: true, data: { doctors } });
});

router.put('/approve-doctor/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    doctor.isApproved = true;
    doctor.isVerified = true;
    await doctor.save();
    await notifyDoctorApproved(doctor);
    res.json({ success: true, message: 'Doctor approved', data: { doctor } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/reject-doctor/:id', async (req, res) => {
  try {
    await Doctor.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Doctor registration rejected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/doctors/:id/price', async (req, res) => {
  try {
    const { pricePerSession } = req.body;

    if (!pricePerSession || Number(pricePerSession) < 1000) {
      return res.status(400).json({
        success: false,
        message: 'Price must be at least ₦1,000'
      });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { pricePerSession: Number(pricePerSession) },
      { new: true, runValidators: true }
    ).select('-password');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      message: `Price updated to ₦${Number(pricePerSession).toLocaleString('en-NG')} for Dr. ${doctor.name} ${doctor.surname}`,
      data: { doctor }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/users', async (req, res) => {
  const { role, active } = req.query;
  const patientFilter = {};
  if (active !== undefined) patientFilter.isActive = active === 'true';

  const patients = await User.find(patientFilter).select('-password');
  const doctors = await Doctor.find(role === 'doctor' ? {} : { isApproved: true }).select('-password');
  res.json({ success: true, data: { patients, doctors } });
});

router.put('/users/:id/suspend', async (req, res) => {
  try {
    let user = await User.findById(req.params.id);
    if (user) {
      user.isActive = false;
      await user.save();
      return res.json({ success: true, message: 'User suspended' });
    }
    res.status(404).json({ success: false, message: 'User not found' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/consultations', async (_req, res) => {
  const appointments = await Appointment.find()
    .populate('patient', 'name surname')
    .populate('doctor', 'name surname specialty')
    .sort({ scheduledAt: -1 });
  res.json({ success: true, data: { appointments } });
});

router.get('/revenue', async (_req, res) => {
  const payments = await Payment.find({ status: 'completed' }).populate('doctor', 'name surname');
  const totalRevenue = payments.reduce((s, p) => s + p.finalAmount, 0);
  const platformRevenue = payments.reduce((s, p) => s + p.platformFee, 0);
  const doctorPayouts = payments.reduce((s, p) => s + p.doctorEarning, 0);
  res.json({
    success: true,
    data: { payments, totalRevenue, platformRevenue, doctorPayouts }
  });
});

router.post('/notifications/send', async (req, res) => {
  try {
    const { title, body, target, type, link } = req.body;
    const Notification = require('../models/Notification');
    const User = require('../models/User');
    const io = req.app.get('io');

    let recipients = [];
    if (target === 'all_patients') recipients = await User.find({ role: { $ne: 'admin' } });
    else if (target === 'all_doctors') recipients = await Doctor.find({ isApproved: true });
    else if (target === 'all') {
      const pts = await User.find({ role: { $ne: 'admin' } });
      const docs = await Doctor.find({ isApproved: true });
      recipients = [...pts, ...docs];
    }

    const { createInAppNotification } = require('../services/notificationService');
    for (const r of recipients) {
      await createInAppNotification({
        user: r._id,
        userRole: r.role || 'doctor',
        type: type || 'system',
        title,
        body,
        link: link || '/'
      }, io);
    }

    res.json({ success: true, message: `Notification sent to ${recipients.length} users` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/notifications/history', async (_req, res) => {
  const Notification = require('../models/Notification');
  const notifications = await Notification.find({ type: 'system' }).sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, data: { notifications } });
});

module.exports = router;
