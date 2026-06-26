import { renderAdminShell, bindShellEvents } from '../shared/layout.js';
import { toast } from '../shared/toast.js';
import { renderAdminDashboard } from './adminDashboard.js';
import { renderLiveSessions } from './liveSessions.js';
import { renderMarketing } from './marketing.js';
import { renderAdminUsers } from './users.js';
import { renderAdminDoctors } from './doctors.js';
import { renderAdminConsultations } from './consultations.js';
import { renderAdminRevenue } from './revenue.js';
import {
  renderAdminNotifications,
  wireAdminNotificationSockets,
  updateSidebarNotifBadge,
  ensurePopupContainer
} from './notifications.js';

export async function renderAdminPage(container, path) {
  const tab = path.replace('/admin/', '') || 'dashboard';
  container.innerHTML = renderAdminShell(path, '<div class="page-loading">Loading...</div>');
  bindShellEvents(container);
  ensurePopupContainer();
  wireAdminNotificationSockets();
  updateSidebarNotifBadge();
  const contentEl = container.querySelector('.dash-content');
  try {
    switch (tab) {
      case 'dashboard': await renderAdminDashboard(contentEl); break;
      case 'users': await renderAdminUsers(contentEl); break;
      case 'doctors': await renderAdminDoctors(contentEl); break;
      case 'consultations': await renderAdminConsultations(contentEl); break;
      case 'live-sessions': await renderLiveSessions(contentEl); break;
      case 'marketing': await renderMarketing(contentEl); break;
      case 'revenue': await renderAdminRevenue(contentEl); break;
      case 'notifications': await renderAdminNotifications(contentEl); break;
      default: contentEl.innerHTML = '<p>Page not found</p>';
    }
    updateSidebarNotifBadge();
  } catch (e) { toast(e.message, 'error'); }
}
