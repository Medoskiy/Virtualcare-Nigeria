import { getUser, getRole } from './api.js';
import { notificationsApi } from './api.js';
import { initials } from './utils.js';
import { openMobileDrawer } from './mobileDrawer.js';

async function getUnreadCount() {
  try {
    const res = await notificationsApi.list();
    return res.data?.unread || 0;
  } catch {
    return 0;
  }
}

function getDashboardPath(role) {
  if (role === 'doctor') return '/doctor/dashboard';
  if (role === 'admin') return '/admin/dashboard';
  return '/patient/dashboard';
}

export async function renderMobileHeader(currentPath = '') {
  const path = currentPath || (window.location.hash.slice(1) || '/');
  const user = getUser();
  const role = getRole();
  const isDashboard = path.startsWith('/patient/') || path.startsWith('/doctor/') || path.startsWith('/admin/');
  const hideOnPaths = ['/login', '/register', '/oauth-callback'];
  const showMobile = window.innerWidth < 1024 && !hideOnPaths.includes(path);

  document.body.classList.toggle('vc-mobile-active', showMobile);

  let header = document.getElementById('vc-mobile-header');
  if (!showMobile) {
    header?.remove();
    return;
  }

  if (!header) {
    header = document.createElement('header');
    header.id = 'vc-mobile-header';
    header.className = 'vc-mobile-header';
    document.body.insertBefore(header, document.getElementById('app'));
  }

  const unread = user ? await getUnreadCount() : 0;
  const dashPath = getDashboardPath(role);

  if (user) {
    header.innerHTML = `
      <div class="vc-mobile-header-inner">
        <a href="${isDashboard ? dashPath : '/'}" class="vc-mobile-logo" data-link aria-label="Virtualcare home">
          ⊕ Virtual<span>care</span>
        </a>
        <div class="vc-mobile-header-actions">
          <button type="button" class="vc-mobile-icon-btn" id="vc-mobile-notif" aria-label="Notifications">
            🔔${unread ? `<span class="badge-count">${unread}</span>` : ''}
          </button>
          <button type="button" class="vc-mobile-icon-btn" id="vc-mobile-menu" aria-label="Open menu">
            <span class="vc-mobile-avatar" aria-hidden="true">${initials(user.name, user.surname)}</span>
          </button>
        </div>
      </div>
    `;
  } else {
    header.innerHTML = `
      <div class="vc-mobile-header-inner">
        <a href="/" class="vc-mobile-logo" data-link aria-label="Virtualcare home">
          ⊕ Virtual<span>care</span>
        </a>
        <div class="vc-mobile-header-actions">
          <button type="button" class="vc-mobile-icon-btn" id="vc-mobile-menu" aria-label="Open menu">☰</button>
          <div class="vc-mobile-auth-btns">
            <a href="/login" data-link class="btn-outline-m">Login</a>
            <a href="/register" data-link class="btn-primary-m">Register</a>
          </div>
        </div>
      </div>
    `;
  }

  header.querySelectorAll('[data-link]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = a.getAttribute('href');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
  });

  header.querySelector('#vc-mobile-menu')?.addEventListener('click', () => openMobileDrawer());
  header.querySelector('#vc-mobile-notif')?.addEventListener('click', () => {
    const notifPath = role === 'doctor' ? '/doctor/messages'
      : role === 'admin' ? '/admin/notifications'
        : '/patient/messages';
    window.location.hash = notifPath;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

export function removeMobileHeader() {
  document.getElementById('vc-mobile-header')?.remove();
  document.body.classList.remove('vc-mobile-active');
}
