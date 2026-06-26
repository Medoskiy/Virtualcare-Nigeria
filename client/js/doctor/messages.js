import { messagesApi } from '../shared/api.js';
import { escapeHtml } from '../shared/utils.js';
import { toast } from '../shared/toast.js';
import { DEMO_PATIENTS } from './patients.js';

const DEMO_CONVERSATIONS = [
  {
    id: 'conv1',
    patientId: 'p1',
    patientName: 'Amaka Obi',
    patientEmail: 'patient@virtualcare.com',
    initials: 'AO',
    lastMessage: 'Thank you Doctor, I feel much better now',
    lastMessageTime: new Date(Date.now() - 5 * 60000),
    unread: 2,
    online: true,
    hasActiveAppointment: true,
    messages: [
      { role: 'doctor', text: 'Good morning Amaka, how are you feeling today?', time: new Date(Date.now() - 60 * 60000) },
      { role: 'patient', text: 'Good morning Dr. Okonkwo! I have been having some chest tightness since yesterday.', time: new Date(Date.now() - 58 * 60000) },
      { role: 'doctor', text: 'I see. Is the tightness constant or does it come and go? Any shortness of breath?', time: new Date(Date.now() - 55 * 60000) },
      { role: 'patient', text: 'It comes and goes. No shortness of breath. I also took my Ramipril this morning.', time: new Date(Date.now() - 50 * 60000) },
      { role: 'doctor', text: 'Good. That is reassuring. Continue your medication and monitor your blood pressure. If it worsens, join our session today at 10:00.', time: new Date(Date.now() - 45 * 60000) },
      { role: 'patient', text: 'Thank you Doctor, I feel much better now', time: new Date(Date.now() - 5 * 60000) }
    ]
  },
  {
    id: 'conv2',
    patientId: 'p2',
    patientName: 'Emeka Nwosu',
    patientEmail: 'emeka.nwosu@gmail.com',
    initials: 'EN',
    lastMessage: 'I will send the ECG report now',
    lastMessageTime: new Date(Date.now() - 2 * 3600000),
    unread: 0,
    online: false,
    hasActiveAppointment: false,
    messages: [
      { role: 'patient', text: 'Doctor, my heart has been racing since this morning.', time: new Date(Date.now() - 3 * 3600000) },
      { role: 'doctor', text: 'Emeka, can you measure your pulse right now? Count beats for 30 seconds and multiply by 2.', time: new Date(Date.now() - 2.9 * 3600000) },
      { role: 'patient', text: 'It is 110 beats per minute.', time: new Date(Date.now() - 2.8 * 3600000) },
      { role: 'doctor', text: 'That is elevated. Do you have your recent ECG report? Please share it here.', time: new Date(Date.now() - 2.5 * 3600000) },
      { role: 'patient', text: 'I will send the ECG report now', time: new Date(Date.now() - 2 * 3600000) }
    ]
  },
  {
    id: 'conv3',
    patientId: 'p3',
    patientName: 'Fatima Aliyu',
    patientEmail: 'fatima.aliyu@yahoo.com',
    initials: 'FA',
    lastMessage: 'Should I reduce the salt in my diet?',
    lastMessageTime: new Date(Date.now() - 24 * 3600000),
    unread: 1,
    online: false,
    hasActiveAppointment: false,
    messages: [
      { role: 'patient', text: 'Good afternoon Doctor. My blood pressure reading this morning was 145/92.', time: new Date(Date.now() - 25 * 3600000) },
      { role: 'doctor', text: 'Thank you for monitoring it Fatima. 145/92 is slightly above target. Are you taking your medication consistently?', time: new Date(Date.now() - 24.5 * 3600000) },
      { role: 'patient', text: 'Yes Doctor, every morning. Should I reduce the salt in my diet?', time: new Date(Date.now() - 24 * 3600000) }
    ]
  },
  {
    id: 'conv4',
    patientId: 'p4',
    patientName: 'Chukwudi Eze',
    patientEmail: 'chukwudi.eze@gmail.com',
    initials: 'CE',
    lastMessage: 'Thank you for the prescription Doctor',
    lastMessageTime: new Date(Date.now() - 3 * 24 * 3600000),
    unread: 0,
    online: false,
    hasActiveAppointment: false,
    messages: [
      { role: 'patient', text: 'Doctor I received the prescription. Thank you for the prescription Doctor', time: new Date(Date.now() - 3 * 24 * 3600000) }
    ]
  }
];

