const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  specialty: { type: String, required: true },
  sessionType: { type: String, enum: ['video', 'audio'], default: 'video' },
  scheduledAt: { type: Date, required: true },
  durationMinutes: { type: Number, default: 50 },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  videoRoomUrl: { type: String, default: '' },
  videoRoom: { type: mongoose.Schema.Types.Mixed, default: null },
  completedAt: { type: Date },
  notes: { type: String, default: '' },
  isReturnVisit: { type: Boolean, default: false },
  discountApplied: { type: Number, default: 0 },
  sessionStartedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
