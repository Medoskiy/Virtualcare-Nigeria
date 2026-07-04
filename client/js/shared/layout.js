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
            ? `<a href="#" data-book-flow data-tab="book" class="nav-item ${path === n.path ? 'active' : ''}" data-badge="${n.badge || ''}"><span class="nav-icon">${n.icon}</span><span class="nav-label">${n.label}</span><span class="nav-badge hidden"></span></a>`
            : `<a href="${n.path}" data-link class="${path === n.path ? 'active' : ''}" data-badge="${n.badge || ''}"><span class="nav-icon">${n.icon}</span> ${n.label}<span class="nav-badge hidden"></span></a>`
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
  return `
    <div class="dash-shell doctor-shell">
      <div id="doctor-sidebar-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9998"></div>
      <aside id="doctor-sidebar" class="dash-sidebar doctor-sidebar" style="transition:left 0.3s ease">
        <div class="sidebar-profile doctor-sidebar-profile" style="padding:20px 16px 12px;text-align:center">
          <div style="position:relative;display:inline-block;margin-bottom:10px">
            <div id="doctor-avatar-display" style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#1d6aba,#0a2463);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff;margin:0 auto;border:3px solid rgba(255,255,255,0.2)">${initials(doctor?.name, doctor?.surname)}</div>
            <button type="button" id="doctor-change-avatar-btn" title="Change avatar" style="position:absolute;bottom:0;right:0;background:#1d6aba;border:2px solid #fff;border-radius:50%;width:26px;height:26px;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;padding:0;min-height:unset;min-width:unset">✏️</button>
          </div>
          <strong style="display:block;font-size:14px;color:#0a2463;margin-bottom:2px">${escapeHtml(formatDoctorName(doctor))}</strong>
          <small style="color:#64748b;font-size:12px">${escapeHtml(doctor?.specialty || '')}</small>
          <div id="doctor-avatar-picker" style="display:none;margin-top:12px;padding:10px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0">
            <p style="font-size:11px;color:#64748b;margin:0 0 8px;font-weight:600;text-align:left">Pick your avatar:</p>
            <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">
              ${['👨‍⚕️','👩‍⚕️','🧑‍⚕️','👨🏿‍⚕️','👩🏿‍⚕️','👨🏾‍⚕️','👩🏾‍⚕️','👨🏽‍⚕️','👩🏽‍⚕️','🩺','💊','🏥'].map((e) => `<button type="button" class="doctor-avatar-emoji" data-emoji="${e}" style="font-size:22px;background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;padding:4px 6px;cursor:pointer;min-height:unset;min-width:unset">${e}</button>`).join('')}
            </div>
            <button type="button" id="doctor-avatar-cancel" style="margin-top:8px;width:100%;padding:6px;background:transparent;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;cursor:pointer;color:#64748b;min-height:unset">Cancel</button>
          </div>
        </div>
        <div class="status-toggle-group">
          <button data-st="green" data-tooltip="Available for consultations" class="${st === 'green' ? 'active' : ''}">🟢 Free</button>
          <button data-st="amber" data-tooltip="Temporarily busy" class="${st === 'amber' ? 'active' : ''}">🟡 Busy</button>
          <button data-st="red" data-tooltip="Away / Offline" class="${st === 'red' ? 'active' : ''}">🔴 Away</button>
        </div>
        <nav class="sidebar-nav">
          ${nav.map((n) => `<a href="${n.path}" data-link class="${path === n.path ? 'active' : ''}"><span class="nav-icon" style="font-size:18px;width:24px;flex-shrink:0;display:inline-block">${n.icon}</span><span style="display:inline;font-size:14px">${n.label}</span></a>`).join('')}
        </nav>
        <button type="button" class="btn-back-to-home" id="sidebar-home" style="display:flex;align-items:center;gap:8px;padding:10px 14px;margin:8px 12px 4px;width:calc(100% - 24px);background:#f0fdf4;color:#166534;border:1.5px solid #bbf7d0;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;box-sizing:border-box">🏠 Back to Home</button>
        <button class="sidebar-logout" id="sidebar-logout" style="display:flex;align-items:center;gap:8px;padding:10px 14px;margin:4px 12px 20px;width:calc(100% - 24px);background:#fef2f2;color:#dc2626;border:1.5px solid #fecaca;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;box-sizing:border-box">🚪 Sign Out</button>
      </aside>
      <div class="dash-main">
        <div id="doctor-mobile-header" style="display:none;align-items:center;justify-content:space-between;padding:12px 16px;background:#0a2463;color:#fff;position:sticky;top:0;z-index:100;gap:10px;min-height:52px">
          <button type="button" id="doctor-menu-btn" style="background:rgba(255,255,255,0.18);border:none;border-radius:8px;width:40px;height:40px;color:#fff;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;min-height:unset;min-width:unset;line-height:1">☰</button>
          <span style="font-size:15px;font-weight:700;color:#fff;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Dr. ${escapeHtml(doctor?.name || '')}</span>
          <div style="display:flex;gap:4px;flex-shrink:0">
            <button data-mobile-st="green" style="background:${st === 'green' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'};border:none;border-radius:6px;padding:5px 8px;color:#fff;font-size:12px;cursor:pointer;min-height:unset;min-width:unset">🟢</button>
            <button data-mobile-st="amber" style="background:${st === 'amber' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'};border:none;border-radius:6px;padding:5px 8px;color:#fff;font-size:12px;cursor:pointer;min-height:unset;min-width:unset">🟡</button>
            <button data-mobile-st="red" style="background:${st === 'red' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'};border:none;border-radius:6px;padding:5px 8px;color:#fff;font-size:12px;cursor:pointer;min-height:unset;min-width:unset">🔴</button>
          </div>
        </div>
        <div class="doctor-top-banner doctor-banner">
          <div class="hex-avatar-wrap">
            <div class="hex-avatar" id="doc-banner-avatar">${initials(doctor?.name, doctor?.surname)}</div>
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
    { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/admin/users', icon: '👥', label: 'Users' },
    { path: '/admin/doctors', icon: '👨‍⚕️', label: 'Doctors' },
    { path: '/admin/consultations', icon: '🎥', label: 'Consultations' },
    { path: '/admin/live-sessions', icon: '🔴', label: 'Live Sessions', badge: '3' },
    { path: '/admin/marketing', icon: '📣', label: 'Marketing' },
    { path: '/admin/revenue', icon: '💰', label: 'Revenue' },
    { path: '/admin/notifications', icon: '🔔', label: 'Notifications', badge: '4', badgeClass: 'sidebar-notif-badge' }
  ];
  return `
    <div class="dash-shell admin-shell">
      <div id="admin-sidebar-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9998"></div>
      <aside id="admin-sidebar" class="dash-sidebar admin-sidebar" style="transition:left 0.3s ease">
        <div style="padding:16px 16px 10px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:8px">
          <span style="font-size:20px;font-weight:900;color:#0a2463">Virtual</span><span style="font-size:20px;font-weight:900;color:#1d6aba">care</span>
          <span style="font-size:10px;background:#dc2626;color:#fff;padding:2px 6px;border-radius:4px;font-weight:700;margin-left:auto">ADMIN</span>
        </div>
        <nav class="sidebar-nav" style="padding:8px 0">
          ${nav.map((n) => {
            const badge = n.badge ? `<span class="${n.badgeClass || 'sidebar-badge'}" style="margin-left:auto">${n.badge}</span>` : '';
            return `<a href="${n.path}" data-link class="${path === n.path ? 'active' : ''}" style="display:flex;align-items:center;gap:10px;padding:12px 16px;font-size:13.5px;font-weight:500;color:#334155;text-decoration:none;border-left:3px solid transparent;transition:all 0.2s"><span style="font-size:16px;width:22px;text-align:center;flex-shrink:0">${n.icon}</span><span style="flex:1">${n.label}</span>${badge}</a>`;
          }).join('')}
        </nav>
        <div style="padding:8px 12px 16px">
          <a href="/" data-link style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:#f0fdf4;color:#166534;border:1.5px solid #bbf7d0;border-radius:10px;font-size:13px;font-weight:600;text-decoration:none;margin-bottom:8px">🏠 Back to Home</a>
          <button class="sidebar-logout" id="sidebar-logout" style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:#fef2f2;color:#dc2626;border:1.5px solid #fecaca;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;width:100%">🚪 Sign Out</button>
        </div>
      </aside>
      <div class="dash-main">
        <div id="admin-mobile-header" style="display:none;align-items:center;justify-content:space-between;padding:12px 16px;background:#0a2463;color:#fff;position:sticky;top:0;z-index:100;gap:10px;min-height:52px">
          <button type="button" id="admin-menu-btn" style="background:rgba(255,255,255,0.18);border:none;border-radius:8px;width:40px;height:40px;color:#fff;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;min-height:unset;min-width:unset;line-height:1">☰</button>
          <div style="flex:1;text-align:center">
            <span style="font-size:16px;font-weight:900;color:#fff">Virtual</span><span style="font-size:16px;font-weight:900;color:#7ec8f7">care</span>
            <span style="font-size:10px;background:#dc2626;color:#fff;padding:1px 6px;border-radius:4px;font-weight:700;margin-left:6px">ADMIN</span>
          </div>
          <div style="width:40px;flex-shrink:0"></div>
        </div>
        <div class="dash-content container-fluid">${contentHtml}</div>
      </div>
    </div>
  `;
}

export function bindShellEvents(container, roleHandlers = {}) {
  container.querySelectorAll('[data-book-flow]').forEach((el) => {
    el.addEventListener('click', (e) => { e.preventDefault(); window.openBookingFlow?.(); });
  });
  container.querySelectorAll('[data-link]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = a.getAttribute('href');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
  });
  container.querySelector('#sidebar-logout')?.addEventListener('click', () => logout());
  container.querySelector('#sidebar-home')?.addEventListener('click', () => returnToHome());
  container.querySelectorAll('.status-toggle-group button').forEach((btn) => {
    btn.addEventListener('click', () => roleHandlers.onStatus?.(btn.dataset.st));
  });

  // DOCTOR MOBILE MENU
  const docSidebar   = container.querySelector('#doctor-sidebar');
  const docOverlay   = container.querySelector('#doctor-sidebar-overlay');
  const docMenuBtn   = container.querySelector('#doctor-menu-btn');
  const docMobileHdr = container.querySelector('#doctor-mobile-header');

  function openDocSidebar()  { if (docSidebar) { docSidebar.style.left = '0px';    if (docOverlay) docOverlay.style.display = 'block'; } }
  function closeDocSidebar() { if (docSidebar) { docSidebar.style.left = '-300px'; if (docOverlay) docOverlay.style.display = 'none';  } }

  function applyDocMobile() {
    if (!docSidebar || !docMobileHdr) return;
    if (window.innerWidth <= 768) {
      docMobileHdr.style.display  = 'flex';
      docSidebar.style.display    = 'block';
      docSidebar.style.position   = 'fixed';
      docSidebar.style.top        = '0';
      docSidebar.style.left       = '-300px';
      docSidebar.style.height     = '100vh';
      docSidebar.style.width      = '260px';
      docSidebar.style.zIndex     = '9999';
      docSidebar.style.overflowY  = 'auto';
      docSidebar.style.boxShadow  = '4px 0 20px rgba(0,0,0,0.2)';
      docSidebar.style.background = '#ffffff';
    } else {
      docMobileHdr.style.display = 'none';
      docSidebar.style.position  = '';
      docSidebar.style.top       = '';
      docSidebar.style.left      = '';
      docSidebar.style.height    = '';
      docSidebar.style.width     = '';
      docSidebar.style.zIndex    = '';
      docSidebar.style.overflowY = '';
      docSidebar.style.boxShadow = '';
      if (docOverlay) docOverlay.style.display = 'none';
    }
  }

  applyDocMobile();
  window.addEventListener('resize', applyDocMobile);
  docMenuBtn?.addEventListener('click', () => { docSidebar?.style.left === '0px' ? closeDocSidebar() : openDocSidebar(); });
  docOverlay?.addEventListener('click', closeDocSidebar);
  docSidebar?.querySelectorAll('a[data-link]').forEach((a) => {
    a.addEventListener('click', () => { if (window.innerWidth <= 768) closeDocSidebar(); });
  });
  container.querySelectorAll('[data-mobile-st]').forEach((btn) => {
    btn.addEventListener('click', () => roleHandlers.onStatus?.(btn.dataset.mobileSt));
  });

  // ADMIN MOBILE MENU
  const adminSidebar   = container.querySelector('#admin-sidebar');
  const adminOverlay   = container.querySelector('#admin-sidebar-overlay');
  const adminMenuBtn   = container.querySelector('#admin-menu-btn');
  const adminMobileHdr = container.querySelector('#admin-mobile-header');

  function openAdminSidebar()  { if (adminSidebar) { adminSidebar.style.left = '0px';    if (adminOverlay) adminOverlay.style.display = 'block'; } }
  function closeAdminSidebar() { if (adminSidebar) { adminSidebar.style.left = '-300px'; if (adminOverlay) adminOverlay.style.display = 'none';  } }

  function applyAdminMobile() {
    if (!adminSidebar || !adminMobileHdr) return;
    if (window.innerWidth <= 768) {
      adminMobileHdr.style.display  = 'flex';
      adminSidebar.style.display    = 'block';
      adminSidebar.style.position   = 'fixed';
      adminSidebar.style.top        = '0';
      adminSidebar.style.left       = '-300px';
      adminSidebar.style.height     = '100vh';
      adminSidebar.style.width      = '260px';
      adminSidebar.style.zIndex     = '9999';
      adminSidebar.style.overflowY  = 'auto';
      adminSidebar.style.boxShadow  = '4px 0 20px rgba(0,0,0,0.2)';
      adminSidebar.style.background = '#ffffff';
    } else {
      adminMobileHdr.style.display = 'none';
      adminSidebar.style.position  = '';
      adminSidebar.style.top       = '';
      adminSidebar.style.left      = '';
      adminSidebar.style.height    = '';
      adminSidebar.style.width     = '';
      adminSidebar.style.zIndex    = '';
      adminSidebar.style.overflowY = '';
      adminSidebar.style.boxShadow = '';
      if (adminOverlay) adminOverlay.style.display = 'none';
    }
  }

  applyAdminMobile();
  window.addEventListener('resize', applyAdminMobile);
  adminMenuBtn?.addEventListener('click', () => { adminSidebar?.style.left === '0px' ? closeAdminSidebar() : openAdminSidebar(); });
  adminOverlay?.addEventListener('click', closeAdminSidebar);
  adminSidebar?.querySelectorAll('a[data-link]').forEach((a) => {
    a.addEventListener('click', () => { if (window.innerWidth <= 768) closeAdminSidebar(); });
  });

  // DOCTOR AVATAR PICKER
  const avatarBtn     = container.querySelector('#doctor-change-avatar-btn');
  const avatarPicker  = container.querySelector('#doctor-avatar-picker');
  const avatarDisplay = container.querySelector('#doctor-avatar-display');
  const avatarCancel  = container.querySelector('#doctor-avatar-cancel');

  avatarBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!avatarPicker) return;
    avatarPicker.style.display = avatarPicker.style.display === 'none' ? 'block' : 'none';
  });
  avatarCancel?.addEventListener('click', () => { if (avatarPicker) avatarPicker.style.display = 'none'; });
  container.querySelectorAll('.doctor-avatar-emoji').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const emoji = btn.dataset.emoji;
      if (avatarDisplay) avatarDisplay.innerHTML = `<span style="font-size:36px;line-height:1">${emoji}</span>`;
      const bannerAvatar = container.querySelector('#doc-banner-avatar, .hex-avatar');
      if (bannerAvatar) { bannerAvatar.textContent = emoji; bannerAvatar.style.fontSize = '36px'; bannerAvatar.style.clipPath = 'none'; bannerAvatar.style.borderRadius = '50%'; }
      if (avatarPicker) avatarPicker.style.display = 'none';
      localStorage.setItem('vc_doctor_avatar', emoji);
      try {
        const token = localStorage.getItem('vc_token') || localStorage.getItem('token');
        await fetch('/api/doctors/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ avatar: emoji }) });
      } catch { /* saved locally */ }
      if (typeof window.showToast === 'function') window.showToast('Avatar updated!', 'success');
    });
  });

  // RESTORE SAVED DOCTOR AVATAR
  try {
    const saved    = JSON.parse(localStorage.getItem('doctorAvatar') || 'null');
    const vcAvatar = localStorage.getItem('vc_doctor_avatar');
    const emoji    = saved?.emoji || vcAvatar;
    if (emoji) {
      const bannerAvatar  = container.querySelector('#doc-banner-avatar, .hex-avatar');
      const sidebarAvatar = container.querySelector('#doctor-avatar-display');
      if (bannerAvatar)  { bannerAvatar.textContent = emoji; bannerAvatar.style.fontSize = '36px'; bannerAvatar.style.clipPath = 'none'; bannerAvatar.style.borderRadius = '50%'; }
      if (sidebarAvatar) sidebarAvatar.innerHTML = `<span style="font-size:36px;line-height:1">${emoji}</span>`;
    }
  } catch { /* ignore */ }
}
