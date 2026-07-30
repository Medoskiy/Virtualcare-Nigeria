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
  const DAILY_API_KEY = process.env.DAILY_API_KEY;
  const roomName = `vc-${appointmentId}`;

  if (!DAILY_API_KEY) {
    console.warn('DAILY_API_KEY not set — cannot create Daily room');
    throw new Error('Video service not configured');
  }

  const headers = {
    Authorization: `Bearer ${DAILY_API_KEY}`,
    'Content-Type': 'application/json'
  };

  // Try to create the room
  const createRes = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: roomName,
      privacy: 'public',
      properties: {
        exp: Math.floor(Date.now() / 1000) + 3 * 60 * 60
      }
    })
  });

  if (createRes.ok) {
    const room = await createRes.json();
    return { url: room.url, provider: 'daily' };
  }

  // If room already exists (400), fetch the existing one
  if (createRes.status === 400) {
    const getRes = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, { headers });
    if (getRes.ok) {
      const room = await getRes.json();
      return { url: room.url, provider: 'daily' };
    }
  }

  const errText = await createRes.text();
  console.error('Daily room creation failed:', createRes.status, errText);
  throw new Error('Failed to create video room');
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
