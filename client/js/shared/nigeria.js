export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
  'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
  'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe', 'Imo', 'Jigawa',
  'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

export const NIGERIAN_PHONE_REGEX = /^(\+234|0)[789][01]\d{8}$/;

export const TESTIMONIALS = [
  {
    name: 'Chidinma Okafor', state: 'Enugu State',
    text: 'I got diagnosed and treated for malaria without leaving my house. The doctor was thorough and explained everything in plain English. Virtualcare is a blessing for us in Nigeria!',
    initials: 'CO'
  },
  {
    name: 'Musa Aliyu', state: 'Kaduna State',
    text: 'I used to travel from Kaduna to Abuja just to see a specialist. Now I consult every month from home. The Paystack payment is very seamless and the 25% discount keeps me coming back.',
    initials: 'MA'
  },
  {
    name: 'Tolani Bello', state: 'Lagos Island',
    text: 'Dr. Nwosu resolved my skin condition after months of suffering. The video call quality was excellent and the whole process took less than an hour. Truly world-class service in Nigeria!',
    initials: 'TB'
  }
];

export function validateNigerianPhone(phone) {
  return NIGERIAN_PHONE_REGEX.test(String(phone || '').replace(/\s/g, ''));
}

export function formatNigerianPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  const local = digits.startsWith('234') ? '0' + digits.slice(3) : digits;
  if (local.length !== 11) return phone;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

export function whatsappReminderLink(appointment) {
  const msg = encodeURIComponent(
    `Hello! This is a reminder for my Virtualcare Nigeria consultation:\n\n` +
    `Doctor: ${appointment.doctorName}\n` +
    `Specialty: ${appointment.specialty}\n` +
    `Date: ${appointment.dateStr}\n` +
    `Time: ${appointment.timeStr}\n` +
    `Type: ${appointment.sessionType}\n\n` +
    `Log in at virtualcare.ng to join your session.`
  );
  return `https://wa.me/?text=${msg}`;
}
