const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const { sendOTP, verifyOTP } = require('../services/smsService');
const { sendSuccess, sendError } = require('../utils/response');

// Send OTP to phone number
router.post('/send', auth, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return sendError(res, 'Phone number required', 400);

    const result = await sendOTP(phone, 'registration');

    if (!result.success) {
      return sendError(res, result.error || 'Failed to send OTP', 500);
    }

    const response = { message: 'OTP sent successfully' };
    if (result.mock) response.demoOtp = result.otp; // Only in demo mode

    sendSuccess(res, response, 'OTP sent to your phone number');
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

// Verify OTP
router.post('/verify', auth, async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return sendError(res, 'Phone and OTP required', 400);

    const result = verifyOTP(phone, otp);

    if (!result.valid) {
      return sendError(res, result.reason || 'Invalid OTP', 400);
    }

    // Mark phone as verified on user
    await User.findByIdAndUpdate(req.user._id, {
      phone,
      phoneVerified: true
    });

    sendSuccess(res, { phoneVerified: true }, 'Phone number verified successfully');
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

module.exports = router;
