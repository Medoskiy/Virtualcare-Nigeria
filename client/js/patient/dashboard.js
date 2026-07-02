import { getUser } from '../shared/api.js';
import { patientsApi, appointmentsApi, messagesApi, prescriptionsApi, uploadApi, doctorsApi, reviewsApi, getToken } from '../shared/api.js';
import { renderPatientShell, bindShellEvents } from '../shared/layout.js';
import { formatDate, formatCurrency, formatShortDate, statusBadge, escapeHtml, initials, isJoinable, initMessageInput, MAX_RECORD_FILE_SIZE, formatDoctorName } from '../shared/utils.js';
import { joinAppointment, onMessageNew, emitTypingStart, emitTypingStop, onTypingStart, onTypingStop } from '../shared/socket.js';
import { joinCall, renderCallUI } from '../shared/videoCall.js';
import { toast } from '../shared/toast.js';
import { bindBookFlow } from '../shared/bookingFlow.js';
import { renderAiChat } from './aiChat.js';
import { getAvatarSectionHTML, initAvatarSelector } from './avatarSelector.js';

function isCallEligible(status) {
  return status === 'confirmed' || status === 'upcoming';
}

function renderCallButtons(appointmentId) {
  return `
    <div style="display:flex;gap:8px;margin-top:12px;width:100%;">
      <button type="button" onclick="window.startCall('${appointmentId}', 'video')" style="
        background:#0066cc;color:#fff;border:none;border-radius:8px;
        padding:8px 16px;cursor:pointer;font-size:13px;font-weight:600;
        display:flex;align-items:center;gap:6px;">
        🎥 Video Call
      </button>
      <button type="button" onclick="window.startCall('${appointmentId}', 'audio')" style="
        background:#22c55e;color:#fff;border:none;border-radius:8px;
        padding:8px 16px;cursor:pointer;font-size:13px;font-weight:600;
        display:flex;align-items:center;gap:6px;">
        🎙️ Audio Call
      </button>
    </div>`;
}

if (!window.startCall) {
  window.startCall = async (appointmentId, mode) => {
    document.body.insertAdjacentHTML('beforeend', renderCallUI(appointmentId, mode));
    const result = await joinCall(appointmentId, mode);
    if (!result.success) {
      document.getElementById('vc-call-container')?.remove();
      alert('Could not start call: ' + result.error);
    }
  };
}

export async function renderPatientPage(container, path) {
  const user = getUser();
  const tab = path.replace('/patient/', '').split('?')[0] || 'dashboard';
  let content = '<div class="page-loading">Loading...</div>';
  container.innerHTML = renderPatientShell(path, content);
  bindShellEvents(container);

  const contentEl = container.querySelector('.dash-content');
  try {
    switch (tab) {
      case 'dashboard': await renderOverview(contentEl, user); break;
      case 'book':
        await renderOverview(contentEl, user);
        setTimeout(() => window.openBookingFlow?.(), 0);
        break;
      case 'upcoming': await renderUpcoming(contentEl); break;
      case 'history': await renderHistory(contentEl); break;
      case 'messages': await renderMessages(contentEl); break;
      case 'ai': await renderAiChat(contentEl); break;
      case 'prescriptions': await renderPrescriptions(contentEl); break;
      case 'records': await renderRecords(contentEl); break;
      case 'payments': await renderPayments(contentEl); break;
      case 'reviews': await renderReviews(contentEl); break;
      case 'profile': await renderProfile(contentEl, user); break;
      default: contentEl.innerHTML = '<p>Page not found</p>';
    }
  } catch (e) {
    contentEl.innerHTML = `<div class="alert alert-error">${escapeHtml(e.message)}</div>`;
    toast(e.message, 'error');
  }
}

function isAvatarUrl(avatar) {
  return avatar && (avatar.startsWith('/') || avatar.startsWith('http') || avatar.startsWith('data:'));
}

