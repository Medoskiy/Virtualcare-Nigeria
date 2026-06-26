import { toast } from '../shared/toast.js';
import { escapeHtml } from '../shared/utils.js';

let consultRoot = null;
let trackedConsultations = new Set();
let currentConsultFilter = 'all';
const flaggedConsultations = new Set();

const ALL_CONSULTATIONS = [
  { id: 'C-001', patientName: 'Amaka Obi', patientId: 'P-FEB83', doctorName: 'Dr. Okonkwo', doctorId: 'D-001', specialty: 'Cardiology', date: 'Wed, 25 Jun 2026', time: '10:00 AM', duration: '48 min', amount: '₦15,000', platformCut: '₦4,500', doctorCut: '₦10,500', status: 'completed', rating: 5, isReturning: true, type: 'Video', notes: '' },
  { id: 'C-002', patientName: 'Emeka Nwosu', patientId: 'P-AB124', doctorName: 'Dr. Okonkwo', doctorId: 'D-001', specialty: 'Cardiology', date: 'Wed, 25 Jun 2026', time: '11:00 AM', duration: '52 min', amount: '₦15,000', platformCut: '₦4,500', doctorCut: '₦10,500', status: 'completed', rating: 5, isReturning: true, type: 'Video', notes: '' },
  { id: 'C-003', patientName: 'Fatima Aliyu', patientId: 'P-CD456', doctorName: 'Dr. Ibrahim Musa', doctorId: 'D-003', specialty: 'General Practice', date: 'Wed, 25 Jun 2026', time: '12:00 PM', duration: '45 min', amount: '₦5,000', platformCut: '₦1,500', doctorCut: '₦3,500', status: 'live', rating: null, isReturning: true, type: 'Video', notes: '' },
  { id: 'C-004', patientName: 'Chukwudi Eze', patientId: 'P-EF789', doctorName: 'Dr. Chioma Eze', doctorId: 'D-004', specialty: 'Pediatrics', date: 'Wed, 25 Jun 2026', time: '02:00 PM', duration: null, amount: '₦8,000', platformCut: '₦2,400', doctorCut: '₦5,600', status: 'upcoming', rating: null, isReturning: false, type: 'Video', notes: '' },
  { id: 'C-005', patientName: 'Ngozi Adeleke', patientId: 'P-GH012', doctorName: 'Dr. Adaeze Nwosu', doctorId: 'D-002', specialty: 'Dermatology', date: 'Wed, 25 Jun 2026', time: '03:00 PM', duration: null, amount: '₦10,000', platformCut: '₦3,000', doctorCut: '₦7,000', status: 'upcoming', rating: null, isReturning: false, type: 'Video', notes: '' },
  { id: 'C-006', patientName: 'Michael Torres', patientId: 'P-IJ345', doctorName: 'Dr. Ibrahim Musa', doctorId: 'D-003', specialty: 'General Practice', date: 'Tue, 24 Jun 2026', time: '09:00 AM', duration: null, amount: '₦5,000', platformCut: '₦1,500', doctorCut: '₦3,500', status: 'cancelled', rating: null, isReturning: false, type: 'Video', notes: 'Patient did not show up' },
  { id: 'C-007', patientName: 'Blessing Okafor', patientId: 'P-KL678', doctorName: 'Dr. Okonkwo', doctorId: 'D-001', specialty: 'Cardiology', date: 'Thu, 26 Jun 2026', time: '09:00 AM', duration: null, amount: '₦15,000', platformCut: '₦4,500', doctorCut: '₦10,500', status: 'pending', rating: null, isReturning: false, type: 'Video', notes: 'Awaiting payment confirmation' },
  { id: 'C-008', patientName: 'Ibrahim Sule', patientId: 'P-MN901', doctorName: 'Dr. Ibrahim Musa', doctorId: 'D-003', specialty: 'General Practice', date: 'Thu, 26 Jun 2026', time: '10:00 AM', duration: null, amount: '₦5,000', platformCut: '₦1,500', doctorCut: '₦3,500', status: 'pending', rating: null, isReturning: true, type: 'Audio', notes: '' },
  { id: 'C-009', patientName: 'Amaka Obi', patientId: 'P-FEB83', doctorName: 'Dr. Okonkwo', doctorId: 'D-001', specialty: 'Cardiology', date: 'Mon, 22 Jun 2026', time: '10:00 AM', duration: '50 min', amount: '₦11,250', platformCut: '₦3,375', doctorCut: '₦7,875', status: 'completed', rating: 5, isReturning: true, type: 'Video', notes: '', discount: '25% returning' },
  { id: 'C-010', patientName: 'Fatima Aliyu', patientId: 'P-CD456', doctorName: 'Dr. Okonkwo', doctorId: 'D-001', specialty: 'Cardiology', date: 'Fri, 19 Jun 2026', time: '11:00 AM', duration: '45 min', amount: '₦11,250', platformCut: '₦3,375', doctorCut: '₦7,875', status: 'completed', rating: 4, isReturning: true, type: 'Video', notes: '', discount: '25% returning' }
];

