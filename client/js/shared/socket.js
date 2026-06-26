import { getToken } from './api.js';

let socket = null;

export function connectSocket(user, role) {
  if (socket?.connected) return socket;
  if (typeof io === 'undefined') return null;

  socket = io(window.location.origin, {
    auth: { token: getToken() },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    if (user) socket.emit('join:user', { userId: user._id, role });
    if (role === 'doctor') socket.emit('join:doctor', user._id);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}

export function joinAppointment(id) { getSocket()?.emit('join:appointment', { appointmentId: id }); }
export function joinDoctor(id) { getSocket()?.emit('join:doctor', id); }
export function emitDoctorStatus(status) { getSocket()?.emit('doctor:status-update', { status }); }
export function onDoctorStatusChanged(cb) { getSocket()?.on('doctor:status-changed', cb); }
export function onMessageNew(cb) { getSocket()?.on('message:new', cb); }
export function onMessageRead(cb) { getSocket()?.on('message:read', cb); }
export function onTypingStart(cb) { getSocket()?.on('typing:start', cb); }
export function onTypingStop(cb) { getSocket()?.on('typing:stop', cb); }
export function emitTypingStart(appointmentId, name) { getSocket()?.emit('typing:start', { appointmentId, name }); }
export function emitTypingStop(appointmentId) { getSocket()?.emit('typing:stop', { appointmentId }); }
export function onSessionWarning(cb) { getSocket()?.on('session:timer-warning', cb); }
export function onSessionEnd(cb) { getSocket()?.on('session:end', cb); }
export function startSessionTimer(id) { getSocket()?.emit('session:start', { appointmentId: id }); }
export function endSession(id, doctorId) { getSocket()?.emit('session:end', { appointmentId: id, doctorId }); }
export function onDoctorStatusUpdate(cb) { getSocket()?.on('doctor:status-update', cb); }
export function onNotificationNew(cb) { getSocket()?.on('notification:new', cb); }
export function onAppointmentIncoming(cb) { getSocket()?.on('appointment:incoming', cb); }
