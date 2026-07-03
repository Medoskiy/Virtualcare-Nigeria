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
  const doctorAvatar = doctor?.avatar
    ? (doctor.avatar.startsWith('http')
        ? `<img src="${escapeHtml(doctor.avatar)}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,0.3)" alt="Avatar">`
        : `<div style="width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:36px;border:3px solid rgba(255,255,255,0.3)">${escapeHtml(doctor.avatar)}</div>`)
    : `<div style="width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff;border:3px solid rgba(255,255,255,0.3)">${initials(doctor?.name, doctor?.surname)}</div>`;

  return `
    <div class="dash-shell doctor-shell">
      <!-- Sidebar overlay for mobile -->
      <div id="doctor-sidebar-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9998"></div>

      <aside class="dash-sidebar doctor-sidebar" id="doctor-sidebar">
        <div class="sidebar-profile doctor-sidebar-profile" style="padding:20px 16px 12px;text-align:center">
          <!-- Avatar with change button -->
          <div style="position:relative;display:inline-block;margin-bottom:10px">
            <div class="sidebar-avatar doctor-sidebar-avatar" id="doctor-avatar-display" style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#1d6aba,#0a2463);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff;margin:0 auto;cursor:pointer">
              ${initials(doctor?.name, doctor?.surname)}
            </div>
            <button type="button" id="doctor-change-avatar-btn" style="position:absolute;bottom:-2px;right:-2px;background:#1d6aba;border:2px solid #fff;border-radius:50%;width:24px;height:24px;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff" title="Change avatar">✏️</button>
          </div>
          <strong class="doctor-sidebar-name" style="display:block;font-size:14px;color:var(--deep-blue)">${escapeHtml(formatDoctorName(doctor))}</strong>
          <small class="doctor-specialty" style="color:var(--muted);font-size:12px">${escapeHtml(doctor?.specialty || '')}</small>
          <!-- Avatar picker (hidden by default) -->
          <div id="doctor-avatar-picker" style="display:none;margin-top:12px;padding:10px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0">
            <p style="font-size:11px;color:#64748b;margin:0 0 8px;font-weight:600">Pick an avatar:</p>
            <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">
              ${['👨‍⚕️','👩‍⚕️','🧑‍⚕️','👨🏿‍⚕️','👩🏿‍⚕️','👨🏾‍⚕️','👩🏾‍⚕️','👨🏽‍⚕️','👩🏽‍⚕️','🩺','💊','🏥'].map(emoji => `
                <button type="button" class="doctor-avatar-emoji" data-emoji="${emoji}" style="font-size:24px;background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;padding:4px 6px;cursor:pointer;transition:border-color 0.2s">${emoji}</button>
              `).join('')}
            </div>
            <button type="button" id="doctor-avatar-cancel" style="margin-top:8px;width:100%;padding:6px;background:transparent;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;cursor:pointer;color:#64748b">Cancel</button>
          </div>
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
        <!-- Mobile header bar -->
        <div id="doctor-mobile-header" style="display:none;align-items:center;justify-content:space-between;padding:12px 16px;background:#0a2463;color:#fff;position:sticky;top:0;z-index:100;gap:12px">
          <button type="button" id="doctor-menu-btn" style="background:rgba(255,255,255,0.15);border:none;border-radius:8px;padding:8px 12px;color:#fff;font-size:20px;cursor:pointer;flex-shrink:0;line-height:1">☰</button>
          <span style="font-size:15px;font-weight:700;color:#fff;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Dr. ${escapeHtml(doctor?.name || '')}</span>
          <div style="display:flex;gap:4px;flex-shrink:0">
            <button data-st="green" style="background:${st === 'green' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)'};border:none;border-radius:6px;padding:5px 8px;color:#fff;font-size:11px;font-weight:600;cursor:pointer">🟢</button>
            <button data-st="amber" style="background:${st === 'amber' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)'};border:none;border-radius:6px;padding:5px 8px;color:#fff;font-size:11px;font-weight:600;cursor:pointer">🟡</button>
            <button data-st="red" style="background:${st === 'red' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)'};border:none;border-radius:6px;padding:5px 8px;color:#fff;font-size:11px;font-weight:600;cursor:pointer">🔴</button>
          </div>
        </div>

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
  // Book flow buttons
  container.querySelectorAll('[data-book-flow]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.openBookingFlow?.();
    });
  });

  // Data-link navigation
  container.querySelectorAll('[data-link]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = a.getAttribute('href');
    });
  });

  // Sidebar logout and home
  container.querySelector('#sidebar-logout')?.addEventListener('click', () => logout());
  container.querySelector('#sidebar-home')?.addEventListener('click', () => returnToHome());

  // Status toggle (sidebar desktop)
  container.querySelectorAll('.status-toggle-group button').forEach((btn) => {
    btn.addEventListener('click', () => roleHandlers.onStatus?.(btn.dataset.st));
  });

  // ── DOCTOR MOBILE: hamburger menu ──────────────────────
  const menuBtn = container.querySelector('#doctor-menu-btn');
  const sidebar = container.querySelector('#doctor-sidebar');
  const overlay = container.querySelector('#doctor-sidebar-overlay');
  const mobileHeader = container.querySelector('#doctor-mobile-header');

  // Show mobile header on small screens
  if (mobileHeader && window.innerWidth <= 768) {
    mobileHeader.style.display = 'flex';
  }
  window.addEventListener('resize', () => {
    if (!mobileHeader) return;
    mobileHeader.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
  });

  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
      const isOpen = sidebar.classList.toggle('is-open');
      if (overlay) overlay.style.display = isOpen ? 'block' : 'none';
    });
    overlay?.addEventListener('click', () => {
      sidebar.classList.remove('is-open');
      if (overlay) overlay.style.display = 'none';
    });
    sidebar.querySelectorAll('a[data-link]').forEach((a) => {
      a.addEventListener('click', () => {
        sidebar.classList.remove('is-open');
        if (overlay) overlay.style.display = 'none';
      });
    });
  }

  // Mobile header status buttons
  container.querySelectorAll('#doctor-mobile-header button[data-st]').forEach((btn) => {
    btn.addEventListener('click', () => roleHandlers.onStatus?.(btn.dataset.st));
  });

  // ── DOCTOR AVATAR PICKER ────────────────────────────────
  const avatarBtn = container.querySelector('#doctor-change-avatar-btn');
  const avatarPicker = container.querySelector('#doctor-avatar-picker');
  const avatarDisplay = container.querySelector('#doctor-avatar-display');
  const avatarCancel = container.querySelector('#doctor-avatar-cancel');

  avatarBtn?.addEventListener('click', () => {
    if (avatarPicker) avatarPicker.style.display = avatarPicker.style.display === 'none' ? 'block' : 'none';
  });

  avatarCancel?.addEventListener('click', () => {
    if (avatarPicker) avatarPicker.style.display = 'none';
  });

  container.querySelectorAll('.doctor-avatar-emoji').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const emoji = btn.dataset.emoji;
      if (avatarDisplay) {
        avatarDisplay.textContent = emoji;
        avatarDisplay.style.fontSize = '36px';
      }
      if (avatarPicker) avatarPicker.style.display = 'none';

      // Save to localStorage
      localStorage.setItem('vc_doctor_avatar', emoji);

      // Save to backend
      try {
        const token = localStorage.getItem('vc_token') || localStorage.getItem('token');
        await fetch('/api/doctors/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ avatar: emoji })
        });
      } catch { /* saved locally */ }

      // Toast
      if (typeof window.showToast === 'function') window.showToast('Avatar updated!', 'success');
    });
  });
}
