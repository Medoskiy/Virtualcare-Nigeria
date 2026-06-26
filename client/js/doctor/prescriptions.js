import { getUser, getToken, prescriptionsApi } from '../shared/api.js';
import { escapeHtml, formatDoctorName } from '../shared/utils.js';
import { toast } from '../shared/toast.js';

const COMMON_NIGERIAN_DRUGS = [
  'Amoxicillin', 'Artemether-Lumefantrine (Coartem)', 'Aspirin', 'Atenolol', 'Azithromycin',
  'Chloroquine', 'Ciprofloxacin', 'Co-trimoxazole', 'Diclofenac', 'Doxycycline', 'Erythromycin',
  'Fluconazole', 'Folic Acid', 'Furosemide', 'Haematinics', 'Ibuprofen', 'Lisinopril',
  'Losartan', 'Metformin', 'Metronidazole (Flagyl)', 'Metronidazole 400mg', 'Nifedipine', 'Omeprazole',
  'Paracetamol', 'Prednisolone', 'Quinine', 'Ramipril', 'Salbutamol Inhaler', 'Tramadol',
  'Vitamin C', 'Zinc Supplement'
];

const DOSAGE_OPTIONS = [
  '50mg', '100mg', '200mg', '250mg', '400mg', '500mg', '1g', '2.5mg', '5mg', '10mg', '20mg',
  '40mg', '1 tablet', '2 tablets', '5ml', '10ml', '1 sachet', '1 capsule', '2 capsules', '1 puff', '2 puffs'
];

const FREQUENCY_OPTIONS = [
  'Once daily (OD)', 'Twice daily (BD)', 'Three times daily (TDS)', 'Four times daily (QDS)',
  'Every 4 hours', 'Every 6 hours', 'Every 8 hours', 'Every 12 hours', 'At night (Nocte)',
  'In the morning (Mane)', 'With meals', 'Before meals', 'After meals', 'As needed (PRN)',
  'Immediately (Stat)', 'Weekly', 'Monthly'
];

const DURATION_OPTIONS = [
  '1 day', '2 days', '3 days', '5 days', '7 days', '10 days', '14 days', '21 days', '1 month',
  '2 months', '3 months', '6 months', 'Ongoing (chronic)', 'Until review', 'Complete the course'
];

const REFILL_OPTIONS = [
  '0 (No refills)', '1 refill', '2 refills', '3 refills', '6 refills (6 months)', '11 refills (1 year)'
];

const RX_PATIENTS = [
  { id: 'p1', name: 'Amaka Obi', patientId: 'P-FEB83', dob: '15 March 1990', phone: '08031112222', state: 'Lagos' },
  { id: 'p2', name: 'Emeka Nwosu', patientId: 'P-AB124', dob: '22 June 1985', phone: '08055678901', state: 'Lagos' },
  { id: 'p3', name: 'Fatima Aliyu', patientId: 'P-CD456', dob: '8 January 1992', phone: '07061234567', state: 'Abuja' },
  { id: 'p4', name: 'Chukwudi Eze', patientId: 'P-EF789', dob: '3 November 1978', phone: '09091234567', state: 'Enugu' },
  { id: 'p5', name: 'Ngozi Adeleke', patientId: 'P-GH012', dob: '14 July 1995', phone: '08121234567', state: 'Ibadan' }
];

const DEMO_ISSUED = [
  { id: 'rx001', patient: 'Amaka Obi', patientId: 'P-FEB83', medications: ['Ramipril 5mg', 'Aspirin 75mg'], date: 'Wednesday, 24 June 2026', status: 'active', refills: 2 },
  { id: 'rx002', patient: 'Emeka Nwosu', patientId: 'P-AB124', medications: ['Warfarin 5mg'], date: 'Monday, 22 June 2026', status: 'active', refills: 5 },
  { id: 'rx003', patient: 'Fatima Aliyu', patientId: 'P-CD456', medications: ['Amlodipine 5mg', 'Lisinopril 10mg'], date: 'Friday, 19 June 2026', status: 'expired', refills: 0 }
];

