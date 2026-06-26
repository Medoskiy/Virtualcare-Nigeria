import { doctorsApi } from '../shared/api.js';
import { formatNaira, escapeHtml, initials, formatDoctorName } from '../shared/utils.js';
import { openBookingModal, requireAuthForBooking } from '../shared/bookingModal.js';

export async function renderDoctorProfile(container, doctorId) {
  container.innerHTML = '<div class="page-loading"><div class="skeleton skeleton-card" style="height:400px"></div></div>';

  try {
    const [docRes, revRes] = await Promise.all([
      doctorsApi.get(doctorId),
      doctorsApi.reviews(doctorId)
    ]);
    const d = docRes.data.doctor;
    const reviews = revRes.data.reviews || [];
    const ini = initials(d.name, d.surname);

    const overviewHtml = `
      <div class="dp-tab-panel">
        <h3>About</h3>
        <p>${escapeHtml(d.bio || 'MDCN-certified specialist on Virtualcare Nigeria.')}</p>
        <div class="dc-tags" style="margin:16px 0">${(d.tags || []).map((t) => `<span>${escapeHtml(t)}</span>`).join('')}</div>
        <h3>Languages</h3>
        <p>${(d.languages || ['English']).join(', ')}</p>
        <h3>Weekly Schedule</h3>
        <div class="schedule-grid">${(d.schedule || []).map((day) => `
          <div class="schedule-day"><h4>${day.day}</h4>
          ${(day.slots || []).map((s) => `<div class="schedule-slot">${s.startTime}–${s.endTime}</div>`).join('') || '<small class="text-muted">No slots</small>'}
          </div>`).join('') || '<p class="text-muted">Schedule not set</p>'}</div>
      </div>`;

    const panels = {
      overview: overviewHtml,
      reviews: `<div class="dp-tab-panel"><h3>Patient Reviews</h3>
        ${reviews.length ? reviews.map((r) => `
          <div class="card" style="margin-bottom:12px">
            <div>${'★'.repeat(r.rating)}</div>
            <p>${escapeHtml(r.comment)}</p>
            <small class="text-muted">${escapeHtml(r.patient?.name || '')} ${escapeHtml(r.patient?.surname || '')}</small>
          </div>`).join('') : '<p class="text-muted">No reviews yet</p>'}</div>`,
      credentials: `<div class="dp-tab-panel">
        <h3>MDCN Registration</h3>
        <p><strong>${escapeHtml(d.mdcnNumber || 'N/A')}</strong> (${d.mdcnRegistrationYear || '—'})</p>
        <a href="https://www.mdcn.gov.ng" target="_blank" rel="noopener">Verify on MDCN website →</a>
        ${d.fellowship ? `<h3 style="margin-top:16px">Fellowship</h3><p>${escapeHtml(d.fellowship)}</p>` : ''}
        <h3 style="margin-top:16px">Education</h3>
        <p>${(d.credentials?.education || []).map((e) => `${e.year} — ${e.degree}, ${e.institution}`).join('<br>') || 'MBBS — Nigerian Medical School'}</p>
      </div>`
    };

    container.innerHTML = `
      <div class="doctor-profile-page">
        <div class="dp-banner">
          <div class="container dp-banner-inner">
            <div class="dp-avatar-wrap">
              <div class="dp-avatar">${ini}</div>
              <span class="dp-status-ring status-${d.availabilityStatus}"></span>
            </div>
            <div class="dp-header-info">
              <h1>${escapeHtml(formatDoctorName(d))}</h1>
              <p class="dp-title">${escapeHtml(d.specialty)}${d.fellowship ? ` · ${escapeHtml(d.fellowship)}` : ''}</p>
              <p class="dp-hospital">${escapeHtml(d.hospitalAffiliation)} · ${escapeHtml(d.stateOfPractice)}</p>
              ${d.isVerified ? '<span class="dc-mdcn">✅ MDCN Verified — ' + escapeHtml(d.mdcnNumber || '') + '</span>' : ''}
              <div class="dp-stat-pills">
                <span>⭐ ${d.rating}</span>
                <span>${d.reviewCount} Reviews</span>
                <span>${d.totalConsultations || 0} Consultations</span>
                <span>${d.yearsOfExperience}yr Experience</span>
                <span>${formatNaira(d.pricePerSession)}/session</span>
              </div>
            </div>
          </div>
        </div>
        <div class="container dp-body">
          <div class="dp-main">
            <div class="dp-tabs">
              <button class="active" data-tab="overview">Overview</button>
              <button data-tab="reviews">Reviews (${reviews.length})</button>
              <button data-tab="credentials">Credentials</button>
            </div>
            <div id="dp-tab-content">${overviewHtml}</div>
          </div>
          <aside class="dp-booking-widget card">
            <div class="dp-price">${formatNaira(d.pricePerSession)}</div>
            <p class="text-muted">per 45–55 min session</p>
            <p><span class="status-dot status-${d.availabilityStatus}"></span> ${d.availabilityStatus === 'green' ? 'Available Now' : d.availabilityStatus === 'amber' ? 'Busy Soon' : 'Currently Busy'}</p>
            <button class="btn btn-primary btn-block" id="dp-book">Book Appointment</button>
            <button class="btn btn-outline btn-block" id="dp-quick">Quick Consult</button>
          </aside>
        </div>
      </div>
    `;

    const tabContent = container.querySelector('#dp-tab-content');
    container.querySelectorAll('.dp-tabs button').forEach((btn) => {
      btn.onclick = () => {
        container.querySelectorAll('.dp-tabs button').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        tabContent.innerHTML = panels[btn.dataset.tab] || overviewHtml;
      };
    });

    container.querySelector('#dp-book').onclick = () => requireAuthForBooking(() => openBookingModal(d._id));
    container.querySelector('#dp-quick').onclick = () => requireAuthForBooking(() => openBookingModal(d._id, true));
  } catch (e) {
    container.innerHTML = `<div class="container section"><div class="alert alert-error">${escapeHtml(e.message)}</div></div>`;
  }
}
