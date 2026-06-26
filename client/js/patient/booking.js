import { doctorsApi, appointmentsApi } from '../shared/api.js';
import { getUser } from '../shared/api.js';
import { SPECIALTIES, formatDate, formatCurrency, escapeHtml, statusDot, showAlert, formatDoctorName } from '../shared/utils.js';

let bookingState = { step: 1, specialty: '', doctor: null, scheduledAt: '', sessionType: 'video' };

export async function renderBooking(container) {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const preDoctor = params.get('doctor');
  if (preDoctor) {
    try {
      const res = await doctorsApi.get(preDoctor);
      bookingState.doctor = res.data.doctor;
      bookingState.specialty = res.data.doctor.specialty;
      bookingState.step = 3;
    } catch { /* continue normal flow */ }
  }

  renderStep(container, container);
}

function renderStep(rootContainer, stepContainer) {
  const steps = ['Specialty', 'Doctor', 'Time', 'Payment'];
  stepContainer.innerHTML = `
    <div class="dashboard-header"><h1>Book a Consultation</h1></div>
    <div class="booking-steps">
      ${steps.map((s, i) => `
        <div class="booking-step ${bookingState.step === i + 1 ? 'active' : ''} ${bookingState.step > i + 1 ? 'done' : ''}">
          ${i + 1}. ${s}
        </div>
      `).join('')}
    </div>
    <div id="booking-step-content"></div>
  `;

  const stepEl = stepContainer.querySelector('#booking-step-content');
  switch (bookingState.step) {
    case 1: renderSpecialtyStep(stepEl); break;
    case 2: renderDoctorStep(stepEl, rootContainer); break;
    case 3: renderTimeStep(stepEl, rootContainer); break;
    case 4: renderPaymentStep(stepEl, rootContainer); break;
  }
}

function renderSpecialtyStep(el) {
  el.innerHTML = `
    <div class="specialty-grid">
      ${SPECIALTIES.map((s) => `
        <div class="specialty-card ${bookingState.specialty === s.name ? 'selected' : ''}" data-specialty="${s.name}">
          <div class="icon">${s.icon}</div>
          <strong>${s.name}</strong>
        </div>
      `).join('')}
    </div>
    <div style="margin-top:24px;text-align:right">
      <button class="btn btn-primary" id="next-specialty" disabled>Continue</button>
    </div>
  `;

  const nextBtn = el.querySelector('#next-specialty');
  el.querySelectorAll('.specialty-card').forEach((card) => {
    card.addEventListener('click', () => {
      bookingState.specialty = card.dataset.specialty;
      el.querySelectorAll('.specialty-card').forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      nextBtn.disabled = false;
    });
  });

  nextBtn.addEventListener('click', () => {
    bookingState.step = 2;
    renderStep(rootContainer, rootContainer);
  });
}

async function renderDoctorStep(el, rootContainer) {
  el.innerHTML = '<div class="page-loading">Finding doctors...</div>';
  let doctors = [];
  try {
    const [listRes, nextRes] = await Promise.all([
      doctorsApi.list(`specialty=${encodeURIComponent(bookingState.specialty)}`),
      doctorsApi.nextAvailable(bookingState.specialty).catch(() => null)
    ]);
    doctors = listRes.data.doctors || [];
    if (nextRes?.data?.doctor) {
      doctors = [nextRes.data.doctor, ...doctors.filter((d) => d._id !== nextRes.data.doctor._id)];
    }
  } catch { /* empty */ }

  el.innerHTML = `
    ${doctors.length ? `<p class="alert alert-info">Recommended: next available doctor shown first</p>` : ''}
    <div class="doctor-carousel">
      ${doctors.length ? doctors.map((d, i) => `
        <div class="doctor-card ${bookingState.doctor?._id === d._id ? 'selected' : ''}" data-id="${d._id}" style="cursor:pointer;${i === 0 ? 'border:2px solid var(--light-blue)' : ''}">
          <div class="header">
            <img class="hex-avatar" src="${d.avatar || '/public/icons/icon.svg'}" alt="">
            <div>
              <strong>${escapeHtml(formatDoctorName(d))}</strong>
              <div>${statusDot(d.availabilityStatus)} ${escapeHtml(d.specialty)}</div>
            </div>
          </div>
          <div>⭐ ${d.rating || 'New'} · $${d.pricePerSession}/session</div>
          ${i === 0 ? '<span class="badge badge-green">Recommended</span>' : ''}
        </div>
      `).join('') : '<div class="empty-state card">No doctors available in this specialty</div>'}
    </div>
    <div style="margin-top:24px;display:flex;justify-content:space-between">
      <button class="btn btn-secondary" id="back-doctor">Back</button>
      <button class="btn btn-primary" id="next-doctor" disabled>Continue</button>
    </div>
  `;

  const nextBtn = el.querySelector('#next-doctor');
  el.querySelectorAll('.doctor-card[data-id]').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      bookingState.doctor = doctors.find((d) => d._id === id);
      el.querySelectorAll('.doctor-card').forEach((c) => c.style.border = '');
      card.style.border = '2px solid var(--light-blue)';
      nextBtn.disabled = false;
    });
  });

  el.querySelector('#back-doctor').addEventListener('click', () => {
    bookingState.step = 1;
    renderStep(rootContainer, rootContainer);
  });
  nextBtn.addEventListener('click', () => {
    bookingState.step = 3;
    renderStep(rootContainer, rootContainer);
  });
}

