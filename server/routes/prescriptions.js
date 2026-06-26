const express = require('express');
const PDFDocument = require('pdfkit');
const Prescription = require('../models/Prescription');
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

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 60, bottom: 60, left: 60, right: 60 }
    });

    const buffers = [];
    doc.on('data', (buf) => buffers.push(buf));

    await new Promise((resolve, reject) => {
      doc.on('end', resolve);
      doc.on('error', reject);

      doc.save();
      doc.rotate(45, { origin: [doc.page.width / 2, doc.page.height / 2] });
      doc.fontSize(55)
        .fillColor('#e8f4fd')
        .text('Virtualcare', 50, 280, { width: 500, align: 'center' });
      doc.restore();

      doc.rect(0, 0, doc.page.width, 95).fill('#0a2463');

      doc.fillColor('#ffffff')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('Virtualcare Nigeria', 60, 28);

      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#cccccc')
        .text('MDCN-Compliant Telemedicine Platform', 60, 55)
        .text('support@virtualcare.ng', 60, 70);

      doc.fillColor('#0a2463')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('PRESCRIPTION', 60, 115);

      doc.moveTo(60, 138).lineTo(535, 138).strokeColor('#e2e8f0').lineWidth(1).stroke();

      const d = prescription.doctor;
      doc.fillColor('#0f172a')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Prescribing Doctor', 60, 150);
      doc.font('Helvetica')
        .fillColor('#334155')
        .text(`Dr. ${d.name} ${d.surname}`, 60, 166)
        .text(d.specialty || '', 60, 181)
        .text(`MDCN: ${d.mdcnNumber || 'N/A'}`, 60, 196)
        .text(d.hospitalAffiliation || '', 60, 211);

      const p = prescription.patient;
      doc.fillColor('#0f172a')
        .font('Helvetica-Bold')
        .text('Patient', 320, 150);
      doc.font('Helvetica')
        .fillColor('#334155')
        .text(`${p.name} ${p.surname}`, 320, 166)
        .text(`Date: ${new Date().toLocaleDateString('en-NG', {
          timeZone: 'Africa/Lagos',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })}`, 320, 181);

      doc.moveTo(60, 235).lineTo(535, 235).strokeColor('#e2e8f0').lineWidth(1).stroke();

      doc.fillColor('#0a2463')
        .fontSize(13)
        .font('Helvetica-Bold')
        .text('Medications', 60, 250);

      let y = 272;
      (prescription.medications || []).forEach((med, i) => {
        doc.rect(60, y - 6, 475, 65).fillColor('#f8fafc').fill();
        doc.rect(60, y - 6, 3, 65).fillColor('#1d6aba').fill();

        doc.fillColor('#0f172a')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text(`${i + 1}. ${med.name}`, 72, y);
        doc.font('Helvetica')
          .fontSize(10)
          .fillColor('#475569')
          .text(`Dosage: ${med.dosage || '—'}  |  Frequency: ${med.frequency || '—'}`, 72, y + 16)
          .text(`Duration: ${med.duration || '—'}  |  Refills: ${med.refillsAllowed || 0}`, 72, y + 30);
        y += 80;
      });

      if (prescription.notes) {
        doc.moveTo(60, y).lineTo(535, y).strokeColor('#e2e8f0').lineWidth(1).stroke();
        y += 12;
        doc.fillColor('#0a2463')
          .fontSize(11)
          .font('Helvetica-Bold')
          .text("Doctor's Notes:", 60, y);
        y += 16;
        doc.font('Helvetica')
          .fontSize(10)
          .fillColor('#475569')
          .text(prescription.notes, 60, y, { width: 475 });
      }

      const footerY = doc.page.height - 50;
      doc.rect(0, footerY - 10, doc.page.width, 60).fill('#0a2463');
      doc.fillColor('#b0c4de')
        .fontSize(8)
        .text(
          '© 2026 Virtualcare Nigeria  |  NDPR Compliant  |  This prescription is valid for 30 days from issue date',
          60,
          footerY + 2,
          { align: 'center', width: doc.page.width - 120 }
        );

      doc.end();
    });

    const pdfBuffer = Buffer.concat(buffers);
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
