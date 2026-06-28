const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const FROM = `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`;

function baseTemplate(content) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Virtualcare Nigeria</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#0066cc,#0099ff);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">🏥 Virtualcare Nigeria</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Quality Healthcare, Anytime Anywhere</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e8ecf0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} Virtualcare Nigeria. All rights reserved.</p>
            <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;">
              <a href="https://virtualcare.me" style="color:#0066cc;text-decoration:none;">virtualcare.me</a> · 
              <a href="mailto:support@virtualcare.me" style="color:#0066cc;text-decoration:none;">support@virtualcare.me</a>
            </p>
            <p style="margin:8px 0 0;color:#94a3b8;font-size:11px;">This email was sent because you have an account on Virtualcare Nigeria.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendPatientWelcomeEmail(patient) {
  const content = `
    <h2 style="color:#1e293b;margin:0 0 16px;">Welcome to Virtualcare Nigeria! 🎉</h2>
    <p style="color:#475569;line-height:1.6;">Hi <strong>${patient.name}</strong>,</p>
    <p style="color:#475569;line-height:1.6;">We're thrilled to have you on board. You now have access to quality healthcare from the comfort of your home.</p>
    <div style="background:#f0f9ff;border-left:4px solid #0066cc;padding:16px 20px;border-radius:0 8px 8px 0;margin:24px 0;">
      <p style="margin:0;color:#0066cc;font-weight:600;">What you can do on Virtualcare:</p>
      <ul style="margin:8px 0 0;color:#475569;padding-left:20px;line-height:1.8;">
        <li>Book consultations with verified Nigerian doctors</li>
        <li>Consult via video, audio, or chat</li>
        <li>Get prescriptions and health tips</li>
        <li>Access your medical history anytime</li>
      </ul>
    </div>
    <table cellpadding="0" cellspacing="0" style="margin:32px 0;">
      <tr>
        <td style="background:#0066cc;border-radius:8px;padding:14px 28px;">
          <a href="https://virtualcare.me/#/login" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;">Find a Doctor →</a>
        </td>
      </tr>
    </table>
    <p style="color:#475569;line-height:1.6;">Questions? Email us at <a href="mailto:support@virtualcare.me" style="color:#0066cc;">support@virtualcare.me</a></p>
    <p style="color:#475569;">Warm regards,<br><strong>The Virtualcare Nigeria Team</strong></p>`;

  await transporter.sendMail({
    from: FROM,
    to: patient.email,
    subject: '🎉 Welcome to Virtualcare Nigeria — Your Health, Our Priority',
    html: baseTemplate(content)
  });
}

async function sendDoctorWelcomeEmail(doctor) {
  const content = `
    <h2 style="color:#1e293b;margin:0 0 16px;">Welcome to Virtualcare Nigeria, Doctor! 👨‍⚕️</h2>
    <p style="color:#475569;line-height:1.6;">Dear <strong>Dr. ${doctor.surname}</strong>,</p>
    <p style="color:#475569;line-height:1.6;">Thank you for applying to join Virtualcare Nigeria. Your application has been received and is currently under review by our admin team.</p>
    <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px 20px;border-radius:0 8px 8px 0;margin:24px 0;">
      <p style="margin:0;color:#16a34a;font-weight:600;">Application Status: Under Review</p>
      <p style="margin:8px 0 0;color:#475569;">We typically review applications within 2-3 business days. You will receive an email once your MDCN credentials are verified.</p>
    </div>
    <ul style="color:#475569;padding-left:20px;line-height:1.8;">
      <li>Set your consultation schedule and fees</li>
      <li>Receive patients via video, audio, or chat</li>
      <li>Issue digital prescriptions</li>
      <li>Receive payouts directly to your bank account</li>
    </ul>
    <p style="color:#475569;line-height:1.6;">Questions? Contact us at <a href="mailto:support@virtualcare.me" style="color:#0066cc;">support@virtualcare.me</a></p>
    <p style="color:#475569;">Best regards,<br><strong>The Virtualcare Nigeria Team</strong></p>`;

  await transporter.sendMail({
    from: FROM,
    to: doctor.email,
    subject: '👨‍⚕️ Your Virtualcare Nigeria Application Has Been Received',
    html: baseTemplate(content)
  });
}

