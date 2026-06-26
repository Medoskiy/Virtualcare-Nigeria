import { api, getUser } from '../shared/api.js';
import { toast } from '../shared/toast.js';
import { escapeHtml, formatDoctorName } from '../shared/utils.js';

const DEMO_RECORDS = [
  {
    id: 'rec1',
    patientName: 'Amaka Obi',
    patientInitials: 'AO',
    patientId: 'P-FEB83',
    fileName: 'ECG_Report_January_2026.pdf',
    fileType: 'pdf',
    fileSize: '1.2 MB',
    uploadDate: 'Wednesday, 15 January 2026',
    category: 'Cardiology',
    description: 'Resting 12-lead ECG report showing sinus rhythm with mild left ventricular hypertrophy',
    sharedDate: 'Wednesday, 24 June 2026',
    permission: 'granted',
    comments: [
      {
        id: 'c1',
        doctorName: 'Dr. Chukwuemeka Okonkwo',
        doctorInitials: 'CO',
        text: 'ECG shows normal sinus rhythm at 72 bpm. Mild LVH noted — consistent with hypertension history. Continue current antihypertensive therapy and monitor.',
        date: 'Wednesday, 24 June 2026',
        timeAgo: '2 hours ago',
        isOwn: true
      }
    ]
  },
  {
    id: 'rec2',
    patientName: 'Amaka Obi',
    patientInitials: 'AO',
    patientId: 'P-FEB83',
    fileName: 'Blood_Panel_Results_March_2026.pdf',
    fileType: 'pdf',
    fileSize: '0.8 MB',
    uploadDate: 'Saturday, 22 March 2026',
    category: 'Laboratory',
    description: 'Complete blood count and metabolic panel including lipid profile',
    sharedDate: 'Wednesday, 24 June 2026',
    permission: 'granted',
    comments: []
  },
  {
    id: 'rec3',
    patientName: 'Emeka Nwosu',
    patientInitials: 'EN',
    patientId: 'P-AB124',
    fileName: 'Holter_Monitor_24hr_May_2026.pdf',
    fileType: 'pdf',
    fileSize: '3.1 MB',
    uploadDate: 'Thursday, 15 May 2026',
    category: 'Cardiology',
    description: '24-hour Holter monitoring report for cardiac arrhythmia evaluation',
    sharedDate: 'Monday, 22 June 2026',
    permission: 'granted',
    comments: [
      {
        id: 'c2',
        doctorName: 'Dr. Chukwuemeka Okonkwo',
        doctorInitials: 'CO',
        text: 'Holter shows intermittent atrial fibrillation — 3 episodes recorded, longest lasting 45 minutes. Recommend starting anticoagulation therapy. Booking follow-up in 2 weeks.',
        date: 'Monday, 22 June 2026',
        timeAgo: '3 days ago',
        isOwn: true
      }
    ]
  },
  {
    id: 'rec4',
    patientName: 'Fatima Aliyu',
    patientInitials: 'FA',
    patientId: 'P-CD456',
    fileName: 'BP_Monitoring_Log_June_2026.jpg',
    fileType: 'image',
    fileSize: '0.5 MB',
    uploadDate: 'Monday, 16 June 2026',
    category: 'Hypertension',
    description: 'Two-week home blood pressure monitoring log with morning and evening readings',
    sharedDate: 'Friday, 19 June 2026',
    permission: 'granted',
    comments: []
  }
];

const FILE_ICONS = {
  pdf: '📄',
  image: '🖼️',
  dicom: '🩻',
  video: '🎥'
};

const CATEGORY_COLORS = {
  Cardiology: { bg: '#fee2e2', color: '#991b1b' },
  Laboratory: { bg: '#dcfce7', color: '#166534' },
  Hypertension: { bg: '#fef3c7', color: '#92400e' },
  Radiology: { bg: '#ede9fe', color: '#5b21b6' },
  General: { bg: '#e8f4fd', color: '#1e3a8a' }
};

let medRecords = [];

function cloneRecords(records) {
  return records.map((r) => ({
    ...r,
    comments: r.comments.map((c) => ({ ...c }))
  }));
}

function getDoctorInitials() {
  const user = getUser() || {};
  return `${(user.name || 'D').charAt(0)}${(user.surname || 'r').charAt(0)}`.toUpperCase();
}