let activeConversationId = null;
let allConversations = [];

function formatConvTime(date) {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', timeZone: 'Africa/Lagos' });
}

function getMessagesHTML() {
  return `
    <div class="doctor-messages-layout">
      <div class="msg-left-panel">
        <div class="msg-panel-header">
          <h3>Messages</h3>
          <button type="button" class="btn-new-chat" id="btn-new-chat" title="Start new conversation">✏️ New</button>
        </div>
        <div class="msg-search-wrap">
          <span class="msg-search-icon">🔍</span>
          <input type="text" id="msgSearchInput" placeholder="Search patients..." class="msg-search-input">
        </div>
        <div class="conversations-list" id="conversationsList"></div>
      </div>

      <div class="msg-right-panel" id="msgRightPanel">
        <div class="msg-empty-state" id="msgEmptyState">
          <div class="msg-empty-icon">💬</div>
          <h3>Your Messages</h3>
          <p>Select a patient conversation from the left to view your chat history, or start a new conversation.</p>
          <button type="button" class="btn-start-chat" id="btn-start-chat-empty">✏️ Start New Conversation</button>
        </div>

        <div class="msg-chat-area hidden" id="msgChatArea">
          <div class="msg-chat-header">
            <div class="msg-chat-avatar" id="chatPatientAvatar">AO</div>
            <div class="msg-chat-info">
              <div class="msg-chat-name" id="chatPatientName">Patient Name</div>
              <div class="msg-chat-status" id="chatPatientStatus"><span class="online-dot"></span> Online</div>
            </div>
            <div class="msg-chat-actions">
              <button type="button" class="msg-action-btn" id="btn-video-chat" title="Video Call">📹</button>
              <button type="button" class="msg-action-btn" id="btn-audio-chat" title="Audio Call">📞</button>
              <button type="button" class="msg-action-btn" id="btn-records-chat" title="Share Records">📁</button>
              <button type="button" class="msg-action-btn" id="btn-profile-chat" title="View Profile">👤</button>
            </div>
          </div>

          <div class="msg-session-banner hidden" id="msgSessionBanner">
            📅 Active appointment with this patient ·
            <button type="button" class="msg-join-session-btn" id="btn-join-session">Join Session →</button>
          </div>

          <div class="msg-thread" id="msgThread"></div>

          <div class="msg-typing hidden" id="msgTyping">
            <div class="typing-dots"><span></span><span></span><span></span></div>
            <span id="typingName">Patient</span> is typing...
          </div>

          <div class="msg-input-bar">
            <button type="button" class="msg-attach-btn" id="btn-attach-file" title="Attach file">📎</button>
            <button type="button" class="msg-attach-btn" id="btn-attach-rx" title="Send prescription">💊</button>
            <input type="text" id="doctorMsgInput" class="msg-text-input" placeholder="Type a message...">
            <button type="button" class="msg-send-btn" id="btn-send-doctor-msg">➤</button>
          </div>
          <p class="msg-hint">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>

    <div id="newChatModal" class="new-chat-modal-overlay hidden">
      <div class="new-chat-modal-box">
        <div class="new-chat-header">
          <h3>New Conversation</h3>
          <button type="button" class="modal-close-btn" id="btn-close-new-chat">×</button>
        </div>
        <p class="new-chat-subtitle">Search for a patient to start a conversation</p>
        <div class="new-chat-search-wrap">
          <span class="new-chat-search-icon">🔍</span>
          <input type="text" id="newChatSearch" placeholder="Search by name or email..." class="new-chat-search-input">
        </div>
        <div id="newChatPatientsList" class="new-chat-patients-list"></div>
      </div>
    </div>
  `;
}

