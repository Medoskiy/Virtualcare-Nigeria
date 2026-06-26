const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  name: String,
  dosage: String,
  frequency: String,
  duration: String,
  refillsAllowed: { type: Number, default: 0 }
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  medications: [medicationSchema],
  notes: { type: String, default: '' },
  issuedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
