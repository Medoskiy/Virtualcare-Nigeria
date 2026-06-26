import { doctorsApi } from '../shared/api.js';
import { formatDate, escapeHtml } from '../shared/utils.js';
import { toast } from '../shared/toast.js';

export const DEMO_PATIENTS = [
  { id: '1', name: 'Amaka', surname: 'Obi', email: 'patient@virtualcare.com', condition: 'Hypertension', lastVisit: 'Wednesday, 24 June 2026', risk: 'Low', phone: '08031112222', state: 'Lagos' },
  { id: '2', name: 'Emeka', surname: 'Nwosu', email: 'emeka.nwosu@gmail.com', condition: 'Atrial Fibrillation', lastVisit: 'Monday, 22 June 2026', risk: 'High', phone: '08055678901', state: 'Lagos' },
  { id: '3', name: 'Fatima', surname: 'Aliyu', email: 'fatima.aliyu@yahoo.com', condition: 'High Blood Pressure', lastVisit: 'Friday, 19 June 2026', risk: 'Medium', phone: '07061234567', state: 'Abuja' },
  { id: '4', name: 'Chukwudi', surname: 'Eze', email: 'chukwudi.eze@gmail.com', condition: 'Cardiac Arrhythmia', lastVisit: 'Wednesday, 17 June 2026', risk: 'High', phone: '09091234567', state: 'Enugu' },
  { id: '5', name: 'Ngozi', surname: 'Adeleke', email: 'ngozi.adeleke@hotmail.com', condition: 'Post-surgery Review', lastVisit: 'Monday, 15 June 2026', risk: 'Medium', phone: '08121234567', state: 'Ibadan' },
  { id: '6', name: 'Biodun', surname: 'Fashola', email: 'biodun.fashola@gmail.com', condition: 'Heart Failure Management', lastVisit: 'Thursday, 12 June 2026', risk: 'High', phone: '08071234567', state: 'Lagos' },
  { id: '7', name: 'Kemi', surname: 'Adeyemi', email: 'kemi.adeyemi@gmail.com', condition: 'Cholesterol Management', lastVisit: 'Tuesday, 10 June 2026', risk: 'Low', phone: '08091234567', state: 'Port Harcourt' }
];

const RISK_COLORS = {
  Low: 'background:#dcfce7;color:#166534',
  Medium: 'background:#fef3c7;color:#92400e',
  High: 'background:#fee2e2;color:#991b1b'
};

let allPatientsList = [];

function normalizePatient(p, index) {
  const risks = ['Low', 'Medium', 'High'];
  return {
    id: p._id || p.id || String(index),
    name: p.name || '',
    surname: p.surname || '',
    email: p.email || '',
    condition: p.condition || p.medicalHistoryNotes || 'General consultation',
    lastVisit: p.lastVisit ? formatDate(p.lastVisit) : (p.lastVisit === undefined ? '—' : p.lastVisit),
    risk: p.risk || risks[index % 3],
    phone: p.phone || p.mobileNo || '',
    state: p.state || 'Nigeria'
  };
}

function mergePatients(apiPatients) {
  const normalized = apiPatients.map((p, i) => normalizePatient(p, i));
  const seen = new Set(normalized.map((p) => p.email.toLowerCase()).filter(Boolean));
  const merged = [...normalized];
  for (const demo of DEMO_PATIENTS) {
    if (!seen.has(demo.email.toLowerCase())) {
      merged.push(demo);
      seen.add(demo.email.toLowerCase());
    }
  }
  return merged.length ? merged : [...DEMO_PATIENTS];
}

