import { toast } from '../shared/toast.js';
import { formatDoctorName } from '../shared/utils.js';

const CARDIOLOGY_PROCEDURES = [
  'Echocardiography',
  'ECG Interpretation',
  'Cardiac Catheterisation',
  'Coronary Angiography',
  'Pacemaker Implantation',
  'Stress Testing',
  'Holter Monitoring',
  'Cardioversion'
];

const CLINICAL_SKILLS = [
  'Heart Failure Management',
  'Hypertension Control',
  'Arrhythmia Treatment',
  'Lipid Management',
  'Anticoagulation Therapy',
  'Cardiac Rehabilitation',
  'Preventive Cardiology',
  'Valve Disease'
];

const DIGITAL_SKILLS = [
  'Remote Cardiac Monitoring',
  'Digital ECG Review',
  'Telecardiology',
  'Electronic Prescribing'
];

const LANGUAGES = [
  { lang: 'English', level: 'Fluent', pct: 100 },
  { lang: 'Yoruba', level: 'Native', pct: 100 },
  { lang: 'Pidgin English', level: 'Fluent', pct: 90 },
  { lang: 'Igbo', level: 'Basic', pct: 30 }
];

function getInitials(user) {
  const name = (user?.name || 'C').charAt(0);
  const surname = (user?.surname || 'O').charAt(0);
  return `${name}${surname}`.toUpperCase();
}

function skillChips(skills, type) {
  return skills.map((s) => `<span class="skill-chip ${type}">${s}</span>`).join('');
}