const STATUS_CONFIG = {
  live: { bg: '#fee2e2', color: '#991b1b', label: '🔴 Live', pulse: true },
  upcoming: { bg: '#ede9fe', color: '#6d28d9', label: '📅 Upcoming', pulse: false },
  pending: { bg: '#fef3c7', color: '#92400e', label: '⏳ Pending', pulse: false },
  completed: { bg: '#dcfce7', color: '#166534', label: '✅ Completed', pulse: false },
  cancelled: { bg: '#f1f5f9', color: '#64748b', label: '❌ Cancelled', pulse: false }
};

const TAB_MAP = {
  all: 'tabAll',
  live: 'tabLive',
  upcoming: 'tabUpcoming',
  pending: 'tabPending',
  completed: 'tabCompleted',
  cancelled: 'tabCancelled',
  returning: 'tabReturning'
};

function isFlagged(id) {
  return flaggedConsultations.has(id);
}

function renderConsultRow(c) {
  const sc = STATUS_CONFIG[c.status] || STATUS_CONFIG.completed;
  const flagged = isFlagged(c.id);

  return `
  <tr class="consult-row status-${c.status} ${c.isReturning ? 'returning-row' : ''} ${flagged ? 'flagged-row' : ''}"
    id="row-${escapeHtml(c.id)}"
    data-status="${escapeHtml(c.status)}"
    data-specialty="${escapeHtml(c.specialty)}"
    data-type="${escapeHtml(c.type)}"
    data-returning="${c.isReturning}">
    <td class="td-track">
      <div class="track-cell">
        <input type="checkbox" class="track-checkbox" id="track-${escapeHtml(c.id)}"
          data-action="toggle-track" data-id="${escapeHtml(c.id)}"
          data-patient="${escapeHtml(c.patientName)}" data-doctor="${escapeHtml(c.doctorName)}"
          title="Track this consultation" />
        ${flagged ? '<span class="flagged-indicator" title="Flagged">🚩</span>' : ''}
      </div>
    </td>
    <td>
      <div class="consult-id-cell">
        <span class="consult-id">${escapeHtml(c.id)}</span>
        ${c.discount ? `<span class="discount-badge">🏷️ ${escapeHtml(c.discount)}</span>` : ''}
      </div>
    </td>
    <td>
      <div class="consult-person-cell">
        <div class="cpc-avatar patient-av">${c.patientName.split(' ').map((n) => n[0]).join('')}</div>
        <div class="cpc-info">
          <div class="cpc-name">${escapeHtml(c.patientName)}${c.isReturning ? ' <span class="returning-tag">🔁</span>' : ''}</div>
          <div class="cpc-id">#${escapeHtml(c.patientId)}</div>
        </div>
      </div>
    </td>
    <td>
      <div class="consult-person-cell">
        <div class="cpc-avatar doctor-av">${c.doctorName.replace('Dr. ', '').split(' ').map((n) => n[0]).join('').slice(0, 2)}</div>
        <div class="cpc-info">
          <div class="cpc-name">${escapeHtml(c.doctorName)}</div>
          <div class="cpc-id">#${escapeHtml(c.doctorId)}</div>
        </div>
      </div>
    </td>
    <td><span class="specialty-chip">${escapeHtml(c.specialty)}</span></td>
    <td>
      <div class="date-time-cell">
        <div class="dtc-date">${escapeHtml(c.date)}</div>
        <div class="dtc-time">${escapeHtml(c.time)}</div>
      </div>
    </td>
    <td><span class="${c.duration ? 'duration-badge' : 'duration-na'}">${c.duration ? escapeHtml(c.duration) : '—'}</span></td>
    <td><span class="type-badge ${c.type === 'Video' ? 'video' : 'audio'}">${c.type === 'Video' ? '📹' : '📞'} ${escapeHtml(c.type)}</span></td>
    <td>
      <div class="amount-cell">
        <div class="amount-total">${escapeHtml(c.amount)}</div>
        <div class="amount-split">
          <span class="split-doc">D: ${escapeHtml(c.doctorCut)}</span>
          <span class="split-plat">P: ${escapeHtml(c.platformCut)}</span>
        </div>
      </div>
    </td>
    <td>
      <div class="status-cell">
        <span class="consult-status-badge" style="background:${sc.bg};color:${sc.color}">
          ${sc.pulse ? '<span class="status-pulse-dot"></span>' : ''}${sc.label}
        </span>
        ${c.status === 'cancelled' && c.notes ? `<div class="cancelled-reason">${escapeHtml(c.notes)}</div>` : ''}
        ${c.status === 'pending' ? `<button type="button" class="btn-confirm-pending" data-action="confirm-pending" data-id="${escapeHtml(c.id)}">Confirm</button>` : ''}
      </div>
    </td>
    <td>
      <span class="rating-stars-cell ${c.rating ? 'has-rating' : 'no-rating'}">
        ${c.rating ? `<span style="color:#f59e0b">${'★'.repeat(c.rating)}</span><span style="color:#e2e8f0">${'☆'.repeat(5 - c.rating)}</span>` : '<span style="color:var(--muted)">—</span>'}
      </span>
    </td>
    <td>
      <div class="consult-row-actions">
        <button type="button" class="btn-cra view" data-action="view-detail" data-id="${escapeHtml(c.id)}" title="View Details">👁️</button>
        ${c.status === 'live' ? `<button type="button" class="btn-cra monitor" data-action="monitor-live" data-id="${escapeHtml(c.id)}" title="Monitor Session">📡</button>` : ''}
        ${c.status === 'upcoming' || c.status === 'pending' ? `<button type="button" class="btn-cra cancel" data-action="cancel-consult" data-id="${escapeHtml(c.id)}" title="Cancel">❌</button>` : ''}
        <button type="button" class="btn-cra ${flagged ? 'unflag' : 'flag'}" data-action="flag-consult" data-id="${escapeHtml(c.id)}" data-flagged="${flagged}" title="${flagged ? 'Remove flag' : 'Flag'}">${flagged ? '🏴' : '🚩'}</button>
      </div>
    </td>
  </tr>`;
}

