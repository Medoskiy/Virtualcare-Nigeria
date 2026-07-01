import { getUser, getRole } from './api.js';
import { logout } from '../auth.js';
import { initials, escapeHtml } from './utils.js';

let drawerInitialized = false;

const GUEST_LINKS = [
  { group: 'Explore', items: [
    { href: '/', icon: '🏠', label: 'Home' },
    { href: '/find-a-doctor', icon: '🔍', label: 'Find a Doctor' },
    { href: '/how-it-works', icon: 'ℹ️', label: 'How It Works' },
    { href: '/blog', icon: '📰', label: 'Blog & Health Tips' },
    { href: '/for-doctors', icon: '👨‍⚕️', label: 'For Doctors' }
  ]}
];

const PATIENT_LINKS = [
  { group: 'Care', items: [
    { href: '/patient/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/patient/book', icon: '📅', label: 'Book Appointment', bookFlow: true },
    { href: '/patient/upcoming', icon: '⏰', label: 'Upcoming' },
    { href: '/patient/ai', icon: '🤖', label: 'VirtualAI' }
  ]},
  { group: 'Health Records', items: [
    { href: '/patient/prescriptions', icon: '💊', label: 'Prescriptions' },
    { href: '/patient/records', icon: '📁', label: 'Medical Records' },
    { href: '/patient/history', icon: '📋', label: 'History' }
  ]},
  { group: 'Account', items: [
    { href: '/patient/messages', icon: '💬', label: 'Messages' },
    { href: '/patient/payments', icon: '💳', label: 'Payments' },
    { href: '/patient/profile', icon: '👤', label: 'Profile' }
  ]}
];

const DOCTOR_LINKS = [
  { group: 'Practice', items: [
    { href: '/doctor/dashboard', icon: '📊', label: 'Overview' },
    { href: '/doctor/patients', icon: '👥', label: 'Patients' },
    { href: '/doctor/schedule', icon: '📅', label: 'Schedule' },
    { href: '/doctor/messages', icon: '💬', label: 'Messages' }
  ]},
  { group: 'Professional', items: [
    { href: '/doctor/prescriptions', icon: '💊', label: 'Prescriptions' },
    { href: '/doctor/payouts', icon: '💰', label: 'Payouts' },
    { href: '/doctor/reviews', icon: '⭐', label: 'Reviews' },
    { href: '/doctor/credentials', icon: '🎓', label: 'Credentials' },
    { href: '/doctor/profile', icon: '👨‍⚕️', label: 'Profile' },
    { href: '/doctor/settings', icon: '⚙️', label: 'Settings' }
  ]}
];

const ADMIN_LINKS = [
  { group: 'Administration', items: [
    { href: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/admin/users', icon: '👥', label: 'Users' },
    { href: '/admin/doctors', icon: '👨‍⚕️', label: 'Doctors' },
    { href: '/admin/consultations', icon: '🩺', label: 'Consultations' }
  ]},
  { group: 'Operations', items: [
    { href: '/admin/live-sessions', icon: '🔴', label: 'Live Sessions' },
    { href: '/admin/revenue', icon: '💰', label: 'Revenue' },
    { href: '/admin/marketing', icon: '📣', label: 'Marketing' },
    { href: '/admin/notifications', icon: '🔔', label: 'Notifications' }
  ]}
];

function getMenuGroups(role) {
  if (role === 'doctor') return DOCTOR_LINKS;
  if (role === 'admin') return ADMIN_LINKS;
  if (role === 'patient') return PATIENT_LINKS;
  return GUEST_LINKS;
}

function closeDrawer() {
  document.getElementById('vc-drawer-backdrop')?.classList.remove('open');
  document.getElementById('vc-mobile-drawer')?.classList.remove('open');
  document.body.style.overflow = '';
}

function renderDrawerContent() {
  const drawer = document.getElementById('vc-mobile-drawer');
  if (!drawer) return;

  const user = getUser();
  const role = getRole();
  const groups = getMenuGroups(user ? role : null);

  const userBlock = user ? `
    <div class="vc-drawer-user">
      <div class="vc-drawer-avatar">${initials(user.name, user.surname)}</div>
      <div class="vc-drawer-user-info">
        <strong>${escapeHtml(user.name)} ${escapeHtml(user.surname)}</strong>
        <small>${role} account</small>
      </div>
    </div>
  ` : `
    <a href="/" class="vc-mobile-logo" data-drawer-link style="font-size:1.2rem">⊕ Virtual<span>care</span></a>
  `;

  const linksHtml = groups.map((g) => `
    <div class="vc-drawer-group">
      <div class="vc-drawer-group-title">${g.group}</div>
      ${g.items.map((item) => item.bookFlow
        ? `<button type="button" class="vc-drawer-link" data-book-flow="true">
            <span class="drawer-icon">${item.icon}</span>${item.label}
          </button>`
        : `<a href="${item.href}" class="vc-drawer-link" data-drawer-link>
            <span class="drawer-icon">${item.icon}</span>${item.label}
          </a>`
      ).join('')}
    </div>
  `).join('');

  const footerHtml = user ? `
    <button type="button" class="vc-drawer-logout" id="vc-drawer-logout">
      🚪 Sign Out
    </button>
  ` : `
    <div class="vc-drawer-auth-btns">
      <a href="/login" class="drawer-login" data-drawer-link>Login</a>
      <a href="/register" class="drawer-register" data-drawer-link>Register</a>
    </div>
  `;

  drawer.innerHTML = `
    <div class="vc-drawer-header">
      ${userBlock}
      <button type="button" class="vc-drawer-close" id="vc-drawer-close" aria-label="Close menu">×</button>
    </div>
    <div class="vc-drawer-scroll">${linksHtml}</div>
    <div class="vc-drawer-footer">${footerHtml}</div>
  `;

  drawer.querySelector('#vc-drawer-close')?.addEventListener('click', closeDrawer);
  drawer.querySelector('#vc-drawer-logout')?.addEventListener('click', () => {
    closeDrawer();
    logout();
  });

  drawer.querySelectorAll('[data-drawer-link]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      closeDrawer();
      window.location.hash = a.getAttribute('href');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
  });

  drawer.querySelectorAll('[data-book-flow]').forEach((btn) => {
    btn.addEventListener('click', () => {
      closeDrawer();
      window.openBookingFlow?.();
    });
  });
}

export function initMobileDrawer() {
  if (drawerInitialized) return;
  drawerInitialized = true;

  let backdrop = document.getElementById('vc-drawer-backdrop');
  let drawer = document.getElementById('vc-mobile-drawer');

  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'vc-drawer-backdrop';
    backdrop.className = 'vc-drawer-backdrop';
    document.body.appendChild(backdrop);
  }

  if (!drawer) {
    drawer = document.createElement('aside');
    drawer.id = 'vc-mobile-drawer';
    drawer.className = 'vc-mobile-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', 'Navigation menu');
    document.body.appendChild(drawer);
  }

  backdrop.addEventListener('click', closeDrawer);

  // Legacy nav toggle still opens drawer on mobile
  document.getElementById('nav-toggle')?.addEventListener('click', (e) => {
    if (window.innerWidth < 1024) {
      e.preventDefault();
      openMobileDrawer();
    }
  });
}

export function openMobileDrawer() {
  initMobileDrawer();
  renderDrawerContent();
  document.getElementById('vc-drawer-backdrop')?.classList.add('open');
  document.getElementById('vc-mobile-drawer')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function setupMobileDrawer() {
  initMobileDrawer();
  renderDrawerContent();
}
