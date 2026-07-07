import { getUser } from '../shared/api.js';
import { doctorsApi, appointmentsApi, messagesApi } from '../shared/api.js';
import { renderDoctorMessages } from './messages.js';
import { renderDoctorPrescriptions } from './prescriptions.js';
import { renderPatients } from './patients.js';
import { renderSchedule } from './schedule.js';
import { renderDoctorPayouts } from './payouts.js';
import { renderDoctorCredentials } from './credentials.js';
import { renderDoctorMedicalRecords } from './records.js';
import { renderDoctorProfile } from './profile.js';
import { renderDoctorSettings } from './settings.js';
import { renderDoctorReviews } from './reviews.js';
import { setDoctorInSession, updateDoctorStatusUI } from './status.js';
import { renderDoctorShell, bindShellEvents } from '../shared/layout.js';
import { formatDate, formatCurrency, statusBadge, escapeHtml, formatDoctorName } from '../shared/utils.js';
import { connectSocket, joinDoctor, emitDoctorStatus } from '../shared/socket.js';
import { joinCall, renderCallUI } from '../shared/videoCall.js';
import { toast } from '../shared/toast.js';

const DEMO_QUEUE_PATIENTS = [
  { name: 'Amaka Obi', time: 'Today at 10:00', type: 'video', risk: 'Low', condition: 'Hypertension follow-up', waitTime: 'Next' },
  { name: 'Emeka Nwosu', time: 'Today at 11:00', type: 'video', risk: 'Medium', condition: 'Chest pain assessment', waitTime: '1hr' },
  { name: 'Fatima Aliyu', time: 'Today at 12:00', type: 'audio', risk: 'Low', condition: 'Blood pressure review', waitTime: '2hr' },
  { name: 'Chukwudi Eze', time: 'Today at 14:00', type: 'video', risk: 'High', condition: 'Cardiac arrhythmia', waitTime: '4hr' },
  { name: 'Ngozi Adeleke', time: 'Today at 15:00', type: 'video', risk: 'Medium', condition: 'Post-surgery review', waitTime: '5hr' }
];

const DEMO_EARNINGS = [
  { month: 'Dec', amount: 180000 },
  { month: 'Jan', amount: 220000 },
  { month: 'Feb', amount: 195000 },
  { month: 'Mar', amount: 310000 },
  { month: 'Apr', amount: 275000 },
  { month: 'May', amount: 340000 },
  { month: 'Jun', amount: 420000 }
];

const RISK_COLORS = {
  Low: { bg: '#dcfce7', color: '#166534' },
  Medium: { bg: '#fef3c7', color: '#92400e' },
  High: { bg: '#fee2e2', color: '#991b1b' }
};

function isCallEligible(status) {
  return status === 'confirmed';
}

