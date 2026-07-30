import { appointmentsApi, getRole, getUser } from '../shared/api.js';
import { joinAppointment, startSessionTimer, onSessionWarning, onSessionEnd, endSession } from '../shared/socket.js';
import { toast } from '../shared/toast.js';
import { formatDoctorName } from '../shared/utils.js';
import { setDoctorInSession, setDoctorAvailableAfterSession } from '../doctor/status.js';

const SESSION_END_MIN = 55;
const WARN_45 = 45;
const WARN_50 = 50;

let activeVideoCallId = null;

function loadDailySDK() {
  return new Promise((resolve, reject) => {
    if (window.DailyIframe) return resolve();
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@daily-co/daily-js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export async function initVideoCall(container, appointmentId, mode = 'video') {
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
        <span class="live-timer" id="live-timer">45:00</span>
        <span class="live-badge">🔴 Live · HD</span>
      </div>
      <div class="video-main" id="video-main">
        <div id="remote-video" class="video-area"></div>
        <div id="session-warn" class="session-warn hidden"></div>
      </div>
      <p class="session-note">Session time: 45–55 minutes</p>
      <div class="video-controls-bar">
        <button class="vc-btn" id="vc-mute">🎤</button>
        <button class="vc-btn" id="vc-cam">📹</button>
        <button class="vc-btn vc-end" id="vc-end">📞 End</button>
      </div>
    </div>
  `;

  let startTime = Date.now();
  let muted = false;
  let camOn = mode === 'video';
  let frame = null;
  const timerEl = container.querySelector('#live-timer');
  const warnEl = container.querySelector('#session-warn');

  const TOTAL_SECONDS = 45 * 60;
  const timer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const remaining = Math.max(0, TOTAL_SECONDS - elapsed);
    const m = String(Math.floor(remaining / 60)).padStart(2, '0');
    const s = String(remaining % 60).padStart(2, '0');
    timerEl.textContent = `${m}:${s}`;
    if (remaining === 600) showWarn('10 minutes remaining', 'warn-yellow');
    if (remaining === 300) showWarn('5 minutes remaining', 'warn-amber');
    if (remaining <= 0) endCall();
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
    activeVideoCallId = null;
    const role = getRole();
    const user = getUser();
    try {
      if (frame) { await frame.leave(); await frame.destroy(); }
    } catch (e) { console.warn('frame cleanup error:', e.message); }
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

    const roomRes = await appointmentsApi.videoRoom(appointmentId);
    const roomUrl = roomRes.data.videoRoomUrl;
    if (!roomUrl) throw new Error('No room URL returned');

    if (!window.DailyIframe) await loadDailySDK();

    try {
      const existing = window.DailyIframe.getCallInstance && window.DailyIframe.getCallInstance();
      if (existing) { await existing.leave().catch(() => {}); await existing.destroy().catch(() => {}); }
    } catch (e) { console.warn('[daily] cleanup existing instance:', e.message); }
    frame = window.DailyIframe.createFrame(document.getElementById('remote-video'), {
      url: roomUrl,
      iframeStyle: { width: '100%', height: '100%', border: 'none' },
      showLeaveButton: false,
      showFullscreenButton: false,
      activeSpeakerMode: false,
      layoutConfig: { grid: { maxTilesPerPage: 2 } }
    });
    frame.on('joined-meeting', (e) => console.log('[daily] joined-meeting', e?.participants?.local?.session_id));
    frame.on('participant-joined', (e) => console.log('[daily] participant-joined', e?.participant?.user_name));
    frame.on('participant-left', (e) => console.log('[daily] participant-left', e?.participant?.user_name));
    frame.on('error', (e) => console.error('[daily] error:', e?.errorMsg || JSON.stringify(e)));
    frame.on('left-meeting', () => {
      console.log('[daily] left-meeting event');
      endCall();
    });
    await frame.join();
    console.log('[daily] join() resolved');
    if (mode === 'audio') await frame.setLocalVideo(false);
  } catch (e) {
    console.error('Call init failed:', e.message);
    document.getElementById('remote-video').innerHTML = `<p style="color:#fff;padding:40px">${e.message}</p>`;
  }

  container.querySelector('#vc-mute').onclick = async () => {
    muted = !muted;
    if (frame) await frame.setLocalAudio(!muted);
    toast(muted ? 'Muted' : 'Unmuted', 'info');
  };
  container.querySelector('#vc-cam').onclick = async () => {
    camOn = !camOn;
    if (frame) await frame.setLocalVideo(camOn);
    toast(camOn ? 'Camera on' : 'Camera off', 'info');
  };
  container.querySelector('#vc-end').onclick = endCall;
}
