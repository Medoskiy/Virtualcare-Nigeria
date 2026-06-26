import { toast } from '../shared/toast.js';
import { escapeHtml } from '../shared/utils.js';

const NIGERIAN_STATES_LIST = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi',
  'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta',
  'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger',
  'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

const DEMO_PATIENTS_ADMIN = [
  { id: 'P-FEB83', name: 'Amaka Obi', email: 'patient@virtualcare.com', phone: '08031112222', state: 'Lagos', joinDate: '15 Jan 2026', status: 'active', consultations: 12, spent: '₦135,000', isReturning: true, initials: 'AO', lastActive: '24 Jun 2026', notes: [] },
  { id: 'P-AB124', name: 'Emeka Nwosu', email: 'emeka.nwosu@gmail.com', phone: '08055678901', state: 'Lagos', joinDate: '22 Feb 2026', status: 'active', consultations: 5, spent: '₦56,250', isReturning: true, initials: 'EN', lastActive: '22 Jun 2026', notes: [] },
  { id: 'P-CD456', name: 'Fatima Aliyu', email: 'fatima.aliyu@yahoo.com', phone: '07061234567', state: 'Abuja', joinDate: '8 Mar 2026', status: 'active', consultations: 3, spent: '₦22,500', isReturning: true, initials: 'FA', lastActive: '19 Jun 2026', notes: [] },
  { id: 'P-EF789', name: 'Chukwudi Eze', email: 'chukwudi.eze@gmail.com', phone: '09091234567', state: 'Enugu', joinDate: '3 Apr 2026', status: 'active', consultations: 2, spent: '₦30,000', isReturning: false, initials: 'CE', lastActive: '17 Jun 2026', notes: ['New patient - cardiac concern flagged'] },
  { id: 'P-GH012', name: 'Ngozi Adeleke', email: 'ngozi.adeleke@hotmail.com', phone: '08121234567', state: 'Ibadan', joinDate: '15 Apr 2026', status: 'pending', consultations: 1, spent: '₦7,500', isReturning: false, initials: 'NA', lastActive: '15 Jun 2026', notes: [] },
  { id: 'P-IJ345', name: 'Michael Torres', email: 'michael.torres@gmail.com', phone: '08071234567', state: 'Lagos', joinDate: '24 Jun 2026', status: 'pending', consultations: 0, spent: '₦0', isReturning: false, initials: 'MT', lastActive: 'Today', notes: [] }
];

const DEMO_DOCTORS_ADMIN = [
  { id: 'D-001', name: 'Chukwuemeka Okonkwo', email: 'doctor@virtualcare.com', phone: '08031234567', state: 'Lagos', specialty: 'Cardiology', mdcn: 'MDN/FMC/2008/04521', hospital: 'LUTH', joinDate: '1 Jan 2024', status: 'verified', initials: 'CO', rating: 4.97, reviews: 289, consultations: 2840, earned: '₦1.98M', price: '₦15,000', lastActive: '24 Jun 2026', notes: [] },
  { id: 'D-002', name: 'Adaeze Nwosu', email: 'adaeze.nwosu@virtualcare.com', phone: '08055678901', state: 'Lagos', specialty: 'Dermatology', mdcn: 'MDN/UCH/2014/07823', hospital: 'Reddington Hospital', joinDate: '15 Jan 2024', status: 'verified', initials: 'AN', rating: 4.93, reviews: 214, consultations: 1780, earned: '₦1.25M', price: '₦10,000', lastActive: '23 Jun 2026', notes: [] },
  { id: 'D-003', name: 'Ibrahim Musa', email: 'ibrahim.musa@virtualcare.com', phone: '07061234567', state: 'Kano', specialty: 'General Practice', mdcn: 'MDN/AKTH/2016/09134', hospital: 'Aminu Kano Teaching Hospital', joinDate: '20 Jan 2024', status: 'verified', initials: 'IM', rating: 4.89, reviews: 498, consultations: 3620, earned: '₦1.27M', price: '₦5,000', lastActive: '25 Jun 2026', notes: [] },
  { id: 'D-P01', name: 'Fatima Al-Sayed', email: 'fatima.alsayed@gmail.com', phone: '08031112233', state: 'Lagos', specialty: 'Cardiology', mdcn: 'MDN/LUTH/2019/08823', hospital: 'LUTH', joinDate: '24 Jun 2026', status: 'pending', initials: 'FA', rating: 0, reviews: 0, consultations: 0, earned: '₦0', price: 'Not set', lastActive: 'Today', notes: ['Application submitted today'] },
  { id: 'D-P02', name: 'James Patel', email: 'james.patel@gmail.com', phone: '08071234567', state: 'Abuja', specialty: 'Neurology', mdcn: 'MDN/NHA/2018/07234', hospital: 'National Hospital Abuja', joinDate: '23 Jun 2026', status: 'pending', initials: 'JP', rating: 0, reviews: 0, consultations: 0, earned: '₦0', price: 'Not set', lastActive: 'Yesterday', notes: [] }
];

