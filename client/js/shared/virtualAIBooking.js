// VirtualAI Doctor Booking Modal

export function renderDoctorBookingModal(data) {
  const { doctors, specialist, reason, urgency } = data;

  const urgencyColor = urgency === 'high' ? '#ef4444' : urgency === 'moderate' ? '#f97316' : '#22c55e';
  const urgencyLabel = urgency === 'high' ? '🔴 High Priority' : urgency === 'moderate' ? '🟠 Moderate' : '🟢 Normal';

  const doctorCards = doctors.map(doctor => `
    <div class="vc-doctor-card" style="
      border:1px solid #e2e8f0;border-radius:12px;padding:16px;
      margin-bottom:12px;background:#fff;cursor:pointer;
      transition:box-shadow 0.2s;">
      
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <div style="
          width:48px;height:48px;border-radius:50%;
          background:linear-gradient(135deg,#0066cc,#0099ff);
          display:flex;align-items:center;justify-content:center;
          color:#fff;font-weight:700;font-size:18px;flex-shrink:0;">
          ${doctor.name.charAt(0)}
        </div>
        <div>
          <p style="margin:0;font-weight:700;color:#1e293b;">${doctor.name}</p>
          <p style="margin:0;font-size:13px;color:#64748b;">${doctor.specialty}</p>
          <p style="margin:0;font-size:13px;color:#f59e0b;">⭐ ${doctor.rating || '4.8'} · ₦${(doctor.pricePerSession || 5000).toLocaleString('en-NG')}/session</p>
        </div>
      </div>

      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#475569;">Available Slots:</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${doctor.availableSlots.map(slot => `
          <button 
            onclick="window.vcSelectSlot('${doctor.id}', '${slot.datetime}', '${doctor.name}')"
            style="
              background:#f0f9ff;border:1px solid #0066cc;border-radius:6px;
              padding:6px 10px;font-size:12px;color:#0066cc;cursor:pointer;
              font-weight:500;transition:all 0.2s;"
            onmouseover="this.style.background='#0066cc';this.style.color='#fff'"
            onmouseout="this.style.background='#f0f9ff';this.style.color='#0066cc'">
            ${slot.display}
          </button>
        `).join('')}
      </div>
    </div>
  `).join('');

  return `
    <div id="vc-booking-modal" style="
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.5);z-index:10000;
      display:flex;align-items:center;justify-content:center;
      padding:16px;">
      
      <div style="
        background:#f8fafc;border-radius:16px;width:100%;max-width:520px;
        max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
        
        <!-- Header -->
        <div style="
          background:linear-gradient(135deg,#0066cc,#0099ff);
          padding:20px 24px;border-radius:16px 16px 0 0;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <h3 style="margin:0;color:#fff;font-size:18px;">Book a Consultation</h3>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">
                ${specialist} · <span style="color:${urgencyColor};background:rgba(255,255,255,0.2);padding:2px 8px;border-radius:12px;">${urgencyLabel}</span>
              </p>
            </div>
            <button onclick="document.getElementById('vc-booking-modal').remove()" style="
              background:rgba(255,255,255,0.2);border:none;border-radius:50%;
              width:32px;height:32px;color:#fff;cursor:pointer;font-size:18px;">×</button>
          </div>
        </div>

        <!-- Reason -->
        <div style="padding:16px 24px;background:#fff;border-bottom:1px solid #e2e8f0;">
          <p style="margin:0;font-size:13px;color:#64748b;">
            📋 <strong>Reason:</strong> ${reason}
          </p>
        </div>

        <!-- Doctor Cards -->
        <div style="padding:16px 24px;">
          <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1e293b;">
            Available Doctors (${doctors.length})
          </p>
          ${doctorCards}
        </div>

        <!-- Footer -->
        <div style="padding:16px 24px;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">
            All times shown in West Africa Time (WAT) · MDCN certified doctors
          </p>
        </div>
      </div>
    </div>`;
}

export async function confirmVirtualAIBooking(doctorId, scheduledAt, doctorName, reason, urgency) {
  try {
    const res = await fetch('/api/ai/book-appointment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ doctorId, scheduledAt, reason, urgency })
    });

    const data = await res.json();

    if (data.success) {
      // Remove modal
      document.getElementById('vc-booking-modal')?.remove();

      // Show success message in chat
      const successMsg = document.createElement('div');
      successMsg.style.cssText = `
        background:#f0fdf4;border:1px solid #22c55e;border-radius:12px;
        padding:16px;margin:12px 0;`;
      successMsg.innerHTML = `
        <p style="margin:0;color:#16a34a;font-weight:600;">✅ Appointment Confirmed!</p>
        <p style="margin:8px 0 0;color:#475569;font-size:14px;">
          <strong>${doctorName}</strong><br>
          📅 ${new Date(scheduledAt).toLocaleDateString('en-NG', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Africa/Lagos' 
          })}<br>
          🕐 ${new Date(scheduledAt).toLocaleTimeString('en-NG', { 
            hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' 
          })} WAT
        </p>
        <p style="margin:8px 0 0;font-size:13px;color:#64748b;">
          A confirmation email has been sent to you. You can view this appointment in your dashboard.
        </p>`;

      const chatContainer = document.querySelector('.vc-chat-messages') || document.querySelector('#virtualai-messages');
      if (chatContainer) {
        chatContainer.appendChild(successMsg);
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }

      return { success: true, appointment: data.data?.appointment };
    } else {
      alert('Booking failed: ' + (data.message || 'Please try again'));
      return { success: false };
    }
  } catch (e) {
    console.error('Booking error:', e);
    alert('Could not complete booking. Please try again.');
    return { success: false };
  }
}

// Global handler for slot selection
window.vcSelectSlot = async (doctorId, scheduledAt, doctorName) => {
  const modal = document.getElementById('vc-booking-modal');
  const reason = modal?.dataset.reason || 'VirtualAI referral';
  const urgency = modal?.dataset.urgency || 'normal';

  // Show confirmation
  const confirmed = confirm(`Confirm appointment with ${doctorName} on ${new Date(scheduledAt).toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'Africa/Lagos' })} at ${new Date(scheduledAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' })} WAT?`);
  
  if (confirmed) {
    await confirmVirtualAIBooking(doctorId, scheduledAt, doctorName, reason, urgency);
  }
};
