import { getUser, getRole } from './api.js';

const MOBILE_MAX = 768;

const TABS = [
  { tab: 'home', href: '/', icon: '🏠', label: 'Home', match: (p) => p === '/' },
  { tab: 'book', href: '/find-a-doctor', icon: '📅', label: 'Book', match: (p) => p === '/find-a-doctor' || p.startsWith('/patient/book') },
  { tab: 'ai', href: '/patient/ai', icon: '🤖', label: 'AI', match: (p) => p.startsWith('/patient/ai') },
  { tab: 'messages', href: '/patient/messages', icon: '💬', label: 'Messages', match: (p) => p.startsWith('/patient/messages') },
  { tab: 'profile', href: '/patient/profile', icon: '👤', label: 'Profile', match: (p) => p.startsWith('/patient/profile') }
];

function getPath() {
  return (window.location.hash.slice(1) || '/').split('?')[0];
}

function shouldShowNav() {
  const user = getUser();
  const role = getRole();
  return Boolean(user) && role === 'patient' && window.innerWidth <= MOBILE_MAX;
}

function highlightActiveTab(nav) {
  const path = getPath();
  nav.querySelectorAll('a[data-tab]').forEach((link) => {
    const tab = link.dataset.tab;
    const def = TABS.find((t) => t.tab === tab);
    link.classList.toggle('active', def?.match(path) ?? false);
  });
}

function bindNavLinks(nav) {
  nav.querySelectorAll('a[data-tab]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const href = a.getAttribute('href');
      if (!href) return;
      window.location.hash = href;
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      highlightActiveTab(nav);
    });
  });
}

export function renderBottomNav() {
  const existing = document.getElementById('mobile-bottom-nav');
  if (existing) existing.remove();

  if (!shouldShowNav()) return;

  const nav = document.createElement('nav');
  nav.id = 'mobile-bottom-nav';
  nav.setAttribute('aria-label', 'Patient navigation');
  nav.innerHTML = TABS.map(({ tab, href, icon, label }) => `
    <a href="${href}" data-tab="${tab}">
      <span aria-hidden="true">${icon}</span>
      <span>${label}</span>
    </a>
  `).join('');

  document.body.appendChild(nav);
  nav.classList.add('is-visible');
  highlightActiveTab(nav);
  bindNavLinks(nav);
}
