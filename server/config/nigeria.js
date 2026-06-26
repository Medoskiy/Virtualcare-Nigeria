const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
  'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
  'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe', 'Imo', 'Jigawa',
  'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

const SPECIALTY_PRICES = {
  'General Practice': 5000,
  'Cardiology': 15000,
  'Dermatology': 10000,
  'Psychiatry': 12000,
  'Pediatrics': 8000,
  'Neurology': 18000,
  'Orthopedics': 14000,
  'Gynecology': 10000,
  'Ophthalmology': 9000,
  'ENT': 9000,
  'Endocrinology': 13000,
  'Gastroenterology': 13000,
  'Pulmonology': 12000,
  'Urology': 12000,
  'Oncology': 20000,
  'Rheumatology': 11000,
  'Nephrology': 14000,
  'Hematology': 13000,
  'Infectious Disease': 12000
};

const NIGERIAN_PHONE_REGEX = /^(\+234|0)[789][01]\d{8}$/;

const MDCN_REGEX = /^MDN\/[A-Z]+\/\d{4}\/\d+$/;

module.exports = { NIGERIAN_STATES, SPECIALTY_PRICES, NIGERIAN_PHONE_REGEX, MDCN_REGEX };