let medicationCount = 0;
let isDrawing = false;
let signatureCanvas = null;
let signatureCtx = null;
let lastX = 0;
let lastY = 0;
let hasSignature = false;
let canvasListenersBound = false;
let doctorProfile = null;

function getPrescriptionsHTML() {
  const doctor = doctorProfile || getUser() || {};
  const doctorName = formatDoctorName(doctor);
  const specialty = doctor.specialty || 'General Practice';
  const mdcn = doctor.mdcnNumber || 'MDN/LUTH/2008/04521';
  const hospital = doctor.hospitalAffiliation || 'Lagos University Teaching Hospital';

  return `
    <div class="rx-page">
      <div class="rx-page-header">
        <div>
          <h2>Prescriptions</h2>
          <p>Write, manage and send prescriptions to your patients</p>
        </div>
        <button type="button" class="btn-write-rx" id="btnWriteRx">✏️ Write New Prescription</button>
      </div>

      <div class="rx-form-panel hidden" id="rxFormPanel">
        <div class="rx-form-header">
          <div class="rx-form-title">
            <span class="rx-symbol">℞</span>
            <div>
              <h3>New Prescription</h3>
              <p>Virtualcare Nigeria · MDCN-Certified Platform</p>
            </div>
          </div>
          <button type="button" class="rx-form-close" id="rxFormClose">×</button>
        </div>

        <div class="rx-info-row">
          <div class="rx-info-card rx-doctor-card">
            <div class="rx-info-label">👨‍⚕️ Prescribing Doctor</div>
            <div class="rx-info-name" id="rxDoctorName">${escapeHtml(doctorName)}</div>
            <div class="rx-info-detail" id="rxDoctorSpecialty">${escapeHtml(specialty)}</div>
            <div class="rx-info-detail" id="rxDoctorMDCN">MDCN: ${escapeHtml(mdcn)}</div>
            <div class="rx-info-detail" id="rxDoctorHospital">${escapeHtml(hospital)}</div>
          </div>

          <div class="rx-info-card rx-patient-card">
            <div class="rx-info-label">👤 Patient Details</div>
            <div class="rx-patient-selector" id="rxPatientSelector">
              <select id="rxPatientSelect" class="rx-select">
                <option value="">Select a patient...</option>
                ${RX_PATIENTS.map((p) => `
                  <option value="${escapeHtml(p.id)}"
                    data-name="${escapeHtml(p.name)}"
                    data-patient-id="${escapeHtml(p.patientId)}"
                    data-dob="${escapeHtml(p.dob)}"
                    data-phone="${escapeHtml(p.phone)}"
                    data-state="${escapeHtml(p.state)}">
                    ${escapeHtml(p.name)} — #${escapeHtml(p.patientId)}
                  </option>`).join('')}
              </select>
            </div>
            <div class="rx-patient-details hidden" id="rxPatientDetails">
              <div class="rx-patient-id-badge" id="rxPatientIdBadge">🪪 Patient ID: #—</div>
              <div class="rx-info-name" id="rxPatientName">—</div>
              <div class="rx-info-detail" id="rxPatientDOB">DOB: —</div>
              <div class="rx-info-detail" id="rxPatientPhone">📱 —</div>
              <div class="rx-info-detail" id="rxPatientState">📍 —</div>
              <button type="button" class="btn-change-patient" id="btnChangeRxPatient">Change Patient</button>
            </div>
          </div>

          <div class="rx-info-card rx-date-card">
            <div class="rx-info-label">📋 Prescription Info</div>
            <div class="rx-date-field">
              <label>Date Issued</label>
              <div class="rx-date-value" id="rxDateValue">—</div>
            </div>
            <div class="rx-date-field">
              <label>Rx Reference</label>
              <div class="rx-ref-value" id="rxRefValue">—</div>
            </div>
            <div class="rx-date-field">
              <label>Valid Until</label>
              <div class="rx-date-value" id="rxValidUntil">—</div>
            </div>
          </div>
        </div>

        <div class="rx-medications-section">
          <div class="rx-section-header">
            <h4>💊 Medications</h4>
            <button type="button" class="btn-add-medication" id="btnAddMedication">+ Add Medication</button>
          </div>
          <div id="medicationsList"></div>
        </div>

        <div class="rx-notes-section">
          <h4>📝 Clinical Notes & Instructions</h4>
          <textarea id="rxNotes" class="rx-notes-input" rows="4"
            placeholder="Add any additional instructions, warnings, or notes for the patient (e.g. Take with food, Avoid alcohol, Return if symptoms persist)..."></textarea>
        </div>

        <div class="rx-signature-section">
          <h4>✍️ Doctor Signature</h4>
          <div class="rx-signature-area">
            <div class="rx-signature-tabs">
              <button type="button" class="rx-sig-tab active" data-sig-tab="draw">✏️ Draw Signature</button>
              <button type="button" class="rx-sig-tab" data-sig-tab="type">⌨️ Type Signature</button>
            </div>
            <div id="sigDrawPanel">
              <canvas id="signatureCanvas" class="signature-canvas" width="500" height="120"></canvas>
              <div class="sig-canvas-actions">
                <button type="button" class="btn-sig-clear" id="btnClearSignature">🗑️ Clear</button>
                <span class="sig-hint">Draw your signature above with your mouse or finger</span>
              </div>
            </div>
            <div id="sigTypePanel" class="hidden">
              <input type="text" id="typedSignature" class="rx-typed-sig-input"
                placeholder="Type your full name as signature..." value="${escapeHtml(doctorName)}">
              <div class="typed-sig-preview" id="typedSigPreview">${escapeHtml(doctorName)}</div>
            </div>
            <div class="rx-sig-info">
              <div class="rx-sig-details">
                <div class="sig-detail-line" id="sigDoctorLine">${escapeHtml(doctorName)}</div>
                <div class="sig-detail-line muted">${escapeHtml(specialty)} · MDCN Verified</div>
                <div class="sig-detail-line muted" id="sigDateLine">—</div>
              </div>
              <div class="rx-stamp">
                <div class="stamp-inner">
                  <div class="stamp-text">VIRTUALCARE</div>
                  <div class="stamp-sub">VERIFIED</div>
                  <div class="stamp-icon">✅</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="rx-form-actions">
          <button type="button" class="btn-rx-preview" id="btnRxPreview">👁️ Preview</button>
          <button type="button" class="btn-rx-draft" id="btnRxDraft">💾 Save Draft</button>
          <button type="button" class="btn-rx-send" id="btnRxSend">📤 Send to Patient</button>
          <button type="button" class="btn-rx-download" id="btnRxDownload">📄 Send & Download PDF</button>
        </div>
      </div>

      <div class="rx-issued-section" id="rxIssuedSection">
        <h3>Issued Prescriptions</h3>
        <div id="rxIssuedList"></div>
      </div>
    </div>

    <div id="rxPreviewModal" class="rx-preview-overlay hidden">
      <div class="rx-preview-box">
        <div class="rx-preview-header">
          <h3>℞ Prescription Preview</h3>
          <button type="button" class="modal-close-btn" id="btnCloseRxPreview">×</button>
        </div>
        <div id="rxPreviewContent" class="rx-preview-content"></div>
        <div class="rx-preview-actions">
          <button type="button" class="btn-rx-send" id="btnPreviewSend">📤 Send to Patient</button>
        </div>
      </div>
    </div>
  `;
}