async function sendAppointmentConfirmationEmail(patient, doctor, appointment, payment) {
  const date = new Date(appointment.scheduledAt).toLocaleDateString('en-NG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const time = new Date(appointment.scheduledAt).toLocaleTimeString('en-NG', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos'
  });

  const content = `
    <h2 style="color:#1e293b;margin:0 0 16px;">Appointment Confirmed! ✅</h2>
    <p style="color:#475569;line-height:1.6;">Hi <strong>${patient.name}</strong>, your consultation has been confirmed.</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:24px;margin:24px 0;">
      <h3 style="margin:0 0 16px;color:#1e293b;">Appointment Details</h3>
      <table width="100%" cellpadding="8" cellspacing="0">
        <tr><td style="color:#64748b;width:40%;">Doctor</td><td style="color:#1e293b;font-weight:600;">Dr. ${doctor.name} ${doctor.surname}</td></tr>
        <tr style="background:#f1f5f9;"><td style="color:#64748b;">Speciality</td><td style="color:#1e293b;">${doctor.specialty || 'General Practice'}</td></tr>
        <tr><td style="color:#64748b;">Date</td><td style="color:#1e293b;font-weight:600;">${date}</td></tr>
        <tr style="background:#f1f5f9;"><td style="color:#64748b;">Time</td><td style="color:#1e293b;font-weight:600;">${time} (WAT)</td></tr>
        <tr><td style="color:#64748b;">Type</td><td style="color:#1e293b;">${appointment.type || 'Video Consultation'}</td></tr>
        <tr style="background:#f1f5f9;"><td style="color:#64748b;">Amount Paid</td><td style="color:#22c55e;font-weight:700;">₦${payment?.finalAmount?.toLocaleString('en-NG') || '0'}</td></tr>
      </table>
    </div>
    <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background:#0066cc;border-radius:8px;padding:14px 28px;">
          <a href="https://virtualcare.me/#/patient/upcoming" style="color:#ffffff;text-decoration:none;font-weight:600;">View Appointment →</a>
        </td>
      </tr>
    </table>
    <p style="color:#475569;line-height:1.6;">Please be online 5 minutes before your scheduled time.</p>
    <p style="color:#475569;">Stay healthy,<br><strong>The Virtualcare Nigeria Team</strong></p>`;

  await transporter.sendMail({
    from: FROM,
    to: patient.email,
    subject: `✅ Appointment Confirmed — Dr. ${doctor.surname} on ${date}`,
    html: baseTemplate(content)
  });
}

async function sendPasswordResetEmail(user, resetToken) {
  const resetUrl = `https://virtualcare.me/#/reset-password?token=${resetToken}`;

  const content = `
    <h2 style="color:#1e293b;margin:0 0 16px;">Reset Your Password 🔐</h2>
    <p style="color:#475569;line-height:1.6;">Hi <strong>${user.name}</strong>,</p>
    <p style="color:#475569;line-height:1.6;">We received a request to reset your Virtualcare Nigeria password. Click the button below:</p>
    <table cellpadding="0" cellspacing="0" style="margin:32px 0;">
      <tr>
        <td style="background:#0066cc;border-radius:8px;padding:14px 28px;">
          <a href="${resetUrl}" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;">Reset My Password →</a>
        </td>
      </tr>
    </table>
    <div style="background:#fff7ed;border-left:4px solid #f97316;padding:16px 20px;border-radius:0 8px 8px 0;margin:24px 0;">
      <p style="margin:0;color:#c2410c;font-weight:600;">⚠️ This link expires in 1 hour</p>
      <p style="margin:8px 0 0;color:#475569;">If you did not request this, please ignore this email. Your account is safe.</p>
    </div>
    <p style="color:#475569;word-break:break-all;font-size:13px;">Or copy this link: ${resetUrl}</p>
    <p style="color:#475569;">Stay safe,<br><strong>The Virtualcare Nigeria Team</strong></p>`;

  await transporter.sendMail({
    from: FROM,
    to: user.email,
    subject: '🔐 Reset Your Virtualcare Nigeria Password',
    html: baseTemplate(content)
  });
}

