const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MDCN_REGEX } = require('../config/nigeria');

const slotSchema = new mongoose.Schema({
  startTime: String,
  endTime: String,
  isBooked: { type: Boolean, default: false }
}, { _id: false });

const scheduleSchema = new mongoose.Schema({
  day: String,
  slots: [slotSchema]
}, { _id: false });

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  surname: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, default: 'doctor' },
  googleId: { type: String, sparse: true },
  facebookId: { type: String, sparse: true },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'facebook'],
    default: 'local'
  },
  specialty: { type: String, required: true, trim: true },
  yearsOfExperience: { type: Number, default: 0 },
  mobileNo: { type: String, default: '' },
  mdcnNumber: {
    type: String,
    default: '',
    validate: {
      validator(v) { return !v || MDCN_REGEX.test(v); },
      message: 'Enter a valid MDCN registration number (e.g. MDN/FMC/2019/12345)'
    }
  },
  mdcnRegistrationYear: { type: Number },
  licenseNumber: { type: String, default: '' },
  stateOfPractice: { type: String, default: '' },
  hospitalAffiliation: { type: String, default: '' },
  languages: { type: [String], default: ['English'] },
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  availabilityStatus: { type: String, enum: ['green', 'amber', 'red'], default: 'red' },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  totalConsultations: { type: Number, default: 0 },
  pricePerSession: { type: Number, default: 5000 },
  paystackRecipientCode: { type: String, default: '' },
  bankName: { type: String, default: '' },
  bankCode: { type: String, default: '' },
  accountNumber: { type: String, default: '' },
  accountName: { type: String, default: '' },
  bvn: { type: String, default: '' },
  schedule: [scheduleSchema],
  lastSessionAt: { type: Date },
  ribbonBadge: { type: String, default: '' },
  tags: [String],
  credentials: {
    education: [{ year: String, degree: String, institution: String }],
    certifications: [{ name: String, year: String, status: String }],
    skills: [String],
    publications: [{ title: String, journal: String, year: String, citations: Number }]
  },
  settings: {
    bufferMinutes: { type: Number, default: 10 },
    maxDailyAppointments: { type: Number, default: 8 },
    bookingWindowDays: { type: Number, default: 7 },
    notifications: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  createdAt: { type: Date, default: Date.now }
});

doctorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

doctorSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

doctorSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.bvn;
  return obj;
};

module.exports = mongoose.model('Doctor', doctorSchema);