function addMedication() {
  medicationCount += 1;
  const id = medicationCount;
  const list = document.getElementById('medicationsList');
  if (!list) return;

  const row = document.createElement('div');
  row.className = 'medication-row';
  row.id = `med-${id}`;
  row.innerHTML = `
    <div class="med-row-header">
      <div class="med-number"><span>💊</span> Medication ${id}</div>
      ${id > 1 ? `<button type="button" class="btn-remove-med" data-remove-med="${id}">🗑️ Remove</button>` : ''}
    </div>
    <div class="med-field-group">
      <div class="med-field med-drug-field">
        <label class="med-label">Drug Name <span class="required">*</span></label>
        <div class="drug-input-wrap">
          <input type="text" id="drugName-${id}" class="med-input drug-name-input"
            placeholder="Type drug name..." autocomplete="off" data-drug-id="${id}">
          <div class="drug-suggestions" id="drugSuggestions-${id}"></div>
        </div>
      </div>
    </div>
    <div class="med-details-row">
      <div class="med-field">
        <label class="med-label">Dosage <span class="required">*</span></label>
        <div class="med-select-wrap">
          <select id="dosage-${id}" class="med-select">
            <option value="">Select dosage...</option>
            ${DOSAGE_OPTIONS.map((d) => `<option value="${d}">${d}</option>`).join('')}
          </select>
          <input type="text" id="dosageCustom-${id}" class="med-input med-custom-input" placeholder="Or type custom dosage...">
        </div>
      </div>
      <div class="med-field">
        <label class="med-label">Frequency <span class="required">*</span></label>
        <select id="frequency-${id}" class="med-select">
          <option value="">Select frequency...</option>
          ${FREQUENCY_OPTIONS.map((f) => `<option value="${f}">${f}</option>`).join('')}
        </select>
      </div>
      <div class="med-field">
        <label class="med-label">Duration <span class="required">*</span></label>
        <div class="duration-wrap">
          <select id="duration-${id}" class="med-select" data-duration-id="${id}">
            <option value="">Select duration...</option>
            ${DURATION_OPTIONS.map((d) => `<option value="${d}">${d}</option>`).join('')}
            <option value="custom">Custom...</option>
          </select>
          <input type="text" id="durationCustom-${id}" class="med-input med-custom-input hidden" placeholder="e.g. 10 days">
        </div>
      </div>
      <div class="med-field">
        <label class="med-label">Refills</label>
        <select id="refills-${id}" class="med-select">
          ${REFILL_OPTIONS.map((r) => `<option value="${r}">${r}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="med-field med-instructions-field">
      <label class="med-label">Special Instructions (optional)</label>
      <input type="text" id="medInstructions-${id}" class="med-input"
        placeholder="e.g. Take with food, Avoid alcohol, Store in cool dry place...">
    </div>`;

  list.appendChild(row);
  row.querySelector('[data-remove-med]')?.addEventListener('click', () => removeMedication(id));
  row.querySelector(`#duration-${id}`)?.addEventListener('change', (e) => checkCustomDuration(id, e.target.value));
  row.querySelector(`#drugName-${id}`)?.addEventListener('input', () => showDrugSuggestions(id));
  row.querySelector(`#drugName-${id}`)?.addEventListener('blur', () => hideDrugSuggestions(id));
}

