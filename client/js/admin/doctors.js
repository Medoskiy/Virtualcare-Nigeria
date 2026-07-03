import { toast } from '../shared/toast.js';
import { escapeHtml } from '../shared/utils.js';

let doctorsRoot = null;
let currentApprovalDoctorId = null;

const FEE_TIERS = [
  { tier: 'General Practice', icon: '🩺', price: 5000, doctors: 24, color: '#3b99e0', desc: 'Basic consultations' },
  { tier: 'Specialist', icon: '👨‍⚕️', price: 10000, doctors: 31, color: '#7c3aed', desc: 'Specialist doctors' },
  { tier: 'Senior Consultant', icon: '🏆', price: 15000, doctors: 18, color: '#0f766e', desc: 'Senior consultants' },
  { tier: 'Professor/HOD', icon: '🎓', price: 25000, doctors: 9, color: '#b45309', desc: 'Professors & HODs' }
];

const INDIVIDUAL_FEE_DOCTORS = [
  { id: 'D-001', name: 'Dr. Okonkwo', spec: 'Cardiology', price: 15000 },
  { id: 'D-002', name: 'Dr. Adaeze Nwosu', spec: 'Dermatology', price: 10000 },
  { id: 'D-003', name: 'Dr. Ibrahim Musa', spec: 'General Practice', price: 5000 }
];

const PAST_PROMOS = [
  { title: 'Independence Day 20% Off', code: 'NAIJA20', used: 892, status: 'expired', expired: '1 Oct 2025' },
  { title: 'Christmas Wellness Campaign', code: 'XMAS2025', used: 1204, status: 'expired', expired: '31 Dec 2025' },
  { title: 'Ramadan Health Drive 10% Off', code: 'RAMADAN10', used: 543, status: 'paused', expired: '30 Jun 2026' }
];

const PENDING_DOCTORS = [
  {
    id: 'D-P01', name: 'Fatima Al-Sayed', specialty: 'Cardiology', initials: 'FA',
    state: 'Lagos', hospital: 'LUTH', mdcn: 'MDN/LUTH/2019/08823',
    email: 'fatima.alsayed@gmail.com', phone: '08031112233', yearsExp: 7,
    education: 'MBBS, University of Lagos 2017', fellowship: 'Fellow, WACP 2022',
    appliedDate: 'Today, 25 Jun 2026',
    bio: 'Experienced cardiologist with 7 years specializing in heart failure and coronary artery disease at LUTH.',
    skills: ['ECG', 'Echocardiography', 'Heart Failure', 'Hypertension'],
    color: '#dc2626'
  },
  {
    id: 'D-P02', name: 'James Patel', specialty: 'Neurology', initials: 'JP',
    state: 'Abuja', hospital: 'National Hospital Abuja', mdcn: 'MDN/NHA/2018/07234',
    email: 'james.patel@gmail.com', phone: '08071234567', yearsExp: 9,
    education: 'MBBS, UNILAG 2015', fellowship: 'Fellow, WACS 2021',
    appliedDate: 'Yesterday, 24 Jun 2026',
    bio: 'Neurologist with 9 years experience in stroke management and neurological disorders at National Hospital Abuja.',
    skills: ['Stroke', 'Epilepsy', "Parkinson's", 'Brain Imaging'],
    color: '#7c3aed'
  },
  {
    id: 'D-P03', name: 'Aisha Bello', specialty: 'Psychiatry', initials: 'AB',
    state: 'Kano', hospital: 'Aminu Kano Teaching Hospital', mdcn: 'MDN/AKTH/2020/09456',
    email: 'aisha.bello@gmail.com', phone: '08121234567', yearsExp: 5,
    education: 'MBBS, Bayero University Kano 2019', fellowship: 'In progress — WACP',
    appliedDate: '2 days ago, 23 Jun 2026',
    bio: 'Psychiatrist focused on mental health in Northern Nigeria. Specializes in depression, anxiety and trauma.',
    skills: ['Depression', 'Anxiety', 'Trauma', 'Mental Health'],
    color: '#0f766e'
  },
  {
    id: 'D-P04', name: 'Emeka Eze', specialty: 'Pediatrics', initials: 'EE',
    state: 'Enugu', hospital: 'UNTH', mdcn: 'MDN/UNTH/2017/06789',
    email: 'emeka.eze2@gmail.com', phone: '09091234567', yearsExp: 8,
    education: 'MBBS, University of Nigeria 2016', fellowship: 'Fellow, WACP Paediatrics 2021',
    appliedDate: '3 days ago, 22 Jun 2026',
    bio: 'Paediatrician with 8 years caring for children in South-East Nigeria. Expert in childhood infections and malnutrition.',
    skills: ['Childhood Infections', 'Neonatology', 'Malnutrition', 'Child Development'],
    color: '#d97706'
  },
  {
    id: 'D-P05', name: 'Oluwaseun Adeyemi', specialty: 'Orthopedics', initials: 'OA',
    state: 'Lagos', hospital: 'Lagos Island General', mdcn: 'MDN/LIGH/2016/05432',
    email: 'seun.adeyemi@gmail.com', phone: '07061234567', yearsExp: 10,
    education: 'MBBS, UNILAG 2014', fellowship: 'Fellow, WACS Orthopaedics 2020',
    appliedDate: '5 days ago, 20 Jun 2026',
    bio: 'Orthopaedic surgeon with 10 years experience in trauma, sports injuries and joint replacement.',
    skills: ['Fractures', 'Sports Injuries', 'Joint Replacement', 'Spine'],
    color: '#0a2463'
  }
];

const PENDING_DOCTORS_DATA = Object.fromEntries(
  PENDING_DOCTORS.map((doc) => [doc.id, doc])
);

