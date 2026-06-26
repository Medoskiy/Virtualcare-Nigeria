const TZ = 'Africa/Lagos';

export function formatNaira(amount) {
  return '₦' + Number(amount || 0).toLocaleString('en-NG');
}

export function formatCurrency(amount) {
  return formatNaira(amount);
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-NG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: TZ
  });
}

export function formatShortDate(date) {
  const d = new Date(date);
  return {
    day: d.getDate(),
    month: d.toLocaleString('en-NG', { month: 'short', timeZone: TZ }),
    time: d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', timeZone: TZ })
  };
}

export function statusBadge(status) {
  const map = {
    green: 'badge-green', amber: 'badge-amber', red: 'badge-red',
    confirmed: 'badge-green', pending: 'badge-amber', active: 'badge-green',
    completed: 'badge-green', cancelled: 'badge-red', paid: 'badge-green', refunded: 'badge-blue'
  };
  return `<span class="badge ${map[status] || ''}">${status}</span>`;
}

export function statusDot(status) {
  return `<span class="status-dot status-${status}" title="${status}"></span>`;
}

export function escapeHtml(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

export function debounce(fn, ms = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

export function initials(name, surname) {
  return `${(name || '')[0] || ''}${(surname || '')[0] || ''}`.toUpperCase();
}

export function formatDoctorName(doctor, { surnameOnly = false } = {}) {
  if (!doctor) return 'Dr.';
  if (typeof doctor === 'string') {
    const trimmed = doctor.trim();
    if (!trimmed) return 'Dr.';
    return trimmed.startsWith('Dr.') ? trimmed : `Dr. ${trimmed}`;
  }
  const name = (doctor.name || '').trim();
  const surname = (doctor.surname || '').trim();
  if (surnameOnly) {
    const part = surname || name;
    return part ? `Dr. ${part}` : 'Dr.';
  }
  const full = `${name} ${surname}`.trim();
  if (!full) return 'Dr.';
  return full.startsWith('Dr.') ? full : `Dr. ${full}`;
}

export function canJoinSession(scheduledAt) {
  const now = new Date();
  const apptTime = new Date(scheduledAt);
  const diffMinutes = (apptTime - now) / (1000 * 60);
  return diffMinutes <= 10 && diffMinutes >= -60;
}

export function isJoinable(scheduledAt) {
  return canJoinSession(scheduledAt);
}

export function formatAIMessage(text) {
  if (!text) return '';
  let html = escapeHtml(text);
  html = html
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^•\s(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/gs, '<ul style="padding-left:16px;margin:8px 0">$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  return html;
}

const EMERGENCY_KEYWORDS = [
  'call 112', 'emergency', 'immediately', 'go to hospital',
  'dial 112', 'call 199', 'chest pain', 'stroke'
];

export function hasEmergencyContent(text) {
  return EMERGENCY_KEYWORDS.some((k) => text.toLowerCase().includes(k.toLowerCase()));
}

export const VALIDATION_MESSAGES = {
  phone: 'Enter a valid Nigerian number (e.g. 0801 234 5678)',
  mdcn: 'Enter a valid MDCN number (e.g. MDN/LUTH/2019/12345)',
  password: 'Password must be at least 8 characters',
  email: 'Enter a valid email address',
  required: 'This field is required'
};

export function validateField(input, type) {
  const val = input.value.trim();
  let valid = true;
  let msg = '';
  if (input.required && !val) {
    valid = false;
    msg = VALIDATION_MESSAGES.required;
  } else if (type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
    valid = false;
    msg = VALIDATION_MESSAGES.email;
  } else if (type === 'password' && val && val.length < 8) {
    valid = false;
    msg = VALIDATION_MESSAGES.password;
  } else if (type === 'phone' && val && !/^(\+234|0)[789][01]\d{8}$/.test(val.replace(/\s/g, ''))) {
    valid = false;
    msg = VALIDATION_MESSAGES.phone;
  } else if (type === 'mdcn' && val && !/^MDN\/[A-Z]+\/\d{4}\/\d+$/.test(val)) {
    valid = false;
    msg = VALIDATION_MESSAGES.mdcn;
  }
  input.classList.toggle('error', !valid);
  input.classList.toggle('success', valid && val.length > 0);
  const group = input.closest('.form-group');
  let errEl = group?.querySelector('.field-error');
  if (!valid) {
    if (!errEl && group) {
      errEl = document.createElement('div');
      errEl.className = 'field-error';
      group.appendChild(errEl);
    }
    if (errEl) errEl.textContent = msg;
  } else if (errEl) {
    errEl.remove();
  }
  return valid;
}

export function bindFormValidation(form) {
  form.querySelectorAll('[data-validate]').forEach((input) => {
    input.addEventListener('blur', () => validateField(input, input.dataset.validate));
  });
}

export const SPECIALTIES = [
  { id: 'general', name: 'General Practice', icon: '🩺', count: 420 },
  { id: 'cardiology', name: 'Cardiology', icon: '❤️', count: 312 },
  { id: 'dermatology', name: 'Dermatology', icon: '🔬', count: 285 },
  { id: 'psychiatry', name: 'Psychiatry', icon: '🧠', count: 198 },
  { id: 'pediatrics', name: 'Pediatrics', icon: '👶', count: 267 },
  { id: 'neurology', name: 'Neurology', icon: '🧬', count: 156 },
  { id: 'orthopedics', name: 'Orthopedics', icon: '🦴', count: 189 },
  { id: 'gynecology', name: 'Gynecology', icon: '👩‍⚕️', count: 174 },
  { id: 'ophthalmology', name: 'Ophthalmology', icon: '👁️', count: 143 },
  { id: 'ent', name: 'ENT', icon: '👂', count: 121 },
  { id: 'endocrinology', name: 'Endocrinology', icon: '💉', count: 98 },
  { id: 'gastroenterology', name: 'Gastroenterology', icon: '🫀', count: 112 },
  { id: 'pulmonology', name: 'Pulmonology', icon: '🫁', count: 87 },
  { id: 'urology', name: 'Urology', icon: '🏥', count: 76 },
  { id: 'oncology', name: 'Oncology', icon: '🔭', count: 64 },
  { id: 'rheumatology', name: 'Rheumatology', icon: '💊', count: 55 },
  { id: 'nephrology', name: 'Nephrology', icon: '🧪', count: 48 },
  { id: 'hematology', name: 'Hematology', icon: '🩸', count: 41 },
  { id: 'infectious', name: 'Infectious Disease', icon: '🦠', count: 62 }
];

export const BLOG_POSTS = [
  { slug: 'malaria-prevention', title: 'Malaria Prevention Tips for Nigerians', excerpt: 'How to protect yourself and your family during rainy season.', date: '2025-11-12' },
  { slug: 'hypertension-nigeria', title: 'Managing Hypertension in Nigeria', excerpt: 'Diet, lifestyle, and medication tips for the 30% of adults affected.', date: '2025-10-28' },
  { slug: 'sickle-cell-awareness', title: 'Understanding Your Genotype (AA, AS, SS)', excerpt: 'Why genotype testing matters for family planning in Nigeria.', date: '2025-10-15' }
];

export const FILTER_TABS = ['All', 'Cardiology', 'Dermatology', 'Psychiatry', 'Pediatrics', 'Neurology', 'General Practice', 'Gynecology'];

export function bindMessageEnterKey(container) {
  initMessageInput(container);
}

export function initMessageInput(container) {
  if (!container?.querySelector) return;

  const messageInput = container.querySelector('#messageInput')
    || container.querySelector('#msgInput')
    || container.querySelector('.message-input')
    || container.querySelector('input[placeholder*="message"]')
    || container.querySelector('textarea[placeholder*="message"]')
    || container.querySelector('#chat-input')
    || container.querySelector('#msg-in');

  if (!messageInput) return;

  if (messageInput._enterKeyHandler) {
    messageInput.removeEventListener('keydown', messageInput._enterKeyHandler);
  }

  messageInput._enterKeyHandler = (e) => handleEnterKey(e, container);
  messageInput.addEventListener('keydown', messageInput._enterKeyHandler);
}

function handleEnterKey(e, root) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    e.stopPropagation();

    const sendBtn = root.querySelector('#sendBtn')
      || root.querySelector('#sendMessage')
      || root.querySelector('#chat-send')
      || root.querySelector('#msg-send')
      || root.querySelector('.send-btn')
      || root.querySelector('.btn-send')
      || root.querySelector('button.send');

    if (sendBtn) {
      sendBtn.click();
    } else if (typeof window.sendMessage === 'function') {
      window.sendMessage();
    } else if (typeof window.sendChatMessage === 'function') {
      window.sendChatMessage();
    }
  }
}

export const MAX_RECORD_FILE_SIZE = 2 * 1024 * 1024;
