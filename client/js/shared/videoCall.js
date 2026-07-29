// Agora Video & Audio Call Handler for Virtualcare Nigeria

let agoraClient = null;
let localAudioTrack = null;
let localVideoTrack = null;
let isCallActive = false;

export async function joinCall(appointmentId, mode = 'video') {
  if (isCallActive) {
    console.warn('joinCall called while a call is already active — ignoring duplicate join');
    return { success: false, error: 'Call already in progress' };
  }
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