function formatNairaSplit(amount) {
  return '₦' + Number(amount || 0).toLocaleString('en-NG');
}

function renderPendingDoctorCards() {
  return PENDING_DOCTORS.map((doc) => `
    <div class="pending-doc-card" id="pendingCard-${escapeHtml(doc.id)}">
      <div class="pdc-header" style="background:linear-gradient(135deg, ${doc.color}22, ${doc.color}11)">
        <div class="pdc-avatar" style="background:linear-gradient(135deg, ${doc.color}, ${doc.color}aa)">
          ${escapeHtml(doc.initials)}
        </div>
        <div class="pdc-info">
          <div class="pdc-name">Dr. ${escapeHtml(doc.name)}</div>
          <div class="pdc-specialty" style="color:${doc.color}">${escapeHtml(doc.specialty)}</div>
          <div class="pdc-hospital">🏥 ${escapeHtml(doc.hospital)}</div>
          <div class="pdc-applied">📅 Applied: ${escapeHtml(doc.appliedDate)}</div>
        </div>
        <div class="pdc-status-badge">⏳ Pending</div>
      </div>
      <div class="pdc-mdcn-row">
        <span class="pdc-mdcn-logo">MDCN</span>
        <span class="pdc-mdcn-num">${escapeHtml(doc.mdcn)}</span>
        <span class="pdc-state">📍 ${escapeHtml(doc.state)}</span>
      </div>
      <div class="pdc-skills">
        ${doc.skills.map((s) => `
          <span class="pdc-skill-chip" style="border-color:${doc.color}44;color:${doc.color}">
            ${escapeHtml(s)}
          </span>
        `).join('')}
      </div>
      <div class="pdc-actions">
        <button type="button" class="btn-view-full-profile"
          data-action="view-approval" data-id="${escapeHtml(doc.id)}" data-name="${escapeHtml(doc.name)}">
          👁️ View Full Profile
        </button>
        <button type="button" class="btn-quick-approve"
          data-action="quick-approve" data-id="${escapeHtml(doc.id)}" data-name="${escapeHtml(doc.name)}">
          ✅ Approve
        </button>
        <button type="button" class="btn-quick-reject"
          data-action="quick-reject" data-id="${escapeHtml(doc.id)}" data-name="${escapeHtml(doc.name)}">
          ✗ Reject
        </button>
      </div>
    </div>
  `).join('');
}

function renderFeeTierCards() {
  return FEE_TIERS.map((t) => `
    <div class="fee-tier-card" data-tier="${escapeHtml(t.tier)}" style="border-top:3px solid ${t.color}">
      <div class="ftc-header">
        <span class="ftc-icon">${t.icon}</span>
        <div class="ftc-info">
          <div class="ftc-tier-name">${escapeHtml(t.tier)}</div>
          <div class="ftc-desc">${escapeHtml(t.desc)}</div>
        </div>
      </div>
      <div class="ftc-doctors-count">${t.doctors} doctors</div>
      <div class="ftc-price-control">
        <span class="ftc-currency">₦</span>
        <input
          type="number"
          class="ftc-price-input"
          data-tier="${escapeHtml(t.tier)}"
          value="${t.price}"
          min="1000"
          step="500"
        />
        <span class="ftc-per">/session</span>
      </div>
      <div class="ftc-split">
        <div class="ftc-split-row">
          <span>Doctor gets (70%)</span>
          <strong class="ftc-doctor-cut" style="color:${t.color}">
            ${formatNairaSplit(t.price * 0.7)}
          </strong>
        </div>
        <div class="ftc-split-row">
          <span>Platform (30%)</span>
          <strong class="ftc-platform-cut">
            ${formatNairaSplit(t.price * 0.3)}
          </strong>
        </div>
      </div>
      <button type="button" class="btn-apply-tier"
        data-action="apply-tier" data-tier="${escapeHtml(t.tier)}">
        Apply to All ${escapeHtml(t.tier)} Doctors
      </button>
    </div>
  `).join('');
}

function renderIndividualFeesRows() {
  return INDIVIDUAL_FEE_DOCTORS.map((d) => `
    <div class="ift-row">
      <span class="ift-name">${escapeHtml(d.name)}</span>
      <span class="ift-spec">${escapeHtml(d.spec)}</span>
      <span class="ift-current">${formatNairaSplit(d.price)}</span>
      <div class="ift-override">
        <span class="ift-currency">₦</span>
        <input
          type="number"
          id="price-${escapeHtml(d.id)}"
          class="ift-price-input"
          placeholder="${d.price}"
          min="1000"
          step="500"
        />
      </div>
      <button type="button" class="btn-set-price"
        data-action="set-individual-price" data-id="${escapeHtml(d.id)}" data-name="${escapeHtml(d.name)}">
        Set Price
      </button>
    </div>
  `).join('');
}

function renderPastPromos() {
  return PAST_PROMOS.map((p) => `
    <div class="past-promo-item">
      <div class="ppi-icon">${p.status === 'expired' ? '⏰' : '⏸️'}</div>
      <div class="ppi-info">
        <div class="ppi-title">${escapeHtml(p.title)}</div>
        <div class="ppi-meta">
          Code: <span class="ppi-code">${escapeHtml(p.code)}</span> ·
          Used ${p.used} times ·
          ${p.status === 'expired' ? 'Expired' : 'Paused'} ${escapeHtml(p.expired)}
        </div>
      </div>
      <div class="ppi-status ${p.status === 'expired' ? 'expired' : 'paused'}">
        ${p.status === 'expired' ? '⏰ Expired' : '⏸️ Paused'}
      </div>
      <div class="ppi-actions">
        <button type="button" class="btn-reactivate-promo"
          data-action="reactivate-promo" data-code="${escapeHtml(p.code)}">
          🔄 Reactivate
        </button>
        <button type="button" class="btn-delete-promo"
          data-action="delete-promo" data-code="${escapeHtml(p.code)}">
          🗑️
        </button>
      </div>
    </div>
  `).join('');
}

