require('dotenv').config();
process.env.TZ = process.env.TIMEZONE || 'Africa/Lagos';
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const hpp = require('hpp');
const { Server } = require('socket.io');
const { startWithMemoryDB } = require('./config/startup');
const { seedDemoData } = require('./config/seed');
const { initSocket } = require('./socket/socketHandler');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const messageRoutes = require('./routes/messages');
const prescriptionRoutes = require('./routes/prescriptions');
const reviewRoutes = require('./routes/reviews');
const paymentRoutes = require('./routes/payments');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const { handleUploadError } = require('./middleware/upload');
const notificationRoutes = require('./routes/notifications');
const healthRoutes = require('./routes/health');
const videoRoutes = require('./routes/video');
const otpRoutes = require('./routes/otp');
const { handlePaystackWebhook } = require('./routes/payments');
const passport = require('./config/passport');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', methods: ['GET', 'POST'] }
});
app.set('io', io);
initSocket(io);

app.use((req, _res, next) => {
  req.io = app.get('io');
  next();
});

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://js.paystack.co', 'https://fonts.googleapis.com', 'https://download.agora.io'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: [
        "'self'",
        'https://api.paystack.co',
        'https://api.anthropic.com',
        'https://*.agora.io',
        'wss://*.agora.io',
        'https://v3.api.termii.com',
        process.env.CLIENT_URL || 'http://localhost:3000'
      ],
      frameSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
// Cache static assets for 1 day
app.use('/styles', express.static(path.join(__dirname, '../client/styles'), { maxAge: '1d' }));
app.use('/js', express.static(path.join(__dirname, '../client/js'), { maxAge: '1h' }));
app.use('/public', express.static(path.join(__dirname, '../client/public'), { maxAge: '7d' }));
app.use(morgan('dev'));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));

// Sanitize MongoDB queries against injection
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized MongoDB injection attempt: ${key} from ${req.ip}`);
  }
}));

// HTTP Parameter Pollution protection
app.use(hpp({
  whitelist: ['sort', 'filter', 'page', 'limit', 'specialty', 'state']
}));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many OTP requests. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Upload limit reached. Please try again later.' }
});

app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handlePaystackWebhook);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use('/api/', generalLimiter);
app.use('/api/health', healthRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadLimiter, uploadRoutes, handleUploadError);
app.use('/api/notifications', notificationRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/otp', otpLimiter, otpRoutes);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../client')));
app.use('/public', express.static(path.join(__dirname, '../client/public')));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return notFoundHandler(req, res);
  }
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;

const startServer = () => {
  server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║   Virtualcare Nigeria 🇳🇬               ║
║   Running at http://localhost:${PORT}      ║
║   Environment: ${process.env.NODE_ENV || 'development'}           ║
╚══════════════════════════════════════════╝
    `);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${PORT} busy. Trying port ${PORT + 1}...`);
      setTimeout(() => {
        server.close();
        server.listen(PORT + 1, () => {
          console.log(`
╔══════════════════════════════════════════╗
║   Virtualcare Nigeria 🇳🇬               ║
║   Running at http://localhost:${PORT + 1}      ║
║   Environment: ${process.env.NODE_ENV || 'development'}           ║
╚══════════════════════════════════════════╝
          `);
        });
      }, 1000);
    }
  });
};

async function boot() {
  await startWithMemoryDB();
  await seedDemoData();
  startServer();
}

boot().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = { app, server, io };
