// Video service — Daily.co room provisioning for consultations.

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
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60
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

module.exports = { createVideoRoom };