function getAdminDoctorsHTML() {
  return `
  <div class="admin-doctors-page">

    <div class="admin-doctors-header">
      <div>
        <h2>Doctor Management</h2>
        <p>Manage doctor approvals, consultation fees and promotional campaigns</p>
      </div>
      <div class="admin-doctors-header-actions">
        <button type="button" class="btn-admin-refresh" data-action="refresh-doctors">
          🔄 Refresh
        </button>
        <button type="button" class="btn-admin-export" data-action="export-doctors">
          📊 Export
        </button>
      </div>
    </div>

    <div class="doctor-mgmt-stats">
      <div class="dmg-stat" style="border-left:4px solid #d97706">
        <div class="dmg-stat-icon">⏳</div>
        <div>
          <div class="dmg-stat-value">7</div>
          <div class="dmg-stat-label">Pending Approval</div>
        </div>
      </div>
      <div class="dmg-stat" style="border-left:4px solid #16a34a">
        <div class="dmg-stat-icon">✅</div>
        <div>
          <div class="dmg-stat-value">82</div>
          <div class="dmg-stat-label">Verified Doctors</div>
        </div>
      </div>
      <div class="dmg-stat" style="border-left:4px solid #7c3aed">
        <div class="dmg-stat-icon">🎯</div>
        <div>
          <div class="dmg-stat-value">3</div>
          <div class="dmg-stat-label">Active Promotions</div>
        </div>
      </div>
      <div class="dmg-stat" style="border-left:4px solid #dc2626">
        <div class="dmg-stat-icon">🚫</div>
        <div>
          <div class="dmg-stat-value">2</div>
          <div class="dmg-stat-label">Suspended</div>
        </div>
      </div>
    </div>

    <div class="admin-section-card">
      <div class="admin-section-header pending-header">
        <div class="ash-left">
          <span class="ash-icon">⏳</span>
          <div>
            <h3>Pending Doctor Approvals</h3>
            <p>Review and approve doctor applications. Click a profile to view full details before approving.</p>
          </div>
        </div>
        <div class="ash-badge pending-badge">7 awaiting review</div>
      </div>
      <div class="pending-approvals-grid" id="pendingApprovalsGrid">
        ${renderPendingDoctorCards()}
      </div>
    </div>

    <div class="admin-section-card">
      <div class="admin-section-header fees-header">
        <div class="ash-left">
          <span class="ash-icon">💰</span>
          <div>
            <h3>Consultation Fees Management</h3>
            <p>Set and manage consultation prices for all doctors. Doctors cannot set their own prices.</p>
          </div>
        </div>
        <div class="fees-platform-note">🔒 Admin-controlled pricing</div>
      </div>

      <div class="fee-tiers-section">
        <div class="fee-tiers-header">
          <h4>📊 Standard Fee Tiers</h4>
          <button type="button" class="btn-save-fees" data-action="save-fees">
            💾 Save All Fees
          </button>
        </div>
        <div class="fee-tiers-grid">
          ${renderFeeTierCards()}
        </div>
      </div>

      <div class="individual-fees-section">
        <h4>🔧 Individual Doctor Price Override</h4>
        <p class="individual-fees-desc">
          Set a custom price for a specific doctor that overrides their tier price.
        </p>
        <div class="individual-fees-table">
          <div class="ift-header">
            <span>Doctor</span>
            <span>Specialty</span>
            <span>Current Price</span>
            <span>Override Price</span>
            <span>Action</span>
          </div>
          ${renderIndividualFeesRows()}
        </div>
      </div>
    </div>

    <div class="admin-section-card">
      <div class="admin-section-header promo-header">
        <div class="ash-left">
          <span class="ash-icon">🎯</span>
          <div>
            <h3>Special Promotions & Discounts</h3>
            <p>Create and manage promotional campaigns, discount codes and special offers for patients and doctors.</p>
          </div>
        </div>
        <button type="button" class="btn-create-promo" data-action="create-promo">
          ✨ Create Promotion
        </button>
      </div>

      <div class="active-promos-section">
        <h4>🟢 Active Promotions</h4>
        <div class="promos-grid" id="promosGrid">

          <div class="promo-card active-promo">
            <div class="promo-card-header">
              <div class="promo-type-badge returning">🔁 Returning Patient</div>
              <div class="promo-status-dot active"></div>
            </div>
            <div class="promo-title">25% Off for Returning Patients</div>
            <div class="promo-description">
              Patients with 2+ consultations automatically receive a 25% discount on all bookings
            </div>
            <div class="promo-details-grid">
              <div class="promo-detail">
                <span>Discount</span>
                <strong class="promo-discount">25%</strong>
              </div>
              <div class="promo-detail">
                <span>Used</span>
                <strong>1,847 times</strong>
              </div>
              <div class="promo-detail">
                <span>Savings</span>
                <strong style="color:var(--green)">₦2.3M</strong>
              </div>
              <div class="promo-detail">
                <span>Expires</span>
                <strong>31 Dec 2026</strong>
              </div>
            </div>
            <div class="promo-code-row">
              <span class="promo-code-label">Code:</span>
              <span class="promo-code">AUTO-RETURNING</span>
              <span class="promo-auto-badge">✅ Auto-applied</span>
            </div>
            <div class="promo-card-actions">
              <button type="button" class="btn-promo-edit" data-action="edit-promo" data-id="returning25">✏️ Edit</button>
              <button type="button" class="btn-promo-pause" data-action="pause-promo" data-id="returning25">⏸️ Pause</button>
              <button type="button" class="btn-promo-stats" data-action="view-promo-stats" data-id="returning25">📊 Stats</button>
            </div>
          </div>

          <div class="promo-card active-promo">
            <div class="promo-card-header">
              <div class="promo-type-badge new-user">🆕 New Patient</div>
              <div class="promo-status-dot active"></div>
            </div>
            <div class="promo-title">First Consultation Free (GP Only)</div>
            <div class="promo-description">
              New patients get their first General Practice consultation at no charge
            </div>
            <div class="promo-details-grid">
              <div class="promo-detail">
                <span>Discount</span>
                <strong class="promo-discount">100%</strong>
              </div>
              <div class="promo-detail">
                <span>Used</span>
                <strong>342 times</strong>
              </div>
              <div class="promo-detail">
                <span>Budget Used</span>
                <strong style="color:var(--amber)">₦1.7M</strong>
              </div>
              <div class="promo-detail">
                <span>Expires</span>
                <strong>30 Sep 2026</strong>
              </div>
            </div>
            <div class="promo-code-row">
              <span class="promo-code-label">Code:</span>
              <span class="promo-code">FIRSTFREE</span>
              <button type="button" class="btn-copy-code" data-action="copy-promo-code" data-code="FIRSTFREE">📋 Copy</button>
            </div>
            <div class="promo-card-actions">
              <button type="button" class="btn-promo-edit" data-action="edit-promo" data-id="firstfree">✏️ Edit</button>
              <button type="button" class="btn-promo-pause" data-action="pause-promo" data-id="firstfree">⏸️ Pause</button>
              <button type="button" class="btn-promo-stats" data-action="view-promo-stats" data-id="firstfree">📊 Stats</button>
            </div>
          </div>

          <div class="promo-card active-promo">
            <div class="promo-card-header">
              <div class="promo-type-badge seasonal">🌟 Seasonal</div>
              <div class="promo-status-dot active"></div>
            </div>
            <div class="promo-title">Malaria Season: 15% Off Consultations</div>
            <div class="promo-description">
              Special discount during rainy season to encourage early treatment
            </div>
            <div class="promo-details-grid">
              <div class="promo-detail">
                <span>Discount</span>
                <strong class="promo-discount">15%</strong>
              </div>
              <div class="promo-detail">
                <span>Used</span>
                <strong>2,103 times</strong>
              </div>
              <div class="promo-detail">
                <span>Revenue Impact</span>
                <strong style="color:var(--amber)">-₦1.5M</strong>
              </div>
              <div class="promo-detail">
                <span>Expires</span>
                <strong>31 Aug 2026</strong>
              </div>
            </div>
            <div class="promo-code-row">
              <span class="promo-code-label">Code:</span>
              <span class="promo-code">MALARIA15</span>
              <button type="button" class="btn-copy-code" data-action="copy-promo-code" data-code="MALARIA15">📋 Copy</button>
            </div>
            <div class="promo-card-actions">
              <button type="button" class="btn-promo-edit" data-action="edit-promo" data-id="malaria15">✏️ Edit</button>
              <button type="button" class="btn-promo-pause" data-action="pause-promo" data-id="malaria15">⏸️ Pause</button>
              <button type="button" class="btn-promo-stats" data-action="view-promo-stats" data-id="malaria15">📊 Stats</button>
            </div>
          </div>

        </div>
      </div>

      <div class="past-promos-section">
        <h4>⏸️ Paused / Expired Promotions</h4>
        <div class="past-promos-list">
          ${renderPastPromos()}
        </div>
      </div>
    </div>

    <div id="doctorApprovalModal" class="admin-modal-overlay"
      style="display:none;align-items:flex-start;padding:20px;overflow-y:auto">
      <div class="doctor-approval-modal-box" id="doctorApprovalBox"></div>
    </div>

    <div id="createPromoModal" class="admin-modal-overlay" style="display:none">
      <div class="create-promo-modal-box">
        <div class="cpm-header">
          <h3>✨ Create New Promotion</h3>
          <button type="button" class="modal-close-btn" data-action="close-create-promo">×</button>
        </div>
        <div class="cpm-form">

          <div class="cpm-field">
            <label for="promoName">Promotion Name</label>
            <input type="text" id="promoName" class="admin-input" placeholder="e.g. Christmas 20% Off" />
          </div>

          <div class="cpm-field">
            <label>Promotion Type</label>
            <div class="promo-type-selector">
              <label class="promo-type-opt">
                <input type="radio" name="promoType" value="returning" checked />
                <div class="pto-card"><span>🔁</span><span>Returning Patient</span></div>
              </label>
              <label class="promo-type-opt">
                <input type="radio" name="promoType" value="new" />
                <div class="pto-card"><span>🆕</span><span>New Patient</span></div>
              </label>
              <label class="promo-type-opt">
                <input type="radio" name="promoType" value="seasonal" />
                <div class="pto-card"><span>🌟</span><span>Seasonal</span></div>
              </label>
              <label class="promo-type-opt">
                <input type="radio" name="promoType" value="specialty" />
                <div class="pto-card"><span>🏥</span><span>By Specialty</span></div>
              </label>
              <label class="promo-type-opt">
                <input type="radio" name="promoType" value="flash" />
                <div class="pto-card"><span>⚡</span><span>Flash Sale</span></div>
              </label>
              <label class="promo-type-opt">
                <input type="radio" name="promoType" value="referral" />
                <div class="pto-card"><span>👥</span><span>Referral</span></div>
              </label>
            </div>
          </div>

          <div class="cpm-row">
            <div class="cpm-field">
              <label for="promoDiscountType">Discount Type</label>
              <select id="promoDiscountType" class="admin-select">
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat Amount (₦)</option>
                <option value="free">Free (100%)</option>
              </select>
            </div>
            <div class="cpm-field">
              <label for="promoDiscountValue">Discount Value</label>
              <div class="promo-value-wrap">
                <span class="promo-value-prefix" id="promoValuePrefix">%</span>
                <input type="number" id="promoDiscountValue" class="admin-input promo-value-input" placeholder="e.g. 25" min="1" />
              </div>
            </div>
          </div>

          <div class="cpm-field">
            <label for="promoCode">Promo Code</label>
            <div class="promo-code-input-wrap">
              <input type="text" id="promoCode" class="admin-input" placeholder="e.g. SAVE25" />
              <button type="button" class="btn-gen-code" data-action="generate-promo-code">⚡ Generate</button>
            </div>
          </div>

          <div class="cpm-row">
            <div class="cpm-field">
              <label for="promoApplyTo">Apply To</label>
              <select id="promoApplyTo" class="admin-select">
                <option value="all">All Specialties</option>
                <option value="gp">General Practice</option>
                <option value="cardiology">Cardiology</option>
                <option value="dermatology">Dermatology</option>
                <option value="psychiatry">Psychiatry</option>
                <option value="pediatrics">Pediatrics</option>
              </select>
            </div>
            <div class="cpm-field">
              <label for="promoMaxUses">Max Uses</label>
              <input type="number" id="promoMaxUses" class="admin-input" placeholder="e.g. 500 (0 = unlimited)" />
            </div>
          </div>

          <div class="cpm-row">
            <div class="cpm-field">
              <label for="promoStartDate">Start Date</label>
              <input type="date" id="promoStartDate" class="admin-input" />
            </div>
            <div class="cpm-field">
              <label for="promoEndDate">End Date</label>
              <input type="date" id="promoEndDate" class="admin-input" />
            </div>
          </div>

          <div class="cpm-field">
            <label for="promoDescription">Description (shown to patients)</label>
            <textarea id="promoDescription" class="admin-textarea" rows="3"
              placeholder="e.g. Get 25% off your next consultation this Christmas season!"></textarea>
          </div>

          <div class="promo-preview-box" id="promoPreview">
            <div class="ppb-header">👁️ Patient sees this:</div>
            <div class="ppb-content">
              <div class="ppb-badge">🎯 Special Offer</div>
              <div class="ppb-title" id="ppbTitle">Your promotion preview</div>
              <div class="ppb-discount" id="ppbDiscount">Save 0%</div>
            </div>
          </div>

          <div class="cpm-notify">
            <label class="cpm-notify-label">
              <input type="checkbox" id="promoNotifyAll" checked />
              📣 Send push notification to all eligible patients when this promo goes live
            </label>
          </div>

          <div class="cpm-actions">
            <button type="button" class="btn-promo-draft" data-action="save-promo-draft">💾 Save Draft</button>
            <button type="button" class="btn-launch-promo" data-action="launch-promotion">🚀 Launch Promotion</button>
          </div>

        </div>
      </div>
    </div>

  </div>`;
}

