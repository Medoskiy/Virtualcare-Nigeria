const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const { generateTokenForUser } = require('../services/videoService');
const { sendSuccess, sendError } = require('../utils/response');

// Get token for video or audio call
router.get('/token/:appointmentId', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);
    if (!appointment) return sendError(res, 'Appointment not found', 404);

    const isDoctor = req.user.role === 'doctor';
    const isPatient = req.user.role === 'patient';

    if (!isDoctor && !isPatient) {
      return sendError(res, 'Unauthorized', 403);
    }

    // Block patient from joining if payment not confirmed
    if (isPatient && appointment.status !== 'confirmed') {
      return sendError(res, 'Payment required to join this call', 403);
    }

    // Doctor is uid 1 (host), Patient is uid 2 (guest)
    const uid = isDoctor ? 1 : 2;
    const callMode = req.query.mode || 'video'; // 'video' or 'audio'

    const tokenData = await generateTokenForUser(
      req.params.appointmentId,
      uid,
      isDoctor
    );

    sendSuccess(res, {
      ...tokenData,
      role: isDoctor ? 'host' : 'guest',
      callMode, // video or audio
      appId: process.env.AGORA_APP_ID
    }, `${callMode === 'audio' ? 'Audio' : 'Video'} call token generated`);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// Get full room details for video or audio call
router.get('/room/:appointmentId', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate('doctor', 'name surname specialty')
      .populate('patient', 'name email');

    if (!appointment) return sendError(res, 'Appointment not found', 404);

    const isDoctor = req.user.role === 'doctor';
    const isPatient = req.user.role === 'patient';

    // Block patient from joining if payment not confirmed
    if (isPatient && appointment.status !== 'confirmed') {
      return sendError(res, 'Payment required to join this call', 403);
    }

    const uid = isDoctor ? 1 : 2;
    const callMode = req.query.mode || 'video';

    const tokenData = await generateTokenForUser(
      req.params.appointmentId,
      uid,
      isDoctor
    );

    sendSuccess(res, {
      appointment: {
        id: appointment._id,
        scheduledAt: appointment.scheduledAt,
        type: appointment.type,
        status: appointment.status
      },
      doctor: appointment.doctor,
      patient: appointment.patient,
      call: {
        ...tokenData,
        role: isDoctor ? 'host' : 'guest',
        callMode,
        appId: process.env.AGORA_APP_ID,
        features: {
          video: callMode === 'video',
          audio: true, // always enabled
          chat: true,  // always enabled
          screenShare: callMode === 'video'
        }
      }
    }, 'Call room details fetched');
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// End a call session
router.post('/end/:appointmentId', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);
    if (!appointment) return sendError(res, 'Appointment not found', 404);

    appointment.status = 'completed';
    appointment.completedAt = new Date();
    await appointment.save();

    // Notify via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`doctor:${appointment.doctor}`).emit('call:ended', { appointmentId: appointment._id });
      io.to(`patient:${appointment.patient}`).emit('call:ended', { appointmentId: appointment._id });
    }

    sendSuccess(res, { appointment }, 'Call ended successfully');
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

module.exports = router;