let currentUserTab = 'patients';
let currentMsgUserId = null;
let currentCommentUserId = null;
let usersRoot = null;

const PATIENT_STATUS = {
  active: { bg: '#dcfce7', color: '#166534', label: '✅ Active' },
  pending: { bg: '#fef3c7', color: '#92400e', label: '⏳ Pending' },
  suspended: { bg: '#fee2e2', color: '#991b1b', label: '🚫 Suspended' }
};

const DOCTOR_STATUS = {
  verified: { bg: '#dcfce7', color: '#166534', label: '✅ Verified' },
  pending: { bg: '#fef3c7', color: '#92400e', label: '⏳ Pending Review' },
  suspended: { bg: '#fee2e2', color: '#991b1b', label: '🚫 Suspended' }
};

function statusFilterKey(status) {
  return status === 'verified' ? 'active' : status;
}

function renderPatientCard(p) {
  const sc = PATIENT_STATUS[p.status] || PATIENT_STATUS.active;
  const dotClass = p.status === 'active' ? 'green' : p.status === 'pending' ? 'amber' : 'red';

  return `
  <div class="user-admin-card patient-card" id="patientCard-${escapeHtml(p.id)}"
    data-status="${escapeHtml(p.status)}" data-state="${escapeHtml(p.state)}"
    data-name="${escapeHtml(p.name.toLowerCase())}" data-join="${escapeHtml(p.joinDate)}">
    <div class="uac-header">
      <div class="uac-avatar-wrap">
        <div class="uac-avatar patient-av">${escapeHtml(p.initials)}</div>
        <div class="uac-status-dot ${dotClass}"></div>
      </div>
      <div class="uac-identity">
        <div class="uac-name">${escapeHtml(p.name)}</div>
        <div class="uac-id">#${escapeHtml(p.id)}</div>
        <div class="uac-joined">Joined ${escapeHtml(p.joinDate)}</div>
      </div>
      <div class="uac-status-badge" style="background:${sc.bg};color:${sc.color}">${sc.label}</div>
    </div>
    <div class="uac-details">
      <div class="uac-detail-row"><span>📧</span><span class="uac-detail-val">${escapeHtml(p.email)}</span></div>
      <div class="uac-detail-row"><span>📱</span><span class="uac-detail-val">${escapeHtml(p.phone)}</span></div>
      <div class="uac-detail-row"><span>📍</span><span class="uac-detail-val">${escapeHtml(p.state)} State</span></div>
      <div class="uac-detail-row"><span>🕐</span><span class="uac-detail-val">Last active: ${escapeHtml(p.lastActive)}</span></div>
    </div>
    <div class="uac-stats">
      <div class="uac-stat"><div class="uac-stat-val">${p.consultations}</div><div class="uac-stat-lbl">Consultations</div></div>
      <div class="uac-stat"><div class="uac-stat-val">${escapeHtml(p.spent)}</div><div class="uac-stat-lbl">Total Spent</div></div>
      <div class="uac-stat"><div class="uac-stat-val">${p.isReturning ? '🔁 Yes' : '🆕 New'}</div><div class="uac-stat-lbl">Returning</div></div>
    </div>
    ${p.notes.length ? `
    <div class="uac-notes-preview">
      <span class="uac-note-icon">📌</span>
      <span class="uac-note-text">${escapeHtml(p.notes[p.notes.length - 1])}</span>
    </div>` : ''}
    <div class="uac-actions">
      <button type="button" class="uac-btn view" data-action="view-patient" data-id="${escapeHtml(p.id)}">👁️ View Profile</button>
      <button type="button" class="uac-btn message" data-action="message" data-id="${escapeHtml(p.id)}" data-name="${escapeHtml(p.name)}" data-type="patient">✉️ Message</button>
      <button type="button" class="uac-btn comment" data-action="comment" data-id="${escapeHtml(p.id)}" data-name="${escapeHtml(p.name)}">💬 Note</button>
      ${p.status === 'pending' ? `
      <button type="button" class="uac-btn approve" data-action="approve-patient" data-id="${escapeHtml(p.id)}">✅ Approve</button>
      <button type="button" class="uac-btn delete" data-action="delete" data-id="${escapeHtml(p.id)}" data-name="${escapeHtml(p.name)}" data-card="patient">🗑️ Delete</button>` : `
      <button type="button" class="uac-btn ${p.status === 'suspended' ? 'reactivate' : 'suspend'}" data-action="suspend" data-id="${escapeHtml(p.id)}" data-status="${escapeHtml(p.status)}">
        ${p.status === 'suspended' ? '🔓 Reactivate' : '⏸️ Suspend'}
      </button>
      <button type="button" class="uac-btn delete" data-action="delete" data-id="${escapeHtml(p.id)}" data-name="${escapeHtml(p.name)}" data-card="patient">🗑️ Delete</button>`}
    </div>
  </div>`;
}