function removeMedication(id) {
  document.getElementById(`med-${id}`)?.remove();
}

function showDrugSuggestions(id) {
  const input = document.getElementById(`drugName-${id}`);
  const suggestions = document.getElementById(`drugSuggestions-${id}`);
  if (!input || !suggestions) return;

  const query = input.value.toLowerCase().trim();
  if (query.length < 1) {
    suggestions.style.display = 'none';
    return;
  }

  const matches = COMMON_NIGERIAN_DRUGS.filter((d) => d.toLowerCase().includes(query)).slice(0, 6);
  if (!matches.length) {
    suggestions.style.display = 'none';
    return;
  }

  suggestions.innerHTML = matches.map((drug) => `
    <div class="drug-suggestion-item" data-drug-id="${id}" data-drug-name="${escapeHtml(drug)}">💊 ${escapeHtml(drug)}</div>
  `).join('');
  suggestions.style.display = 'block';
  suggestions.querySelectorAll('.drug-suggestion-item').forEach((item) => {
    item.addEventListener('mousedown', (e) => {
      e.preventDefault();
      selectDrug(id, item.dataset.drugName);
    });
  });
}

function hideDrugSuggestions(id) {
  setTimeout(() => {
    const suggestions = document.getElementById(`drugSuggestions-${id}`);
    if (suggestions) suggestions.style.display = 'none';
  }, 200);
}

