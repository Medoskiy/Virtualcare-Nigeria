import { toast } from '../shared/toast.js';
import { getToken } from '../shared/api.js';
import { escapeHtml } from '../shared/utils.js';

let allReviewsData = [];

const DEMO_REVIEWS = [
  {
    id: 'r1',
    patientName: 'Amaka Obi',
    patientInitials: 'AO',
    patientId: 'P-FEB83',
    rating: 5,
    date: 'Wednesday, 24 June 2026',
    timeAgo: '2 hours ago',
    comment: `Dr. Okonkwo is absolutely exceptional. He took time to explain my hypertension condition in detail and the medication he prescribed is working perfectly. I feel so much better and more confident about my health. Highly recommend!`,
    tags: ['Clear Explanation', 'Very Helpful', 'Compassionate', 'Thorough'],
    verified: true,
    doctorReply: null,
    helpful: 12
  },
  {
    id: 'r2',
    patientName: 'Emeka Nwosu',
    patientInitials: 'EN',
    patientId: 'P-AB124',
    rating: 5,
    date: 'Monday, 22 June 2026',
    timeAgo: '3 days ago',
    comment: `Outstanding cardiologist. Very professional and knowledgeable. He diagnosed my arrhythmia quickly and put me on the right treatment plan. The video call felt just like an in-person visit. Will definitely come back.`,
    tags: ['Professional', 'Knowledgeable', 'Accurate Diagnosis'],
    verified: true,
    doctorReply: `Thank you Emeka! It was a pleasure consulting with you. Please continue taking your medication and do not hesitate to book a follow-up if you have any concerns.`,
    helpful: 8
  },
  {
    id: 'r3',
    patientName: 'Fatima Aliyu',
    patientInitials: 'FA',
    patientId: 'P-CD456',
    rating: 4,
    date: 'Friday, 19 June 2026',
    timeAgo: '6 days ago',
    comment: `Very good doctor. Explained everything clearly about my blood pressure management. The only reason I give 4 stars is the wait time was a bit longer than expected. But the consultation itself was excellent.`,
    tags: ['Good Listener', 'Clear Explanation', 'On Time'],
    verified: true,
    doctorReply: null,
    helpful: 5
  },
  {
    id: 'r4',
    patientName: 'Chukwudi Eze',
    patientInitials: 'CE',
    patientId: 'P-EF789',
    rating: 5,
    date: 'Wednesday, 17 June 2026',
    timeAgo: '1 week ago',
    comment: `Dr. Okonkwo saved my life. I came in with chest pain and he immediately identified the problem and put me on the right path. Very calm, reassuring and highly skilled. This is the kind of doctor Nigeria needs more of.`,
    tags: ['Life Changing', 'Expert', 'Highly Recommend', 'Compassionate'],
    verified: true,
    doctorReply: null,
    helpful: 24
  },
  {
    id: 'r5',
    patientName: 'Ngozi Adeleke',
    patientInitials: 'NA',
    patientId: 'P-GH012',
    rating: 5,
    date: 'Monday, 15 June 2026',
    timeAgo: '10 days ago',
    comment: `Amazing experience from start to finish. Booking was easy, the doctor was punctual, and the consultation was thorough. Dr. Okonkwo genuinely cares about his patients. I have already recommended him to my family.`,
    tags: ['Punctual', 'Thorough', 'Highly Recommend'],
    verified: true,
    doctorReply: `Thank you so much Ngozi for your kind words! I am glad the consultation was helpful. Please remind your family members to book their annual cardiac checkups.`,
    helpful: 15
  }
];

function renderStars(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars += '<span class="star filled">★</span>';
    } else if (i === Math.ceil(rating) && rating % 1 >= 0.5) {
      stars += '<span class="star half">★</span>';
    } else {
      stars += '<span class="star empty">☆</span>';
    }
  }
  return stars;
}

