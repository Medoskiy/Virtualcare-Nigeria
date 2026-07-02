const PDFDocument = require('pdfkit');

function generatePrescriptionPDF(prescription, patient, doctor) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = doc.page.width;
      const H = doc.page.height;

      // --- DIAGONAL WATERMARK ---
      doc.save();
      doc.opacity(0.06);
      doc.fontSize(64).fillColor('#0a2463');
      doc.rotate(-40, { origin: [W / 2, H / 2] });
      doc.text('VIRTUALCARE', 0, H / 2 - 80, { width: W, align: 'center' });
      doc.fontSize(36).fillColor('#1d6aba');
      doc.text('NIGERIA', 0, H / 2, { width: W, align: 'center' });
      doc.restore();

      // --- HEADER BACKGROUND ---
      doc.rect(0, 0, W, 110).fill('#0a2463');

      // --- LOGO TEXT ---
      doc.fontSize(28).fillColor('#ffffff').font('Helvetica-Bold').text('Virtual', 50, 28, { continued: true });
      doc.fillColor('#7ec8f7').text('care');
      doc.fontSize(10).fillColor('#bfdbfe').font('Helvetica').text('Nigeria', 50, 62);
      doc.fontSize(9).fillColor('#93c5fd').text('MDCN-Compliant Telemedicine Platform', 50, 76);

      // --- HEADER RIGHT ---
      doc.fontSize(8).fillColor('#bfdbfe')
        .text('www.virtualcare.me', W - 200, 35, { width: 150, align: 'right' })
        .text('support@virtualcare.me', W - 200, 48, { width: 150, align: 'right' })
        .text(`Generated: ${new Date().toLocaleDateString('en-NG')}`, W - 200, 61, { width: 150, align: 'right' });

      // --- PRESCRIPTION BADGE ---
      doc.roundedRect(W / 2 - 90, 80, 180, 26, 4).fill('#1d6aba');
      doc.fontSize(11).fillColor('#ffffff').font('Helvetica-Bold')
        .text('MEDICAL PRESCRIPTION', W / 2 - 85, 87, { width: 170, align: 'center' });

      // --- RX NUMBER & DATE ---
      doc.moveDown(4.5);
      const rxDate = new Date(prescription.createdAt || prescription.issuedAt || new Date());
      doc.fontSize(9).fillColor('#64748b').font('Helvetica')
        .text(`Rx ID: ${prescription._id?.toString().slice(-8).toUpperCase() || 'N/A'}   ·   Date: ${rxDate.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });

      // --- DIVIDER ---
      doc.moveDown(0.8);
      doc.rect(50, doc.y, W - 100, 1).fill('#e2e8f0');
      doc.moveDown(0.8);

      // --- PATIENT INFO BOX ---
      const pBoxY = doc.y;
      doc.rect(50, pBoxY, W - 100, 70).fill('#eff6ff').stroke('#bfdbfe');
      doc.fontSize(8).fillColor('#1d6aba').font('Helvetica-Bold').text('PATIENT DETAILS', 62, pBoxY + 8);
      doc.fontSize(11).fillColor('#0a2463').font('Helvetica-Bold')
        .text(`${patient.name} ${patient.surname}`, 62, pBoxY + 22);
      doc.fontSize(9).fillColor('#475569').font('Helvetica')
        .text(`📧 ${patient.email}   ·   📱 ${patient.phone || 'N/A'}`, 62, pBoxY + 38);
      if (patient.state) doc.text(`📍 ${patient.state}`, 62, pBoxY + 52);

      // --- DOCTOR INFO BOX ---
      doc.moveDown(3.8);
      const dBoxY = doc.y;
      doc.rect(50, dBoxY, W - 100, 55).fill('#f0fdf4').stroke('#bbf7d0');
      doc.fontSize(8).fillColor('#16a34a').font('Helvetica-Bold').text('PRESCRIBING DOCTOR', 62, dBoxY + 8);
      doc.fontSize(11).fillColor('#166534').font('Helvetica-Bold')
        .text(`Dr. ${doctor.name} ${doctor.surname}`, 62, dBoxY + 22);
      doc.fontSize(9).fillColor('#475569').font('Helvetica')
        .text(`${doctor.specialty || 'General Practice'}   ·   ✅ MDCN Verified`, 62, dBoxY + 38);

      // --- MEDICATIONS HEADER ---
      doc.moveDown(3.2);
      doc.fontSize(13).fillColor('#0a2463').font('Helvetica-Bold').text('Medications Prescribed', 50);
      doc.rect(50, doc.y + 4, W - 100, 1).fill('#0a2463');
      doc.moveDown(0.8);

      // --- MEDICATIONS LIST ---
      const medications = prescription.medications || [];
      medications.forEach((med, i) => {
        const medY = doc.y;
        doc.rect(50, medY, W - 100, 58).fill(i % 2 === 0 ? '#f8fafc' : '#ffffff').stroke('#e2e8f0');

        // Medication number badge
        doc.rect(54, medY + 4, 22, 22).fill('#1d6aba');
        doc.fontSize(11).fillColor('#ffffff').font('Helvetica-Bold')
          .text(`${i + 1}`, 54, medY + 8, { width: 22, align: 'center' });

        doc.fontSize(12).fillColor('#0a2463').font('Helvetica-Bold')
          .text(`${med.name}`, 84, medY + 6, { continued: true });
        doc.fontSize(10).fillColor('#64748b').font('Helvetica')
          .text(` — ${med.dosage || 'As directed'}`);

        doc.fontSize(9).fillColor('#475569').font('Helvetica')
          .text(
            [
              med.frequency ? `🕐 ${med.frequency}` : '',
              med.duration ? `📅 ${med.duration}` : '',
              med.refillsAllowed ? `🔁 ${med.refillsAllowed} refill(s)` : ''
            ].filter(Boolean).join('   '),
            84, medY + 26
          );

        if (med.notes) {
          doc.fontSize(8).fillColor('#7c3aed').font('Helvetica')
            .text(`📝 ${med.notes}`, 84, medY + 42);
        }

        doc.moveDown(2.8);
      });

      // --- NOTES ---
      if (prescription.notes) {
        doc.moveDown(0.5);
        const nY = doc.y;
        doc.rect(50, nY, W - 100, 50).fill('#fffbeb').stroke('#fde68a');
        doc.fontSize(9).fillColor('#92400e').font('Helvetica-Bold').text('📋 Doctor\'s Notes:', 62, nY + 8);
        doc.fontSize(9).fillColor('#78350f').font('Helvetica')
          .text(prescription.notes, 62, nY + 22, { width: W - 124 });
        doc.moveDown(2.5);
      }

      // --- VALIDITY ---
      if (prescription.expiresAt) {
        doc.fontSize(9).fillColor('#64748b').font('Helvetica')
          .text(`⏳ Valid until: ${new Date(prescription.expiresAt).toLocaleDateString('en-NG')}`, 50);
        doc.moveDown(0.5);
      }

      // --- FOOTER ---
      const fY = H - 65;
      doc.rect(0, fY, W, 65).fill('#0a2463');
      doc.fontSize(8).fillColor('#7ec8f7').font('Helvetica-Bold')
        .text('Virtual', 50, fY + 12, { continued: true });
      doc.fillColor('#ffffff').text('care Nigeria');
      doc.fontSize(7).fillColor('#93c5fd').font('Helvetica')
        .text('This prescription is digitally generated by Virtualcare Nigeria and is valid for medical use.', 50, fY + 28, { width: W - 100, align: 'center' })
        .text(`© ${new Date().getFullYear()} Virtualcare Nigeria · virtualcare.me · MDCN Compliant`, 50, fY + 40, { width: W - 100, align: 'center' });

      // --- STAMP ---
      doc.save();
      doc.opacity(0.15);
      doc.circle(W - 90, fY - 30, 35).stroke('#ffffff');
      doc.fontSize(7).fillColor('#ffffff').font('Helvetica-Bold')
        .text('VIRTUALCARE', W - 120, fY - 40, { width: 60, align: 'center' })
        .text('VERIFIED', W - 120, fY - 28, { width: 60, align: 'center' });
      doc.restore();

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generatePrescriptionPDF };
