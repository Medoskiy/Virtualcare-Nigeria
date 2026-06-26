const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const Message = require('../models/Message');
const Prescription = require('../models/Prescription');
const Review = require('../models/Review');
const MedicalRecord = require('../models/MedicalRecord');
const Notification = require('../models/Notification');
const { calculateDiscount, calculateSplit } = require('../services/discountService');

const DEMO_DOCTORS = [
  {
    name: 'Chukwuemeka', surname: 'Okonkwo', username: 'dr.okonkwo', email: 'doctor@virtualcare.com',
    password: 'doctor123', specialty: 'Cardiology', yearsOfExperience: 16, mobileNo: '08031234567',
    mdcnNumber: 'MDN/FMC/2008/04521', mdcnRegistrationYear: 2008, hospitalAffiliation: 'Lagos University Teaching Hospital (LUTH)',
    stateOfPractice: 'Lagos', fellowship: 'Fellow, West African College of Physicians (WACP)',
    languages: ['English', 'Igbo'],
    bio: 'Dr. Okonkwo is a consultant cardiologist with 16 years of experience at LUTH. He specialises in heart failure, hypertension, and arrhythmia management.',
    pricePerSession: 15000, availabilityStatus: 'green', rating: 4.97, reviewCount: 289, totalConsultations: 2840,
    ribbonBadge: 'top-rated', tags: ['Heart Disease', 'Hypertension', 'ECG', 'Heart Failure']
  },
  {
    name: 'Adaeze', surname: 'Nwosu', username: 'dr.nwosu', email: 'adaeze.nwosu@virtualcare.com',
    password: 'doctor123', specialty: 'Dermatology', yearsOfExperience: 10, mobileNo: '08055678901',
    mdcnNumber: 'MDN/UCH/2014/07823', mdcnRegistrationYear: 2014, hospitalAffiliation: 'Reddington Hospital, Victoria Island',
    stateOfPractice: 'Lagos', fellowship: 'Member, Nigerian Association of Dermatologists',
    bio: 'Dr. Nwosu is a specialist dermatologist based in Lagos, with expertise in acne, hyperpigmentation, and tropical skin infections.',
    pricePerSession: 10000, availabilityStatus: 'green', rating: 4.93, reviewCount: 214, totalConsultations: 1780,
    ribbonBadge: 'patient-fav', tags: ['Acne', 'Hyperpigmentation', 'Eczema', 'Skin Infections']
  },
  {
    name: 'Ibrahim', surname: 'Musa', username: 'dr.musa', email: 'ibrahim.musa@virtualcare.com',
    password: 'doctor123', specialty: 'General Practice', yearsOfExperience: 8, mobileNo: '07061234567',
    mdcnNumber: 'MDN/AKTH/2016/09134', mdcnRegistrationYear: 2016, hospitalAffiliation: 'Aminu Kano Teaching Hospital',
    stateOfPractice: 'Kano', fellowship: 'Member, Nigerian Medical Association (NMA)',
    bio: 'Dr. Musa is a general practitioner serving patients across northern Nigeria. He speaks Hausa and English fluently.',
    pricePerSession: 5000, availabilityStatus: 'green', rating: 4.89, reviewCount: 498, totalConsultations: 3620,
    ribbonBadge: 'most-reviewed', tags: ['Malaria', 'Typhoid', 'Diabetes', 'Hypertension', 'General Health']
  },
  {
    name: 'Chioma', surname: 'Eze', username: 'dr.eze', email: 'chioma.eze@virtualcare.com',
    password: 'doctor123', specialty: 'Pediatrics', yearsOfExperience: 12, mobileNo: '09091234567',
    mdcnNumber: 'MDN/UNTH/2012/03345', mdcnRegistrationYear: 2012, hospitalAffiliation: 'University of Nigeria Teaching Hospital (UNTH), Enugu',
    stateOfPractice: 'Enugu', fellowship: 'Fellow, Paediatric Association of Nigeria (PAN)',
    bio: 'Dr. Eze is a paediatric consultant with 12 years\' experience at UNTH Enugu. She specialises in childhood malaria and malnutrition.',
    pricePerSession: 8000, availabilityStatus: 'amber', rating: 4.95, reviewCount: 321, totalConsultations: 2290,
    tags: ['Child Health', 'Malaria', 'Malnutrition', 'Vaccination', 'Neonatal']
  },
  {
    name: 'Oluwaseun', surname: 'Adeleke', username: 'dr.adeleke', email: 'seun.adeleke@virtualcare.com',
    password: 'doctor123', specialty: 'Psychiatry', yearsOfExperience: 14, mobileNo: '08121234567',
    mdcnNumber: 'MDN/UCH/2010/05672', mdcnRegistrationYear: 2010, hospitalAffiliation: 'University College Hospital (UCH), Ibadan',
    stateOfPractice: 'Oyo', fellowship: 'Fellow, Association of Psychiatrists in Nigeria (APN)',
    bio: 'Dr. Adeleke is a consultant psychiatrist at UCH Ibadan, specialising in depression, anxiety, PTSD, and substance use disorders.',
    pricePerSession: 12000, availabilityStatus: 'green', rating: 4.96, reviewCount: 187, totalConsultations: 1540,
    tags: ['Depression', 'Anxiety', 'PTSD', 'Substance Use', 'Mental Health']
  },
  {
    name: 'Fatima', surname: 'Al-Amin', username: 'dr.alamin', email: 'fatima.alamin@virtualcare.com',
    password: 'doctor123', specialty: 'Gynecology', yearsOfExperience: 11, mobileNo: '08091234567',
    mdcnNumber: 'MDN/NHA/2013/06891', mdcnRegistrationYear: 2013, hospitalAffiliation: 'National Hospital Abuja',
    stateOfPractice: 'FCT - Abuja', fellowship: 'Fellow, Society of Gynaecology & Obstetrics of Nigeria (SOGON)',
    bio: 'Dr. Al-Amin is a consultant gynaecologist at the National Hospital Abuja, specialising in PCOS, fibroids, and antenatal care.',
    pricePerSession: 10000, availabilityStatus: 'green', rating: 4.94, reviewCount: 256, totalConsultations: 2010,
    ribbonBadge: 'patient-fav', tags: ['PCOS', 'Fibroids', 'Antenatal', 'Infertility', 'Maternal Health']
  },
  {
    name: 'Babatunde', surname: 'Fashola', username: 'dr.fashola', email: 'tunde.fashola@virtualcare.com',
    password: 'doctor123', specialty: 'Neurology', yearsOfExperience: 18, mobileNo: '08071234567',
    mdcnNumber: 'MDN/LUTH/2006/02234', mdcnRegistrationYear: 2006, hospitalAffiliation: 'Evercare Hospital, Lekki',
    stateOfPractice: 'Lagos', fellowship: 'Fellow, West African College of Physicians (WACP) — Neurology',
    bio: 'Professor Fashola is one of Nigeria\'s leading neurologists, managing stroke, epilepsy, Parkinson\'s disease, and migraines.',
    pricePerSession: 18000, availabilityStatus: 'red', rating: 4.98, reviewCount: 412, totalConsultations: 3980,
    ribbonBadge: 'top-rated', tags: ['Stroke', 'Epilepsy', 'Migraine', 'Parkinson\'s', 'Neuropathy']
  }
];