function renderDoctorCard(d) {
  const sc = DOCTOR_STATUS[d.status] || DOCTOR_STATUS.pending;
  const dotClass = d.status === 'verified' ? 'green' : d.status === 'pending' ? 'amber' : 'red';
  const fullName = `Dr. ${d.name}`;

  return `
  <div class="user-admin-card doctor-card" id="doctorCard-${escapeHtml(d.id)}"
    data-status="${escapeHtml(statusFilterKey(d.status))}" data-state="${escapeHtml(d.state)}"
    data-name="${escapeHtml(d.name.toLowerCase())}" data-join="${escapeHtml(d.joinDate)}">
    <div class="uac-header doctor-header">
      <div class="uac-avatar-wrap">
        <div class="uac-avatar doc-av">${escapeHtml(d.initials)}</div>
        <div class="uac-status-dot ${dotClass}"></div>
      </div>
      <div class="uac-identity">
        <div class="uac-name">${escapeHtml(fullName)}</div>
        <div class="uac-specialty-tag">${escapeHtml(d.specialty)}</div>
        <div class="uac-id">#${escapeHtml(d.id)}</div>
      </div>
      <div class="uac-status-badge" style="background:${sc.bg};color:${sc.color}">${sc.label}</div>
    </div>
    <div class="doctor-mdcn-strip">
      <div class="dms-logo">MDCN</div>
      <div class="dms-info">
        <div class="dms-number">${escapeHtml(d.mdcn)}</div>
        <div class="dms-hospital">${escapeHtml(d.hospital)}</div>
      </div>
      ${d.status === 'verified' ? `
        <a href="https://www.mdcn.gov.ng" target="_blank" rel="noopener" class="dms-verify-link">Verify →</a>` : `
        <button type="button" class="dms-verify-btn" data-action="verify-mdcn" data-id="${escapeHtml(d.id)}">🔍 Check MDCN</button>`}
    </div>
    <div class="uac-details">
      <div class="uac-detail-row"><span>📧</span><span class="uac-detail-val">${escapeHtml(d.email)}</span></div>
      <div class="uac-detail-row"><span>📱</span><span class="uac-detail-val">${escapeHtml(d.phone)}</span></div>
      <div class="uac-detail-row"><span>📍</span><span class="uac-detail-val">${escapeHtml(d.state)} State</span></div>
      <div class="uac-detail-row">
        <span>💰</span>
        <span class="uac-detail-val">
          Price: ${escapeHtml(d.price)}
          ${d.status === 'verified' ? `
            <button type="button" class="btn-set-price-inline" data-action="set-price" data-id="${escapeHtml(d.id)}">✏️ Set Price</button>` : ''}
        </span>
      </div>
    </div>
    ${d.status === 'verified' ? `
    <div class="doctor-perf-stats">
      <div class="dps-item">
        <div class="dps-val">${'★'.repeat(Math.floor(d.rating))}${d.rating}</div>
        <div class="dps-lbl">Rating</div>
      </div>
      <div class="dps-item"><div class="dps-val">${d.reviews}</div><div class="dps-lbl">Reviews</div></div>
      <div class="dps-item"><div class="dps-val">${d.consultations}</div><div class="dps-lbl">Sessions</div></div>
      <div class="dps-item"><div class="dps-val earned">${escapeHtml(d.earned)}</div><div class="dps-lbl">Earned</div></div>
    </div>` : `
    <div class="doctor-pending-notice">
      <span>⏳</span>
      <span>Awaiting MDCN verification and admin approval</span>
    </div>`}
    ${d.notes.length ? `
    <div class="uac-notes-preview">
      <span class="uac-note-icon">📌</span>
      <span class="uac-note-text">${escapeHtml(d.notes[d.notes.length - 1])}</span>
    </div>` : ''}
    <div class="uac-actions doctor-actions">
      <button type="button" class="uac-btn view" data-action="view-doctor" data-id="${escapeHtml(d.id)}">👁️ View Profile</button>
      <button type="button" class="uac-btn message" data-action="message" data-id="${escapeHtml(d.id)}" data-name="${escapeHtml(fullName)}" data-type="doctor">✉️ Message</button>
      <button type="button" class="uac-btn comment" data-action="comment" data-id="${escapeHtml(d.id)}" data-name="${escapeHtml(fullName)}">💬 Note</button>
      <button type="button" class="uac-btn reviews" data-action="reviews" data-id="${escapeHtml(d.id)}" data-name="${escapeHtml(fullName)}">⭐ View Patient Reviews</button>
      ${d.status === 'pending' ? `
      <button type="button" class="uac-btn approve" data-action="approve-doctor" data-id="${escapeHtml(d.id)}" data-name="${escapeHtml(d.name)}">✅ Approve Doctor</button>
      <button type="button" class="uac-btn reject" data-action="reject-doctor" data-id="${escapeHtml(d.id)}" data-name="${escapeHtml(d.name)}">✗ Reject Application</button>
      <button type="button" class="uac-btn delete" data-action="delete" data-id="${escapeHtml(d.id)}" data-name="${escapeHtml(fullName)}" data-card="doctor">🗑️ Delete Account</button>` : `
      <button type="button" class="uac-btn ${d.status === 'suspended' ? 'reactivate' : 'suspend'}" data-action="suspend" data-id="${escapeHtml(d.id)}" data-status="${escapeHtml(d.status)}">
        ${d.status === 'suspended' ? '🔓 Reactivate' : '⏸️ Suspend'}
      </button>
      <button type="button" class="uac-btn delete" data-action="delete" data-id="${escapeHtml(d.id)}" data-name="${escapeHtml(fullName)}" data-card="doctor">🗑️ Delete Account</button>`}
    </div>
  </div>`;
}

