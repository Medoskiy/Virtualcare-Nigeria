import { toast } from '../shared/toast.js';
import { escapeHtml } from '../shared/utils.js';
import { showAdminTab } from './nav.js';
import { simulateNewRegistrations } from './notifications.js';

const PENDING_DOCTORS = [
  { name: 'Dr. Fatima Al-Sayed', spec: 'Cardiology', state: 'Lagos', date: 'Today', mdcn: 'MDN/LUTH/2019/08823' },
  { name: 'Dr. James Patel', spec: 'Neurology', state: 'Abuja', date: 'Yesterday', mdcn: 'MDN/NHA/2018/07234' },
  { name: 'Dr. Aisha Bello', spec: 'Psychiatry', state: 'Kano', date: '2 days ago', mdcn: 'MDN/AKTH/2020/09456' },
  { name: 'Dr. Emeka Eze', spec: 'Pediatrics', state: 'Enugu', date: '3 days ago', mdcn: 'MDN/UNTH/2017/06789' }
];

const PENDING_PATIENTS = [
  { name: 'Michael Torres', state: 'Lagos', date: 'Today 14:32', status: 'Active' },
  { name: 'Blessing Okafor', state: 'Abuja', date: 'Today 13:15', status: 'Active' },
  { name: 'Ibrahim Sule', state: 'Kano', date: 'Today 11:44', status: 'Active' },
  { name: 'Adaeze Nnadi', state: 'Enugu', date: 'Today 10:22', status: 'Pending' },
  { name: 'Taiwo Adesanya', state: 'Ibadan', date: 'Today 09:05', status: 'Active' }
];

const SPECIALTY_STATS = [
  { spec: 'General Practice', count: 142, color: '#3b99e0', pct: 100 },
  { spec: 'Cardiology', count: 98, color: '#dc2626', pct: 69 },
  { spec: 'Dermatology', count: 87, color: '#16a34a', pct: 61 },
  { spec: 'Psychiatry', count: 76, color: '#7c3aed', pct: 54 },
  { spec: 'Pediatrics', count: 68, color: '#d97706', pct: 48 },
  { spec: 'Gynecology', count: 54, color: '#ec4899', pct: 38 },
  { spec: 'Neurology', count: 42, color: '#0f766e', pct: 30 },
  { spec: 'Others', count: 22, color: '#94a3b8', pct: 15 }
];

const RECENT_CONSULTS = [
  { patient: 'Amaka Obi', doctor: 'Dr. Okonkwo', spec: 'Cardiology', duration: '48 min', amount: '₦11,250', rating: '5★', status: 'Completed' },
  { patient: 'Emeka Nwosu', doctor: 'Dr. Okonkwo', spec: 'Cardiology', duration: '52 min', amount: '₦11,250', rating: '5★', status: 'Completed' },
  { patient: 'Fatima Aliyu', doctor: 'Dr. Musa', spec: 'General Practice', duration: '45 min', amount: '₦3,750', rating: '4★', status: 'Completed' },
  { patient: 'Ngozi Adeleke', doctor: 'Dr. Eze', spec: 'Pediatrics', duration: '50 min', amount: '₦6,000', rating: '5★', status: 'Completed' },
  { patient: 'Chukwudi Eze', doctor: 'Dr. Nwosu', spec: 'Dermatology', duration: '47 min', amount: '₦7,500', rating: '5★', status: 'Completed' }
];

const WITHDRAWAL_REQUESTS = [
  { doctor: 'Dr. Okonkwo', bank: 'GTBank', amount: '₦205,800', date: 'Today', ref: 'WD-72369586' },
  { doctor: 'Dr. Adeleke', bank: 'Zenith Bank', amount: '₦147,000', date: 'Yesterday', ref: 'WD-83471234' },
  { doctor: 'Dr. Musa', bank: 'Access Bank', amount: '₦89,500', date: '2 days ago', ref: 'WD-94582345' }
];

const REVENUE_MONTHS = [
  { month: 'Jan', platform: 2800000, doctors: 6500000 },
  { month: 'Feb', platform: 3100000, doctors: 7200000 },
  { month: 'Mar', platform: 3600000, doctors: 8400000 },
  { month: 'Apr', platform: 4200000, doctors: 9800000 },
  { month: 'May', platform: 4800000, doctors: 11200000 },
  { month: 'Jun', platform: 5200000, doctors: 12100000 }
];