const DEFAULT_SCHEDULE = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => ({
  day,
  slots: [
    { startTime: '09:00', endTime: '12:00', isBooked: false },
    { startTime: '14:00', endTime: '17:00', isBooked: false }
  ]
}));

async function upsertUser(data) {
  let user = await User.findOne({ email: data.email });
  if (user) {
    Object.assign(user, { ...data, password: data.password });
    await user.save();
  } else {
    user = await User.create(data);
  }
  return user;
}

async function upsertDoctor(data) {
  const { ribbonBadge, tags, ...rest } = data;
  let doctor = await Doctor.findOne({ email: data.email });
  const payload = {
    ...rest,
    isApproved: true,
    isVerified: true,
    schedule: DEFAULT_SCHEDULE,
    ribbonBadge: ribbonBadge || '',
    languages: rest.languages || ['English'],
    tags: tags || [],
    credentials: {
      education: [{ year: String(rest.mdcnRegistrationYear || 2010), degree: 'MBBS', institution: rest.hospitalAffiliation }],
      certifications: [
        { name: 'Medical and Dental Council of Nigeria (MDCN)', year: String(rest.mdcnRegistrationYear), status: 'Verified' },
        ...(rest.fellowship ? [{ name: rest.fellowship, year: String(rest.mdcnRegistrationYear), status: 'Active' }] : [])
      ],
      skills: tags || []
    }
  };
  if (doctor) {
    Object.assign(doctor, payload);
    if (data.password) doctor.password = data.password;
    await doctor.save();
  } else {
    doctor = await Doctor.create(payload);
  }
  return doctor;
}