function renderAdminPatientsGrid() {
  return `<div class="admin-cards-grid" id="patientsGrid">${DEMO_PATIENTS_ADMIN.map(renderPatientCard).join('')}</div>`;
}

function renderAdminDoctorsGrid() {
  return `<div class="admin-cards-grid" id="doctorsGrid">${DEMO_DOCTORS_ADMIN.map(renderDoctorCard).join('')}</div>`;
}

function getAdminUsersHTML() {
  return `
  <div class="admin-users-page">
    <div class="admin-users-header">
      <div>
        <h2>User Management</h2>
        <p>Manage all patients and doctors on the Virtualcare Nigeria platform</p>
      </div>
      <div class="admin-users-header-actions">
        <button type="button" class="btn-admin-export-users" id="btnExportUsers">📊 Export List</button>
        <button type="button" class="btn-admin-bulk-msg" id="btnBulkMessage">📣 Bulk Message</button>
      </div>
    </div>

    <div class="user-type-tabs">
      <button type="button" class="user-type-tab active" id="tabPatients" data-user-tab="patients">
        👤 Patients <span class="tab-count">1,158</span>
      </button>
      <button type="button" class="user-type-tab" id="tabDoctors" data-user-tab="doctors">
        👨‍⚕️ Doctors <span class="tab-count">89</span>
      </button>
    </div>

    <div class="admin-users-toolbar">
      <div class="admin-search-wrap">
        <span class="admin-search-icon">🔍</span>
        <input type="text" id="adminUserSearch" class="admin-search-input" placeholder="Search by name, email or ID..." />
      </div>
      <div class="admin-user-filters">
        <select class="admin-filter-select" id="adminStatusFilter">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </select>
        <select class="admin-filter-select" id="adminStateFilter">
          <option value="">All States</option>
          ${NIGERIAN_STATES_LIST.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('')}
        </select>
        <select class="admin-filter-select" id="adminSortFilter">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>
      <div class="admin-results-count" id="adminResultsCount">Showing all users</div>
    </div>

    <div id="adminPatientsSection">${renderAdminPatientsGrid()}</div>
    <div id="adminDoctorsSection" style="display:none">${renderAdminDoctorsGrid()}</div>

    <div id="userDetailModal" class="admin-modal-overlay" style="display:none">
      <div class="user-detail-modal-box" id="userDetailModalBox"></div>
    </div>

    <div id="privateMsgModal" class="admin-modal-overlay" style="display:none">
      <div class="private-msg-modal-box">
        <div class="pm-modal-header">
          <h3>✉️ Send Private Message</h3>
          <button type="button" class="modal-close-btn" id="btnClosePrivateMsg">×</button>
        </div>
        <div class="pm-recipient" id="pmRecipient"></div>
        <div class="pm-form">
          <div class="pm-field">
            <label for="pmSubject">Subject</label>
            <input type="text" id="pmSubject" class="admin-input" placeholder="Message subject..." />
          </div>
          <div class="pm-field">
            <label for="pmMessage">Message</label>
            <textarea id="pmMessage" class="admin-textarea" rows="5" placeholder="Type your message to this user..."></textarea>
          </div>
          <div class="pm-field">
            <label>Send Via</label>
            <div class="pm-channels">
              <label class="pm-channel"><input type="checkbox" value="platform" checked />📱 Platform Notification</label>
              <label class="pm-channel"><input type="checkbox" value="email" checked />📧 Email</label>
              <label class="pm-channel"><input type="checkbox" value="sms" />💬 SMS</label>
            </div>
          </div>
          <div class="pm-actions">
            <button type="button" class="btn-pm-cancel" id="btnPmCancel">Cancel</button>
            <button type="button" class="btn-pm-send" id="btnPmSend">📤 Send Message</button>
          </div>
        </div>
      </div>
    </div>

    <div id="adminCommentModal" class="admin-modal-overlay" style="display:none">
      <div class="admin-comment-modal-box">
        <div class="acm-header">
          <h3>💬 Admin Notes</h3>
          <button type="button" class="modal-close-btn" id="btnCloseComment">×</button>
        </div>
        <div class="acm-user" id="acmUser"></div>
        <div class="acm-existing" id="acmExisting"></div>
        <div class="acm-form">
          <textarea id="adminCommentText" class="admin-textarea" rows="4" placeholder="Add an admin note about this user..."></textarea>
          <div class="acm-actions">
            <button type="button" class="btn-save-admin-comment" id="btnSaveComment">💾 Save Note</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function switchUserTab(tab) {
  currentUserTab = tab;
  usersRoot?.querySelectorAll('.user-type-tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.userTab === tab);
  });
  const patientsSection = usersRoot?.querySelector('#adminPatientsSection');
  const doctorsSection = usersRoot?.querySelector('#adminDoctorsSection');
  if (patientsSection) patientsSection.style.display = tab === 'patients' ? 'block' : 'none';
  if (doctorsSection) doctorsSection.style.display = tab === 'doctors' ? 'block' : 'none';
  filterAdminUsers();
}

function filterAdminUsers() {
  if (!usersRoot) return;

  const search = usersRoot.querySelector('#adminUserSearch')?.value?.toLowerCase() || '';
  const status = usersRoot.querySelector('#adminStatusFilter')?.value || '';
  const state = usersRoot.querySelector('#adminStateFilter')?.value || '';
  const sort = usersRoot.querySelector('#adminSortFilter')?.value || 'newest';

  const sectionId = currentUserTab === 'patients' ? 'adminPatientsSection' : 'adminDoctorsSection';
  const section = usersRoot.querySelector(`#${sectionId}`);
  if (!section) return;

  const grid = section.querySelector('.admin-cards-grid');
  const cards = [...section.querySelectorAll('.user-admin-card')];
  let visibleCount = 0;

  cards.forEach((card) => {
    const text = card.textContent.toLowerCase();
    const cardStatus = card.dataset.status || '';
    const cardState = card.dataset.state || '';

    let show = true;
    if (search && !text.includes(search)) show = false;
    if (status && cardStatus !== status) show = false;
    if (state && cardState !== state) show = false;

    card.style.display = show ? '' : 'none';
    if (show) visibleCount++;
  });

  if (sort === 'name') {
    cards.sort((a, b) => (a.dataset.name || '').localeCompare(b.dataset.name || ''));
  } else if (sort === 'oldest') {
    cards.reverse();
  }

  if (grid) cards.forEach((card) => grid.appendChild(card));

  const countEl = usersRoot.querySelector('#adminResultsCount');
  if (countEl) {
    countEl.textContent = search || status || state
      ? `Found ${visibleCount} results`
      : 'Showing all users';
  }
}

