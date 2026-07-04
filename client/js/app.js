import { getUser, getRole } from './shared/api.js';
import { notificationsApi } from './shared/api.js';
import { connectSocket } from './shared/socket.js';
import { onDoctorStatusChanged } from './shared/socket.js';
import { initToast } from './shared/toast.js';
import { renderHome } from './pages/home.js';
import { renderFindDoctor } from './pages/findDoctor.js';
import { BLOG_POSTS, escapeHtml } from './shared/utils.js';
import { renderLogin, renderRegister, logout, handleOAuthCallback } from './auth.js';
import { renderPatientPage } from './patient/dashboard.js';
import { renderDoctorPage } from './doctor/dashboard.js';
import { renderAdminPage } from './admin/dashboard.js';
import { initVideoCall } from './video/callManager.js';
import { renderDoctorProfile } from './pages/doctorProfile.js';
import { registerBookingFlowGlobals } from './shared/bookingFlow.js';
import { openBookingModal } from './shared/bookingModal.js';
import { registerAvatarSelectorGlobals } from './patient/avatarSelector.js';
import { initCookieConsent } from './shared/cookieConsent.js';
import { renderPrivacyPolicy } from './pages/privacyPolicy.js';

registerBookingFlowGlobals();
registerAvatarSelectorGlobals();

document.addEventListener('click', (e) => {
  const target = e.target.closest('#msg-book, #hero-book, #footer-book, #priority-book-btn');
  if (!target) return;
  e.preventDefault();
  if (typeof window.openBookingFlow === 'function') window.openBookingFlow();
});

const app = document.getElementById('app');
const navAuth = document.getElementById('nav-auth');

function getPath() {
  return (window.location.hash.slice(1) || '/').split('?')[0];
}

function isDashboardPath(path) {
  return path.startsWith('/patient/') || path.startsWith('/doctor/') || path.startsWith('/admin/') || path.startsWith('/video/');
}

async function updateNav() {
  const user = getUser();
  const role = getRole();
  const path = getPath();
  const header = document.getElementById('site-header');
  header.classList.toggle('hidden', isDashboardPath(path) || path === '/login' || path === '/register' || path === '/oauth-callback');

  if (user) {
    connectSocket(user, role);
    let unread = 0;
    try {
      const n = await notificationsApi.list();
      unread = n.data.unread || 0;
    } catch { /* ignore */ }
    const dash = role === 'doctor' ? '/doctor/dashboard' : role === 'admin' ? '/admin/dashboard' : '/patient/dashboard';
    navAuth.innerHTML = `
      <button class="nav-bell" id="nav-bell" title="Notifications">🔔${unread ? `<span class="badge-count">${unread}</span>` : ''}</button>
      <a href="${dash}" data-link class="btn btn-primary btn-sm">Dashboard</a>
      <a href="#" id="logout-btn" class="btn-nav-outline">Logout</a>
    `;
    document.getElementById('logout-btn')?.addEventListener('click', (e) => { e.preventDefault(); logout(); });
  } else {
    navAuth.innerHTML = `
      <input type="search" class="nav-search" id="nav-search" placeholder="Search doctors…">
      <a href="/login" data-link class="btn-nav-outline">Login</a>
      <a href="/register" data-link class="btn btn-primary btn-sm">Register</a>
    `;
    document.getElementById('nav-search')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        window.location.hash = `/find-a-doctor?search=${encodeURIComponent(e.target.value)}`;
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }
    });
  }
  bindLinks();
  setupDrawer();
}

