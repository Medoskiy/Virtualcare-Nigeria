import { doctorsApi, appointmentsApi } from './api.js';
import { getUser } from './api.js';
import { SPECIALTIES, formatDate, formatNaira, escapeHtml, formatDoctorName } from './utils.js';
import { whatsappReminderLink } from './nigeria.js';
import { toast } from './toast.js';
import { renderDoctorCard, bindDoctorCardActions } from './doctorCard.js';

let state = { step: 1, specialty: '', doctor: null, scheduledAt: '', sessionType: 'video', notes: '', quickMode: false, selectedDate: '', selectedTime: '' };
let overlay = null;

export function openBookingModal(doctorId = null, quickMode = false) {
  state = { step: 1, specialty: '', doctor: null, scheduledAt: '', sessionType: 'video', notes: '', quickMode, selectedDate: '', selectedTime: '' };
  if (doctorId) preloadDoctor(doctorId, quickMode);
  renderModal();
}

export function openBookingWithSpecialty(specialty) {
  state = {
    step: 2,
    specialty: specialty || '',
    doctor: null,
    scheduledAt: '',
    sessionType: 'video',
    notes: '',
    quickMode: false,
    selectedDate: '',
    selectedTime: ''
  };
  renderModal();
}

async function preloadDoctor(id, quickMode) {
  try {
    const res = await doctorsApi.get(id);
    state.doctor = res.data.doctor;
    state.specialty = res.data.doctor.specialty;
    state.step = quickMode ? 3 : 3;
  } catch { /* ignore */ }
}

function renderModal() {
  if (overlay) overlay.remove();
  overlay = document.createElement('div');
  overlay.className = 'modal-overlay booking-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10001;padding:16px';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:12px;padding:24px;width:min(580px,95%);max-height:90vh;overflow-y:auto;position:relative">
      <button class="modal-close" id="booking-close" style="position:absolute;top:12px;right:12px;background:#f1f5f9;border:none;border-radius:50%;width:32px;height:32px;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#64748b">✕</button>
      <div class="booking-progress" style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap">
        ${['Specialty', 'Doctor', 'Date & Time', 'Payment'].map((s, i) => `
          <div class="bp-step ${state.step > i + 1 ? 'done' : ''} ${state.step === i + 1 ? 'active' : ''}" style="display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600;${state.step === i + 1 ? 'background:#0a2463;color:#fff' : state.step > i + 1 ? 'background:#dcfce7;color:#16a34a' : 'background:#f1f5f9;color:#64748b'}">
            <span class="bp-num">${state.step > i + 1 ? '✓' : i + 1}</span> ${s}
          </div>
        `).join('')}
      </div>
      <div id="booking-body"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#booking-close').onclick = () => overlay.remove();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  renderStep();
}

function renderStep() {
  const body = overlay.querySelector('#booking-body');
  if (state.step === 1) renderStep1(body);
  else if (state.step === 2) renderStep2(body);
  else if (state.step === 3) renderStep3(body);
  else renderStep4(body);
  overlay.querySelectorAll('.bp-step').forEach((el, i) => {
    const isActive = state.step === i + 1;
    const isDone = state.step > i + 1;
    el.style.background = isActive ? '#0a2463' : isDone ? '#dcfce7' : '#f1f5f9';
    el.style.color = isActive ? '#fff' : isDone ? '#16a34a' : '#64748b';
    el.querySelector('.bp-num').textContent = isDone ? '✓' : i + 1;
  });
}

function renderStep1(body) {
  body.innerHTML = `
    <h2>Choose Specialty</h2>
    <div class="session-toggle">
      <button class="${state.sessionType === 'video' ? 'active' : ''}" data-type="video">📹 Video Call</button>
      <button class="${state.sessionType === 'audio' ? 'active' : ''}" data-type="audio">📞 Audio Call</button>
    </div>
    <div class="specialty-grid booking-spec-grid">
      ${SPECIALTIES.map((s) => `
        <div class="specialty-card ${state.specialty === s.name ? 'selected' : ''}" data-spec="${s.name}">
          <div class="icon">${s.icon}</div><strong>${s.name}</strong>
        </div>
      `).join('')}
    </div>
  `;
  body.querySelectorAll('.specialty-card').forEach((c) => {
    c.onclick = () => {
      state.specialty = c.dataset.spec;
      body.querySelectorAll('.specialty-card').forEach((x) => x.classList.remove('selected'));
      c.classList.add('selected');
      setTimeout(() => { state.step = 2; renderStep(); }, 300);
    };
  });
  body.querySelectorAll('.session-toggle button').forEach((b) => {
    b.onclick = () => {
      state.sessionType = b.dataset.type;
      body.querySelectorAll('.session-toggle button').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
    };
  });
}

