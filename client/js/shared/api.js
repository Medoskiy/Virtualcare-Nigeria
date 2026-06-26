import { showToast } from './toast.js';

const API_BASE = '/api';

async function apiRequest(method, endpoint, data = null, options = {}) {
  const token = getToken();

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    ...options
  };

  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const result = await response.json().catch(() => ({}));

    if (response.status === 401) {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => null);
      if (refreshRes?.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData.data?.token) {
          localStorage.setItem('vc_token', refreshData.data.token);
          localStorage.setItem('token', refreshData.data.token);
          return apiRequest(method, endpoint, data, options);
        }
      }
      clearAuth();
      showToast('Your session has expired. Please log in again.', 'warning');
      setTimeout(() => { window.location.hash = '/login'; }, 1500);
      throw new Error('Unauthorised');
    }

    if (response.status === 403) {
      showToast('You do not have permission to do that.', 'error');
      throw new Error('Forbidden');
    }

    if (response.status === 429) {
      showToast(result.message || 'Too many requests. Please slow down.', 'warning');
      throw new Error('Rate limited');
    }

    if (!response.ok) {
      const msg = result.message || 'An error occurred. Please try again.';
      showToast(msg, 'error');
      throw new Error(msg);
    }

    return result;
  } catch (error) {
    if (error.message === 'Failed to fetch') {
      showToast('Connection error. Please check your internet.', 'error');
    }
    throw error;
  }
}

function getToken() {
  return localStorage.getItem('vc_token') || localStorage.getItem('token');
}

function setAuth(token, user, role) {
  localStorage.setItem('vc_token', token);
  localStorage.setItem('token', token);
  localStorage.setItem('vc_user', JSON.stringify(user));
  localStorage.setItem('vc_role', role);
}

function clearAuth() {
  ['vc_token', 'token', 'vc_user', 'vc_role'].forEach((k) => localStorage.removeItem(k));
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('vc_user')); } catch { return null; }
}

function getRole() {
  return localStorage.getItem('vc_role') || 'patient';
}

async function api(path, options = {}) {
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : null;
  return apiRequest(method, path.replace(/^\/api/, ''), body, options);
}

async function uploadFile(path, fieldName, file) {
  const form = new FormData();
  form.append(fieldName, file);
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      clearAuth();
      showToast('Your session has expired. Please log in again.', 'warning');
      throw new Error('Session expired');
    }
    showToast(data.message || 'Upload failed', 'error');
    throw new Error(data.message || 'Upload failed');
  }
  return data;
}

export const authApi = {
  login: (body) => apiRequest('POST', '/auth/login', body),
  registerPatient: (body) => apiRequest('POST', '/auth/register/patient', body),
  registerDoctor: (body) => apiRequest('POST', '/auth/register/doctor', body),
  me: () => apiRequest('GET', '/auth/me'),
  logout: () => apiRequest('POST', '/auth/logout'),
  refresh: () => apiRequest('POST', '/auth/refresh')
};

export const doctorsApi = {
  list: (params = '') => apiRequest('GET', `/doctors${params ? `?${params}` : ''}`),
  get: (id) => apiRequest('GET', `/doctors/${id}`),
  slots: (id, date) => apiRequest('GET', `/doctors/${id}/slots?date=${date}`),
  availability: (id) => apiRequest('GET', `/doctors/${id}/availability`),
  reviews: (id) => apiRequest('GET', `/doctors/${id}/reviews`),
  nextAvailable: (specialty) => apiRequest('GET', `/doctors/next-available/${encodeURIComponent(specialty)}`),
  updateProfile: (body) => apiRequest('PUT', '/doctors/profile', body),
  updateAvailability: (status) => apiRequest('PUT', '/doctors/availability', { status }),
  updateSchedule: (schedule) => apiRequest('PUT', '/doctors/schedule', { schedule }),
  updateCredentials: (body) => apiRequest('PUT', '/doctors/credentials', body),
  updateSettings: (body) => apiRequest('PUT', '/doctors/settings', body),
  patients: () => apiRequest('GET', '/doctors/patients'),
  records: () => apiRequest('GET', '/doctors/records/list'),
  earnings: () => apiRequest('GET', '/doctors/earnings'),
  earningsMonthly: () => apiRequest('GET', '/doctors/earnings/monthly'),
  upcoming: () => apiRequest('GET', '/doctors/upcoming')
};

