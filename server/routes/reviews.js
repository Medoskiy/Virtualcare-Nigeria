const express = require('express');
const Review = require('../models/Review');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');

const router = express.Router();

router.post('/', auth, requireRole('patient'), async (req, res) => {
  try {
    const { doctorId, rating, comment, tags } = req.body;

    if (!doctorId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Doctor, rating and comment are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    if (comment.length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Review must be at least 20 characters'
      });
    }

    const appointment = await Appointment.findOne({
      patient: req.user._id,
      doctor: doctorId,
      status: 'completed'
    });

    if (!appointment) {
      return res.status(403).json({
        success: false,
        message: 'You can only review doctors you have consulted with'
      });
    }

    const existing = await Review.findOne({
      patient: req.user._id,
      doctor: doctorId
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this doctor'
      });
    }

    const review = await Review.create({
      patient: req.user._id,
      doctor: doctorId,
      appointment: appointment._id,
      rating,
      comment,
      tags: tags || []
    });

    const allReviews = await Review.find({ doctor: doctorId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await Doctor.findByIdAndUpdate(doctorId, {
      rating: Math.round(avgRating * 100) / 100,
      reviewCount: allReviews.length
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully. Thank you!',
      data: { review }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