function setupDrawer() {
  const toggle = document.getElementById('nav-toggle');
  const drawer = document.getElementById('nav-drawer');
  const overlay = document.getElementById('nav-overlay');

  const closeDrawer = () => {
    drawer?.classList.remove('open');
    overlay?.classList.remove('open');
  };

  drawer.className = 'mobile-drawer';
  overlay.className = 'mobile-backdrop';

  drawer.innerHTML = `
    <button type="button" class="drawer-close" id="drawer-close" aria-label="Close">×</button>
    <a href="/" class="logo drawer-logo" data-link>⊕ <span class="logo-text">Virtual<span class="logo-accent">care</span></span></a>
    <a href="/find-a-doctor" data-link>Find a Doctor</a>
    <a href="/how-it-works" data-link>How It Works</a>
    <a href="/blog" data-link>Blog & Health Tips</a>
    <a href="/for-doctors" data-link>For Doctors</a>
    <div class="drawer-auth">
      <a href="/login" data-link class="btn-nav-outline drawer-btn">Login</a>
      <a href="/register" data-link class="btn btn-primary btn-sm drawer-btn">Register</a>
    </div>
  `;

  drawer.querySelectorAll('a[data-link]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      closeDrawer();
      window.location.hash = a.getAttribute('href');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
  });

  document.getElementById('drawer-close')?.addEventListener('click', closeDrawer);
  toggle?.addEventListener('click', () => {
    drawer.classList.toggle('open');
    overlay.classList.toggle('open');
  });
  overlay?.addEventListener('click', closeDrawer);
}

function bindLinks() {
  document.querySelectorAll('[data-link]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = a.getAttribute('href');
    });
  });
}

function renderHowItWorks(container) {
  container.innerHTML = `<div class="dashboard-layout"><div class="container section"><h1>How Virtualcare Nigeria Works</h1>
    <p class="text-muted">From Lagos Island to Maiduguri — quality healthcare is now one tap away.</p>
    <div class="how-grid-4" style="margin-top:32px">${['Choose a Specialty','Select Date & Time','Pay with Paystack (₦)','Consult via Video/Audio'].map((t,i)=>
      `<div class="how-step how-card"><div class="how-num">${i+1}</div><h3>${t}</h3></div>`).join('')}</div></div></div>`;
  bindLinks();
}

function renderForDoctors(container) {
  container.innerHTML = `<div class="dashboard-layout"><div class="container"><div class="returning-banner" style="border-radius:12px;margin-bottom:24px">
    Join 3,000+ MDCN-certified doctors on Virtualcare Nigeria</div>
    <ul style="line-height:2;margin-bottom:24px">
      <li>Earn ₦5,000 – ₦18,000 per consultation (70% payout)</li>
      <li>Reach patients across all 36 states + FCT</li>
      <li>Flexible schedule — consult from your clinic or home</li>
      <li>Payouts direct to your Nigerian bank account via Paystack</li>
    </ul>
    <a href="/register?role=doctor" data-link class="btn btn-primary">Apply Now</a></div></div>`;
  bindLinks();
}

async function renderPaymentVerify(container) {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const reference = params.get('reference');
  container.innerHTML = '<div class="page-loading"><p>Verifying payment…</p></div>';
  if (!reference) {
    container.innerHTML = '<div class="container section"><div class="alert alert-error">No payment reference found.</div></div>';
    return;
  }
  try {
    const { paymentsApi } = await import('./shared/api.js');
    await paymentsApi.verify(reference);
    container.innerHTML = `<div class="container section text-center"><div class="card" style="max-width:480px;margin:40px auto">
      <h2>🎉 Payment Successful!</h2><p>Your consultation has been confirmed.</p>
      <a href="/patient/upcoming" data-link class="btn btn-primary">View Appointments</a></div></div>`;
    bindLinks();
  } catch (e) {
    container.innerHTML = `<div class="container section"><div class="alert alert-error">${escapeHtml(e.message)}</div></div>`;
  }
}

