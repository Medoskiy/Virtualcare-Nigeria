const crypto = require('crypto');

const TERMII_API_KEY = process.env.TERMII_API_KEY;
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID || 'N-Alert';
const TERMII_BASE_URL = process.env.TERMII_BASE_URL || 'https://v3.api.termii.com';

// In-memory OTP store (use Redis in production)
const otpStore = new Map();

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

function formatNigerianPhone(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return '234' + cleaned.slice(1);
  }
  if (cleaned.startsWith('234') && cleaned.length === 13) {
    return cleaned;
  }
  if (cleaned.length === 10) {
    return '234' + cleaned;
  }
  return cleaned;
}

async function sendSMS(phone, message) {
  if (!TERMII_API_KEY) {
    console.warn('Termii API key not set — SMS not sent:', message);
    return { success: false, mock: true };
  }

  const formattedPhone = formatNigerianPhone(phone);
  if (!formattedPhone) {
    return { success: false, error: 'Invalid phone number' };
  }

  try {
    const response = await fetch(`${TERMII_BASE_URL}/api/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: formattedPhone,
        from: TERMII_SENDER_ID,
        sms: message,
        type: 'plain',
        channel: 'generic',
        api_key: TERMII_API_KEY
      })
    });

    const result = await response.json();
    if (result.code === 'ok' || result.message_id) {
      console.log(`SMS sent to ${formattedPhone}`);
      return { success: true, messageId: result.message_id };
    } else {
      console.error('Termii SMS failed:', result);
      return { success: false, error: result.message || 'SMS failed' };
    }
  } catch (err) {
    console.error('Termii SMS error:', err.message);
    return { success: false, error: err.message };
  }
}

async function sendOTP(phone, purpose = 'verification') {
  const formattedPhone = formatNigerianPhone(phone);
  if (!formattedPhone) {
    return { success: false, error: 'Invalid phone number' };
  }

  if (!TERMII_API_KEY) {
    const otp = generateOTP();
    otpStore.set(formattedPhone, {
      otp,
      purpose,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0
    });
    console.log(`[DEMO] OTP for ${formattedPhone}: ${otp}`);
    return { success: true, mock: true, otp };
  }

  try {
    const response = await fetch(`${TERMII_BASE_URL}/api/sms/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TERMII_API_KEY,
        message_type: 'NUMERIC',
        to: formattedPhone,
        from: TERMII_SENDER_ID,
        channel: 'generic',
        pin_attempts: 3,
        pin_time_to_live: 10,
        pin_length: 6,
        pin_placeholder: '< 1234 >',
        message_text: 'Your Virtualcare Nigeria OTP is < 1234 >. Valid for 10 minutes. Do not share.',
        pin_type: 'NUMERIC'
      })
    });

    const result = await response.json();
    console.log('Termii Token API response:', JSON.stringify(result));

    if (result.pinId || result.pin_id) {
      // Store pinId for verification
      otpStore.set(formattedPhone, {
        pinId: result.pinId || result.pin_id,
        purpose,
        expiresAt: Date.now() + 10 * 60 * 1000,
        attempts: 0,
        useTermiiVerify: true
      });
      return { success: true };
    } else {
      console.error('Termii Token API failed:', result);
      return { success: false, error: result.message || 'OTP send failed' };
    }
  } catch (err) {
    console.error('Termii OTP error:', err.message);
    return { success: false, error: err.message };
  }
}

async function verifyOTP(phone, otp) {
  const formattedPhone = formatNigerianPhone(phone);
  const stored = otpStore.get(formattedPhone);

  if (!stored) {
    return { valid: false, reason: 'OTP not found or expired' };
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(formattedPhone);
    return { valid: false, reason: 'OTP expired' };
  }

  // Use Termii's verify API if pinId exists
  if (stored.useTermiiVerify && stored.pinId) {
    try {
      const response = await fetch(`${TERMII_BASE_URL}/api/sms/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: TERMII_API_KEY,
          pin_id: stored.pinId,
          pin: otp.toString()
        })
      });

      const result = await response.json();
      console.log('Termii verify response:', JSON.stringify(result));

      if (result.verified === true || result.verified === 'True') {
        otpStore.delete(formattedPhone);
        return { valid: true };
      } else {
        return { valid: false, reason: result.message || 'Invalid OTP' };
      }
    } catch (err) {
      console.error('Termii verify error:', err.message);
      return { valid: false, reason: 'Verification failed' };
    }
  }

  // Fallback local verification
  stored.attempts += 1;
  if (stored.attempts > 3) {
    otpStore.delete(formattedPhone);
    return { valid: false, reason: 'Too many attempts' };
  }

  if (stored.otp !== otp.toString()) {
    return { valid: false, reason: 'Invalid OTP' };
  }

  otpStore.delete(formattedPhone);
  return { valid: true };
}

async function sendAppointmentReminderSMS(phone, patientName, doctorName, scheduledAt) {
  const date = new Date(scheduledAt).toLocaleDateString('en-NG', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Africa/Lagos'
  });
  const time = new Date(scheduledAt).toLocaleTimeString('en-NG', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos'
  });

  const message = `Hi ${patientName}, reminder: Your Virtualcare consultation with Dr. ${doctorName} is tomorrow ${date} at ${time} WAT. Visit virtualcare.me to join. Reply STOP to opt out.`;
  return sendSMS(phone, message);
}

async function sendPaymentConfirmationSMS(phone, patientName, amount, doctorName) {
  const message = `Hi ${patientName}, payment of NGN ${Number(amount).toLocaleString('en-NG')} confirmed for your Virtualcare consultation with Dr. ${doctorName}. Check your email for details.`;
  return sendSMS(phone, message);
}

async function sendDoctorApprovalSMS(phone, doctorName) {
  const message = `Congratulations Dr. ${doctorName}! Your Virtualcare Nigeria account has been approved. Login at virtualcare.me to start receiving patients.`;
  return sendSMS(phone, message);
}

module.exports = {
  sendOTP,
  verifyOTP,
  sendSMS,
  sendAppointmentReminderSMS,
  sendPaymentConfirmationSMS,
  sendDoctorApprovalSMS,
  formatNigerianPhone
};
