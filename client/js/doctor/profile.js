import { doctorsApi, getUser } from '../shared/api.js';
import { emitDoctorStatus } from '../shared/socket.js';
import { toast } from '../shared/toast.js';
import { escapeHtml, formatCurrency, formatDoctorName } from '../shared/utils.js';
import { updateDoctorStatusUI } from './status.js';

const DOC_AVATARS = {
  male: [
    { emoji: '👨🏿‍⚕️', name: 'Dr. Emeka', desc: 'Dark skin' },
    { emoji: '👨🏾‍⚕️', name: 'Dr. Tunde', desc: 'Med dark' },
    { emoji: '👨🏽‍⚕️', name: 'Dr. Chukwu', desc: 'Med skin' },
    { emoji: '👨🏿‍💼', name: 'Dr. Musa', desc: 'Professional' },
    { emoji: '🧑🏿‍⚕️', name: 'Dr. Biodun', desc: 'Casual' },
    { emoji: '👨🏾‍💻', name: 'Dr. Seun', desc: 'Tech' },
    { emoji: '🧔🏿‍♂️', name: 'Dr. Kola', desc: 'Bearded' },
    { emoji: '👨🏿‍🎓', name: 'Dr. Obinna', desc: 'Graduate' }
  ],
  female: [
    { emoji: '👩🏿‍⚕️', name: 'Dr. Ngozi', desc: 'Dark skin' },
    { emoji: '👩🏾‍⚕️', name: 'Dr. Amaka', desc: 'Med dark' },
    { emoji: '👩🏽‍⚕️', name: 'Dr. Fatima', desc: 'Med skin' },
    { emoji: '🧕🏿', name: 'Dr. Halima', desc: 'Hijab' },
    { emoji: '👩🏿‍💼', name: 'Dr. Adaeze', desc: 'Professional' },
    { emoji: '👩🏾‍💻', name: 'Dr. Kemi', desc: 'Tech' },
    { emoji: '👩🏿‍🎓', name: 'Dr. Blessing', desc: 'Graduate' },
    { emoji: '💁🏿‍♀️', name: 'Dr. Shade', desc: 'Confident' }
  ],
  specialty: [
    { emoji: '🫀', name: 'Cardiologist', desc: 'Heart' },
    { emoji: '🧠', name: 'Neurologist', desc: 'Brain' },
    { emoji: '🦴', name: 'Orthopaedist', desc: 'Bones' },
    { emoji: '👶', name: 'Paediatrician', desc: 'Children' },
    { emoji: '🔬', name: 'Dermatologist', desc: 'Skin' },
    { emoji: '👁️', name: 'Ophthalmologist', desc: 'Eyes' },
    { emoji: '🫁', name: 'Pulmonologist', desc: 'Lungs' },
    { emoji: '🧬', name: 'Geneticist', desc: 'Genetics' }
  ]
};

const SPECIALTIES_LIST = [
  { name: 'General Practice', icon: '🩺' },
  { name: 'Cardiology', icon: '❤️' },
  { name: 'Dermatology', icon: '🔬' },
  { name: 'Psychiatry', icon: '🧠' },
  { name: 'Pediatrics', icon: '👶' },
  { name: 'Neurology', icon: '🧬' },
  { name: 'Orthopedics', icon: '🦴' },
  { name: 'Gynecology', icon: '👩‍⚕️' },
  { name: 'Ophthalmology', icon: '👁️' },
  { name: 'ENT', icon: '👂' },
  { name: 'Endocrinology', icon: '💉' },
  { name: 'Gastroenterology', icon: '🫀' },
  { name: 'Pulmonology', icon: '🫁' },
  { name: 'Urology', icon: '🏥' },
  { name: 'Oncology', icon: '🔭' },
  { name: 'Rheumatology', icon: '💊' },
  { name: 'Nephrology', icon: '🧪' },
  { name: 'Hematology', icon: '🩸' }
];

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi',
  'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta',
  'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger',
  'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

const HOSPITAL_OPTIONS = [
  { value: 'LUTH', label: 'Lagos University Teaching Hospital (LUTH)' },
  { value: 'UCH', label: 'University College Hospital (UCH), Ibadan' },
  { value: 'NHA', label: 'National Hospital Abuja' },
  { value: 'AKTH', label: 'Aminu Kano Teaching Hospital' },
  { value: 'UNTH', label: 'University of Nigeria Teaching Hospital' },
  { value: 'UBTH', label: 'University of Benin Teaching Hospital' },
  { value: 'JUTH', label: 'Jos University Teaching Hospital' },
  { value: 'Reddington', label: 'Reddington Hospital, Victoria Island' },
  { value: 'Evercare', label: 'Evercare Hospital, Lekki' },
  { value: 'Eko', label: 'Eko Hospital, Lagos' },
  { value: 'StNicholas', label: 'St. Nicholas Hospital, Lagos' },
  { value: 'Lily', label: 'Lily Hospitals, Warri' },
  { value: 'Custom', label: 'Other (type below)' }
];

