import { getUser, getRole } from './api.js';
import { logout, returnToHome } from '../auth.js';
import { escapeHtml, initials, formatDoctorName } from './utils.js';

export function renderPatientShell(path, contentHtml) {
  const user = getUser();
  const nav = [
    { path: '/patient/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/patient/book', icon: '📅', label: 'Book', bookFlow: true },
    { path: '/patient/upcoming', icon: '⏰', label: 'Upcoming', badge: 'upcoming' },
    { path: '/patient/history', icon: '📋', label: 'History' },
    { path: '/patient/messages', icon: '💬', label: 'Messages', badge: 'messages' },
    { path: '/patient/ai', icon: '🤖', label: 'VirtualAI' },
    { path: '/patient/prescriptions', icon: '💊', label: 'Prescriptions' },
    { path: '/patient/records', icon: '📁', label: 'Records' },
    { path: '/patient/payments', icon: '💳', label: 'Payments' },
    { path: '/patient/reviews', icon: '⭐', label: 'Reviews' },
    { path: '/patient/profile', icon: '👤', label: 'Profile' }
  ];

  return `
    <div class="dash-shell patient-shell">
      <aside class="dash-sidebar patient-sidebar" id="dash-sidebar">
        <div class="sidebar-profile">
          <div class="sidebar-avatar">${initials(user?.name, user?.surname)}</div>
          <strong>${escapeHtml(user?.name)} ${escapeHtml(user?.surname)}</strong>
          <small>Patient ID: #P-${String(user?._id || '').slice(-5).toUpperCase()}</small>
        </div>
        <nav class="sidebar-nav">
          ${nav.map((n) => n.bookFlow
            ? `<a href="#" data-book-flow data-tab="book" class="nav-item ${path === n.path ? 'active' : ''}" data-badge="${n.badge || ''}">
              <span class="nav-icon">${n.icon}</span><span class="nav-label">${n.label}</span><span class="nav-badge hidden"></span></a>`
            : `<a href="${n.path}" data-link class="${path === n.path ? 'active' : ''}" data-badge="${n.badge || ''}">
              <span class="nav-icon">${n.icon}</span> ${n.label}<span class="nav-badge hidden"></span></a>`
          ).join('')}
        </nav>
        <button type="button" class="btn-back-to-home" id="sidebar-home">🏠 Back to Home</button>
        <button class="sidebar-logout" id="sidebar-logout">🚪 Sign Out</button>
      </aside>
      <div class="dash-main"><div class="dash-content container-fluid">${contentHtml}</div></div>
      <nav class="mobile-bottom-nav mobile-tab-bar">
        <a href="/patient/dashboard" data-link class="mobile-nav-item ${path === '/patient/dashboard' ? 'active' : ''}">
          <span class="mobile-nav-icon">📊</span><span>Home</span>
        </a>
        <a href="#" data-book-flow data-tab="book" class="mobile-nav-item nav-item ${path === '/patient/book' ? 'active' : ''}">
          <span class="mobile-nav-icon">📅</span><span class="nav-label">Book</span>
        </a>
        <a href="/patient/messages" data-link class="mobile-nav-item ${path === '/patient/messages' ? 'active' : ''}">
          <span class="mobile-nav-icon">💬</span><span>Messages</span>
        </a>
        <a href="/patient/ai" data-link class="mobile-nav-item ${path === '/patient/ai' ? 'active' : ''}">
          <span class="mobile-nav-icon">🤖</span><span>VirtualAI</span>
        </a>
        <a href="/patient/profile" data-link class="mobile-nav-item ${path === '/patient/profile' ? 'active' : ''}">
          <span class="mobile-nav-icon">👤</span><span>Profile</span>
        </a>
      </nav>
    </div>
  `;
}