function getPatientGroups(records) {
  const groups = {};
  records.forEach((rec) => {
    if (!groups[rec.patientId]) {
      groups[rec.patientId] = {
        name: rec.patientName,
        initials: rec.patientInitials,
        id: rec.patientId,
        records: []
      };
    }
    groups[rec.patientId].records.push(rec);
  });
  return groups;
}

function renderComment(comment) {
  return `
  <div class="mrec-comment-item" id="comment-${comment.id}">
    <div class="mrec-comment-header">
      <div class="mrec-comment-avatar-sm">${escapeHtml(comment.doctorInitials)}</div>
      <div class="mrec-comment-meta">
        <span class="mrec-comment-doctor">
          ${escapeHtml(comment.doctorName)}
          ${comment.isOwn ? '<span class="own-badge">You</span>' : ''}
        </span>
        <span class="mrec-comment-date">${escapeHtml(comment.date)} · ${escapeHtml(comment.timeAgo)}</span>
      </div>
      ${comment.isOwn ? `
        <div class="mrec-comment-own-actions">
          <button type="button" class="btn-comment-edit" data-edit-comment="${comment.id}">✏️ Edit</button>
          <button type="button" class="btn-comment-delete" data-delete-comment="${comment.id}">🗑️</button>
        </div>` : ''}
    </div>
    <div class="mrec-comment-text" id="commentText-${comment.id}">${escapeHtml(comment.text)}</div>
  </div>`;
}

function renderMedRecordCard(record, doctorInitials) {
  const cat = CATEGORY_COLORS[record.category] || CATEGORY_COLORS.General;
  const icon = FILE_ICONS[record.fileType] || '📁';
  const commentLabel = record.comments.length > 0
    ? `💬 ${record.comments.length} Comment${record.comments.length > 1 ? 's' : ''}`
    : '💬 Add Comment';

  return `
  <div class="mrec-card" id="mrec-${record.id}" data-category="${escapeHtml(record.category)}">
    <div class="mrec-card-header">
      <div class="mrec-file-icon">${icon}</div>
      <div class="mrec-file-info">
        <div class="mrec-file-name">${escapeHtml(record.fileName)}</div>
        <div class="mrec-file-meta">${escapeHtml(record.fileSize)} · Uploaded ${escapeHtml(record.uploadDate)}</div>
        <div class="mrec-file-desc">${escapeHtml(record.description)}</div>
      </div>
      <div class="mrec-card-right">
        <span class="mrec-category-badge" style="background:${cat.bg};color:${cat.color}">${escapeHtml(record.category)}</span>
        <div class="mrec-shared-date">Shared ${escapeHtml(record.sharedDate)}</div>
      </div>
    </div>

    <div class="mrec-actions">
      <button type="button" class="btn-mrec-view" data-view-record="${record.id}" data-file-name="${escapeHtml(record.fileName)}">👁️ View Record</button>
      <button type="button" class="btn-mrec-download" data-download-record="${record.id}" data-file-name="${escapeHtml(record.fileName)}">📥 Download</button>
      <button type="button" class="btn-mrec-comment" data-toggle-comments="${record.id}">${commentLabel}</button>
    </div>

    <div class="mrec-comments-section" id="comments-${record.id}" style="display:${record.comments.length > 0 ? 'block' : 'none'}">
      <div class="mrec-comments-header">
        <span class="mrec-comments-title">💬 Clinical Notes & Comments</span>
        <span class="mrec-comments-notice">Only visible to you · Shared with patient if marked</span>
      </div>

      <div class="mrec-comments-list" id="commentsList-${record.id}">
        ${record.comments.map((c) => renderComment(c)).join('')}
      </div>

      <div class="mrec-add-comment">
        <div class="mrec-comment-form-header">
          <div class="mrec-comment-avatar">${doctorInitials}</div>
          <span class="mrec-comment-label">Add Clinical Note</span>
        </div>
        <textarea
          id="commentInput-${record.id}"
          class="mrec-comment-textarea"
          placeholder="Add your clinical observations, notes, or recommendations about this record...
e.g. 'ECG shows normal sinus rhythm. No significant ST changes. Continue current medication.'"
          rows="3"
          maxlength="1000"
          data-comment-input="${record.id}"
        ></textarea>

        <div class="mrec-comment-options">
          <label class="mrec-share-toggle">
            <input type="checkbox" id="shareComment-${record.id}" />
            <span>Share this note with patient</span>
          </label>
          <div class="mrec-comment-count" id="commentCount-${record.id}">0 / 1000</div>
        </div>

        <div class="mrec-comment-actions">
          <div class="mrec-comment-tags">
            <button type="button" class="mrec-tag-btn" data-comment-tag="${record.id}" data-tag="Normal Findings">+ Normal Findings</button>
            <button type="button" class="mrec-tag-btn" data-comment-tag="${record.id}" data-tag="Requires Follow-up">+ Follow-up Needed</button>
            <button type="button" class="mrec-tag-btn" data-comment-tag="${record.id}" data-tag="Urgent Attention Required">+ Urgent</button>
            <button type="button" class="mrec-tag-btn" data-comment-tag="${record.id}" data-tag="Reviewed and Filed">+ Reviewed</button>
          </div>
          <button type="button" class="btn-post-comment" data-post-comment="${record.id}">💾 Save Note</button>
        </div>
      </div>
    </div>
  </div>`;
}

