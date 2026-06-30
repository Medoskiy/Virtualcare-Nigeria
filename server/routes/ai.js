const express = require('express');
const rateLimit = require('express-rate-limit');
const Anthropic = require('@anthropic-ai/sdk');
const User = require('../models/User');
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const { getNigerianMockResponse } = require('../services/aiMockService');
const {
  buildPersonalisedSystemPrompt
} = require('../services/virtualAiPrompt');
const { sendSuccess, sendError } = require('../utils/response');

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { success: false, message: 'You have reached the AI chat limit. Please try again in an hour.' }
});

router.use(auth, requireRole('patient'), aiLimiter);

async function handlePriorityBooking(reply, req, patient) {
  if (!reply.includes('"action":"PRIORITY_BOOKING"')) {
    return null;
  }

  const jsonMatch = reply.match(/\{"action":"PRIORITY_BOOKING".*?\}/);
  if (!jsonMatch) return null;

  try {
    const action = JSON.parse(jsonMatch[0]);
    await User.findByIdAndUpdate(patient._id, {
      priorityBooking: true,
      priorityReason: action.reason || 'Emergency symptoms via VirtualAI',
      prioritySetAt: new Date()
    });

    req.io?.to('role:admin').emit('priority:booking', {
      patientId: patient._id,
      patientName: `${patient.name} ${patient.surname}`,
      reason: action.reason || 'Emergency symptoms described to VirtualAI',
      urgency: action.urgency || 'high',
      timestamp: new Date()
    });

    const cleanReply = reply.replace(/\{"action":"PRIORITY_BOOKING".*?\}/g, '').trim();
    return { reply: cleanReply, priorityBookingTriggered: true };
  } catch (e) {
    console.error('Priority booking parse error:', e);
    return null;
  }
}

async function handleBookAppointment(action, req, patient) {
  try {
    const Doctor = require('../models/Doctor');

    const specialist = action.specialist || 'General Practitioner';

    let doctors = await Doctor.find({
      specialty: { $regex: specialist, $options: 'i' },
      isAvailable: true,
      isApproved: true
    }).limit(3);

    if (!doctors.length) {
      doctors = await Doctor.find({
        isAvailable: true,
        isApproved: true
      }).limit(3);
    }

    if (!doctors.length) {
      return {
        bookingStatus: 'no_doctor_available',
        specialist,
        urgency: action.urgency || 'normal',
        reason: action.reason || 'VirtualAI referral',
        doctors: []
      };
    }

    return {
      bookingStatus: 'show_doctors',
      specialist,
      urgency: action.urgency || 'normal',
      reason: action.reason || 'VirtualAI referral',
      doctors: doctors.map(d => ({
        id: d._id,
        name: `Dr. ${d.name} ${d.surname}`,
        specialty: d.specialty,
        photo: d.photo,
        rating: d.rating,
        pricePerSession: d.pricePerSession,
        availableSlots: generateTimeSlots(d.availabilitySchedule)
      }))
    };
  } catch (e) {
    console.error('VirtualAI booking error:', e.message);
    return null;
  }
}

