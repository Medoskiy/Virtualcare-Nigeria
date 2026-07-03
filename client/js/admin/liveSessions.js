import { toast } from '../shared/toast.js';
import { escapeHtml } from '../shared/utils.js';

let sessionsRoot = null;
let currentSessionTab = 'live';

const ALL_SESSIONS_DATA = [
  { id: 'S-L001', type: 'video', status: 'live', doctor: 'Dr. Okonkwo', doctorInitials: 'CO', doctorSpec: 'Cardiology', patient: 'Amaka Obi', patientId: 'P-FEB83', startTime: '10:00 AM', duration: '22:35', durationMins: 22, amount: '₦15,000', date: 'Today, 25 Jun 2026' },
  { id: 'S-L002', type: 'audio', status: 'live', doctor: 'Dr. Ibrahim Musa', doctorInitials: 'IM', doctorSpec: 'General Practice', patient: 'Ibrahim Sule', patientId: 'P-MN901', startTime: '10:14 AM', duration: '08:12', durationMins: 8, amount: '₦5,000', date: 'Today, 25 Jun 2026' },
  { id: 'S-L003', type: 'video', status: 'live', doctor: 'Dr. Chioma Eze', doctorInitials: 'CE', doctorSpec: 'Pediatrics', patient: 'Ngozi Adeleke', patientId: 'P-GH012', startTime: '09:47 AM', duration: '35:48', durationMins: 35, amount: '₦8,000', date: 'Today, 25 Jun 2026' },
  { id: 'S-C001', type: 'video', status: 'completed', doctor: 'Dr. Okonkwo', doctorInitials: 'CO', doctorSpec: 'Cardiology', patient: 'Fatima Aliyu', patientId: 'P-CD456', startTime: '09:00 AM', endTime: '09:47 AM', duration: '47 min', durationMins: 47, amount: '₦15,000', rating: 5, date: 'Today, 25 Jun 2026' },
  { id: 'S-C002', type: 'audio', status: 'completed', doctor: 'Dr. Adaeze Nwosu', doctorInitials: 'AN', doctorSpec: 'Dermatology', patient: 'Kemi Adeyemi', patientId: 'P-OP234', startTime: '08:00 AM', endTime: '08:52 AM', duration: '52 min', durationMins: 52, amount: '₦10,000', rating: 5, date: 'Today, 25 Jun 2026' },
  { id: 'S-C003', type: 'video', status: 'completed', doctor: 'Dr. Ibrahim Musa', doctorInitials: 'IM', doctorSpec: 'General Practice', patient: 'Blessing Okafor', patientId: 'P-QR567', startTime: '08:30 AM', endTime: '09:15 AM', duration: '45 min', durationMins: 45, amount: '₦5,000', rating: 4, date: 'Today, 25 Jun 2026' },
  { id: 'S-C004', type: 'video', status: 'completed', doctor: 'Dr. Okonkwo', doctorInitials: 'CO', doctorSpec: 'Cardiology', patient: 'Emeka Nwosu', patientId: 'P-AB124', startTime: '07:00 AM', endTime: '07:52 AM', duration: '52 min', durationMins: 52, amount: '₦15,000', rating: 5, date: 'Today, 25 Jun 2026' },
  { id: 'S-C005', type: 'audio', status: 'completed', doctor: 'Dr. Chioma Eze', doctorInitials: 'CE', doctorSpec: 'Pediatrics', patient: 'Taiwo Adesanya', patientId: 'P-ST890', startTime: '06:30 AM', endTime: '07:18 AM', duration: '48 min', durationMins: 48, amount: '₦8,000', rating: 4, date: 'Today, 25 Jun 2026' },
  { id: 'S-C006', type: 'video', status: 'completed', doctor: 'Dr. Adaeze Nwosu', doctorInitials: 'AN', doctorSpec: 'Dermatology', patient: 'Chukwudi Eze', patientId: 'P-EF789', startTime: '06:00 AM', endTime: '06:47 AM', duration: '47 min', durationMins: 47, amount: '₦10,000', rating: 5, date: 'Yesterday, 24 Jun 2026' },
  { id: 'S-C007', type: 'video', status: 'completed', doctor: 'Dr. Fashola', doctorInitials: 'TF', doctorSpec: 'Neurology', patient: 'Adaeze Nnadi', patientId: 'P-UV123', startTime: '05:00 PM', endTime: '05:49 PM', duration: '49 min', durationMins: 49, amount: '₦20,000', rating: 5, date: 'Yesterday, 24 Jun 2026' },
  { id: 'S-C008', type: 'audio', status: 'completed', doctor: 'Dr. Ibrahim Musa', doctorInitials: 'IM', doctorSpec: 'General Practice', patient: 'Musa Aliyu', patientId: 'P-WX456', startTime: '03:00 PM', endTime: '03:46 PM', duration: '46 min', durationMins: 46, amount: '₦5,000', rating: 5, date: 'Yesterday, 24 Jun 2026' },
  { id: 'S-X001', type: 'video', status: 'cancelled', doctor: 'Dr. Okonkwo', doctorInitials: 'CO', doctorSpec: 'Cardiology', patient: 'Michael Torres', patientId: 'P-IJ345', startTime: '09:00 AM', duration: '0 min', durationMins: 0, amount: '₦0', reason: 'Patient no-show', date: 'Yesterday, 24 Jun 2026' },
  { id: 'S-X002', type: 'audio', status: 'cancelled', doctor: 'Dr. Adaeze Nwosu', doctorInitials: 'AN', doctorSpec: 'Dermatology', patient: 'Unknown Patient', patientId: 'P-YZ789', startTime: '02:00 PM', duration: '0 min', durationMins: 0, amount: '₦0', reason: 'Doctor unavailable — emergency', date: 'Yesterday, 24 Jun 2026' },
  { id: 'S-X003', type: 'video', status: 'cancelled', doctor: 'Dr. Chioma Eze', doctorInitials: 'CE', doctorSpec: 'Pediatrics', patient: 'Yusuf Bello', patientId: 'P-AB901', startTime: '11:00 AM', duration: '0 min', durationMins: 0, amount: '₦0', reason: 'Technical difficulties', date: '23 Jun 2026' }
];