function viewPatientDetail(patientId) {
  const patient = DEMO_PATIENTS_ADMIN.find((p) => p.id === patientId);
  if (!patient || !usersRoot) return;

  const modal = usersRoot.querySelector('#userDetailModal');
  const box = usersRoot.querySelector('#userDetailModalBox');

  box.innerHTML = `
    <div class="udm-header">
      <div class="udm-avatar patient-av">${escapeHtml(patient.initials)}</div>
      <div class="udm-info">
        <h3>${escapeHtml(patient.name)}</h3>
        <div class="udm-id">#${escapeHtml(patient.id)}</div>
        <div class="udm-joined">Joined ${escapeHtml(patient.joinDate)}</div>
      </div>
      <button type="button" class="modal-close-btn" data-action="close-detail">×</button>
    </div>
    <div class="udm-body">
      <div class="udm-section">
        <h4>Contact Information</h4>
        <div class="udm-row"><span>Email</span><strong>${escapeHtml(patient.email)}</strong></div>
        <div class="udm-row"><span>Phone</span><strong>${escapeHtml(patient.phone)}</strong></div>
        <div class="udm-row"><span>State</span><strong>${escapeHtml(patient.state)}</strong></div>
      </div>
      <div class="udm-section">
        <h4>Activity</h4>
        <div class="udm-row"><span>Consultations</span><strong>${patient.consultations}</strong></div>
        <div class="udm-row"><span>Total Spent</span><strong>${escapeHtml(patient.spent)}</strong></div>
        <div class="udm-row"><span>Status</span><strong>${escapeHtml(patient.status)}</strong></div>
        <div class="udm-row"><span>Last Active</span><strong>${escapeHtml(patient.lastActive)}</strong></div>
      </div>
    </div>
    <div class="udm-actions">
      <button type="button" class="uac-btn message" data-action="message-detail" data-id="${escapeHtml(patient.id)}" data-name="${escapeHtml(patient.name)}" data-type="patient">✉️ Send Message</button>
      <button type="button" class="uac-btn comment" data-action="comment-detail" data-id="${escapeHtml(patient.id)}" data-name="${escapeHtml(patient.name)}">💬 Add Note</button>
      <button type="button" class="uac-btn delete" data-action="delete-detail" data-id="${escapeHtml(patient.id)}" data-name="${escapeHtml(patient.name)}" data-card="patient">🗑️ Delete Account</button>
    </div>`;

  modal.style.display = 'flex';
}