async function sendDoctorInvoiceEmail(doctor, invoiceData) {
  const content = `
    <h2 style="color:#1e293b;margin:0 0 16px;">Payout Invoice 💰</h2>
    <p style="color:#475569;line-height:1.6;">Dear <strong>Dr. ${doctor.surname}</strong>,</p>
    <p style="color:#475569;line-height:1.6;">Your withdrawal request has been received and is being processed.</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:24px;margin:24px 0;">
      <h3 style="margin:0 0 16px;color:#1e293b;">Invoice Summary</h3>
      <table width="100%" cellpadding="8" cellspacing="0">
        <tr><td style="color:#64748b;width:40%;">Invoice Ref</td><td style="color:#1e293b;font-weight:600;">${invoiceData.reference}</td></tr>
        <tr style="background:#f1f5f9;"><td style="color:#64748b;">Amount</td><td style="color:#22c55e;font-weight:700;font-size:18px;">₦${Number(invoiceData.amount).toLocaleString('en-NG')}</td></tr>
        <tr><td style="color:#64748b;">Bank</td><td style="color:#1e293b;">${invoiceData.bankName}</td></tr>
        <tr style="background:#f1f5f9;"><td style="color:#64748b;">Account</td><td style="color:#1e293b;">${invoiceData.accountNumber}</td></tr>
        <tr><td style="color:#64748b;">Processing Time</td><td style="color:#1e293b;">1-2 business days</td></tr>
        <tr style="background:#f1f5f9;"><td style="color:#64748b;">Status</td><td style="color:#f97316;font-weight:600;">Processing</td></tr>
      </table>
    </div>
    <p style="color:#475569;line-height:1.6;">Questions? Contact <a href="mailto:support@virtualcare.me" style="color:#0066cc;">support@virtualcare.me</a></p>
    <p style="color:#475569;">Best regards,<br><strong>The Virtualcare Nigeria Team</strong></p>`;

  await transporter.sendMail({
    from: FROM,
    to: doctor.email,
    subject: `💰 Payout Invoice — ₦${Number(invoiceData.amount).toLocaleString('en-NG')} — ${invoiceData.reference}`,
    html: baseTemplate(content)
  });
}

async function sendAppointmentReminderEmail(patient, doctor, appointment) {
  const date = new Date(appointment.scheduledAt).toLocaleDateString('en-NG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const time = new Date(appointment.scheduledAt).toLocaleTimeString('en-NG', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos'
  });

  const content = `
    <h2 style="color:#1e293b;margin:0 0 16px;">Appointment Reminder ⏰</h2>
    <p style="color:#475569;line-height:1.6;">Hi <strong>${patient.name}</strong>,</p>
    <p style="color:#475569;line-height:1.6;">This is a reminder that you have a consultation scheduled for <strong>tomorrow</strong>.</p>
    <div style="background:#f0f9ff;border-left:4px solid #0066cc;padding:16px 20px;border-radius:0 8px 8px 0;margin:24px 0;">
      <p style="margin:0;color:#0066cc;font-weight:600;">📅 ${date} at ${time} (WAT)</p>
      <p style="margin:8px 0 0;color:#475569;">with <strong>Dr. ${doctor.name} ${doctor.surname}</strong> — ${doctor.specialty || 'General Practice'}</p>
    </div>
    <ul style="color:#475569;padding-left:20px;line-height:1.8;">
      <li>Ensure you have a stable internet connection</li>
      <li>Find a quiet, private space</li>
      <li>Have your symptoms and questions ready</li>
      <li>Join 5 minutes early</li>
    </ul>
    <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background:#0066cc;border-radius:8px;padding:14px 28px;">
          <a href="https://virtualcare.me/#/patient/upcoming" style="color:#ffffff;text-decoration:none;font-weight:600;">View Appointment →</a>
        </td>
      </tr>
    </table>
    <p style="color:#475569;">See you tomorrow,<br><strong>The Virtualcare Nigeria Team</strong></p>`;

  await transporter.sendMail({
    from: FROM,
    to: patient.email,
    subject: `⏰ Reminder: Consultation with Dr. ${doctor.surname} Tomorrow at ${time}`,
    html: baseTemplate(content)
  });
}

async function sendTestEmail(toEmail) {
  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: '✅ Virtualcare Nigeria Email System Test',
    html: baseTemplate(`
      <h2 style="color:#1e293b;">Email System Working! ✅</h2>
      <p style="color:#475569;">This is a test email from Virtualcare Nigeria. If you received this, the email system is configured correctly.</p>
      <p style="color:#475569;">Sent at: ${new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })} (WAT)</p>
    `)
  });
}

module.exports = {
  sendPatientWelcomeEmail,
  sendDoctorWelcomeEmail,
  sendAppointmentConfirmationEmail,
  sendPasswordResetEmail,
  sendDoctorInvoiceEmail,
  sendAppointmentReminderEmail,
  sendTestEmail
};