function selectDrug(id, drugName) {
  const input = document.getElementById(`drugName-${id}`);
  if (input) input.value = drugName;
  hideDrugSuggestions(id);
}

function checkCustomDuration(id, value) {
  const custom = document.getElementById(`durationCustom-${id}`);
  if (!custom) return;
  if (value === 'custom') {
    custom.classList.remove('hidden');
    custom.style.display = 'block';
    custom.focus();
  } else {
    custom.classList.add('hidden');
    custom.style.display = 'none';
  }
}

function autoFillPatient() {
  const select = document.getElementById('rxPatientSelect');
  const selected = select?.options[select.selectedIndex];
  if (!selected?.value) return;

  document.getElementById('rxPatientIdBadge').textContent = `🪪 Patient ID: #${selected.dataset.patientId}`;
  document.getElementById('rxPatientName').textContent = selected.dataset.name;
  document.getElementById('rxPatientDOB').textContent = `DOB: ${selected.dataset.dob}`;
  document.getElementById('rxPatientPhone').textContent = `📱 ${selected.dataset.phone}`;
  document.getElementById('rxPatientState').textContent = `📍 ${selected.dataset.state} State`;

  document.getElementById('rxPatientSelector').classList.add('hidden');
  document.getElementById('rxPatientSelector').style.display = 'none';
  const details = document.getElementById('rxPatientDetails');
  details.classList.remove('hidden');
  details.style.display = 'block';
}

function changeRxPatient() {
  document.getElementById('rxPatientSelector').classList.remove('hidden');
  document.getElementById('rxPatientSelector').style.display = 'block';
  const details = document.getElementById('rxPatientDetails');
  details.classList.add('hidden');
  details.style.display = 'none';
  document.getElementById('rxPatientSelect').value = '';
}

function fillRxDates() {
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-NG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos'
  });
  const validUntil = new Date(today);
  validUntil.setDate(validUntil.getDate() + 30);
  const validStr = validUntil.toLocaleDateString('en-NG', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos'
  });
  const rxRef = `RX-${Date.now().toString().slice(-8).toUpperCase()}`;

  const dateEl = document.getElementById('rxDateValue');
  const refEl = document.getElementById('rxRefValue');
  const validEl = document.getElementById('rxValidUntil');
  const sigDate = document.getElementById('sigDateLine');
  if (dateEl) dateEl.textContent = todayStr;
  if (refEl) refEl.textContent = rxRef;
  if (validEl) validEl.textContent = validStr;
  if (sigDate) sigDate.textContent = todayStr;
}

function showWritePrescription() {
  const panel = document.getElementById('rxFormPanel');
  if (!panel) return;

  panel.classList.remove('hidden');
  panel.style.display = 'block';
  fillRxDates();

  medicationCount = 0;
  const list = document.getElementById('medicationsList');
  if (list) list.innerHTML = '';
  addMedication();

  hasSignature = false;
  const typed = document.getElementById('typedSignature');
  if (typed?.value.trim()) hasSignature = true;

  setTimeout(() => initSignatureCanvas(), 100);
  panel.scrollIntoView({ behavior: 'smooth' });

  const btn = document.getElementById('btnWriteRx');
  if (btn) {
    btn.textContent = '✕ Cancel';
    btn.dataset.mode = 'cancel';
  }
}

function hideWritePrescription() {
  const panel = document.getElementById('rxFormPanel');
  if (panel) {
    panel.classList.add('hidden');
    panel.style.display = 'none';
  }
  const btn = document.getElementById('btnWriteRx');
  if (btn) {
    btn.textContent = '✏️ Write New Prescription';
    btn.dataset.mode = 'write';
  }
}

function toggleWritePrescription() {
  const btn = document.getElementById('btnWriteRx');
  if (btn?.dataset.mode === 'cancel') hideWritePrescription();
  else showWritePrescription();
}