function viewDoctorDetail(doctorId) {
  const doctor = DEMO_DOCTORS_ADMIN.find((d) => d.id === doctorId);
  if (!doctor || !usersRoot) return;

  const modal = usersRoot.querySelector('#userDetailModal');
  const box = usersRoot.querySelector('#userDetailModalBox');
  const priceNum = doctor.price.replace(/[^0-9]/g, '') || '';

  box.innerHTML = `
    <div class="udm-header doctor-udm">
      <div class="udm-avatar doc-av">${escapeHtml(doctor.initials)}</div>
      <div class="udm-info">
        <h3>Dr. ${escapeHtml(doctor.name)}</h3>
        <div class="udm-specialty">${escapeHtml(doctor.specialty)}</div>
        <div class="udm-id">#${escapeHtml(doctor.id)}</div>
      </div>
      <button type="button" class="modal-close-btn" data-action="close-detail">×</button>
    </div>
    <div class="udm-body">
      <div class="udm-section">
        <h4>Professional Details</h4>
        <div class="udm-row"><span>MDCN Number</span><strong class="udm-mdcn">${escapeHtml(doctor.mdcn)}</strong></div>
        <div class="udm-row"><span>Hospital</span><strong>${escapeHtml(doctor.hospital)}</strong></div>
        <div class="udm-row"><span>State</span><strong>${escapeHtml(doctor.state)}</strong></div>
        <div class="udm-row"><span>Price/Session</span><strong>${escapeHtml(doctor.price)}</strong></div>
      </div>
      <div class="udm-section">
        <h4>Performance</h4>
        <div class="udm-row"><span>Rating</span><strong>${doctor.rating} ⭐</strong></div>
        <div class="udm-row"><span>Reviews</span><strong>${doctor.reviews}</strong></div>
        <div class="udm-row"><span>Consultations</span><strong>${doctor.consultations}</strong></div>
        <div class="udm-row"><span>Total Earned</span><strong class="udm-earned">${escapeHtml(doctor.earned)}</strong></div>
      </div>
      <div class="udm-section">
        <h4>Set Consultation Price</h4>
        <div class="udm-price-row">
          <span class="udm-price-symbol">₦</span>
          <input type="number" id="adminPriceInput" value="${priceNum}" min="1000" step="500" class="udm-price-input" />
          <button type="button" class="udm-price-btn" data-action="update-price" data-id="${escapeHtml(doctor.id)}">Set Price</button>
        </div>
      </div>
    </div>
    <div class="udm-actions">
      ${doctor.status === 'pending' ? `
      <button type="button" class="uac-btn approve" data-action="approve-doctor-detail" data-id="${escapeHtml(doctor.id)}" data-name="${escapeHtml(doctor.name)}">✅ Approve Doctor</button>
      <button type="button" class="uac-btn reject" data-action="reject-doctor-detail" data-id="${escapeHtml(doctor.id)}" data-name="${escapeHtml(doctor.name)}">✗ Reject Application</button>` : ''}
      <button type="button" class="uac-btn message" data-action="message-detail" data-id="${escapeHtml(doctor.id)}" data-name="Dr. ${escapeHtml(doctor.name)}" data-type="doctor">✉️ Send Message</button>
      <button type="button" class="uac-btn reviews" data-action="reviews" data-id="${escapeHtml(doctor.id)}" data-name="Dr. ${escapeHtml(doctor.name)}">⭐ View Reviews</button>
      <button type="button" class="uac-btn comment" data-action="comment-detail" data-id="${escapeHtml(doctor.id)}" data-name="Dr. ${escapeHtml(doctor.name)}">💬 Add Note</button>
      <button type="button" class="uac-btn delete" data-action="delete-detail" data-id="${escapeHtml(doctor.id)}" data-name="Dr. ${escapeHtml(doctor.name)}" data-card="doctor">🗑️ Delete Account</button>
    </div>`;

  modal.style.display = 'flex';
}

