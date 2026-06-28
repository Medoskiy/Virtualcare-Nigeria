const { RtcTokenBuilder, RtcRole } = require('agora-token');

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
const TOKEN_EXPIRY_SECONDS = 7200; // 2 hours

function generateAgoraToken(channelName, uid, role) {
  if (!APP_ID || !APP_CERTIFICATE) {
    console.warn('Agora credentials not set — returning demo token');
    return null;
  }
  const expirationTime = Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS;
  return RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    role,
    expirationTime
  );
}

function createChannelName(appointmentId) {
  return `vc-ng-${appointmentId}`;
}

async function createVideoRoom(appointmentId) {
  const channelName = createChannelName(appointmentId);

  if (!APP_ID || !APP_CERTIFICATE) {
    return {
      provider: 'agora',
      channelName,
      appId: 'demo',
      hostToken: null,
      guestToken: null,
      demo: true,
      callModes: ['video', 'audio']
    };
  }

  try {
    const hostToken = generateAgoraToken(channelName, 1, RtcRole.PUBLISHER);
    const guestToken = generateAgoraToken(channelName, 2, RtcRole.PUBLISHER);

    return {
      provider: 'agora',
      channelName,
      appId: APP_ID,
      hostToken,
      guestToken,
      expiresAt: new Date(Date.now() + TOKEN_EXPIRY_SECONDS * 1000).toISOString(),
      demo: false,
      callModes: ['video', 'audio']
    };
  } catch (err) {
    console.error('Agora token generation failed:', err.message);
    return {
      provider: 'agora',
      channelName,
      appId: APP_ID || 'demo',
      hostToken: null,
      guestToken: null,
      demo: true,
      callModes: ['video', 'audio']
    };
  }
}

async function generateTokenForUser(appointmentId, uid, isHost) {
  const channelName = createChannelName(appointmentId);
  const role = RtcRole.PUBLISHER;
  const token = generateAgoraToken(channelName, uid, role);
  return {
    token,
    channelName,
    appId: APP_ID,
    uid,
    expiresAt: new Date(Date.now() + TOKEN_EXPIRY_SECONDS * 1000).toISOString()
  };
}

module.exports = { createVideoRoom, generateTokenForUser, createChannelName };