function generateTimeSlots(schedule) {
  const slots = [];
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const timeOptions = { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit' };

  for (let i = 1; i <= 3; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    const dayName = days[date.getDay()];

    const daySchedule = schedule?.[dayName];
    if (daySchedule?.available && daySchedule?.start && daySchedule?.end) {
      const [startHour] = daySchedule.start.split(':').map(Number);
      const [endHour] = daySchedule.end.split(':').map(Number);

      for (let hour = startHour; hour < endHour; hour += 1) {
        const slot = new Date(date);
        slot.setHours(hour, 0, 0, 0);
        slots.push({
          datetime: slot.toISOString(),
          display: `${date.toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Africa/Lagos' })} at ${slot.toLocaleTimeString('en-NG', timeOptions)} WAT`
        });
      }
    } else {
      // Default slots if no schedule set
      ['09:00', '11:00', '14:00', '16:00'].forEach(time => {
        const [h, m] = time.split(':').map(Number);
        const slot = new Date(date);
        slot.setHours(h, m, 0, 0);
        slots.push({
          datetime: slot.toISOString(),
          display: `${date.toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Africa/Lagos' })} at ${time} WAT`
        });
      });
    }
  }

  return slots.slice(0, 4); // Return max 4 slots per doctor
}

router.post('/chat', async (req, res) => {
  const { message, conversationHistory, history: historyAlias } = req.body;
  const rawHistory = conversationHistory || historyAlias || [];

  if (!message) {
    return sendError(res, 'Message required');
  }

  try {
    const patient = await User.findById(req.user._id);
    if (!patient) {
      return sendError(res, 'Patient not found', 404);
    }

    const [prescriptions, appointments] = await Promise.all([
      Prescription.find({ patient: patient._id }).populate('doctor'),
      Appointment.find({ patient: patient._id, status: 'completed' })
        .populate('doctor')
        .sort({ createdAt: -1 })
        .limit(3)
    ]);

    const prescriptionText = prescriptions.length > 0
      ? prescriptions.map((p) =>
        (p.medications || []).map((m) => `${m.name} ${m.dosage || ''}`.trim()).join(', ')
      ).join('; ')
      : 'No active prescriptions';

    const consultationText = appointments.length > 0
      ? appointments.map((a) =>
        `${a.doctor?.specialty || 'General'} with Dr. ${a.doctor?.surname || 'Unknown'}`
      ).join(', ')
      : 'No past consultations';

    const recentAIMessages = rawHistory
      .filter((h) => h.role === 'ai' || h.role === 'assistant')
      .slice(-3)
      .map((h) => h.content || h.text || '');

    const antiRepeatInstruction = recentAIMessages.length > 0
      ? `\n\nIMPORTANT - You have already said these things recently, DO NOT repeat or ask similar questions again:\n${
        recentAIMessages.map((m, i) => `${i + 1}. "${m.substring(0, 100)}..."`).join('\n')
      }\nAlways move the conversation FORWARD.`
      : '';

    const systemPrompt = buildPersonalisedSystemPrompt(
      patient,
      prescriptionText,
      consultationText
    );
    const finalSystemPrompt = systemPrompt + antiRepeatInstruction;

    const messages = [
      { role: 'system', content: finalSystemPrompt },
      ...rawHistory
        .filter((msg) => msg && (msg.content || msg.text))
        .map((msg) => ({
          role: (msg.role === 'ai' || msg.role === 'assistant')
            ? 'assistant'
            : 'user',
          content: msg.content || msg.text || ''
        }))
        .filter((msg) => msg.content.trim().length > 0),
      { role: 'user', content: message }
    ];

    const respondWithMock = () => {
      const mockResponse = getNigerianMockResponse(
        message,
        `${patient.name} ${patient.surname}`,
        rawHistory,
        patient.medicalHistoryNotes || 'No recorded history',
        prescriptionText
      );
      return { reply: mockResponse, isDemo: true };
    };

    if (!process.env.CLAUDE_API_KEY) {
      const mock = respondWithMock();
      const priority = await handlePriorityBooking(mock.reply, req, patient);
      if (priority) {
        return sendSuccess(res, { ...priority, isDemo: true });
      }
      return sendSuccess(res, mock);
    }

    try {
      const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
      const systemMessage = messages.find(m => m.role === 'system')?.content || '';
      const chatMessages = messages.filter(m => m.role !== 'system');
      const completion = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        system: systemMessage,
        messages: chatMessages
      });

      let reply = completion.content[0]?.text || 'I could not generate a response.';

      // Extract JSON actions BEFORE stripping them
      const priorityMatch = reply.match(/\{"action"\s*:\s*"PRIORITY_BOOKING"[^}]*\}/);
      const bookingMatch = reply.match(/\{"action"\s*:\s*"BOOK_APPOINTMENT"[^}]*\}/);

      // Strip ALL JSON blocks and markdown from visible reply
      function cleanReply(text) {
        return text
          .replace(/```json[\s\S]*?```/gi, '')
          .replace(/```[\s\S]*?```/gi, '')
          .replace(/\{[^{}]*"action"\s*:[^{}]*\}/g, '')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      }

      reply = cleanReply(reply);

      // Handle priority booking
      if (priorityMatch) {
        try {
          const action = JSON.parse(priorityMatch[0]);
          await User.findByIdAndUpdate(patient._id, {
            priorityBooking: true,
            priorityReason: action.reason || 'Emergency symptoms via VirtualAI',
            prioritySetAt: new Date()
          });
          req.io?.to('role:admin').emit('priority:booking', {
            patientId: patient._id,
            patientName: `${patient.name} ${patient.surname}`,
            reason: action.reason || 'Emergency symptoms described to VirtualAI',
            urgency: action.urgency || 'high',
            timestamp: new Date()
          });
          return sendSuccess(res, { reply, priorityBookingTriggered: true });
        } catch (e) {
          console.error('Priority booking error:', e.message);
        }
      }

      // Handle appointment booking
      if (bookingMatch) {
        try {
          const action = JSON.parse(bookingMatch[0]);
          const bookingResult = await handleBookAppointment(action, req, patient);
          if (bookingResult) {
            return sendSuccess(res, {
              reply,
              bookingStatus: bookingResult.bookingStatus,
              specialist: bookingResult.specialist,
              urgency: bookingResult.urgency,
              reason: bookingResult.reason,
              doctors: bookingResult.doctors || []
            });
          }
        } catch (e) {
          console.error('Booking error:', e.message);
        }
      }

      return sendSuccess(res, { reply });
    } catch (error) {
      console.error('VirtualAI error:', error.message);
      const mock = respondWithMock();
      mock.reply = mock.reply.replace(/```json[\s\S]*?```/g, '').replace(/```[\s\S]*?```/g, '').replace(/\{"action":"[^}]+"[^}]*\}/g, '').trim();
      const priority = await handlePriorityBooking(mock.reply, req, patient);
      if (priority) {
        return sendSuccess(res, { ...priority, isDemo: true });
      }
      return sendSuccess(res, mock);
    }
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