function initSignatureCanvas() {
  signatureCanvas = document.getElementById('signatureCanvas');
  if (!signatureCanvas) return;

  signatureCtx = signatureCanvas.getContext('2d');
  signatureCtx.strokeStyle = '#0a2463';
  signatureCtx.lineWidth = 2.5;
  signatureCtx.lineCap = 'round';
  signatureCtx.lineJoin = 'round';

  if (canvasListenersBound) return;
  canvasListenersBound = true;

  signatureCanvas.addEventListener('mousedown', startDraw);
  signatureCanvas.addEventListener('mousemove', draw);
  signatureCanvas.addEventListener('mouseup', endDraw);
  signatureCanvas.addEventListener('mouseleave', endDraw);

  signatureCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = signatureCanvas.getBoundingClientRect();
    startDraw({ offsetX: touch.clientX - rect.left, offsetY: touch.clientY - rect.top });
  }, { passive: false });

  signatureCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = signatureCanvas.getBoundingClientRect();
    draw({ offsetX: touch.clientX - rect.left, offsetY: touch.clientY - rect.top });
  }, { passive: false });

  signatureCanvas.addEventListener('touchend', endDraw);
}

function startDraw(e) {
  isDrawing = true;
  lastX = e.offsetX;
  lastY = e.offsetY;
}

function draw(e) {
  if (!isDrawing || !signatureCtx) return;
  signatureCtx.beginPath();
  signatureCtx.moveTo(lastX, lastY);
  signatureCtx.lineTo(e.offsetX, e.offsetY);
  signatureCtx.stroke();
  lastX = e.offsetX;
  lastY = e.offsetY;
  hasSignature = true;
}

function endDraw() {
  isDrawing = false;
}

function clearSignature() {
  if (!signatureCtx || !signatureCanvas) return;
  signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
  hasSignature = false;
}

function showSigTab(tab, btn) {
  document.querySelectorAll('.rx-sig-tab').forEach((t) => t.classList.remove('active'));
  btn.classList.add('active');

  const drawPanel = document.getElementById('sigDrawPanel');
  const typePanel = document.getElementById('sigTypePanel');

  if (tab === 'draw') {
    drawPanel?.classList.remove('hidden');
    if (drawPanel) drawPanel.style.display = 'block';
    typePanel?.classList.add('hidden');
    if (typePanel) typePanel.style.display = 'none';
    setTimeout(() => initSignatureCanvas(), 100);
  } else {
    drawPanel?.classList.add('hidden');
    if (drawPanel) drawPanel.style.display = 'none';
    typePanel?.classList.remove('hidden');
    if (typePanel) typePanel.style.display = 'block';
    updateTypedSig();
  }
}

function updateTypedSig() {
  const input = document.getElementById('typedSignature');
  const preview = document.getElementById('typedSigPreview');
  const doctorName = formatDoctorName(doctorProfile || getUser());
  if (preview) preview.textContent = input?.value?.trim() || doctorName;
  hasSignature = Boolean(input?.value?.trim());
}

function isPatientSelected() {
  const details = document.getElementById('rxPatientDetails');
  return details && !details.classList.contains('hidden') && details.style.display !== 'none';
}

function collectMedications() {
  const medications = [];
  for (let i = 1; i <= medicationCount; i++) {
    const medEl = document.getElementById(`med-${i}`);
    if (!medEl) continue;

    const name = document.getElementById(`drugName-${i}`)?.value?.trim();
    const dosageSelect = document.getElementById(`dosage-${i}`)?.value;
    const dosageCustom = document.getElementById(`dosageCustom-${i}`)?.value?.trim();
    const dosage = dosageCustom || dosageSelect;
    const frequency = document.getElementById(`frequency-${i}`)?.value;
    const durationSelect = document.getElementById(`duration-${i}`)?.value;
    const durationCustom = document.getElementById(`durationCustom-${i}`)?.value?.trim();
    const duration = durationCustom || (durationSelect === 'custom' ? '' : durationSelect);
    const refills = document.getElementById(`refills-${i}`)?.value || '0 (No refills)';
    const instructions = document.getElementById(`medInstructions-${i}`)?.value?.trim();

    if (!name) {
      toast(`Please enter drug name for Medication ${i}`, 'warning');
      return null;
    }
    if (!dosage) {
      toast(`Please select dosage for ${name}`, 'warning');
      return null;
    }
    if (!frequency) {
      toast(`Please select frequency for ${name}`, 'warning');
      return null;
    }
    if (!duration) {
      toast(`Please select duration for ${name}`, 'warning');
      return null;
    }

    medications.push({
      name,
      dosage,
      frequency,
      duration,
      refillsAllowed: parseInt(refills, 10) || 0,
      instructions
    });
  }
  if (!medications.length) {
    toast('Please add at least one medication', 'warning');
    return null;
  }
  return medications;
}

