import { aiApi } from '../shared/api.js';
import { escapeHtml, formatAIMessage } from '../shared/utils.js';
import { toast } from '../shared/toast.js';
import { renderDoctorBookingModal } from '../shared/virtualAIBooking.js';

let virtualAIHistory = [];
let aiTurnCount = 0;
let activeAIContainer = null;

function getAIChatBox(container) {
  const root = container || activeAIContainer || document;
  return root.querySelector?.('#aiMessages')
    || root.querySelector?.('#ai-messages')
    || root.querySelector?.('.ai-messages')
    || document.getElementById('aiMessages')
    || document.querySelector('.ai-messages');
}

function appendMessageBubble(container, role, content) {
  const box = getAIChatBox(container);
  if (!box) return;
  const cls = role === 'user' ? 'sent' : 'received';
  const html = role === 'ai' || role === 'assistant'
    ? formatAIMessage(content)
    : escapeHtml(content);
  box.insertAdjacentHTML('beforeend', `<div class="chat-bubble ${cls}">${html}</div>`);
}

function showTypingIndicator(container) {
  const box = getAIChatBox(container);
  if (!box || box.querySelector('#aiTyping')) return;
  box.insertAdjacentHTML('beforeend', `
    <div id="aiTyping" class="ai-typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `);
  scrollToBottom(container);
}

function hideTypingIndicator(container) {
  getAIChatBox(container)?.querySelector('#aiTyping')?.remove();
}

function scrollToBottom(container) {
  const box = getAIChatBox(container);
  if (box) box.scrollTop = box.scrollHeight;
}

function clearInput(container) {
  const root = container || activeAIContainer || document;
  const input = root.querySelector?.('#aiInput')
    || root.querySelector?.('#ai-input')
    || root.querySelector?.('.ai-input')
    || document.getElementById('aiInput');
  if (input) input.value = '';
}

function showPriorityBookingBanner(container) {
  const box = getAIChatBox(container);
  if (!box || box.querySelector('.priority-booking-alert')) return;
  box.insertAdjacentHTML('beforeend', `
    <div class="priority-booking-alert" style="
      background: #fee2e2;
      border: 2px solid var(--red);
      border-radius: 10px;
      padding: 14px 18px;
      margin: 10px 0;
      font-size: 14px;
      color: #991b1b;
      font-weight: 600;
      animation: pulse 1s ease 3;
    ">
      🚨 <strong>Priority Booking Activated</strong><br>
      <span style="font-weight:400">Your case has been flagged as urgent.
      A Virtualcare doctor will be prioritised for you.
      Please also call <strong>112</strong> if this is an emergency.</span>
      <br><br>
      <button type="button" class="btn btn-primary btn-sm" id="priority-book-btn"
        style="background:var(--red);border:none">
        Book Priority Appointment Now
      </button>
    </div>
  `);
  box.querySelector('#priority-book-btn')?.addEventListener('click', () => {
    window.location.hash = '/patient/book';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
  scrollToBottom(container);
}

export function clearAIConversation() {
  virtualAIHistory = [];
  aiTurnCount = 0;
  const messagesContainer = getAIChatBox(activeAIContainer);
  if (messagesContainer) {
    messagesContainer.innerHTML = '';
    appendMessageBubble(activeAIContainer, 'ai',
      'Hello! I am VirtualAI. How can I help you today?');
  }
}

export function resetVirtualAIHistory() {
  clearAIConversation();
}

async function sendAIMessage(container, userMessage, inputEl) {
  if (!userMessage || !userMessage.trim()) return;

  const trimmedMessage = userMessage.trim();

  virtualAIHistory.push({
    role: 'user',
    content: trimmedMessage
  });
  aiTurnCount++;

  appendMessageBubble(container, 'user', trimmedMessage);
  showTypingIndicator(container);
  if (inputEl) {
    inputEl.value = '';
  } else {
    clearInput(container);
  }

  try {
    const result = await aiApi.chat(trimmedMessage, virtualAIHistory.slice(0, -1));

    hideTypingIndicator(container);

    const reply = result?.data?.reply || result?.reply;
    if (!reply) throw new Error('No reply from VirtualAI');

    virtualAIHistory.push({
      role: 'ai',
      content: reply
    });

    appendMessageBubble(container, 'ai', reply);

    const data = result?.data || {};

    if (data.bookingStatus === 'show_doctors' && data.doctors?.length > 0) {
      const modal = renderDoctorBookingModal(data);
      const modalEl = document.createElement('div');
      modalEl.innerHTML = modal;
      const modalNode = modalEl.firstElementChild;
      modalNode.dataset.reason = data.reason || 'VirtualAI referral';
      modalNode.dataset.urgency = data.urgency || 'normal';
      document.body.appendChild(modalNode);
    }

    if (result?.data?.priorityBookingTriggered) {
      showPriorityBookingBanner(container);
    }

    if (result?.data?.suggestSpecialty) {
      const box = getAIChatBox(container);
      box?.insertAdjacentHTML('beforeend', `
        <a href="/find-a-doctor?specialty=${encodeURIComponent(result.data.suggestSpecialty)}"
          data-link class="btn btn-primary btn-sm" style="margin:8px">
          Book a ${escapeHtml(result.data.suggestSpecialty)}
        </a>
      `);
      container.querySelectorAll('[data-link]').forEach((a) => {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.hash = a.getAttribute('href');
        });
      });
    }

    scrollToBottom(container);
  } catch (error) {
    hideTypingIndicator(container);
    console.error('VirtualAI error:', error);
    toast('VirtualAI is having trouble responding. Please try again.', 'error');
    virtualAIHistory.pop();
    aiTurnCount = Math.max(0, aiTurnCount - 1);
  }
}

