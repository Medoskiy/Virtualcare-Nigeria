const express = require('express');
const rateLimit = require('express-rate-limit');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const MedicalRecord = require('../models/MedicalRecord');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const { getNextAvailableDoctor } = require('../services/rotationService');
const { sendSuccess, sendError } = require('../utils/response');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const {
      specialty, state, availability, minRating,
      maxPrice, sort, search, page = 1, limit = 12, status
    } = req.query;

    const query = { isApproved: true };

    if (specialty && specialty !== 'All' && specialty !== 'all') {
      query.specialty = new RegExp(`^${specialty}$`, 'i');
    }
    if (state && state !== 'All States') query.stateOfPractice = state;
    if (availability) {
      const statuses = availability.split(',').map((s) => s.trim());
      query.availabilityStatus = statuses.length > 1 ? { $in: statuses } : statuses[0];
    }
    if (status === 'available') query.availabilityStatus = 'green';
    if (minRating) query.rating = { $gte: parseFloat(minRating) };
    if (maxPrice) query.pricePerSession = { $lte: parseInt(maxPrice, 10) };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { surname: { $regex: search, $options: 'i' } },
        { specialty: { $regex: search, $options: 'i' } },
        { hospitalAffiliation: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {
      rating: { rating: -1 },
      price: { pricePerSession: 1 },
      price_low: { pricePerSession: 1 },
      price_high: { pricePerSession: -1 },
      availability: { availabilityStatus: 1 },
      experience: { yearsOfExperience: -1 },
      consultations: { totalConsultations: -1 }
    };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, parseInt(limit, 10) || 12);
    const skip = (pageNum - 1) * limitNum;

    const [doctors, total] = await Promise.all([
      Doctor.find(query)
        .sort(sortOptions[sort] || { rating: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('-password'),
      Doctor.countDocuments(query)
    ]);

    return sendSuccess(res, {
      doctors,
      count: doctors.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

router.get('/next-available/:specialty', async (req, res) => {
  try {
    const doctor = await getNextAvailableDoctor(req.params.specialty);
    if (!doctor) return sendError(res, 'No available doctors in this specialty', 404);
    return sendSuccess(res, { doctor });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

router.get('/:id/slots', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return sendError(res, 'Date required (YYYY-MM-DD)', 400);

    const doctor = await Doctor.findOne({ _id: req.params.id, isApproved: true });
    if (!doctor) return sendError(res, 'Doctor not found', 404);

    const dayName = new Date(`${date}T12:00:00+01:00`).toLocaleDateString('en-NG', {
      weekday: 'long',
      timeZone: 'Africa/Lagos'
    });

    const daySchedule = (doctor.schedule || []).find((s) => s.day === dayName);

    const startOfDay = new Date(`${date}T00:00:00+01:00`);
    const endOfDay = new Date(`${date}T23:59:59+01:00`);

    const existingBookings = await Appointment.find({
      doctor: req.params.id,
      scheduledAt: { $gte: startOfDay, $lt: endOfDay },
      status: { $in: ['pending', 'confirmed', 'active'] }
    });

    const bookedTimes = existingBookings.map((b) =>
      new Date(b.scheduledAt).toLocaleTimeString('en-NG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Africa/Lagos'
      }).slice(0, 5)
    );

    let slots = (daySchedule?.slots || []).map((slot) => ({
      time: slot.startTime,
      available: !bookedTimes.includes(slot.startTime) && !slot.isBooked
    }));

    if (slots.length === 0) {
      const defaultTimes = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
      slots = defaultTimes.map((time) => ({
        time,
        available: !bookedTimes.includes(time)
      }));
    }

    return sendSuccess(res, { slots, dayName });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

router.get('/:id/availability', async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ _id: req.params.id, isApproved: true }).select('schedule');
    if (!doctor) return sendError(res, 'Doctor not found', 404);
    const slots = [];
    (doctor.schedule || []).forEach((day) => {
      (day.slots || []).forEach((slot) => {
        if (!slot.isBooked) slots.push({ day: day.day, ...slot });
      });
    });
    return sendSuccess(res, { schedule: doctor.schedule, availableSlots: slots });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

router.get('/:id/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ doctor: req.params.id })
      .populate('patient', 'name surname state')
      .sort({ createdAt: -1 });
    const doctor = await Doctor.findById(req.params.id).select('rating reviewCount');
    return sendSuccess(res, { reviews, rating: doctor?.rating || 0, reviewCount: doctor?.reviewCount || 0 });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

router.use(auth);

router.get('/records/list', requireRole('doctor'), async (req, res) => {
  const records = await MedicalRecord.find({ sharedWith: req.doctor._id })
    .populate('patient', 'name surname');
  return sendSuccess(res, { records });
});

router.put('/profile', requireRole('doctor'), async (req, res) => {
  try {
    const allowedFields = [
      'name', 'surname', 'email', 'mobileNo',
      'specialty', 'yearsOfExperience',
      'stateOfPractice', 'hospitalAffiliation',
      'bio', 'availabilityStatus', 'languages',
      'avatar'
      // pricePerSession — admin only via PUT /admin/doctors/:id/price
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        req.doctor[field] = req.body[field];
      }
    });

    await req.doctor.save();
    return sendSuccess(res, { doctor: req.doctor }, 'Profile updated successfully');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

router.put('/credentials', requireRole('doctor'), async (req, res) => {
  try {
    req.doctor.credentials = { ...req.doctor.credentials?.toObject?.() || req.doctor.credentials, ...req.body };
    await req.doctor.save();
    return sendSuccess(res, { credentials: req.doctor.credentials }, 'Credentials updated');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

router.put('/settings', requireRole('doctor'), async (req, res) => {
  try {
    req.doctor.settings = { ...req.doctor.settings?.toObject?.() || req.doctor.settings, ...req.body };
    await req.doctor.save();
    return sendSuccess(res, { settings: req.doctor.settings }, 'Settings saved');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

router.put('/availability', requireRole('doctor'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['green', 'amber', 'red'].includes(status)) return sendError(res, 'Invalid status');
    req.doctor.availabilityStatus = status;
    await req.doctor.save();
    const io = req.app.get('io');
    if (io) io.emit('doctor:status-update', { doctorId: req.doctor._id, status });
    return sendSuccess(res, { availabilityStatus: status });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

router.put('/schedule', requireRole('doctor'), async (req, res) => {
  try {
    req.doctor.schedule = req.body.schedule || [];
    await req.doctor.save();
    return sendSuccess(res, { schedule: req.doctor.schedule }, 'Schedule updated');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

router.get('/patients', requireRole('doctor'), async (req, res) => {
  const appointments = await Appointment.find({ doctor: req.doctor._id })
    .populate('patient', 'name surname email avatar consultationCount medicalHistoryNotes state')
    .sort({ scheduledAt: -1 });
  const patientMap = new Map();
  appointments.forEach((a) => {
    if (a.patient) {
      patientMap.set(a.patient._id.toString(), {
        ...a.patient.toObject(),
        lastVisit: a.scheduledAt,
        condition: a.notes || 'General consultation'
      });
    }
  });
  return sendSuccess(res, { patients: [...patientMap.values()] });
});

router.get('/earnings', requireRole('doctor'), async (req, res) => {
  const payments = await Payment.find({ doctor: req.doctor._id, status: 'completed' });
  const total = payments.reduce((sum, p) => sum + p.doctorEarning, 0);
  return sendSuccess(res, { totalEarnings: total, totalConsultations: req.doctor.totalConsultations, payments });
});

router.get('/earnings/monthly', requireRole('doctor'), async (req, res) => {
  const months = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

    const result = await Payment.aggregate([
      {
        $match: {
          doctor: req.doctor._id,
          status: 'completed',
          createdAt: { $gte: start, $lte: end }
        }
      },
      { $group: { _id: null, total: { $sum: '$doctorEarning' } } }
    ]);

    months.push({
      month: date.toLocaleDateString('en-NG', { month: 'short', timeZone: 'Africa/Lagos' }),
      amount: result[0]?.total || 0
    });
  }
  return sendSuccess(res, months);
});

router.get('/upcoming', requireRole('doctor'), async (req, res) => {
  const appointments = await Appointment.find({
    doctor: req.doctor._id,
    scheduledAt: { $gte: new Date(Date.now() - 3600000) },
    status: { $in: ['pending', 'confirmed', 'active'] }
  }).populate('patient', 'name surname avatar').sort({ scheduledAt: 1 });
  return sendSuccess(res, { appointments });
});

router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ _id: req.params.id, isApproved: true }).select('-password');
    if (!doctor) return sendError(res, 'Doctor not found', 404);
    return sendSuccess(res, { doctor });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

module.exports = router;