export const patientsApi = {
  profile: () => apiRequest('GET', '/patients/profile'),
  updateProfile: (body) => apiRequest('PUT', '/patients/profile', body),
  history: (page = 1) => apiRequest('GET', `/patients/history?page=${page}`),
  prescriptions: () => apiRequest('GET', '/patients/prescriptions'),
  records: () => apiRequest('GET', '/patients/records'),
  shareRecord: (id, doctorId, revoke = false) =>
    apiRequest('PUT', `/patients/records/${id}/share`, { doctorId, revoke }),
  payments: () => apiRequest('GET', '/patients/payments'),
  upcoming: () => apiRequest('GET', '/patients/upcoming')
};

export const appointmentsApi = {
  book: (body) => apiRequest('POST', '/appointments/book', body),
  get: (id) => apiRequest('GET', `/appointments/${id}`),
  cancel: (id) => apiRequest('PUT', `/appointments/${id}/cancel`),
  complete: (id) => apiRequest('PUT', `/appointments/${id}/complete`),
  videoRoom: (id) => apiRequest('POST', `/appointments/${id}/video-room`),
  patientAll: () => apiRequest('GET', '/appointments/patient/all'),
  doctorAll: () => apiRequest('GET', '/appointments/doctor/all')
};

export const messagesApi = {
  checkAccess: (appointmentId) => apiRequest('GET', `/messages/check-access/${appointmentId}`),
  get: (appointmentId) => apiRequest('GET', `/messages/${appointmentId}`),
  send: (appointmentId, content, attachments = []) =>
    apiRequest('POST', `/messages/${appointmentId}`, { content, attachments }),
  markRead: (messageId) => apiRequest('PUT', `/messages/${messageId}/read`)
};

export const prescriptionsApi = {
  create: (body) => apiRequest('POST', '/prescriptions', body),
  my: () => apiRequest('GET', '/prescriptions/my'),
  forPatient: (patientId) => apiRequest('GET', `/prescriptions/patient/${patientId}`),
  refillRequest: (id) => apiRequest('POST', `/prescriptions/${id}/refill-request`)
};

export const paymentsApi = {
  config: () => apiRequest('GET', '/payments/config'),
  initialize: (appointmentId) => apiRequest('POST', '/payments/initialize', { appointmentId }),
  verify: (reference) => apiRequest('GET', `/payments/verify/${reference}`),
  banks: () => apiRequest('GET', '/payments/banks'),
  connectBank: (body) => apiRequest('POST', '/payments/connect-bank', body),
  withdrawalRequest: (body) => apiRequest('POST', '/payments/withdrawal-request', body),
  history: () => apiRequest('GET', '/payments/history')
};

export const aiApi = {
  chat: (message, history = []) =>
    apiRequest('POST', '/ai/chat', { message, conversationHistory: history, history })
};

export const adminApi = {
  dashboard: () => apiRequest('GET', '/admin/dashboard'),
  pendingDoctors: () => apiRequest('GET', '/admin/pending-doctors'),
  approveDoctor: (id) => apiRequest('PUT', `/admin/approve-doctor/${id}`),
  rejectDoctor: (id) => apiRequest('PUT', `/admin/reject-doctor/${id}`),
  users: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest('GET', `/admin/users${q ? `?${q}` : ''}`);
  },
  setDoctorPrice: (id, pricePerSession) =>
    apiRequest('PUT', `/admin/doctors/${id}/price`, { pricePerSession }),
  suspendUser: (id) => apiRequest('PUT', `/admin/users/${id}/suspend`),
  consultations: () => apiRequest('GET', '/admin/consultations'),
  revenue: () => apiRequest('GET', '/admin/revenue'),
  sendNotification: (body) => apiRequest('POST', '/admin/notifications/send', body),
  notificationHistory: () => apiRequest('GET', '/admin/notifications/history')
};

export const notificationsApi = {
  list: () => apiRequest('GET', '/notifications'),
  readAll: () => apiRequest('PUT', '/notifications/read-all')
};

export const reviewsApi = {
  create: (body) => apiRequest('POST', '/reviews', body)
};

export const uploadApi = {
  avatar: (file) => uploadFile('/upload/avatar', 'avatar', file),
  medicalRecord: (file) => uploadFile('/upload/medical-record', 'file', file),
  chatAttachment: (file) => uploadFile('/upload/chat-attachment', 'file', file)
};

export { getToken, setAuth, clearAuth, getUser, getRole, api };
