const { calculateSplit } = require('./discountService');

const BASE_URL = 'https://api.paystack.co';

function headers() {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  };
}

function isPaystackConfigured() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

async function initializePayment({ email, amount, metadata = {} }) {
  if (!isPaystackConfigured()) {
    const ref = `vc_mock_${Date.now()}`;
    return {
      status: true,
      mock: true,
      data: {
        reference: ref,
        authorization_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/#/payment/verify?reference=${ref}`,
        access_code: ref
      }
    };
  }

  const response = await fetch(`${BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100),
      currency: 'NGN',
      metadata,
      callback_url: `${process.env.CLIENT_URL}/#/payment/verify`
    })
  });
  const result = await response.json();
  if (!result.status) throw new Error(result.message || 'Paystack initialization failed');
  return result;
}

async function verifyPayment(reference) {
  if (!isPaystackConfigured()) {
    return {
      status: true,
      mock: true,
      data: { status: 'success', reference, amount: 0, metadata: {} }
    };
  }
  const response = await fetch(`${BASE_URL}/transaction/verify/${reference}`, { headers: headers() });
  return response.json();
}

async function listBanks() {
  if (!isPaystackConfigured()) {
    return { status: true, data: [{ name: 'Access Bank', code: '044' }, { name: 'GTBank', code: '058' }, { name: 'First Bank', code: '011' }] };
  }
  const response = await fetch(`${BASE_URL}/bank?currency=NGN&country=nigeria`, { headers: headers() });
  return response.json();
}

async function createTransferRecipient({ name, accountNumber, bankCode }) {
  if (!isPaystackConfigured()) return { status: true, data: { recipient_code: `RCP_mock_${Date.now()}` } };
  const response = await fetch(`${BASE_URL}/transferrecipient`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      type: 'nuban',
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'NGN'
    })
  });
  return response.json();
}

async function transferToDoctorAccount({ amount, recipientCode, reason }) {
  if (!isPaystackConfigured()) {
    console.log(`Mock Paystack transfer: ₦${amount} to ${recipientCode}`);
    return { status: true, mock: true };
  }
  const response = await fetch(`${BASE_URL}/transfer`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      source: 'balance',
      amount: Math.round(amount * 100),
      recipient: recipientCode,
      reason
    })
  });
  return response.json();
}

function buildPaymentRecord({ patient, doctor, appointment, grossAmount, discount }) {
  const { platformFee, doctorEarning } = calculateSplit(discount.finalAmount);
  return {
    patient: patient._id,
    doctor: doctor._id,
    appointment: appointment._id,
    grossAmount,
    platformFee,
    doctorEarning,
    discountAmount: discount.discountAmount,
    finalAmount: discount.finalAmount,
    currency: 'NGN'
  };
}

module.exports = {
  isPaystackConfigured,
  initializePayment,
  verifyPayment,
  listBanks,
  createTransferRecipient,
  transferToDoctorAccount,
  buildPaymentRecord
};