function closeUserDetailModal() {
  usersRoot?.querySelector('#userDetailModal')?.style && (usersRoot.querySelector('#userDetailModal').style.display = 'none');
}

function openPrivateMsg(userId, userName, userType) {
  currentMsgUserId = userId;
  const modal = usersRoot?.querySelector('#privateMsgModal');
  const recipient = usersRoot?.querySelector('#pmRecipient');
  const initials = userName.replace('Dr. ', '').split(' ').map((n) => n[0]).join('').slice(0, 2);

  if (recipient) {
    recipient.innerHTML = `
    <div class="pm-recipient-info">
      <div class="pm-recipient-avatar ${userType}-av">${escapeHtml(initials)}</div>
      <div>
        <div class="pm-recipient-name">${escapeHtml(userName)}</div>
        <div class="pm-recipient-role">${userType === 'doctor' ? '👨‍⚕️ Doctor' : '👤 Patient'} · ID: #${escapeHtml(userId)}</div>
      </div>
    </div>`;
  }

  if (modal) modal.style.display = 'flex';
}

function closePrivateMsgModal() {
  usersRoot?.querySelector('#privateMsgModal')?.style && (usersRoot.querySelector('#privateMsgModal').style.display = 'none');
  currentMsgUserId = null;
}

function sendPrivateMessage() {
  const subject = usersRoot?.querySelector('#pmSubject')?.value?.trim();
  const message = usersRoot?.querySelector('#pmMessage')?.value?.trim();

  if (!subject || !message) {
    toast('Please fill in subject and message', 'warning');
    return;
  }

  toast('✅ Message sent successfully!', 'success');
  closePrivateMsgModal();
  const subjectEl = usersRoot?.querySelector('#pmSubject');
  const messageEl = usersRoot?.querySelector('#pmMessage');
  if (subjectEl) subjectEl.value = '';
  if (messageEl) messageEl.value = '';
}

function openAdminComment(userId, userName) {
  currentCommentUserId = userId;
  const modal = usersRoot?.querySelector('#adminCommentModal');
  const userEl = usersRoot?.querySelector('#acmUser');

  if (userEl) {
    userEl.innerHTML = `
    <div class="acm-user-info">
      <strong>${escapeHtml(userName)}</strong>
      <span>#${escapeHtml(userId)}</span>
    </div>`;
  }

  if (modal) modal.style.display = 'flex';
}

function closeCommentModal() {
  usersRoot?.querySelector('#adminCommentModal')?.style && (usersRoot.querySelector('#adminCommentModal').style.display = 'none');
  currentCommentUserId = null;
}

function saveAdminComment() {
  const text = usersRoot?.querySelector('#adminCommentText')?.value?.trim();
  if (!text) {
    toast('Please write a note first', 'warning');
    return;
  }

  toast('Admin note saved ✅', 'success');
  const textarea = usersRoot?.querySelector('#adminCommentText');
  if (textarea) textarea.value = '';
  closeCommentModal();
}

function viewDoctorReviews(doctorId, doctorName) {
  closeUserDetailModal();
  toast(`Loading reviews for ${doctorName}...`, 'info');
}

function adminApproveDoctor(doctorId, doctorName) {
  const card = usersRoot?.querySelector(`#doctorCard-${doctorId}`);
  if (card) {
    const statusBadge = card.querySelector('.uac-status-badge');
    if (statusBadge) {
      statusBadge.style.background = '#dcfce7';
      statusBadge.style.color = '#166534';
      statusBadge.textContent = '✅ Verified';
    }
    const dot = card.querySelector('.uac-status-dot');
    if (dot) dot.className = 'uac-status-dot green';
    card.dataset.status = 'active';
  }
  toast(`✅ Dr. ${doctorName} approved! Welcome email sent.`, 'success');
}

function adminRejectDoctor(doctorId, doctorName) {
  if (confirm(`Reject Dr. ${doctorName}'s application?`)) {
    toast(`Application for Dr. ${doctorName} rejected.`, 'warning');
  }
}

function approvePatient(patientId) {
  const card = usersRoot?.querySelector(`#patientCard-${patientId}`);
  if (card) {
    const badge = card.querySelector('.uac-status-badge');
    if (badge) {
      badge.style.background = '#dcfce7';
      badge.style.color = '#166534';
      badge.textContent = '✅ Active';
    }
    const dot = card.querySelector('.uac-status-dot');
    if (dot) dot.className = 'uac-status-dot green';
    card.dataset.status = 'active';
  }
  toast('Patient account activated! ✅', 'success');
}