function renderConversationsList(conversations) {
  const list = document.getElementById('conversationsList');
  if (!list) return;

  if (!conversations.length) {
    list.innerHTML = `
      <div class="conv-empty">
        <div class="conv-empty-icon">💬</div>
        <p>No conversations found</p>
      </div>`;
    return;
  }

  list.innerHTML = conversations.map((conv) => {
    const timeStr = formatConvTime(conv.lastMessageTime);
    const isActive = conv.id === activeConversationId;
    return `
      <div class="conv-card ${isActive ? 'active' : ''} ${conv.unread > 0 ? 'has-unread' : ''}" data-conv-id="${escapeHtml(conv.id)}" id="conv-${escapeHtml(conv.id)}">
        <div class="conv-avatar-wrap">
          <div class="conv-avatar">${escapeHtml(conv.initials)}</div>
          <div class="conv-status-dot ${conv.online ? 'online' : 'offline'}"></div>
        </div>
        <div class="conv-info">
          <div class="conv-top-row">
            <span class="conv-name">${escapeHtml(conv.patientName)}</span>
            <span class="conv-time">${timeStr}</span>
          </div>
          <div class="conv-bottom-row">
            <span class="conv-preview">${escapeHtml(conv.lastMessage)}</span>
            ${conv.unread > 0 ? `<span class="conv-unread-badge">${conv.unread}</span>` : ''}
          </div>
          ${conv.hasActiveAppointment ? '<div class="conv-appt-pill">📅 Active appointment</div>' : ''}
        </div>
      </div>`;
  }).join('');
}

function renderChatMessages(messages) {
  const thread = document.getElementById('msgThread');
  if (!thread) return;

  if (!messages.length) {
    thread.innerHTML = `
      <div class="msg-thread-empty">
        <div class="msg-thread-empty-icon">👋</div>
        <p>Start the conversation with this patient</p>
      </div>`;
    return;
  }

  const activeConv = allConversations.find((c) => c.id === activeConversationId);
  let currentDate = '';
  let html = '';

  messages.forEach((msg) => {
    const msgDate = new Date(msg.time).toLocaleDateString('en-NG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'Africa/Lagos'
    });

    if (msgDate !== currentDate) {
      currentDate = msgDate;
      html += `<div class="msg-date-divider"><span>${msgDate}</span></div>`;
    }

    const isDoctor = msg.role === 'doctor';
    const timeStr = new Date(msg.time).toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Lagos'
    });

    html += `
      <div class="msg-bubble-wrap ${isDoctor ? 'sent' : 'received'}">
        ${!isDoctor ? `<div class="msg-bubble-avatar">${escapeHtml(activeConv?.initials || 'P')}</div>` : ''}
        <div class="msg-bubble-content">
          <div class="msg-bubble ${isDoctor ? 'sent' : 'received'}">
            ${escapeHtml(msg.text)}
            ${msg.attachment ? `<div class="msg-attachment">📎 ${escapeHtml(msg.attachment.name)}</div>` : ''}
          </div>
          <div class="msg-bubble-time ${isDoctor ? 'sent' : ''}">${timeStr}${isDoctor ? ' ✓✓' : ''}</div>
        </div>
      </div>`;
  });

  thread.innerHTML = html;
  setTimeout(() => { thread.scrollTop = thread.scrollHeight; }, 50);
}