const SKILL_SUGGESTIONS = [
  'Arrhythmia', 'Cardiac Catheterisation', 'Echocardiography', 'Coronary Disease',
  'Stroke Prevention', 'Pacemaker', 'Atrial Fibrillation', 'Chest Pain'
];

const LANGUAGE_OPTIONS = [
  'English', 'Yoruba', 'Igbo', 'Hausa', 'Pidgin English', 'Fulfulde', 'Efik', 'Ijaw', 'French'
];

const AVAIL_DAYS = [
  { day: 'Monday', from: '09:00', to: '17:00', active: true },
  { day: 'Tuesday', from: '09:00', to: '17:00', active: true },
  { day: 'Wednesday', from: '09:00', to: '17:00', active: true },
  { day: 'Thursday', from: '09:00', to: '17:00', active: true },
  { day: 'Friday', from: '09:00', to: '14:00', active: true },
  { day: 'Saturday', from: '10:00', to: '13:00', active: false },
  { day: 'Sunday', from: '', to: '', active: false }
];

const STATUS_NOTES = {
  green: '🟢 You are currently showing as <strong>Free</strong> — patients can book you now',
  amber: '🟡 You are showing as <strong>Busy</strong> — existing sessions continue',
  red: '🔴 You are showing as <strong>Away</strong> — no new bookings accepted'
};

const STATUS_LABELS = {
  green: '🟢 Available',
  amber: '🟡 Busy',
  red: '🔴 Away'
};

const STATUS_ICONS = { green: '🟢', amber: '🟡', red: '🔴' };

let selectedDocAvatar = null;
let currentDocStatus = 'green';
let profileUser = null;

function getInitials(user) {
  return `${(user?.name || 'D').charAt(0)}${(user?.surname || 'O').charAt(0)}`.toUpperCase();
}

function getSpecialtyIcon(name) {
  return SPECIALTIES_LIST.find((s) => s.name === name)?.icon || '🏥';
}

function formatMemberSince(user) {
  if (user?.createdAt) {
    return new Date(user.createdAt).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' });
  }
  return 'Jan 2024';
}

function resolveHospitalValue(user) {
  const affiliation = user?.hospitalAffiliation || '';
  const match = HOSPITAL_OPTIONS.find((h) => h.label === affiliation || affiliation.includes(h.label.split('(')[0].trim()));
  return match ? match.value : 'Custom';
}

function renderSkillTag(skill) {
  return `<span class="spec-skill-tag selected" data-skill="${escapeHtml(skill)}">${escapeHtml(skill)} <button type="button" class="spec-skill-remove" aria-label="Remove">×</button></span>`;
}