export function renderPatientRows(patients) {
  const tbody = document.getElementById('patientTableBody');
  if (!tbody) return;

  if (!patients.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:40px;color:var(--muted)">
          <div style="font-size:32px;margin-bottom:10px">🔍</div>
          <div style="font-weight:700;margin-bottom:4px">No patients found</div>
          <div style="font-size:13px">Try a different name or email address</div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = patients.map((p) => {
    const initials = `${(p.name || '')[0] || ''}${(p.surname || '')[0] || ''}`.toUpperCase();
    return `<tr class="patient-row">
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="patient-avatar-sm">${initials}</div>
          <div>
            <div style="font-weight:700;font-size:14px">${escapeHtml(p.name)} ${escapeHtml(p.surname)}</div>
            <div style="font-size:12px;color:var(--muted)">${escapeHtml(p.state || 'Nigeria')}</div>
          </div>
        </div>
      </td>
      <td style="font-size:13px;color:var(--muted)">${escapeHtml(p.email)}</td>
      <td style="font-size:13.5px">${escapeHtml(p.condition)}</td>
      <td style="font-size:13px;color:var(--muted)">${escapeHtml(p.lastVisit)}</td>
      <td>
        <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:10px;${RISK_COLORS[p.risk] || RISK_COLORS.Low}">${p.risk}</span>
      </td>
      <td>
        <button type="button" class="btn-view-patient" data-patient-id="${escapeHtml(p.id)}">View</button>
      </td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('.btn-view-patient').forEach((btn) => {
    btn.addEventListener('click', () => {
      const patient = allPatientsList.find((p) => p.id === btn.dataset.patientId);
      toast(patient ? `Viewing ${patient.name} ${patient.surname}` : 'Patient details', 'info');
    });
  });
}

function filterPatients() {
  const nameQuery = (document.getElementById('patientSearchInput')?.value || '').toLowerCase().trim();
  const emailQuery = (document.getElementById('patientEmailSearch')?.value || '').toLowerCase().trim();

  let filtered = allPatientsList;

  if (nameQuery) {
    filtered = filtered.filter((p) => `${p.name} ${p.surname}`.toLowerCase().includes(nameQuery));
  }
  if (emailQuery) {
    filtered = filtered.filter((p) => (p.email || '').toLowerCase().includes(emailQuery));
  }

  const countEl = document.getElementById('searchResultsCount');
  if (countEl) {
    if (nameQuery || emailQuery) {
      countEl.textContent = `Found ${filtered.length} patient${filtered.length !== 1 ? 's' : ''}`;
      countEl.style.color = filtered.length === 0 ? 'var(--red)' : 'var(--green)';
    } else {
      countEl.textContent = `Showing all ${filtered.length} patients`;
      countEl.style.color = 'var(--muted)';
    }
  }

  renderPatientRows(filtered);
}

function clearPatientSearch() {
  const nameInput = document.getElementById('patientSearchInput');
  const emailInput = document.getElementById('patientEmailSearch');
  if (nameInput) nameInput.value = '';
  if (emailInput) emailInput.value = '';
  filterPatients();
}

export async function renderPatients(el) {
  let apiPatients = [];
  try {
    apiPatients = (await doctorsApi.patients()).data.patients || [];
  } catch { /* use demo */ }

  allPatientsList = mergePatients(apiPatients);

  el.innerHTML = `
    <div class="patients-page-header">
      <div>
        <h2>My Patients</h2>
        <p>Manage and search your patient records</p>
      </div>
    </div>

    <div class="patients-search-bar">
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input type="text" id="patientSearchInput" placeholder="Search by patient name..." class="patient-search-input">
      </div>
      <div class="search-input-wrap">
        <span class="search-icon">📧</span>
        <input type="text" id="patientEmailSearch" placeholder="Search by email address..." class="patient-search-input">
      </div>
      <button type="button" class="btn-clear-search" id="btn-clear-patient-search">✕ Clear</button>
    </div>

    <div class="search-results-count" id="searchResultsCount">Showing all ${allPatientsList.length} patients</div>

    <div class="table-wrap patients-table-wrap">
      <table class="patients-table">
        <thead>
          <tr><th>Patient</th><th>Email</th><th>Condition</th><th>Last Visit</th><th>Risk</th><th></th></tr>
        </thead>
        <tbody id="patientTableBody"></tbody>
      </table>
    </div>
  `;

  el.querySelector('#patientSearchInput')?.addEventListener('input', filterPatients);
  el.querySelector('#patientEmailSearch')?.addEventListener('input', filterPatients);
  el.querySelector('#btn-clear-patient-search')?.addEventListener('click', clearPatientSearch);

  renderPatientRows(allPatientsList);
}
