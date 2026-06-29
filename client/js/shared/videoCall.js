// Agora Video & Audio Call Handler for Virtualcare Nigeria

let agoraClient = null;
let localAudioTrack = null;
let localVideoTrack = null;
let isCallActive = false;

export async function joinCall(appointmentId, mode = 'video') {
  try {
    // Get token from backend
    const res = await fetch(`/api/video/token/${appointmentId}?mode=${mode}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    const { token, channelName, appId, uid } = data.data;

    // Load Agora SDK dynamically
    if (!window.AgoraRTC) {
      await loadAgoraSDK();
    }

    // Create Agora client
    agoraClient = window.AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

    // Join channel
    await agoraClient.join(appId, channelName, token, uid);

    // Create and publish local tracks
    if (mode === 'video') {
      [localAudioTrack, localVideoTrack] = await window.AgoraRTC.createMicrophoneAndCameraTracks();
    } else {
      localAudioTrack = await window.AgoraRTC.createMicrophoneAudioTrack();
    }

    await agoraClient.publish(
      mode === 'video' ? [localAudioTrack, localVideoTrack] : [localAudioTrack]
    );

    // Play local video
    if (mode === 'video' && localVideoTrack) {
      localVideoTrack.play('local-video');
    }

    // Handle remote users
    agoraClient.on('user-published', async (user, mediaType) => {
      await agoraClient.subscribe(user, mediaType);
      if (mediaType === 'video') {
        user.videoTrack.play('remote-video');
      }
      if (mediaType === 'audio') {
        user.audioTrack.play();
      }
    });

    agoraClient.on('user-unpublished', (user) => {
      console.log('Remote user unpublished:', user.uid);
    });

    agoraClient.on('user-left', (user) => {
      console.log('Remote user left:', user.uid);
      document.getElementById('remote-video')?.replaceChildren();
    });

    isCallActive = true;
    return { success: true, channelName, mode };
  } catch (err) {
    console.error('Join call failed:', err.message);
    return { success: false, error: err.message };
  }
}

export async function leaveCall(appointmentId) {
  try {
    if (localAudioTrack) { localAudioTrack.stop(); localAudioTrack.close(); }
    if (localVideoTrack) { localVideoTrack.stop(); localVideoTrack.close(); }
    if (agoraClient) await agoraClient.leave();

    agoraClient = null;
    localAudioTrack = null;
    localVideoTrack = null;
    isCallActive = false;

    // Notify backend call ended
    if (appointmentId) {
      await fetch(`/api/video/end/${appointmentId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
    }

    return { success: true };
  } catch (err) {
    console.error('Leave call failed:', err.message);
    return { success: false, error: err.message };
  }
}

export async function toggleMute() {
  if (localAudioTrack) {
    const muted = localAudioTrack.muted;
    await localAudioTrack.setMuted(!muted);
    return !muted;
  }
  return false;
}

export async function toggleVideo() {
  if (localVideoTrack) {
    const disabled = localVideoTrack.muted;
    await localVideoTrack.setMuted(!disabled);
    return !disabled;
  }
  return false;
}

export function renderCallUI(appointmentId, mode = 'video') {
  return `
    <div id="vc-call-container" style="
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:#0a0a0a;z-index:9999;display:flex;
      flex-direction:column;align-items:center;justify-content:center;">

      <!-- Videos -->
      <div style="position:relative;width:100%;max-width:900px;height:60vh;">
        <!-- Remote video (Doctor/Patient) -->
        <div id="remote-video" style="
          width:100%;height:100%;background:#1a1a2e;border-radius:12px;
          display:flex;align-items:center;justify-content:center;">
          <div style="text-align:center;color:#64748b;">
            <div style="font-size:48px;">👨‍⚕️</div>
            <p style="margin:8px 0;color:#94a3b8;">Waiting for other participant...</p>
          </div>
        </div>

        <!-- Local video (You) -->
        ${mode === 'video' ? `
        <div id="local-video" style="
          position:absolute;bottom:16px;right:16px;
          width:180px;height:120px;background:#0f172a;
          border-radius:8px;border:2px solid #0066cc;overflow:hidden;">
        </div>` : ''}

        <!-- Audio only indicator -->
        ${mode === 'audio' ? `
        <div style="text-align:center;color:#ffffff;">
          <div style="font-size:64px;margin-bottom:16px;">🎙️</div>
          <p style="font-size:18px;color:#94a3b8;">Audio Call Active</p>
        </div>` : ''}
      </div>

      <!-- Call info -->
      <div style="margin:16px 0;color:#94a3b8;font-size:14px;">
        🔴 Live · ${mode === 'video' ? 'Video' : 'Audio'} Consultation · Virtualcare Nigeria
      </div>

      <!-- Controls -->
      <div style="display:flex;gap:16px;margin-top:8px;">
        <button id="btn-mute" onclick="window.vcToggleMute()" style="
          background:#1e293b;border:none;border-radius:50%;
          width:56px;height:56px;cursor:pointer;font-size:20px;
          color:#ffffff;transition:background 0.2s;" title="Mute/Unmute">
          🎙️
        </button>

        ${mode === 'video' ? `
        <button id="btn-video" onclick="window.vcToggleVideo()" style="
          background:#1e293b;border:none;border-radius:50%;
          width:56px;height:56px;cursor:pointer;font-size:20px;
          color:#ffffff;transition:background 0.2s;" title="Toggle Video">
          📷
        </button>` : ''}

        <button onclick="window.vcEndCall('${appointmentId}')" style="
          background:#ef4444;border:none;border-radius:50%;
          width:56px;height:56px;cursor:pointer;font-size:20px;
          color:#ffffff;" title="End Call">
          📵
        </button>
      </div>
    </div>`;
}

async function loadAgoraSDK() {
  return new Promise((resolve, reject) => {
    if (window.AgoraRTC) return resolve();
    const script = document.createElement('script');
    script.src = 'https://download.agora.io/sdk/release/AgoraRTC_N-4.20.0.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Global helpers for inline onclick handlers
window.vcToggleMute = async () => {
  const muted = await toggleMute();
  document.getElementById('btn-mute').textContent = muted ? '🔇' : '🎙️';
};

window.vcToggleVideo = async () => {
  const disabled = await toggleVideo();
  document.getElementById('btn-video').textContent = disabled ? '📷‍' : '📷';
};

window.vcEndCall = async (appointmentId) => {
  await leaveCall(appointmentId);
  document.getElementById('vc-call-container')?.remove();
};