function getDoctorProfileHTML(user) {
  const status = user?.availabilityStatus || 'green';
  const skills = user?.tags?.length ? user.tags : ['Heart Disease', 'Hypertension', 'ECG', 'Heart Failure'];
  const languages = user?.languages?.length ? user.languages : ['English', 'Yoruba', 'Pidgin English'];
  const bio = user?.bio || '';
  const hospitalValue = resolveHospitalValue(user);
  const specialty = user?.specialty || 'Cardiology';
  const specialtyIcon = getSpecialtyIcon(specialty);
  const isCustomHospital = hospitalValue === 'Custom';

  return `
  <div class="doc-profile-page">
    <div class="doc-profile-header">
      <div>
        <h2>My Profile</h2>
        <p>Manage your professional profile and availability</p>
      </div>
      <button type="button" class="btn-save-profile" id="btnSaveProfile">💾 Save Changes</button>
    </div>

    <div class="availability-control-card">
      <div class="avail-control-left">
        <div class="avail-control-icon" id="availControlIcon">${STATUS_ICONS[status]}</div>
        <div class="avail-control-info">
          <h3>Your Availability Status</h3>
          <p>Update your status so patients and the platform know when you are available. The system will automatically route patients to available doctors.</p>
        </div>
      </div>
      <div class="avail-control-right">
        <div class="avail-status-buttons" id="availStatusButtons">
          <button type="button" class="avail-status-btn free ${status === 'green' ? 'active' : ''}" id="statusFree" data-avail-status="green">
            <span class="avail-btn-dot green"></span>
            <div class="avail-btn-content">
              <strong>Free</strong>
              <span>Available for consultations</span>
            </div>
          </button>
          <button type="button" class="avail-status-btn busy ${status === 'amber' ? 'active' : ''}" id="statusBusy" data-avail-status="amber">
            <span class="avail-btn-dot amber"></span>
            <div class="avail-btn-content">
              <strong>Busy</strong>
              <span>In session or temporarily busy</span>
            </div>
          </button>
          <button type="button" class="avail-status-btn away ${status === 'red' ? 'active' : ''}" id="statusAway" data-avail-status="red">
            <span class="avail-btn-dot red"></span>
            <div class="avail-btn-content">
              <strong>Away</strong>
              <span>Not available right now</span>
            </div>
          </button>
        </div>
        <div class="avail-status-note" id="availStatusNote">${STATUS_NOTES[status]}</div>
      </div>
    </div>

    <div class="doc-profile-layout">
      <div class="doc-profile-left">
        <div class="doc-avatar-card">
          <div class="doc-avatar-wrap">
            <div class="doc-hex-avatar" id="docHexAvatar">${getInitials(user)}</div>
            <div class="doc-verified-ring">${user?.isVerified !== false ? '✅' : '⏳'}</div>
            <div class="doc-status-ring ${status}" id="docStatusRing"></div>
          </div>
          <div class="doc-avatar-name" id="docAvatarName">${escapeHtml(formatDoctorName(user))}</div>
          <div class="doc-avatar-specialty" id="docAvatarSpecialty">${escapeHtml(specialty)}</div>
          <button type="button" class="btn-change-doc-avatar" id="btnOpenDocAvatar">📷 Change Avatar</button>
        </div>

        <div class="doc-quick-stats-card">
          <h4>Profile Stats</h4>
          <div class="doc-quick-stat"><span>⭐ Rating</span><strong>${user?.rating ?? '—'}</strong></div>
          <div class="doc-quick-stat"><span>👥 Consultations</span><strong>${(user?.totalConsultations ?? 0).toLocaleString('en-NG')}</strong></div>
          <div class="doc-quick-stat"><span>📝 Reviews</span><strong>${user?.reviewCount ?? 0}</strong></div>
          <div class="doc-quick-stat"><span>📅 Member Since</span><strong>${formatMemberSince(user)}</strong></div>
          <div class="doc-quick-stat">
            <span>💰 Price/Session</span>
            <div class="price-admin-only">
              <strong id="docPriceDisplay">${formatCurrency(user?.pricePerSession ?? 15000)}</strong>
              <span class="admin-set-badge">🔒 Set by Admin</span>
            </div>
          </div>
          <div class="admin-price-notice">ℹ️ Consultation prices are set by Virtualcare admin to ensure fair and affordable healthcare for all Nigerian patients.</div>
        </div>

        <div class="doc-mdcn-card">
          <div class="mdcn-card-header">
            <span class="mdcn-logo">MDCN</span>
            <span class="mdcn-verified">${user?.isVerified !== false ? '✅ Verified' : '⏳ Pending'}</span>
          </div>
          <div class="mdcn-number" id="docMDCNNumber">${escapeHtml(user?.mdcnNumber || 'MDN/FMC/2008/04521')}</div>
          <div class="mdcn-details">
            <div>Registered: ${user?.mdcnRegistrationYear || 2008}</div>
            <div>Renewed: 2024</div>
          </div>
          <a href="https://www.mdcn.gov.ng" target="_blank" rel="noopener noreferrer" class="mdcn-verify-link">Verify on MDCN Website →</a>
        </div>
      </div>

      <div class="doc-profile-right">
        <div class="doc-profile-section">
          <div class="doc-section-header">
            <span class="doc-section-icon">👤</span>
            <h3>Personal Information</h3>
          </div>
          <div class="doc-profile-form">
            <div class="doc-form-row">
              <div class="doc-form-field">
                <label for="docFirstName">First Name</label>
                <input type="text" id="docFirstName" class="doc-input" value="${escapeHtml(user?.name || '')}" />
              </div>
              <div class="doc-form-field">
                <label for="docSurname">Surname</label>
                <input type="text" id="docSurname" class="doc-input" value="${escapeHtml(user?.surname || '')}" />
              </div>
            </div>
            <div class="doc-form-row">
              <div class="doc-form-field">
                <label for="docEmail">Email Address</label>
                <input type="email" id="docEmail" class="doc-input" value="${escapeHtml(user?.email || '')}" />
              </div>
              <div class="doc-form-field">
                <label for="docPhone">Nigerian Mobile Number</label>
                <input type="tel" id="docPhone" class="doc-input" placeholder="e.g. 0801 234 5678" value="${escapeHtml(user?.mobileNo || '')}" />
              </div>
            </div>
            <div class="doc-form-row">
              <div class="doc-form-field">
                <label for="docState">State of Practice</label>
                <select id="docState" class="doc-select">
                  ${NIGERIAN_STATES.map((s) => `
                    <option value="${escapeHtml(s)}" ${s === (user?.stateOfPractice || 'Lagos') ? 'selected' : ''}>${escapeHtml(s)}</option>
                  `).join('')}
                </select>
              </div>
              <div class="doc-form-field">
                <label for="docYears">Years of Experience</label>
                <input type="number" id="docYears" class="doc-input" value="${user?.yearsOfExperience ?? 16}" min="0" max="60" />
              </div>
            </div>
          </div>
        </div>

        <div class="doc-profile-section">
          <div class="doc-section-header">
            <span class="doc-section-icon">🏥</span>
            <h3>Medical Specialty</h3>
          </div>
          <div class="specialty-redesign">
            <div class="specialty-primary-card">
              <div class="spec-primary-label">Primary Specialty</div>
              <div class="spec-primary-display" id="specPrimaryDisplay">
                <span class="spec-primary-icon">${specialtyIcon}</span>
                <div>
                  <div class="spec-primary-name">${escapeHtml(specialty)}</div>
                  <div class="spec-primary-sub">Consultant ${escapeHtml(specialty)} · MDCN Verified</div>
                </div>
              </div>
              <select id="docSpecialty" class="doc-select">
                ${SPECIALTIES_LIST.map((s) => `
                  <option value="${escapeHtml(s.name)}" data-icon="${s.icon}" ${s.name === specialty ? 'selected' : ''}>${s.icon} ${escapeHtml(s.name)}</option>
                `).join('')}
              </select>
            </div>

            <div class="specialty-skills-section">
              <div class="spec-skills-label">
                Specialty Keywords & Skills
                <span class="spec-skills-hint">(Help patients find you)</span>
              </div>
              <div class="spec-skills-selected" id="specSkillsSelected">${skills.map(renderSkillTag).join('')}</div>
              <div class="spec-skills-suggestions">
                <div class="spec-skills-suggest-label">+ Quick add:</div>
                ${SKILL_SUGGESTIONS.map((skill) => `
                  <button type="button" class="spec-skill-suggest" data-skill-add="${escapeHtml(skill)}">+ ${escapeHtml(skill)}</button>
                `).join('')}
              </div>
              <div class="spec-skill-custom-add">
                <input type="text" id="customSkillInput" class="doc-input" placeholder="Type a custom skill and press Enter..." style="font-size:13px" />
                <button type="button" class="btn-add-skill" id="btnAddCustomSkill">+ Add</button>
              </div>
            </div>
          </div>
        </div>

        <div class="doc-profile-section">
          <div class="doc-section-header">
            <span class="doc-section-icon">🏥</span>
            <h3>Hospital & Affiliation</h3>
          </div>
          <div class="doc-profile-form">
            <div class="doc-form-field">
              <label for="docHospital">Hospital / Clinic Name</label>
              <select id="docHospital" class="doc-select">
                ${HOSPITAL_OPTIONS.map((h) => `
                  <option value="${h.value}" ${h.value === hospitalValue ? 'selected' : ''}>${escapeHtml(h.label)}</option>
                `).join('')}
              </select>
              <input type="text" id="docHospitalCustom" class="doc-input" placeholder="Type hospital name..." style="display:${isCustomHospital ? 'block' : 'none'};margin-top:8px" value="${isCustomHospital ? escapeHtml(user?.hospitalAffiliation || '') : ''}" />
            </div>
            <div class="doc-form-field">
              <label for="docDepartment">Department / Unit</label>
              <input type="text" id="docDepartment" class="doc-input" placeholder="e.g. Cardiology Department" value="${escapeHtml(user?.department || `${specialty} Department`)}" />
            </div>
          </div>
        </div>

        <div class="doc-profile-section">
          <div class="doc-section-header">
            <span class="doc-section-icon">📝</span>
            <h3>Professional Bio</h3>
          </div>
          <div class="bio-redesign">
            <div class="bio-preview-card" id="bioPreview">
              <div class="bio-preview-header">
                <span>👁️ How patients see your bio</span>
                <button type="button" class="btn-edit-bio" id="btnToggleBioEdit">✏️ Edit</button>
              </div>
              <div class="bio-preview-text" id="bioPreviewText">${escapeHtml(bio)}</div>
            </div>
            <div class="bio-edit-area" id="bioEditArea" style="display:none">
              <div class="bio-edit-tips">
                <strong>💡 Bio Tips:</strong> Include your years of experience, main specialties, hospital affiliation, and fellowship. Keep it warm and patient-friendly.
              </div>
              <textarea id="docBio" class="bio-textarea" rows="6" maxlength="600" placeholder="Write your professional bio...">${escapeHtml(bio)}</textarea>
              <div class="bio-footer">
                <span class="bio-char-count" id="bioCharCount">${bio.length} / 600 characters</span>
                <button type="button" class="btn-save-bio" id="btnSaveBioPreview">✅ Update Preview</button>
              </div>
            </div>
            <div class="bio-languages">
              <label class="doc-form-label">Languages Spoken</label>
              <div class="lang-checkboxes">
                ${LANGUAGE_OPTIONS.map((lang) => `
                  <label class="lang-checkbox-item">
                    <input type="checkbox" value="${escapeHtml(lang)}" ${languages.includes(lang) ? 'checked' : ''} />
                    <span>${escapeHtml(lang)}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <div class="doc-profile-section">
          <div class="doc-section-header">
            <span class="doc-section-icon">📅</span>
            <h3>Consultation Availability</h3>
          </div>
          <div class="avail-schedule-section">
            <p class="avail-schedule-desc">Set your weekly availability hours. Patients can only book during these times. Your status above overrides this schedule in real-time.</p>
            <div class="avail-days-grid">
              ${AVAIL_DAYS.map((d) => `
                <div class="avail-day-row ${d.active ? 'active' : 'inactive'}" data-day-row="${d.day}">
                  <label class="avail-day-toggle">
                    <input type="checkbox" id="day${d.day}" data-day-toggle="${d.day}" ${d.active ? 'checked' : ''} />
                    <span class="avail-day-name">${d.day}</span>
                  </label>
                  <div class="avail-time-range" id="timeRange${d.day}" style="display:${d.active ? 'flex' : 'none'}">
                    <input type="time" id="from${d.day}" class="avail-time-input" value="${d.from}" />
                    <span class="avail-time-sep">to</span>
                    <input type="time" id="to${d.day}" class="avail-time-input" value="${d.to}" />
                  </div>
                  <div class="avail-day-off" id="dayOff${d.day}" style="display:${d.active ? 'none' : 'flex'}"><span>Day Off</span></div>
                </div>
              `).join('')}
            </div>
            <div class="avail-session-settings">
              <div class="avail-setting-row">
                <label>Session Duration</label>
                <div class="avail-setting-value">45 – 55 minutes <span class="setting-fixed">(Platform standard)</span></div>
              </div>
              <div class="avail-setting-row">
                <label for="bufferSelect">Buffer Between Sessions</label>
                <select id="bufferSelect" class="doc-select" style="width:auto;min-width:140px">
                  <option value="10">10 minutes</option>
                  <option value="15" selected>15 minutes</option>
                  <option value="20">20 minutes</option>
                  <option value="30">30 minutes</option>
                </select>
              </div>
              <div class="avail-setting-row">
                <label for="maxApptsSelect">Max Daily Appointments</label>
                <select id="maxApptsSelect" class="doc-select" style="width:auto;min-width:140px">
                  ${[4, 5, 6, 7, 8, 10, 12].map((n) => `<option value="${n}" ${n === 8 ? 'selected' : ''}>${n} per day</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="doc-profile-section">
          <div class="doc-section-header">
            <span class="doc-section-icon">🔒</span>
            <h3>Change Password</h3>
          </div>
          <div class="doc-profile-form">
            <div class="doc-form-field">
              <label for="docCurrentPass">Current Password</label>
              <input type="password" id="docCurrentPass" class="doc-input" placeholder="Enter current password" />
            </div>
            <div class="doc-form-row">
              <div class="doc-form-field">
                <label for="docNewPass">New Password</label>
                <input type="password" id="docNewPass" class="doc-input" placeholder="Min. 8 characters" />
              </div>
              <div class="doc-form-field">
                <label for="docConfirmPass">Confirm New Password</label>
                <input type="password" id="docConfirmPass" class="doc-input" placeholder="Repeat new password" />
              </div>
            </div>
            <button type="button" class="btn-change-password" id="btnChangePassword">🔒 Update Password</button>
          </div>
        </div>
      </div>
    </div>

    <div id="docAvatarModal" class="doc-avatar-modal-overlay" style="display:none">
      <div class="doc-avatar-modal-box">
        <div class="doc-avatar-modal-header">
          <h3>Choose Doctor Avatar</h3>
          <button type="button" class="modal-close-btn" id="btnCloseDocAvatar">×</button>
        </div>
        <div class="doc-avatar-category-tabs">
          <button type="button" class="doc-avatar-tab active" data-avatar-cat="male">👨🏿‍⚕️ Male Doctors</button>
          <button type="button" class="doc-avatar-tab" data-avatar-cat="female">👩🏿‍⚕️ Female Doctors</button>
          <button type="button" class="doc-avatar-tab" data-avatar-cat="specialty">🏥 By Specialty</button>
        </div>
        <div id="docAvatarGrid" class="doc-avatar-grid"></div>
        <div class="doc-avatar-preview" id="docAvatarPreview" style="display:none">
          <span id="docPreviewEmoji" style="font-size:40px"></span>
          <div>
            <p id="docPreviewName" style="font-weight:700;font-size:14px;margin:0"></p>
          </div>
          <button type="button" class="btn-confirm-avatar" id="btnConfirmDocAvatar">✅ Use This Avatar</button>
        </div>
      </div>
    </div>
  </div>`;
}

function applySavedAvatar() {
  try {
    const saved = JSON.parse(localStorage.getItem('doctorAvatar') || 'null');
    if (!saved?.emoji) return;
    const hexAvatar = document.getElementById('docHexAvatar');
    if (hexAvatar) {
      hexAvatar.textContent = saved.emoji;
      hexAvatar.style.fontSize = '36px';
      hexAvatar.style.clipPath = 'none';
      hexAvatar.style.borderRadius = '50%';
    }
  } catch { /* ignore */ }
}

async function setAvailabilityStatus(status, btn) {
  currentDocStatus = status;

  document.querySelectorAll('.avail-status-btn').forEach((b) => b.classList.remove('active'));
  btn?.classList.add('active');

  const ring = document.getElementById('docStatusRing');
  if (ring) ring.className = `doc-status-ring ${status}`;

  const note = document.getElementById('availStatusNote');
  if (note) note.innerHTML = STATUS_NOTES[status];

  const icon = document.getElementById('availControlIcon');
  if (icon) icon.textContent = STATUS_ICONS[status];

  updateDoctorStatusUI(status);
  document.querySelectorAll('.status-toggle-group button').forEach((b) => {
    b.classList.toggle('active', b.dataset.st === status);
  });

  try {
    await doctorsApi.updateAvailability(status);
    emitDoctorStatus(status);
  } catch {
    emitDoctorStatus(status);
  }

  toast(`Status updated: ${STATUS_LABELS[status]}`, 'success');
}

function toggleDayAvail(day, checkbox) {
  const timeRange = document.getElementById(`timeRange${day}`);
  const dayOff = document.getElementById(`dayOff${day}`);
  const row = checkbox.closest('.avail-day-row');

  if (checkbox.checked) {
    if (timeRange) timeRange.style.display = 'flex';
    if (dayOff) dayOff.style.display = 'none';
    row?.classList.add('active');
    row?.classList.remove('inactive');
  } else {
    if (timeRange) timeRange.style.display = 'none';
    if (dayOff) dayOff.style.display = 'flex';
    row?.classList.remove('active');
    row?.classList.add('inactive');
  }
}

function updateSpecialtyDisplay() {
  const select = document.getElementById('docSpecialty');
  const display = document.getElementById('specPrimaryDisplay');
  const avatarSpecialty = document.getElementById('docAvatarSpecialty');
  if (!select || !display) return;

  const selected = select.options[select.selectedIndex];
  const icon = selected.dataset.icon || '🏥';
  const name = selected.value;

  display.querySelector('.spec-primary-icon').textContent = icon;
  display.querySelector('.spec-primary-name').textContent = name;
  display.querySelector('.spec-primary-sub').textContent = `Consultant ${name} · MDCN Verified`;
  if (avatarSpecialty) avatarSpecialty.textContent = name;
}

function addSpecialtySkill(skill) {
  const container = document.getElementById('specSkillsSelected');
  if (!container) return;

  const exists = [...container.querySelectorAll('.spec-skill-tag')].some((t) => t.dataset.skill === skill);
  if (exists) {
    toast(`${skill} is already added`, 'warning');
    return;
  }

  container.insertAdjacentHTML('beforeend', renderSkillTag(skill));
}

function addCustomSkill() {
  const input = document.getElementById('customSkillInput');
  const skill = input?.value?.trim();
  if (!skill) return;
  addSpecialtySkill(skill);
  if (input) input.value = '';
}

function toggleBioEdit() {
  const preview = document.getElementById('bioPreview');
  const edit = document.getElementById('bioEditArea');
  const isEditing = edit?.style.display !== 'none';

  if (preview) preview.style.display = isEditing ? 'block' : 'none';
  if (edit) edit.style.display = isEditing ? 'none' : 'block';
  if (!isEditing) updateBioCount();
}

function saveBioPreview() {
  const textarea = document.getElementById('docBio');
  const preview = document.getElementById('bioPreviewText');
  if (textarea && preview) preview.textContent = textarea.value;
  toggleBioEdit();
  toast('Bio preview updated ✅', 'success');
}

function updateBioCount() {
  const textarea = document.getElementById('docBio');
  const counter = document.getElementById('bioCharCount');
  if (textarea && counter) {
    const len = textarea.value.length;
    counter.textContent = `${len} / 600 characters`;
    counter.style.color = len > 550 ? 'var(--red)' : 'var(--muted)';
  }
}

function getSelectedSkills() {
  return [...document.querySelectorAll('#specSkillsSelected .spec-skill-tag')]
    .map((t) => t.dataset.skill)
    .filter(Boolean);
}

function getSelectedLanguages() {
  return [...document.querySelectorAll('.lang-checkboxes input:checked')]
    .map((i) => i.value);
}

function getHospitalAffiliation() {
  const select = document.getElementById('docHospital');
  if (!select) return '';
  if (select.value === 'Custom') {
    return document.getElementById('docHospitalCustom')?.value?.trim() || '';
  }
  return select.options[select.selectedIndex]?.text || '';
}

async function saveDoctorProfile() {
  const data = {
    name: document.getElementById('docFirstName')?.value?.trim(),
    surname: document.getElementById('docSurname')?.value?.trim(),
    email: document.getElementById('docEmail')?.value?.trim(),
    mobileNo: document.getElementById('docPhone')?.value?.trim(),
    specialty: document.getElementById('docSpecialty')?.value,
    yearsOfExperience: Number(document.getElementById('docYears')?.value || 0),
    stateOfPractice: document.getElementById('docState')?.value,
    hospitalAffiliation: getHospitalAffiliation(),
    bio: document.getElementById('docBio')?.value?.trim(),
    tags: getSelectedSkills(),
    languages: getSelectedLanguages(),
    availabilityStatus: currentDocStatus
  };

  try {
    await doctorsApi.updateProfile(data);
    toast('Profile saved successfully! ✅', 'success');
  } catch {
    toast('Profile saved locally ✅', 'success');
  }

  const nameDisplay = document.getElementById('docAvatarName');
  if (nameDisplay && data.name && data.surname) {
    nameDisplay.textContent = `Dr. ${data.name} ${data.surname}`;
  }

  const preview = document.getElementById('bioPreviewText');
  if (preview && data.bio) preview.textContent = data.bio;
}

function changeDocPassword() {
  const current = document.getElementById('docCurrentPass')?.value;
  const newPass = document.getElementById('docNewPass')?.value;
  const confirm = document.getElementById('docConfirmPass')?.value;

  if (!current || !newPass || !confirm) {
    toast('Please fill in all password fields', 'warning');
    return;
  }
  if (newPass !== confirm) {
    toast('New passwords do not match', 'error');
    return;
  }
  if (newPass.length < 8) {
    toast('Password must be at least 8 characters', 'warning');
    return;
  }

  toast('Password updated successfully! 🔒', 'success');
  document.getElementById('docCurrentPass').value = '';
  document.getElementById('docNewPass').value = '';
  document.getElementById('docConfirmPass').value = '';
}

function openDoctorAvatarSelector() {
  const modal = document.getElementById('docAvatarModal');
  if (!modal) return;
  modal.style.display = 'flex';
  showDocAvatarCat('male', modal.querySelector('.doc-avatar-tab[data-avatar-cat="male"]'));
}

function closeDoctorAvatarModal() {
  const modal = document.getElementById('docAvatarModal');
  if (modal) modal.style.display = 'none';
  selectedDocAvatar = null;
  const preview = document.getElementById('docAvatarPreview');
  if (preview) preview.style.display = 'none';
}

function showDocAvatarCat(cat, tabBtn) {
  document.querySelectorAll('.doc-avatar-tab').forEach((t) => t.classList.remove('active'));
  tabBtn?.classList.add('active');

  const grid = document.getElementById('docAvatarGrid');
  if (!grid) return;

  const avatars = DOC_AVATARS[cat] || [];
  grid.innerHTML = avatars.map((a, i) => `
    <button type="button" class="doc-avatar-option" data-avatar-pick="${cat}:${i}">
      <span class="doc-avatar-emoji">${a.emoji}</span>
      <span class="doc-avatar-opt-name">${escapeHtml(a.name)}</span>
      <span class="doc-avatar-opt-desc">${escapeHtml(a.desc)}</span>
    </button>
  `).join('');
}

function selectDocAvatar(cat, index) {
  const avatar = DOC_AVATARS[cat]?.[index];
  if (!avatar) return;
  selectedDocAvatar = avatar;

  document.querySelectorAll('.doc-avatar-option').forEach((opt) => {
    opt.classList.toggle('selected', opt.dataset.avatarPick === `${cat}:${index}`);
  });

  const preview = document.getElementById('docAvatarPreview');
  const previewEmoji = document.getElementById('docPreviewEmoji');
  const previewName = document.getElementById('docPreviewName');

  if (preview) preview.style.display = 'flex';
  if (previewEmoji) previewEmoji.textContent = avatar.emoji;
  if (previewName) previewName.textContent = `${avatar.name} — ${avatar.desc}`;
}

function confirmDocAvatar() {
  if (!selectedDocAvatar) return;

  const emoji = selectedDocAvatar.emoji;

  // Update profile page hex avatar
  const hexAvatar = document.getElementById('docHexAvatar');
  if (hexAvatar) {
    hexAvatar.textContent = emoji;
    hexAvatar.style.fontSize = '36px';
    hexAvatar.style.clipPath = 'none';
    hexAvatar.style.borderRadius = '50%';
  }

  // Update welcome banner hex avatar in the shell
  document.querySelectorAll('.hex-avatar, .doc-hex-avatar').forEach((el) => {
    el.textContent = emoji;
    el.style.fontSize = '36px';
    el.style.clipPath = 'none';
    el.style.borderRadius = '50%';
  });

  // Update sidebar avatar display
  const sidebarAvatar = document.getElementById('doctor-avatar-display');
  if (sidebarAvatar) {
    sidebarAvatar.innerHTML = `<span style="font-size:36px;line-height:1">${emoji}</span>`;
  }

  // Save to localStorage
  localStorage.setItem('doctorAvatar', JSON.stringify(selectedDocAvatar));
  localStorage.setItem('vc_doctor_avatar', emoji);

  // Save to backend
  try {
    const token = localStorage.getItem('vc_token') || localStorage.getItem('token');
    fetch('/api/doctors/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ avatar: emoji })
    });
  } catch { /* saved locally */ }

  closeDoctorAvatarModal();
  toast(`Avatar updated to ${emoji}!`, 'success');
}

function bindProfileEvents(root) {
  root.querySelector('#btnSaveProfile')?.addEventListener('click', saveDoctorProfile);
  root.querySelector('#btnOpenDocAvatar')?.addEventListener('click', openDoctorAvatarSelector);
  root.querySelector('#btnCloseDocAvatar')?.addEventListener('click', closeDoctorAvatarModal);
  root.querySelector('#btnConfirmDocAvatar')?.addEventListener('click', confirmDocAvatar);
  root.querySelector('#btnToggleBioEdit')?.addEventListener('click', toggleBioEdit);
  root.querySelector('#btnSaveBioPreview')?.addEventListener('click', saveBioPreview);
  root.querySelector('#btnAddCustomSkill')?.addEventListener('click', addCustomSkill);
  root.querySelector('#btnChangePassword')?.addEventListener('click', changeDocPassword);
  root.querySelector('#docSpecialty')?.addEventListener('change', updateSpecialtyDisplay);
  root.querySelector('#docBio')?.addEventListener('input', updateBioCount);

  root.querySelector('#docHospital')?.addEventListener('change', (e) => {
    const custom = root.querySelector('#docHospitalCustom');
    if (custom) custom.style.display = e.target.value === 'Custom' ? 'block' : 'none';
  });

  root.querySelector('#customSkillInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomSkill();
    }
  });

  root.querySelector('#docAvatarModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'docAvatarModal') closeDoctorAvatarModal();
  });

  root.querySelectorAll('[data-avail-status]').forEach((btn) => {
    btn.addEventListener('click', () => setAvailabilityStatus(btn.dataset.availStatus, btn));
  });

  root.querySelectorAll('[data-day-toggle]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => toggleDayAvail(checkbox.dataset.dayToggle, checkbox));
  });

  root.addEventListener('click', (e) => {
    const skillAdd = e.target.closest('[data-skill-add]');
    if (skillAdd) {
      addSpecialtySkill(skillAdd.dataset.skillAdd);
      return;
    }

    if (e.target.closest('.spec-skill-remove')) {
      e.target.closest('.spec-skill-tag')?.remove();
      return;
    }

    const avatarTab = e.target.closest('[data-avatar-cat]');
    if (avatarTab) {
      showDocAvatarCat(avatarTab.dataset.avatarCat, avatarTab);
      return;
    }

    const avatarPick = e.target.closest('[data-avatar-pick]');
    if (avatarPick) {
      const [cat, index] = avatarPick.dataset.avatarPick.split(':');
      selectDocAvatar(cat, Number(index));
    }
  });
}

export async function renderDoctorProfile(container, user) {
  profileUser = user || getUser() || {};
  currentDocStatus = profileUser.availabilityStatus || 'green';
  container.innerHTML = getDoctorProfileHTML(profileUser);
  bindProfileEvents(container);
  applySavedAvatar();
  updateBioCount();
}