function getAdminConsultationsHTML() {
  return `
  <div class="admin-consultations-page">
    <div class="consult-page-header">
      <div>
        <h2>Consultations</h2>
        <p>Track, monitor and manage all consultations on the platform</p>
      </div>
      <div class="consult-header-actions">
        <button type="button" class="btn-export-consults" data-action="export-consults">📊 Export</button>
        <button type="button" class="btn-refresh-consults" data-action="refresh-consults">🔄 Refresh</button>
      </div>
    </div>

    <div class="consult-kpi-row">
      <div class="consult-kpi-card" data-action="set-filter" data-filter="all" style="border-top:3px solid #3b99e0">
        <div class="ckc-icon">📊</div><div class="ckc-value">3,847</div><div class="ckc-label">Total All Time</div><div class="ckc-trend up">↑ +18% this month</div>
      </div>
      <div class="consult-kpi-card" data-action="set-filter" data-filter="live" style="border-top:3px solid #dc2626">
        <div class="ckc-icon">🔴</div><div class="ckc-value live-num">3</div><div class="ckc-label">Live Now</div><div class="ckc-live-badge">● LIVE</div>
      </div>
      <div class="consult-kpi-card" data-action="set-filter" data-filter="upcoming" style="border-top:3px solid #7c3aed">
        <div class="ckc-icon">📅</div><div class="ckc-value">24</div><div class="ckc-label">Upcoming Today</div><div class="ckc-trend">Next in 45 min</div>
      </div>
      <div class="consult-kpi-card" data-action="set-filter" data-filter="pending" style="border-top:3px solid #d97706">
        <div class="ckc-icon">⏳</div><div class="ckc-value">8</div><div class="ckc-label">Pending Payment</div><div class="ckc-trend warning">Awaiting confirmation</div>
      </div>
      <div class="consult-kpi-card" data-action="set-filter" data-filter="completed" style="border-top:3px solid #16a34a">
        <div class="ckc-icon">✅</div><div class="ckc-value">3,810</div><div class="ckc-label">Completed</div><div class="ckc-trend up">99.1% success rate</div>
      </div>
      <div class="consult-kpi-card" data-action="set-filter" data-filter="cancelled" style="border-top:3px solid #94a3b8">
        <div class="ckc-icon">❌</div><div class="ckc-value">37</div><div class="ckc-label">Cancelled</div><div class="ckc-trend">0.9% cancel rate</div>
      </div>
      <div class="consult-kpi-card" data-action="set-filter" data-filter="returning" style="border-top:3px solid #0f766e">
        <div class="ckc-icon">🔁</div><div class="ckc-value">1,847</div><div class="ckc-label">Returning Patients</div><div class="ckc-trend up">↑ 48% of all consults</div>
      </div>
    </div>

    <div class="consult-toolbar">
      <div class="consult-search-wrap">
        <span class="ct-search-icon">🔍</span>
        <input type="text" id="consultSearch" class="consult-search-input" placeholder="Search by patient name, ID, doctor, specialty..." />
      </div>
      <div class="consult-filters">
        <select id="consultStatusFilter" class="consult-filter-select">
          <option value="">All Status</option>
          <option value="live">🔴 Live</option>
          <option value="upcoming">📅 Upcoming</option>
          <option value="pending">⏳ Pending</option>
          <option value="completed">✅ Completed</option>
          <option value="cancelled">❌ Cancelled</option>
        </select>
        <select id="consultSpecialtyFilter" class="consult-filter-select">
          <option value="">All Specialties</option>
          <option value="Cardiology">Cardiology</option>
          <option value="General Practice">General Practice</option>
          <option value="Dermatology">Dermatology</option>
          <option value="Pediatrics">Pediatrics</option>
          <option value="Psychiatry">Psychiatry</option>
        </select>
        <select id="consultTypeFilter" class="consult-filter-select">
          <option value="">All Types</option>
          <option value="Video">📹 Video</option>
          <option value="Audio">📞 Audio</option>
        </select>
      </div>
      <div class="consult-results-count" id="consultResultsCount">Showing all 10 consultations</div>
    </div>

    <div class="tracking-toggle-banner" id="trackingBanner" style="display:none">
      <div class="ttb-left">
        <div class="ttb-icon">🎯</div>
        <div class="ttb-info">
          <div class="ttb-title">Tracking Active</div>
          <div class="ttb-detail" id="ttbDetail">Monitoring all consultations</div>
        </div>
      </div>
      <button type="button" class="btn-clear-tracking" data-action="clear-tracking">✕ Clear Tracking</button>
    </div>

    <div class="consult-section-tabs">
      <button type="button" class="consult-tab active" id="tabAll" data-consult-tab="all">📋 All Consultations <span class="ctab-count">10</span></button>
      <button type="button" class="consult-tab" id="tabLive" data-consult-tab="live">🔴 Live <span class="ctab-count live">1</span></button>
      <button type="button" class="consult-tab" id="tabUpcoming" data-consult-tab="upcoming">📅 Upcoming <span class="ctab-count">2</span></button>
      <button type="button" class="consult-tab" id="tabPending" data-consult-tab="pending">⏳ Pending <span class="ctab-count warning">2</span></button>
      <button type="button" class="consult-tab" id="tabCompleted" data-consult-tab="completed">✅ Completed <span class="ctab-count">5</span></button>
      <button type="button" class="consult-tab" id="tabCancelled" data-consult-tab="cancelled">❌ Cancelled <span class="ctab-count">1</span></button>
      <button type="button" class="consult-tab" id="tabReturning" data-consult-tab="returning">🔁 Returning Patients <span class="ctab-count teal">4</span></button>
    </div>

    <div class="consult-table-wrap">
      <table class="consult-table" id="consultTable">
        <thead>
          <tr>
            <th class="th-track">
              <div class="track-all-wrap">
                <input type="checkbox" id="trackAllCheckbox" title="Track all" />
                <span class="th-track-label">Track</span>
              </div>
            </th>
            <th>Consultation ID</th><th>Patient</th><th>Doctor</th><th>Specialty</th>
            <th>Date & Time</th><th>Duration</th><th>Type</th><th>Amount</th>
            <th>Status</th><th>Rating</th><th>Actions</th>
          </tr>
        </thead>
        <tbody id="consultTableBody">${ALL_CONSULTATIONS.map(renderConsultRow).join('')}</tbody>
      </table>
    </div>

    <div id="consultDetailModal" class="admin-modal-overlay" style="display:none">
      <div class="consult-detail-modal-box" id="consultDetailBox"></div>
    </div>
  </div>`;
}