async function renderOverview(el, user) {
  const [upcoming, profileRes, rxRes] = await Promise.all([
    patientsApi.upcoming(), patientsApi.profile(), patientsApi.prescriptions()
  ]);
  const upcomingList = upcoming.data.appointments || [];
  const profile = profileRes.data.profile || user;
  const rx = rxRes.data.prescriptions || [];

  // Resolve avatar — local override always wins over DB (handles Facebook OAuth photo)
  const avatarOverride = localStorage.getItem('vc_avatar_override');
  let savedAvatar;
  if (avatarOverride === 'emoji') {
    // User manually picked an emoji — use it regardless of DB
    try {
      const raw = localStorage.getItem('patientAvatar');
      if (raw) { const p = JSON.parse(raw); if (p?.emoji) savedAvatar = p.emoji; }
    } catch { /* ignore */ }
  } else if (avatarOverride === 'url') {
    // User uploaded a photo — use it
    savedAvatar = localStorage.getItem('vc_avatar');
  }
  // Fall back to DB avatar if no local override
  if (!savedAvatar) {
    savedAvatar = profile.avatar || localStorage.getItem('vc_avatar');
    if (!savedAvatar) {
      try {
        const raw = localStorage.getItem('patientAvatar');
        if (raw) { const p = JSON.parse(raw); if (p?.emoji) savedAvatar = p.emoji; }
      } catch { /* ignore */ }
    }
  }
  const avatarHTML = savedAvatar && isAvatarUrl(savedAvatar)
    ? `<img src="${escapeHtml(savedAvatar)}" class="sidebar-avatar banner-avatar" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.15);" alt="Avatar">`
    : savedAvatar
      ? `<div class="sidebar-avatar banner-avatar" style="font-size:52px;line-height:1;display:flex;align-items:center;justify-content:center;width:72px;height:72px;">${savedAvatar}</div>`
      : `<div class="sidebar-avatar banner-avatar" style="font-size:24px;font-weight:700;display:flex;align-items:center;justify-content:center;width:72px;height:72px;background:#1d6aba;color:#fff;border-radius:50%;">${initials(profile.name, profile.surname)}</div>`;

  el.innerHTML = `
    <div class="profile-banner patient-banner welcome-banner">
      <div class="banner-inner">
        ${avatarHTML}
        <div class="banner-text">
          <h1>Welcome, ${escapeHtml(profile.name)}</h1>
          <p>Member since ${new Date(profile.createdAt).getFullYear()} · ${profile.isReturningPatient ? 'Returning Patient 🎉' : 'New Patient'}</p>
          <div class="banner-stats">
            <span class="stat-pill">${profile.consultationCount || 0} consultations</span>
            <span class="stat-pill">${rx.length} active Rx</span>
          </div>
        </div>
      </div>
    </div>
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-icon">📅</div><div class="kpi-label">Total Consultations</div><div class="kpi-value">${profile.consultationCount || 0}</div><div class="kpi-change positive">↑ ${Math.min(profile.consultationCount || 0, 3)} this month</div></div>
      <div class="kpi-card"><div class="kpi-icon">⏰</div><div class="kpi-label">Next Appointment</div><div class="kpi-value" style="font-size:1rem">${upcomingList[0] ? formatDate(upcomingList[0].scheduledAt) : 'None'}</div></div>
      <div class="kpi-card"><div class="kpi-icon">💰</div><div class="kpi-label">Money Saved</div><div class="kpi-value">${formatCurrency((profile.consultationCount || 0) * 2500)}</div><div class="kpi-change positive">vs in-person visits</div></div>
      <div class="kpi-card"><div class="kpi-icon">💊</div><div class="kpi-label">Active Prescriptions</div><div class="kpi-value">${rx.length}</div></div>
    </div>
    <h2 class="dash-section-title">Quick Actions</h2>
    <div class="quick-actions-grid quick-grid">
      ${[['📅','Book','book'],['🤖','VirtualAI','/patient/ai'],['💬','Messages','/patient/messages'],['📁','Records','/patient/records'],['💊','Rx','/patient/prescriptions'],['💳','Payments','/patient/payments'],['⭐','Reviews','/patient/reviews']].map(([ic,lb,hr]) =>
        hr === 'book'
          ? `<div class="quick-action-card quick-action quick-card" data-book-flow role="button" tabindex="0"><span class="qa-icon icon">${ic}</span><span>${lb}</span></div>`
          : `<a href="${hr}" data-link class="quick-action-card quick-action quick-card"><span class="qa-icon icon">${ic}</span><span>${lb}</span></a>`
      ).join('')}
    </div>
    <h2 class="dash-section-title" style="margin-top:32px">Upcoming</h2>
    ${upcomingList.slice(0, 2).map(renderApptCard).join('') || '<div class="empty-state card">No upcoming appointments</div>'}
  `;
  bindLinks(el);
}

function apptStatusClass(status) {
  const map = {
    confirmed: 'appt-upcoming', upcoming: 'appt-upcoming', pending: 'appt-upcoming',
    active: 'appt-active', cancelled: 'appt-cancelled', completed: 'appt-completed'
  };
  return map[status] || 'appt-upcoming';
}

function renderApptCard(a) {
  const d = formatShortDate(a.scheduledAt);
  const canJoin = isJoinable(a.scheduledAt) || a.status === 'active';
  const joinBtn = canJoin
    ? `<a href="/video/${a._id}" data-link class="btn btn-primary btn-sm">Join Session</a>`
    : `<button class="btn btn-secondary btn-sm" disabled title="Available 10 min before">Join Session</button>`;
  return `<div class="appt-card upcoming-card appointment-card ${apptStatusClass(a.status)}">
    <div class="appt-date-block date-block"><div class="day">${d.day}</div><div class="month">${d.month}</div></div>
    <div style="flex:1"><strong>${escapeHtml(formatDoctorName(a.doctor, { surnameOnly: true }))}</strong> · ${escapeHtml(a.specialty)}
    <div class="text-muted">${d.time} · ${a.sessionType}</div></div>
    ${statusBadge(a.status)}
    ${joinBtn}
    <a href="/patient/messages" data-link class="btn btn-secondary btn-sm">Message</a>
    ${isCallEligible(a.status) ? renderCallButtons(a._id) : ''}
  </div>`;
}

