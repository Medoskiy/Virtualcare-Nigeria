const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

async function getNextAvailableDoctor(specialty) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const doctors = await Doctor.find({
    specialty: new RegExp(specialty, 'i'),
    isApproved: true,
    availabilityStatus: 'green'
  });

  if (!doctors.length) return null;

  const withCounts = await Promise.all(
    doctors.map(async (doctor) => {
      const bookingsToday = await Appointment.countDocuments({
        doctor: doctor._id,
        scheduledAt: { $gte: todayStart, $lte: todayEnd },
        status: { $nin: ['cancelled'] }
      });
      return { doctor, bookingsToday };
    })
  );

  withCounts.sort((a, b) => {
    if (a.bookingsToday !== b.bookingsToday) return a.bookingsToday - b.bookingsToday;
    const aLast = a.doctor.lastSessionAt ? a.doctor.lastSessionAt.getTime() : 0;
    const bLast = b.doctor.lastSessionAt ? b.doctor.lastSessionAt.getTime() : 0;
    if (aLast !== bLast) return aLast - bLast;
    return b.doctor.rating - a.doctor.rating;
  });

  return withCounts[0].doctor;
}

module.exports = { getNextAvailableDoctor };
