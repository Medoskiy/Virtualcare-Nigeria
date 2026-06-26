const express = require('express');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const MedicalRecord = require('../models/MedicalRecord');
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');

const router = express.Router();

router.use(auth, requireRole('patient', 'admin'));

router.get('/profile', async (req, res) => {
  res.json({ success: true, data: { profile: req.user } });
});

router.put('/profile', async (req, res) => {
  try {
    const allowed = ['name', 'surname', 'phone', 'dateOfBirth', 'medicalHistoryNotes', 'avatar'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) req.user[field] = req.body[field];
    });
    await req.user.save();
    res.json({ success: true, message: 'Profile updated', data: { profile: req.user } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/history', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 10;
  const skip = (page - 1) * limit;
  const [appointments, total] = await Promise.all([
    Appointment.find({ patient: req.user._id })
      .populate('doctor', 'name surname specialty avatar rating')
      .populate('paymentId')
      .sort({ scheduledAt: -1 }).skip(skip).limit(limit),
    Appointment.countDocuments({ patient: req.user._id })
  ]);
  res.json({ success: true, data: { appointments, page, total, pages: Math.ceil(total / limit) }, message: '', errors: null });
});

router.get('/prescriptions', async (req, res) => {
  const prescriptions = await Prescription.find({ patient: req.user._id })
    .populate('doctor', 'name surname specialty')
    .sort({ issuedAt: -1 });
  res.json({ success: true, data: { prescriptions } });
});

router.get('/records', async (req, res) => {
  const records = await MedicalRecord.find({ patient: req.user._id }).sort({ uploadedAt: -1 });
  res.json({ success: true, data: { records } });
});

router.post('/records/upload', async (req, res) => {
  res.status(400).json({ success: false, message: 'Use /api/upload/medical-record endpoint' });
});

router.put('/records/:id/share', async (req, res) => {
  try {
    const { doctorId, revoke } = req.body;
    const record = await MedicalRecord.findOne({ _id: req.params.id, patient: req.user._id });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    if (revoke) {
      record.sharedWith = record.sharedWith.filter((id) => id.toString() !== doctorId);
    } else if (!record.sharedWith.includes(doctorId)) {
      record.sharedWith.push(doctorId);
      record.permissionGrantedAt.push(new Date());
    }
    await record.save();
    res.json({ success: true, message: revoke ? 'Permission revoked' : 'Permission granted', data: { record } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/payments', async (req, res) => {
  const payments = await Payment.find({ patient: req.user._id })
    .populate('doctor', 'name surname')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: { payments } });
});

router.get('/upcoming', async (req, res) => {
  const appointments = await Appointment.find({
    patient: req.user._id,
    scheduledAt: { $gte: new Date() },
    status: { $in: ['pending', 'confirmed', 'active'] }
  }).populate('doctor', 'name surname specialty avatar availabilityStatus').sort({ scheduledAt: 1 });
  res.json({ success: true, data: { appointments } });
});

module.exports = router;
