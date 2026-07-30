import { appointmentsApi } from '../shared/api.js';
import { getRole, getUser } from '../shared/api.js';
import { joinAppointment, startSessionTimer, onSessionWarning, onSessionEnd, endSession } from '../shared/socket.js';
import { toast } from '../shared/toast.js';
import { formatDoctorName } from '../shared/utils.js';
import { setDoctorInSession, setDoctorAvailableAfterSession } from '../doctor/status.js';
import { joinCall, leaveCall, forceCleanup, toggleMute as agoraToggleMute, toggleVideo as agoraToggleVideo } from '../shared/videoCall.js';
const SESSION_END_MIN = 55;
const WARN_45 = 45;
const WARN_50 = 50;

let activeVideoCallId = null;

export async function initVideoCall(container, appointmentId) {
  if (activeVideoCallId === appointmentId) {
    console.warn('initVideoCall already active for this appointment — ignoring duplicate');
    return;
  }
  activeVideoCallId = appointmentId;
  document.getElementById('site-header')?.classList.add('hidden');

  container.innerHTML = `
    <div class="video-fullscreen">
      <div class="video-top-bar">
        <span id="call-name">Connecting…</span>
        <span class="live-timer" id="live-timer">00:00</span>
        <span class="live-badge">🔴 Live · HD</span>
      </div>
      <div class="video-main" id="video-main">
        <div id="remote-video" class="video-area"></div>
        <div id="local-video" class="self-preview" id="self-preview"></div>
        <div id="session-warn" class="session-warn hidden"></div>
      </div>
      <p class="session-note">Session time: 45–55 minutes</p>
      <div class="video-controls-bar">
        <button class="vc-btn" id="vc-mute">🎤</button>
        <button class="vc-btn" id="vc-cam">📹</button>
        <button class="vc-btn" id="vc-share">🖥️</button>
        <button class="vc-btn" id="vc-chat">💬</button>
        <button class="vc-btn vc-end" id="vc-end">📞 End</button>
      </div>
    </div>
  `;

  let startTime = Date.now();
  let muted = false;
  let camOn = true;
  const timerEl = container.querySelector('#live-timer');
  const warnEl = container.querySelector('#session-warn');

  const timer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    timerEl.textContent = `${m}:${s}`;
    const mins = elapsed / 60;
    if (mins >= WARN_45 && mins < WARN_45 + 0.1) showWarn('10 minutes remaining', 'warn-yellow');
    if (mins >= WARN_50 && mins < WARN_50 + 0.1) showWarn('5 minutes remaining', 'warn-amber');
    if (mins >= SESSION_END_MIN) endCall();
  }, 1000);

  function showWarn(msg, cls) {
    warnEl.textContent = msg;
    warnEl.className = `session-warn ${cls}`;
    warnEl.classList.remove('hidden');
    toast(msg, 'warning');
  }

  let hasEnded = false;
  async function endCall() {
    if (hasEnded) return;
    hasEnded = true;
    clearInterval(timer);
    const user = getUser();
    const role = getRole();
    activeVideoCallId = null;
    await leaveCall(appointmentId);
    endSession(appointmentId, role === 'doctor' ? user._id : undefined);
    if (role === 'doctor') setDoctorAvailableAfterSession();
    container.innerHTML = `<div class="post-call"><h2>Session Complete</h2><p>Thank you for using Virtualcare.</p>
      ${getRole() === 'patient' ? '<p>How was your consultation?</p><div>⭐⭐⭐⭐⭐</div><textarea placeholder="Leave a comment…" rows="3" style="width:100%;margin:12px 0"></textarea>' : ''}
      <a href="${getRole() === 'doctor' ? '/doctor/dashboard' : '/patient/upcoming'}" data-link class="btn btn-primary">Done</a>
      ${getRole() === 'patient' ? '<a href="/patient/book" data-link class="btn btn-secondary">Book Follow-up</a>' : ''}
    </div>`;
    container.querySelectorAll('[data-link]').forEach((a) => {
      a.onclick = (e) => { e.preventDefault(); window.location.hash = a.getAttribute('href'); window.dispatchEvent(new HashChangeEvent('hashchange')); };
    });
    document.getElementById('site-header')?.classList.remove('hidden');
  }

  try {
    const appt = await appointmentsApi.get(appointmentId);
    const a = appt.data.appointment;
    const name = getRole() === 'doctor'
      ? `${a.patient?.name} ${a.patient?.surname}`
      : formatDoctorName(a.doctor, { surnameOnly: true });
    container.querySelector('#call-name').textContent = name;

    if (getRole() === 'doctor') {
      const alreadyInSession = document.querySelector('.hex-status-ring.status-red, .status-ring-lg.status-red');
      await setDoctorInSession({ notify: !alreadyInSession });
    }

    joinAppointment(appointmentId);
    startSessionTimer(appointmentId);
    onSessionWarning((p) => showWarn(p.message, 'warn-yellow'));
    onSessionEnd(() => endCall());

    await forceCleanup();
    const result = await joinCall(appointmentId, 'video');
    if (!result.success) {
      container.querySelector('#remote-video').innerHTML = `<p style="color:#fff;padding:40px">${result.error}</p>`;
    }
  } catch (e) {
    container.querySelector('#remote-video').innerHTML = `<p style="color:#fff;padding:40px">${e.message}</p>`;
  }

  container.querySelector('#vc-mute').onclick = async () => {
    muted = await agoraToggleMute();
    toast(muted ? 'Muted' : 'Unmuted', 'info');
  };
  container.querySelector('#vc-cam').onclick = async () => {
    const disabled = await agoraToggleVideo();
    camOn = !disabled;
    toast(camOn ? 'Camera on' : 'Camera off', 'info');
  };
  container.querySelector('#vc-end').onclick = endCall;
}