function formatMins(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

function getSessionStats() {
  const liveSessions = ALL_SESSIONS_DATA.filter((s) => s.status === 'live');
  const completedSessions = ALL_SESSIONS_DATA.filter((s) => s.status === 'completed');
  const cancelledSessions = ALL_SESSIONS_DATA.filter((s) => s.status === 'cancelled');
  const videoSessions = ALL_SESSIONS_DATA.filter((s) => s.type === 'video');
  const audioSessions = ALL_SESSIONS_DATA.filter((s) => s.type === 'audio');

  const totalMinsAll = ALL_SESSIONS_DATA.reduce((sum, s) => sum + (s.durationMins || 0), 0);
  const totalMinsVideo = videoSessions.reduce((sum, s) => sum + (s.durationMins || 0), 0);
  const totalMinsAudio = audioSessions.reduce((sum, s) => sum + (s.durationMins || 0), 0);
  const completedVideoMins = completedSessions.filter((s) => s.type === 'video').reduce((sum, s) => sum + (s.durationMins || 0), 0);
  const completedAudioMins = completedSessions.filter((s) => s.type === 'audio').reduce((sum, s) => sum + (s.durationMins || 0), 0);

  const rated = completedSessions.filter((s) => s.rating);
  const avgRating = rated.length > 0
    ? (rated.reduce((sum, s) => sum + s.rating, 0) / rated.length).toFixed(1)
    : '—';

  return {
    liveSessions,
    completedSessions,
    cancelledSessions,
    videoSessions,
    audioSessions,
    totalMinsAll,
    totalMinsVideo,
    totalMinsAudio,
    completedVideoMins,
    completedAudioMins,
    avgRating
  };
}

function renderLiveSessionCard(s) {
  const patientInitials = s.patient.split(' ').map((n) => n[0]).join('');
  return `
  <div class="ls-session-card">
    <div class="ls-card-header">
      <div class="ls-live-indicator">
        <div class="live-pulse-dot sm"></div>
        <span>LIVE</span>
      </div>
      <span class="ls-type-badge ${s.type === 'video' ? 'video' : 'audio'}">
        ${s.type === 'video' ? '📹 Video' : '🎙️ Audio'}
      </span>
      <span class="ls-session-id">${escapeHtml(s.id)}</span>
    </div>
    <div class="ls-participants">
      <div class="ls-participant">
        <div class="ls-avatar doctor-av">${escapeHtml(s.doctorInitials)}</div>
        <div class="ls-part-info">
          <div class="ls-part-name">${escapeHtml(s.doctor)}</div>
          <div class="ls-part-role doctor">👨‍⚕️ ${escapeHtml(s.doctorSpec)}</div>
        </div>
      </div>
      <div class="ls-vs">⟷</div>
      <div class="ls-participant">
        <div class="ls-avatar patient-av">${patientInitials}</div>
        <div class="ls-part-info">
          <div class="ls-part-name">${escapeHtml(s.patient)}</div>
          <div class="ls-part-role patient">👤 Patient · <span class="ls-patient-id">#${escapeHtml(s.patientId)}</span></div>
        </div>
      </div>
    </div>
    <div class="ls-timer-section">
      <div class="ls-timer-wrap">
        <div class="ls-timer-label">Duration</div>
        <div class="ls-timer-display" id="timer-${escapeHtml(s.id)}">⏱️ ${escapeHtml(s.duration)}</div>
      </div>
      <div class="ls-timer-wrap">
        <div class="ls-timer-label">Started</div>
        <div class="ls-start-time">🕐 ${escapeHtml(s.startTime)}</div>
      </div>
      <div class="ls-timer-wrap">
        <div class="ls-timer-label">Amount</div>
        <div class="ls-amount">💰 ${escapeHtml(s.amount)}</div>
      </div>
    </div>
    <div class="ls-card-actions">
      <button type="button" class="btn-monitor" data-action="monitor-session" data-id="${escapeHtml(s.id)}">👁️ Monitor</button>
      <button type="button" class="btn-end-session-admin" data-action="end-session" data-id="${escapeHtml(s.id)}">⏹️ End</button>
    </div>
  </div>`;
}

function renderSessionTable(sessions, type) {
  const showRating = type === 'completed';
  const showReason = type === 'cancelled';
  const showMins = type === 'completed' || type === 'video' || type === 'audio';

  return `
  <table class="session-full-table">
    <thead>
      <tr>
        <th>Session ID</th>
        <th>Type</th>
        <th>Doctor</th>
        <th>Patient</th>
        <th>Specialty</th>
        <th>Date</th>
        <th>Time</th>
        ${showMins ? '<th>Duration</th><th>Minutes Used</th>' : ''}
        <th>Amount</th>
        <th>Status</th>
        ${showRating ? '<th>Rating</th>' : ''}
        ${showReason ? '<th>Reason</th>' : ''}
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      ${sessions.map((s) => {
        const patientInitials = s.patient.split(' ').map((n) => n[0]).join('');
        return `
        <tr class="session-table-row status-${s.status} type-${s.type}">
          <td><span class="session-id-badge">${escapeHtml(s.id)}</span></td>
          <td>
            <span class="type-badge ${s.type === 'video' ? 'video' : 'audio'}">
              ${s.type === 'video' ? '📹 Video' : '🎙️ Audio'}
            </span>
          </td>
          <td>
            <div class="st-person">
              <div class="st-avatar doc-av">${escapeHtml(s.doctorInitials)}</div>
              <div>
                <div class="st-name">${escapeHtml(s.doctor)}</div>
                <div class="st-spec">${escapeHtml(s.doctorSpec)}</div>
              </div>
            </div>
          </td>
          <td>
            <div class="st-person">
              <div class="st-avatar pat-av">${patientInitials}</div>
              <div>
                <div class="st-name">${escapeHtml(s.patient)}</div>
                <div class="st-id">#${escapeHtml(s.patientId)}</div>
              </div>
            </div>
          </td>
          <td><span class="specialty-chip">${escapeHtml(s.doctorSpec)}</span></td>
          <td class="st-date">${escapeHtml(s.date)}</td>
          <td class="st-time">${escapeHtml(s.startTime)}</td>
          ${showMins ? `
          <td><span class="duration-badge">${escapeHtml(s.duration)}</span></td>
          <td>
            <div class="mins-used-cell">
              <div class="mins-used-value">${s.durationMins > 0 ? `${s.durationMins} min` : '—'}</div>
              ${s.durationMins > 0 ? `
              <div class="mins-used-bar">
                <div class="mins-used-fill ${s.type === 'video' ? 'video-fill' : 'audio-fill'}"
                  style="width:${Math.min((s.durationMins / 60) * 100, 100)}%"></div>
              </div>` : ''}
            </div>
          </td>` : ''}
          <td><span class="session-amount">${escapeHtml(s.amount)}</span></td>
          <td>
            ${s.status === 'live' ? `
            <span class="session-status-badge live">
              <span class="status-pulse-dot"></span> 🔴 Live
            </span>` : s.status === 'completed' ? `
            <span class="session-status-badge completed">✅ Done</span>` : `
            <span class="session-status-badge cancelled">❌ Cancelled</span>`}
          </td>
          ${showRating ? `
          <td>
            <div class="session-rating">
              ${s.rating ? `
                <span style="color:#f59e0b">${'★'.repeat(s.rating)}</span>
                <span class="rating-num">${s.rating}.0</span>` :
                '<span style="color:var(--muted)">—</span>'}
            </div>
          </td>` : ''}
          ${showReason ? `
          <td><span class="cancel-reason-text">${escapeHtml(s.reason || '—')}</span></td>` : ''}
          <td>
            <div class="session-row-actions">
              <button type="button" class="btn-sra view" data-action="view-detail" data-id="${escapeHtml(s.id)}" title="View">👁️</button>
              ${s.status === 'live' ? `
              <button type="button" class="btn-sra monitor" data-action="monitor-session" data-id="${escapeHtml(s.id)}" title="Monitor">📡</button>` : ''}
            </div>
          </td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>`;
}

function getLiveSessionsHTML() {
  const stats = getSessionStats();
  const {
    liveSessions, completedSessions, cancelledSessions, videoSessions, audioSessions,
    totalMinsAll, totalMinsVideo, totalMinsAudio, completedVideoMins, completedAudioMins, avgRating
  } = stats;

  const videoPct = totalMinsAll ? Math.round((totalMinsVideo / totalMinsAll) * 100) : 0;
  const audioPct = totalMinsAll ? Math.round((totalMinsAudio / totalMinsAll) * 100) : 0;
  const liveMins = liveSessions.reduce((sum, s) => sum + s.durationMins, 0);
  const cancelRate = Math.round((cancelledSessions.length / ALL_SESSIONS_DATA.length) * 100);
  const revenueLost = cancelledSessions.reduce((sum, s) => sum + parseInt(s.amount.replace(/[^0-9]/g, '') || 0, 10), 0);

  const noShowCount = cancelledSessions.filter((s) => s.reason?.includes('no-show') || s.reason?.includes('Patient')).length;
  const doctorUnavailCount = cancelledSessions.filter((s) => s.reason?.includes('Doctor') || s.reason?.includes('doctor')).length;
  const technicalCount = cancelledSessions.filter((s) => s.reason?.includes('Technical') || s.reason?.includes('technical')).length;
  const otherCount = cancelledSessions.filter((s) => !s.reason || s.reason === '').length;

  const videoAvg = Math.round(totalMinsVideo / (videoSessions.filter((s) => s.durationMins > 0).length || 1));
  const audioAvg = Math.round(totalMinsAudio / (audioSessions.filter((s) => s.durationMins > 0).length || 1));

  return `
  <div class="live-sessions-page">
    <div class="ls-header">
      <div>
        <h2>Live Sessions & Call Analytics</h2>
        <p>Monitor all video and audio consultations on the platform in real-time</p>
      </div>
      <div class="ls-header-actions">
        <div class="ls-live-badge">
          <div class="live-pulse-dot"></div>
          <span>${liveSessions.length} Active Now</span>
        </div>
        <button type="button" class="btn-export-sessions" data-action="export-sessions">📊 Export Report</button>
      </div>
    </div>

    <div class="sessions-analytics-grid">
      <div class="sag-card total-sessions" data-session-tab="live">
        <div class="sag-icon">📞</div>
        <div class="sag-value">${ALL_SESSIONS_DATA.length}</div>
        <div class="sag-label">Total Sessions</div>
        <div class="sag-sub">All time today</div>
      </div>
      <div class="sag-card video-sessions" data-session-tab="video">
        <div class="sag-icon">📹</div>
        <div class="sag-value">${videoSessions.length}</div>
        <div class="sag-label">Video Calls</div>
        <div class="sag-sub">${formatMins(totalMinsVideo)} total</div>
      </div>
      <div class="sag-card audio-sessions" data-session-tab="audio">
        <div class="sag-icon">🎙️</div>
        <div class="sag-value">${audioSessions.length}</div>
        <div class="sag-label">Audio Calls</div>
        <div class="sag-sub">${formatMins(totalMinsAudio)} total</div>
      </div>
      <div class="sag-card completed-sessions" data-session-tab="completed">
        <div class="sag-icon">✅</div>
        <div class="sag-value">${completedSessions.length}</div>
        <div class="sag-label">Completed</div>
        <div class="sag-sub">${formatMins(totalMinsAll)} total mins</div>
      </div>
      <div class="sag-card cancelled-sessions" data-session-tab="cancelled">
        <div class="sag-icon">❌</div>
        <div class="sag-value">${cancelledSessions.length}</div>
        <div class="sag-label">Cancelled</div>
        <div class="sag-sub">${cancelRate}% cancel rate</div>
      </div>
      <div class="sag-card avg-duration" data-session-tab="completed">
        <div class="sag-icon">⏱️</div>
        <div class="sag-value">${Math.round(totalMinsAll / (completedSessions.length || 1))}m</div>
        <div class="sag-label">Avg Duration</div>
        <div class="sag-sub">Per completed call</div>
      </div>
      <div class="sag-card avg-rating-card" data-session-tab="completed">
        <div class="sag-icon">⭐</div>
        <div class="sag-value">${avgRating}</div>
        <div class="sag-label">Avg Rating</div>
        <div class="sag-sub">All completed calls</div>
      </div>
      <div class="sag-card total-mins-card" data-session-tab="completed">
        <div class="sag-icon">🕐</div>
        <div class="sag-value">${formatMins(totalMinsAll)}</div>
        <div class="sag-label">Total Time Used</div>
        <div class="sag-sub">All sessions combined</div>
      </div>
    </div>

    <div class="minutes-breakdown-banner">
      <div class="mbb-title">⏱️ Platform Minutes Usage Breakdown</div>
      <div class="mbb-stats">
        <div class="mbb-stat">
          <div class="mbb-stat-icon video-icon">📹</div>
          <div class="mbb-stat-info">
            <div class="mbb-stat-value">${formatMins(completedVideoMins)}</div>
            <div class="mbb-stat-label">Video (Completed)</div>
          </div>
        </div>
        <div class="mbb-divider">+</div>
        <div class="mbb-stat">
          <div class="mbb-stat-icon audio-icon">🎙️</div>
          <div class="mbb-stat-info">
            <div class="mbb-stat-value">${formatMins(completedAudioMins)}</div>
            <div class="mbb-stat-label">Audio (Completed)</div>
          </div>
        </div>
        <div class="mbb-divider">+</div>
        <div class="mbb-stat">
          <div class="mbb-stat-icon live-icon">🔴</div>
          <div class="mbb-stat-info">
            <div class="mbb-stat-value">${formatMins(liveMins)}</div>
            <div class="mbb-stat-label">Live (In Progress)</div>
          </div>
        </div>
        <div class="mbb-equals">=</div>
        <div class="mbb-total">
          <div class="mbb-total-value">${formatMins(totalMinsAll)}</div>
          <div class="mbb-total-label">Total Platform Minutes</div>
        </div>
      </div>
      <div class="mbb-bars">
        <div class="mbb-bar-row">
          <span class="mbb-bar-label">Video</span>
          <div class="mbb-bar-track">
            <div class="mbb-bar-fill video-fill" style="width:${videoPct}%"></div>
          </div>
          <span class="mbb-bar-pct">${videoPct}%</span>
        </div>
        <div class="mbb-bar-row">
          <span class="mbb-bar-label">Audio</span>
          <div class="mbb-bar-track">
            <div class="mbb-bar-fill audio-fill" style="width:${audioPct}%"></div>
          </div>
          <span class="mbb-bar-pct">${audioPct}%</span>
        </div>
      </div>
    </div>

    <div class="session-tabs-wrap">
      <div class="session-tabs">
        <button type="button" class="session-tab active" id="stab-live" data-session-tab="live">🔴 Live Now <span class="stab-count live">${liveSessions.length}</span></button>
        <button type="button" class="session-tab" id="stab-video" data-session-tab="video">📹 All Video Calls <span class="stab-count">${videoSessions.length}</span></button>
        <button type="button" class="session-tab" id="stab-audio" data-session-tab="audio">🎙️ All Audio Calls <span class="stab-count">${audioSessions.length}</span></button>
        <button type="button" class="session-tab" id="stab-completed" data-session-tab="completed">✅ Completed <span class="stab-count green">${completedSessions.length}</span></button>
        <button type="button" class="session-tab" id="stab-cancelled" data-session-tab="cancelled">❌ Cancelled <span class="stab-count red">${cancelledSessions.length}</span></button>
      </div>
    </div>

    <div class="session-content" id="section-live">
      <div class="ls-section-header">
        <h3>🔴 Live Sessions</h3>
        <p>Active consultations happening right now</p>
      </div>
      <div class="ls-cards-grid">${liveSessions.map(renderLiveSessionCard).join('')}</div>
      <div class="ls-history-section">
        <h3>📋 Recent Completed Sessions (Today)</h3>
        <div class="ls-history-list">
          ${completedSessions.slice(0, 4).map((s) => `
            <div class="ls-history-item">
              <div class="ls-hist-type ${s.type === 'video' ? 'video-type' : 'audio-type'}">${s.type === 'video' ? '📹' : '🎙️'}</div>
              <div class="ls-hist-info">
                <div class="ls-hist-names">
                  ${escapeHtml(s.doctor)} → ${escapeHtml(s.patient)}
                  <span class="hist-patient-id">#${escapeHtml(s.patientId)}</span>
                </div>
                <div class="ls-hist-meta">${escapeHtml(s.duration)} · ${escapeHtml(s.date)} · ${escapeHtml(s.amount)}</div>
              </div>
              <div class="ls-hist-mins">⏱️ ${s.durationMins} min</div>
              <div class="ls-hist-rating"><span style="color:#f59e0b">${'★'.repeat(s.rating || 0)}</span></div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="session-content" id="section-video" style="display:none">
      <div class="ls-section-header">
        <div>
          <h3>📹 All Video Calls</h3>
          <p>Every video consultation on the platform</p>
        </div>
        <div class="section-header-stats">
          <div class="shs-stat"><strong>${videoSessions.length}</strong><span>Total</span></div>
          <div class="shs-stat"><strong style="color:var(--green)">${formatMins(totalMinsVideo)}</strong><span>Total Minutes</span></div>
          <div class="shs-stat"><strong style="color:var(--bright-blue)">${videoAvg} min</strong><span>Avg Duration</span></div>
        </div>
      </div>
      <div class="session-table-wrap">${renderSessionTable(videoSessions, 'video')}</div>
    </div>

    <div class="session-content" id="section-audio" style="display:none">
      <div class="ls-section-header">
        <div>
          <h3>🎙️ All Audio Calls</h3>
          <p>Every audio consultation on the platform</p>
        </div>
        <div class="section-header-stats">
          <div class="shs-stat"><strong>${audioSessions.length}</strong><span>Total</span></div>
          <div class="shs-stat"><strong style="color:var(--green)">${formatMins(totalMinsAudio)}</strong><span>Total Minutes</span></div>
          <div class="shs-stat"><strong style="color:#7c3aed">${audioAvg} min</strong><span>Avg Duration</span></div>
        </div>
      </div>
      <div class="session-table-wrap">${renderSessionTable(audioSessions, 'audio')}</div>
    </div>

    <div class="session-content" id="section-completed" style="display:none">
      <div class="ls-section-header">
        <div>
          <h3>✅ Completed Calls</h3>
          <p>All successfully completed consultations</p>
        </div>
        <div class="section-header-stats">
          <div class="shs-stat"><strong>${completedSessions.length}</strong><span>Completed</span></div>
          <div class="shs-stat"><strong style="color:var(--green)">${formatMins(totalMinsAll)}</strong><span>Total Minutes Used</span></div>
          <div class="shs-stat"><strong style="color:#f59e0b">${avgRating}★</strong><span>Avg Rating</span></div>
          <div class="shs-stat"><strong style="color:var(--bright-blue)">${formatMins(completedVideoMins)}</strong><span>Video Minutes</span></div>
          <div class="shs-stat"><strong style="color:#7c3aed">${formatMins(completedAudioMins)}</strong><span>Audio Minutes</span></div>
        </div>
      </div>
      <div class="completed-mins-breakdown">
        <div class="cmb-card video-cmb">
          <div class="cmb-icon">📹</div>
          <div class="cmb-label">Video Call Minutes</div>
          <div class="cmb-value">${formatMins(completedVideoMins)}</div>
          <div class="cmb-sessions">${completedSessions.filter((s) => s.type === 'video').length} sessions</div>
          <div class="cmb-bar"><div class="cmb-fill video-fill" style="width:${Math.round((completedVideoMins / (totalMinsAll || 1)) * 100)}%"></div></div>
        </div>
        <div class="cmb-card audio-cmb">
          <div class="cmb-icon">🎙️</div>
          <div class="cmb-label">Audio Call Minutes</div>
          <div class="cmb-value">${formatMins(completedAudioMins)}</div>
          <div class="cmb-sessions">${completedSessions.filter((s) => s.type === 'audio').length} sessions</div>
          <div class="cmb-bar"><div class="cmb-fill audio-fill" style="width:${Math.round((completedAudioMins / (totalMinsAll || 1)) * 100)}%"></div></div>
        </div>
        <div class="cmb-card total-cmb">
          <div class="cmb-icon">🕐</div>
          <div class="cmb-label">Total Minutes Used</div>
          <div class="cmb-value">${formatMins(completedVideoMins + completedAudioMins)}</div>
          <div class="cmb-sessions">${completedSessions.length} total sessions</div>
          <div class="cmb-bar"><div class="cmb-fill total-fill" style="width:100%"></div></div>
        </div>
      </div>
      <div class="session-table-wrap">${renderSessionTable(completedSessions, 'completed')}</div>
    </div>

    <div class="session-content" id="section-cancelled" style="display:none">
      <div class="ls-section-header">
        <div>
          <h3>❌ Cancelled Sessions</h3>
          <p>Sessions that were cancelled before or during the call</p>
        </div>
        <div class="section-header-stats">
          <div class="shs-stat"><strong>${cancelledSessions.length}</strong><span>Total Cancelled</span></div>
          <div class="shs-stat"><strong style="color:#dc2626">${cancelRate}%</strong><span>Cancel Rate</span></div>
          <div class="shs-stat"><strong style="color:var(--amber)">₦${revenueLost.toLocaleString('en-NG')}</strong><span>Revenue Lost</span></div>
        </div>
      </div>
      <div class="cancel-reasons-wrap">
        <div class="cancel-reason-card"><div class="crc-icon">🚫</div><div class="crc-count">${noShowCount}</div><div class="crc-label">Patient No-Show</div></div>
        <div class="cancel-reason-card"><div class="crc-icon">👨‍⚕️</div><div class="crc-count">${doctorUnavailCount}</div><div class="crc-label">Doctor Unavailable</div></div>
        <div class="cancel-reason-card"><div class="crc-icon">📡</div><div class="crc-count">${technicalCount}</div><div class="crc-label">Technical Issues</div></div>
        <div class="cancel-reason-card"><div class="crc-icon">❓</div><div class="crc-count">${otherCount}</div><div class="crc-label">Other / Unknown</div></div>
      </div>
      <div class="session-table-wrap">${renderSessionTable(cancelledSessions, 'cancelled')}</div>
    </div>
  </div>`;
}

export function setSessionTab(tab, btn) {
  currentSessionTab = tab;
  const root = sessionsRoot || document;

  root.querySelectorAll('.session-tab').forEach((t) => t.classList.remove('active'));
  if (btn) {
    btn.classList.add('active');
  } else {
    root.querySelector(`#stab-${tab}`)?.classList.add('active');
  }

  root.querySelectorAll('.session-content').forEach((s) => {
    s.style.display = 'none';
  });

  const section = root.querySelector(`#section-${tab}`);
  if (section) {
    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function viewSessionDetail(sessionId) {
  const s = ALL_SESSIONS_DATA.find((x) => x.id === sessionId);
  if (!s) return;
  toast(`Session ${sessionId}: ${s.doctor} → ${s.patient} · ${s.duration} · ${s.amount}`, 'info', 4000);
}

function exportSessionsReport() {
  const stats = getSessionStats();
  const totalRevenue = ALL_SESSIONS_DATA.filter((s) => s.status === 'completed')
    .reduce((sum, s) => sum + parseInt(s.amount.replace(/[₦,]/g, '') || 0), 0);

  const html = `
    <html><head><style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #1e293b; }
      .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-40deg); font-size: 72px; font-weight: 900; color: rgba(10,36,99,0.05); pointer-events: none; white-space: nowrap; z-index: 0; }
      .header { background: linear-gradient(135deg, #0a2463, #1d6aba); color: #fff; padding: 28px 36px; }
      .logo { font-size: 26px; font-weight: 900; } .logo span { color: #7ec8f7; }
      .header h2 { margin: 6px 0 4px; font-size: 17px; opacity: 0.9; }
      .header p { margin: 0; font-size: 12px; opacity: 0.7; }
      .body { padding: 28px 36px; position: relative; z-index: 1; }
      .section-title { font-size: 15px; font-weight: 800; color: #0a2463; margin: 20px 0 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
      .kpi-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 20px; }
      .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; text-align: center; }
      .kpi-val { font-size: 20px; font-weight: 800; color: #0a2463; }
      .kpi-sub { font-size: 11px; color: #64748b; margin-top: 3px; }
      .live-badge { background: #fee2e2; color: #dc2626; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 4px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th { background: #0a2463; color: #fff; padding: 9px 12px; font-size: 11px; text-align: left; }
      td { padding: 8px 12px; font-size: 11px; border-bottom: 1px solid #f1f5f9; }
      tr:nth-child(even) td { background: #f8fafc; }
      .status-live { color: #dc2626; font-weight: 700; }
      .status-completed { color: #16a34a; font-weight: 600; }
      .status-cancelled { color: #d97706; font-weight: 600; }
      .footer { background: #0a2463; color: rgba(255,255,255,0.7); padding: 14px 36px; font-size: 11px; text-align: center; margin-top: 24px; }
      .footer strong { color: #7ec8f7; }
    </style></head><body>
      <div class="watermark">Virtualcare Nigeria</div>
      <div class="header">
        <div class="logo">Virtual<span>care</span> Nigeria</div>
        <h2>Live Sessions & Call Analytics Report</h2>
        <p>Generated: ${new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · Confidential</p>
      </div>
      <div class="body">
        <div class="section-title">📊 Session Analytics Overview</div>
        <div class="kpi-row">
          <div class="kpi"><div class="kpi-val" style="color:#dc2626">${stats.liveSessions.length}</div><div class="kpi-sub">🔴 Live Now</div></div>
          <div class="kpi"><div class="kpi-val" style="color:#16a34a">${stats.completedSessions.length}</div><div class="kpi-sub">✅ Completed Today</div></div>
          <div class="kpi"><div class="kpi-val">${stats.totalMinsAll}</div><div class="kpi-sub">⏱️ Total Minutes</div></div>
          <div class="kpi"><div class="kpi-val">${stats.avgRating}★</div><div class="kpi-sub">⭐ Avg Rating</div></div>
        </div>
        <div class="kpi-row">
          <div class="kpi"><div class="kpi-val">${stats.videoSessions.length}</div><div class="kpi-sub">🎥 Video Sessions</div></div>
          <div class="kpi"><div class="kpi-val">${stats.audioSessions.length}</div><div class="kpi-sub">🎙️ Audio Sessions</div></div>
          <div class="kpi"><div class="kpi-val">${stats.cancelledSessions.length}</div><div class="kpi-sub">❌ Cancelled</div></div>
          <div class="kpi"><div class="kpi-val">₦${totalRevenue.toLocaleString('en-NG')}</div><div class="kpi-sub">💰 Revenue Generated</div></div>
        </div>
        <div class="section-title">📋 All Sessions Log</div>
        <table>
          <tr><th>Session ID</th><th>Type</th><th>Doctor</th><th>Specialty</th><th>Patient</th><th>Date</th><th>Duration</th><th>Amount</th><th>Status</th><th>Rating</th></tr>
          ${ALL_SESSIONS_DATA.map((s) => `
            <tr>
              <td>${s.id}</td>
              <td>${s.type === 'video' ? '🎥 Video' : '🎙️ Audio'}</td>
              <td>${s.doctor}</td>
              <td>${s.doctorSpec}</td>
              <td>${s.patient}</td>
              <td>${s.date}</td>
              <td>${s.duration}</td>
              <td>${s.amount}</td>
              <td class="status-${s.status}">${s.status.toUpperCase()}</td>
              <td>${s.rating ? s.rating + '★' : s.reason || '—'}</td>
            </tr>
          `).join('')}
        </table>
      </div>
      <div class="footer">© ${new Date().getFullYear()} <strong>Virtualcare Nigeria</strong> · virtualcare.me · NDPR Compliant · Sessions Report — Confidential</div>
    </body></html>
  `;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) setTimeout(() => win.print(), 800);
  toast('✅ Sessions report ready — print or save as PDF!', 'success', 4000);
}

function monitorSession(id) {
  const session = ALL_SESSIONS_DATA.find((s) => s.id === id);
  if (!session) { toast('Session not found', 'error'); return; }

  const existing = document.getElementById('monitor-modal');
  if (existing) existing.remove();

  const elapsed = session.duration || '0:00';
  const modal = document.createElement('div');
  modal.id = 'monitor-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:10001;display:flex;align-items:center;justify-content:center;padding:16px';
  modal.innerHTML = `
    <div style="background:#0a2463;border-radius:16px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.5)">
      <div style="padding:20px 24px;border-bottom:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:10px;height:10px;border-radius:50%;background:#dc2626;animation:pulse 1.5s infinite"></div>
          <h3 style="color:#fff;margin:0;font-size:16px;font-weight:800">📡 Live Monitor — ${escapeHtml(id)}</h3>
        </div>
        <button type="button" id="close-monitor-btn" style="background:rgba(255,255,255,0.1);border:none;border-radius:50%;width:32px;height:32px;color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center">×</button>
      </div>
      <div style="padding:20px 24px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
          <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:14px;text-align:center">
            <div style="font-size:28px;margin-bottom:4px">${session.type === 'video' ? '🎥' : '🎙️'}</div>
            <div style="color:#7ec8f7;font-size:12px;font-weight:600">${session.type.toUpperCase()} CALL</div>
          </div>
          <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:14px;text-align:center">
            <div style="font-size:24px;font-weight:800;color:#fff" id="monitor-timer">${elapsed}</div>
            <div style="color:#7ec8f7;font-size:12px;font-weight:600">⏱️ ELAPSED</div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px">
          <div style="background:rgba(255,255,255,0.06);border-radius:10px;padding:12px;display:flex;align-items:center;gap:12px">
            <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#1d6aba,#0a2463);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700;flex-shrink:0">${escapeHtml(session.doctorInitials)}</div>
            <div>
              <div style="color:#fff;font-size:14px;font-weight:700">${escapeHtml(session.doctor)}</div>
              <div style="color:#7ec8f7;font-size:12px">${escapeHtml(session.doctorSpec)} · Doctor</div>
            </div>
            <div style="margin-left:auto;background:#dcfce7;color:#166534;font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px">🟢 Connected</div>
          </div>
          <div style="background:rgba(255,255,255,0.06);border-radius:10px;padding:12px;display:flex;align-items:center;gap:12px">
            <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#4f46e5);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700;flex-shrink:0">${session.patient.split(' ').map((n) => n[0]).join('').slice(0,2)}</div>
            <div>
              <div style="color:#fff;font-size:14px;font-weight:700">${escapeHtml(session.patient)}</div>
              <div style="color:#7ec8f7;font-size:12px">${escapeHtml(session.patientId)} · Patient</div>
            </div>
            <div style="margin-left:auto;background:#dcfce7;color:#166534;font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px">🟢 Connected</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">
          <div style="background:rgba(255,255,255,0.06);border-radius:8px;padding:10px;text-align:center">
            <div style="color:#22c55e;font-size:16px;font-weight:700">98%</div>
            <div style="color:#94a3b8;font-size:10px">Connection</div>
          </div>
          <div style="background:rgba(255,255,255,0.06);border-radius:8px;padding:10px;text-align:center">
            <div style="color:#22c55e;font-size:16px;font-weight:700">HD</div>
            <div style="color:#94a3b8;font-size:10px">Quality</div>
          </div>
          <div style="background:rgba(255,255,255,0.06);border-radius:8px;padding:10px;text-align:center">
            <div style="color:#fff;font-size:16px;font-weight:700">${escapeHtml(session.amount)}</div>
            <div style="color:#94a3b8;font-size:10px">Session Fee</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" onclick="if(confirm('End this session? Both parties will be disconnected.')) { document.getElementById('monitor-modal').remove(); }" style="flex:1;padding:10px;background:#dc2626;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;min-width:120px">⛔ End Session</button>
          <button type="button" onclick="alert('Warning sent to both parties.')" style="flex:1;padding:10px;background:rgba(245,158,11,0.2);color:#fbbf24;border:1px solid #fbbf24;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;min-width:120px">⚠️ Send Warning</button>
          <button type="button" id="close-monitor-bottom" style="flex:1;padding:10px;background:rgba(255,255,255,0.1);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;min-width:120px">Close Monitor</button>
        </div>
      </div>
    </div>
    <style>@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }</style>
  `;

  document.body.appendChild(modal);
  modal.querySelector('#close-monitor-btn').addEventListener('click', () => modal.remove());
  modal.querySelector('#close-monitor-bottom').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

function endSessionAdmin(id) {
  if (confirm('End this session? Both parties will be disconnected.')) {
    toast(`Session ${id} ended by admin.`, 'warning');
  }
}

function handleSessionsAction(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;

  const { action, id } = el.dataset;
  switch (action) {
    case 'export-sessions': exportSessionsReport(); break;
    case 'view-detail': viewSessionDetail(id); break;
    case 'monitor-session': monitorSession(id); break;
    case 'end-session': endSessionAdmin(id); break;
    default: break;
  }
}

function bindLiveSessionsEvents(root) {
  sessionsRoot = root;
  root.addEventListener('click', (e) => {
    const sagCard = e.target.closest('[data-session-tab].sag-card');
    if (sagCard) {
      const tab = sagCard.dataset.sessionTab;
      const tabBtn = root.querySelector(`#stab-${tab}`);
      setSessionTab(tab, tabBtn);
      return;
    }

    const tabBtn = e.target.closest('[data-session-tab].session-tab');
    if (tabBtn) {
      setSessionTab(tabBtn.dataset.sessionTab, tabBtn);
      return;
    }

    handleSessionsAction(e);
  });
}

export async function renderLiveSessions(container) {
  currentSessionTab = 'live';
  window.ALL_SESSIONS_DATA = ALL_SESSIONS_DATA;
  container.innerHTML = getLiveSessionsHTML();
  bindLiveSessionsEvents(container);

  const pendingTab = sessionStorage.getItem('adminSessionTab');
  if (pendingTab) {
    sessionStorage.removeItem('adminSessionTab');
    setTimeout(() => setSessionTab(pendingTab), 100);
  }
}
