import { onCallIncoming, onCallMissed, onCallDeclined, acceptCall, declineCall } from './socket.js';
import { getUser } from './api.js';

let bannerEl = null;
let currentInvite = null;
let ringAudioCtx = null;
let ringIntervalId = null;
let vibrateIntervalId = null;

function playRingTone() {
  stopRingTone();
  try {
    ringAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ring = () => {
      if (!ringAudioCtx) return;
      const now = ringAudioCtx.currentTime;
      [0, 0.4].forEach((offset) => {
        const osc = ringAudioCtx.createOscillator();
        const gain = ringAudioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 900;
        gain.gain.setValueAtTime(0, now + offset);
        gain.gain.linearRampToValueAtTime(0.15, now + offset + 0.02);
        gain.gain.linearRampToValueAtTime(0, now + offset + 0.35);
        osc.connect(gain);
        gain.connect(ringAudioCtx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.4);
      });
    };
    ring();
    ringIntervalId = setInterval(ring, 1600);
  } catch {
    // ignore - audio not critical to core functionality
  }

  if (navigator.vibrate) {
    navigator.vibrate([400, 200, 400, 200]);
    vibrateIntervalId = setInterval(() => navigator.vibrate([400, 200, 400, 200]), 1600);
  }
}

function stopRingTone() {
  if (ringIntervalId) { clearInterval(ringIntervalId); ringIntervalId = null; }
  if (ringAudioCtx) { ringAudioCtx.close().catch(() => {}); ringAudioCtx = null; }
  if (vibrateIntervalId) { clearInterval(vibrateIntervalId); vibrateIntervalId = null; }
  if (navigator.vibrate) navigator.vibrate(0);
}

function ensureBanner() {
  if (bannerEl) return bannerEl;
  bannerEl = document.createElement('div');
  bannerEl.id = 'incoming-call-banner';
  bannerEl.className = 'incoming-call-banner hidden';
  bannerEl.innerHTML = `
    <div class="incoming-call-card">
      <div class="incoming-call-icon">📞</div>
      <div class="incoming-call-text">
        <strong id="incoming-call-name">Someone</strong>
        <span id="incoming-call-mode">is calling…</span>
      </div>
      <div class="incoming-call-actions">
        <button type="button" id="incoming-call-decline" class="btn-call-decline">Decline</button>
        <button type="button" id="incoming-call-accept" class="btn-call-accept">Accept</button>
      </div>
    </div>
  `;
  document.body.appendChild(bannerEl);

  bannerEl.querySelector('#incoming-call-accept').addEventListener('click', () => {
    if (!currentInvite) return;
    acceptCall(currentInvite.appointmentId);
    hideBanner();
    window.location.hash = `/video/${currentInvite.appointmentId}`;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });

  bannerEl.querySelector('#incoming-call-decline').addEventListener('click', () => {
    if (!currentInvite) return;
    declineCall(currentInvite.appointmentId);
    hideBanner();
  });

  return bannerEl;
}

function showBanner({ appointmentId, mode, callerName }) {
  const el = ensureBanner();
  currentInvite = { appointmentId, mode };
  el.querySelector('#incoming-call-name').textContent = callerName || 'Someone';
  el.querySelector('#incoming-call-mode').textContent =
    mode === 'audio' ? 'is calling (audio)…' : 'is calling (video)…';
  el.classList.remove('hidden');
  playRingTone();
}

function hideBanner() {
  currentInvite = null;
  bannerEl?.classList.add('hidden');
  stopRingTone();
}

export function initIncomingCallListener() {
  onCallIncoming((payload) => {
    const user = getUser();
    if (!user) return;
    showBanner(payload);
  });

  onCallMissed(({ appointmentId }) => {
    if (currentInvite?.appointmentId === appointmentId) hideBanner();
  });

  onCallDeclined(({ appointmentId }) => {
    if (currentInvite?.appointmentId === appointmentId) hideBanner();
  });
}