function refreshDoctorList() {
  toast('Doctor list refreshed ✅', 'info');
}

function exportDoctors() {
  const headers = ['ID', 'Name', 'Email', 'Phone', 'State', 'Specialty', 'MDCN Number', 'Hospital', 'Status', 'Rating', 'Reviews', 'Consultations', 'Total Earned', 'Price/Session', 'Join Date', 'Last Active'];
  const rows = [...PENDING_DOCTORS, ...INDIVIDUAL_FEE_DOCTORS.map((d) => ({
    id: d.id, name: d.name, email: '', phone: '', state: '',
    specialty: d.spec, mdcn: '', hospital: '', status: 'verified',
    rating: '', reviews: '', consultations: '', earned: '',
    price: `NGN ${d.price.toLocaleString()}`, joinDate: '', lastActive: ''
  }))].map((d) => [
    d.id || '', d.name || '', d.email || '', d.phone || '',
    d.state || '', d.specialty || d.spec || '', d.mdcn || '',
    d.hospital || '', d.status || 'pending', d.rating || '',
    d.reviews || '', d.consultations || '', d.earned || '',
    d.price || '', d.joinDate || d.appliedDate || '', d.lastActive || ''
  ]);

  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `virtualcare-doctors-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('✅ Doctor list exported!', 'success');
}

function openDoctorApprovalModal(doctorId) {
  const doc = PENDING_DOCTORS_DATA[doctorId];
  if (!doc || !doctorsRoot) return;

  currentApprovalDoctorId = doctorId;
  const modal = doctorsRoot.querySelector('#doctorApprovalModal');
  const box = doctorsRoot.querySelector('#doctorApprovalBox');
  if (!modal || !box) return;

  box.innerHTML = `
    <div class="dam-header" style="background:linear-gradient(135deg, ${doc.color}, ${doc.color}cc)">
      <div class="dam-header-content">
        <div class="dam-avatar">${escapeHtml(doc.initials)}</div>
        <div class="dam-identity">
          <h2>Dr. ${escapeHtml(doc.name)}</h2>
          <div class="dam-specialty">${escapeHtml(doc.specialty)} Specialist</div>
          <div class="dam-hospital">🏥 ${escapeHtml(doc.hospital)} · 📍 ${escapeHtml(doc.state)} State</div>
        </div>
        <div class="dam-pending-pill">⏳ Pending Review</div>
      </div>
      <button type="button" class="dam-close-btn" data-action="close-approval-modal">×</button>
    </div>

    <div class="dam-body">
      <div class="dam-info-grid">
        <div class="dam-info-card">
          <div class="dam-card-title">👤 Personal Information</div>
          <div class="dam-info-rows">
            <div class="dam-info-row"><span>Full Name</span><strong>Dr. ${escapeHtml(doc.name)}</strong></div>
            <div class="dam-info-row"><span>Email</span><strong>${escapeHtml(doc.email)}</strong></div>
            <div class="dam-info-row"><span>Phone</span><strong>${escapeHtml(doc.phone)}</strong></div>
            <div class="dam-info-row"><span>State</span><strong>${escapeHtml(doc.state)}</strong></div>
            <div class="dam-info-row"><span>Applied</span><strong>${escapeHtml(doc.appliedDate)}</strong></div>
          </div>
        </div>

        <div class="dam-info-card">
          <div class="dam-card-title">🏥 Professional Details</div>
          <div class="dam-info-rows">
            <div class="dam-info-row">
              <span>Specialty</span>
              <strong style="color:${doc.color}">${escapeHtml(doc.specialty)}</strong>
            </div>
            <div class="dam-info-row"><span>Hospital</span><strong>${escapeHtml(doc.hospital)}</strong></div>
            <div class="dam-info-row"><span>Experience</span><strong>${doc.yearsExp} years</strong></div>
            <div class="dam-info-row"><span>Education</span><strong>${escapeHtml(doc.education)}</strong></div>
            <div class="dam-info-row"><span>Fellowship</span><strong>${escapeHtml(doc.fellowship)}</strong></div>
          </div>
        </div>

        <div class="dam-info-card mdcn-card">
          <div class="dam-card-title">📋 MDCN Verification</div>
          <div class="dam-mdcn-display">
            <div class="dam-mdcn-logo">MDCN</div>
            <div class="dam-mdcn-details">
              <div class="dam-mdcn-num">${escapeHtml(doc.mdcn)}</div>
              <div class="dam-mdcn-sub">Registration Number</div>
            </div>
          </div>
          <div class="dam-mdcn-actions">
            <a href="https://www.mdcn.gov.ng" target="_blank" rel="noopener" class="btn-verify-mdcn">
              🔍 Verify on MDCN Website
            </a>
            <button type="button" class="btn-mark-verified"
              data-action="mark-mdcn-verified" data-id="${escapeHtml(doc.id)}">
              ✅ Mark as Verified
            </button>
          </div>
          <div class="dam-mdcn-status" id="mdcnStatus-${escapeHtml(doc.id)}">
            ⏳ Pending MDCN verification
          </div>
        </div>
      </div>

      <div class="dam-bio-section">
        <div class="dam-section-title">📝 Professional Bio</div>
        <div class="dam-bio-text">"${escapeHtml(doc.bio)}"</div>
      </div>

      <div class="dam-skills-section">
        <div class="dam-section-title">🔬 Skills & Specializations</div>
        <div class="dam-skills-wrap">
          ${doc.skills.map((s) => `
            <span class="dam-skill-chip"
              style="background:${doc.color}15;color:${doc.color};border-color:${doc.color}44">
              ${escapeHtml(s)}
            </span>
          `).join('')}
        </div>
      </div>

      <div class="dam-price-section">
        <div class="dam-section-title">
          💰 Set Consultation Fee
          <span class="dam-price-note">(Set before approving)</span>
        </div>
        <div class="dam-price-control">
          <div class="dam-price-tiers">
            ${[
              { label: 'GP Rate', value: 5000 },
              { label: 'Specialist', value: 10000 },
              { label: 'Senior', value: 15000 },
              { label: 'Professor', value: 25000 }
            ].map((t) => `
              <button type="button" class="dam-price-tier-btn"
                data-action="set-approval-price" data-price="${t.value}">
                ${formatNairaSplit(t.value)}
                <span>${t.label}</span>
              </button>
            `).join('')}
          </div>
          <div class="dam-custom-price">
            <span class="dam-price-sym">₦</span>
            <input type="number" id="approvalPrice-${escapeHtml(doc.id)}"
              class="dam-price-input" value="10000" min="1000" step="500" placeholder="Custom price" />
            <span class="dam-per-session">per session</span>
          </div>
          <div class="dam-price-split">
            Doctor receives:
            <strong class="dam-doc-gets" id="approvalDocGets-${escapeHtml(doc.id)}">₦7,000 (70%)</strong>
            · Platform keeps:
            <strong id="approvalPlatformKeeps-${escapeHtml(doc.id)}">₦3,000 (30%)</strong>
          </div>
        </div>
      </div>

      <div class="dam-notes-section">
        <div class="dam-section-title">💬 Admin Notes (internal only)</div>
        <textarea id="approvalNotes-${escapeHtml(doc.id)}" class="admin-textarea" rows="3"
          placeholder="Add any notes about this application e.g. 'MDCN verified manually on 25/06/2026'"></textarea>
      </div>
    </div>

    <div class="dam-footer">
      <div class="dam-footer-left">
        <button type="button" class="btn-dam-cancel" data-action="close-approval-modal">← Back to List</button>
      </div>
      <div class="dam-footer-right">
        <button type="button" class="btn-dam-more-info"
          data-action="request-more-info" data-id="${escapeHtml(doc.id)}" data-name="${escapeHtml(doc.name)}">
          📧 Request More Info
        </button>
        <button type="button" class="btn-dam-reject"
          data-action="full-reject" data-id="${escapeHtml(doc.id)}" data-name="${escapeHtml(doc.name)}">
          ✗ Reject Application
        </button>
        <button type="button" class="btn-dam-approve"
          data-action="full-approve" data-id="${escapeHtml(doc.id)}" data-name="${escapeHtml(doc.name)}">
          ✅ Approve & Onboard Doctor
        </button>
      </div>
    </div>
  `;

  const priceInput = box.querySelector(`#approvalPrice-${doc.id}`);
  if (priceInput) {
    priceInput.addEventListener('input', () => {
      const price = parseInt(priceInput.value, 10) || 0;
      const docEl = box.querySelector(`#approvalDocGets-${doc.id}`);
      const platformEl = box.querySelector(`#approvalPlatformKeeps-${doc.id}`);
      if (docEl) docEl.textContent = formatNairaSplit(price * 0.7) + ' (70%)';
      if (platformEl) platformEl.textContent = formatNairaSplit(price * 0.3) + ' (30%)';
    });
  }

  modal.style.display = 'flex';
}

