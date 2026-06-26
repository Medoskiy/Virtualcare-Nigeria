import { updateSidebarNotifBadge } from './notifications.js';

export function showAdminTab(tab) {
  window.location.hash = `/admin/${tab}`;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  updateSidebarNotifBadge();
}