function renderReviewCard(review) {
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

  return `
  <div class="review-card" id="review-${review.id}"
    data-rating="${review.rating}"
    data-replied="${review.doctorReply ? 'yes' : 'no'}"
    data-helpful="${review.helpful}"
    data-order="${DEMO_REVIEWS.findIndex((r) => r.id === review.id)}">

    <div class="review-header">
      <div class="reviewer-info">
        <div class="reviewer-avatar">${review.patientInitials}</div>
        <div class="reviewer-details">
          <div class="reviewer-name">
            ${review.patientName}
            ${review.verified ? `<span class="verified-patient">✅ Verified Patient</span>` : ''}
          </div>
          <div class="reviewer-id">Patient ID: #${review.patientId}</div>
          <div class="reviewer-date">${review.date} · ${review.timeAgo}</div>
        </div>
      </div>
      <div class="review-rating-display">
        <div class="review-stars">
          ${stars.split('').map((s) =>
    `<span class="${s === '★' ? 'rev-star filled' : 'rev-star empty'}">${s}</span>`
  ).join('')}
        </div>
        <div class="review-rating-num">${review.rating}.0 / 5.0</div>
      </div>
    </div>

    <div class="review-tags">
      ${review.tags.map((tag) => `<span class="review-tag-chip">${tag}</span>`).join('')}
    </div>

    <div class="review-comment">"${review.comment}"</div>

    <div class="review-helpful">
      <span style="color:var(--muted);font-size:12px">
        👍 ${review.helpful} people found this helpful
      </span>
    </div>

    ${review.doctorReply ? `
    <div class="doctor-reply-box existing">
      <div class="reply-header">
        <div class="reply-doctor-avatar">CO</div>
        <div>
          <div class="reply-doctor-name">Dr. Chukwuemeka Okonkwo</div>
          <div class="reply-label">Doctor's Response · Verified Doctor</div>
        </div>
      </div>
      <div class="reply-text">${review.doctorReply}</div>
      <button type="button" onclick="editReply('${review.id}')" class="btn-edit-reply">✏️ Edit Reply</button>
    </div>
    ` : `
    <div class="doctor-reply-form" id="replyForm-${review.id}">
      <div class="reply-form-header">
        <div class="reply-doctor-avatar">CO</div>
        <span class="reply-prompt">Reply to ${review.patientName}'s review</span>
      </div>
      <textarea
        id="replyText-${review.id}"
        class="reply-textarea"
        placeholder="Write a professional, warm response to this patient's review. Thank them for their feedback and address any concerns they raised..."
        rows="3"
        maxlength="500"
        oninput="updateReplyCount('${review.id}')"
      ></textarea>
      <div class="reply-form-footer">
        <span class="reply-char-count" id="replyCount-${review.id}">0 / 500 characters</span>
        <div class="reply-actions">
          <button type="button" onclick="cancelReply('${review.id}')" class="btn-reply-cancel">Cancel</button>
          <button type="button" onclick="submitReply('${review.id}', '${review.patientName}')" class="btn-reply-submit">📤 Post Reply</button>
        </div>
      </div>
      <div class="reply-tips">
        💡 <strong>Tips:</strong> Thank the patient, address their specific concern, keep it professional and warm. Patients can see your reply.
      </div>
    </div>
    `}

  </div>`;
}