function closeDoctorApprovalModal() {
  const modal = doctorsRoot?.querySelector('#doctorApprovalModal');
  if (modal) modal.style.display = 'none';
  currentApprovalDoctorId = null;
}

function setApprovalPrice(price, btn) {
  const box = doctorsRoot?.querySelector('#doctorApprovalBox');
  if (!box) return;

  box.querySelectorAll('.dam-price-tier-btn').forEach((b) => b.classList.remove('active'));
  btn?.classList.add('active');

  const inputs = box.querySelectorAll('[id^="approvalPrice-"]');
  inputs.forEach((input) => {
    input.value = price;
    const doctorId = input.id.replace('approvalPrice-', '');
    const docGets = box.querySelector(`#approvalDocGets-${doctorId}`);
    const platformKeeps = box.querySelector(`#approvalPlatformKeeps-${doctorId}`);
    if (docGets) docGets.textContent = formatNairaSplit(price * 0.7) + ' (70%)';
    if (platformKeeps) platformKeeps.textContent = formatNairaSplit(price * 0.3) + ' (30%)';
  });
}

function markMDCNVerified(doctorId) {
  const status = doctorsRoot?.querySelector(`#mdcnStatus-${doctorId}`);
  if (status) {
    status.textContent = '✅ MDCN Verified by Admin';
    status.style.color = 'var(--green)';
    status.style.fontWeight = '700';
  }
  toast('MDCN marked as verified ✅', 'success');
}