const GROWTH_DATA = [
  { month: 'Dec', users: 180, consults: 210, rev: 3.1 },
  { month: 'Jan', users: 320, consults: 280, rev: 4.2 },
  { month: 'Feb', users: 410, consults: 350, rev: 5.1 },
  { month: 'Mar', users: 580, consults: 420, rev: 6.3 },
  { month: 'Apr', users: 720, consults: 510, rev: 7.6 },
  { month: 'May', users: 980, consults: 580, rev: 9.4 },
  { month: 'Jun', users: 1247, consults: 680, rev: 11.7 }
];

const LIVE_SESSIONS_MINI = [
  { doctor: 'Dr. Okonkwo', patient: 'Amaka O.', time: '22 min' },
  { doctor: 'Dr. Musa', patient: 'Ibrahim S.', time: '8 min' },
  { doctor: 'Dr. Eze', patient: 'Ngozi A.', time: '35 min' }
];

function getLagosDate() {
  return new Date().toLocaleDateString('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Lagos'
  });
}

function renderLiveSessionsMini() {
  return LIVE_SESSIONS_MINI.map((s) => `
    <div class="live-session-mini-item">
      <span class="live-mini-dot"></span>
      <span class="live-mini-names">${escapeHtml(s.doctor)} → ${escapeHtml(s.patient)}</span>
      <span class="live-mini-time">${escapeHtml(s.time)}</span>
    </div>
  `).join('');
}

function renderRevenueBars() {
  const maxVal = 12100000;
  const formatM = (n) => `₦${(n / 1000000).toFixed(1)}M`;

  return REVENUE_MONTHS.map((d) => {
    const platformH = Math.round((d.platform / maxVal) * 100);
    const doctorsH = Math.round((d.doctors / maxVal) * 100);
    return `
      <div class="admin-bar-group">
        <div class="admin-bar-wrap">
          <div class="admin-bar doctors-bar" style="height:${doctorsH}%" title="${formatM(d.doctors)} doctors"></div>
          <div class="admin-bar platform-bar" style="height:${platformH}%" title="${formatM(d.platform)} platform"></div>
        </div>
        <div class="admin-bar-label">${d.month}</div>
      </div>`;
  }).join('');
}

function renderGrowthChart() {
  const maxUsers = 1247;
  const maxConsults = 680;
  const maxRev = 11.7;

  return GROWTH_DATA.map((d) => `
    <div class="amc-bar-group">
      <div class="amc-bars">
        <div class="amc-bar users-bar" style="height:${Math.round((d.users / maxUsers) * 100)}%" title="${d.users} users"></div>
        <div class="amc-bar consults-bar" style="height:${Math.round((d.consults / maxConsults) * 100)}%" title="${d.consults} consults"></div>
        <div class="amc-bar rev-bar" style="height:${Math.round((d.rev / maxRev) * 100)}%" title="₦${d.rev}M revenue"></div>
      </div>
      <div class="amc-bar-label">${d.month}</div>
    </div>
  `).join('');
}

