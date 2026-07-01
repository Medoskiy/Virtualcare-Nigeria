import { getUser, getRole } from './api.js';

const PATIENT_TABS = [
  { path: '/patient/dashboard', icon: '🏠', label: 'Home', aria: 'Patient dashboard' },
  { path: '/patient/book', icon: '📅', label: 'Book', aria: 'Book a doctor', bookFlow: true },
  { path: '/patient/ai', icon: '🤖', label: 'VirtualAI', aria: 'VirtualAI assistant' },
  { path: '/patient/messages', icon: '💬', label: 'Messages', aria: 'Messages' },
  { path: '/patient/profile', icon: '👤', label: 'Profile', aria: 'My profile' }
];

const DOCTOR_TABS = [
  { path: '/doctor/dashboard', icon: '📊', label: 'Overview', aria: 'Doctor overview' },
  { path: '/doctor/patients', icon: '👥', label: 'Patients', aria: 'My patients' },
  { path: '/doctor/messages', icon: '💬', label: 'Messages', aria: 'Messages' },
  { path: '/doctor/schedule', icon: '📅', label: 'Schedule', aria: 'My schedule' },
  { path: '/doctor/profile', icon: '👨‍⚕️', label: 'Profile', aria: 'My profile' }
];

const ADMIN_TABS = [
  { path: '/admin/dashboard', icon: '📊', label: 'Dashboard', aria: 'Admin dashboard' },
  { path: '/admin/doctors', icon: '👨‍⚕️', label: 'Doctors', aria: 'Manage doctors' },
  { path: '/admin/consultations', icon: '🩺', label: 'Sessions', aria: 'Consultations' },
  { path: '/admin/users', icon: '👥', label: 'Users', aria: 'Manage users' },
  { path: '/admin/notifications', icon: '🔔', label: 'Alerts', aria: 'Notifications' }
];

function getTabsForRole(role) {
  if (role === 'doctor') return DOCTOR_TABS;
  if (role === 'admin') return ADMIN_TABS;
  return PATIENT_TABS;
}

function isActive(path, currentPath, tab) {
  if (tab.bookFlow) {
    return currentPath === '/patient/book' || currentPath.startsWith('/patient/book');
  }
  return currentPath === path || currentPath.startsWith(path + '/');
}

function bindNavItem(el) {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    if (el.dataset.bookFlow === 'true') {
      window.openBookingFlow?.();
      return;
    }
    const href = el.getAttribute('href');
    if (href && href !== '#') {
      window.location.hash = href;
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  });
}

export function renderBottomNav(currentPath = '') {
  const user = getUser();
  const role = getRole();
  const existing = document.getElementById('vc-bottom-nav');
  if (existing) existing.remove();

  const path = currentPath || (window.location.hash.slice(1) || '/');
  const isDashboard = path.startsWith('/patient/') || path.startsWith('/doctor/') || path.startsWith('/admin/');
  const isVideo = path.startsWith('/video/');

  document.body.classList.toggle('has-vc-bottom-nav', !!(user && isDashboard && !isVideo));

  if (!user || !isDashboard || isVideo || window.innerWidth >= 1024) {
    return;
  }

  const tabs = getTabsForRole(role);
  const nav = document.createElement('nav');
  nav.id = 'vc-bottom-nav';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Main navigation');

  nav.innerHTML = `
    <div class="vc-bottom-nav-inner">
      ${tabs.map((tab) => {
        const active = isActive(tab.path, path, tab) ? ' active' : '';
        if (tab.bookFlow) {
          return `<button type="button" class="vc-bottom-nav-item${active}" data-book-flow="true" aria-label="${tab.aria}">
            <span class="vc-nav-icon" aria-hidden="true">${tab.icon}</span>
            <span>${tab.label}</span>
          </button>`;
        }
        return `<a href="${tab.path}" class="vc-bottom-nav-item${active}" aria-label="${tab.aria}" aria-current="${active ? 'page' : 'false'}">
          <span class="vc-nav-icon" aria-hidden="true">${tab.icon}</span>
          <span>${tab.label}</span>
        </a>`;
      }).join('')}
    </div>
  `;

  nav.querySelectorAll('.vc-bottom-nav-item').forEach(bindNavItem);
  document.body.appendChild(nav);
}

export function removeBottomNav() {
  document.getElementById('vc-bottom-nav')?.remove();
  document.body.classList.remove('has-vc-bottom-nav');
}
