import { toast } from '../shared/toast.js';
import { escapeHtml } from '../shared/utils.js';
import { showAdminTab } from './nav.js';
import { getSocket } from '../shared/socket.js';

let notifRoot = null;
let currentNotifFilter = 'all';
let socketsWired = false;
let simulationStarted = false;

const NOTIFICATIONS_DATA = [
  {
    id: 'N-001',
    type: 'new-doctor',
    title: 'New Doctor Registered',
    message: 'Dr. Fatima Al-Sayed (Cardiology) has submitted an application and is awaiting approval.',
    user: 'Dr. Fatima Al-Sayed',
    userInitials: 'FA',
    userId: 'D-P01',
    specialty: 'Cardiology',
    timestamp: new Date(Date.now() - 5 * 60000),
    timeAgo: '5 minutes ago',
    read: false,
    priority: 'high',
    action: 'approve-doctor',
    actionLabel: 'Review Application'
  },
  {
    id: 'N-002',
    type: 'new-patient',
    title: 'New Patient Registered',
    message: 'Michael Torres from Lagos has just created an account on Virtualcare Nigeria.',
    user: 'Michael Torres',
    userInitials: 'MT',
    userId: 'P-IJ345',
    state: 'Lagos',
    timestamp: new Date(Date.now() - 12 * 60000),
    timeAgo: '12 minutes ago',
    read: false,
    priority: 'normal',
    action: 'view-patient',
    actionLabel: 'View Profile'
  },
  {
    id: 'N-003',
    type: 'new-patient',
    title: 'New Patient Registered',
    message: 'Blessing Okafor from Abuja just registered. First-time user.',
    user: 'Blessing Okafor',
    userInitials: 'BO',
    userId: 'P-KL678',
    state: 'Abuja',
    timestamp: new Date(Date.now() - 18 * 60000),
    timeAgo: '18 minutes ago',
    read: false,
    priority: 'normal',
    action: 'view-patient',
    actionLabel: 'View Profile'
  },
  {
    id: 'N-004',
    type: 'withdrawal',
    title: 'Withdrawal Request',
    message: 'Dr. Chukwuemeka Okonkwo requested withdrawal of ₦205,800 to GTBank account ending 6789.',
    user: 'Dr. Okonkwo',
    userInitials: 'CO',
    userId: 'D-001',
    amount: '₦205,800',
    timestamp: new Date(Date.now() - 30 * 60000),
    timeAgo: '30 minutes ago',
    read: false,
    priority: 'high',
    action: 'approve-withdrawal',
    actionLabel: 'Approve Payout'
  },
  {
    id: 'N-005',
    type: 'new-doctor',
    title: 'New Doctor Registered',
    message: 'Dr. James Patel (Neurology) has submitted application from Abuja.',
    user: 'Dr. James Patel',
    userInitials: 'JP',
    userId: 'D-P02',
    specialty: 'Neurology',
    timestamp: new Date(Date.now() - 45 * 60000),
    timeAgo: '45 minutes ago',
    read: true,
    priority: 'high',
    action: 'approve-doctor',
    actionLabel: 'Review Application'
  },
  {
    id: 'N-006',
    type: 'complaint',
    title: 'Patient Complaint',
    message: 'Patient Ibrahim Sule reported an issue with the session quality during consultation C-003.',
    user: 'Ibrahim Sule',
    userInitials: 'IS',
    userId: 'P-MN901',
    timestamp: new Date(Date.now() - 2 * 3600000),
    timeAgo: '2 hours ago',
    read: true,
    priority: 'high',
    action: 'view-complaint',
    actionLabel: 'View Complaint'
  },
  {
    id: 'N-007',
    type: 'invoice',
    title: 'Invoice Submitted',
    message: 'Dr. Chioma Eze submitted invoice INV-2026-004 for ₦106,400 (June 2026, 19 consultations).',
    user: 'Dr. Chioma Eze',
    userInitials: 'CE',
    userId: 'D-004',
    amount: '₦106,400',
    timestamp: new Date(Date.now() - 3 * 3600000),
    timeAgo: '3 hours ago',
    read: true,
    priority: 'normal',
    action: 'view-invoice',
    actionLabel: 'View Invoice'
  },
  {
    id: 'N-008',
    type: 'new-patient',
    title: 'New Patient Registered',
    message: 'Adaeze Nnadi from Enugu signed up and booked her first consultation.',
    user: 'Adaeze Nnadi',
    userInitials: 'AN',
    userId: 'P-UV123',
    state: 'Enugu',
    timestamp: new Date(Date.now() - 4 * 3600000),
    timeAgo: '4 hours ago',
    read: true,
    priority: 'normal',
    action: 'view-patient',
    actionLabel: 'View Profile'
  },
  {
    id: 'N-009',
    type: 'system',
    title: 'Platform Update',
    message: 'System successfully updated to version 2.4.1. All services running normally.',
    user: 'System',
    userInitials: '⚙️',
    userId: null,
    timestamp: new Date(Date.now() - 6 * 3600000),
    timeAgo: '6 hours ago',
    read: true,
    priority: 'low',
    action: null,
    actionLabel: null
  },
  {
    id: 'N-010',
    type: 'review',
    title: 'New Patient Review',
    message: 'Amaka Obi gave Dr. Okonkwo a 5-star review: "Absolutely exceptional doctor!"',
    user: 'Amaka Obi',
    userInitials: 'AO',
    userId: 'P-FEB83',
    timestamp: new Date(Date.now() - 8 * 3600000),
    timeAgo: '8 hours ago',
    read: true,
    priority: 'low',
    action: 'view-review',
    actionLabel: 'View Review'
  }
];

