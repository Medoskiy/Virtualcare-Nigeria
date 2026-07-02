import { doctorsApi } from '../shared/api.js';
import { SPECIALTIES, FILTER_TABS, escapeHtml } from '../shared/utils.js';
import { TESTIMONIALS } from '../shared/nigeria.js';
import { renderDoctorCard, bindDoctorCardActions, doctorCardSkeleton } from '../shared/doctorCard.js';
import { openBookingModal, requireAuthForBooking } from '../shared/bookingModal.js';

let carouselIndex = 0;
let carouselPages = 1;
let touchStartX = 0;

export async function renderHome(container) {
  container.innerHTML = `
    <section class="hero-v2">
      <div class="container hero-v2-inner">
        <div class="hero-badge hero-badge-float">⊕ Trusted by <span data-count="50000" data-suffix="K+" data-format="compact">50K+</span> Nigerians</div>
        <h1>Healthcare at <span class="highlight">Your Fingertips</span> — Consult Doctors Online</h1>
        <p class="hero-sub">Book a video or audio consultation with MDCN-certified Nigerian doctors — from Lagos to Kano, Port Harcourt to Abuja.</p>
        <div class="hero-ctas">
          <button class="btn btn-hero-primary" id="hero-book">📅 Book a Consultation</button>
          <a href="/register" data-link class="btn btn-hero-outline">✨ Create Free Account</a>
          <a href="/find-a-doctor" data-link class="btn btn-hero-glass">🩺 Browse Specialists</a>
        </div>
        <div class="hero-trust-pills" id="trust-bar">
          <span data-stat="rating" data-target="4.9" data-suffix="★ Rating">4.9★ Rating</span>
          <span data-stat="doctors" data-target="3000" data-suffix="+ Nigerian Doctors">3,000+ Nigerian Doctors</span>
          <span data-stat="consultations" data-target="50000" data-format="compact" data-suffix="K+ Consultations">50K+ Consultations</span>
          <span data-stat="satisfaction" data-target="97" data-suffix="% Satisfaction">97% Satisfaction</span>
          <span data-stat="wait" data-prefix="&lt;" data-target="5" data-suffix=" min Wait">&lt;5 min Wait</span>
          <span data-stat="sessions" data-target="45" data-suffix=" min Sessions">45 min Sessions</span>
        </div>
      </div>
    </section>
    <section class="section specialties-section">
      <div class="container">
        <span class="section-label">MEDICAL SPECIALTIES</span>
        <h2 class="section-h2">Doctors You Can Trust</h2>
        <p class="text-muted text-center" style="margin-bottom:24px">Available in all 36 states + FCT</p>
        <div class="spec-grid">${SPECIALTIES.map((s) => `
          <a href="/find-a-doctor?specialty=${encodeURIComponent(s.name)}" data-link class="spec-card">
            <div class="spec-icon">${s.icon}</div>
            <div class="spec-name">${s.name}</div>
            <div class="spec-count">${s.count}+ doctors</div>
          </a>`).join('')}</div>
      </div>
    </section>
    <section class="section how-section">
      <div class="container">
        <h2 class="section-h2 text-center">How It Works</h2>
        <div class="how-grid-4 how-connected">
          ${['Choose a Specialty', 'Select Date & Time', 'Pay with Paystack', 'Consult via Video/Audio'].map((t, i) => `
            <div class="how-card-wrap">
              <div class="how-step how-card"><div class="how-num">${i + 1}</div><h3>${t}</h3></div>
              ${i < 3 ? '<div class="how-connector" aria-hidden="true">→</div>' : ''}
            </div>`).join('')}
        </div>
      </div>
    </section>
    <section class="returning-banner">🔁 Returning Patient? You always get <strong>25% OFF</strong> — trusted from Lagos Island to Maiduguri</section>
    <section class="section doctors-section">
      <div class="container">
        <div class="section-head-row">
          <h2 class="section-h2">Find Doctors</h2>
          <div class="filter-tabs" id="home-filter-tabs">${FILTER_TABS.map((t, i) =>
            `<button class="${i === 0 ? 'active' : ''}" data-tab="${t}">${t}</button>`).join('')}</div>
        </div>
        <div class="carousel-wrap" id="carousel-wrap">
          <button class="carousel-btn prev" id="carousel-prev" aria-label="Previous">‹</button>
          <div class="doctor-carousel-track" id="doctor-carousel">${doctorCardSkeleton()}</div>
          <button class="carousel-btn next" id="carousel-next" aria-label="Next">›</button>
        </div>
        <div class="carousel-dots" id="carousel-dots"></div>
      </div>
    </section>
    <section class="ai-section">
      <div class="container text-center">
        <div class="ai-orb">🤖</div>
        <span class="ai-badge">VirtualAI — Nigerian Health Intelligence</span>
        <h2>Meet Your AI Health Assistant</h2>
        <div class="ai-pills">${['Malaria & Typhoid', 'Blood Pressure', 'Sickle Cell (AS/SS)', 'Antenatal Care', '24/7 Chat Support'].map((p) => `<span class="ai-feature-pill">${p}</span>`).join('')}</div>
        <button class="btn-ai" id="try-ai">🤖 Try VirtualAI Now</button>
      </div>
    </section>
    <section class="section testimonials-section">
      <div class="container">
        <h2 class="section-h2 text-center">Trusted Across Nigeria</h2>
        <div class="testimonials-grid">${TESTIMONIALS.map((t) => `
          <div class="testimonial-card card">
            <div class="testimonial-quote">"</div>
            <p class="testimonial-text">${escapeHtml(t.text)}</p>
            <div class="testimonial-stars">${'★'.repeat(5)}</div>
            <div class="testimonial-author">
              <div class="testimonial-avatar">${t.initials || t.avatar}</div>
              <div><strong>${escapeHtml(t.name)}</strong><br><small class="text-muted">${escapeHtml(t.state || t.location)}</small></div>
            </div>
          </div>`).join('')}</div>
      </div>
    </section>
    <section class="cta-dual">
      <div class="container cta-dual-inner">
        <a href="/register?role=patient" data-link class="btn btn-hero-primary">I'm a Patient</a>
        <a href="/register?role=doctor" data-link class="btn btn-hero-outline">I'm a Doctor</a>
      </div>
    </section>
    ${renderFooter()}
  `;

  bindHomeEvents(container);
  setupTrustBarAnimation(container);
  await loadCarouselDoctors(container, 'All');
}

