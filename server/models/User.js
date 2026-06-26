const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  surname: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, default: 'patient', enum: ['patient', 'admin'] },
  googleId: { type: String, sparse: true },
  facebookId: { type: String, sparse: true },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'facebook'],
    default: 'local'
  },
  avatar: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  dateOfBirth: { type: Date },
  phone: { type: String, default: '' },
  state: { type: String, default: '' },
  medicalHistoryNotes: { type: String, default: '' },
  isReturningPatient: { type: Boolean, default: false },
  consultationCount: { type: Number, default: 0 },
  priorityBooking: { type: Boolean, default: false },
  priorityReason: { type: String, default: '' },
  prioritySetAt: { type: Date },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
