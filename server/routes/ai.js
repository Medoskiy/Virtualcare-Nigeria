const express = require('express');
const rateLimit = require('express-rate-limit');
const OpenAI = require('openai');
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

    if (!process.env.OPENAI_API_KEY) {
      const mock = respondWithMock();
      const priority = await handlePriorityBooking(mock.reply, req, patient);
      if (priority) {
        return sendSuccess(res, { ...priority, isDemo: true });
      }
      return sendSuccess(res, mock);
    }

    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages,
        max_tokens: 400,
        temperature: 0.75
      });

      const reply = completion.choices[0]?.message?.content || 'I could not generate a response.';
      const priority = await handlePriorityBooking(reply, req, patient);
      if (priority) {
        return sendSuccess(res, priority);
      }
      return sendSuccess(res, { reply });
    } catch (error) {
      console.error('VirtualAI error:', error.message);
      const mock = respondWithMock();
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

module.exports = router;