function openConversation(convId) {
  activeConversationId = convId;
  const conv = allConversations.find((c) => c.id === convId);
  if (!conv) return;

  conv.unread = 0;

  document.querySelectorAll('.conv-card').forEach((c) => c.classList.remove('active'));
  document.getElementById(`conv-${convId}`)?.classList.add('active');
  document.querySelector(`#conv-${convId} .conv-unread-badge`)?.remove();

  document.getElementById('msgEmptyState')?.classList.add('hidden');
  const chatArea = document.getElementById('msgChatArea');
  chatArea?.classList.remove('hidden');
  chatArea?.style.setProperty('display', 'flex');

  document.getElementById('chatPatientName').textContent = conv.patientName;
  document.getElementById('chatPatientAvatar').textContent = conv.initials;
  document.getElementById('chatPatientStatus').innerHTML = conv.online
    ? '<span class="online-dot"></span> Online'
    : '<span class="offline-dot"></span> Last seen recently';

  const sessionBanner = document.getElementById('msgSessionBanner');
  if (sessionBanner) {
    sessionBanner.classList.toggle('hidden', !conv.hasActiveAppointment);
    sessionBanner.style.display = conv.hasActiveAppointment ? 'flex' : 'none';
  }

  renderChatMessages(conv.messages);
  setTimeout(() => document.getElementById('doctorMsgInput')?.focus(), 100);
}

function simulatePatientReply(conv) {
  const replies = [
    'Thank you Doctor, I understand.',
    'Okay Doctor, I will do that.',
    'Should I book another appointment?',
    'I will take the medication as prescribed.',
    'Thank you so much Doctor.'
  ];

  setTimeout(() => {
    const randomReply = replies[Math.floor(Math.random() * replies.length)];
    conv.messages.push({ role: 'patient', text: randomReply, time: new Date() });
    conv.lastMessage = randomReply;
    conv.lastMessageTime = new Date();

    if (activeConversationId === conv.id) {
      renderChatMessages(conv.messages);
      renderConversationsList(allConversations);
      document.getElementById(`conv-${conv.id}`)?.classList.add('active');
    } else {
      conv.unread += 1;
      renderConversationsList(allConversations);
    }
  }, 2000);
}

function sendDoctorMessage() {
  const input = document.getElementById('doctorMsgInput');
  const text = input?.value?.trim();
  if (!text || !activeConversationId) return;

  const conv = allConversations.find((c) => c.id === activeConversationId);
  if (!conv) return;

  conv.messages.push({ role: 'doctor', text, time: new Date() });
  conv.lastMessage = text;
  conv.lastMessageTime = new Date();
  input.value = '';

  renderChatMessages(conv.messages);
  renderConversationsList(allConversations);
  document.getElementById(`conv-${activeConversationId}`)?.classList.add('active');

  messagesApi.send(activeConversationId, text).catch(() => {});
  simulatePatientReply(conv);
}

function searchConversations() {
  const query = (document.getElementById('msgSearchInput')?.value || '').toLowerCase();
  const filtered = query
    ? allConversations.filter((c) =>
        c.patientName.toLowerCase().includes(query) ||
        c.patientEmail.toLowerCase().includes(query) ||
        c.lastMessage.toLowerCase().includes(query)
      )
    : allConversations;
  renderConversationsList(filtered);
}

function openNewChatModal() {
  const modal = document.getElementById('newChatModal');
  modal?.classList.remove('hidden');
  modal?.style.setProperty('display', 'flex');
  searchNewChatPatients();
  setTimeout(() => document.getElementById('newChatSearch')?.focus(), 100);
}

function closeNewChatModal() {
  const modal = document.getElementById('newChatModal');
  modal?.classList.add('hidden');
  modal?.style.setProperty('display', 'none');
}

function searchNewChatPatients() {
  const query = (document.getElementById('newChatSearch')?.value || '').toLowerCase();
  const filtered = query
    ? DEMO_PATIENTS.filter((p) =>
        `${p.name} ${p.surname}`.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query)
      )
    : DEMO_PATIENTS;

  const list = document.getElementById('newChatPatientsList');
  if (!list) return;

  list.innerHTML = filtered.length
    ? filtered.map((p) => `
        <div class="new-chat-patient-item" data-patient-id="${escapeHtml(p.id)}" data-patient-name="${escapeHtml(`${p.name} ${p.surname}`)}" data-patient-email="${escapeHtml(p.email)}">
          <div class="conv-avatar new-chat-patient-avatar">${escapeHtml(p.name[0])}${escapeHtml(p.surname[0])}</div>
          <div>
            <div class="new-chat-patient-name">${escapeHtml(p.name)} ${escapeHtml(p.surname)}</div>
            <div class="new-chat-patient-email">${escapeHtml(p.email)}</div>
          </div>
        </div>`).join('')
    : '<div class="new-chat-empty">No patients found</div>';
}