function toggleSuspendUser(userId, currentStatus) {
  if (currentStatus === 'suspended') {
    toast('Account reactivated! ✅', 'success');
  } else if (confirm('Suspend this account?')) {
    toast('Account suspended.', 'warning');
  }
}

function confirmDeleteUser(userId, userName, cardType) {
  if (!confirm(`DELETE ${userName}?\n\nThis will permanently remove their account and all data. This cannot be undone.`)) return;

  const card = usersRoot?.querySelector(`#${cardType === 'doctor' ? 'doctor' : 'patient'}Card-${userId}`);
  if (card) {
    card.style.opacity = '0';
    card.style.transform = 'scale(0.95)';
    card.style.transition = 'all 0.3s';
    setTimeout(() => card.remove(), 300);
  }
  toast(`${userName} account deleted.`, 'info');
}

function updateDoctorPrice(doctorId) {
  const input = usersRoot?.querySelector('#adminPriceInput');
  const price = parseInt(input?.value || 0, 10);

  if (!price || price < 1000) {
    toast('Minimum price is ₦1,000', 'warning');
    return;
  }

  toast(`Price updated to ₦${price.toLocaleString('en-NG')}`, 'success');
  closeUserDetailModal();
}

function verifyMDCN() {
  window.open('https://www.mdcn.gov.ng', '_blank');
}

function exportUsers() {
  toast('Exporting user list to CSV...', 'info');
}

function sendBulkMessage() {
  toast('Bulk message composer coming soon!', 'info');
}

function handleCardAction(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const { action, id, name, type, status, card } = btn.dataset;

  switch (action) {
    case 'view-patient': viewPatientDetail(id); break;
    case 'view-doctor': viewDoctorDetail(id); break;
    case 'message': openPrivateMsg(id, name, type); break;
    case 'message-detail': closeUserDetailModal(); openPrivateMsg(id, name, type); break;
    case 'comment': openAdminComment(id, name); break;
    case 'comment-detail': closeUserDetailModal(); openAdminComment(id, name); break;
    case 'approve-patient': approvePatient(id); break;
    case 'approve-doctor':
    case 'approve-doctor-detail':
      adminApproveDoctor(id, name);
      if (action.includes('detail')) closeUserDetailModal();
      break;
    case 'reject-doctor':
    case 'reject-doctor-detail':
      adminRejectDoctor(id, name);
      if (action.includes('detail')) closeUserDetailModal();
      break;
    case 'suspend': toggleSuspendUser(id, status); break;
    case 'delete': confirmDeleteUser(id, name, card); break;
    case 'delete-detail': closeUserDetailModal(); confirmDeleteUser(id, name, card); break;
    case 'reviews': viewDoctorReviews(id, name); break;
    case 'set-price': viewDoctorDetail(id); break;
    case 'update-price': updateDoctorPrice(id); break;
    case 'verify-mdcn': verifyMDCN(); break;
    case 'close-detail': closeUserDetailModal(); break;
    default: break;
  }
}

function bindAdminUsersEvents(root) {
  usersRoot = root;

  root.querySelector('#btnExportUsers')?.addEventListener('click', exportUsers);
  root.querySelector('#btnBulkMessage')?.addEventListener('click', sendBulkMessage);

  root.querySelectorAll('[data-user-tab]').forEach((tab) => {
    tab.addEventListener('click', () => switchUserTab(tab.dataset.userTab));
  });

  root.querySelector('#adminUserSearch')?.addEventListener('input', filterAdminUsers);
  root.querySelector('#adminStatusFilter')?.addEventListener('change', filterAdminUsers);
  root.querySelector('#adminStateFilter')?.addEventListener('change', filterAdminUsers);
  root.querySelector('#adminSortFilter')?.addEventListener('change', filterAdminUsers);

  root.addEventListener('click', handleCardAction);

  root.querySelector('#btnClosePrivateMsg')?.addEventListener('click', closePrivateMsgModal);
  root.querySelector('#btnPmCancel')?.addEventListener('click', closePrivateMsgModal);
  root.querySelector('#btnPmSend')?.addEventListener('click', sendPrivateMessage);

  root.querySelector('#btnCloseComment')?.addEventListener('click', closeCommentModal);
  root.querySelector('#btnSaveComment')?.addEventListener('click', saveAdminComment);

  root.querySelector('#userDetailModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'userDetailModal') closeUserDetailModal();
  });
  root.querySelector('#privateMsgModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'privateMsgModal') closePrivateMsgModal();
  });
  root.querySelector('#adminCommentModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'adminCommentModal') closeCommentModal();
  });
}

export async function renderAdminUsers(container) {
  currentUserTab = 'patients';
  currentMsgUserId = null;
  currentCommentUserId = null;
  container.innerHTML = getAdminUsersHTML();
  bindAdminUsersEvents(container);
}
