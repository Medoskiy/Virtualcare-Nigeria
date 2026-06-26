const express = require('express');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/response');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user._id,
      userRole: req.userRole
    }).sort({ createdAt: -1 }).limit(50);
    const unread = await Notification.countDocuments({
      user: req.user._id,
      userRole: req.userRole,
      isRead: false
    });
    return sendSuccess(res, { notifications, unread });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

router.put('/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, userRole: req.userRole },
      { isRead: true }
    );
    return sendSuccess(res, {}, 'All notifications marked read');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

module.exports = router;