function renderDoctorReviewsHTML() {
  const totalReviews = DEMO_REVIEWS.length;
  const avgRating = (DEMO_REVIEWS.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1);

  const starCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: DEMO_REVIEWS.filter((r) => r.rating === star).length,
    pct: Math.round((DEMO_REVIEWS.filter((r) => r.rating === star).length / totalReviews) * 100)
  }));

  const subScores = [
    { label: 'Communication', score: 4.9, icon: '💬' },
    { label: 'Medical Knowledge', score: 5.0, icon: '🧠' },
    { label: 'Punctuality', score: 4.7, icon: '⏰' },
    { label: 'Follow-up Care', score: 4.8, icon: '🔄' },
    { label: 'Bedside Manner', score: 4.9, icon: '🤝' }
  ];

  return `
  <div class="reviews-page">

    <div class="reviews-page-header">
      <div>
        <h2>Patient Reviews</h2>
        <p>Reviews are submitted by verified patients only · Read-only for doctors</p>
      </div>
      <div class="reviews-notice">🔒 Only patients can submit reviews and ratings</div>
    </div>

    <div class="rating-overview-card">
      <div class="rating-score-section">
        <div class="big-rating-number">${avgRating}</div>
        <div class="big-rating-stars">${renderStars(parseFloat(avgRating))}</div>
        <div class="big-rating-count">Based on ${totalReviews} verified reviews</div>
        <div class="rating-badge">🏆 Top Rated Doctor</div>
      </div>

      <div class="rating-breakdown">
        ${starCounts.map((s) => `
          <div class="star-row">
            <span class="star-row-label">${s.star} ★</span>
            <div class="star-row-bar">
              <div class="star-row-fill ${s.star >= 4 ? 'high' : s.star === 3 ? 'mid' : 'low'}" style="width:${s.pct}%"></div>
            </div>
            <span class="star-row-count">${s.count}</span>
            <span class="star-row-pct">${s.pct}%</span>
          </div>
        `).join('')}
      </div>

      <div class="sub-scores">
        <div class="sub-scores-title">Score Breakdown</div>
        ${subScores.map((s) => `
          <div class="sub-score-item">
            <span class="sub-score-icon">${s.icon}</span>
            <span class="sub-score-label">${s.label}</span>
            <div class="sub-score-bar">
              <div class="sub-score-fill" style="width:${(s.score / 5) * 100}%"></div>
            </div>
            <span class="sub-score-value">${s.score}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="reviews-toolbar">
      <div class="reviews-filter-tabs">
        <button type="button" class="rev-filter-tab active" onclick="filterReviews('all', this)">All (${totalReviews})</button>
        <button type="button" class="rev-filter-tab" onclick="filterReviews('5', this)">5★ (${starCounts[0].count})</button>
        <button type="button" class="rev-filter-tab" onclick="filterReviews('4', this)">4★ (${starCounts[1].count})</button>
        <button type="button" class="rev-filter-tab" onclick="filterReviews('replied', this)">✅ Replied</button>
        <button type="button" class="rev-filter-tab" onclick="filterReviews('unreplied', this)">💬 Needs Reply</button>
      </div>
      <select class="rev-sort-select" onchange="sortReviews(this.value)">
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="highest">Highest Rating</option>
        <option value="lowest">Lowest Rating</option>
        <option value="helpful">Most Helpful</option>
      </select>
    </div>

    <div class="reviews-list" id="reviewsList">
      ${DEMO_REVIEWS.map((r) => renderReviewCard(r)).join('')}
    </div>

  </div>`;
}

function filterReviews(filter, btn) {
  document.querySelectorAll('.rev-filter-tab').forEach((t) => t.classList.remove('active'));
  if (btn) btn.classList.add('active');

  document.querySelectorAll('.review-card').forEach((card) => {
    const rating = card.dataset.rating;
    const replied = card.dataset.replied;
    let show = true;
    if (filter === '5') show = rating === '5';
    else if (filter === '4') show = rating === '4';
    else if (filter === '3') show = rating === '3';
    else if (filter === 'replied') show = replied === 'yes';
    else if (filter === 'unreplied') show = replied === 'no';
    card.style.display = show ? 'block' : 'none';
  });
}

function sortReviews(value) {
  const list = document.getElementById('reviewsList');
  if (!list) return;

  const cards = [...list.querySelectorAll('.review-card')];
  cards.sort((a, b) => {
    if (value === 'highest') {
      return parseInt(b.dataset.rating, 10) - parseInt(a.dataset.rating, 10);
    }
    if (value === 'lowest') {
      return parseInt(a.dataset.rating, 10) - parseInt(b.dataset.rating, 10);
    }
    if (value === 'newest') {
      return parseInt(a.dataset.order, 10) - parseInt(b.dataset.order, 10);
    }
    if (value === 'oldest') {
      return parseInt(b.dataset.order, 10) - parseInt(a.dataset.order, 10);
    }
    if (value === 'helpful') {
      return parseInt(b.dataset.helpful, 10) - parseInt(a.dataset.helpful, 10);
    }
    return 0;
  });

  cards.forEach((card) => list.appendChild(card));
}

function updateReplyCount(reviewId) {
  const textarea = document.getElementById(`replyText-${reviewId}`);
  const counter = document.getElementById(`replyCount-${reviewId}`);
  if (textarea && counter) {
    const len = textarea.value.length;
    counter.textContent = `${len} / 500 characters`;
    counter.style.color = len > 450 ? 'var(--red)' : 'var(--muted)';
  }
}

function cancelReply(reviewId) {
  const textarea = document.getElementById(`replyText-${reviewId}`);
  if (textarea) textarea.value = '';
  updateReplyCount(reviewId);
}

async function submitReply(reviewId, patientName) {
  const textarea = document.getElementById(`replyText-${reviewId}`);
  const replyText = textarea?.value?.trim();

  if (!replyText || replyText.length < 10) {
    toast('Please write at least 10 characters in your reply', 'warning');
    return;
  }

  const btn = document.querySelector(`#replyForm-${reviewId} .btn-reply-submit`);
  if (btn) {
    btn.textContent = '⏳ Posting...';
    btn.disabled = true;
  }

  try {
    const token = getToken();
    await fetch(`/api/reviews/${reviewId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify({ reply: replyText })
    });
  } catch {
    // Demo mode — continue anyway
  }

  const form = document.getElementById(`replyForm-${reviewId}`);
  if (form) {
    form.outerHTML = `
    <div class="doctor-reply-box existing">
      <div class="reply-header">
        <div class="reply-doctor-avatar">CO</div>
        <div>
          <div class="reply-doctor-name">Dr. Chukwuemeka Okonkwo</div>
          <div class="reply-label">Doctor's Response · Just now</div>
        </div>
      </div>
      <div class="reply-text">${escapeHtml(replyText)}</div>
      <button type="button" onclick="editReply('${reviewId}')" class="btn-edit-reply">✏️ Edit Reply</button>
    </div>`;
  }

  const card = document.getElementById(`review-${reviewId}`);
  if (card) card.dataset.replied = 'yes';

  const review = allReviewsData.find((r) => r.id === reviewId);
  if (review) review.doctorReply = replyText;

  toast(`✅ Reply posted to ${patientName}'s review!`, 'success');
}

function editReply(reviewId) {
  const replyBox = document.querySelector(`#review-${reviewId} .doctor-reply-box.existing`);
  if (!replyBox) return;

  const currentText = replyBox.querySelector('.reply-text')?.textContent?.trim() || '';

  replyBox.outerHTML = `
  <div class="doctor-reply-form" id="replyForm-${reviewId}">
    <div class="reply-form-header">
      <div class="reply-doctor-avatar">CO</div>
      <span class="reply-prompt">Edit your reply</span>
    </div>
    <textarea
      id="replyText-${reviewId}"
      class="reply-textarea"
      rows="3"
      maxlength="500"
      oninput="updateReplyCount('${reviewId}')"
    >${escapeHtml(currentText)}</textarea>
    <div class="reply-form-footer">
      <span class="reply-char-count" id="replyCount-${reviewId}">${currentText.length} / 500 characters</span>
      <div class="reply-actions">
        <button type="button" onclick="cancelReply('${reviewId}')" class="btn-reply-cancel">Cancel</button>
        <button type="button" onclick="submitReply('${reviewId}', 'Patient')" class="btn-reply-submit">💾 Update Reply</button>
      </div>
    </div>
  </div>`;
}

function bindReviewsGlobals() {
  window.filterReviews = filterReviews;
  window.sortReviews = sortReviews;
  window.updateReplyCount = updateReplyCount;
  window.cancelReply = cancelReply;
  window.submitReply = submitReply;
  window.editReply = editReply;
}

export async function renderDoctorReviews(container) {
  allReviewsData = [...DEMO_REVIEWS];
  container.innerHTML = renderDoctorReviewsHTML();
  bindReviewsGlobals();
}
