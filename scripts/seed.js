const mongoose = require('mongoose');
require('dotenv').config();
const { startWithMemoryDB } = require('../server/config/startup');

const User = require('../server/models/User');
const Doctor = require('../server/models/Doctor');

async function seed() {
  await startWithMemoryDB();

  const adminExists = await User.findOne({ role: 'admin' });
  if (!adminExists) {
    await User.create({
      username: 'admin',
      name: 'Admin',
      surname: 'User',
      email: 'admin@virtualcare.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('Admin created: admin@virtualcare.com / admin123');
  }

  const doctorExists = await Doctor.findOne({ email: 'doctor@virtualcare.com' });
  if (!doctorExists) {
    await Doctor.create({
      username: 'drsmith',
      name: 'John',
      surname: 'Smith',
      email: 'doctor@virtualcare.com',
      password: 'doctor123',
      specialty: 'General Practice',
      licenseNumber: 'MD-12345',
      yearsOfExperience: 12,
      bio: 'Board-certified general practitioner with 12 years of experience.',
      pricePerSession: 75,
      isApproved: true,
      isVerified: true,
      availabilityStatus: 'green',
      rating: 4.8,
      reviewCount: 42
    });
    console.log('Demo doctor created: doctor@virtualcare.com / doctor123');
  }

  const patientExists = await User.findOne({ email: 'patient@virtualcare.com' });
  if (!patientExists) {
    await User.create({
      username: 'janedoe',
      name: 'Jane',
      surname: 'Doe',
      email: 'patient@virtualcare.com',
      password: 'patient123',
      phone: '555-0100'
    });
    console.log('Demo patient created: patient@virtualcare.com / patient123');
  }

  console.log('Seed complete');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