function renderTimeStep(el, rootContainer) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  el.innerHTML = `
    <div class="card" style="max-width:480px">
      <div class="form-group">
        <label>Session Type</label>
        <select id="session-type">
          <option value="video">Video Call</option>
          <option value="audio">Audio Only</option>
        </select>
      </div>
      <div class="form-group">
        <label>Date & Time</label>
        <input type="datetime-local" id="scheduled-at" value="${tomorrow.toISOString().slice(0, 16)}">
      </div>
      <div class="form-group">
        <label>Notes (optional)</label>
        <textarea id="notes" rows="3" placeholder="Describe your symptoms or concerns"></textarea>
      </div>
    </div>
    <div style="margin-top:24px;display:flex;justify-content:space-between">
      <button class="btn btn-secondary" id="back-time">Back</button>
      <button class="btn btn-primary" id="next-time">Continue to Payment</button>
    </div>
  `;

  el.querySelector('#back-time').addEventListener('click', () => {
    bookingState.step = 2;
    renderStep(rootContainer, rootContainer);
  });
  el.querySelector('#next-time').addEventListener('click', () => {
    bookingState.sessionType = el.querySelector('#session-type').value;
    bookingState.scheduledAt = el.querySelector('#scheduled-at').value;
    bookingState.notes = el.querySelector('#notes').value;
    bookingState.step = 4;
    renderStep(rootContainer, rootContainer);
  });
}

async function renderPaymentStep(el, rootContainer) {
  const user = getUser();
  const price = bookingState.doctor?.pricePerSession || 75;
  const discount = user?.consultationCount > 0;
  const discountAmt = discount ? price * 0.25 : 0;
  const final = price - discountAmt;

  el.innerHTML = `
    <div class="card" style="max-width:480px">
      <h3 style="margin-bottom:16px;color:var(--deep-blue)">Booking Summary</h3>
      <p><strong>Doctor:</strong> ${escapeHtml(formatDoctorName(bookingState.doctor, { surnameOnly: true }))}</p>
      <p><strong>Specialty:</strong> ${escapeHtml(bookingState.specialty)}</p>
      <p><strong>Date:</strong> ${formatDate(bookingState.scheduledAt)}</p>
      <p><strong>Type:</strong> ${bookingState.sessionType}</p>
      <hr style="margin:16px 0;border:none;border-top:1px solid var(--border)">
      <p>Gross: ${formatCurrency(price)}</p>
      ${discount ? `<p style="color:var(--green)">Returning patient discount (25%): -${formatCurrency(discountAmt)}</p>` : ''}
      <p><strong>Total: ${formatCurrency(final)}</strong></p>
      <button class="btn btn-primary btn-block" id="confirm-book" style="margin-top:20px">Confirm & Pay</button>
    </div>
    <div style="margin-top:16px"><button class="btn btn-secondary" id="back-pay">Back</button></div>
  `;

  el.querySelector('#back-pay').addEventListener('click', () => {
    bookingState.step = 3;
    renderStep(rootContainer, rootContainer);
  });

  el.querySelector('#confirm-book').addEventListener('click', async () => {
    try {
      const res = await appointmentsApi.book({
        doctorId: bookingState.doctor._id,
        specialty: bookingState.specialty,
        sessionType: bookingState.sessionType,
        scheduledAt: bookingState.scheduledAt,
        notes: bookingState.notes
      });
      showAlert(el, 'Appointment booked successfully!', 'success');
      bookingState = { step: 1, specialty: '', doctor: null, scheduledAt: '', sessionType: 'video' };
      setTimeout(() => {
        window.location.hash = '/patient/upcoming';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }, 1500);
    } catch (err) {
      showAlert(el, err.message, 'error');
    }
  });
}