const TYPE_CONFIG = {
  'new-doctor': {
    icon: '👨‍⚕️',
    color: '#0f766e',
    bg: '#f0fdf4',
    border: '#86efac',
    label: 'New Doctor'
  },
  'new-patient': {
    icon: '👤',
    color: '#1d6aba',
    bg: '#eff6ff',
    border: '#bfdbfe',
    label: 'New Patient'
  },
  withdrawal: {
    icon: '💸',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    label: 'Withdrawal'
  },
  complaint: {
    icon: '⚠️',
    color: '#dc2626',
    bg: '#fff5f5',
    border: '#fecaca',
    label: 'Complaint'
  },
  invoice: {
    icon: '📋',
    color: '#7c3aed',
    bg: '#faf5ff',
    border: '#ddd6fe',
    label: 'Invoice'
  },
  system: {
    icon: '⚙️',
    color: '#64748b',
    bg: '#f8fafc',
    border: '#e2e8f0',
    label: 'System'
  },
  review: {
    icon: '⭐',
    color: '#b45309',
    bg: '#fefce8',
    border: '#fef08a',
    label: 'Review'
  }
};

const POPUP_ICONS = {
  'new-doctor': { icon: '👨‍⚕️', color: '#0f766e', bg: '#f0fdf4', border: '#86efac' },
  'new-patient': { icon: '👤', color: '#1d6aba', bg: '#eff6ff', border: '#bfdbfe' },
  withdrawal: { icon: '💸', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  complaint: { icon: '⚠️', color: '#dc2626', bg: '#fff5f5', border: '#fecaca' },
  invoice: { icon: '📋', color: '#7c3aed', bg: '#faf5ff', border: '#ddd6fe' },
  system: { icon: '⚙️', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  review: { icon: '⭐', color: '#b45309', bg: '#fefce8', border: '#fef08a' }
};

const POPUP_SETTINGS = {
  'new-doctor': true,
  'new-patient': true,
  withdrawal: true,
  complaint: true,
  invoice: true,
  system: false
};

const QUICK_TEMPLATES = [
  {
    id: 'promo',
    label: '🎯 Promo Alert',
    title: 'Special Offer — 25% Off',
    text: '🎯 Special Offer! Get 25% off your next consultation. Use code SAVE25 when booking today!'
  },
  {
    id: 'health',
    label: '💊 Health Tip',
    title: 'Health Tip of the Week',
    text: '💊 Health Tip: Regular health check-ups can detect problems early. Book a consultation today with our verified doctors.'
  },
  {
    id: 'new-doctor',
    label: '👨‍⚕️ New Doctor',
    title: 'New Specialist Doctors Available',
    text: '👨‍⚕️ New Doctor Alert! We have just onboarded new specialist doctors. Book now and get seen faster.'
  },
  {
    id: 'update',
    label: '🌟 Platform Update',
    title: 'Virtualcare Platform Update',
    text: '🌟 Virtualcare Update! We have added new features to improve your experience. Check out what\'s new!'
  }
];

const TAB_MAP = {
  all: 'nftab-all',
  unread: 'nftab-unread',
  'new-doctor': 'nftab-new-doctor',
  'new-patient': 'nftab-new-patient',
  withdrawal: 'nftab-withdrawal',
  high: 'nftab-high'
};

function getNotifStats() {
  const unread = NOTIFICATIONS_DATA.filter((n) => !n.read).length;
  const newDoctors = NOTIFICATIONS_DATA.filter((n) => n.type === 'new-doctor' && !n.read).length;
  const newPatients = NOTIFICATIONS_DATA.filter((n) => n.type === 'new-patient' && !n.read).length;
  const highPriority = NOTIFICATIONS_DATA.filter((n) => n.priority === 'high' && !n.read).length;
  return {
    total: NOTIFICATIONS_DATA.length,
    unread,
    newDoctors,
    newPatients,
    highPriority
  };
}

function updateNotifStatsUI() {
  if (!notifRoot) return;
  const stats = getNotifStats();

  const setVal = (sel, val) => {
    const el = notifRoot.querySelector(sel);
    if (el) el.textContent = String(val);
  };

  setVal('[data-stat="unread"]', stats.unread);
  setVal('[data-stat="new-doctors"]', stats.newDoctors);
  setVal('[data-stat="new-patients"]', stats.newPatients);
  setVal('[data-stat="high-priority"]', stats.highPriority);
  setVal('[data-stat="total"]', stats.total);
  setVal('#nftCountAll', stats.total);
  setVal('#nftCountUnread', stats.unread);

  updateSidebarNotifBadge();
}

export function updateSidebarNotifBadge() {
  const unreadCount = NOTIFICATIONS_DATA.filter((n) => !n.read).length;
  const badge = document.querySelector('.sidebar-notif-badge');
  if (!badge) return;
  badge.textContent = unreadCount;
  badge.style.display = unreadCount > 0 ? 'flex' : 'none';
}

export function ensurePopupContainer() {
  let container = document.getElementById('adminPopupContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'adminPopupContainer';
    container.style.cssText = [
      'position:fixed',
      'top:80px',
      'right:20px',
      'z-index:9999',
      'display:flex',
      'flex-direction:column',
      'gap:10px',
      'max-width:360px',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(container);
  }

  if (!container._popupEventsBound) {
    container._popupEventsBound = true;
    container.addEventListener('click', (e) => {
      const el = e.target.closest('[data-action]');
      if (!el) return;

      const { action, id, notifAction, popupId } = el.dataset;
      if (action === 'dismiss-popup' && popupId) {
        dismissPopup(popupId);
      } else if (action === 'popup-notif-action') {
        if (id && notifAction) handleNotifAction(id, notifAction);
        if (popupId) dismissPopup(popupId);
      }
    });
  }

  return container;
}

function renderNotifItem(n) {
  const tc = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
  const priorityBadge = n.priority === 'high'
    ? '<span class="notif-priority high">🚨 Urgent</span>'
    : '';

  return `
  <div class="notif-item ${!n.read ? 'unread-item' : ''} type-${escapeHtml(n.type)}"
    id="notif-${escapeHtml(n.id)}"
    data-action="mark-notif-read"
    data-id="${escapeHtml(n.id)}"
    data-type="${escapeHtml(n.type)}"
    data-read="${n.read}"
    data-priority="${escapeHtml(n.priority)}">

    <div class="ni-left">
      <div class="ni-icon-wrap" style="background:${tc.bg};border:2px solid ${tc.border}">
        <span class="ni-icon">${tc.icon}</span>
        ${!n.read ? '<div class="ni-unread-dot"></div>' : ''}
      </div>
    </div>

    <div class="ni-content">
      <div class="ni-header">
        <div class="ni-title-wrap">
          <span class="ni-type-badge" style="background:${tc.bg};color:${tc.color};border:1px solid ${tc.border}">
            ${tc.label}
          </span>
          <span class="ni-title">${escapeHtml(n.title)}</span>
          ${priorityBadge}
        </div>
        <div class="ni-time">${escapeHtml(n.timeAgo)}</div>
      </div>

      <div class="ni-message">${escapeHtml(n.message)}</div>

      ${n.action ? `
      <div class="ni-actions">
        <button type="button" class="btn-ni-action"
          data-action="notif-primary"
          data-id="${escapeHtml(n.id)}"
          data-notif-action="${escapeHtml(n.action)}"
          style="background:${tc.bg};color:${tc.color};border:1px solid ${tc.border}">
          ${escapeHtml(n.actionLabel)} →
        </button>
        <button type="button" class="btn-ni-dismiss"
          data-action="dismiss-notif"
          data-id="${escapeHtml(n.id)}">
          Dismiss
        </button>
      </div>` : ''}
    </div>

    <div class="ni-right">
      <button type="button" class="btn-ni-delete"
        data-action="delete-notif"
        data-id="${escapeHtml(n.id)}">
        ×
      </button>
    </div>
  </div>`;
}

function getAdminNotificationsHTML() {
  const stats = getNotifStats();

  return `
  <div class="admin-notif-page">

    <div class="notif-page-header">
      <div>
        <h2>Notifications</h2>
        <p>Real-time alerts, registrations and platform activity</p>
      </div>
      <div class="notif-header-actions">
        <button type="button" class="btn-mark-all-read" data-action="mark-all-read">
          ✓ Mark All Read
        </button>
        <button type="button" class="btn-clear-all-notif" data-action="clear-all-notif">
          🗑️ Clear All
        </button>
        <button type="button" class="btn-test-popup" data-action="test-popup">
          🔔 Test Popup
        </button>
      </div>
    </div>

    <div class="notif-stats-row">
      <div class="notif-stat-card unread-card" data-notif-filter="unread">
        <div class="nsc-icon">🔔</div>
        <div class="nsc-value" data-stat="unread">${stats.unread}</div>
        <div class="nsc-label">Unread</div>
      </div>
      <div class="notif-stat-card doctor-card" data-notif-filter="new-doctor">
        <div class="nsc-icon">👨‍⚕️</div>
        <div class="nsc-value" data-stat="new-doctors">${stats.newDoctors}</div>
        <div class="nsc-label">New Doctors</div>
      </div>
      <div class="notif-stat-card patient-card" data-notif-filter="new-patient">
        <div class="nsc-icon">👤</div>
        <div class="nsc-value" data-stat="new-patients">${stats.newPatients}</div>
        <div class="nsc-label">New Patients</div>
      </div>
      <div class="notif-stat-card urgent-card" data-notif-filter="high">
        <div class="nsc-icon">🚨</div>
        <div class="nsc-value" data-stat="high-priority">${stats.highPriority}</div>
        <div class="nsc-label">High Priority</div>
      </div>
      <div class="notif-stat-card total-card" data-notif-filter="all">
        <div class="nsc-icon">📋</div>
        <div class="nsc-value" data-stat="total">${stats.total}</div>
        <div class="nsc-label">Total Today</div>
      </div>
    </div>

    <div class="notif-settings-card">
      <div class="nsc-settings-header">
        <div class="nsc-settings-title">
          <span>⚙️</span>
          <div>
            <h3>Popup Notification Settings</h3>
            <p>Control which events trigger real-time popup alerts</p>
          </div>
        </div>
      </div>
      <div class="notif-settings-grid">
        <div class="notif-setting-item">
          <div class="nsi-info">
            <div class="nsi-icon new-doc-icon">👨‍⚕️</div>
            <div class="nsi-text">
              <div class="nsi-title">New Doctor Registered</div>
              <div class="nsi-desc">Show popup when a new doctor submits an application</div>
            </div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="popupNewDoctor" data-popup-type="new-doctor" checked />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="notif-setting-item">
          <div class="nsi-info">
            <div class="nsi-icon new-pat-icon">👤</div>
            <div class="nsi-text">
              <div class="nsi-title">New Patient Registered</div>
              <div class="nsi-desc">Show popup when a new patient creates an account</div>
            </div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="popupNewPatient" data-popup-type="new-patient" checked />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="notif-setting-item">
          <div class="nsi-info">
            <div class="nsi-icon withdrawal-icon">💸</div>
            <div class="nsi-text">
              <div class="nsi-title">Withdrawal Request</div>
              <div class="nsi-desc">Alert when a doctor requests a payout</div>
            </div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="popupWithdrawal" data-popup-type="withdrawal" checked />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="notif-setting-item">
          <div class="nsi-info">
            <div class="nsi-icon complaint-icon">⚠️</div>
            <div class="nsi-text">
              <div class="nsi-title">Complaints & Issues</div>
              <div class="nsi-desc">Alert for patient complaints and session issues</div>
            </div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="popupComplaint" data-popup-type="complaint" checked />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="notif-setting-item">
          <div class="nsi-info">
            <div class="nsi-icon invoice-icon">📋</div>
            <div class="nsi-text">
              <div class="nsi-title">Invoice Submitted</div>
              <div class="nsi-desc">Alert when doctors submit payout invoices</div>
            </div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="popupInvoice" data-popup-type="invoice" checked />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="notif-setting-item">
          <div class="nsi-info">
            <div class="nsi-icon system-icon">🔧</div>
            <div class="nsi-text">
              <div class="nsi-title">System Updates</div>
              <div class="nsi-desc">Platform maintenance and system notifications</div>
            </div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="popupSystem" data-popup-type="system" />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>

    <div class="notif-toolbar">
      <div class="notif-filter-tabs">
        <button type="button" class="nft-tab active" id="nftab-all" data-notif-tab="all">
          All <span class="nft-count" id="nftCountAll">${stats.total}</span>
        </button>
        <button type="button" class="nft-tab" id="nftab-unread" data-notif-tab="unread">
          Unread <span class="nft-count unread" id="nftCountUnread">${stats.unread}</span>
        </button>
        <button type="button" class="nft-tab" id="nftab-new-doctor" data-notif-tab="new-doctor">
          👨‍⚕️ New Doctors
        </button>
        <button type="button" class="nft-tab" id="nftab-new-patient" data-notif-tab="new-patient">
          👤 New Patients
        </button>
        <button type="button" class="nft-tab" id="nftab-withdrawal" data-notif-tab="withdrawal">
          💸 Withdrawals
        </button>
        <button type="button" class="nft-tab" id="nftab-high" data-notif-tab="high">
          🚨 High Priority
        </button>
      </div>
      <div class="notif-search-wrap">
        <span>🔍</span>
        <input type="text" id="notifSearch" class="notif-search-input" placeholder="Search notifications..." />
      </div>
    </div>

    <div class="notifications-list" id="notificationsList">
      ${NOTIFICATIONS_DATA.map((n) => renderNotifItem(n)).join('')}
    </div>

    <div class="send-notif-card">
      <div class="snc-header">
        <div class="snc-title">
          <span>📣</span>
          <div>
            <h3>Send Platform Notification</h3>
            <p>Push a notification to any user group or connect with marketing campaigns</p>
          </div>
        </div>
        <button type="button" class="btn-link-marketing" data-action="link-marketing">
          🎯 Open in Marketing →
        </button>
      </div>
      <div class="snc-form">
        <div class="snc-row">
          <div class="snc-field">
            <label>Target Audience</label>
            <select class="admin-select" id="notifTarget">
              <option value="all">All Users (1,247)</option>
              <option value="patients">All Patients (1,158)</option>
              <option value="doctors">All Doctors (89)</option>
              <option value="new">New Registrations (127)</option>
              <option value="returning">Returning Patients (284)</option>
              <option value="dormant">Dormant Patients (189)</option>
            </select>
          </div>
          <div class="snc-field">
            <label>Channels</label>
            <div class="snc-channels">
              <label class="snc-ch"><input type="checkbox" value="push" checked /> 📱 Push</label>
              <label class="snc-ch"><input type="checkbox" value="email" checked /> 📧 Email</label>
              <label class="snc-ch"><input type="checkbox" value="sms" /> 💬 SMS</label>
            </div>
          </div>
          <div class="snc-field">
            <label>Priority</label>
            <select class="admin-select" id="notifPriority">
              <option value="normal">Normal</option>
              <option value="high">🚨 High</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
        <div class="snc-field">
          <label>Title</label>
          <input type="text" id="notifTitle" class="admin-input" placeholder="Notification title..." />
        </div>
        <div class="snc-field">
          <label>Message</label>
          <textarea id="notifMessage" class="admin-textarea" rows="4" placeholder="Write your notification message..."></textarea>
        </div>
        <div class="snc-quick-templates">
          <span class="sqt-label">⚡ Quick templates:</span>
          ${QUICK_TEMPLATES.map((t) => `
            <button type="button" class="sqt-btn"
              data-action="load-notif-template"
              data-template="${escapeHtml(t.id)}">
              ${escapeHtml(t.label)}
            </button>
          `).join('')}
        </div>
        <div class="snc-actions">
          <button type="button" class="btn-preview-notif" data-action="preview-notif">👁️ Preview</button>
          <button type="button" class="btn-schedule-notif" data-action="schedule-notif">📅 Schedule</button>
          <button type="button" class="btn-send-notif-now" data-action="send-notif-now">📤 Send Now</button>
        </div>
      </div>
    </div>
  </div>`;
}

export function showAdminPopup(notification) {
  if (!POPUP_SETTINGS[notification.type]) return;

  const container = ensurePopupContainer();
  const tc = POPUP_ICONS[notification.type] || POPUP_ICONS.system;
  const popupId = `popup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const popup = document.createElement('div');
  popup.id = popupId;
  popup.className = 'admin-popup-notification';
  popup.style.cssText = 'pointer-events:all;animation:popupSlideIn 0.4s ease';

  popup.innerHTML = `
  <div class="apn-wrap" style="border-left:4px solid ${tc.border};background:${tc.bg}">
    <div class="apn-header">
      <div class="apn-icon-title">
        <div class="apn-icon-wrap"><span>${tc.icon}</span></div>
        <div class="apn-title-text" style="color:${tc.color}">${escapeHtml(notification.title)}</div>
      </div>
      <div class="apn-header-right">
        <span class="apn-time">Just now</span>
        <button type="button" class="apn-close" data-action="dismiss-popup" data-popup-id="${escapeHtml(popupId)}">×</button>
      </div>
    </div>
    <div class="apn-message">${escapeHtml(notification.message)}</div>
    <div class="apn-user-info">
      <div class="apn-user-avatar" style="background:${tc.color}">${escapeHtml(notification.userInitials || 'SY')}</div>
      <div class="apn-user-details">
        <div class="apn-user-name">${escapeHtml(notification.user || 'System')}</div>
        ${notification.specialty ? `<div class="apn-user-meta">🏥 ${escapeHtml(notification.specialty)}</div>` : ''}
        ${notification.state ? `<div class="apn-user-meta">📍 ${escapeHtml(notification.state)}</div>` : ''}
        ${notification.amount ? `<div class="apn-user-meta">💰 ${escapeHtml(notification.amount)}</div>` : ''}
      </div>
    </div>
    ${notification.action ? `
    <div class="apn-actions">
      <button type="button" class="apn-action-btn"
        data-action="popup-notif-action"
        data-id="${escapeHtml(notification.id || '')}"
        data-notif-action="${escapeHtml(notification.action)}"
        data-popup-id="${escapeHtml(popupId)}"
        style="background:${tc.color}">
        ${escapeHtml(notification.actionLabel || 'View')} →
      </button>
      <button type="button" class="apn-dismiss-btn" data-action="dismiss-popup" data-popup-id="${escapeHtml(popupId)}">
        Dismiss
      </button>
    </div>` : ''}
    <div class="apn-progress-bar">
      <div class="apn-progress-fill" id="progress-${escapeHtml(popupId)}" style="background:${tc.color}"></div>
    </div>
  </div>`;

  container.appendChild(popup);

  let timeLeft = 8000;
  const interval = setInterval(() => {
    timeLeft -= 100;
    const progress = document.getElementById(`progress-${popupId}`);
    if (progress) progress.style.width = `${(timeLeft / 8000) * 100}%`;
    if (timeLeft <= 0) {
      clearInterval(interval);
      dismissPopup(popupId);
    }
  }, 100);

  popup._dismissInterval = interval;
}

export function dismissPopup(popupId) {
  const popup = document.getElementById(popupId);
  if (!popup) return;

  if (popup._dismissInterval) clearInterval(popup._dismissInterval);

  popup.style.animation = 'popupSlideOut 0.3s ease';
  setTimeout(() => popup.remove(), 280);
}

export function updatePopupSetting(type, checkbox) {
  POPUP_SETTINGS[type] = checkbox.checked;
  toast(`${type} popup notifications ${checkbox.checked ? 'enabled' : 'disabled'} ✅`, 'info');
}

export function addNotifToList(notification) {
  notification.timeAgo = 'Just now';
  notification.read = false;
  notification.priority = notification.type === 'new-doctor' ? 'high' : (notification.priority || 'normal');
  notification.timestamp = new Date();

  NOTIFICATIONS_DATA.unshift(notification);

  const list = document.getElementById('notificationsList');
  if (!list) return;

  const emptyState = list.querySelector('.notif-empty-state');
  if (emptyState) emptyState.remove();

  list.insertAdjacentHTML('afterbegin', renderNotifItem(notification));

  const newItem = list.firstElementChild;
  if (newItem) {
    newItem.style.background = '#fffbeb';
    setTimeout(() => {
      newItem.style.transition = 'background 0.5s';
      newItem.style.background = '';
    }, 1000);
  }

  updateNotifStatsUI();
}

export function setNotifTab(filter, btn) {
  currentNotifFilter = filter;

  notifRoot?.querySelectorAll('.nft-tab').forEach((t) => t.classList.remove('active'));
  if (btn) {
    btn.classList.add('active');
  } else {
    const tabEl = notifRoot?.querySelector(`[data-notif-tab="${filter}"]`);
    tabEl?.classList.add('active');
  }

  filterNotifItems();
}

export function setNotifFilter(filter) {
  currentNotifFilter = filter;

  notifRoot?.querySelectorAll('.nft-tab').forEach((t) => t.classList.remove('active'));
  const tabId = TAB_MAP[filter];
  const tabEl = tabId ? document.getElementById(tabId) : null;
  tabEl?.classList.add('active');

  filterNotifItems();
}

export function filterNotifItems() {
  const search = (notifRoot?.querySelector('#notifSearch')?.value || document.getElementById('notifSearch')?.value || '').toLowerCase();

  document.querySelectorAll('.notif-item').forEach((item) => {
    const type = item.dataset.type || '';
    const read = item.dataset.read === 'true';
    const priority = item.dataset.priority || '';
    const text = item.textContent.toLowerCase();

    let show = true;

    if (currentNotifFilter === 'unread' && read) show = false;
    else if (currentNotifFilter === 'high' && priority !== 'high') show = false;
    else if (
      currentNotifFilter !== 'all'
      && currentNotifFilter !== 'unread'
      && currentNotifFilter !== 'high'
      && type !== currentNotifFilter
    ) show = false;

    if (search && !text.includes(search)) show = false;

    item.style.display = show ? 'flex' : 'none';
  });
}

export function searchNotifications() {
  filterNotifItems();
}

export function markNotifRead(notifId) {
  const item = document.getElementById(`notif-${notifId}`);
  if (!item) return;

  item.classList.remove('unread-item');
  item.dataset.read = 'true';
  item.querySelector('.ni-unread-dot')?.remove();

  const notif = NOTIFICATIONS_DATA.find((n) => n.id === notifId);
  if (notif) notif.read = true;

  updateNotifStatsUI();
}

export function markAllNotifRead() {
  document.querySelectorAll('.notif-item').forEach((item) => {
    item.classList.remove('unread-item');
    item.dataset.read = 'true';
    item.querySelector('.ni-unread-dot')?.remove();
  });

  NOTIFICATIONS_DATA.forEach((n) => { n.read = true; });

  updateNotifStatsUI();
  toast('All notifications marked as read ✅', 'success');
}

export function dismissNotif(notifId) {
  const item = document.getElementById(`notif-${notifId}`);
  if (!item) return;

  item.style.opacity = '0';
  item.style.transform = 'translateX(20px)';
  item.style.transition = 'all 0.3s';
  setTimeout(() => {
    item.remove();
    const idx = NOTIFICATIONS_DATA.findIndex((n) => n.id === notifId);
    if (idx !== -1) NOTIFICATIONS_DATA.splice(idx, 1);
    updateNotifStatsUI();
  }, 300);
}

export function deleteNotif(notifId) {
  dismissNotif(notifId);
}

export function clearAllNotifications() {
  if (!confirm('Clear all notifications? This cannot be undone.')) return;

  document.querySelectorAll('.notif-item').forEach((item) => {
    item.style.opacity = '0';
    item.style.transition = 'all 0.2s';
  });

  setTimeout(() => {
    NOTIFICATIONS_DATA.length = 0;
    const list = document.getElementById('notificationsList');
    if (list) {
      list.innerHTML = `
        <div class="notif-empty-state" style="text-align:center;padding:60px;color:var(--muted)">
          <div style="font-size:48px;margin-bottom:16px">🔔</div>
          <div style="font-size:16px;font-weight:700">No Notifications</div>
          <div style="font-size:13px;margin-top:4px">All clear! New notifications will appear here.</div>
        </div>`;
    }
    updateNotifStatsUI();
  }, 250);

  toast('All notifications cleared', 'info');
}

export function handleNotifAction(notifId, action) {
  if (notifId) markNotifRead(notifId);

  const actions = {
    'approve-doctor': () => {
      showAdminTab('doctors');
      toast('Opening doctor approvals...', 'info');
    },
    'view-patient': () => {
      showAdminTab('users');
      toast('Opening patient profile...', 'info');
    },
    'approve-withdrawal': () => {
      sessionStorage.setItem('adminRevTab', 'invoices');
      showAdminTab('revenue');
      toast('Opening withdrawal request...', 'info');
    },
    'view-complaint': () => {
      showAdminTab('consultations');
      toast('Opening complaint details...', 'info');
    },
    'view-invoice': () => {
      sessionStorage.setItem('adminRevTab', 'invoices');
      showAdminTab('revenue');
      toast('Opening invoice...', 'info');
    },
    'view-review': () => {
      showAdminTab('doctors');
      toast('Opening review...', 'info');
    }
  };

  actions[action]?.();
}

export function loadNotifTemplate(templateId) {
  const template = QUICK_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return;

  const titleEl = notifRoot?.querySelector('#notifTitle') || document.getElementById('notifTitle');
  const messageEl = notifRoot?.querySelector('#notifMessage') || document.getElementById('notifMessage');

  if (titleEl && template.title) titleEl.value = template.title;
  if (messageEl) messageEl.value = template.text;
}

export function previewNotification() {
  const title = notifRoot?.querySelector('#notifTitle')?.value?.trim()
    || document.getElementById('notifTitle')?.value?.trim();
  const message = notifRoot?.querySelector('#notifMessage')?.value?.trim()
    || document.getElementById('notifMessage')?.value?.trim();

  if (!title || !message) {
    toast('Please fill in title and message', 'warning');
    return;
  }

  const prevSystem = POPUP_SETTINGS.system;
  POPUP_SETTINGS.system = true;
  showAdminPopup({
    id: `preview-${Date.now()}`,
    type: 'system',
    title: `👁️ Preview: ${title}`,
    message,
    user: 'Preview',
    userInitials: '👁️',
    action: null
  });
  POPUP_SETTINGS.system = prevSystem;
}

export function scheduleNotification() {
  const title = notifRoot?.querySelector('#notifTitle')?.value?.trim()
    || document.getElementById('notifTitle')?.value?.trim();
  if (!title) {
    toast('Please enter a title', 'warning');
    return;
  }
  toast(`📅 Notification "${title}" scheduled!`, 'success');
}

export function sendNotificationNow() {
  const title = notifRoot?.querySelector('#notifTitle')?.value?.trim()
    || document.getElementById('notifTitle')?.value?.trim();
  const message = notifRoot?.querySelector('#notifMessage')?.value?.trim()
    || document.getElementById('notifMessage')?.value?.trim();
  const target = notifRoot?.querySelector('#notifTarget')?.value
    || document.getElementById('notifTarget')?.value;

  if (!title || !message) {
    toast('Please fill in title and message', 'warning');
    return;
  }

  const targets = {
    all: '1,247 users',
    patients: '1,158 patients',
    doctors: '89 doctors',
    new: '127 new users',
    returning: '284 returning patients',
    dormant: '189 dormant patients'
  };

  toast(`📤 Notification sent to ${targets[target] || 'all users'}! ✅`, 'success', 5000);

  const titleEl = notifRoot?.querySelector('#notifTitle') || document.getElementById('notifTitle');
  const messageEl = notifRoot?.querySelector('#notifMessage') || document.getElementById('notifMessage');
  if (titleEl) titleEl.value = '';
  if (messageEl) messageEl.value = '';
}

export function linkToMarketing() {
  showAdminTab('marketing');
  setTimeout(() => {
    toast('📣 Marketing page opened. Create retargeting campaigns here.', 'info', 4000);
  }, 300);
}

export function testPopupNotification() {
  const testNotifs = [
    {
      id: 'test-1',
      type: 'new-doctor',
      title: 'New Doctor Registered',
      message: 'Dr. Test Doctor (Cardiology) just submitted an application.',
      user: 'Dr. Test Doctor',
      userInitials: 'TD',
      specialty: 'Cardiology',
      action: 'approve-doctor',
      actionLabel: 'Review Application'
    },
    {
      id: 'test-2',
      type: 'new-patient',
      title: 'New Patient Registered',
      message: 'Test Patient from Lagos just signed up!',
      user: 'Test Patient',
      userInitials: 'TP',
      state: 'Lagos',
      action: 'view-patient',
      actionLabel: 'View Profile'
    }
  ];

  testNotifs.forEach((n, i) => {
    setTimeout(() => showAdminPopup(n), i * 1500);
  });
}

export function simulateNewRegistrations() {
  if (simulationStarted || sessionStorage.getItem('adminNotifSimulated') === '1') return;
  simulationStarted = true;
  sessionStorage.setItem('adminNotifSimulated', '1');

  const newDoctors = [{
    type: 'new-doctor',
    title: '🆕 New Doctor Application!',
    message: 'Dr. Aisha Bello (Psychiatry, Kano) just submitted an application.',
    user: 'Dr. Aisha Bello',
    userInitials: 'AB',
    specialty: 'Psychiatry',
    action: 'approve-doctor',
    actionLabel: 'Review Application'
  }];

  const newPatients = [{
    type: 'new-patient',
    title: '🆕 New Patient Registered!',
    message: 'Taiwo Adesanya from Ibadan just created an account!',
    user: 'Taiwo Adesanya',
    userInitials: 'TA',
    state: 'Ibadan',
    action: 'view-patient',
    actionLabel: 'View Profile'
  }];

  setTimeout(() => {
    const n = { ...newDoctors[0], id: `sim-${Date.now()}` };
    showAdminPopup(n);
    addNotifToList(n);
  }, 5000);

  setTimeout(() => {
    const n = { ...newPatients[0], id: `sim-${Date.now()}` };
    showAdminPopup(n);
    addNotifToList(n);
  }, 12000);
}

function buildLivePatientNotif(data) {
  const name = data.name || 'New Patient';
  return {
    id: `live-${Date.now()}`,
    type: 'new-patient',
    title: '🆕 New Patient Registered!',
    message: `${name} from ${data.state || 'Nigeria'} just created an account.`,
    user: name,
    userInitials: name.split(' ').map((part) => part[0]).join('').slice(0, 2),
    state: data.state,
    action: 'view-patient',
    actionLabel: 'View Profile'
  };
}

function buildLiveDoctorNotif(data) {
  const name = data.name || 'New Doctor';
  return {
    id: `live-${Date.now()}`,
    type: 'new-doctor',
    title: '🆕 New Doctor Application!',
    message: `Dr. ${name} (${data.specialty || 'General'}) just submitted an application.`,
    user: `Dr. ${name}`,
    userInitials: name.split(' ').map((part) => part[0]).join('').slice(0, 2),
    specialty: data.specialty,
    action: 'approve-doctor',
    actionLabel: 'Review Application'
  };
}

function buildWsNotif(data) {
  const amount = data.amount
    ? `₦${Number(data.amount).toLocaleString('en-NG')}`
    : null;

  return {
    id: `ws-${Date.now()}`,
    type: data.type || 'system',
    title: data.title || 'New Notification',
    message: data.body || data.message || '',
    user: data.doctorId || 'System',
    userInitials: 'SY',
    amount,
    action: data.type === 'withdrawal' ? 'approve-withdrawal' : null,
    actionLabel: data.type === 'withdrawal' ? 'View Request' : null
  };
}

export function wireAdminNotificationSockets() {
  if (socketsWired) return;

  const socket = getSocket();
  if (!socket) return;

  window.socket = socket;
  socketsWired = true;

  socket.on('patient:registered', (data) => {
    const n = buildLivePatientNotif(data);
    showAdminPopup(n);
    addNotifToList(n);
  });

  socket.on('doctor:registered', (data) => {
    const n = buildLiveDoctorNotif(data);
    showAdminPopup(n);
    addNotifToList(n);
  });

  socket.on('notification:new', (data) => {
    const payload = data.notification || data;
    const n = buildWsNotif(payload);
    showAdminPopup(n);
    if (n.type !== 'system') addNotifToList(n);
  });
}

function syncPopupSettingCheckboxes() {
  notifRoot?.querySelectorAll('[data-popup-type]').forEach((checkbox) => {
    const type = checkbox.dataset.popupType;
    checkbox.checked = POPUP_SETTINGS[type] ?? false;
  });
}

function handleNotifClick(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;

  const { action, id, notifAction, popupId, template } = el.dataset;

  switch (action) {
    case 'mark-all-read':
      markAllNotifRead();
      break;
    case 'clear-all-notif':
      clearAllNotifications();
      break;
    case 'test-popup':
      testPopupNotification();
      break;
    case 'mark-notif-read':
      if (id) markNotifRead(id);
      break;
    case 'notif-primary':
      e.stopPropagation();
      if (id && notifAction) handleNotifAction(id, notifAction);
      break;
    case 'dismiss-notif':
      e.stopPropagation();
      if (id) dismissNotif(id);
      break;
    case 'delete-notif':
      e.stopPropagation();
      if (id) deleteNotif(id);
      break;
    case 'dismiss-popup':
      if (popupId) dismissPopup(popupId);
      break;
    case 'popup-notif-action':
      if (id && notifAction) handleNotifAction(id, notifAction);
      if (popupId) dismissPopup(popupId);
      break;
    case 'load-notif-template':
      if (template) loadNotifTemplate(template);
      break;
    case 'preview-notif':
      previewNotification();
      break;
    case 'schedule-notif':
      scheduleNotification();
      break;
    case 'send-notif-now':
      sendNotificationNow();
      break;
    case 'link-marketing':
      linkToMarketing();
      break;
    default:
      break;
  }
}

function bindAdminNotificationsEvents(root) {
  notifRoot = root;
  root.addEventListener('click', handleNotifClick);

  root.querySelectorAll('[data-notif-tab]').forEach((tab) => {
    tab.addEventListener('click', () => setNotifTab(tab.dataset.notifTab, tab));
  });

  root.querySelectorAll('[data-notif-filter]').forEach((card) => {
    card.addEventListener('click', () => setNotifFilter(card.dataset.notifFilter));
  });

  root.querySelector('#notifSearch')?.addEventListener('input', searchNotifications);

  root.querySelectorAll('[data-popup-type]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      updatePopupSetting(checkbox.dataset.popupType, checkbox);
    });
  });

  syncPopupSettingCheckboxes();
}

export async function renderAdminNotifications(container) {
  currentNotifFilter = 'all';
  window.NOTIFICATIONS_DATA = NOTIFICATIONS_DATA;
  window.POPUP_QUEUE = window.POPUP_QUEUE || [];

  container.innerHTML = getAdminNotificationsHTML();
  bindAdminNotificationsEvents(container);
  ensurePopupContainer();
  updateSidebarNotifBadge();
  wireAdminNotificationSockets();
}