export function setConsultFilter(filter) {
  currentConsultFilter = filter;
  const tabId = TAB_MAP[filter];
  const tabEl = consultRoot?.querySelector(`#${tabId}`) || document.getElementById(tabId);
  if (tabEl) setConsultTab(filter, tabEl);
  consultRoot?.querySelector('#consultTable')?.scrollIntoView({ behavior: 'smooth' });
}

function setConsultTab(tab, btn) {
  currentConsultFilter = tab;
  consultRoot?.querySelectorAll('.consult-tab').forEach((t) => t.classList.toggle('active', t === btn));
  filterConsultations();
}

function filterConsultations() {
  if (!consultRoot) return;

  const search = (consultRoot.querySelector('#consultSearch')?.value || '').toLowerCase().trim();
  const status = consultRoot.querySelector('#consultStatusFilter')?.value || '';
  const specialty = consultRoot.querySelector('#consultSpecialtyFilter')?.value || '';
  const type = consultRoot.querySelector('#consultTypeFilter')?.value || '';
  const rows = consultRoot.querySelectorAll('#consultTableBody .consult-row');
  let visibleCount = 0;

  rows.forEach((row) => {
    const rowStatus = row.dataset.status || '';
    const rowSpec = row.dataset.specialty || '';
    const rowType = row.dataset.type || '';
    const rowReturning = row.dataset.returning === 'true';
    const text = row.textContent.toLowerCase();
    let show = true;

    if (currentConsultFilter !== 'all') {
      show = currentConsultFilter === 'returning' ? rowReturning : rowStatus === currentConsultFilter;
    }
    if (show && search && !text.includes(search)) show = false;
    if (show && status && rowStatus !== status) show = false;
    if (show && specialty && rowSpec !== specialty) show = false;
    if (show && type && rowType !== type) show = false;

    row.style.display = show ? '' : 'none';
    if (show) visibleCount++;
  });

  const countEl = consultRoot.querySelector('#consultResultsCount');
  if (countEl) {
    const filterLabel = currentConsultFilter !== 'all' ? ` (${currentConsultFilter})` : '';
    countEl.textContent = `Showing ${visibleCount} consultation${visibleCount !== 1 ? 's' : ''}${filterLabel}`;
  }
}

