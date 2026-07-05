import { appointmentsApi } from '../shared/api.js';
import { getRole, getUser } from '../shared/api.js';
import { joinAppointment, startSessionTimer, onSessionWarning, onSessionEnd, endSession } from '../shared/socket.js';
import { toast } from '../shared/toast.js';
import { formatDoctorName } from '../shared/utils.js';
import { setDoctorInSession, setDoctorAvailableAfterSession } from '../doctor/status.js';
const SESSION_END_MIN = 55;
const WARN_45 = 45;
const WARN_50 = 50;

export async function initVideoCall(container, appointmentId) {
  document.getElementById('site-header')?.classList.add('hidden');

  container.innerHTML = `
    <div class="video-fullscreen">
      <div class="video-top-bar">
        <span id="call-name">Connecting…</span>
        <span class="live-timer" id="live-timer">00:00</span>
        <span class="live-badge">🔴 Live · HD</span>
      </div>
      <div class="video-main" id="video-main">
        <div id="daily-container" class="video-area"></div>
        <div class="self-preview" id="self-preview">You</div>
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

  function endCall() {
    clearInterval(timer);
    const user = getUser();
    const role = getRole();
    endSession(appointmentId, role === 'doctor' ? user._id : undefined);
    if (role === 'doctor') setDoctorAvailableAfterSession();    container.innerHTML = `<div class="post-call"><h2>Session Complete</h2><p>Thank you for using Virtualcare.</p>
      ${getRole() === 'patient' ? '<p>How was your consultation?</p><div>⭐⭐⭐⭐⭐</div><textarea placeholder="Leave a comment…" rows="3" style="width:100%;margin:12px 0"></textarea>' : ''}
      <button type="button" id="post-call-done" class="btn btn-primary">Done</button>
      ${getRole() === 'patient' ? '<button type="button" id="post-call-followup" class="btn btn-secondary">Book Follow-up</button>' : ''}
    </div>`;
    setTimeout(() => {
      document.getElementById('post-call-done')?.addEventListener('click', () => {
        window.location.hash = getRole() === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });
      document.getElementById('post-call-followup')?.addEventListener('click', () => {
        window.location.hash = '/book';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });
    }, 100);
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

    joinAppointment(appointmentId);    startSessionTimer(appointmentId);
    onSessionWarning((p) => showWarn(p.message, 'warn-yellow'));
    onSessionEnd(() => endCall());

    const roomRes = await appointmentsApi.videoRoom(appointmentId);
    await loadDaily(roomRes.data.videoRoomUrl);
  } catch (e) {
    container.querySelector('#daily-container').innerHTML = `<p style="color:#fff;padding:40px">${e.message}</p>`;
  }

  container.querySelector('#vc-mute').onclick = () => { muted = !muted; toast(muted ? 'Muted' : 'Unmuted', 'info'); };
  container.querySelector('#vc-cam').onclick = () => { camOn = !camOn; toast(camOn ? 'Camera on' : 'Camera off', 'info'); };
  container.querySelector('#vc-end').onclick = endCall;
}

async function loadDaily(url) {
  const el = document.getElementById('daily-container');
  if (!url) { el.innerHTML = '<p style="color:#fff">Video room unavailable</p>'; return; }
  if (!window.DailyIframe) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/@daily-co/daily-js';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  try {
    const frame = window.DailyIframe.createFrame(el, { iframeStyle: { width: '100%', height: '100%', border: 'none' } });
    await frame.join({ url });
  } catch {
    el.innerHTML = `<iframe src="${url}" allow="camera;microphone;fullscreen" style="width:100%;height:100%;border:none"></iframe>`;
  }
}