function renderBlog(container) {
  const slug = getPath().replace('/blog/', '').replace('/blog', '');
  if (slug && slug !== 'blog' && slug !== '/') {
    const post = BLOG_POSTS.find((p) => p.slug === slug);
    container.innerHTML = `<div class="container dashboard-layout"><a href="/blog" data-link>← Back</a>
      <h1 style="margin:24px 0">${post?.title || 'Article'}</h1><div class="card"><p>${post?.excerpt || ''}</p></div></div>`;
  } else {
    container.innerHTML = `<div class="container dashboard-layout"><h1>Blog</h1><div class="blog-grid">
      ${BLOG_POSTS.map((p)=>`<a href="/blog/${p.slug}" data-link class="blog-card"><div class="content"><h3>${p.title}</h3><p>${p.excerpt}</p></div></a>`).join('')}
    </div></div>`;
  }
  bindLinks();
}

function requireAuth(roles) {
  if (!getUser()) { window.location.hash = '/login'; return false; }
  if (roles && !roles.includes(getRole())) { window.location.hash = '/'; return false; }
  return true;
}

async function router() {
  initToast();
  initCookieConsent();
  if (handleOAuthCallback()) return;

  const path = getPath();
  await updateNav();

  if (path.startsWith('/patient/')) {
    if (!requireAuth(['patient', 'admin'])) return;
    await renderPatientPage(app, path);
    return;
  }
  if (path.startsWith('/doctor/')) {
    if (!requireAuth(['doctor'])) return;
    await renderDoctorPage(app, path);
    return;
  }
  if (path.startsWith('/admin/')) {
    if (!requireAuth(['admin'])) return;
    await renderAdminPage(app, path);
    return;
  }
  if (path.startsWith('/video/')) {
    if (!requireAuth(['patient', 'doctor'])) return;
    await initVideoCall(app, path.split('/video/')[1]);
    return;
  }

  if (path.startsWith('/doctors/')) {
    await renderDoctorProfile(app, path.split('/doctors/')[1]);
    bindLinks();
    return;
  }

  if (path.startsWith('/payment/verify')) {
    if (!requireAuth(['patient'])) return;
    await renderPaymentVerify(app);
    return;
  }

  const routes = {
    '/': renderHome,
    '/find-a-doctor': renderFindDoctor,
    '/how-it-works': renderHowItWorks,
    '/for-doctors': renderForDoctors,
    '/blog': renderBlog,
    '/login': renderLogin,
    '/register': renderRegister,
    '/privacy-policy': renderPrivacyPolicy
  };

  if (path.startsWith('/blog/')) { renderBlog(app); return; }
  if (path === '/patient/book' && getUser()) {
    openBookingModal();
    await renderPatientPage(app, '/patient/dashboard');
    return;
  }

  const handler = routes[path];
  if (handler) {
    await handler(app);
    if (path === '/privacy-policy') bindLinks();
  } else { app.innerHTML = '<div class="page-loading"><p>Page not found. <a href="/" data-link>Go home</a></p></div>'; bindLinks(); }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
  if (!window.location.hash) window.location.hash = '/';
  else router();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/public/sw.js').catch(() => {});

  const AVAIL_LABELS = { green: 'Available Now', amber: 'Busy Soon', red: 'Unavailable' };
  onDoctorStatusChanged(({ doctorId, status }) => {
    document.querySelectorAll(`[data-id="${doctorId}"]`).forEach((card) => {
      const avail = card.querySelector('.avail-badge');
      if (avail) {
        avail.className = `avail-badge avail-${status}`;
        avail.innerHTML = `<span class="avail-dot"></span> ${AVAIL_LABELS[status] || 'Unavailable'}`;
      }
    });
  });
});

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  setTimeout(() => document.getElementById('install-prompt')?.classList.remove('hidden'), 30000);
});
document.getElementById('install-btn')?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  document.getElementById('install-prompt')?.classList.add('hidden');
});
document.getElementById('install-dismiss')?.addEventListener('click', () => {
  document.getElementById('install-prompt')?.classList.add('hidden');
});

// Mobile bottom navigation
import { renderBottomNav } from './shared/bottomNav.js';
window.addEventListener('load', renderBottomNav);
window.addEventListener('hashchange', renderBottomNav);
window.addEventListener('resize', renderBottomNav);