function fullApproveDoctor(doctorId, doctorName) {
  const priceInput = doctorsRoot?.querySelector(`#approvalPrice-${doctorId}`);
  const price = parseInt(priceInput?.value || 10000, 10);

  closeDoctorApprovalModal();

  const card = doctorsRoot?.querySelector(`#pendingCard-${doctorId}`);
  if (card) {
    card.style.opacity = '0';
    card.style.transform = 'scale(0.95)';
    card.style.transition = 'all 0.4s ease';
    setTimeout(() => card.remove(), 400);
  }

  toast(
    `✅ Dr. ${doctorName} approved! Price set to ${formatNairaSplit(price)}. Welcome email sent.`,
    'success',
    5000
  );
}

function fullRejectDoctor(doctorId, doctorName) {
  if (!confirm(`Reject Dr. ${doctorName}'s application?\n\nA rejection email will be sent with the reason.`)) return;

  closeDoctorApprovalModal();

  const card = doctorsRoot?.querySelector(`#pendingCard-${doctorId}`);
  if (card) {
    card.style.opacity = '0';
    card.style.transition = 'all 0.4s ease';
    setTimeout(() => card.remove(), 400);
  }

  toast(`Application for Dr. ${doctorName} rejected. Email sent.`, 'warning');
}

function requestMoreInfo(doctorId, doctorName) {
  toast(`📧 Information request sent to Dr. ${doctorName}`, 'info');
}