async function sendPrescription({ downloadAfter = false } = {}) {
  if (!isPatientSelected()) {
    toast('Please select a patient first', 'warning');
    return;
  }

  const medications = collectMedications();
  if (!medications) return;

  if (!hasSignature) {
    toast('Please add your signature before sending', 'warning');
    return;
  }

  const notes = document.getElementById('rxNotes')?.value?.trim() || '';
  const patientName = document.getElementById('rxPatientName')?.textContent;
  const patientId = document.getElementById('rxPatientSelect')?.value;

  try {
    toast('Sending prescription...', 'info');
    const res = await prescriptionsApi.create({ patientId, medications, notes });
    const rxId = res?.data?.prescription?._id || res?.data?._id;

    toast(`✅ Prescription sent to ${patientName} successfully!`, 'success');
    hideWritePrescription();
    loadIssuedPrescriptions();

    if (downloadAfter && rxId) {
      await downloadIssuedRx(rxId);
    } else if (downloadAfter) {
      toast('PDF downloading...', 'info');
    }
  } catch {
    toast('Could not send prescription. Saved locally in demo mode.', 'warning');
    hideWritePrescription();
  }
}

function previewPrescription() {
  if (!isPatientSelected()) {
    toast('Please select a patient first', 'warning');
    return;
  }
  const medications = collectMedications();
  if (!medications) return;

  const doctor = doctorProfile || getUser();
  const content = document.getElementById('rxPreviewContent');
  const modal = document.getElementById('rxPreviewModal');
  if (!content || !modal) return;

  content.innerHTML = `
    <div class="rx-preview-doc">
      <div class="rx-preview-doc-header">
        <span class="rx-symbol">℞</span>
        <div>
          <strong>${escapeHtml(formatDoctorName(doctor))}</strong><br>
          <span class="text-muted">${escapeHtml(doctor?.specialty || '')} · MDCN Verified</span>
        </div>
      </div>
      <div class="rx-preview-patient">
        <strong>Patient:</strong> ${escapeHtml(document.getElementById('rxPatientName')?.textContent || '')}<br>
        <span class="text-muted">${escapeHtml(document.getElementById('rxPatientIdBadge')?.textContent || '')}</span>
      </div>
      <div class="rx-preview-meta">
        <span>Ref: ${escapeHtml(document.getElementById('rxRefValue')?.textContent || '')}</span>
        <span>Date: ${escapeHtml(document.getElementById('rxDateValue')?.textContent || '')}</span>
      </div>
      <div class="rx-preview-meds">
        ${medications.map((m, i) => `
          <div class="rx-preview-med-item">
            <strong>${i + 1}. ${escapeHtml(m.name)}</strong>
            <div class="text-muted">${escapeHtml(m.dosage)} · ${escapeHtml(m.frequency)} · ${escapeHtml(m.duration)}</div>
            ${m.instructions ? `<div class="text-muted">Note: ${escapeHtml(m.instructions)}</div>` : ''}
          </div>`).join('')}
      </div>
      ${document.getElementById('rxNotes')?.value?.trim()
        ? `<div class="rx-preview-notes"><strong>Clinical Notes:</strong><br>${escapeHtml(document.getElementById('rxNotes').value.trim())}</div>`
        : ''}
      <div class="rx-preview-sig">${escapeHtml(document.getElementById('typedSigPreview')?.textContent || formatDoctorName(doctor))}</div>
    </div>`;

  modal.classList.remove('hidden');
  modal.style.display = 'flex';
}

