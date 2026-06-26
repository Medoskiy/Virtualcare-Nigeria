const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true },
  userRole: { type: String, enum: ['patient', 'doctor', 'admin'], required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, default: '' },
  link: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
