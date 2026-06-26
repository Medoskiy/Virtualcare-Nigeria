import { appointmentsApi, messagesApi } from '../shared/api.js';
import { escapeHtml, formatDate, initMessageInput, formatDoctorName } from '../shared/utils.js';
import { joinAppointment, onMessageNew } from '../shared/socket.js';

export async function renderMessages(container) {
  let appointments = [];
  try {
    const res = await appointmentsApi.patientAll();
    appointments = (res.data.appointments || []).filter((a) => a.status !== 'pending' && a.paymentId);
  } catch { /* empty */ }

  if (!appointments.length) {
    container.innerHTML = `
      <div class="dashboard-header"><h1>Messages</h1></div>
      <div class="empty-state card">Messaging is available after payment is confirmed for an appointment.</div>
    `;
    return;
  }

  let selectedId = appointments[0]._id;

  container.innerHTML = `
    <div class="dashboard-header"><h1>Messages</h1></div>
    <div class="grid grid-2" style="gap:24px">
      <div>
        <h3 style="margin-bottom:12px">Conversations</h3>
        ${appointments.map((a) => `
          <div class="card thread-item" data-id="${a._id}" style="margin-bottom:8px;cursor:pointer;padding:16px">
            <strong>${escapeHtml(formatDoctorName(a.doctor, { surnameOnly: true }))}</strong>
            <div class="text-muted" style="font-size:0.85rem">${formatDate(a.scheduledAt)}</div>
          </div>
        `).join('')}
      </div>
      <div>
        <div class="chat-container" id="chat-box">
          <div class="chat-messages" id="chat-messages"></div>
          <div class="chat-input">
            <input type="text" id="messageInput" class="message-input chat-input" placeholder="Type a message...">
            <button type="button" class="btn btn-primary btn-sm btn-send send-btn" id="sendBtn">Send</button>
          </div>
          <p class="chat-input-hint">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  `;

  async function loadMessages(id) {
    selectedId = id;
    joinAppointment(id);
    const res = await messagesApi.get(id);
    const messages = res.data.messages || [];
    const box = container.querySelector('#chat-messages');
    box.innerHTML = messages.map((m) => `
      <div class="chat-bubble ${m.senderRole === 'patient' ? 'sent' : 'received'}">${escapeHtml(m.content)}</div>
    `).join('');
    box.scrollTop = box.scrollHeight;
  }

  container.querySelectorAll('.thread-item').forEach((item) => {
    item.addEventListener('click', () => loadMessages(item.dataset.id));
  });

  container.querySelector('#sendBtn').addEventListener('click', async () => {
    const input = container.querySelector('#messageInput');
    const content = input.value.trim();
    if (!content) return;
    await messagesApi.send(selectedId, content);
    input.value = '';
    await loadMessages(selectedId);
  });

  initMessageInput(container);

  onMessageNew(() => loadMessages(selectedId));
  await loadMessages(selectedId);
}