function getMedicalRecordsHTML(records) {
  const patientGroups = getPatientGroups(records);
  const doctorInitials = getDoctorInitials();
  const totalComments = records.reduce((sum, r) => sum + r.comments.length, 0);

  return `
  <div class="med-records-page">
    <div class="mrec-header">
      <div>
        <h2>Medical Records</h2>
        <p>Patient records shared with you · Read-only access with commenting</p>
      </div>
      <div class="mrec-header-right">
        <div class="mrec-permission-notice">🔒 Access granted by patients only</div>
      </div>
    </div>

    <div class="mrec-stats-row">
      <div class="mrec-stat-card">
        <div class="mrec-stat-icon">📁</div>
        <div class="mrec-stat-value">${records.length}</div>
        <div class="mrec-stat-label">Total Records</div>
      </div>
      <div class="mrec-stat-card">
        <div class="mrec-stat-icon">👥</div>
        <div class="mrec-stat-value">${Object.keys(patientGroups).length}</div>
        <div class="mrec-stat-label">Patients</div>
      </div>
      <div class="mrec-stat-card">
        <div class="mrec-stat-icon">💬</div>
        <div class="mrec-stat-value">${totalComments}</div>
        <div class="mrec-stat-label">My Comments</div>
      </div>
      <div class="mrec-stat-card">
        <div class="mrec-stat-icon">📅</div>
        <div class="mrec-stat-value">Today</div>
        <div class="mrec-stat-label">Last Access</div>
      </div>
    </div>

    <div class="mrec-toolbar">
      <div class="mrec-search-wrap">
        <span class="mrec-search-icon">🔍</span>
        <input
          type="text"
          id="mrecSearch"
          class="mrec-search-input"
          placeholder="Search records by patient, file name or category..."
        />
      </div>
      <div class="mrec-filters">
        <select class="mrec-filter-select" id="mrecPatientFilter">
          <option value="">All Patients</option>
          ${Object.values(patientGroups).map((p) => `
            <option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>
          `).join('')}
        </select>
        <select class="mrec-filter-select" id="mrecCategoryFilter">
          <option value="">All Categories</option>
          <option value="Cardiology">Cardiology</option>
          <option value="Laboratory">Laboratory</option>
          <option value="Hypertension">Hypertension</option>
          <option value="Radiology">Radiology</option>
        </select>
      </div>
    </div>

    <div id="mrecList">
      ${Object.values(patientGroups).map((group) => `
        <div class="mrec-patient-group" data-patient-id="${escapeHtml(group.id)}">
          <div class="mrec-patient-header">
            <div class="mrec-patient-avatar">${escapeHtml(group.initials)}</div>
            <div class="mrec-patient-info">
              <div class="mrec-patient-name">${escapeHtml(group.name)}</div>
              <div class="mrec-patient-meta">
                Patient ID: #${escapeHtml(group.id)} ·
                ${group.records.length} record${group.records.length !== 1 ? 's' : ''} shared
              </div>
            </div>
            <div class="mrec-patient-badge">✅ Access Granted</div>
          </div>
          <div class="mrec-records-list">
            ${group.records.map((rec) => renderMedRecordCard(rec, doctorInitials)).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  </div>`;
}

function toggleComments(recordId) {
  const section = document.getElementById(`comments-${recordId}`);
  if (!section) return;

  const isHidden = section.style.display === 'none';
  section.style.display = isHidden ? 'block' : 'none';

  if (isHidden) {
    setTimeout(() => {
      document.getElementById(`commentInput-${recordId}`)?.focus();
    }, 100);
  }
}

function updateCommentCount(recordId) {
  const textarea = document.getElementById(`commentInput-${recordId}`);
  const counter = document.getElementById(`commentCount-${recordId}`);
  if (textarea && counter) {
    const len = textarea.value.length;
    counter.textContent = `${len} / 1000`;
    counter.style.color = len > 900 ? 'var(--red)' : 'var(--muted)';
  }
}

function addCommentTag(recordId, tag) {
  const textarea = document.getElementById(`commentInput-${recordId}`);
  if (!textarea) return;

  const current = textarea.value.trim();
  textarea.value = current ? `${current}\n${tag}.` : `${tag}.`;
  textarea.focus();
  updateCommentCount(recordId);
}

async function postMedRecordComment(recordId) {
  const textarea = document.getElementById(`commentInput-${recordId}`);
  const shareToggle = document.getElementById(`shareComment-${recordId}`);
  const text = textarea?.value?.trim();

  if (!text || text.length < 5) {
    toast('Please write at least 5 characters', 'warning');
    return;
  }

  const shareWithPatient = shareToggle?.checked || false;
  const btn = document.querySelector(`#mrec-${recordId} .btn-post-comment`);

  if (btn) {
    btn.textContent = '⏳ Saving...';
    btn.disabled = true;
  }

  const user = getUser() || {};
  const newComment = {
    id: `c-${Date.now()}`,
    doctorName: formatDoctorName(user),
    doctorInitials: getDoctorInitials(),
    text,
    date: new Date().toLocaleDateString('en-NG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Africa/Lagos'
    }),
    timeAgo: 'Just now',
    isOwn: true,
    sharedWithPatient: shareWithPatient
  };

  try {
    await api(`/medical-records/${recordId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text, sharedWithPatient: shareWithPatient })
    });
  } catch {
    // Demo mode — continue
  }

  const record = medRecords.find((r) => r.id === recordId);
  if (record) record.comments.push(newComment);

  const list = document.getElementById(`commentsList-${recordId}`);
  if (list) list.insertAdjacentHTML('beforeend', renderComment(newComment));

  if (textarea) textarea.value = '';
  updateCommentCount(recordId);
  if (shareToggle) shareToggle.checked = false;

  const commentBtn = document.querySelector(`[data-toggle-comments="${recordId}"]`);
  if (commentBtn) {
    const count = document.querySelectorAll(`#commentsList-${recordId} .mrec-comment-item`).length;
    commentBtn.textContent = `💬 ${count} Comment${count > 1 ? 's' : ''}`;
  }

  if (btn) {
    btn.textContent = '💾 Save Note';
    btn.disabled = false;
  }

  toast(
    shareWithPatient ? '✅ Note saved and shared with patient!' : '✅ Clinical note saved!',
    'success'
  );
}

function editMedComment(commentId) {
  const commentText = document.getElementById(`commentText-${commentId}`);
  if (!commentText || commentText.querySelector('textarea')) return;

  const currentText = commentText.textContent.trim();
  commentText.dataset.original = currentText;
  commentText.innerHTML = `
    <textarea id="editCommentText-${commentId}" class="mrec-comment-textarea" rows="3" style="margin-top:8px">${escapeHtml(currentText)}</textarea>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button type="button" class="btn-post-comment" data-save-edit="${commentId}" style="font-size:12px;padding:6px 14px">💾 Save</button>
      <button type="button" class="btn-mrec-view" data-cancel-edit="${commentId}" style="font-size:12px;padding:6px 14px">Cancel</button>
    </div>
  `;
}

function saveEditComment(commentId) {
  const textarea = document.getElementById(`editCommentText-${commentId}`);
  const newText = textarea?.value?.trim();
  if (!newText) return;

  const commentText = document.getElementById(`commentText-${commentId}`);
  if (commentText) {
    commentText.textContent = newText;
    delete commentText.dataset.original;
  }

  medRecords.forEach((rec) => {
    const comment = rec.comments.find((c) => c.id === commentId);
    if (comment) comment.text = newText;
  });

  toast('Comment updated ✅', 'success');
}

function cancelEditComment(commentId) {
  const commentText = document.getElementById(`commentText-${commentId}`);
  if (!commentText) return;
  commentText.textContent = commentText.dataset.original || '';
  delete commentText.dataset.original;
}

function deleteMedComment(commentId) {
  if (!confirm('Delete this clinical note?')) return;

  const item = document.getElementById(`comment-${commentId}`);
  if (item) {
    item.style.opacity = '0';
    item.style.transform = 'translateX(-20px)';
    item.style.transition = 'all 0.3s ease';
    setTimeout(() => item.remove(), 300);
  }

  medRecords.forEach((rec) => {
    rec.comments = rec.comments.filter((c) => c.id !== commentId);
  });

  toast('Comment deleted', 'info');
}

function viewMedRecord(fileName) {
  toast(`Opening ${fileName}...`, 'info');
}

function downloadMedRecord(fileName) {
  toast(`Downloading ${fileName}...`, 'info');
}

function filterMedRecords() {
  const query = document.getElementById('mrecSearch')?.value?.toLowerCase() || '';
  const patientFilter = document.getElementById('mrecPatientFilter')?.value || '';
  const categoryFilter = document.getElementById('mrecCategoryFilter')?.value || '';

  document.querySelectorAll('.mrec-patient-group').forEach((group) => {
    const patientId = group.dataset.patientId;
    const groupMatchesPatient = !patientFilter || patientId === patientFilter;
    let anyVisible = false;

    group.querySelectorAll('.mrec-card').forEach((card) => {
      const category = card.dataset.category;
      const text = card.textContent.toLowerCase();
      const matchesSearch = !query || text.includes(query);
      const matchesCategory = !categoryFilter || category === categoryFilter;
      const visible = matchesSearch && matchesCategory;
      card.style.display = visible ? 'block' : 'none';
      if (visible) anyVisible = true;
    });

    group.style.display = groupMatchesPatient && anyVisible ? 'block' : 'none';
  });
}

function bindMedicalRecordsEvents(root) {
  root.querySelector('#mrecSearch')?.addEventListener('input', filterMedRecords);
  root.querySelector('#mrecPatientFilter')?.addEventListener('change', filterMedRecords);
  root.querySelector('#mrecCategoryFilter')?.addEventListener('change', filterMedRecords);

  root.addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('[data-toggle-comments]');
    if (toggleBtn) {
      toggleComments(toggleBtn.dataset.toggleComments);
      return;
    }

    const viewBtn = e.target.closest('[data-view-record]');
    if (viewBtn) {
      viewMedRecord(viewBtn.dataset.fileName);
      return;
    }

    const downloadBtn = e.target.closest('[data-download-record]');
    if (downloadBtn) {
      downloadMedRecord(downloadBtn.dataset.fileName);
      return;
    }

    const tagBtn = e.target.closest('[data-comment-tag]');
    if (tagBtn) {
      addCommentTag(tagBtn.dataset.commentTag, tagBtn.dataset.tag);
      return;
    }

    const postBtn = e.target.closest('[data-post-comment]');
    if (postBtn) {
      postMedRecordComment(postBtn.dataset.postComment);
      return;
    }

    const editBtn = e.target.closest('[data-edit-comment]');
    if (editBtn) {
      editMedComment(editBtn.dataset.editComment);
      return;
    }

    const deleteBtn = e.target.closest('[data-delete-comment]');
    if (deleteBtn) {
      deleteMedComment(deleteBtn.dataset.deleteComment);
      return;
    }

    const saveEditBtn = e.target.closest('[data-save-edit]');
    if (saveEditBtn) {
      saveEditComment(saveEditBtn.dataset.saveEdit);
      return;
    }

    const cancelEditBtn = e.target.closest('[data-cancel-edit]');
    if (cancelEditBtn) {
      cancelEditComment(cancelEditBtn.dataset.cancelEdit);
    }
  });

  root.addEventListener('input', (e) => {
    if (e.target.matches('[data-comment-input]')) {
      updateCommentCount(e.target.dataset.commentInput);
    }
  });
}

export async function renderDoctorMedicalRecords(container) {
  medRecords = cloneRecords(DEMO_RECORDS);
  container.innerHTML = getMedicalRecordsHTML(medRecords);
  bindMedicalRecordsEvents(container);
}
