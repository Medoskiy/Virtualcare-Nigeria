const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/', async (_req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    timezone: 'Africa/Lagos',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'unknown',
      paystack: process.env.PAYSTACK_SECRET_KEY ? 'configured' : 'demo',
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'demo',
      dailyCo: process.env.DAILY_API_KEY ? 'configured' : 'demo',
      email: process.env.SENDGRID_API_KEY ? 'configured' : 'disabled'
    }
  };

  try {
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      health.services.database = 'connected';
    } else {
      health.services.database = 'in-memory (mongodb-memory-server)';
    }
  } catch {
    health.services.database = 'in-memory (mongodb-memory-server)';
  }

  res.json(health);
});

module.exports = router;
