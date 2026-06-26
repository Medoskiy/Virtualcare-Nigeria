const express = require('express');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const upload = require('../middleware/upload');
const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

const router = express.Router();

router.use(auth);

router.post('/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const fileUrl = `/uploads/${req.file.filename}`;

    if (req.userRole === 'doctor') {
      req.doctor.avatar = fileUrl;
      await req.doctor.save();
    } else {
      req.user.avatar = fileUrl;
      await req.user.save();
    }

    res.json({ success: true, data: { url: fileUrl } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/medical-record', requireRole('patient'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const fileUrl = `/uploads/${req.file.filename}`;
    const record = await MedicalRecord.create({
      patient: req.user._id,
      fileName: req.file.originalname,
      fileUrl,
      fileType: req.file.mimetype
    });

    res.status(201).json({ success: true, data: { record } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/chat-attachment', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      data: {
        url: fileUrl,
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
