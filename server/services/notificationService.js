const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (process.env.SENDGRID_API_KEY) {
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: { user: 'apikey', pass: process.env.SENDGRID_API_KEY }
    });
  } else {
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
}

function loadTemplate(name, vars = {}) {
  const filePath = path.join(__dirname, '../templates', `${name}.html`);
  if (!fs.existsSync(filePath)) return '';
  let html = fs.readFileSync(filePath, 'utf8');
  Object.entries(vars).forEach(([k, v]) => {
    html = html.replace(new RegExp(`{{${k}}}`, 'g'), v ?? '');
  });
  return html;
}

function formatNaira(amount) {
  return '₦' + Number(amount || 0).toLocaleString('en-NG');
}

async function sendEmail({ to, subject, html }) {
  try {
    await getTransporter().sendMail({
      from: `"${process.env.FROM_NAME || 'Virtualcare Nigeria'}" <${process.env.FROM_EMAIL || 'support@virtualcare.ng'}>`,
      to,
      subject,
      html
    });
    return true;
  } catch (err) {
    console.error('Email send error:', err.message);
    return false;
  }
}

async function createInAppNotification({ user, userRole, type, title, body, link }, io) {
  const notification = await Notification.create({
    user,
    userRole: userRole || 'patient',
    type: type || 'system',
    title,
    body,
    link: link || '/'
  });
  if (io && user) {
    io.to(`user:${userRole || 'patient'}:${user}`).emit('notification:new', { notification });
  }
  return notification;
}

async function notifyNewMessage(recipientId, senderName, io) {
  return createInAppNotification({
    user: recipientId,
    type: 'message',
    title: 'New Message',
    body: `${senderName} sent you a message`,
    link: '/patient/messages'
  }, io);
}

async function notifyAppointmentBooked(patient, doctor, appointment, io) {
  const dateTime = new Date(appointment.scheduledAt).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' });
  await createInAppNotification({
    user: doctor._id,
    userRole: 'doctor',
    type: 'appointment',
    title: 'New Appointment Booked',
    body: `${patient.name} ${patient.surname} booked for ${dateTime}`,
    link: '/doctor/dashboard'
  }, io);

  await createInAppNotification({
    user: patient._id,
    userRole: 'patient',
    type: 'appointment',
    title: 'Appointment Confirmed',
    body: `Dr. ${doctor.surname} — ${dateTime}`,
    link: '/patient/upcoming'
  }, io);

  await sendEmail({
    to: patient.email,
    subject: `Appointment Confirmed ✅ — Dr. ${doctor.surname} | ${dateTime}`,
    html: loadTemplate('appointment-confirmed', {
      firstName: patient.name,
      doctorName: `Dr. ${doctor.name} ${doctor.surname}`,
      specialty: appointment.specialty,
      dateTime,
      sessionType: appointment.sessionType
    }) || `<p>Hi ${patient.name}, your consultation with Dr. ${doctor.surname} is confirmed for ${dateTime}.</p>`
  });
}

async function notifyPaymentConfirmed(patientId, amount, doctorName, io) {
  return createInAppNotification({
    user: patientId,
    userRole: 'patient',
    type: 'payment',
    title: 'Payment Confirmed',
    body: `Your payment of ${formatNaira(amount)} for Dr. ${doctorName} is confirmed`,
    link: '/patient/payments'
  }, io);
}

async function notifyPrescriptionIssued(patientId, doctorName, io) {
  return createInAppNotification({
    user: patientId,
    userRole: 'patient',
    type: 'prescription',
    title: 'New Prescription',
    body: `Dr. ${doctorName} has issued you a new prescription`,
    link: '/patient/prescriptions'
  }, io);
}

async function notifyDoctorApproved(doctor) {
  await sendEmail({
    to: doctor.email,
    subject: "🎉 Congratulations! You're now on Virtualcare Nigeria",
    html: loadTemplate('doctor-approved', {
      doctorName: `Dr. ${doctor.surname}`,
      mdcnNumber: doctor.mdcnNumber || ''
    }) || `<p>Dr. ${doctor.surname}, your Virtualcare Nigeria account has been approved.</p>`
  });
}

async function notifyDoctorApplicationReceived(doctor) {
  await sendEmail({
    to: doctor.email,
    subject: 'Application Received — Virtualcare Nigeria Doctor Network',
    html: loadTemplate('doctor-application', {
      doctorName: `Dr. ${doctor.surname}`,
      mdcnNumber: doctor.mdcnNumber || 'Pending'
    }) || `<p>Thank you for applying. We are reviewing your MDCN registration.</p>`
  });
}

async function notifyWelcomePatient(patient) {
  await sendEmail({
    to: patient.email,
    subject: "Welcome to Virtualcare Nigeria — Quality Healthcare is Now One Tap Away",
    html: loadTemplate('welcome-patient', { firstName: patient.name })
      || `<p>Welcome, ${patient.name}! You've joined Virtualcare Nigeria.</p>`
  });
}

module.exports = {
  sendEmail,
  loadTemplate,
  createInAppNotification,
  notifyNewMessage,
  notifyAppointmentBooked,
  notifyPaymentConfirmed,
  notifyPrescriptionIssued,
  notifyDoctorApproved,
  notifyDoctorApplicationReceived,
  notifyWelcomePatient
};