async function seedDemoData() {
  console.log('Seeding Virtualcare Nigeria demo data...');

  await upsertUser({
    username: 'admin', name: 'Admin', surname: 'User',
    email: 'admin@virtualcare.com', password: 'admin123', role: 'admin'
  });

  const patient = await upsertUser({
    username: 'amaka_obi', name: 'Amaka', surname: 'Obi',
    email: 'patient@virtualcare.com', password: 'patient123',
    phone: '08031112222', state: 'Lagos', dateOfBirth: '1990-03-15',
    consultationCount: 3, isReturningPatient: true,
    medicalHistoryNotes: 'Hypertension diagnosed 2022. Family history of diabetes (Type 2). Sickle cell trait (AS genotype). No known drug allergies.'
  });

  const doctors = [];
  for (const d of DEMO_DOCTORS) {
    doctors.push(await upsertDoctor(d));
  }

  const primaryDoctor = doctors[0];

  await Appointment.deleteMany({ patient: patient._id });
  await Payment.deleteMany({ patient: patient._id });
  await Message.deleteMany({});
  await Prescription.deleteMany({ patient: patient._id });
  await Review.deleteMany({ patient: patient._id });

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);
  lastWeek.setHours(14, 0, 0, 0);

  const inTenMin = new Date(now.getTime() + 10 * 60000);

  const upcomingAppt = await Appointment.create({
    patient: patient._id, doctor: primaryDoctor._id, specialty: primaryDoctor.specialty,
    sessionType: 'video', scheduledAt: tomorrow, status: 'confirmed',
    isReturnVisit: true, discountApplied: 25
  });

  const completedAppt = await Appointment.create({
    patient: patient._id, doctor: doctors[1]._id, specialty: doctors[1].specialty,
    sessionType: 'video', scheduledAt: lastWeek, status: 'completed',
    notes: 'Follow-up for blood pressure monitoring'
  });

  const activeAppt = await Appointment.create({
    patient: patient._id, doctor: primaryDoctor._id, specialty: primaryDoctor.specialty,
    sessionType: 'video', scheduledAt: inTenMin, status: 'confirmed',
    videoRoomUrl: `https://virtualcare.daily.co/demo-active-${Date.now()}`
  });

  for (const appt of [upcomingAppt, completedAppt, activeAppt]) {
    const doctor = doctors.find((d) => d._id.equals(appt.doctor));
    const discount = calculateDiscount(patient, doctor.pricePerSession);
    const { platformFee, doctorEarning } = calculateSplit(discount.finalAmount);
    const payment = await Payment.create({
      patient: patient._id, doctor: doctor._id, appointment: appt._id,
      grossAmount: doctor.pricePerSession, platformFee, doctorEarning,
      discountAmount: discount.discountAmount, finalAmount: discount.finalAmount,
      paystackReference: `vc_demo_${appt._id}`, currency: 'NGN', status: 'completed'
    });
    appt.paymentId = payment._id;
    await appt.save();
  }

  await Message.create([
    { appointment: completedAppt._id, sender: patient._id, senderRole: 'patient', content: 'Thank you for the consultation, Dr. Nwosu!', isRead: true },
    { appointment: completedAppt._id, sender: doctors[1]._id, senderRole: 'doctor', content: 'You are welcome, Amaka. Please continue your medication and book a follow-up in 4 weeks.', isRead: true },
    { appointment: activeAppt._id, sender: patient._id, senderRole: 'patient', content: 'Hi Dr. Okonkwo, I will join the session shortly.', isRead: false }
  ]);

  await Prescription.create({
    doctor: doctors[1]._id, patient: patient._id, appointment: completedAppt._id,
    medications: [
      { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days', refillsAllowed: 2 },
      { name: 'Low-dose Aspirin', dosage: '75mg', frequency: 'Once daily', duration: '30 days', refillsAllowed: 1 }
    ],
    notes: 'Take with food. Monitor blood pressure weekly. Reduce salt intake.',
    expiresAt: new Date(now.getTime() + 90 * 86400000)
  });

  await Review.create({
    patient: patient._id, doctor: doctors[1]._id, appointment: completedAppt._id,
    rating: 5, comment: 'Very thorough and caring. Explained everything clearly.',
    tags: ['Professional', 'Knowledgeable', 'Friendly']
  });

  const record = await MedicalRecord.findOne({ patient: patient._id });
  if (!record) {
    await MedicalRecord.create({
      patient: patient._id, fileName: 'blood-test-results.pdf',
      fileUrl: '/uploads/demo-blood-test.pdf', fileType: 'application/pdf',
      sharedWith: [primaryDoctor._id]
    });
  }

  await Notification.deleteMany({ user: patient._id });
  await Notification.create([
    { user: patient._id, userRole: 'patient', type: 'appointment', title: 'Upcoming consultation tomorrow', body: `Dr. ${primaryDoctor.surname} at 10:00 AM`, link: '/patient/upcoming' },
    { user: patient._id, userRole: 'patient', type: 'message', title: 'New message from Dr. Okonkwo', body: 'Session starting soon', link: '/patient/messages', isRead: false },
    { user: primaryDoctor._id, userRole: 'doctor', type: 'appointment', title: 'New booking', body: 'Amaka Obi booked a consultation', link: '/doctor/dashboard' }
  ]);

  console.log('Demo accounts: patient@virtualcare.com / patient123, doctor@virtualcare.com / doctor123, admin@virtualcare.com / admin123');
  console.log(`Seeded ${doctors.length} Nigerian doctors, 3 appointments, messages, prescriptions, reviews`);
}

module.exports = { seedDemoData };