async function renderUpcoming(el) {
  const res = await patientsApi.upcoming();
  const list = res.data.appointments || [];
  el.innerHTML = `<h1>Upcoming Appointments</h1>${list.map((a) => {
    const canJoin = isJoinable(a.scheduledAt) || a.status === 'active';
    const joinBtn = canJoin
      ? `<a href="/video/${a._id}" data-link class="btn btn-primary btn-sm">Join Session</a>`
      : `<button class="btn btn-secondary btn-sm" disabled title="Available 10 min before">Join Session</button>`;
    return `${renderApptCard(a)}
    <div style="margin:-8px 0 16px 76px;display:flex;gap:8px">
      ${joinBtn}
      <button class="btn btn-secondary btn-sm" data-cancel="${a._id}">Cancel</button>
    </div>`;
  }).join('') || '<div class="empty-state card">No upcoming appointments</div>'}`;
  bindLinks(el);
  el.querySelectorAll('[data-cancel]').forEach((b) => b.onclick = async () => {
    if (confirm('Cancel appointment?')) { await appointmentsApi.cancel(b.dataset.cancel); toast('Cancelled', 'success'); window.dispatchEvent(new HashChangeEvent('hashchange')); }
  });
}

async function renderHistory(el, page = 1) {
  const res = await patientsApi.history(page);
  const list = res.data.appointments || [];
  el.innerHTML = `<h1>Consultation History</h1>
    <div class="table-wrap"><table><thead><tr><th>Date</th><th>Doctor</th><th>Specialty</th><th>Status</th><th></th></tr></thead>
    <tbody>${list.map((a) => `<tr><td>${formatDate(a.scheduledAt)}</td><td>${escapeHtml(formatDoctorName(a.doctor, { surnameOnly: true }))}</td>
    <td>${escapeHtml(a.specialty)}</td><td>${statusBadge(a.status)}</td>
    <td>${a.status === 'completed' ? '<button class="btn btn-sm btn-secondary">Leave Review</button>' : ''}</td></tr>`).join('')}</tbody></table></div>
    ${res.data.pages > 1 ? `<button class="btn btn-secondary" id="hist-more">Load more</button>` : ''}`;
  el.querySelector('#hist-more')?.addEventListener('click', () => renderHistory(el, page + 1));
}

async function renderMessages(el) {
  const appts = (await appointmentsApi.patientAll()).data.appointments?.filter((a) => a.paymentId && a.status !== 'pending') || [];
  if (!appts.length) {
    el.innerHTML = `<h1>Messages</h1><div class="messages-locked card text-center" style="padding:40px">
      <div style="font-size:48px">🔒</div><h3>Messages Locked</h3>
      <p>You can message your doctor after completing payment for a consultation booking.</p>
      <button class="btn btn-primary" id="msg-book">Book a Consultation</button></div>`;
    el.querySelector('#msg-book')?.addEventListener('click', () => {
      window.openBookingFlow?.();
    });
    return;
  }

  let selected = appts[0]._id;
  el.innerHTML = `<h1>Messages</h1><div class="grid grid-2" style="gap:16px">
    <div>${appts.map((a) => `<div class="card thread-pick" data-id="${a._id}" style="margin-bottom:8px;cursor:pointer;padding:12px">
      <strong>${escapeHtml(formatDoctorName(a.doctor, { surnameOnly: true }))}</strong><div class="text-muted" style="font-size:0.8rem">${formatDate(a.scheduledAt)}</div></div>`).join('')}</div>
    <div class="chat-container" style="height:480px"><div class="chat-messages" id="msgs"></div>
    <div id="typing" class="typing-indicator-wrap"></div>
    <div class="chat-input">
      <input type="file" id="msg-file" accept=".pdf,.jpg,.jpeg,.png" hidden>
      <button class="btn btn-secondary btn-sm" id="msg-attach">📎</button>
      <input id="messageInput" class="message-input chat-input" placeholder="Type a message...">
      <button type="button" class="btn btn-primary btn-sm btn-send send-btn" id="sendBtn">Send</button>
    </div>
    <p class="chat-input-hint">Press Enter to send · Shift+Enter for new line</p></div>
  </div>`;

  async function load(id) {
    selected = id;
    joinAppointment(id);
    try {
      const access = await messagesApi.checkAccess(id);
      if (!access.data.allowed) {
        el.querySelector('#msgs').innerHTML = '<div class="messages-locked"><p>🔒 Payment required to message</p></div>';
        return;
      }
    } catch { /* proceed */ }
    const res = await messagesApi.get(id);
    const box = el.querySelector('#msgs');
    box.innerHTML = (res.data.messages || []).map((m) => {
      const att = (m.attachments || []).map((a) =>
        a.type?.startsWith('image') ? `<img src="${a.url}" alt="" style="max-width:200px;border-radius:8px">` :
        `<a href="${a.url}" target="_blank" class="file-attach-card">📄 ${escapeHtml(a.name)}</a>`
      ).join('');
      return `<div class="chat-bubble ${m.senderRole === 'patient' ? 'sent' : 'received'}">${escapeHtml(m.content)}${att}</div>`;
    }).join('');
    box.scrollTop = box.scrollHeight;
  }

  el.querySelectorAll('.thread-pick').forEach((t) => t.onclick = () => load(t.dataset.id));
  const input = el.querySelector('#messageInput');
  let typingTimer;
  input.oninput = () => { emitTypingStart(selected, getUser().name); clearTimeout(typingTimer); typingTimer = setTimeout(() => emitTypingStop(selected), 1500); };
  el.querySelector('#msg-attach').onclick = () => el.querySelector('#msg-file').click();
  el.querySelector('#msg-file').onchange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const up = await uploadApi.chatAttachment(file);
      await messagesApi.send(selected, `📎 ${file.name}`, [up.data]);
      await load(selected);
    } catch (err) { toast(err.message, 'error'); }
  };
  el.querySelector('#sendBtn').onclick = async () => {
    const c = input.value.trim(); if (!c) return;
    const box = el.querySelector('#msgs');
    box.innerHTML += `<div class="chat-bubble sent">${escapeHtml(c)}</div>`;
    input.value = '';
    emitTypingStop(selected);
    await messagesApi.send(selected, c);
    await load(selected);
  };
  onMessageNew((p) => { if (p.message?.appointment?.toString() === selected || true) load(selected); });
  onTypingStart((p) => {
    if (p.appointmentId === selected) {
      el.querySelector('#typing').innerHTML = `<div class="typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span> ${p.name || 'Doctor'} is typing…</div>`;
    }
  });
  onTypingStop(() => { el.querySelector('#typing').innerHTML = ''; });
  initMessageInput(el);
  await load(selected);
  bindBookFlow(el);
}