function renderFooter() {
  return `<footer class="site-footer-v2"><div class="container footer-grid-v2">
    <div><a href="/" class="logo" data-link><span class="logo-text">Virtual<span class="logo-accent">care</span></span> Nigeria</a>
    <p>MDCN-Compliant Telemedicine Platform — quality healthcare across all 36 states.</p>
    <div class="social-icons"><a href="#">X</a><a href="#">in</a><a href="#">f</a><a href="#">📷</a></div></div>
    <div><h4>Quick Links</h4><ul><li><a href="/find-a-doctor" data-link>Find a Doctor</a></li><li><a href="#" id="footer-book">Book Consultation</a></li><li><a href="/how-it-works" data-link>How It Works</a></li><li><a href="/for-doctors" data-link>Join as a Doctor</a></li><li><a href="/blog" data-link>Blog</a></li></ul></div>
    <div><h4>Company</h4><ul><li><a href="#">About Us</a></li><li><a href="mailto:support@virtualcare.ng">support@virtualcare.ng</a></li><li><a href="#">FAQs</a></li></ul></div>
    <div><h4>Legal</h4><ul><li><a href="#">Privacy Policy (NDPR)</a></li><li><a href="#">Terms (Nigeria)</a></li><li><a href="#">NDPR Compliance</a></li></ul></div>
  </div>
  <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; margin-top: 16px; font-size: 12px; color: rgba(255,255,255,0.5); text-align: center;">
    Virtualcare Nigeria operates in compliance with the Nigeria Data Protection Regulation (NDPR) 2019. Your data is safe and secure.
    <a href="/privacy-policy" data-link style="color: rgba(255,255,255,0.7); text-decoration: underline; margin-left: 4px;">Privacy Policy</a>
  </div>
  <div class="footer-bottom-v2">© ${new Date().getFullYear()} Virtualcare Nigeria | MDCN-Compliant Telemedicine Platform</div></footer>`;
}

function setupTrustBarAnimation(container) {
  const bar = container.querySelector('#trust-bar');
  if (!bar || !('IntersectionObserver' in window)) return;
  let animated = false;
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !animated) {
      animated = true;
      bar.querySelectorAll('[data-target]').forEach((el) => animateStat(el));
    }
  }, { threshold: 0.3 });
  observer.observe(bar);
}

