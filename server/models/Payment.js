const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  grossAmount: { type: Number, required: true },
  platformFee: { type: Number, required: true },
  doctorEarning: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true },
  currency: { type: String, default: 'NGN' },
  paystackReference: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'completed', 'refunded'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
