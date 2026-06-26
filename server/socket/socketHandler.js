const jwt = require('jsonwebtoken');
const SESSION_WARN_MIN = 45;
const SESSION_END_MIN = 55;

function initSocket(io) {
  const sessionTimers = new Map();

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.user.id}`);

    socket.join(`user:${socket.user.id}`);

    socket.on('join:doctor', (doctorId) => socket.join(`doctor:${doctorId}`));
    socket.on('join:appointment', ({ appointmentId }) => socket.join(`appointment:${appointmentId}`));
    socket.on('join:user', ({ userId, role }) => {
      socket.join(`user:${role}:${userId}`);
      if (role) socket.join(`role:${role}`);
    });

    socket.on('doctor:status-update', async ({ status }) => {
      io.emit('doctor:status-changed', { doctorId: socket.user.id, status });
      io.emit('doctor:status-update', { doctorId: socket.user.id, status });
    });

    socket.on('typing:start', ({ appointmentId, name }) => {
      socket.to(`appointment:${appointmentId}`).emit('typing:start', {
        appointmentId,
        name,
        senderRole: socket.user.role
      });
    });

    socket.on('typing:stop', ({ appointmentId }) => {
      socket.to(`appointment:${appointmentId}`).emit('typing:stop', { appointmentId });
    });

    socket.on('session:start', ({ appointmentId }) => {
      if (sessionTimers.has(appointmentId)) return;
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsedMin = (Date.now() - startTime) / 60000;
        if (elapsedMin >= SESSION_WARN_MIN && elapsedMin < SESSION_WARN_MIN + 0.17) {
          io.to(`appointment:${appointmentId}`).emit('session:timer-warning', {
            appointmentId, message: '10 minutes remaining', minutesLeft: 10
          });
        }
        if (elapsedMin >= 50 && elapsedMin < 50.17) {
          io.to(`appointment:${appointmentId}`).emit('session:timer-warning', {
            appointmentId, message: '5 minutes remaining', minutesLeft: 5
          });
        }
        if (elapsedMin >= SESSION_END_MIN) {
          clearInterval(interval);
          sessionTimers.delete(appointmentId);
          io.to(`appointment:${appointmentId}`).emit('session:end', { appointmentId });
        }
      }, 10000);
      sessionTimers.set(appointmentId, interval);
    });

    socket.on('session:end', ({ appointmentId, doctorId }) => {
      const timer = sessionTimers.get(appointmentId);
      if (timer) { clearInterval(timer); sessionTimers.delete(appointmentId); }
      io.to(`appointment:${appointmentId}`).emit('session:ended', { appointmentId });
      io.to(`appointment:${appointmentId}`).emit('session:end', { appointmentId });
      if (doctorId) {
        io.emit('doctor:status-changed', { doctorId, status: 'green' });
        io.emit('doctor:status-update', { doctorId, status: 'green' });
        io.emit('doctor:available', { doctorId });
      }
    });

    socket.on('notification:new', (payload) => {
      if (payload.userId && payload.role) {
        io.to(`user:${payload.role}:${payload.userId}`).emit('notification:new', payload);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.id}`);
    });
  });
}

module.exports = { initSocket };