function bindAIInputEnter(container) {
  const aiInput = container.querySelector('#aiInput')
    || container.querySelector('#ai-input')
    || container.querySelector('.ai-input')
    || container.querySelector('[placeholder*="symptom"]')
    || container.querySelector('[placeholder*="Describe"]')
    || container.querySelector('[placeholder*="health"]');

  if (!aiInput) return;

  if (aiInput._aiEnterHandler) {
    aiInput.removeEventListener('keydown', aiInput._aiEnterHandler);
  }

  aiInput._aiEnterHandler = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const sendBtn = container.querySelector('#aiSendBtn')
        || container.querySelector('#ai-send')
        || container.querySelector('.ai-send-btn')
        || container.querySelector('#aichat button[type="submit"]');
      if (sendBtn) {
        sendBtn.click();
      } else {
        sendAIMessage(container, aiInput.value, aiInput);
      }
    }
  };

  aiInput.addEventListener('keydown', aiInput._aiEnterHandler);
}

export async function renderAiChat(container) {
  activeAIContainer = container;
  const hasHistory = virtualAIHistory.length > 0;

  container.innerHTML = `
    <div class="ai-chat-header-row">
      <h1 class="ai-chat-title">VirtualAI Health Assistant</h1>
      <button type="button" class="ai-new-chat-pill" id="ai-new-chat">✨ New Chat</button>
    </div>
    <div class="ai-chat">
      <div class="ai-disclaimer">⚠️ VirtualAI provides general health information only. Always consult a licensed doctor for medical advice.</div>
      <p class="ai-ask-label">💡 Try asking about:</p>
      <div class="ai-suggest-list" id="aiSuggestList">
        ${[
          { icon: '🦟', text: 'I have fever, chills and body aches — could it be malaria?' },
          { icon: '🌡️', text: 'How do I know if I have typhoid fever?' },
          { icon: '❤️', text: 'My blood pressure reads 150/95 — is that dangerous?' },
          { icon: '🧬', text: 'My genotype is AS — what precautions should I take?' },
          { icon: '🤰', text: 'I am pregnant, what antenatal tests should I do?' },
          { icon: '😔', text: 'I have been feeling depressed and hopeless lately' },
          { icon: '🍚', text: 'I have severe stomach pain after eating' },
          { icon: '💊', text: 'I need advice on managing diabetes in Nigeria' },
          { icon: '👶', text: 'My baby has a fever and is not eating — what should I do?' },
          { icon: '🧠', text: 'I get severe headaches almost every day' },
          { icon: '🫁', text: 'I have a persistent cough for over 2 weeks' },
          { icon: '👁️', text: 'My eyes are red, itchy and swollen' },
          { icon: '🦴', text: 'My joints ache badly, especially in the morning' },
          { icon: '🩸', text: 'I feel weak and dizzy — could I have low blood levels?' },
          { icon: '🏥', text: 'Recommend a specialist doctor near me' }
        ].map((p, i) => `<button type="button" class="ai-suggest-row ${i >= 5 ? 'ai-suggest-hidden' : ''}" data-prompt="${escapeHtml(p.text)}"><span class="ai-suggest-icon">${p.icon}</span><span class="ai-suggest-text">${escapeHtml(p.text)}</span><span class="ai-suggest-arrow">›</span></button>`).join('')}
      </div>
      <button type="button" class="ai-suggest-toggle" id="aiSuggestToggle">Show more questions ▾</button>
      <div class="chat-container" style="height:450px">
        <div class="chat-messages ai-messages" id="aiMessages">
          ${hasHistory ? '' : '<div class="chat-bubble received">👋 Hello! I am VirtualAI, your Nigerian health assistant. Describe your symptoms and I will help you understand what might be wrong and which specialist to see.</div>'}
        </div>
        <div class="chat-input">
          <input type="text" id="aiInput" class="ai-input" placeholder="Describe your symptoms…">
          <button type="button" class="btn btn-primary btn-sm ai-send-btn" id="aiSendBtn">Send</button>
        </div>
      </div>
    </div>
  `;

  if (hasHistory) {
    const box = getAIChatBox(container);
    if (box) box.innerHTML = '';
    virtualAIHistory.forEach((msg) => {
      appendMessageBubble(container, msg.role === 'user' ? 'user' : 'ai', msg.content);
    });
    scrollToBottom(container);
  }

  const input = container.querySelector('#aiInput');
  const send = () => sendAIMessage(container, input.value, input);

  container.querySelector('#aiSendBtn')?.addEventListener('click', send);
  container.querySelector('#ai-new-chat')?.addEventListener('click', clearAIConversation);
  bindAIInputEnter(container);

  // Suggestion row clicks
  container.querySelectorAll('.ai-suggest-row').forEach((row) => {
    row.addEventListener('click', () => {
      const prompt = row.dataset.prompt || row.textContent.trim();
      sendAIMessage(container, prompt, input);
    });
  });

  // Show more / Show less toggle
  const toggleBtn = container.querySelector('#aiSuggestToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const list = container.querySelector('#aiSuggestList');
      const isExpanded = list.classList.toggle('ai-suggest-expanded');
      toggleBtn.textContent = isExpanded ? 'Show fewer questions ▴' : 'Show more questions ▾';
    });
  }
}