function updateTrackingBanner() {
  const banner = consultRoot?.querySelector('#trackingBanner');
  const detail = consultRoot?.querySelector('#ttbDetail');
  if (!banner) return;

  if (trackedConsultations.size > 0) {
    banner.style.display = 'flex';
    if (detail) {
      const count = trackedConsultations.size;
      detail.textContent = `Tracking ${count} consultation${count !== 1 ? 's' : ''}`;
    }
  } else {
    banner.style.display = 'none';
  }
}

function toggleTrack(consultId, checkbox) {
  const row = consultRoot?.querySelector(`#row-${consultId}`);
  if (checkbox.checked) {
    trackedConsultations.add(consultId);
    row?.classList.add('tracked-row');
  } else {
    trackedConsultations.delete(consultId);
    row?.classList.remove('tracked-row');
  }
  updateTrackingBanner();
}

function toggleTrackAll(checkbox) {
  consultRoot?.querySelectorAll('.track-checkbox').forEach((cb) => {
    cb.checked = checkbox.checked;
    const consultId = cb.dataset.id;
    const row = consultRoot?.querySelector(`#row-${consultId}`);
    if (checkbox.checked) {
      trackedConsultations.add(consultId);
      row?.classList.add('tracked-row');
    } else {
      trackedConsultations.delete(consultId);
      row?.classList.remove('tracked-row');
    }
  });
  updateTrackingBanner();
}