async function renderStep2(body) {
  body.innerHTML = '<div class="page-loading">Loading doctors…</div>';
  let doctors = [];
  let recommendedId = null;
  try {
    const [list, next] = await Promise.all([
      doctorsApi.list(`specialty=${encodeURIComponent(state.specialty)}&availability=green,amber`),
      doctorsApi.nextAvailable(state.specialty).catch(() => null)
    ]);
    doctors = list.data.doctors || [];
    if (next?.data?.doctor) {
      recommendedId = next.data.doctor._id;
      doctors = [next.data.doctor, ...doctors.filter((d) => d._id !== recommendedId)];
    }
  } catch (e) { toast(e.message, 'error'); }

  body.innerHTML = `
    <h2>Choose Doctor</h2>
    <div class="booking-step-content">
      <div class="booking-doctor-grid">${doctors.length
        ? doctors.map((d) => renderDoctorCard(d, { recommended: d._id === recommendedId, selected: state.doctor?._id === d._id, booking: true })).join('')
        : '<p class="text-muted">No doctors available</p>'}</div>
    </div>
    <div class="booking-nav"><button class="btn btn-secondary" id="bk-back2">Back</button>
    <button class="btn btn-primary" id="bk-next2" ${state.doctor ? '' : 'disabled'}>Continue</button></div>
  `;
  const next = body.querySelector('#bk-next2');
  body.querySelectorAll('.doctor-card-v2, .booking-doctor-card').forEach((card) => {
    card.onclick = () => {
      state.doctor = doctors.find((d) => d._id === card.dataset.id);
      body.querySelectorAll('.doctor-card-v2, .booking-doctor-card').forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      next.disabled = false;
    };
  });
  bindDoctorCardActions(body, (id) => {
    state.doctor = doctors.find((d) => d._id === id);
    state.step = 3;
    renderStep();
  });
  body.querySelector('#bk-back2').onclick = () => { state.step = 1; renderStep(); };
  next.onclick = () => { state.step = 3; renderStep(); };
}

async function renderStep3(body) {
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 7);
  if (!state.selectedDate) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    state.selectedDate = tomorrow.toISOString().slice(0, 10);
  }

  body.innerHTML = `
    <h2>Select Date & Time</h2>
    <div class="form-group"><label>Date</label>
      <input type="date" id="bk-date" min="${today.toISOString().slice(0, 10)}" max="${maxDate.toISOString().slice(0, 10)}" value="${state.selectedDate}">
    </div>
    <div class="time-slot-grid" id="bk-slots"><div class="text-muted">Loading slots…</div></div>
    <div class="form-group"><label>Notes (optional)</label>
      <textarea id="bk-notes" rows="2" placeholder="Symptoms or concerns">${escapeHtml(state.notes)}</textarea></div>
    <div class="booking-nav"><button class="btn btn-secondary" id="bk-back3">Back</button>
    <button class="btn btn-primary" id="bk-next3" disabled>Continue to Payment</button></div>
  `;

  const next = body.querySelector('#bk-next3');
  const loadSlots = async (date) => {
    const slotsEl = body.querySelector('#bk-slots');
    if (!state.doctor) { slotsEl.innerHTML = '<p class="text-muted">Select a doctor first</p>'; return; }
    try {
      const res = await doctorsApi.slots(state.doctor._id, date);
      const slots = res.data.slots || [];
      if (state.quickMode && !state.selectedTime) {
        const first = slots.find((s) => s.available);
        if (first) { state.selectedTime = first.time; next.disabled = false; }
      }
      slotsEl.innerHTML = slots.map((s) => `
        <button class="time-slot ${!s.available ? 'booked' : ''} ${state.selectedTime === s.time ? 'selected' : ''}"
          data-time="${s.time}" ${!s.available ? 'disabled' : ''}>${s.time}</button>
      `).join('') || '<p class="text-muted">No slots for this day</p>';
      slotsEl.querySelectorAll('.time-slot:not(.booked)').forEach((btn) => {
        btn.onclick = () => {
          state.selectedTime = btn.dataset.time;
          slotsEl.querySelectorAll('.time-slot').forEach((b) => b.classList.remove('selected'));
          btn.classList.add('selected');
          next.disabled = false;
        };
      });
    } catch {
      slotsEl.innerHTML = '<p class="text-muted">Could not load slots</p>';
    }
  };

  body.querySelector('#bk-date').onchange = (e) => {
    state.selectedDate = e.target.value;
    state.selectedTime = '';
    next.disabled = true;
    loadSlots(state.selectedDate);
  };
  await loadSlots(state.selectedDate);

  body.querySelector('#bk-back3').onclick = () => { state.step = state.doctor && state.specialty ? 2 : 1; renderStep(); };
  next.onclick = () => {
    state.scheduledAt = `${state.selectedDate}T${state.selectedTime}:00+01:00`;
    state.notes = body.querySelector('#bk-notes').value;
    state.step = 4;
    renderStep();
  };
}