function startChatWithPatient(patientId, name, email) {
  closeNewChatModal();

  let existing = allConversations.find((c) => c.patientEmail === email);
  if (!existing) {
    const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
    existing = {
      id: `conv-new-${Date.now()}`,
      patientId,
      patientName: name,
      patientEmail: email,
      initials,
      lastMessage: 'New conversation',
      lastMessageTime: new Date(),
      unread: 0,
      online: false,
      hasActiveAppointment: false,
      messages: []
    };
    allConversations.unshift(existing);
    renderConversationsList(allConversations);
  }

  openConversation(existing.id);
  toast(`Conversation opened with ${name}`, 'success');
}

function bindMessagesEvents(root) {
  root.querySelector('#btn-new-chat')?.addEventListener('click', openNewChatModal);
  root.querySelector('#btn-start-chat-empty')?.addEventListener('click', openNewChatModal);
  root.querySelector('#btn-close-new-chat')?.addEventListener('click', closeNewChatModal);
  root.querySelector('#newChatModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'newChatModal') closeNewChatModal();
  });

  root.querySelector('#msgSearchInput')?.addEventListener('input', searchConversations);
  root.querySelector('#newChatSearch')?.addEventListener('input', searchNewChatPatients);

  root.querySelector('#conversationsList')?.addEventListener('click', (e) => {
    const card = e.target.closest('.conv-card');
    if (card?.dataset.convId) openConversation(card.dataset.convId);
  });

  root.querySelector('#newChatPatientsList')?.addEventListener('click', (e) => {
    const item = e.target.closest('.new-chat-patient-item');
    if (!item) return;
    startChatWithPatient(item.dataset.patientId, item.dataset.patientName, item.dataset.patientEmail);
  });

  root.querySelector('#btn-send-doctor-msg')?.addEventListener('click', sendDoctorMessage);
  root.querySelector('#doctorMsgInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendDoctorMessage();
    }
  });

  root.querySelector('#btn-video-chat')?.addEventListener('click', () => toast('Starting video call…', 'info'));
  root.querySelector('#btn-audio-chat')?.addEventListener('click', () => toast('Starting audio call…', 'info'));
  root.querySelector('#btn-records-chat')?.addEventListener('click', () => toast('Share records from the Records tab', 'info'));
  root.querySelector('#btn-profile-chat')?.addEventListener('click', () => {
    const conv = allConversations.find((c) => c.id === activeConversationId);
    toast(conv ? `Viewing ${conv.patientName}'s profile` : 'Select a conversation first', 'info');
  });
  root.querySelector('#btn-join-session')?.addEventListener('click', () => toast('Joining active session…', 'info'));
  root.querySelector('#btn-attach-file')?.addEventListener('click', () => toast('File attachment coming soon', 'info'));
  root.querySelector('#btn-attach-rx')?.addEventListener('click', () => toast('Open Prescriptions tab to issue an Rx', 'info'));
}

export async function renderDoctorMessages(container) {
  allConversations = DEMO_CONVERSATIONS.map((c) => ({
    ...c,
    messages: [...c.messages],
    lastMessageTime: new Date(c.lastMessageTime)
  }));
  activeConversationId = null;

  container.innerHTML = getMessagesHTML();
  bindMessagesEvents(container);
  renderConversationsList(allConversations);
}

/** @deprecated use renderDoctorMessages */
export function setupDoctorMessageInput() {}