function clearTracking() {
  trackedConsultations.clear();
  consultRoot?.querySelectorAll('.track-checkbox').forEach((cb) => { cb.checked = false; });
  consultRoot?.querySelectorAll('.consult-row').forEach((row) => row.classList.remove('tracked-row'));
  const trackAll = consultRoot?.querySelector('#trackAllCheckbox');
  if (trackAll) trackAll.checked = false;
  updateTrackingBanner();
  toast('Tracking cleared', 'info');
}

function viewConsultDetail(consultId) {
  const c = ALL_CONSULTATIONS.find((x) => x.id === consultId);
  if (!c || !consultRoot) return;

  const modal = consultRoot.querySelector('#consultDetailModal');
  const box = consultRoot.querySelector('#consultDetailBox');
  const statusColors = { live: '#dc2626', upcoming: '#7c3aed', pending: '#d97706', completed: '#16a34a', cancelled: '#64748b' };
  const color = statusColors[c.status] || '#16a34a';
  const flagged = isFlagged(c.id);

  box.innerHTML = `
    <div class="cdm-header" style="background:linear-gradient(135deg, ${color}, ${color}cc)">
      <div class="cdm-header-content">
        <div class="cdm-id-badge">${escapeHtml(c.id)}</div>
        <h3>Consultation Details</h3>
        <div class="cdm-status" style="color:rgba(255,255,255,0.9)">${c.status.toUpperCase()}${c.isReturning ? ' · 🔁 Returning Patient' : ''}</div>
      </div>
      <button type="button" class="dam-close-btn" data-action="close-detail">×</button>
    </div>
    <div class="cdm-body">
      <div class="cdm-participants">
        <div class="cdm-participant patient">
          <div class="cdm-part-avatar patient-av">${c.patientName.split(' ').map((n) => n[0]).join('')}</div>
          <div class="cdm-part-info">
            <div class="cdm-part-role">👤 Patient</div>
            <div class="cdm-part-name">${escapeHtml(c.patientName)}</div>
            <div class="cdm-part-id">#${escapeHtml(c.patientId)}</div>
          </div>
        </div>
        <div class="cdm-vs-arrow">⟷</div>
        <div class="cdm-participant doctor">
          <div class="cdm-part-avatar doctor-av">${c.doctorName.replace('Dr. ', '').split(' ').map((n) => n[0]).join('').slice(0, 2)}</div>
          <div class="cdm-part-info">
            <div class="cdm-part-role">👨‍⚕️ Doctor</div>
            <div class="cdm-part-name">${escapeHtml(c.doctorName)}</div>
            <div class="cdm-part-id">#${escapeHtml(c.doctorId)}</div>
          </div>
        </div>
      </div>
      <div class="cdm-details-grid">
        <div class="cdm-detail-item"><span>Specialty</span><strong>${escapeHtml(c.specialty)}</strong></div>
        <div class="cdm-detail-item"><span>Date</span><strong>${escapeHtml(c.date)}</strong></div>
        <div class="cdm-detail-item"><span>Time</span><strong>${escapeHtml(c.time)}</strong></div>
        <div class="cdm-detail-item"><span>Duration</span><strong>${c.duration ? escapeHtml(c.duration) : 'N/A'}</strong></div>
        <div class="cdm-detail-item"><span>Type</span><strong>${escapeHtml(c.type)} Call</strong></div>
        <div class="cdm-detail-item"><span>Returning Patient</span><strong>${c.isReturning ? '🔁 Yes (25% discount)' : '🆕 No'}</strong></div>
      </div>
      <div class="cdm-financials">
        <div class="cdm-fin-title">💰 Financial Breakdown</div>
        <div class="cdm-fin-row total"><span>Total Charged</span><strong>${escapeHtml(c.amount)}</strong></div>
        <div class="cdm-fin-row"><span>Doctor Receives (70%)</span><strong style="color:var(--green)">${escapeHtml(c.doctorCut)}</strong></div>
        <div class="cdm-fin-row"><span>Platform Keeps (30%)</span><strong style="color:var(--bright-blue)">${escapeHtml(c.platformCut)}</strong></div>
        ${c.discount ? `<div class="cdm-fin-row discount"><span>Discount Applied</span><strong style="color:#7c3aed">🏷️ ${escapeHtml(c.discount)}</strong></div>` : ''}
      </div>
      ${c.notes ? `<div class="cdm-notes"><div class="cdm-notes-title">📝 Notes</div><div class="cdm-notes-text">${escapeHtml(c.notes)}</div></div>` : ''}
      ${c.rating ? `<div class="cdm-rating-section"><div class="cdm-notes-title">⭐ Patient Rating</div><div class="cdm-rating-stars"><span style="color:#f59e0b;font-size:20px">${'★'.repeat(c.rating)}</span><span style="color:#e2e8f0;font-size:20px">${'☆'.repeat(5 - c.rating)}</span><span style="font-weight:700;color:var(--deep-blue);margin-left:8px">${c.rating}.0 / 5.0</span></div></div>` : ''}
    </div>
    <div class="cdm-footer">
      <button type="button" class="btn-cdm-close" data-action="close-detail">Close</button>
      <div class="cdm-footer-actions">
        ${c.status === 'live' ? `<button type="button" class="btn-cdm-monitor" data-action="monitor-live" data-id="${escapeHtml(c.id)}">📡 Monitor Live</button>` : ''}
        ${c.status === 'upcoming' || c.status === 'pending' ? `<button type="button" class="btn-cdm-cancel" data-action="cancel-consult" data-id="${escapeHtml(c.id)}">❌ Cancel</button>` : ''}
        <button type="button" class="btn-cdm-flag" data-action="flag-consult" data-id="${escapeHtml(c.id)}" data-flagged="${flagged}">🚩 ${flagged ? 'Remove Flag' : 'Flag'}</button>
      </div>
    </div>`;

  modal.style.display = 'flex';
}

