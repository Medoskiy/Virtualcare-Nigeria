const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  name: String,
  url: String,
  type: String
}, { _id: false });

const messageSchema = new mongoose.Schema({
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, required: true },
  senderRole: { type: String, enum: ['patient', 'doctor'], required: true },
  content: { type: String, required: true },
  attachments: [attachmentSchema],
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