async function downloadPrescription(prescriptionId) {
  try {
    toast('Preparing your prescription PDF...', 'info');
    const token = getToken() || localStorage.getItem('token');
    const response = await fetch(`/api/prescriptions/${prescriptionId}/download`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      toast(error.message || 'Could not download prescription', 'error');
      return;
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `virtualcare-prescription-${prescriptionId.slice(-6)}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    toast('Prescription downloaded successfully! ✅', 'success');
  } catch {
    toast('Download failed. Please try again.', 'error');
  }
}

async function renderPrescriptions(el) {
  const rx = (await patientsApi.prescriptions()).data.prescriptions || [];

  el.innerHTML = `
    <div style="max-width:720px;margin:0 auto">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px">
        <div>
          <h1 style="font-size:22px;font-weight:800;color:#0a2463;margin:0">My Prescriptions</h1>
          <p style="font-size:13px;color:#64748b;margin:4px 0 0">${rx.length} prescription${rx.length !== 1 ? 's' : ''} on file</p>
        </div>
      </div>

      ${rx.length === 0 ? `
        <div style="text-align:center;padding:40px 24px 32px;background:#f8fafc;border-radius:16px;border:1.5px dashed #e2e8f0;margin-bottom:24px">
          <div style="font-size:48px;margin-bottom:12px">💊</div>
          <h3 style="color:#0a2463;margin:0 0 8px">No Prescriptions Yet</h3>
          <p style="color:#64748b;font-size:14px;margin:0 0 20px">Your prescriptions will appear here after a consultation with a Virtualcare doctor</p>
          <button type="button" data-book-flow style="background:linear-gradient(135deg,#1d6aba,#0a2463);color:#fff;border:none;border-radius:10px;padding:12px 24px;font-size:14px;font-weight:600;cursor:pointer">📅 Book a Consultation</button>
        </div>

        <!-- SAMPLE PRESCRIPTION PREVIEW -->
        <div style="margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
            <div style="flex:1;height:1px;background:#e2e8f0"></div>
            <span style="font-size:12px;color:#94a3b8;white-space:nowrap;font-weight:600">SAMPLE PRESCRIPTION — HOW IT WILL LOOK</span>
            <div style="flex:1;height:1px;background:#e2e8f0"></div>
          </div>
        </div>

        <div style="background:#fff;border-radius:16px;border:1.5px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 4px rgba(10,36,99,0.06);opacity:0.75;pointer-events:none">
          <div style="background:linear-gradient(135deg,#eff6ff,#dbeafe);padding:14px 18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
            <div style="display:flex;align-items:center;gap:10px">
              <span style="font-size:24px">💊</span>
              <div>
                <div style="font-size:14px;font-weight:700;color:#0a2463">Dr. Chioma Okonkwo</div>
                <div style="font-size:12px;color:#64748b">Issued 15 Jan 2026</div>
              </div>
            </div>
            <span style="font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;background:#bbf7d0;color:#16a34a">✅ Active</span>
          </div>
          <div style="padding:16px 18px">
            <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">Medications</div>
            <div style="display:flex;gap:12px;padding:12px;background:#f8fafc;border-radius:10px;margin-bottom:8px;border-left:3px solid #1d6aba">
              <div style="font-size:18px;flex-shrink:0">💉</div>
              <div>
                <div style="font-size:14px;font-weight:700;color:#0a2463">Amoxicillin <span style="font-weight:400;color:#64748b">500mg</span></div>
                <div style="font-size:12px;color:#64748b;margin-top:2px">🕐 Twice daily · 📅 7 days · 🔁 1 refill</div>
              </div>
            </div>
            <div style="display:flex;gap:12px;padding:12px;background:#fff;border-radius:10px;margin-bottom:8px;border-left:3px solid #1d6aba">
              <div style="font-size:18px;flex-shrink:0">💉</div>
              <div>
                <div style="font-size:14px;font-weight:700;color:#0a2463">Paracetamol <span style="font-weight:400;color:#64748b">1000mg</span></div>
                <div style="font-size:12px;color:#64748b;margin-top:2px">🕐 Three times daily · 📅 5 days</div>
              </div>
            </div>
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px;margin-top:8px">
              <div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:4px">📋 Doctor's Notes</div>
              <div style="font-size:13px;color:#78350f">Take with food. Avoid alcohol. Return for follow-up in 7 days if symptoms persist.</div>
            </div>
            <div style="font-size:12px;color:#94a3b8;margin-top:10px">🗓️ Expires: 15 Feb 2026 · Specialty: General Practice</div>
          </div>
          <div style="padding:12px 18px;border-top:1px solid #f1f5f9;display:flex;gap:8px;flex-wrap:wrap">
            <div style="display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#1d6aba,#0a2463);color:#fff;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:600;flex:1;justify-content:center;min-width:140px">
              📄 Download PDF
            </div>
            <div style="display:inline-flex;align-items:center;gap:6px;background:#f1f5f9;color:#0a2463;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:600;flex:1;justify-content:center;min-width:120px">
              🔁 Request Refill
            </div>
          </div>
        </div>
      ` : rx.map((p) => {
        const expired = p.expiresAt && new Date(p.expiresAt) < new Date();
        const issuedDate = formatDate(p.issuedAt || p.createdAt);
        const expiresDate = p.expiresAt ? formatDate(p.expiresAt) : 'No expiry';
        const doctorName = formatDoctorName(p.doctor, { surnameOnly: false });
        const meds = p.medications || [];

        return `
          <div style="background:#fff;border-radius:16px;border:1.5px solid ${expired ? '#fecaca' : '#e2e8f0'};margin-bottom:16px;overflow:hidden;box-shadow:0 1px 4px rgba(10,36,99,0.06)">

            <!-- Header -->
            <div style="background:${expired ? 'linear-gradient(135deg,#fef2f2,#fee2e2)' : 'linear-gradient(135deg,#eff6ff,#dbeafe)'};padding:14px 18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
              <div style="display:flex;align-items:center;gap:10px">
                <span style="font-size:24px">💊</span>
                <div>
                  <div style="font-size:14px;font-weight:700;color:#0a2463">Dr. ${escapeHtml(doctorName)}</div>
                  <div style="font-size:12px;color:#64748b">Issued ${issuedDate}</div>
                </div>
              </div>
              <span style="font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;${expired ? 'background:#fecaca;color:#dc2626' : 'background:#bbf7d0;color:#16a34a'}">
                ${expired ? '⚠️ Expired' : '✅ Active'}
              </span>
            </div>

            <!-- Medications -->
            <div style="padding:16px 18px">
              <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">Medications</div>
              ${meds.map((m, i) => `
                <div style="display:flex;gap:12px;padding:12px;background:#f8fafc;border-radius:10px;margin-bottom:8px;border-left:3px solid #1d6aba">
                  <div style="font-size:18px;flex-shrink:0">💉</div>
                  <div style="flex:1;min-width:0">
                    <div style="font-size:14px;font-weight:700;color:#0a2463">${escapeHtml(m.name)} <span style="font-weight:400;color:#64748b">${escapeHtml(m.dosage || '')}</span></div>
                    <div style="font-size:12px;color:#64748b;margin-top:2px">
                      ${m.frequency ? `🕐 ${escapeHtml(m.frequency)}` : ''} 
                      ${m.duration ? `· 📅 ${escapeHtml(m.duration)}` : ''} 
                      ${m.refillsAllowed ? `· 🔁 ${m.refillsAllowed} refill${m.refillsAllowed > 1 ? 's' : ''}` : ''}
                    </div>
                    ${m.notes ? `<div style="font-size:12px;color:#7c3aed;margin-top:4px;font-style:italic">📝 ${escapeHtml(m.notes)}</div>` : ''}
                  </div>
                </div>
              `).join('')}

              ${p.notes ? `
                <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px;margin-top:8px">
                  <div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:4px">📋 Doctor's Notes</div>
                  <div style="font-size:13px;color:#78350f">${escapeHtml(p.notes)}</div>
                </div>
              ` : ''}

              <div style="font-size:12px;color:#94a3b8;margin-top:10px">
                🗓️ Expires: ${expiresDate} · Specialty: ${escapeHtml(p.doctor?.specialty || 'General Practice')}
              </div>
            </div>

            <!-- Actions -->
            <div style="padding:12px 18px;border-top:1px solid #f1f5f9;display:flex;gap:8px;flex-wrap:wrap">
              <button type="button" class="btn-download-rx" data-download-rx="${p._id}" style="display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#1d6aba,#0a2463);color:#fff;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer;flex:1;justify-content:center;min-width:140px">
                📄 Download PDF
              </button>
              ${!expired ? `
                <button type="button" class="btn btn-sm btn-secondary" data-refill="${p._id}" style="flex:1;min-width:120px;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer">
                  🔁 Request Refill
                </button>
              ` : `
                <button type="button" data-book-flow style="display:inline-flex;align-items:center;gap:6px;background:#f1f5f9;color:#0a2463;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer;flex:1;justify-content:center;min-width:120px">
                  📅 Book New Consult
                </button>
              `}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  bindLinks(el);
  bindBookFlow(el);

  el.querySelectorAll('[data-refill]').forEach((b) => {
    b.onclick = async () => {
      await prescriptionsApi.refillRequest(b.dataset.refill);
      toast('Refill request sent ✅', 'success');
    };
  });

  el.querySelectorAll('[data-download-rx]').forEach((b) => {
    b.addEventListener('click', () => downloadPrescription(b.dataset.downloadRx));
  });
}

async function renderRecords(el) {
  const records = (await patientsApi.records()).data.records || [];
  const doctors = (await doctorsApi.list()).data.doctors || [];
  el.innerHTML = `<h1>Medical Records</h1>
    <div class="alert" style="background:#fef3c7;color:#92400e;margin-bottom:16px">Your records are private. Share only with doctors you trust.</div>
    <div class="upload-drop-zone" id="dropZone">
      <div class="upload-icon">📁</div>
      <p>Drag & drop files here or <strong>click to browse</strong></p>
      <p style="font-size:12px;margin-top:8px">JPG, PNG, PDF — max 2MB</p>
      <input type="file" id="rec-file" accept=".pdf,.jpg,.jpeg,.png" style="display:none">
    </div>
    ${records.map((r) => `<div class="card" style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
      <div>📄 ${escapeHtml(r.fileName)}<div class="text-muted">${formatDate(r.uploadedAt)}</div></div>
      <div><select class="share-doc" data-id="${r._id}"><option value="">Share with…</option>
        ${doctors.map((d) => `<option value="${d._id}">${escapeHtml(formatDoctorName(d, { surnameOnly: true }))}</option>`).join('')}</select>
      <button class="btn btn-sm btn-primary share-btn" data-id="${r._id}">Share</button></div></div>`).join('') || '<div class="empty-state card">No records yet</div>'}`;
  const dropZone = el.querySelector('#dropZone');
  const fileInput = el.querySelector('#rec-file');
  async function handleFileUpload(files) {
    const f = files[0];
    if (!f) return;
    if (f.size > MAX_RECORD_FILE_SIZE) {
      toast('File too large. Maximum size is 2MB. Please compress your file and try again.', 'error');
      return;
    }
    await uploadApi.medicalRecord(f);
    toast('Uploaded', 'success');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFileUpload(e.dataTransfer.files);
  });
  fileInput.onchange = () => handleFileUpload(fileInput.files);
  el.querySelectorAll('.share-btn').forEach((b) => b.onclick = async () => {
    const sel = el.querySelector(`.share-doc[data-id="${b.dataset.id}"]`);
    if (!sel.value) return;
    await patientsApi.shareRecord(b.dataset.id, sel.value);
    toast('Permission granted', 'success');
  });
}

async function renderPayments(el) {
  const payments = (await patientsApi.payments()).data.payments || [];
  const spent = payments.reduce((s, p) => s + (p.finalAmount || 0), 0);
  const saved = payments.reduce((s, p) => s + (p.discountAmount || 0), 0);
  const pending = payments
    .filter((p) => p.status !== 'completed' && p.status !== 'paid')
    .reduce((s, p) => s + (p.finalAmount || 0), 0);

  const quickPaySpecialties = [
    { icon: '🩺', name: 'General Practice', price: '₦5,000', specialty: 'General Practice' },
    { icon: '❤️', name: 'Cardiology', price: '₦15,000', specialty: 'Cardiology' },
    { icon: '🧠', name: 'Psychiatry', price: '₦12,000', specialty: 'Psychiatry' },
    { icon: '👶', name: 'Pediatrics', price: '₦8,000', specialty: 'Pediatrics' },
    { icon: '🔬', name: 'Dermatology', price: '₦10,000', specialty: 'Dermatology' },
    { icon: '🧬', name: 'Neurology', price: '₦18,000', specialty: 'Neurology' }
  ];

  el.innerHTML = `
    <div class="make-payment-section">
      <div class="payment-page-header">
        <div>
          <h2>Payments</h2>
          <p>Manage your consultations and payment history</p>
        </div>
      </div>

      <div class="payment-summary-grid">
        <div class="payment-summary-card">
          <div class="psc-icon">💰</div>
          <div class="psc-label">Total Spent</div>
          <div class="psc-value" id="totalSpent">${formatCurrency(spent)}</div>
        </div>
        <div class="payment-summary-card success">
          <div class="psc-icon">🎉</div>
          <div class="psc-label">Total Saved</div>
          <div class="psc-value" id="totalSaved">${formatCurrency(saved)}</div>
          <div class="psc-note">25% returning discount</div>
        </div>
        <div class="payment-summary-card info">
          <div class="psc-icon">⏳</div>
          <div class="psc-label">Pending</div>
          <div class="psc-value" id="pendingPayments">${formatCurrency(pending)}</div>
        </div>
      </div>

      <div class="quick-pay-section">
        <h3>Quick Book & Pay</h3>
        <p style="color:var(--muted);font-size:14px;margin-bottom:16px">
          Choose a specialty and pay for your next consultation instantly
        </p>
        <div class="quick-pay-grid">
          ${quickPaySpecialties.map((s) => `
            <div class="quick-pay-card" data-specialty-pay="${escapeHtml(s.specialty)}">
              <div class="qpc-icon">${s.icon}</div>
              <div class="qpc-name">${s.name}</div>
              <div class="qpc-price">${s.price}</div>
              <div class="qpc-action">Book & Pay →</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="returning-discount-notice">
        <span class="rdn-icon">🎁</span>
        <div>
          <strong>Returning Patient Discount Active!</strong>
          <p>As a returning patient, you automatically save <strong>25%</strong> on every consultation.</p>
        </div>
      </div>

      <div class="payment-history-section">
        <h3>Payment History</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Doctor</th><th>Gross</th><th>Discount</th><th>Final</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${payments.length
                ? payments.map((p) => `<tr>
                    <td>${formatDate(p.createdAt)}</td>
                    <td>${escapeHtml(formatDoctorName(p.doctor, { surnameOnly: true }))}</td>
                    <td>${formatCurrency(p.grossAmount)}</td>
                    <td>${formatCurrency(p.discountAmount)}</td>
                    <td>${formatCurrency(p.finalAmount)}</td>
                    <td>${statusBadge(p.status === 'completed' ? 'paid' : p.status)}</td>
                  </tr>`).join('')
                : '<tr><td colspan="6" class="text-muted">No payments yet</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div class="payment-bottom-cta">
        <div class="payment-cta-content">
          <div class="payment-cta-left">
            <h3>Ready for your next consultation?</h3>
            <p>Book with an MDCN-certified Nigerian doctor today. As a returning patient, your 25% discount is automatically applied at checkout.</p>
            <div class="payment-cta-pills">
              <span class="cta-pill">✅ Secure Paystack payment</span>
              <span class="cta-pill">🎁 25% returning discount</span>
              <span class="cta-pill">⚡ Instant confirmation</span>
            </div>
          </div>
          <div class="payment-cta-right">
            <button type="button" class="btn-cta-pay" id="btn-cta-pay">💳 Make a Payment</button>
            <p class="cta-sub">Choose specialty → Pick doctor → Pay securely</p>
          </div>
        </div>
      </div>
    </div>
  `;

  el.querySelector('#btn-cta-pay')?.addEventListener('click', () => {
    window.openBookingFlow?.();
  });
  el.querySelectorAll('[data-specialty-pay]').forEach((card) => {
    card.addEventListener('click', () => {
      window.openBookingFlowWithSpecialty?.(card.dataset.specialtyPay);
    });
  });
}

async function renderReviews(el) {
  let selectedStars = 0;
  let selectedTags = [];

  const historyRes = await patientsApi.history(1);
  const completed = (historyRes.data.appointments || []).filter((a) => a.status === 'completed');
  const doctorMap = new Map();
  completed.forEach((a) => {
    if (a.doctor?._id) doctorMap.set(a.doctor._id, a.doctor);
  });

  const reviewTags = ['Clear Explanation', 'Very Helpful', 'On Time', 'Compassionate', 'Thorough', 'Professional', 'Good Listener', 'Highly Recommend'];

  el.innerHTML = `
    <h1>My Reviews</h1>
    <div class="write-review-card">
      <h3>Write a Review</h3>
      <p style="color:var(--muted);font-size:14px;margin-bottom:16px">Share your experience to help other Nigerian patients</p>
      <div class="form-group">
        <label>Select Doctor</label>
        <select id="reviewDoctorSelect" class="review-select">
          <option value="">Choose a doctor you consulted...</option>
          ${[...doctorMap.entries()].map(([id, doc]) =>
            `<option value="${id}">${escapeHtml(formatDoctorName(doc))} — ${escapeHtml(doc.specialty || '')}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Your Rating</label>
        <div class="star-picker" id="starPicker">
          ${[1, 2, 3, 4, 5].map((n) => `<span class="star" data-value="${n}">☆</span>`).join('')}
        </div>
      </div>
      <div class="form-group">
        <label>Your Review</label>
        <textarea id="reviewText" rows="4" class="review-textarea"
          placeholder="Describe your experience with this doctor. Was the consultation helpful? Did they explain things clearly?"></textarea>
      </div>
      <div class="form-group">
        <label>Tags (select all that apply)</label>
        <div class="review-tags">
          ${reviewTags.map((tag) => `<span class="review-tag" data-tag="${escapeHtml(tag)}">${tag}</span>`).join('')}
        </div>
      </div>
      <button type="button" class="btn-submit-review" id="submit-review-btn">Submit Review</button>
    </div>
    <div id="reviews-history">
      ${completed.length
        ? '<h2 style="margin-bottom:16px;font-size:1.1rem">Consultations You Can Review</h2>'
          + completed.map((a) => `<div class="card" style="margin-bottom:8px">
            <strong>${escapeHtml(formatDoctorName(a.doctor, { surnameOnly: true }))}</strong> · ${escapeHtml(a.specialty)}
            <div class="text-muted">${formatDate(a.scheduledAt)}</div></div>`).join('')
        : '<div class="card"><p class="text-muted">Complete a consultation to leave a review for your doctor.</p></div>'}
    </div>
  `;

  const starPicker = el.querySelector('#starPicker');
  starPicker?.querySelectorAll('.star').forEach((star) => {
    star.addEventListener('click', () => {
      selectedStars = parseInt(star.dataset.value, 10);
      starPicker.querySelectorAll('.star').forEach((s, i) => {
        s.textContent = i < selectedStars ? '★' : '☆';
        s.classList.toggle('active', i < selectedStars);
      });
    });
    star.addEventListener('mouseover', () => {
      const val = parseInt(star.dataset.value, 10);
      starPicker.querySelectorAll('.star').forEach((s, i) => {
        s.textContent = i < val ? '★' : '☆';
      });
    });
  });
  starPicker?.addEventListener('mouseleave', () => {
    starPicker.querySelectorAll('.star').forEach((s, i) => {
      s.textContent = i < selectedStars ? '★' : '☆';
    });
  });

  el.querySelectorAll('.review-tag').forEach((tagEl) => {
    tagEl.addEventListener('click', () => {
      tagEl.classList.toggle('selected');
      const tag = tagEl.dataset.tag;
      if (tagEl.classList.contains('selected')) {
        if (!selectedTags.includes(tag)) selectedTags.push(tag);
      } else {
        selectedTags = selectedTags.filter((t) => t !== tag);
      }
    });
  });

  el.querySelector('#submit-review-btn')?.addEventListener('click', async () => {
    const doctorId = el.querySelector('#reviewDoctorSelect')?.value;
    const comment = el.querySelector('#reviewText')?.value?.trim();

    if (!doctorId) {
      toast('Please select a doctor', 'warning');
      return;
    }
    if (!selectedStars) {
      toast('Please select a star rating', 'warning');
      return;
    }
    if (!comment || comment.length < 20) {
      toast('Please write at least 20 characters in your review', 'warning');
      return;
    }

    try {
      await reviewsApi.create({ doctorId, rating: selectedStars, comment, tags: selectedTags });
      toast('Thank you! Your review has been submitted. ⭐', 'success');
      selectedStars = 0;
      selectedTags = [];
      el.querySelector('#reviewText').value = '';
      starPicker?.querySelectorAll('.star').forEach((s) => { s.textContent = '☆'; s.classList.remove('active'); });
      el.querySelectorAll('.review-tag').forEach((t) => t.classList.remove('selected'));
    } catch {
      toast('Could not submit review. Please try again.', 'error');
    }
  });
}

async function renderProfile(el, user) {
  const profileRes = await patientsApi.profile().catch(() => null);
  const profile = profileRes?.data?.profile || user;

  el.innerHTML = `
    <h1>Profile</h1>
    <div class="card profile-card" style="max-width:560px">
      ${getAvatarSectionHTML()}
      <form id="prof-form">
        <div class="grid grid-2" style="gap:12px">
          <div class="form-group"><label>First Name</label><input name="name" value="${escapeHtml(profile.name)}"></div>
          <div class="form-group"><label>Surname</label><input name="surname" value="${escapeHtml(profile.surname)}"></div>
        </div>
        <div class="form-group"><label>Phone</label><input name="phone" value="${escapeHtml(profile.phone || '')}"></div>
        <div class="form-group"><label>Medical History Notes</label><textarea name="medicalHistoryNotes" rows="3">${escapeHtml(profile.medicalHistoryNotes || '')}</textarea></div>
        <button type="submit" class="btn btn-primary">Save Changes</button>
      </form>
    </div>
  `;

  initAvatarSelector(el, profile);

  el.querySelector('#prof-form').onsubmit = async (e) => {
    e.preventDefault();
    await patientsApi.updateProfile(Object.fromEntries(new FormData(e.target)));
    toast('Profile saved', 'success');
  };
}

function bindLinks(el) {
  el.querySelectorAll('[data-link]').forEach((a) => {
    a.addEventListener('click', (e) => { e.preventDefault(); window.location.hash = a.getAttribute('href'); });
  });
  bindBookFlow(el);
}