function closeConsultDetail() {
  consultRoot?.querySelector('#consultDetailModal')?.style && (consultRoot.querySelector('#consultDetailModal').style.display = 'none');
}

function monitorLive(consultId) {
  toast(`📡 Monitoring consultation ${consultId}...`, 'info');
}

function cancelConsult(consultId) {
  if (!confirm(`Cancel consultation ${consultId}?\nPatient and doctor will be notified.`)) return;

  const row = consultRoot?.querySelector(`#row-${consultId}`);
  const c = ALL_CONSULTATIONS.find((x) => x.id === consultId);
  if (c) c.status = 'cancelled';

  if (row) {
    const statusEl = row.querySelector('.consult-status-badge');
    if (statusEl) {
      statusEl.style.background = '#f1f5f9';
      statusEl.style.color = '#64748b';
      statusEl.innerHTML = '❌ Cancelled';
    }
    row.dataset.status = 'cancelled';
    row.classList.remove('status-live', 'status-upcoming', 'status-pending');
    row.classList.add('status-cancelled');
    row.querySelector('.btn-cra.cancel')?.remove();
    row.querySelector('.btn-confirm-pending')?.remove();
  }

  closeConsultDetail();
  toast(`Consultation ${consultId} cancelled. Both parties notified.`, 'warning');
}

