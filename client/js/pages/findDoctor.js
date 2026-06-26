import { doctorsApi } from '../shared/api.js';
import { SPECIALTIES, debounce, escapeHtml } from '../shared/utils.js';
import { NIGERIAN_STATES } from '../shared/nigeria.js';
import { renderDoctorCard, bindDoctorCardActions } from '../shared/doctorCard.js';
import { openBookingModal, requireAuthForBooking } from '../shared/bookingModal.js';

const DEFAULT_FILTERS = {
  specialty: [], state: '', availability: '', minRating: '', maxPrice: 25000, sort: 'rating', search: ''
};

let filters = { ...DEFAULT_FILTERS };

export async function renderFindDoctor(container) {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  filters.search = params.get('search') || '';
  filters.specialty = params.get('specialty') ? [params.get('specialty')] : [];

  container.innerHTML = `
    <div class="find-header">
      <div class="container text-center">
        <h1>Find Your Doctor</h1>
        <p>Search 3,000+ MDCN-certified specialists across all 36 states + FCT</p>
        <div class="find-search-bar">
          <input type="search" id="find-search" placeholder="Search doctor, specialty, or condition…" value="${escapeHtml(filters.search)}">
          <button class="btn btn-primary" id="find-btn">Search</button>
          <button class="btn btn-secondary find-filter-mobile" id="filter-toggle">⚙ Filter</button>
        </div>
      </div>
    </div>
    <div class="find-layout container">
      <aside class="find-sidebar card" id="find-sidebar">
        <h3>Filters</h3>
        <div class="form-group"><label>Specialty</label>
          <div class="filter-checks">${SPECIALTIES.map((s) => `
            <label><input type="checkbox" name="specialty" value="${s.name}" ${filters.specialty.includes(s.name) ? 'checked' : ''}> ${s.name}</label>`).join('')}</div>
        </div>
        <div class="form-group"><label>State</label>
          <select id="find-state"><option value="">All States</option>
            ${NIGERIAN_STATES.map((s) => `<option value="${s}">${s}</option>`).join('')}</select>
        </div>
        <div class="form-group"><label>Availability</label>
          <label><input type="radio" name="avail" value="" checked> All</label>
          <label><input type="radio" name="avail" value="green"> Available Now</label>
          <label><input type="radio" name="avail" value="amber"> Busy Soon</label>
        </div>
        <div class="form-group"><label>Min Rating</label>
          <select id="find-rating"><option value="">Any</option>
            <option value="3">3★+</option><option value="4">4★+</option><option value="4.5">4.5★+</option><option value="5">5★</option></select>
        </div>
        <div class="form-group"><label>Max Price: <span id="price-label">₦25,000</span></label>
          <input type="range" id="find-price" min="0" max="25000" step="500" value="25000"></div>
        <div class="form-group"><label>Sort By</label>
          <select id="find-sort">
            <option value="rating">Best Match / Highest Rated</option>
            <option value="price_low">Price: Low → High</option>
            <option value="price_high">Price: High → Low</option>
            <option value="experience">Most Experienced</option>
            <option value="consultations">Most Consultations</option>
          </select>
        </div>
        <button class="btn btn-primary btn-block" id="apply-filters">Apply Filters</button>
        <button class="btn btn-link" id="clear-filters">Clear All</button>
      </aside>
      <div class="find-results-main">
        <div class="results-bar"><span id="results-count">Loading…</span></div>
        <div class="doctor-results-grid" id="results-grid">
          <div class="skeleton-grid">${Array(6).fill('<div class="skeleton skeleton-card skeleton-doctor-card"></div>').join('')}</div>
        </div>
      </div>
    </div>
    <div class="filter-modal-overlay hidden" id="filter-modal">
      <div class="filter-modal card" id="filter-modal-body"></div>
    </div>
  `;

  container.querySelector('#find-price').oninput = (e) => {
    container.querySelector('#price-label').textContent = '₦' + Number(e.target.value).toLocaleString('en-NG');
  };
  container.querySelector('#find-btn').onclick = doSearch;
  container.querySelector('#find-search').oninput = debounce(doSearch, 300);
  container.querySelector('#apply-filters').onclick = doSearch;
  container.querySelector('#clear-filters').onclick = () => {
    filters = { ...DEFAULT_FILTERS };
    container.querySelector('#find-search').value = '';
    container.querySelectorAll('input[name="specialty"]').forEach((c) => { c.checked = false; });
    doSearch();
  };
  container.querySelector('#filter-toggle')?.addEventListener('click', () => {
    const modal = container.querySelector('#filter-modal');
    modal.classList.toggle('hidden');
    if (!modal.classList.contains('hidden')) {
      modal.querySelector('#filter-modal-body').innerHTML = container.querySelector('#find-sidebar').innerHTML;
    }
  });

  await doSearch();

  async function doSearch() {
    filters.search = container.querySelector('#find-search').value;
    const checked = [...container.querySelectorAll('input[name="specialty"]:checked')].map((c) => c.value);
    filters.specialty = checked;
    filters.state = container.querySelector('#find-state')?.value || '';
    filters.availability = container.querySelector('input[name="avail"]:checked')?.value || '';
    filters.minRating = container.querySelector('#find-rating')?.value || '';
    filters.maxPrice = container.querySelector('#find-price')?.value || 25000;
    filters.sort = container.querySelector('#find-sort')?.value || 'rating';

    const qs = new URLSearchParams();
    if (filters.search) qs.set('search', filters.search);
    if (filters.specialty.length === 1) qs.set('specialty', filters.specialty[0]);
    if (filters.state) qs.set('state', filters.state);
    if (filters.availability) qs.set('availability', filters.availability);
    if (filters.minRating) qs.set('minRating', filters.minRating);
    if (filters.maxPrice) qs.set('maxPrice', filters.maxPrice);
    if (filters.sort) qs.set('sort', filters.sort);

    const grid = container.querySelector('#results-grid');
    try {
      const res = await doctorsApi.list(qs.toString());
      let doctors = res.data.doctors || [];
      if (filters.specialty.length > 1) {
        doctors = doctors.filter((d) => filters.specialty.includes(d.specialty));
      }
      container.querySelector('#results-count').textContent = `${res.data.total ?? doctors.length} doctors found`;
      grid.innerHTML = doctors.length
        ? doctors.map((d) => renderDoctorCard(d, { showProfile: true })).join('')
        : '<div class="empty-state card">No doctors found — try adjusting your filters</div>';
      bindDoctorCardActions(grid, (id, action) => {
        if (action === 'profile') {
          window.location.hash = `/doctors/${id}`;
          window.dispatchEvent(new HashChangeEvent('hashchange'));
          return;
        }
        requireAuthForBooking(() => openBookingModal(id, action === 'quick'));
      });
    } catch {
      grid.innerHTML = '<div class="empty-state card">Error loading doctors</div>';
    }
  }
}
