const express = require('express');
const Message = require('../models/Message');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

async function canAccessMessages(appointmentId, user, userRole) {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) return { allowed: false, error: 'Appointment not found' };

  const isParticipant =
    (userRole === 'patient' && appointment.patient.toString() === user._id.toString()) ||
    (userRole === 'doctor' && appointment.doctor.toString() === user._id.toString());

  if (!isParticipant) return { allowed: false, error: 'Access denied' };

  if (!appointment.paymentId) return { allowed: false, error: 'Payment required before messaging' };

  const payment = await Payment.findById(appointment.paymentId);
  if (!payment || payment.status === 'pending') {
    return { allowed: false, error: 'Payment must be confirmed before messaging' };
  }

  return { allowed: true, appointment };
}

router.get('/check-access/:appointmentId', async (req, res) => {
  try {
    const access = await canAccessMessages(req.params.appointmentId, req.user, req.userRole);
    res.json({ success: true, data: { allowed: access.allowed, reason: access.error || null } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:appointmentId', async (req, res) => {
  try {
    const access = await canAccessMessages(req.params.appointmentId, req.user, req.userRole);
    if (!access.allowed) {
      return res.status(403).json({ success: false, message: access.error });
    }

    const messages = await Message.find({ appointment: req.params.appointmentId }).sort({ createdAt: 1 });
    res.json({ success: true, data: { messages } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:appointmentId', async (req, res) => {
  try {
    const access = await canAccessMessages(req.params.appointmentId, req.user, req.userRole);
    if (!access.allowed) {
      return res.status(403).json({ success: false, message: access.error });
    }

    const message = await Message.create({
      appointment: req.params.appointmentId,
      sender: req.user._id,
      senderRole: req.userRole === 'doctor' ? 'doctor' : 'patient',
      content: req.body.content,
      attachments: req.body.attachments || []
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`appointment:${req.params.appointmentId}`).emit('message:new', { message });
    }

    res.status(201).json({ success: true, data: { message } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:messageId/read', async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    message.isRead = true;
    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`appointment:${message.appointment}`).emit('message:read', { messageId: message._id });
    }

    res.json({ success: true, data: { message } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