function flagConsult(consultId, isFlagged) {
  const row = consultRoot?.querySelector(`#row-${consultId}`);
  const flagBtn = row?.querySelector('[data-action="flag-consult"]');

  if (isFlagged) {
    flaggedConsultations.delete(consultId);
    flagBtn?.classList.remove('unflag');
    flagBtn?.classList.add('flag');
    flagBtn?.setAttribute('data-flagged', 'false');
    flagBtn && (flagBtn.title = 'Flag');
    flagBtn && (flagBtn.textContent = '🚩');
    row?.classList.remove('flagged-row');
    row?.querySelector('.flagged-indicator')?.remove();
    toast(`Flag removed from ${consultId}`, 'info');
  } else {
    flaggedConsultations.add(consultId);
    flagBtn?.classList.remove('flag');
    flagBtn?.classList.add('unflag');
    flagBtn?.setAttribute('data-flagged', 'true');
    flagBtn && (flagBtn.title = 'Remove flag');
    flagBtn && (flagBtn.textContent = '🏴');
    row?.classList.add('flagged-row');
    const trackCell = row?.querySelector('.track-cell');
    if (trackCell && !trackCell.querySelector('.flagged-indicator')) {
      trackCell.insertAdjacentHTML('beforeend', '<span class="flagged-indicator" title="Flagged">🚩</span>');
    }
    toast(`🚩 ${consultId} flagged for review`, 'warning');
  }
  closeConsultDetail();
}

function confirmPending(consultId) {
  const row = consultRoot?.querySelector(`#row-${consultId}`);
  const c = ALL_CONSULTATIONS.find((x) => x.id === consultId);
  if (c) c.status = 'upcoming';

  if (row) {
    const statusEl = row.querySelector('.consult-status-badge');
    if (statusEl) {
      statusEl.style.background = '#dcfce7';
      statusEl.style.color = '#166534';
      statusEl.textContent = '✅ Confirmed';
    }
    row.dataset.status = 'upcoming';
    row.querySelector('.btn-confirm-pending')?.remove();
  }
  toast(`✅ Consultation ${consultId} confirmed!`, 'success');
}

function exportConsultations() {
  toast('Exporting consultations to CSV...', 'info');
}

function refreshConsultations() {
  toast('Consultations refreshed ✅', 'info');
}

function handleConsultAction(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;

  const { action, id, filter, flagged, patient, doctor } = el.dataset;

  switch (action) {
    case 'export-consults': exportConsultations(); break;
    case 'refresh-consults': refreshConsultations(); break;
    case 'set-filter': setConsultFilter(filter); break;
    case 'clear-tracking': clearTracking(); break;
    case 'toggle-track': toggleTrack(id, el); break;
    case 'view-detail': viewConsultDetail(id); break;
    case 'close-detail': closeConsultDetail(); break;
    case 'monitor-live': monitorLive(id); break;
    case 'cancel-consult': cancelConsult(id); break;
    case 'flag-consult': flagConsult(id, flagged === 'true'); break;
    case 'confirm-pending': confirmPending(id); break;
    default: break;
  }
}

function bindAdminConsultationsEvents(root) {
  consultRoot = root;
  root.addEventListener('click', handleConsultAction);

  root.querySelectorAll('[data-consult-tab]').forEach((tab) => {
    tab.addEventListener('click', () => setConsultTab(tab.dataset.consultTab, tab));
  });

  root.querySelector('#consultSearch')?.addEventListener('input', filterConsultations);
  root.querySelector('#consultStatusFilter')?.addEventListener('change', filterConsultations);
  root.querySelector('#consultSpecialtyFilter')?.addEventListener('change', filterConsultations);
  root.querySelector('#consultTypeFilter')?.addEventListener('change', filterConsultations);

  root.querySelector('#trackAllCheckbox')?.addEventListener('change', (e) => toggleTrackAll(e.target));

  root.querySelector('#consultDetailModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'consultDetailModal') closeConsultDetail();
  });
}

export async function renderAdminConsultations(container) {
  trackedConsultations = new Set();
  flaggedConsultations.clear();
  currentConsultFilter = 'all';
  container.innerHTML = getAdminConsultationsHTML();
  bindAdminConsultationsEvents(container);

  const pendingFilter = sessionStorage.getItem('adminConsultFilter');
  if (pendingFilter) {
    sessionStorage.removeItem('adminConsultFilter');
    setTimeout(() => setConsultFilter(pendingFilter), 100);
  }
}