function closeRxPreview() {
  const modal = document.getElementById('rxPreviewModal');
  modal?.classList.add('hidden');
  if (modal) modal.style.display = 'none';
}

function loadIssuedPrescriptions() {
  const list = document.getElementById('rxIssuedList');
  if (!list) return;

  list.innerHTML = DEMO_ISSUED.map((rx) => `
    <div class="rx-issued-card">
      <div class="rx-issued-left">
        <div class="rx-issued-patient">
          <span class="rx-issued-name">${escapeHtml(rx.patient)}</span>
          <span class="rx-issued-id">#${escapeHtml(rx.patientId)}</span>
        </div>
        <div class="rx-issued-drugs">
          ${rx.medications.map((m) => `<span class="rx-drug-chip">💊 ${escapeHtml(m)}</span>`).join('')}
        </div>
        <div class="rx-issued-meta">📅 ${escapeHtml(rx.date)} · Refills: ${rx.refills}</div>
      </div>
      <div class="rx-issued-right">
        <span class="rx-status-badge rx-status-${rx.status}">
          ${rx.status === 'active' ? '✅ Active' : '⏰ Expired'}
        </span>
        <div class="rx-issued-actions">
          <button type="button" class="btn-rx-action" data-download-rx="${escapeHtml(rx.id)}">📄 PDF</button>
          <button type="button" class="btn-rx-action" data-resend-rx="${escapeHtml(rx.id)}">📤 Resend</button>
        </div>
      </div>
    </div>`).join('');

  list.querySelectorAll('[data-download-rx]').forEach((btn) => {
    btn.addEventListener('click', () => downloadIssuedRx(btn.dataset.downloadRx));
  });
  list.querySelectorAll('[data-resend-rx]').forEach((btn) => {
    btn.addEventListener('click', () => toast('Prescription resent to patient ✅', 'success'));
  });
}

async function downloadIssuedRx(rxId) {
  try {
    toast('Downloading prescription PDF...', 'info');
    const token = getToken() || localStorage.getItem('token');
    const response = await fetch(`/api/prescriptions/${rxId}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `virtualcare-rx-${rxId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    toast('Prescription downloaded successfully! ✅', 'success');
  } catch {
    toast('PDF download unavailable in demo mode', 'info');
  }
}

function bindPrescriptionEvents(root) {
  root.querySelector('#btnWriteRx')?.addEventListener('click', toggleWritePrescription);
  root.querySelector('#rxFormClose')?.addEventListener('click', hideWritePrescription);
  root.querySelector('#rxPatientSelect')?.addEventListener('change', autoFillPatient);
  root.querySelector('#btnChangeRxPatient')?.addEventListener('click', changeRxPatient);
  root.querySelector('#btnAddMedication')?.addEventListener('click', addMedication);
  root.querySelector('#btnClearSignature')?.addEventListener('click', clearSignature);
  root.querySelector('#typedSignature')?.addEventListener('input', updateTypedSig);

  root.querySelectorAll('.rx-sig-tab').forEach((tab) => {
    tab.addEventListener('click', () => showSigTab(tab.dataset.sigTab, tab));
  });

  root.querySelector('#btnRxPreview')?.addEventListener('click', previewPrescription);
  root.querySelector('#btnRxDraft')?.addEventListener('click', () => toast('Draft saved! 💾', 'success'));
  root.querySelector('#btnRxSend')?.addEventListener('click', () => sendPrescription());
  root.querySelector('#btnRxDownload')?.addEventListener('click', () => sendPrescription({ downloadAfter: true }));
  root.querySelector('#btnCloseRxPreview')?.addEventListener('click', closeRxPreview);
  root.querySelector('#btnPreviewSend')?.addEventListener('click', () => {
    closeRxPreview();
    sendPrescription();
  });
  root.querySelector('#rxPreviewModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'rxPreviewModal') closeRxPreview();
  });
}

export async function renderDoctorPrescriptions(container) {
  doctorProfile = getUser();
  container.innerHTML = getPrescriptionsHTML();
  bindPrescriptionEvents(container);
  loadIssuedPrescriptions();
}
