import { doctorsApi } from '../shared/api.js';
import { emitDoctorStatus } from '../shared/socket.js';
import { toast } from '../shared/toast.js';

export function updateDoctorStatusUI(status) {
  const ring = document.querySelector('.hex-status-ring, .status-ring-lg, .doctor-status-ring');
  if (ring) {
    ring.classList.remove('status-green', 'status-amber', 'status-red');
    ring.classList.add(`status-${status}`);
    const colors = { green: '#16a34a', amber: '#d97706', red: '#dc2626' };
    ring.style.background = colors[status] || colors.red;
  }
  document.querySelectorAll('.status-toggle-group button').forEach((b) => {
    b.classList.toggle('active', b.dataset.st === status);
  });
}

export async function setDoctorAvailabilityStatus(status, { notify = true } = {}) {
  updateDoctorStatusUI(status);
  try {
    await doctorsApi.updateAvailability(status);
    emitDoctorStatus(status);
  } catch {
    emitDoctorStatus(status);
  }
  if (notify) {
    const labels = {
      green: '🟢 Session ended. Status set to Available.',
      amber: '🟡 Status set to Busy',
      red: '🔴 Status set to In Session'
    };
    toast(labels[status] || `Status: ${status}`, status === 'green' ? 'success' : 'info');
  }
}

export async function setDoctorInSession(options = {}) {
  return setDoctorAvailabilityStatus('red', options);
}

export async function setDoctorAvailableAfterSession(options = {}) {
  return setDoctorAvailabilityStatus('green', options);
}
