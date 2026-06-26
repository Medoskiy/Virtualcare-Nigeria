const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user = await User.findById(decoded.id);
    if (user) {
      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account suspended' });
      }
      req.user = user;
      req.userRole = user.role;
      return next();
    }

    const doctor = await Doctor.findById(decoded.id);
    if (doctor) {
      req.user = doctor;
      req.userRole = 'doctor';
      req.doctor = doctor;
      return next();
    }

    return res.status(401).json({ success: false, message: 'Invalid token' });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = auth;