function getAdminDashboardHTML() {
  return `
  <div class="admin-dashboard">
    <div class="admin-dash-header">
      <div>
        <h2>Admin Dashboard</h2>
        <p>Virtualcare Nigeria · Platform Overview · ${getLagosDate()}</p>
      </div>
      <div class="admin-header-actions">
        <button type="button" class="btn-admin-refresh" id="btnAdminRefresh">🔄 Refresh</button>
        <button type="button" class="btn-admin-export" id="btnAdminExport">📊 Export Report</button>
      </div>
    </div>

    <div class="live-indicator-banner">
      <div class="live-pulse-dot"></div>
      <span class="live-text">LIVE</span>
      <div class="live-banner-content">
        <span class="live-detail">
          Platform is active ·
          <strong id="liveDoctorsCount">3</strong> doctors in session ·
          <strong id="livePatientCount">3</strong> patients consulting ·
          Last updated: <span id="lastUpdatedTime">Just now</span>
        </span>
        <div class="live-banner-mini-stats">
          <span class="lbms">📹 Video: <strong id="dashVideoCount">8</strong></span>
          <span class="lbms">🎙️ Audio: <strong id="dashAudioCount">5</strong></span>
          <span class="lbms">⏱️ Today: <strong id="dashTotalMins">487 min</strong></span>
          <span class="lbms">✅ Done: <strong id="dashCompletedCount">8</strong></span>
        </div>
      </div>
      <button type="button" class="btn-view-live" id="btnViewLiveSessions">View Live Sessions →</button>
    </div>

    <div class="admin-kpi-grid">
      <div class="admin-kpi-card users-card">
        <div class="admin-kpi-top">
          <div class="admin-kpi-icon-wrap"><span>👥</span></div>
          <div class="admin-kpi-trend up">↑ +12 today</div>
        </div>
        <div class="admin-kpi-value">1,247</div>
        <div class="admin-kpi-label">Total Users</div>
        <div class="admin-kpi-sub"><span>1,158 patients</span><span>89 doctors</span></div>
        <div class="admin-kpi-bar"><div class="kpi-bar-fill" style="width:85%"></div></div>
      </div>

      <div class="admin-kpi-card doctors-card">
        <div class="admin-kpi-top">
          <div class="admin-kpi-icon-wrap"><span>👨‍⚕️</span></div>
          <div class="admin-kpi-trend up">↑ +2 this week</div>
        </div>
        <div class="admin-kpi-value">89</div>
        <div class="admin-kpi-label">Active Doctors</div>
        <div class="admin-kpi-sub"><span>82 verified</span><span>7 pending</span></div>
        <div class="admin-kpi-bar"><div class="kpi-bar-fill" style="width:92%"></div></div>
      </div>

      <div class="admin-kpi-card sessions-card">
        <div class="admin-kpi-top">
          <div class="admin-kpi-icon-wrap"><span>🎥</span></div>
          <div class="admin-kpi-trend up">↑ +18% this month</div>
        </div>
        <div class="admin-kpi-value">3,847</div>
        <div class="admin-kpi-label">Total Consultations</div>
        <div class="admin-kpi-sub"><span>147 this week</span><span>28 today</span></div>
        <div class="admin-kpi-bar"><div class="kpi-bar-fill" style="width:72%"></div></div>
      </div>

      <div class="admin-kpi-card revenue-card">
        <div class="admin-kpi-top">
          <div class="admin-kpi-icon-wrap"><span>💰</span></div>
          <div class="admin-kpi-trend up">↑ +22% vs last month</div>
        </div>
        <div class="admin-kpi-value">₦57.7M</div>
        <div class="admin-kpi-label">Total Platform Revenue</div>
        <div class="admin-kpi-sub"><span>₦17.3M platform (30%)</span><span>₦40.4M doctors (70%)</span></div>
        <div class="admin-kpi-bar"><div class="kpi-bar-fill" style="width:65%"></div></div>
      </div>

      <div class="admin-kpi-card revshare-card">
        <div class="admin-kpi-top">
          <div class="admin-kpi-icon-wrap"><span>📊</span></div>
          <div class="admin-kpi-trend up">↑ This Month</div>
        </div>
        <div class="admin-kpi-value">₦5.2M</div>
        <div class="admin-kpi-label">Platform Earnings (30%)</div>
        <div class="revshare-breakdown">
          <div class="revshare-row"><span>Doctors earned</span><strong>₦12.1M</strong></div>
          <div class="revshare-row"><span>Platform kept</span><strong style="color:#4ade80">₦5.2M</strong></div>
          <div class="revshare-bar-wrap">
            <div class="revshare-bar-doctors" style="width:70%">70%</div>
            <div class="revshare-bar-platform" style="width:30%">30%</div>
          </div>
        </div>
      </div>

      <div class="admin-kpi-card live-card" id="adminLiveCard" role="button" tabindex="0" style="cursor:pointer">
        <div class="admin-kpi-top">
          <div class="admin-kpi-icon-wrap live"><span>🔴</span></div>
          <div class="live-badge-pill">● LIVE</div>
        </div>
        <div class="admin-kpi-value live-count" id="liveSessionsCount">3</div>
        <div class="admin-kpi-label">Live Sessions Now</div>
        <div class="admin-kpi-sub"><span>3 doctors active</span><span>Avg 22 min</span></div>
        <div class="live-sessions-mini" id="liveSessionsMini">${renderLiveSessionsMini()}</div>
      </div>
    </div>

    <div class="admin-second-row">
      <div class="admin-pending-card doctors-pending">
        <div class="pending-card-header">
          <div class="pending-card-title">
            <span class="pending-icon">👨‍⚕️</span>
            <div>
              <h3>Pending Doctors</h3>
              <p>Awaiting MDCN verification & approval</p>
            </div>
          </div>
          <div class="pending-count-badge pending-doctors">7 pending</div>
        </div>
        <div class="pending-doctors-list">
          ${PENDING_DOCTORS.map((doc, i) => {
            const parts = doc.name.replace('Dr. ', '').split(' ');
            const initials = `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`;
            return `
            <div class="pending-doc-item">
              <div class="pending-doc-avatar">${initials}</div>
              <div class="pending-doc-info">
                <div class="pending-doc-name">${escapeHtml(doc.name)}</div>
                <div class="pending-doc-meta">${escapeHtml(doc.spec)} · ${escapeHtml(doc.state)} · ${escapeHtml(doc.date)}</div>
                <div class="pending-doc-mdcn">${escapeHtml(doc.mdcn)}</div>
              </div>
              <div class="pending-doc-actions">
                <button type="button" class="btn-approve-sm" data-approve-doctor="${i}">✅</button>
                <button type="button" class="btn-reject-sm" data-reject-doctor="${i}">✗</button>
              </div>
            </div>`;
          }).join('')}
        </div>
        <button type="button" class="btn-see-all-pending" data-admin-tab="doctors">View All 7 Pending Doctors →</button>
      </div>

      <div class="admin-pending-card patients-pending">
        <div class="pending-card-header">
          <div class="pending-card-title">
            <span class="pending-icon">👤</span>
            <div>
              <h3>New Patients</h3>
              <p>Recently registered patients</p>
            </div>
          </div>
          <div class="pending-count-badge pending-patients">12 new today</div>
        </div>
        <div class="pending-patients-list">
          ${PENDING_PATIENTS.map((p) => `
            <div class="pending-patient-item">
              <div class="pending-pat-avatar">${p.name.split(' ').map((n) => n[0]).join('')}</div>
              <div class="pending-pat-info">
                <div class="pending-pat-name">${escapeHtml(p.name)}</div>
                <div class="pending-pat-meta">📍 ${escapeHtml(p.state)} · ${escapeHtml(p.date)}</div>
              </div>
              <span class="pending-pat-status ${p.status === 'Active' ? 'active' : 'pending'}">${escapeHtml(p.status)}</span>
            </div>
          `).join('')}
        </div>
        <button type="button" class="btn-see-all-pending" data-admin-tab="users">View All Patients →</button>
      </div>
    </div>

    <div class="admin-consultations-section">
      <div class="consult-section-header">
        <div>
          <h3>Consultations Overview</h3>
          <p>Real-time consultation tracking across all specialties</p>
        </div>
        <button type="button" class="btn-view-all-consults" data-admin-tab="consultations">View All Consultations →</button>
      </div>

      <div class="consult-stats-row">
        <div class="consult-stat-card consult-stat-clickable" data-consult-filter="live" style="border-left:4px solid #dc2626;cursor:pointer">
          <div class="cs-icon">🔴</div><div class="cs-value">3</div><div class="cs-label">Live Now</div>
        </div>
        <div class="consult-stat-card consult-stat-clickable" data-consult-filter="all" style="border-left:4px solid #3b99e0;cursor:pointer">
          <div class="cs-icon">📅</div><div class="cs-value">28</div><div class="cs-label">Today</div>
        </div>
        <div class="consult-stat-card consult-stat-clickable" data-consult-filter="upcoming" style="border-left:4px solid #7c3aed;cursor:pointer">
          <div class="cs-icon">📊</div><div class="cs-value">589</div><div class="cs-label">This Month</div>
        </div>
        <div class="consult-stat-card consult-stat-clickable" data-consult-filter="completed" style="border-left:4px solid #0f766e;cursor:pointer">
          <div class="cs-icon">⭐</div><div class="cs-value">4.93</div><div class="cs-label">Avg Rating</div>
        </div>
        <div class="consult-stat-card consult-stat-clickable" data-consult-filter="cancelled" style="border-left:4px solid #dc2626;cursor:pointer">
          <div class="cs-icon">❌</div><div class="cs-value">4</div><div class="cs-label">Cancelled Today</div>
        </div>
        <div class="consult-stat-card consult-stat-clickable" data-consult-filter="returning" style="border-left:4px solid #16a34a;cursor:pointer">
          <div class="cs-icon">🔁</div><div class="cs-value">1,847</div><div class="cs-label">Returning Patients</div>
        </div>
      </div>

      <div class="consult-specialty-chart">
        <div class="consult-chart-title">Consultations by Specialty (This Month)</div>
        <div class="specialty-bars">
          ${SPECIALTY_STATS.map((s) => `
            <div class="spec-bar-row">
              <div class="spec-bar-label">${escapeHtml(s.spec)}</div>
              <div class="spec-bar-track">
                <div class="spec-bar-fill" style="width:${s.pct}%;background:${s.color}"></div>
              </div>
              <div class="spec-bar-count">${s.count}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="recent-consults-table">
        <div class="rct-header">
          <span class="rct-title">Recent Consultations</span>
          <span class="rct-subtitle">Last 5 completed sessions</span>
        </div>
        <table class="admin-table">
          <thead>
            <tr><th>Patient</th><th>Doctor</th><th>Specialty</th><th>Duration</th><th>Amount</th><th>Rating</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${RECENT_CONSULTS.map((c) => `
              <tr>
                <td>${escapeHtml(c.patient)}</td>
                <td>${escapeHtml(c.doctor)}</td>
                <td>${escapeHtml(c.spec)}</td>
                <td>${escapeHtml(c.duration)}</td>
                <td style="font-weight:700;color:var(--green)">${escapeHtml(c.amount)}</td>
                <td style="color:#f59e0b;font-weight:700">${escapeHtml(c.rating)}</td>
                <td><span class="status-pill completed">${escapeHtml(c.status)}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="admin-payout-overview">
      <div class="payout-overview-header">
        <div>
          <h3>Payout Overview</h3>
          <p>Doctor earnings and platform revenue</p>
        </div>
        <button type="button" class="btn-view-all-consults" data-admin-tab="revenue">Full Revenue Report →</button>
      </div>

      <div class="payout-overview-grid">
        <div class="payout-stat-cards">
          <div class="payout-stat payout-stat-clickable" data-admin-tab="revenue" role="button" tabindex="0" style="cursor:pointer">
            <div class="payout-stat-icon">💸</div>
            <div class="payout-stat-value">₦40.4M</div>
            <div class="payout-stat-label">Paid to Doctors (70%)</div>
            <div class="payout-stat-trend up">↑ +₦8.4M this month</div>
          </div>
          <div class="payout-stat payout-stat-clickable" data-admin-tab="revenue" role="button" tabindex="0" style="cursor:pointer">
            <div class="payout-stat-icon">🏦</div>
            <div class="payout-stat-value">₦17.3M</div>
            <div class="payout-stat-label">Platform Revenue (30%)</div>
            <div class="payout-stat-trend up">↑ +₦3.6M this month</div>
          </div>
          <div class="payout-stat pending-payout payout-stat-clickable" data-rev-tab="invoices" role="button" tabindex="0" style="cursor:pointer">
            <div class="payout-stat-icon">⏳</div>
            <div class="payout-stat-value">₦2.8M</div>
            <div class="payout-stat-label">Pending Payouts</div>
            <div class="payout-stat-trend"><span style="color:var(--amber)">8 withdrawal requests</span></div>
          </div>
          <div class="payout-stat payout-stat-clickable" data-admin-tab="revenue" role="button" tabindex="0" style="cursor:pointer">
            <div class="payout-stat-icon">📈</div>
            <div class="payout-stat-value">₦5.2M</div>
            <div class="payout-stat-label">This Month Revenue</div>
            <div class="payout-stat-trend up">↑ 22% growth</div>
          </div>
        </div>

        <div class="admin-revenue-chart">
          <div class="arc-title">Monthly Revenue (₦) — Last 6 Months</div>
          <div class="admin-chart-bars">${renderRevenueBars()}</div>
          <div class="admin-chart-legend">
            <span class="legend-dot-doctors"></span> Doctors (70%)
            <span class="legend-dot-platform" style="margin-left:16px"></span> Platform (30%)
          </div>
        </div>
      </div>

      <div class="withdrawal-requests-section">
        <div class="wr-header">
          <span class="wr-title">💳 Pending Withdrawal Requests</span>
          <span class="wr-count">8 requests</span>
        </div>
        <div class="wr-list">
          ${WITHDRAWAL_REQUESTS.map((w) => `
            <div class="wr-item">
              <div class="wr-doctor">
                <div class="wr-avatar">${w.doctor.split(' ')[1]?.[0] || 'D'}</div>
                <div class="wr-info">
                  <div class="wr-name">${escapeHtml(w.doctor)}</div>
                  <div class="wr-bank">${escapeHtml(w.bank)} · ${escapeHtml(w.ref)}</div>
                </div>
              </div>
              <div class="wr-amount">${escapeHtml(w.amount)}</div>
              <div class="wr-date">${escapeHtml(w.date)}</div>
              <div class="wr-actions">
                <button type="button" class="btn-approve-sm" data-approve-withdrawal="${escapeHtml(w.ref)}">✅ Approve</button>
                <button type="button" class="btn-hold-sm" data-hold-withdrawal="${escapeHtml(w.ref)}">⏸️ Hold</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="admin-promos-widget">
      <div class="apw-header">
        <div>
          <h3>🎯 Active Promotions</h3>
          <p>Currently running campaigns on the platform</p>
        </div>
        <button type="button" class="btn-view-all-consults" data-admin-tab="doctors">Manage Promotions →</button>
      </div>
      <div class="apw-promos-row">
        ${[
          { name: 'Returning Patient 25% Off', uses: 1847, discount: '25%', expires: '31 Dec 2026', color: '#3b99e0' },
          { name: 'First Consultation Free', uses: 342, discount: '100%', expires: '30 Sep 2026', color: '#16a34a' },
          { name: 'Malaria Season 15% Off', uses: 2103, discount: '15%', expires: '31 Aug 2026', color: '#d97706' }
        ].map((p) => `
          <div class="apw-promo-card" style="border-left:4px solid ${p.color}">
            <div class="apw-promo-discount" style="color:${p.color}">${p.discount} OFF</div>
            <div class="apw-promo-name">${escapeHtml(p.name)}</div>
            <div class="apw-promo-meta">Used ${p.uses.toLocaleString()} times · Expires ${escapeHtml(p.expires)}</div>
            <div class="apw-promo-status">
              <div class="live-pulse-dot sm apw-promo-dot" style="background:${p.color}"></div>
              <span class="apw-promo-active" style="color:${p.color}">Active</span>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="apw-create-row">
        <button type="button" class="btn-create-promo-dash" data-action="create-promo-dash">✨ Create New Promotion</button>
        <div class="apw-total-savings">
          💰 Total patient savings this month: <strong style="color:var(--green)">₦3.8M</strong>
        </div>
      </div>
    </div>

    <div class="admin-monthly-chart-card">
      <div class="amc-header">
        <h3>Platform Growth (Last 7 Months)</h3>
        <div class="amc-legend">
          <span class="amc-leg-item users">● Users</span>
          <span class="amc-leg-item consults">● Consultations</span>
          <span class="amc-leg-item revenue">● Revenue (₦M)</span>
        </div>
      </div>
      <div class="amc-chart">${renderGrowthChart()}</div>
    </div>
  </div>`;
}

function refreshDashboard() {
  const el = document.getElementById('lastUpdatedTime');
  if (el) {
    el.textContent = new Date().toLocaleTimeString('en-NG', { timeZone: 'Africa/Lagos' });
  }
  toast('Dashboard refreshed!', 'info');
}

function exportReport() {
  const html = `
    <html><head><style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #1e293b; }
      .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-40deg); font-size: 72px; font-weight: 900; color: rgba(10,36,99,0.05); pointer-events: none; white-space: nowrap; z-index: 0; }
      .header { background: linear-gradient(135deg, #0a2463, #1d6aba); color: #fff; padding: 28px 36px; }
      .logo { font-size: 26px; font-weight: 900; } .logo span { color: #7ec8f7; }
      .header h2 { margin: 6px 0 4px; font-size: 17px; opacity: 0.9; }
      .header p { margin: 0; font-size: 12px; opacity: 0.7; }
      .body { padding: 28px 36px; position: relative; z-index: 1; }
      .section-title { font-size: 15px; font-weight: 800; color: #0a2463; margin: 20px 0 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
      .kpi-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 20px; }
      .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; text-align: center; }
      .kpi-val { font-size: 20px; font-weight: 800; color: #0a2463; }
      .kpi-lbl { font-size: 11px; color: #64748b; margin-top: 3px; }
      .kpi-trend { font-size: 10px; color: #16a34a; font-weight: 600; margin-top: 2px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th { background: #0a2463; color: #fff; padding: 9px 12px; font-size: 11px; text-align: left; }
      td { padding: 8px 12px; font-size: 11px; border-bottom: 1px solid #f1f5f9; }
      tr:nth-child(even) td { background: #f8fafc; }
      .footer { background: #0a2463; color: rgba(255,255,255,0.7); padding: 14px 36px; font-size: 11px; text-align: center; margin-top: 24px; }
      .footer strong { color: #7ec8f7; }
    </style></head><body>
      <div class="watermark">Virtualcare Nigeria</div>
      <div class="header">
        <div class="logo">Virtual<span>care</span> Nigeria</div>
        <h2>Platform Overview Report — ${getLagosDate()}</h2>
        <p>Generated by Admin · Confidential · virtualcare.me</p>
      </div>
      <div class="body">
        <div class="section-title">📊 Platform KPIs</div>
        <div class="kpi-row">
          <div class="kpi"><div class="kpi-val">1,247</div><div class="kpi-lbl">Total Users</div><div class="kpi-trend">↑ +12 today</div></div>
          <div class="kpi"><div class="kpi-val">89</div><div class="kpi-lbl">Active Doctors</div><div class="kpi-trend">↑ +2 this week</div></div>
          <div class="kpi"><div class="kpi-val">3,847</div><div class="kpi-lbl">Total Consultations</div><div class="kpi-trend">↑ +18% this month</div></div>
          <div class="kpi"><div class="kpi-val">₦57.7M</div><div class="kpi-lbl">Total Revenue</div><div class="kpi-trend">↑ +22% vs last month</div></div>
        </div>
        <div class="section-title">👨‍⚕️ Pending Doctor Applications</div>
        <table>
          <tr><th>Name</th><th>Specialty</th><th>State</th><th>MDCN Number</th><th>Applied</th></tr>
          ${[
            ['Dr. Fatima Al-Sayed', 'Cardiology', 'Lagos', 'MDN/LUTH/2019/08823', 'Today'],
            ['Dr. James Patel', 'Neurology', 'Abuja', 'MDN/NHA/2018/07234', 'Yesterday'],
            ['Dr. Aisha Bello', 'Psychiatry', 'Kano', 'MDN/AKTH/2020/09456', '2 days ago'],
            ['Dr. Emeka Eze', 'Pediatrics', 'Enugu', 'MDN/UNTH/2017/06789', '3 days ago']
          ].map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}
        </table>
        <div class="section-title">🎥 Recent Consultations</div>
        <table>
          <tr><th>Patient</th><th>Doctor</th><th>Specialty</th><th>Duration</th><th>Amount</th><th>Rating</th><th>Status</th></tr>
          ${[
            ['Amaka Obi', 'Dr. Okonkwo', 'Cardiology', '48 min', '₦11,250', '5★', 'Completed'],
            ['Emeka Nwosu', 'Dr. Okonkwo', 'Cardiology', '52 min', '₦11,250', '5★', 'Completed'],
            ['Fatima Aliyu', 'Dr. Musa', 'General Practice', '45 min', '₦3,750', '4★', 'Completed'],
            ['Ngozi Adeleke', 'Dr. Eze', 'Pediatrics', '50 min', '₦6,000', '5★', 'Completed'],
            ['Chukwudi Eze', 'Dr. Nwosu', 'Dermatology', '47 min', '₦7,500', '5★', 'Completed']
          ].map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}
        </table>
        <div class="section-title">💰 Pending Withdrawals</div>
        <table>
          <tr><th>Doctor</th><th>Bank</th><th>Amount</th><th>Date</th><th>Reference</th></tr>
          ${[
            ['Dr. Okonkwo', 'GTBank', '₦205,800', 'Today', 'WD-72369586'],
            ['Dr. Adeleke', 'Zenith Bank', '₦147,000', 'Yesterday', 'WD-83471234'],
            ['Dr. Musa', 'Access Bank', '₦89,500', '2 days ago', 'WD-94582345']
          ].map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}
        </table>
      </div>
      <div class="footer">© ${new Date().getFullYear()} <strong>Virtualcare Nigeria</strong> · virtualcare.me · NDPR Compliant · Admin Report — Confidential</div>
    </body></html>
  `;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) setTimeout(() => win.print(), 800);
  toast('✅ Dashboard report ready — print or save as PDF!', 'success', 4000);
}

function approveDoctor() {
  toast('Doctor approved! ✅ Email sent.', 'success');
}

function rejectDoctor() {
  toast('Doctor application rejected.', 'warning');
}

function approveWithdrawal(ref) {
  toast(`Withdrawal ${ref} approved! Transfer initiated.`, 'success');
  sessionStorage.setItem('adminRevTab', 'invoices');
  setTimeout(() => showAdminTab('revenue'), 300);
}

function holdWithdrawal(ref) {
  toast(`Withdrawal ${ref} put on hold.`, 'warning');
}

function bindAdminDashboardEvents(root) {
  root.querySelector('#btnAdminRefresh')?.addEventListener('click', refreshDashboard);
  root.querySelector('#btnAdminExport')?.addEventListener('click', exportReport);
  root.querySelector('#btnViewLiveSessions')?.addEventListener('click', () => showAdminTab('live-sessions'));
  root.querySelector('#adminLiveCard')?.addEventListener('click', () => showAdminTab('live-sessions'));
  root.querySelector('#adminLiveCard')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showAdminTab('live-sessions');
    }
  });

  root.querySelectorAll('[data-admin-tab]').forEach((btn) => {
    btn.addEventListener('click', () => showAdminTab(btn.dataset.adminTab));
  });

  root.querySelectorAll('[data-approve-doctor]').forEach((btn) => {
    btn.addEventListener('click', () => approveDoctor(btn.dataset.approveDoctor));
  });

  root.querySelectorAll('[data-reject-doctor]').forEach((btn) => {
    btn.addEventListener('click', () => rejectDoctor(btn.dataset.rejectDoctor));
  });

  root.querySelectorAll('[data-approve-withdrawal]').forEach((btn) => {
    btn.addEventListener('click', () => approveWithdrawal(btn.dataset.approveWithdrawal));
  });

  root.querySelectorAll('[data-hold-withdrawal]').forEach((btn) => {
    btn.addEventListener('click', () => holdWithdrawal(btn.dataset.holdWithdrawal));
  });

  root.querySelector('[data-action="create-promo-dash"]')?.addEventListener('click', () => {
    sessionStorage.setItem('adminOpenCreatePromo', '1');
    showAdminTab('doctors');
  });

  root.querySelectorAll('[data-consult-filter]').forEach((card) => {
    card.addEventListener('click', () => {
      sessionStorage.setItem('adminConsultFilter', card.dataset.consultFilter);
      showAdminTab('consultations');
    });
  });

  root.querySelectorAll('[data-rev-tab]').forEach((card) => {
    const openRevenue = () => {
      sessionStorage.setItem('adminRevTab', card.dataset.revTab);
      showAdminTab('revenue');
    };
    card.addEventListener('click', openRevenue);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openRevenue();
      }
    });
  });
}

export async function renderAdminDashboard(container) {
  container.innerHTML = getAdminDashboardHTML();
  bindAdminDashboardEvents(container);
  simulateNewRegistrations();
}