function renderCallButtons(appointmentId) {
  return `
    <div style="display:flex;gap:8px;margin-top:12px;">
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

window.startCall = async (appointmentId, mode) => {
  try {
    console.log('[startCall] Starting', mode, 'call for', appointmentId);
    document.body.insertAdjacentHTML('beforeend', renderCallUI(appointmentId, mode));
    const result = await joinCall(appointmentId, mode);
    console.log('[startCall] Result:', result);
    if (!result.success) {
      document.getElementById('vc-call-container')?.remove();
      toast('Could not start call: ' + (result.error || 'Unknown error'), 'error');
    }
  } catch(e) {
    console.error('[startCall] Error:', e);
    document.getElementById('vc-call-container')?.remove();
    toast('Call error: ' + e.message, 'error');
  }
};

function buildQueueItems(appointments) {
  const risks = ['Low', 'Medium', 'High'];
  const items = appointments.map((a, index) => ({
    name: `${a.patient?.name || ''} ${a.patient?.surname || ''}`.trim() || 'Patient',
    time: formatDate(a.scheduledAt),
    type: a.sessionType || 'video',
    risk: risks[index % risks.length],
    condition: a.notes || 'General consultation',
    waitTime: index === 0 ? 'Next' : `${index}hr`,
    id: a._id,
    status: a.status
  }));

  const usedNames = new Set(items.map((i) => i.name));
  for (const demo of DEMO_QUEUE_PATIENTS) {
    if (items.length >= 5) break;
    if (!usedNames.has(demo.name)) {
      items.push({ ...demo, id: `demo-${items.length}` });
      usedNames.add(demo.name);
    }
  }
  return items;
}

function renderQueueItem(patient, index) {
  const risk = RISK_COLORS[patient.risk] || RISK_COLORS.Low;
  const avatarInitials = patient.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const isDemo = String(patient.id).startsWith('demo');
  const startBtn = isDemo
    ? `<button type="button" class="btn-queue-start" data-session-start data-demo>▶ Start</button>`
    : `<a href="/video/${patient.id}" class="btn-queue-start" data-session-start>▶ Start</a>`;
  const completeBtn = isDemo
    ? `<button type="button" class="btn-queue-complete" data-demo-done>✓ Done</button>`
    : `<button type="button" class="btn-queue-complete" data-done="${patient.id}">✓ Done</button>`;
  const callBtns = !isDemo && isCallEligible(patient.status)
    ? renderCallButtons(patient.id)
    : '';

  return `
    <div class="queue-item">
      <div class="queue-position">${index + 1}</div>
      <div class="queue-avatar">${avatarInitials}</div>
      <div class="queue-info">
        <div class="queue-name">${escapeHtml(patient.name)}</div>
        <div class="queue-details">${escapeHtml(patient.time)} · ${escapeHtml(patient.type)} · ${escapeHtml(patient.condition)}</div>
        ${callBtns}
      </div>
      <div class="queue-wait">${escapeHtml(patient.waitTime)}</div>
      <span class="queue-risk" style="background:${risk.bg};color:${risk.color}">${patient.risk} Risk</span>
      <div class="queue-actions">${startBtn}${completeBtn}</div>
    </div>`;
}

function resolveMonthlyEarnings(monthlyRes) {
  let monthlyData = monthlyRes?.data || monthlyRes || [];
  if (!Array.isArray(monthlyData)) monthlyData = [];
  const allZero = monthlyData.length === 0 || monthlyData.every((d) => !d.amount);
  return allZero ? DEMO_EARNINGS : monthlyData;
}
export async function renderDoctorPage(container, path) {
  const user = getUser();
  connectSocket(user, 'doctor');
  joinDoctor(user._id);
  const tab = path.replace('/doctor/', '') || 'dashboard';
  container.innerHTML = renderDoctorShell(path, '<div class="page-loading">Loading...</div>', user);
  const contentEl = container.querySelector('.dash-content');

  bindShellEvents(container, {
    onStatus: async (status) => {
      updateDoctorStatusUI(status);
      await doctorsApi.updateAvailability(status);
      emitDoctorStatus(status);
      const labels = { green: '🟢 Available', amber: '🟡 Busy', red: '🔴 In Session' };
      toast(`Status updated: ${labels[status]}`, 'success');
    }
  });
  try {
    switch (tab) {
      case 'dashboard': await renderOverview(contentEl, user); break;
      case 'patients': await renderPatients(contentEl); break;
      case 'schedule': await renderSchedule(contentEl, user); break;
      case 'messages': await renderDoctorMessages(contentEl); break;
      case 'prescriptions': await renderDoctorPrescriptions(contentEl); break;
      case 'payouts': await renderDoctorPayouts(contentEl); break;
      case 'credentials': await renderDoctorCredentials(contentEl, user); break;
      case 'reviews': await renderDoctorReviews(contentEl); break;
      case 'records': await renderDoctorMedicalRecords(contentEl); break;
      case 'profile': await renderDoctorProfile(contentEl, user); break;
      case 'settings': await renderDoctorSettings(contentEl); break;
      default: contentEl.innerHTML = '<p>Page not found</p>';
    }
  } catch (e) {
    contentEl.innerHTML = `<div class="alert alert-error">${escapeHtml(e.message)}</div>`;
    toast(e.message, 'error');
  }
}

async function renderOverview(el, user) {
  const [upcoming, earnings, monthlyRes] = await Promise.all([
    doctorsApi.upcoming(), doctorsApi.earnings(), doctorsApi.earningsMonthly()
  ]);
  const appointments = upcoming.data.appointments || [];
  const queueItems = buildQueueItems(appointments);
  const monthlyData = resolveMonthlyEarnings(monthlyRes);
  const maxAmount = Math.max(...monthlyData.map((d) => d.amount), 1);

  el.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-icon">📅</div><div class="kpi-label">Today</div><div class="kpi-value">${queueItems.length}</div></div>
      <div class="kpi-card"><div class="kpi-icon">💰</div><div class="kpi-label">Revenue</div><div class="kpi-value">${formatCurrency(earnings.data.totalEarnings)}</div></div>
      <div class="kpi-card"><div class="kpi-icon">⭐</div><div class="kpi-label">Rating</div><div class="kpi-value">${user.rating}</div></div>
      <div class="kpi-card"><div class="kpi-icon">👥</div><div class="kpi-label">Consultations</div><div class="kpi-value">${user.totalConsultations || 0}</div></div>
    </div>
    <h2>Today's Queue</h2>
    <div class="queue-list">${queueItems.map((p, i) => renderQueueItem(p, i)).join('')}</div>
    <h2 style="margin-top:24px">Earnings (last 7 months)</h2>
    <div class="chart-container">${monthlyData.map((d) => {
      const height = Math.max(8, (d.amount / maxAmount) * 100);
      return `
      <div class="bar-group">
        <div class="bar-wrap">
          <div class="bar chart-bar" style="height:${height}%" data-amount="${formatCurrency(d.amount)}"></div>
        </div>
        <span class="bar-label">${d.month}</span>
      </div>`;
    }).join('')}</div>
    <p class="text-muted">${escapeHtml(user.bio || '')}</p>
    <div class="dc-tags">${(user.tags || []).map((t) => `<span>${escapeHtml(t)}</span>`).join('')}</div>
  `;
  bindQueueActions(el);
}

function bindQueueActions(el) {
  el.querySelectorAll('[data-done]').forEach((b) => b.onclick = async () => {
    await appointmentsApi.complete(b.dataset.done);
    toast('Completed', 'success');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
  el.querySelectorAll('[data-demo-done]').forEach((b) => {
    b.onclick = () => toast('Demo appointment marked complete', 'success');
  });
  el.querySelectorAll('[data-session-start]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      await setDoctorInSession();
      if (btn.hasAttribute('data-demo')) {
        toast('Demo session started — status set to In Session', 'info');
        return;
      }
      const href = btn.getAttribute('href');
      if (href) {
        window.location.hash = href;
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }
    });
  });
}
function bindLinks(el) {
  el.querySelectorAll('[data-link]').forEach((a) => {
    a.addEventListener('click', (e) => { e.preventDefault(); window.location.hash = a.getAttribute('href'); });
  });
}