function animateStat(el) {
  const target = parseFloat(el.dataset.target);
  const duration = el.dataset.stat === 'rating' ? 1500 : 2000;
  const start = performance.now();
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const format = el.dataset.format;

  function frame(now) {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    let val = target * eased;
    if (el.dataset.stat === 'rating') {
      el.textContent = `${val.toFixed(1)}${suffix}`;
    } else if (format === 'compact' && val >= 1000) {
      el.textContent = `${prefix}${Math.round(val / 1000)}K+ ${suffix.replace('K+ ', '').replace('K+', '')}`.trim();
      if (suffix.includes('Consultations')) el.textContent = `${Math.round(val / 1000)}K+ Consultations`;
    } else {
      el.textContent = `${prefix}${Math.round(val).toLocaleString('en-NG')}${suffix ? ' ' + suffix : ''}`.replace('  ', ' ');
    }
    if (p < 1) requestAnimationFrame(frame);
    else if (el.dataset.stat === 'rating') el.textContent = `4.9★ Rating`;
    else if (el.dataset.stat === 'consultations') el.textContent = '50K+ Consultations';
    else if (el.dataset.stat === 'doctors') el.textContent = '3,000+ Nigerian Doctors';
    else if (el.dataset.stat === 'satisfaction') el.textContent = '97% Satisfaction';
    else if (el.dataset.stat === 'wait') el.textContent = '<5 min Wait';
    else if (el.dataset.stat === 'sessions') el.textContent = '45 min Sessions';
  }
  requestAnimationFrame(frame);
}

async function loadCarouselDoctors(container, tab) {
  const track = container.querySelector('#doctor-carousel');
  try {
    const q = tab === 'All' ? '' : `specialty=${encodeURIComponent(tab)}`;
    const res = await doctorsApi.list(q);
    const doctors = res.data.doctors || [];
    track.innerHTML = doctors.length
      ? doctors.map((d) => renderDoctorCard(d, { showProfile: true })).join('')
      : '<p class="text-muted" style="padding:24px">No doctors found</p>';
    bindDoctorCardActions(track, (id, action) => {
      if (action === 'profile') {
        window.location.hash = `/doctors/${id}`;
        window.dispatchEvent(new HashChangeEvent('hashchange'));
        return;
      }
      requireAuthForBooking(() => openBookingModal(id, action === 'quick'));
    });
    setupCarousel(container, doctors.length);
  } catch {
    track.innerHTML = '<p class="text-muted">Unable to load doctors</p>';
  }
}

function setupCarousel(container, count) {
  carouselIndex = 0;
  const track = container.querySelector('#doctor-carousel');
  const dots = container.querySelector('#carousel-dots');
  const wrap = container.querySelector('#carousel-wrap');
  const perPage = window.innerWidth < 768 ? 1 : 3;
  carouselPages = Math.max(1, Math.ceil(count / perPage));
  dots.innerHTML = Array(carouselPages).fill(0).map((_, i) =>
    `<button class="dot ${i === 0 ? 'active' : ''}" data-page="${i}" aria-label="Page ${i + 1}"></button>`
  ).join('');

  const update = () => {
    const card = track.querySelector('.doctor-card-v2');
    const gap = 20;
    const w = card ? card.offsetWidth + gap : 300;
    const offset = carouselIndex * w * perPage;
    track.style.transform = `translateX(-${offset}px)`;
    dots.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === carouselIndex));
    container.querySelector('#carousel-prev').disabled = carouselIndex === 0;
    container.querySelector('#carousel-next').disabled = carouselIndex >= carouselPages - 1;
  };

  container.querySelector('#carousel-prev').onclick = () => {
    carouselIndex = Math.max(0, carouselIndex - 1);
    update();
  };
  container.querySelector('#carousel-next').onclick = () => {
    carouselIndex = Math.min(carouselPages - 1, carouselIndex + 1);
    update();
  };
  dots.querySelectorAll('.dot').forEach((d) => {
    d.onclick = () => { carouselIndex = Number(d.dataset.page); update(); };
  });

  wrap.ontouchstart = (e) => { touchStartX = e.changedTouches[0].screenX; };
  wrap.ontouchend = (e) => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && carouselIndex < carouselPages - 1) carouselIndex++;
      else if (diff < 0 && carouselIndex > 0) carouselIndex--;
      update();
    }
  };

  window.addEventListener('resize', update, { once: false });
  update();
}

function bindHomeEvents(container) {
  container.querySelector('#hero-book')?.addEventListener('click', () => {
    requireAuthForBooking(() => openBookingModal());
  });
  container.querySelector('#footer-book')?.addEventListener('click', (e) => {
    e.preventDefault();
    requireAuthForBooking(() => openBookingModal());
  });
  container.querySelector('#try-ai')?.addEventListener('click', () => {
    if (!localStorage.getItem('vc_token')) { window.location.hash = '/login'; }
    else { window.location.hash = '/patient/ai'; }
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
  container.querySelectorAll('#home-filter-tabs button').forEach((btn) => {
    btn.onclick = () => {
      container.querySelectorAll('#home-filter-tabs button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      loadCarouselDoctors(container, btn.dataset.tab);
    };
  });
  container.querySelectorAll('[data-link]').forEach((a) => {
    a.addEventListener('click', (e) => { e.preventDefault(); window.location.hash = a.getAttribute('href'); });
  });
}