function getCredentialsHTML(user) {
  const initials = getInitials(user);
  const displayName = formatDoctorName(user);
  const specialty = user?.specialty || 'Cardiology';
  const hospital = user?.hospitalAffiliation || 'Lagos University Teaching Hospital (LUTH)';
  const state = user?.stateOfPractice || 'Lagos';
  const years = user?.yearsOfExperience || 16;
  const consultations = user?.totalConsultations ?? 2840;
  const rating = user?.rating ?? 4.97;
  const reviews = user?.reviewCount ?? 289;
  const mdcnNumber = user?.mdcnNumber || 'MDN/FMC/2008/04521';
  const fellowship = user?.fellowship || 'Fellow, West African College of Physicians (WACP)';
  const verified = user?.isVerified !== false;

  return `
  <div class="credentials-page">

    <div class="cred-page-header">
      <div>
        <h2>Credentials & Qualifications</h2>
        <p>Your professional medical background and certifications</p>
      </div>
      <button type="button" class="btn-edit-creds" id="btnEditCreds">
        ✏️ Edit Credentials
      </button>
    </div>

    <div class="doctor-identity-card">
      <div class="dic-left">
        <div class="dic-avatar">${initials}</div>
        <div class="dic-info">
          <h3>${displayName}, MBBS, FWACP</h3>
          <div class="dic-specialty">Consultant ${specialty}</div>
          <div class="dic-hospital">${hospital} · ${state}</div>
          <div class="dic-tags">
            <span class="dic-tag verified">${verified ? '✅ MDCN Verified' : '⏳ MDCN Pending'}</span>
            <span class="dic-tag fellowship">🎓 ${fellowship.includes('Fellow') ? 'Fellow, WACP' : fellowship.split('(')[0].trim()}</span>
            <span class="dic-tag experience">📅 ${years} Years Experience</span>
          </div>
        </div>
      </div>
      <div class="dic-right">
        <div class="dic-stat">
          <div class="dic-stat-value">${consultations}</div>
          <div class="dic-stat-label">Consultations</div>
        </div>
        <div class="dic-stat">
          <div class="dic-stat-value">${rating}</div>
          <div class="dic-stat-label">Rating</div>
        </div>
        <div class="dic-stat">
          <div class="dic-stat-value">${reviews}</div>
          <div class="dic-stat-label">Reviews</div>
        </div>
      </div>
    </div>

    <div class="creds-grid">
      <div class="creds-left">

        <div class="cred-card">
          <div class="cred-card-header education">
            <span class="cred-card-icon">🎓</span>
            <h3>Education</h3>
          </div>
          <div class="education-timeline">

            <div class="edu-item">
              <div class="edu-dot completed"></div>
              <div class="edu-connector"></div>
              <div class="edu-content">
                <div class="edu-year-badge">2004 – 2010</div>
                <div class="edu-degree">MBBS — Bachelor of Medicine, Bachelor of Surgery</div>
                <div class="edu-institution">University of Lagos (UNILAG)</div>
                <div class="edu-location">📍 Lagos, Nigeria</div>
                <div class="edu-achievement">🏆 Graduated with Distinction</div>
              </div>
            </div>

            <div class="edu-item">
              <div class="edu-dot completed"></div>
              <div class="edu-connector"></div>
              <div class="edu-content">
                <div class="edu-year-badge">2010 – 2013</div>
                <div class="edu-degree">Residency — Internal Medicine</div>
                <div class="edu-institution">Lagos University Teaching Hospital (LUTH)</div>
                <div class="edu-location">📍 Idi-Araba, Lagos</div>
              </div>
            </div>

            <div class="edu-item">
              <div class="edu-dot completed"></div>
              <div class="edu-connector"></div>
              <div class="edu-content">
                <div class="edu-year-badge">2013 – 2016</div>
                <div class="edu-degree">Fellowship — Cardiology</div>
                <div class="edu-institution">National Cardiothoracic Centre, LUTH</div>
                <div class="edu-location">📍 Lagos, Nigeria</div>
              </div>
            </div>

            <div class="edu-item">
              <div class="edu-dot active"></div>
              <div class="edu-content">
                <div class="edu-year-badge current">2016 – Present</div>
                <div class="edu-degree">Consultant Cardiologist</div>
                <div class="edu-institution">Lagos University Teaching Hospital (LUTH)</div>
                <div class="edu-location">📍 Lagos, Nigeria</div>
                <div class="edu-achievement current">✅ Currently Practising</div>
              </div>
            </div>

          </div>
        </div>

        <div class="cred-card">
          <div class="cred-card-header fellowship">
            <span class="cred-card-icon">🏅</span>
            <h3>Fellowship Details</h3>
          </div>
          <div class="fellowship-list">

            <div class="fellowship-item">
              <div class="fellowship-icon">🎖️</div>
              <div class="fellowship-info">
                <div class="fellowship-title">Fellow, West African College of Physicians</div>
                <div class="fellowship-abbr">FWACP</div>
                <div class="fellowship-meta">Awarded 2016 · Specialty: Internal Medicine & Cardiology</div>
                <div class="fellowship-body">West African College of Physicians (WACP)</div>
              </div>
              <span class="fellowship-badge active">Active</span>
            </div>

            <div class="fellowship-item">
              <div class="fellowship-icon">🎖️</div>
              <div class="fellowship-info">
                <div class="fellowship-title">Member, Nigerian Medical Association</div>
                <div class="fellowship-abbr">NMA</div>
                <div class="fellowship-meta">Member since 2010 · Lagos State Chapter</div>
                <div class="fellowship-body">Nigerian Medical Association (NMA)</div>
              </div>
              <span class="fellowship-badge active">Active</span>
            </div>

            <div class="fellowship-item">
              <div class="fellowship-icon">🎖️</div>
              <div class="fellowship-info">
                <div class="fellowship-title">Member, Nigerian Cardiac Society</div>
                <div class="fellowship-abbr">NCS</div>
                <div class="fellowship-meta">Member since 2016 · Cardiology Division</div>
                <div class="fellowship-body">Nigerian Cardiac Society (NCS)</div>
              </div>
              <span class="fellowship-badge active">Active</span>
            </div>

          </div>
        </div>

        <div class="cred-card">
          <div class="cred-card-header publications">
            <span class="cred-card-icon">📄</span>
            <h3>Publications & Research</h3>
          </div>
          <div class="publications-list">

            <div class="pub-item">
              <div class="pub-number">01</div>
              <div class="pub-content">
                <div class="pub-title">Prevalence of Hypertension Among Urban Nigerians: A LUTH Study (2018–2022)</div>
                <div class="pub-journal">📖 Nigerian Journal of Cardiology · 2023</div>
                <div class="pub-meta">
                  <span class="pub-citations">🔗 42 citations</span>
                  <span class="pub-type">Peer Reviewed</span>
                </div>
              </div>
            </div>

            <div class="pub-item">
              <div class="pub-number">02</div>
              <div class="pub-content">
                <div class="pub-title">Telemedicine in Cardiology: Patient Outcomes in Sub-Saharan Africa</div>
                <div class="pub-journal">📖 African Heart Journal · 2022</div>
                <div class="pub-meta">
                  <span class="pub-citations">🔗 28 citations</span>
                  <span class="pub-type">Peer Reviewed</span>
                </div>
              </div>
            </div>

            <div class="pub-item">
              <div class="pub-number">03</div>
              <div class="pub-content">
                <div class="pub-title">Heart Failure Management in Resource-Limited Settings: Nigerian Experience</div>
                <div class="pub-journal">📖 Journal of the American College of Cardiology · 2021</div>
                <div class="pub-meta">
                  <span class="pub-citations">🔗 61 citations</span>
                  <span class="pub-type">Peer Reviewed</span>
                </div>
              </div>
            </div>

            <div class="pub-item">
              <div class="pub-number">04</div>
              <div class="pub-content">
                <div class="pub-title">Sickle Cell Disease and Cardiac Complications: A 5-Year Review</div>
                <div class="pub-journal">📖 West African Journal of Medicine · 2020</div>
                <div class="pub-meta">
                  <span class="pub-citations">🔗 19 citations</span>
                  <span class="pub-type">Peer Reviewed</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      <div class="creds-right">

        <div class="cred-card">
          <div class="cred-card-header certifications">
            <span class="cred-card-icon">📋</span>
            <h3>Board Certifications</h3>
          </div>
          <div class="certifications-list">

            <div class="cert-item">
              <div class="cert-left">
                <div class="cert-logo mdcn">MDCN</div>
                <div class="cert-info">
                  <div class="cert-name">Medical & Dental Council of Nigeria</div>
                  <div class="cert-number">Reg No: ${mdcnNumber}</div>
                  <div class="cert-date">Registered: ${user?.mdcnRegistrationYear || 2008} · Renewed: 2024</div>
                </div>
              </div>
              <div class="cert-right">
                <span class="cert-status ${verified ? 'verified' : 'expired'}">${verified ? '✅ Verified' : '⏳ Pending'}</span>
                <a href="https://www.mdcn.gov.ng" target="_blank" rel="noopener noreferrer" class="cert-verify-link">Verify →</a>
              </div>
            </div>

            <div class="cert-item">
              <div class="cert-left">
                <div class="cert-logo wacp">WACP</div>
                <div class="cert-info">
                  <div class="cert-name">West African College of Physicians</div>
                  <div class="cert-number">Fellowship No: FWACP/CARD/2016/0892</div>
                  <div class="cert-date">Awarded: 2016 · Status: Active</div>
                </div>
              </div>
              <div class="cert-right">
                <span class="cert-status active">✅ Active</span>
              </div>
            </div>

            <div class="cert-item">
              <div class="cert-left">
                <div class="cert-logo npmcn">NPMCN</div>
                <div class="cert-info">
                  <div class="cert-name">Nat. Postgraduate Medical College Nigeria</div>
                  <div class="cert-number">Certificate No: NPMCN/INT/2013/1245</div>
                  <div class="cert-date">Completed: 2013 · Internal Medicine</div>
                </div>
              </div>
              <div class="cert-right">
                <span class="cert-status active">✅ Active</span>
              </div>
            </div>

            <div class="cert-item">
              <div class="cert-left">
                <div class="cert-logo acls">ACLS</div>
                <div class="cert-info">
                  <div class="cert-name">Advanced Cardiac Life Support</div>
                  <div class="cert-number">AHA Certified</div>
                  <div class="cert-date">Renewed: 2024 · Expires: 2026</div>
                </div>
              </div>
              <div class="cert-right">
                <span class="cert-status active">✅ Active</span>
              </div>
            </div>

            <div class="cert-item">
              <div class="cert-left">
                <div class="cert-logo nma">NMA</div>
                <div class="cert-info">
                  <div class="cert-name">Nigerian Medical Association</div>
                  <div class="cert-number">Membership No: NMA/LAG/2010/4521</div>
                  <div class="cert-date">Member since 2010 · Annual Renewal</div>
                </div>
              </div>
              <div class="cert-right">
                <span class="cert-status active">✅ Active</span>
              </div>
            </div>

          </div>
        </div>

        <div class="cred-card">
          <div class="cred-card-header skills">
            <span class="cred-card-icon">🔬</span>
            <h3>Skills & Procedures</h3>
          </div>

          <div class="skills-category">
            <div class="skills-cat-label">❤️ Cardiology Procedures</div>
            <div class="skills-grid">${skillChips(CARDIOLOGY_PROCEDURES, 'expert')}</div>
          </div>

          <div class="skills-category">
            <div class="skills-cat-label">🩺 Clinical Management</div>
            <div class="skills-grid">${skillChips(CLINICAL_SKILLS, 'proficient')}</div>
          </div>

          <div class="skills-category">
            <div class="skills-cat-label">💻 Telemedicine & Technology</div>
            <div class="skills-grid">${skillChips(DIGITAL_SKILLS, 'digital')}</div>
          </div>

          <div class="skills-legend">
            <span class="legend-item">
              <span class="skill-chip expert" style="font-size:10px;padding:2px 8px">Expert</span>
            </span>
            <span class="legend-item">
              <span class="skill-chip proficient" style="font-size:10px;padding:2px 8px">Proficient</span>
            </span>
            <span class="legend-item">
              <span class="skill-chip digital" style="font-size:10px;padding:2px 8px">Digital</span>
            </span>
          </div>
        </div>

        <div class="cred-card">
          <div class="cred-card-header languages">
            <span class="cred-card-icon">🌍</span>
            <h3>Languages</h3>
          </div>
          <div class="languages-list">
            ${LANGUAGES.map((l) => `
              <div class="language-item">
                <div class="lang-info">
                  <span class="lang-name">${l.lang}</span>
                  <span class="lang-level">${l.level}</span>
                </div>
                <div class="lang-bar">
                  <div class="lang-fill" style="width:${l.pct}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    </div>

  </div>`;
}

function editCredentials() {
  toast(
    'Credential editing coming soon. Contact support to update your credentials.',
    'info'
  );
}

function bindCredentialEvents(root) {
  root.querySelector('#btnEditCreds')?.addEventListener('click', editCredentials);
}

export async function renderDoctorCredentials(container, user) {
  container.innerHTML = getCredentialsHTML(user || {});
  bindCredentialEvents(container);
}
