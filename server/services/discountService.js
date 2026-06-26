const RETURNING_DISCOUNT_PERCENT = 25;

function calculateDiscount(patient, grossAmount) {
  const isReturning = patient.consultationCount > 0;
  if (!isReturning) {
    return {
      isReturning: false,
      discountPercent: 0,
      discountAmount: 0,
      finalAmount: grossAmount
    };
  }

  const discountAmount = Math.round(grossAmount * (RETURNING_DISCOUNT_PERCENT / 100) * 100) / 100;
  const finalAmount = Math.round((grossAmount - discountAmount) * 100) / 100;

  return {
    isReturning: true,
    discountPercent: RETURNING_DISCOUNT_PERCENT,
    discountAmount,
    finalAmount
  };
}

function calculateSplit(finalAmount) {
  const platformPercent = Number(process.env.PLATFORM_FEE_PERCENT || process.env.STRIPE_PLATFORM_FEE_PERCENT) || 30;
  const doctorPercent = 100 - platformPercent;
  const platformFee = Math.round(finalAmount * (platformPercent / 100) * 100) / 100;
  const doctorEarning = Math.round((finalAmount - platformFee) * 100) / 100;
  return { platformFee, doctorEarning, platformPercent, doctorPercent };
}

module.exports = { calculateDiscount, calculateSplit, RETURNING_DISCOUNT_PERCENT };