export function renderDoctorShell(path, contentHtml, doctor) {
  const nav = [
    { path: '/doctor/dashboard', icon: '📊', label: 'Overview' },
    { path: '/doctor/patients', icon: '👥', label: 'Patients' },
    { path: '/doctor/schedule', icon: '📅', label: 'Schedule' },
    { path: '/doctor/messages', icon: '💬', label: 'Messages' },
    { path: '/doctor/prescriptions', icon: '💊', label: 'Prescriptions' },
    { path: '/doctor/payouts', icon: '💰', label: 'Payouts' },
    { path: '/doctor/credentials', icon: '🎓', label: 'Credentials' },
    { path: '/doctor/reviews', icon: '⭐', label: 'Reviews' },
    { path: '/doctor/records', icon: '📁', label: 'Med Records' },
    { path: '/doctor/profile', icon: '👨‍⚕️', label: 'Profile' },
    { path: '/doctor/settings', icon: '⚙️', label: 'Settings' }
  ];
  const st = doctor?.availabilityStatus || 'red';

  return `
    <div class="dash-shell doctor-shell">
      <aside class="dash-sidebar doctor-sidebar">
        <div class="sidebar-profile doctor-sidebar-profile">
          <div class="sidebar-avatar doctor-sidebar-avatar">${initials(doctor?.name, doctor?.surname)}</div>
          <strong class="doctor-sidebar-name">${escapeHtml(formatDoctorName(doctor))}</strong>
          <small class="doctor-specialty">${escapeHtml(doctor?.specialty || '')}</small>
        </div>
        <div class="status-toggle-group">
          <button data-st="green" class="${st === 'green' ? 'active' : ''}">🟢 Free</button>
          <button data-st="amber" class="${st === 'amber' ? 'active' : ''}">🟡 Busy</button>
          <button data-st="red" class="${st === 'red' ? 'active' : ''}">🔴 Away</button>
        </div>
        <nav class="sidebar-nav">
          ${nav.map((n) => `<a href="${n.path}" data-link class="${path === n.path ? 'active' : ''}">
            <span class="nav-icon">${n.icon}</span> ${n.label}</a>`).join('')}
        </nav>
        <button type="button" class="btn-back-to-home" id="sidebar-home">🏠 Back to Home</button>
        <button class="sidebar-logout" id="sidebar-logout">🚪 Sign Out</button>
      </aside>
      <div class="dash-main">
        <div class="doctor-top-banner doctor-banner">
          <div class="hex-avatar-wrap">
            <div class="hex-avatar">${initials(doctor?.name, doctor?.surname)}</div>
            <span class="hex-verified">✓</span>
            <span class="hex-status-ring status-ring-lg status-${st}"></span>
          </div>
          <div class="doctor-banner-info">
            <small class="mdcn-badge verified-badge-text">${doctor?.isVerified ? '✅ MDCN Verified' : 'Pending MDCN'}</small>
            <span class="doctor-specialty doctor-meta banner-meta"> · ${escapeHtml(doctor?.specialty || '')}</span>
            <h2 class="doctor-name">${escapeHtml(formatDoctorName(doctor))}</h2>
            <p class="doctor-hospital doctor-subtitle">${escapeHtml(doctor?.hospitalAffiliation || '')} · ${doctor?.yearsOfExperience || 0} years</p>
            <div class="doc-stat-pills banner-pills">
              <span class="stat-pill banner-pill">⭐ ${doctor?.rating || '—'}</span>
              <span class="stat-pill banner-pill">📝 ${doctor?.reviewCount || 0}</span>
              <span class="stat-pill banner-pill">👥 ${doctor?.totalConsultations || 0}</span>
            </div>
          </div>
        </div>
        <div class="dash-content container-fluid">${contentHtml}</div>
      </div>
    </div>
  `;
}

export function renderAdminShell(path, contentHtml) {
  const nav = [
    { path: '/admin/dashboard', label: 'Dashboard' },
    { path: '/admin/users', label: 'Users' },
    { path: '/admin/doctors', label: 'Doctors' },
    { path: '/admin/consultations', label: 'Consultations' },
    { path: '/admin/live-sessions', icon: '🔴', label: 'Live Sessions', badge: '3' },
    { path: '/admin/marketing', icon: '📣', label: 'Marketing' },
    { path: '/admin/revenue', label: 'Revenue' },
    { path: '/admin/notifications', icon: '🔔', label: 'Notifications', badge: '4', badgeClass: 'sidebar-notif-badge' }
  ];
  return `
    <div class="dash-shell admin-shell">
      <aside class="dash-sidebar admin-sidebar">
        <div class="admin-brand">Admin Panel</div>
        <nav class="sidebar-nav">${nav.map((n) => {
          const label = n.icon ? `${n.icon} ${n.label}` : n.label;
          const badge = n.badge
            ? `<span class="${n.badgeClass || 'sidebar-badge'}">${n.badge}</span>`
            : '';
          return `<a href="${n.path}" data-link class="${path === n.path ? 'active' : ''}">${label}${badge}</a>`;
        }).join('')}</nav>
        <button class="sidebar-logout" id="sidebar-logout">Sign Out</button>
      </aside>
      <div class="dash-main"><div class="dash-content container-fluid">${contentHtml}</div></div>
    </div>
  `;
}

export function bindShellEvents(container, roleHandlers = {}) {
  container.querySelectorAll('[data-book-flow]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.openBookingFlow?.();
    });
  });
  container.querySelectorAll('[data-link]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = a.getAttribute('href');
    });
  });
  container.querySelector('#sidebar-logout')?.addEventListener('click', () => logout());
  container.querySelector('#sidebar-home')?.addEventListener('click', () => returnToHome());
  container.querySelectorAll('.status-toggle-group button').forEach((btn) => {
    btn.addEventListener('click', () => roleHandlers.onStatus?.(btn.dataset.st));
  });
}
