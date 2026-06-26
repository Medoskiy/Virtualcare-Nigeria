import { escapeHtml, initials, formatCurrency, formatDoctorName } from './utils.js';

const RIBBON = {
  'top-rated': { label: '⭐ Top Rated', cls: 'ribbon-amber' },
  'patient-fav': { label: '💚 Patient Fav', cls: 'ribbon-green' },
  'most-reviewed': { label: '🏆 Most Reviewed', cls: 'ribbon-purple' }
};

const AVAIL = {
  green: { label: 'Available Now', cls: 'avail-green' },
  amber: { label: 'Busy Soon', cls: 'avail-amber' },
  red: { label: 'Unavailable', cls: 'avail-red' }
};

export function renderDoctorCard(d, opts = {}) {
  const ribbon = RIBBON[d.ribbonBadge] || (d.rating >= 4.8 ? RIBBON['top-rated'] : null);
  const avail = AVAIL[d.availabilityStatus] || AVAIL.red;
  const ini = initials(d.name, d.surname);
  const recommended = opts.recommended ? '<span class="dc-rec">⭐ Recommended</span>' : '';

  return `
    <article class="doctor-card-v2 doc-card ${opts.booking ? 'booking-doctor-card' : ''} ${opts.selected ? 'selected' : ''}" data-id="${d._id}">
      ${ribbon ? `<span class="dc-ribbon ${ribbon.cls}">${ribbon.label}</span>` : ''}
      <div class="dc-avatar" data-profile="${d._id}" role="button" tabindex="0">${ini}</div>
      <h3 class="dc-name" data-profile="${d._id}" role="button">${escapeHtml(formatDoctorName(d))}</h3>
      <div class="avail-badge ${avail.cls}">
        <span class="avail-dot"></span>
        ${avail.label}
      </div>
      <div class="dc-specialty">${escapeHtml(d.specialty)}</div>
      <div class="dc-hospital">${escapeHtml(d.hospitalAffiliation || 'Virtualcare Nigeria')}${d.stateOfPractice ? ` · ${escapeHtml(d.stateOfPractice)}` : ''}</div>
      ${d.isVerified ? '<div class="dc-mdcn">✅ MDCN Verified</div>' : ''}
      <div class="dc-rating">⭐ ${d.rating || '—'} <span>(${d.reviewCount || 0} reviews)</span></div>
      <div class="dc-stats">
        <div><strong>${d.yearsOfExperience || 0}yr</strong><span>Exp</span></div>
        <div><strong>${d.totalConsultations || 0}</strong><span>Consults</span></div>
        <div><strong>${formatCurrency(d.pricePerSession)}</strong><span>Session</span></div>
      </div>
      <div class="dc-tags">${(d.tags || []).slice(0, 3).map((t) => `<span>${escapeHtml(t)}</span>`).join('')}</div>
      ${recommended}
      <div class="dc-actions">
        <button class="btn btn-primary btn-sm btn-book" data-id="${d._id}">Book Appointment</button>
        <button class="btn btn-outline btn-sm btn-quick" data-id="${d._id}">Quick Consult</button>
      </div>
      ${opts.showProfile ? `<a href="/doctors/${d._id}" data-link class="dc-profile-link">View Profile →</a>` : ''}
    </article>
  `;
}

export function bindDoctorCardActions(container, onBook) {
  container.querySelectorAll('.btn-book').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onBook(btn.dataset.id, 'book');
    });
  });
  container.querySelectorAll('.btn-quick').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onBook(btn.dataset.id, 'quick');
    });
  });
  container.querySelectorAll('[data-profile]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      onBook(el.dataset.profile, 'profile');
    });
  });
  container.querySelectorAll('.dc-profile-link').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      onBook(a.getAttribute('href').split('/').pop(), 'profile');
    });
  });
}

export function doctorCardSkeleton() {
  return Array(3).fill('<div class="skeleton skeleton-card skeleton-doctor-card"></div>').join('');
}
