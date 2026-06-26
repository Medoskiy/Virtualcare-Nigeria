async function createVideoRoom(appointmentId) {
  if (!process.env.DAILY_API_KEY) {
    return {
      url: `https://virtualcare.daily.co/demo-room-${appointmentId}`,
      name: `demo-room-${appointmentId}`
    };
  }

  try {
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`
      },
      body: JSON.stringify({
        name: `vc-ng-${appointmentId}`,
        properties: {
          exp: Math.floor(Date.now() / 1000) + 7200,
          max_participants: 2,
          enable_chat: true,
          enable_screenshare: true,
          start_video_off: false,
          start_audio_off: false,
          lang: 'en'
        }
      })
    });
    const room = await response.json();
    return { url: room.url, name: room.name };
  } catch (err) {
    console.error('Daily.co room creation failed:', err.message);
    return {
      url: `https://virtualcare.daily.co/demo-room-${appointmentId}`,
      name: `demo-room-${appointmentId}`
    };
  }
}

module.exports = { createVideoRoom };