function renderStep4(body) {
  const user = getUser();
  const price = state.doctor?.pricePerSession || 5000;
  const discount = (user?.consultationCount || 0) > 0;
  const discountAmt = discount ? Math.round(price * 0.25) : 0;
  const total = price - discountAmt;
  const typeLabel = state.sessionType === 'video' ? 'Video Consultation' : 'Audio Consultation';

  body.innerHTML = `
    <h2>Payment</h2>
    <div class="order-summary card">
      <p><strong>${escapeHtml(formatDoctorName(state.doctor))}</strong></p>
      <p>${escapeHtml(state.specialty)} · ${formatDate(state.scheduledAt)}</p>
      <p>${typeLabel} · 45–55 mins</p>
      <hr>
      <div class="order-line"><span>Consultation Fee</span><span>${formatNaira(price)}</span></div>
      ${discount ? `<div class="order-line discount-line"><span>Returning Patient Discount</span><span>−${formatNaira(discountAmt)} ✓</span></div>` : ''}
      <hr>
      <div class="order-line total-line"><strong>Total</strong><strong>${formatNaira(total)}</strong></div>
    </div>
    <div class="paystack-methods card">
      <p><strong>🔒 Secure Payment</strong> — Secured by Paystack</p>
      <div class="pay-methods">💳 Card · 🏦 Bank Transfer · 📱 USSD · 📲 Mobile Money</div>
    </div>
    <div class="booking-nav"><button class="btn btn-secondary" id="bk-back4">Back</button>
    <button class="btn btn-primary" id="bk-pay">Confirm & Pay ${formatNaira(total)}</button></div>
  `;
  body.querySelector('#bk-back4').onclick = () => { state.step = 3; renderStep(); };
  body.querySelector('#bk-pay').onclick = () => handlePayment(body, total);
}

async function handlePayment(body, total) {
  const btn = body.querySelector('#bk-pay');
  btn.disabled = true;
  btn.textContent = 'Processing…';
  try {
    const bookRes = await appointmentsApi.book({
      doctorId: state.doctor._id,
      specialty: state.specialty,
      sessionType: state.sessionType,
      scheduledAt: state.scheduledAt,
      notes: state.notes
    });
    const data = bookRes.data;
    if (data.mock) { showBookingSuccess(body); return; }
    if (data.authorizationUrl) { window.location.href = data.authorizationUrl; return; }
    showBookingSuccess(body);
  } catch (e) {
    toast(e.message || 'Payment could not be processed. Please try again.', 'error');
    btn.disabled = false;
    btn.textContent = `Confirm & Pay ${formatNaira(total)}`;
  }
}

function showBookingSuccess(body) {
  const d = new Date(state.scheduledAt);
  const waLink = whatsappReminderLink({
    doctorName: formatDoctorName(state.doctor, { surnameOnly: true }),
    specialty: state.specialty,
    dateStr: d.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Africa/Lagos' }),
    timeStr: d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' }),
    sessionType: state.sessionType
  });

  body.innerHTML = `
    <div class="booking-success">
      <div class="success-checkmark">✓</div>
      <h2>Appointment Confirmed! 🎉</h2>
      <p>${escapeHtml(formatDoctorName(state.doctor, { surnameOnly: true }))} · ${formatDate(state.scheduledAt)}</p>
      <p>${state.sessionType === 'video' ? '📹 Video' : '📞 Audio'} consultation</p>
      <div class="booking-success-actions">
        <a href="${waLink}" target="_blank" rel="noopener" class="btn btn-secondary btn-block">📱 WhatsApp Reminder</a>
        <button class="btn btn-primary btn-block" id="bk-done">View My Appointments</button>
        <button class="btn btn-outline btn-block" id="bk-another">Book Another</button>
      </div>
    </div>`;
  body.querySelector('#bk-done').onclick = () => {
    overlay.remove();
    window.location.hash = '/patient/upcoming';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  };
  body.querySelector('#bk-another').onclick = () => openBookingModal();
  toast('Appointment booked!', 'success');
}

export function requireAuthForBooking(callback) {
  if (!getUser()) {
    toast('Please sign in to book', 'warning');
    window.location.hash = '/login';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    return;
  }
  callback();
}
