const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const passport = require('../config/passport');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const auth = require('../middleware/auth');
const { NIGERIAN_STATES, SPECIALTY_PRICES, NIGERIAN_PHONE_REGEX } = require('../config/nigeria');
const { notifyDoctorApplicationReceived, notifyWelcomePatient } = require('../services/notificationService');
const { sendPatientWelcomeEmail, sendDoctorWelcomeEmail } = require('../services/emailService');
const { sendOTP } = require('../services/smsService');
const { validatePatientRegister, validateDoctorRegister } = require('../middleware/sanitise');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many attempts. Please wait 15 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false
});

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const generateTokenAndRedirect = (user, res) => {
  const token = signToken(user._id);

  const userData = JSON.stringify({
    _id: user._id,
    name: user.name,
    surname: user.surname,
    email: user.email,
    role: user.role,
    avatar: user.avatar || null,
    isNewUser: user.isNewUser || false
  });

  const redirectPath = user.role === 'doctor'
    ? '/doctor/dashboard'
    : '/patient/dashboard';

  const clientUrl = process.env.CLIENT_URL || `http://localhost:${process.env.PORT || 3001}`;

  res.redirect(
    `${clientUrl}/#/oauth-callback` +
    `?token=${token}` +
    `&user=${encodeURIComponent(userData)}` +
    `&redirect=${encodeURIComponent(redirectPath)}`
  );
};

router.post('/register/patient', authLimiter, validatePatientRegister, async (req, res) => {
  try {
    const { username, name, surname, email, password, phone, dateOfBirth, state } = req.body;
    if (phone && !NIGERIAN_PHONE_REGEX.test(phone.replace(/\s/g, ''))) {
      return res.status(400).json({ success: false, message: 'Enter a valid Nigerian phone number (e.g. 0801 234 5678)' });
    }
    if (state && !NIGERIAN_STATES.includes(state)) {
      return res.status(400).json({ success: false, message: 'Select a valid Nigerian state' });
    }

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Email or username already registered' });
    }

    const user = await User.create({ username, name, surname, email, password, phone, dateOfBirth, state });
    try { await sendPatientWelcomeEmail(user); } catch (e) { console.error('Welcome email failed:', e.message); }
    try {
      if (user.phone) await sendOTP(user.phone, 'registration');
    } catch (e) { console.error('OTP send failed:', e.message); }
    const token = signToken(user._id);
    notifyWelcomePatient(user).catch(() => {});

    req.io?.emit('patient:registered', {
      name: `${user.name} ${user.surname}`,
      state: user.state || 'Lagos'
    });

    res.status(201).json({
      success: true,
      message: 'Welcome to Virtualcare Nigeria!',
      data: { user, token }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/register/doctor', authLimiter, validateDoctorRegister, async (req, res) => {
  try {
    const {
      username, name, surname, email, password, specialty,
      mdcnNumber, mdcnRegistrationYear, stateOfPractice, mobileNo,
      yearsOfExperience, bio, hospitalAffiliation, fellowship, pricePerSession
    } = req.body;

    if (mobileNo && !NIGERIAN_PHONE_REGEX.test(mobileNo.replace(/\s/g, ''))) {
      return res.status(400).json({ success: false, message: 'Enter a valid Nigerian phone number (e.g. 0801 234 5678)' });
    }

    const exists = await Doctor.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Email or username already registered' });
    }

    const doctor = await Doctor.create({
      username, name, surname, email, password, specialty,
      mdcnNumber, mdcnRegistrationYear: mdcnRegistrationYear ? Number(mdcnRegistrationYear) : undefined,
      stateOfPractice, mobileNo, yearsOfExperience, bio, hospitalAffiliation, fellowship,
      pricePerSession: pricePerSession || SPECIALTY_PRICES[specialty] || 5000,
      isApproved: false, isVerified: false
    });
    try { await sendDoctorWelcomeEmail(doctor); } catch (e) { console.error('Doctor welcome email failed:', e.message); }
    try {
      if (doctor.mobileNo) await sendOTP(doctor.mobileNo, 'registration');
    } catch (e) { console.error('OTP send failed:', e.message); }
    await notifyDoctorApplicationReceived(doctor);
    const token = signToken(doctor._id);

    req.io?.emit('doctor:registered', {
      name: `${doctor.name} ${doctor.surname}`,
      specialty: doctor.specialty
    });

    res.status(201).json({
      success: true,
      message: 'Doctor registered — pending MDCN verification and admin approval',
      data: { user: doctor, token }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    let user;
    let resolvedRole = role;
    if (role === 'doctor') {
      user = await Doctor.findOne({ email });
    } else if (role === 'admin') {
      user = await User.findOne({ email, role: 'admin' });
      resolvedRole = 'admin';
    } else {
      user = await User.findOne({ email, role: { $ne: 'admin' } });
      resolvedRole = 'patient';
    }

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'Account suspended' });
    }

    const token = signToken(user._id);
    res.json({
      success: true,
      message: 'Login successful',
      data: { user, token, role: resolvedRole || user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/logout', auth, (_req, res) => {
  res.json({ success: true, message: 'Logged out successfully', data: {} });
});

router.get('/me', auth, (req, res) => {
  res.json({ success: true, data: { user: req.user, role: req.userRole } });
});

router.post('/refresh', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    const expiryBuffer = 7 * 24 * 60 * 60;
    if (Date.now() / 1000 - decoded.exp > expiryBuffer) {
      return res.status(401).json({ success: false, message: 'Session too old. Please log in again.' });
    }

    const newToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({ success: true, data: { token: newToken } });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

router.get('/google/callback',
  (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  },
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3001'}/#/login?error=google_failed`,
    session: false
  }),
  (req, res) => {
    if (req.user?.isNewUser) {
      req.io?.emit('patient:registered', {
        name: `${req.user.name} ${req.user.surname}`,
        state: req.user.state || 'Lagos'
      });
    }
    generateTokenAndRedirect(req.user, res);
  }
);

router.get('/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

router.get('/facebook/callback',
  (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  },
  passport.authenticate('facebook', {
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3001'}/#/login?error=facebook_failed`,
    session: false
  }),
  (req, res) => {
    if (req.user?.isNewUser) {
      req.io?.emit('patient:registered', {
        name: `${req.user.name} ${req.user.surname}`,
        state: req.user.state || 'Lagos'
      });
    }
    generateTokenAndRedirect(req.user, res);
  }
);

module.exports = router;
