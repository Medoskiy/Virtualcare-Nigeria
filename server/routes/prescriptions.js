const express = require('express');
const Prescription = require('../models/Prescription');
const { generatePrescriptionPDF } = require('../services/prescriptionPDF');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');

const router = express.Router();

router.use(auth);

router.post('/', requireRole('doctor'), async (req, res) => {
  try {
    const { patientId, appointmentId, medications, notes, expiresAt } = req.body;
    const prescription = await Prescription.create({
      doctor: req.doctor._id,
      patient: patientId,
      appointment: appointmentId,
      medications,
      notes,
      expiresAt
    });
    res.status(201).json({ success: true, data: { prescription } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/patient/:patientId', requireRole('doctor'), async (req, res) => {
  const prescriptions = await Prescription.find({ patient: req.params.patientId })
    .populate('doctor', 'name surname')
    .sort({ issuedAt: -1 });
  res.json({ success: true, data: { prescriptions } });
});

router.get('/my', requireRole('patient'), async (req, res) => {
  const prescriptions = await Prescription.find({ patient: req.user._id })
    .populate('doctor', 'name surname specialty')
    .sort({ issuedAt: -1 });
  res.json({ success: true, data: { prescriptions }, message: '', errors: null });
});

router.get('/:id/download', auth, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('doctor')
      .populate('patient');

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    const isPatient = req.userRole === 'patient' &&
      prescription.patient._id.toString() === req.user._id.toString();
    const isDoctor = req.userRole === 'doctor' &&
      prescription.doctor._id.toString() === req.doctor._id.toString();
    const isAdmin = req.userRole === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const pdfBuffer = await generatePrescriptionPDF(
      prescription,
      prescription.patient,
      prescription.doctor
    );

    const filename = `virtualcare-rx-${prescription._id.toString().slice(-6)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF error:', error);
    res.status(500).json({
      success: false,
      message: `Could not generate PDF: ${error.message}`
    });
  }
});

router.post('/:id/refill-request', requireRole('patient'), async (req, res) => {
  const rx = await Prescription.findOne({ _id: req.params.id, patient: req.user._id });
  if (!rx) return res.status(404).json({ success: false, data: null, message: 'Prescription not found', errors: null });
  res.json({ success: true, data: { prescriptionId: rx._id }, message: 'Refill request submitted to your doctor', errors: null });
});

module.exports = router;
