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
    <div style="background:#fee2e2;border:2px solid #dc2626;border-radius:10px;padding:14px 18px;margin:10px 0;font-size:14px;color:#991b1b;font-weight:600">
      🚨 <strong>Priority Booking Activated</strong><br>
      <span style="font-weight:400">Your case has been flagged as urgent. A Virtualcare doctor will be prioritised for you. Please also call <strong>112</strong> if this is an emergency.</span>
      <br><br>
      <button type="button" id="priority-book-btn" style="background:#dc2626;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer">
        Book Priority Appointment Now
      </button>
    </div>
  `);
  box.querySelector('#priority-book-btn')?.addEventListener('click', () => {
    if (typeof window.openBookingFlow === 'function') window.openBookingFlow();
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
      '👋 Hello! I am VirtualAI, your Nigerian health assistant. Describe your symptoms and I will help you understand what might be wrong and which specialist to see.');
  }
}

export function resetVirtualAIHistory() {
  clearAIConversation();
}

async function sendAIMessage(container, userMessage, inputEl) {
  if (!userMessage || !userMessage.trim()) return;

  const trimmedMessage = userMessage.trim();

  var suggestWrap = container.querySelector('#vcaiSuggestWrap');
  if (suggestWrap) suggestWrap.style.display = 'none';

  virtualAIHistory.push({ role: 'user', content: trimmedMessage });
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

    virtualAIHistory.push({ role: 'ai', content: reply });
    appendMessageBubble(container, 'ai', reply);

    const data = result?.data || {};

    // Show doctor booking modal when AI triggers BOOK_APPOINTMENT
    if (data.bookingStatus === 'show_doctors' && data.doctors?.length > 0) {
      // Remove any existing modal
      document.getElementById('vc-booking-modal')?.remove();

      const modal = renderDoctorBookingModal(data);
      const modalEl = document.createElement('div');
      modalEl.innerHTML = modal;
      const modalNode = modalEl.firstElementChild;
      if (modalNode) {
        modalNode.dataset.reason = data.reason || 'VirtualAI referral';
        modalNode.dataset.urgency = data.urgency || 'normal';
        document.body.appendChild(modalNode);
      }

      // Also show a chat bubble with a book button
      const box = getAIChatBox(container);
      box?.insertAdjacentHTML('beforeend', `
        <div style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:12px;padding:14px 16px;margin-top:8px">
          <div style="font-size:13px;font-weight:600;color:#1d6aba;margin-bottom:8px">📋 I found available ${escapeHtml(data.specialist || 'doctors')} for you</div>
          <button type="button" onclick="window.openBookingFlow?.()" style="background:linear-gradient(135deg,#1d6aba,#0a2463);color:#fff;border:none;border-radius:8px;padding:12px 18px;font-size:13px;font-weight:700;cursor:pointer;width:100%;display:flex;align-items:center;justify-content:center;gap:8px">
            📅 View Available Doctors & Book
          </button>
        </div>
      `);
    } else if (data.bookingStatus === 'no_doctor_available') {
      const box = getAIChatBox(container);
      const specialist = escapeHtml(data.specialist || 'specialist');
      box?.insertAdjacentHTML('beforeend', `
        <div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:12px;padding:14px 16px;margin-top:8px">
          <div style="font-size:13px;color:#92400e;margin-bottom:10px">
            ⚠️ No <strong>${specialist}</strong> doctors are online right now. You can browse all available Virtualcare doctors and book a consultation.
          </div>
          <button type="button" onclick="window.openBookingFlow?.()" style="background:linear-gradient(135deg,#1d6aba,#0a2463);color:#fff;border:none;border-radius:8px;padding:12px 18px;font-size:13px;font-weight:700;cursor:pointer;width:100%;display:flex;align-items:center;justify-content:center;gap:8px">
            📅 Browse All Doctors & Book
          </button>
        </div>
      `);
    }

    if (result?.data?.priorityBookingTriggered) {
      showPriorityBookingBanner(container);
    }

    // Show book button for any specialty suggestion
    if (result?.data?.suggestSpecialty) {
      const box = getAIChatBox(container);
      box?.insertAdjacentHTML('beforeend', `
        <div style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:12px;padding:12px 16px;margin-top:8px;display:flex;align-items:center;gap:10px">
          <span style="font-size:20px">🏥</span>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:600;color:#0a2463">Book a ${escapeHtml(result.data.suggestSpecialty)}</div>
            <div style="font-size:12px;color:#64748b">Recommended by VirtualAI based on your symptoms</div>
          </div>
          <button type="button" onclick="window.openBookingFlowWithSpecialty?.('${escapeHtml(result.data.suggestSpecialty)}') || window.openBookingFlow?.()" style="background:#1d6aba;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap">
            Book Now
          </button>
        </div>
      `);
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
  const aiInput = container.querySelector('#aiInput');
  if (!aiInput) return;

  if (aiInput._aiEnterHandler) {
    aiInput.removeEventListener('keydown', aiInput._aiEnterHandler);
  }

  aiInput._aiEnterHandler = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const sendBtn = container.querySelector('#aiSendBtn');
      if (sendBtn) sendBtn.click();
      else sendAIMessage(container, aiInput.value, aiInput);
    }
  };

  aiInput.addEventListener('keydown', aiInput._aiEnterHandler);
}

const AI_SUGGESTIONS = [
  { icon: '🦟', text: 'I have fever, chills and body aches — could it be malaria?' },
  { icon: '🌡️', text: 'How do I know if I have typhoid fever?' },
  { icon: '❤️', text: 'My blood pressure reads 150/95 — is that dangerous?' },
  { icon: '🧬', text: 'My genotype is AS — what precautions should I take?' },
  { icon: '🤰', text: 'I am pregnant, what antenatal tests should I do?' },
  { icon: '😔', text: 'I have been feeling depressed and hopeless lately' },
  { icon: '🍚', text: 'I have severe stomach pain after eating' },
  { icon: '💊', text: 'I need advice on managing diabetes in Nigeria' },
  { icon: '👶', text: 'My baby has a fever and is not eating' },
  { icon: '🧠', text: 'I get severe headaches almost every day' },
  { icon: '🫁', text: 'I have a persistent cough for over 2 weeks' },
  { icon: '👁️', text: 'My eyes are red, itchy and swollen' },
  { icon: '🦴', text: 'My joints ache badly especially in the morning' },
  { icon: '🩸', text: 'I feel weak and dizzy — could it be low blood?' },
  { icon: '🏥', text: 'Recommend a specialist doctor near me' }
];

export async function renderAiChat(container) {
  activeAIContainer = container;
  const hasHistory = virtualAIHistory.length > 0;

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0;margin-bottom:12px">
      <h1 style="font-size:20px;font-weight:800;color:#0a2463;margin:0;white-space:nowrap">VirtualAI Health Assistant</h1>
      <button type="button" id="ai-new-chat" style="display:inline-flex;align-items:center;gap:4px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;border:none;border-radius:20px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0;box-shadow:0 2px 8px rgba(124,58,237,0.3)">✨ New Chat</button>
    </div>
    <div style="max-width:800px;margin:0 auto">
      <div style="background:#fef3c7;color:#92400e;padding:10px 14px;border-radius:8px;font-size:13px;margin-bottom:12px">⚠️ VirtualAI provides general health information only. Always consult a licensed doctor for medical advice.</div>
      <div id="vcaiSuggestWrap" style="${hasHistory ? 'display:none' : ''}">
        <p style="font-size:14px;font-weight:700;color:#0a2463;margin:8px 0 10px">💡 Try asking about:</p>
        <div id="vcaiSuggestList" style="display:flex;flex-direction:column;gap:8px;margin-bottom:8px">
          ${AI_SUGGESTIONS.map((s, i) => `
            <button type="button" data-vc-prompt="${escapeHtml(s.text)}" class="vcai-srow ${i >= 5 ? 'vcai-hidden' : ''}" style="
              display:${i >= 5 ? 'none' : 'flex'};align-items:center;gap:12px;width:100%;padding:12px 14px;
              background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;
              font-size:13.5px;font-weight:500;color:#0f172a;text-align:left;
              line-height:1.4;cursor:pointer;box-sizing:border-box;
            "
              onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 16px rgba(10,36,99,0.1)';this.style.borderColor='#3b99e0';this.style.background='linear-gradient(135deg,#eff6ff,#dbeafe)'"
              onmouseout="this.style.transform='';this.style.boxShadow='';this.style.borderColor='#e2e8f0';this.style.background='#fff'"
            >
              <span style="font-size:20px;flex-shrink:0;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:10px;background:#f1f5f9">${s.icon}</span>
              <span style="flex:1;min-width:0">${escapeHtml(s.text)}</span>
              <span style="flex-shrink:0;font-size:18px;color:#94a3b8;font-weight:600">›</span>
            </button>
          `).join('')}
        </div>
        <button type="button" id="vcaiToggle" style="display:block;width:100%;padding:10px;background:transparent;border:1.5px dashed #e2e8f0;border-radius:10px;font-size:13px;font-weight:600;color:#1d6aba;cursor:pointer;text-align:center;margin-bottom:14px">Show more questions ▾</button>
      </div>
      <div style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;display:flex;flex-direction:column;overflow:hidden;height:450px">
        <div class="chat-messages ai-messages" id="aiMessages" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px">
          ${hasHistory ? '' : '<div class="chat-bubble received">👋 Hello! I am VirtualAI, your Nigerian health assistant. Describe your symptoms and I will help you understand what might be wrong and which specialist to see.</div>'}
        </div>
        <div style="display:flex;gap:8px;padding:12px;border-top:1px solid #e2e8f0;background:#fff;align-items:center">
          <input type="text" id="aiInput" placeholder="Describe your symptoms…" style="flex:1;min-width:0;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:20px;font-size:16px;font-family:inherit;background:#f8fafc;box-sizing:border-box">
          <button type="button" id="aiSendBtn" style="flex-shrink:0;background:#1d6aba;color:#fff;border:none;border-radius:20px;padding:10px 18px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap">Send</button>
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
  container.querySelector('#ai-new-chat')?.addEventListener('click', () => {
    clearAIConversation();
    var wrap = container.querySelector('#vcaiSuggestWrap');
    if (wrap) wrap.style.display = '';
  });
  bindAIInputEnter(container);

  container.querySelectorAll('[data-vc-prompt]').forEach((row) => {
    row.addEventListener('click', () => {
      sendAIMessage(container, row.dataset.vcPrompt, input);
    });
  });

  var toggleBtn = container.querySelector('#vcaiToggle');
  if (toggleBtn) {
    var expanded = false;
    toggleBtn.addEventListener('click', () => {
      expanded = !expanded;
      container.querySelectorAll('.vcai-hidden').forEach((el) => {
        el.style.display = expanded ? 'flex' : 'none';
      });
      toggleBtn.textContent = expanded ? 'Show fewer questions ▴' : 'Show more questions ▾';
    });
  }
}