function quickApproveDoctor(doctorId) {
  openDoctorApprovalModal(doctorId);
}

function quickRejectDoctor(doctorId, doctorName) {
  if (!confirm(`Reject Dr. ${doctorName}?`)) return;

  const card = doctorsRoot?.querySelector(`#pendingCard-${doctorId}`);
  if (card) {
    card.style.opacity = '0';
    card.style.transition = 'all 0.3s';
    setTimeout(() => card.remove(), 300);
  }
  toast('Application rejected.', 'warning');
}

function updateTierPrice(tier, value, inputEl) {
  const price = parseInt(value, 10) || 0;
  const card = inputEl?.closest('.fee-tier-card')
    || doctorsRoot?.querySelector(`.fee-tier-card[data-tier="${tier}"]`);
  if (!card) return;

  const doctorCut = card.querySelector('.ftc-doctor-cut');
  const platformCut = card.querySelector('.ftc-platform-cut');
  if (doctorCut) doctorCut.textContent = formatNairaSplit(price * 0.7);
  if (platformCut) platformCut.textContent = formatNairaSplit(price * 0.3);
}

function saveFeeSettings() {
  toast('Fee settings saved! ✅', 'success');
}

function applyTierToAll(tier) {
  toast(`${tier} price applied to all ${tier} doctors ✅`, 'success');
}

function setIndividualPrice(doctorId, doctorName) {
  const input = doctorsRoot?.querySelector(`#price-${doctorId}`);
  const price = parseInt(input?.value || 0, 10);

  if (!price || price < 1000) {
    toast('Please enter a valid price (min ₦1,000)', 'warning');
    return;
  }

  toast(`Price updated to ${formatNairaSplit(price)} for ${doctorName} ✅`, 'success');
  if (input) input.placeholder = String(price);
}

export function openCreatePromoModal() {
  const modal = doctorsRoot?.querySelector('#createPromoModal');
  if (!modal) return;

  modal.style.display = 'flex';

  const today = new Date().toISOString().split('T')[0];
  const end = new Date();
  end.setMonth(end.getMonth() + 1);
  const endStr = end.toISOString().split('T')[0];

  const startEl = doctorsRoot?.querySelector('#promoStartDate');
  const endEl = doctorsRoot?.querySelector('#promoEndDate');
  if (startEl && !startEl.value) startEl.value = today;
  if (endEl && !endEl.value) endEl.value = endStr;

  updatePromoPreview();
}

