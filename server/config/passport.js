const crypto = require('crypto');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');
const Doctor = require('../models/Doctor');

const port = Number(process.env.PORT) || 3001;
const devBaseUrl = `http://localhost:${port}`;

async function generateUsername(email, fallback = 'user') {
  const base = (email?.split('@')[0] || fallback)
    .replace(/[^a-z0-9_]/gi, '')
    .toLowerCase() || fallback;
  let username = base;
  let suffix = 0;
  while (await User.findOne({ username }) || await Doctor.findOne({ username })) {
    suffix += 1;
    username = `${base}${suffix}`;
  }
  return username;
}

function oauthCallbackUrl(path) {
  if (process.env.NODE_ENV === 'production') {
    return `https://virtualcare.ng/api/auth${path}`;
  }
  return `${devBaseUrl}/api/auth${path}`;
}

function attachRole(user, role, extras = {}) {
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  return { ...obj, role, ...extras };
}

passport.serializeUser((user, done) => {
  done(null, { id: user._id, role: user.role });
});

passport.deserializeUser(async ({ id, role }, done) => {
  try {
    const Model = role === 'doctor' ? Doctor : User;
    const user = await Model.findById(id).select('-password');
    done(null, user);
  } catch (err) {
    done(err);
  }
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: oauthCallbackUrl('/google/callback'),
  scope: ['profile', 'email']
}, async (_accessToken, _refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value?.toLowerCase();
    if (!email) {
      return done(new Error('Google account has no email address'));
    }

    const name = profile.name?.givenName ||
      profile.displayName?.split(' ')[0] || 'User';
    const surname = profile.name?.familyName ||
      profile.displayName?.split(' ').slice(1).join(' ') || '';
    const avatar = profile.photos?.[0]?.value || '';

    let patient = await User.findOne({
      role: { $ne: 'admin' },
      $or: [{ googleId: profile.id }, { email }]
    });

    if (patient) {
      if (!patient.googleId) {
        patient.googleId = profile.id;
        patient.authProvider = patient.authProvider || 'google';
        if (avatar && !patient.avatar) patient.avatar = avatar;
        await patient.save();
      }
      return done(null, attachRole(patient, 'patient'));
    }

    const doctor = await Doctor.findOne({
      $or: [{ googleId: profile.id }, { email }]
    });

    if (doctor) {
      if (!doctor.googleId) {
        doctor.googleId = profile.id;
        doctor.authProvider = doctor.authProvider || 'google';
        if (avatar && !doctor.avatar) doctor.avatar = avatar;
        await doctor.save();
      }
      return done(null, attachRole(doctor, 'doctor'));
    }

    const username = await generateUsername(email, `google_${profile.id.slice(0, 8)}`);
    const newPatient = await User.create({
      username,
      name,
      surname,
      email,
      googleId: profile.id,
      avatar,
      isVerified: true,
      authProvider: 'google',
      state: 'Lagos',
      phone: '',
      password: crypto.randomBytes(32).toString('hex')
    });

    return done(null, attachRole(newPatient, 'patient', { isNewUser: true }));
  } catch (err) {
    return done(err);
  }
}));

passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: oauthCallbackUrl('/facebook/callback'),
  profileFields: ['id', 'emails', 'name', 'picture']
}, async (_accessToken, _refreshToken, profile, done) => {
  try {
    const email = (profile.emails?.[0]?.value || `fb_${profile.id}@virtualcare.ng`).toLowerCase();
    const name = profile.name?.givenName ||
      profile.displayName?.split(' ')[0] || 'User';
    const surname = profile.name?.familyName ||
      profile.displayName?.split(' ').slice(1).join(' ') || '';
    const avatar = profile.photos?.[0]?.value || profile.picture?.data?.url || '';

    let patient = await User.findOne({
      role: { $ne: 'admin' },
      $or: [{ facebookId: profile.id }, { email }]
    });

    if (patient) {
      if (!patient.facebookId) {
        patient.facebookId = profile.id;
        patient.authProvider = patient.authProvider || 'facebook';
        if (avatar && !patient.avatar) patient.avatar = avatar;
        await patient.save();
      }
      return done(null, attachRole(patient, 'patient'));
    }

    const doctor = await Doctor.findOne({
      $or: [{ facebookId: profile.id }, { email }]
    });

    if (doctor) {
      if (!doctor.facebookId) {
        doctor.facebookId = profile.id;
        doctor.authProvider = doctor.authProvider || 'facebook';
        if (avatar && !doctor.avatar) doctor.avatar = avatar;
        await doctor.save();
      }
      return done(null, attachRole(doctor, 'doctor'));
    }

    const username = await generateUsername(email, `fb_${profile.id.slice(0, 8)}`);
    const newPatient = await User.create({
      username,
      name,
      surname,
      email,
      facebookId: profile.id,
      avatar,
      isVerified: true,
      authProvider: 'facebook',
      state: 'Lagos',
      phone: '',
      password: crypto.randomBytes(32).toString('hex')
    });

    return done(null, attachRole(newPatient, 'patient', { isNewUser: true }));
  } catch (err) {
    return done(err);
  }
}));

module.exports = passport;