router.post('/book-appointment', async (req, res) => {
  try {
    const { doctorId, scheduledAt, reason, urgency } = req.body;
    const Doctor = require('../models/Doctor');
    const Appointment = require('../models/Appointment');

    const patient = await User.findById(req.user._id);
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) return sendError(res, 'Doctor not found', 404);

    const appointment = await Appointment.create({
      patient: patient._id,
      doctor: doctor._id,
      scheduledAt: new Date(scheduledAt),
      type: 'video',
      status: 'pending',
      reason: reason || 'VirtualAI referral',
      notes: `Booked via VirtualAI. Urgency: ${urgency || 'normal'}.`
    });

    // Notify via socket
    const io = req.app?.get?.('io');
    if (io) {
      io.to('role:admin').emit('appointment:new', {
        appointment,
        patientName: `${patient.name} ${patient.surname}`,
        doctorName: `Dr. ${doctor.name} ${doctor.surname}`,
        reason,
        source: 'VirtualAI'
      });
      io.to(`doctor:${doctor._id}`).emit('appointment:incoming', { appointment });
    }

    // Send confirmation email
    try {
      const { sendAppointmentConfirmationEmail } = require('../services/emailService');
      await sendAppointmentConfirmationEmail(patient, doctor, appointment, { finalAmount: 0 });
    } catch (e) {
      console.error('Booking email failed:', e.message);
    }

    sendSuccess(res, {
      appointment: {
        id: appointment._id,
        doctor: `Dr. ${doctor.name} ${doctor.surname}`,
        specialty: doctor.specialty,
        scheduledAt: appointment.scheduledAt,
        status: 'pending'
      }
    }, `Appointment confirmed with Dr. ${doctor.surname}!`);
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

module.exports = router;