function closeCreatePromoModal() {
  const modal = doctorsRoot?.querySelector('#createPromoModal');
  if (modal) modal.style.display = 'none';
}

function updatePromoPreview() {
  const type = doctorsRoot?.querySelector('#promoDiscountType')?.value;
  const value = doctorsRoot?.querySelector('#promoDiscountValue')?.value || '0';
  const name = doctorsRoot?.querySelector('#promoName')?.value || 'Special Offer';

  const prefix = doctorsRoot?.querySelector('#promoValuePrefix');
  if (prefix) {
    prefix.textContent = type === 'percent' ? '%' : type === 'flat' ? '₦' : '100%';
  }

  const titleEl = doctorsRoot?.querySelector('#ppbTitle');
  const discountEl = doctorsRoot?.querySelector('#ppbDiscount');

  if (titleEl) titleEl.textContent = name || 'Your promotion';
  if (discountEl) {
    discountEl.textContent = type === 'free'
      ? 'FREE Consultation!'
      : type === 'percent'
        ? `Save ${value}%`
        : `Save ${formatNairaSplit(parseInt(value, 10) || 0)}`;
  }
}

function generatePromoCode() {
  const words = ['SAVE', 'HEALTH', 'CARE', 'NAIJA', 'VIRTUAL', 'PROMO', 'DEAL', 'OFFER'];
  const nums = Math.floor(Math.random() * 90 + 10);
  const word = words[Math.floor(Math.random() * words.length)];
  const code = `${word}${nums}`;
  const input = doctorsRoot?.querySelector('#promoCode');
  if (input) input.value = code;
}

function copyPromoCode(code) {
  navigator.clipboard?.writeText(code).then(() => {
    toast(`Code ${code} copied! 📋`, 'success');
  }).catch(() => {
    toast(`Code: ${code}`, 'info');
  });
}

function savePromoDraft() {
  toast('Promotion saved as draft 💾', 'info');
  closeCreatePromoModal();
}

function launchPromotion() {
  const name = doctorsRoot?.querySelector('#promoName')?.value?.trim();
  if (!name) {
    toast('Please enter a promotion name', 'warning');
    return;
  }
  toast(`🚀 Promotion "${name}" launched! Patients are being notified.`, 'success', 5000);
  closeCreatePromoModal();
}

function editPromo(promoId) {
  toast('Opening promotion editor...', 'info');
  openCreatePromoModal();
}

function pausePromo(promoId) {
  toast('Promotion paused ⏸️', 'warning');
}

function viewPromoStats(promoId) {
  toast('Loading promotion statistics...', 'info');
}

function reactivatePromo(code) {
  toast(`Promotion ${code} reactivated! 🟢`, 'success');
}

function deletePromo(code) {
  if (confirm(`Delete promotion ${code}?`)) {
    toast(`Promotion ${code} deleted.`, 'info');
  }
}

function handleDoctorsAction(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn || !doctorsRoot?.contains(btn)) return;

  const { action, id, name, tier, price, code } = btn.dataset;

  switch (action) {
    case 'refresh-doctors': refreshDoctorList(); break;
    case 'export-doctors': exportDoctors(); break;
    case 'view-approval': openDoctorApprovalModal(id); break;
    case 'quick-approve': quickApproveDoctor(id); break;
    case 'quick-reject': quickRejectDoctor(id, name); break;
    case 'save-fees': saveFeeSettings(); break;
    case 'apply-tier': applyTierToAll(tier); break;
    case 'set-individual-price': setIndividualPrice(id, name); break;
    case 'create-promo': openCreatePromoModal(); break;
    case 'close-create-promo': closeCreatePromoModal(); break;
    case 'generate-promo-code': generatePromoCode(); break;
    case 'save-promo-draft': savePromoDraft(); break;
    case 'launch-promotion': launchPromotion(); break;
    case 'edit-promo': editPromo(id); break;
    case 'pause-promo': pausePromo(id); break;
    case 'view-promo-stats': viewPromoStats(id); break;
    case 'copy-promo-code': copyPromoCode(code); break;
    case 'reactivate-promo': reactivatePromo(code); break;
    case 'delete-promo': deletePromo(code); break;
    case 'close-approval-modal': closeDoctorApprovalModal(); break;
    case 'mark-mdcn-verified': markMDCNVerified(id); break;
    case 'set-approval-price': setApprovalPrice(parseInt(price, 10), btn); break;
    case 'request-more-info': requestMoreInfo(id, name); break;
    case 'full-reject': fullRejectDoctor(id, name); break;
    case 'full-approve': fullApproveDoctor(id, name); break;
    default: break;
  }
}

function bindAdminDoctorsEvents(root) {
  doctorsRoot = root;

  root.addEventListener('click', handleDoctorsAction);

  root.querySelectorAll('.ftc-price-input').forEach((input) => {
    input.addEventListener('change', () => {
      updateTierPrice(input.dataset.tier, input.value, input);
    });
  });

  root.querySelector('#promoDiscountType')?.addEventListener('change', updatePromoPreview);
  root.querySelector('#promoDiscountValue')?.addEventListener('input', updatePromoPreview);
  root.querySelector('#promoName')?.addEventListener('input', updatePromoPreview);

  root.querySelector('#promoCode')?.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
  });

  root.querySelector('#doctorApprovalModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'doctorApprovalModal') closeDoctorApprovalModal();
  });

  root.querySelector('#createPromoModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'createPromoModal') closeCreatePromoModal();
  });
}

export async function renderAdminDoctors(container) {
  container.innerHTML = getAdminDoctorsHTML();
  bindAdminDoctorsEvents(container);

  if (sessionStorage.getItem('adminOpenCreatePromo')) {
    sessionStorage.removeItem('adminOpenCreatePromo');
    setTimeout(() => openCreatePromoModal(), 100);
  }
}
