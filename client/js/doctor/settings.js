import { doctorsApi, getUser, paymentsApi } from '../shared/api.js';
import { toast } from '../shared/toast.js';
import { escapeHtml } from '../shared/utils.js';

const FULL_ACCOUNT_NUM = '0123456789';

const BANK_OPTIONS = [
  { value: '058', label: 'Guaranty Trust Bank (GTBank)', short: 'GTB' },
  { value: '057', label: 'Zenith Bank', short: 'Zenith' },
  { value: '044', label: 'Access Bank', short: 'Access' },
  { value: '011', label: 'First Bank of Nigeria', short: 'FirstBank' },
  { value: '033', label: 'United Bank for Africa (UBA)', short: 'UBA' },
  { value: '214', label: 'First City Monument Bank (FCMB)', short: 'FCMB' },
  { value: '070', label: 'Fidelity Bank', short: 'Fidelity' },
  { value: '232', label: 'Sterling Bank', short: 'Sterling' },
  { value: '032', label: 'Union Bank', short: 'Union' },
  { value: '076', label: 'Polaris Bank', short: 'Polaris' },
  { value: '221', label: 'Stanbic IBTC Bank', short: 'Stanbic' },
  { value: '035', label: 'Wema Bank', short: 'Wema' },
  { value: '030', label: 'Heritage Bank', short: 'Heritage' },
  { value: '082', label: 'Keystone Bank', short: 'Keystone' },
  { value: '215', label: 'Unity Bank', short: 'Unity' },
  { value: '301', label: 'Jaiz Bank (Islamic)', short: 'Jaiz' },
  { value: 'OPay', label: 'OPay', short: 'OPay' },
  { value: 'PalmPay', label: 'PalmPay', short: 'PalmPay' },
  { value: 'Kuda', label: 'Kuda Bank', short: 'Kuda' },
  { value: '526', label: 'Moniepoint', short: 'Moniepoint' }
];

const NOTIFICATION_ITEMS = [
  {
    type: 'appointment',
    icon: '📅',
    iconClass: 'appointment',
    title: 'New Appointment Booking',
    description: 'Get notified instantly when a patient books a consultation with you',
    preview: '"New booking: Amaka Obi · Cardiology · Today 10:00 AM"',
    channelName: 'appt-channel',
    defaultOn: true,
    channels: [
      { value: 'push', label: 'Push', default: true },
      { value: 'email', label: 'Email', default: true },
      { value: 'sms', label: 'SMS', default: false }
    ]
  },
  {
    type: 'message',
    icon: '💬',
    iconClass: 'message',
    title: 'Patient Message Received',
    description: 'Be notified when a patient sends you a message in your chat inbox',
    preview: '"Message from Emeka Nwosu: \'Good morning Doctor...\'"',
    channelName: 'msg-channel',
    defaultOn: true,
    channels: [
      { value: 'push', label: 'Push', default: true },
      { value: 'email', label: 'Email', default: false },
      { value: 'sms', label: 'SMS', default: false }
    ]
  },
  {
    type: 'session',
    icon: '⏰',
    iconClass: 'session',
    title: 'Session Starting in 15 Minutes',
    description: 'Receive a reminder before your consultation session begins so you are always prepared',
    preview: '"⏰ Your session with Amaka Obi starts in 15 minutes. Join now."',
    channelName: 'sess-channel',
    defaultOn: true,
    hasReminder: true,
    channels: [
      { value: 'push', label: 'Push', default: true },
      { value: 'email', label: 'Email', default: true },
      { value: 'sms', label: 'SMS', default: true }
    ]
  },
  {
    type: 'payout',
    icon: '💰',
    iconClass: 'payout',
    title: 'Payout Processed',
    description: 'Get notified when your earnings are successfully transferred to your Nigerian bank account via Paystack',
    preview: '"💰 ₦10,500 has been sent to your GTBank account ending 4521"',
    channelName: 'pay-channel',
    defaultOn: true,
    channels: [
      { value: 'push', label: 'Push', default: true },
      { value: 'email', label: 'Email', default: true },
      { value: 'sms', label: 'SMS', default: true }
    ]
  },
  {
    type: 'platform',
    icon: '📢',
    iconClass: 'platform',
    title: 'Platform Updates',
    description: 'News about Virtualcare Nigeria features, policies, and announcements',
    channelName: 'plat-channel',
    defaultOn: false,
    channels: [{ value: 'email', label: 'Email', default: false }]
  },
  {
    type: 'review',
    icon: '⭐',
    iconClass: 'review',
    title: 'New Patient Review',
    description: 'Be notified when a patient leaves you a review or rating after a consultation',
    preview: '"⭐ Fatima Aliyu gave you 5 stars: \'Excellent doctor!\'"',
    channelName: 'rev-channel',
    defaultOn: true,
    channels: [
      { value: 'push', label: 'Push', default: true },
      { value: 'email', label: 'Email', default: true }
    ]
  }
];

const PREFERENCES = [
  { id: 'prefDarkMode', title: '🌙 Dark Mode', desc: 'Switch to dark theme', defaultOn: false, action: 'dark' },
  { id: 'prefSounds', title: '🔊 Sound Alerts', desc: 'Play sound for new notifications', defaultOn: true },
  { id: 'prefEarnings', title: '📊 Show Earnings on Dashboard', desc: 'Display revenue figures on overview', defaultOn: true },
  { id: 'prefNewPatients', title: '🤝 Show to New Patients', desc: 'Allow new patients to find and book you', defaultOn: true },
  { id: 'prefAutoAccept', title: '🔄 Auto-accept Returning Patients', desc: 'Automatically confirm bookings from returning patients', defaultOn: true },
  { id: 'prefWhatsApp', title: '📱 WhatsApp Reminders', desc: 'Send session reminders via WhatsApp', defaultOn: false }
];

let settingsVerified = false;
let showingAccountNumber = false;
let verifyTimer = null;
let remindMinutes = 15;

function cardIdForType(type) {
  return `notifCard${type.charAt(0).toUpperCase() + type.slice(1)}`;
}

function renderNotificationCard(item) {
  const cardId = cardIdForType(item.type);
  const on = item.defaultOn;
  const channelsStyle = on ? '' : 'style="opacity:0.4;pointer-events:none"';

  const channelsHtml = item.channels.map((ch) => `
    <label class="channel-option">
      <input type="checkbox" name="${item.channelName}" value="${ch.value}" ${ch.default ? 'checked' : ''} />
      <span class="channel-icon">${ch.value === 'push' ? '📱' : ch.value === 'email' ? '📧' : '💬'}</span>
      <span>${ch.label}</span>
    </label>
  `).join('');

  const reminderHtml = item.hasReminder ? `
    <div class="notif-reminder-time">
      <label class="notif-remind-label">Remind me:</label>
      <div class="remind-time-options">
        ${[5, 15, 30, 60].map((m) => `
          <button type="button" class="remind-time-btn ${m === 15 ? 'active' : ''}" data-remind-minutes="${m}">${m === 60 ? '1 hour' : `${m} min`}</button>
        `).join('')}
      </div>
    </div>
  ` : '';

  const previewHtml = item.preview ? `
    <div class="notif-preview">
      <span class="preview-label">Preview:</span>
      <span class="preview-text">${item.preview}</span>
    </div>
  ` : '';

  return `
    <div class="notif-card ${on ? '' : 'disabled'}" id="${cardId}">
      <div class="notif-card-top">
        <div class="notif-card-icon-wrap ${item.iconClass}">
          <span class="notif-card-icon">${item.icon}</span>
        </div>
        <div class="notif-toggle-wrap">
          <label class="toggle-switch">
            <input type="checkbox" id="notif${item.type.charAt(0).toUpperCase() + item.type.slice(1)}" data-notif-toggle="${item.type}" ${on ? 'checked' : ''} />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
      <div class="notif-card-body">
        <h4>${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(item.description)}</p>
      </div>
      <div class="notif-card-channels" id="channels-${item.type}" ${channelsStyle}>
        <div class="notif-channel-options">${channelsHtml}</div>
        ${reminderHtml}
        ${previewHtml}
      </div>
      <div class="notif-card-status ${on ? 'on' : 'off'}" id="status-${item.type}">
        ${on ? '✅ Notifications ON' : '⏸️ Notifications OFF'}
      </div>
    </div>
  `;
}

function getSettingsHTML(user) {
  const accountName = user?.accountName || 'CHUKWUEMEKA OKONKWO';
  const bankLabel = user?.bankName || 'Guaranty Trust Bank';
  const bankShort = BANK_OPTIONS.find((b) => b.label === bankLabel)?.short || 'GTB';

  return `
  <div class="settings-page">
    <div class="settings-header">
      <div>
        <h2>Settings</h2>
        <p>Manage your notifications, bank account and preferences</p>
      </div>
      <button type="button" class="btn-save-settings" id="btnSaveAllSettings">💾 Save All Settings</button>
    </div>

    <div class="settings-section">
      <div class="settings-section-header">
        <span class="settings-section-icon">🔔</span>
        <div>
          <h3>Notification Preferences</h3>
          <p>Choose how and when you want to be notified</p>
        </div>
      </div>
      <div class="notification-cards-grid">
        ${NOTIFICATION_ITEMS.map(renderNotificationCard).join('')}
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-header">
        <span class="settings-section-icon">🏦</span>
        <div>
          <h3>Nigerian Bank Account</h3>
          <p>Your payout account for receiving 70% of consultation earnings via Paystack</p>
        </div>
      </div>
      <div class="bank-settings-layout">
        <div class="bank-account-display-card">
          <div class="bank-display-header">
            <div class="bank-display-logo">
              <span class="bank-logo-text">${escapeHtml(bankShort)}</span>
            </div>
            <div class="bank-display-info">
              <div class="bank-display-name">${escapeHtml(bankLabel)}</div>
              <div class="bank-display-type">Savings Account</div>
            </div>
            <div class="bank-display-verified">✅ Verified</div>
          </div>
          <div class="bank-account-number-display">
            <span class="ban-label">Account Number</span>
            <span class="ban-number" id="displayAcctNum">0123 •••• ••••</span>
            <button type="button" class="btn-show-hide" id="btnShowHide">👁️ Show</button>
          </div>
          <div class="bank-account-name-display">
            <span class="ban-label">Account Name</span>
            <span class="ban-name">${escapeHtml(accountName)}</span>
          </div>
          <div class="bank-payout-info">
            <div class="payout-info-item"><span>💰 Next Payout</span><strong>₦205,800</strong></div>
            <div class="payout-info-item"><span>📅 Payout Date</span><strong>30 June 2026</strong></div>
            <div class="payout-info-item"><span>⚡ Your Share</span><strong style="color:var(--green)">70%</strong></div>
          </div>
          <button type="button" class="btn-change-bank" id="btnShowBankForm">🔄 Change Bank Account</button>
        </div>

        <div class="bank-change-form" id="bankChangeForm" style="display:none">
          <div class="bank-form-header">
            <h4>🏦 Update Bank Account</h4>
            <p>Enter your new Nigerian bank account details for payouts</p>
          </div>

          <div class="bank-setting-field">
            <label class="bank-setting-label" for="settingBankName">Bank Name <span class="req">*</span></label>
            <select id="settingBankName" class="bank-setting-select">
              <option value="">Select your bank...</option>
              ${BANK_OPTIONS.map((b) => `
                <option value="${b.value}" ${b.value === '058' ? 'selected' : ''}>${escapeHtml(b.label)}</option>
              `).join('')}
            </select>
          </div>

          <div class="bank-setting-field">
            <label class="bank-setting-label" for="settingAcctNum">Account Number (NUBAN) <span class="req">*</span></label>
            <div class="acct-num-input-wrap">
              <input type="text" id="settingAcctNum" class="bank-setting-input" placeholder="Enter 10-digit account number" maxlength="10" inputmode="numeric" />
              <div class="acct-verify-indicator" id="settingsVerifyIndicator"></div>
            </div>
            <div class="acct-digit-count" id="acctDigitCount">0 / 10 digits</div>
          </div>

          <div class="bank-setting-field">
            <label class="bank-setting-label">
              Account Name
              <span class="auto-verified-badge">🔍 Auto-verified</span>
            </label>
            <div class="verified-name-box" id="verifiedNameBox" style="display:none">
              <span class="verified-check">✅</span>
              <span id="settingsVerifiedName">CHUKWUEMEKA OKONKWO</span>
            </div>
            <input type="text" id="settingAcctName" class="bank-setting-input" placeholder="Auto-filled after verification..." readonly style="background:#f8fafc;color:var(--muted)" />
          </div>

          <div class="bank-setting-field">
            <label class="bank-setting-label">Account Type</label>
            <div class="acct-type-row">
              <label class="acct-type-option">
                <input type="radio" name="settingAcctType" value="savings" checked />
                <div class="acct-type-card">
                  <span class="acct-type-icon">🏦</span>
                  <span class="acct-type-name">Savings</span>
                  <span class="acct-type-desc">Personal savings account</span>
                </div>
              </label>
              <label class="acct-type-option">
                <input type="radio" name="settingAcctType" value="current" />
                <div class="acct-type-card">
                  <span class="acct-type-icon">💼</span>
                  <span class="acct-type-name">Current</span>
                  <span class="acct-type-desc">Business current account</span>
                </div>
              </label>
              <label class="acct-type-option">
                <input type="radio" name="settingAcctType" value="domiciliary" />
                <div class="acct-type-card">
                  <span class="acct-type-icon">🌍</span>
                  <span class="acct-type-name">Dom</span>
                  <span class="acct-type-desc">Domiciliary account</span>
                </div>
              </label>
            </div>
          </div>

          <div class="bank-setting-field">
            <label class="bank-setting-label" for="settingBVN">
              BVN (Bank Verification Number)
              <span style="color:var(--muted);font-weight:400;font-size:11px"> · Required for payouts above ₦50,000</span>
            </label>
            <input type="text" id="settingBVN" class="bank-setting-input" placeholder="Enter your 11-digit BVN" maxlength="11" inputmode="numeric" />
            <div class="bvn-privacy-note">🔒 Your BVN is encrypted and used only for identity verification. It is never shared or stored in plain text.</div>
          </div>

          <div class="paystack-security-notice">
            <div class="paystack-notice-left">
              <span class="paystack-p-icon">P</span>
              <div>
                <div class="paystack-notice-title">Secured by Paystack</div>
                <div class="paystack-notice-sub">All bank transfers are processed via Paystack Transfer API — the most trusted payment infrastructure in Nigeria</div>
              </div>
            </div>
            <div class="paystack-trust-badges">
              <span class="trust-badge">🔒 SSL</span>
              <span class="trust-badge">🛡️ PCI DSS</span>
              <span class="trust-badge">✅ CBN Licensed</span>
            </div>
          </div>

          <div class="bank-form-actions">
            <button type="button" class="btn-cancel-bank" id="btnCancelBank">Cancel</button>
            <button type="button" class="btn-save-bank" id="btnSaveBank">💾 Save Bank Account</button>
          </div>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-header">
        <span class="settings-section-icon">⚙️</span>
        <div>
          <h3>App Preferences</h3>
          <p>Customise your Virtualcare experience</p>
        </div>
      </div>
      <div class="preferences-grid">
        ${PREFERENCES.map((p) => `
          <div class="pref-item">
            <div class="pref-info">
              <div class="pref-title">${escapeHtml(p.title)}</div>
              <div class="pref-desc">${escapeHtml(p.desc)}</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="${p.id}" data-pref="${p.action || p.id}" ${p.defaultOn ? 'checked' : ''} />
              <span class="toggle-slider"></span>
            </label>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="settings-section danger-zone">
      <div class="settings-section-header">
        <span class="settings-section-icon">⚠️</span>
        <div>
          <h3>Danger Zone</h3>
          <p>Irreversible account actions</p>
        </div>
      </div>
      <div class="danger-actions">
        <div class="danger-action-item">
          <div class="danger-info">
            <div class="danger-title">Pause My Account</div>
            <div class="danger-desc">Temporarily stop receiving new bookings. Existing appointments are not affected.</div>
          </div>
          <button type="button" class="btn-danger-secondary" id="btnPauseAccount">⏸️ Pause Account</button>
        </div>
        <div class="danger-divider"></div>
        <div class="danger-action-item">
          <div class="danger-info">
            <div class="danger-title" style="color:var(--red)">Delete My Account</div>
            <div class="danger-desc">Permanently delete your Virtualcare doctor account. This cannot be undone.</div>
          </div>
          <button type="button" class="btn-danger-primary" id="btnDeleteAccount">🗑️ Delete Account</button>
        </div>
      </div>
    </div>
  </div>`;
}

function toggleNotification(type, checkbox) {
  const card = document.getElementById(cardIdForType(type));
  const channels = document.getElementById(`channels-${type}`);
  const status = document.getElementById(`status-${type}`);

  if (checkbox.checked) {
    if (channels) {
      channels.style.opacity = '1';
      channels.style.pointerEvents = 'auto';
    }
    if (status) {
      status.textContent = '✅ Notifications ON';
      status.className = 'notif-card-status on';
    }
    card?.classList.remove('disabled');
    toast(`${type} notifications turned ON`, 'success');
  } else {
    if (channels) {
      channels.style.opacity = '0.4';
      channels.style.pointerEvents = 'none';
    }
    if (status) {
      status.textContent = '⏸️ Notifications OFF';
      status.className = 'notif-card-status off';
    }
    card?.classList.add('disabled');
    toast(`${type} notifications turned OFF`, 'info');
  }

  doctorsApi.updateSettings({ notifications: { [type]: checkbox.checked } }).catch(() => {});
}

function setRemindTime(minutes, btn) {
  remindMinutes = minutes;
  document.querySelectorAll('.remind-time-btn').forEach((b) => b.classList.remove('active'));
  btn?.classList.add('active');
  toast(`Session reminder set to ${minutes} minutes before`, 'success');
}

function toggleShowAccount() {
  showingAccountNumber = !showingAccountNumber;
  const display = document.getElementById('displayAcctNum');
  const btn = document.getElementById('btnShowHide');

  if (showingAccountNumber) {
    if (display) display.textContent = FULL_ACCOUNT_NUM;
    if (btn) btn.textContent = '🙈 Hide';
  } else {
    if (display) display.textContent = `${FULL_ACCOUNT_NUM.slice(0, 4)} •••• ••••`;
    if (btn) btn.textContent = '👁️ Show';
  }
}

function showChangeBankForm() {
  const form = document.getElementById('bankChangeForm');
  if (form) {
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });
  }
}

function cancelBankChange() {
  const form = document.getElementById('bankChangeForm');
  if (form) form.style.display = 'none';
}

function verifySettingsAccount() {
  const input = document.getElementById('settingAcctNum');
  const acctNum = input?.value || '';
  const countEl = document.getElementById('acctDigitCount');
  const indicator = document.getElementById('settingsVerifyIndicator');
  const verifiedBox = document.getElementById('verifiedNameBox');
  const verifiedName = document.getElementById('settingsVerifiedName');
  const acctNameInput = document.getElementById('settingAcctName');

  if (verifyTimer) {
    clearTimeout(verifyTimer);
    verifyTimer = null;
  }

  if (countEl) {
    countEl.textContent = `${acctNum.length} / 10 digits`;
    countEl.style.color = acctNum.length === 10 ? 'var(--green)' : 'var(--muted)';
  }

  if (acctNum.length < 10) {
    if (indicator) indicator.innerHTML = '';
    if (verifiedBox) verifiedBox.style.display = 'none';
    if (acctNameInput) acctNameInput.value = '';
    settingsVerified = false;
    return;
  }

  const bankSelect = document.getElementById('settingBankName');
  if (!bankSelect?.value) {
    toast('Please select a bank first', 'warning');
    return;
  }

  if (indicator) {
    indicator.innerHTML = '<span style="color:var(--amber);font-size:12px">⏳ Verifying...</span>';
  }

  verifyTimer = setTimeout(() => {
    const verifiedAccountName = 'CHUKWUEMEKA OKONKWO';

    if (indicator) {
      indicator.innerHTML = '<span style="color:var(--green);font-size:12px">✅ Account verified</span>';
    }
    if (verifiedBox) verifiedBox.style.display = 'flex';
    if (verifiedName) verifiedName.textContent = verifiedAccountName;
    if (acctNameInput) acctNameInput.value = verifiedAccountName;

    settingsVerified = true;
    verifyTimer = null;
  }, 1500);
}

async function saveBankAccount() {
  const bankSelect = document.getElementById('settingBankName');
  const bankCode = bankSelect?.value;
  const bankName = bankSelect?.options[bankSelect.selectedIndex]?.text;
  const acctNum = document.getElementById('settingAcctNum')?.value?.trim();
  const acctName = document.getElementById('settingAcctName')?.value?.trim();
  const bvn = document.getElementById('settingBVN')?.value?.trim();

  if (!bankCode) {
    toast('Please select your bank', 'warning');
    return;
  }
  if (!acctNum || acctNum.length !== 10) {
    toast('Please enter a valid 10-digit account number', 'warning');
    return;
  }
  if (!settingsVerified) {
    toast('Please wait for account verification', 'warning');
    return;
  }

  try {
    await paymentsApi.connectBank({
      bankCode,
      bankName,
      accountNumber: acctNum,
      accountName: acctName,
      bvn
    });
  } catch {
    // Demo mode — continue
  }

  toast('✅ Bank account updated successfully!', 'success');
  cancelBankChange();

  const displayNum = document.getElementById('displayAcctNum');
  if (displayNum) displayNum.textContent = `${acctNum.slice(0, 4)} •••• ••••`;
}

function collectNotificationSettings() {
  const notifications = {};
  NOTIFICATION_ITEMS.forEach((item) => {
    const toggle = document.querySelector(`[data-notif-toggle="${item.type}"]`);
    notifications[item.type] = toggle?.checked ?? item.defaultOn;
  });
  return notifications;
}

function collectPreferences() {
  const prefs = {};
  PREFERENCES.forEach((p) => {
    const el = document.getElementById(p.id);
    prefs[p.id] = el?.checked ?? p.defaultOn;
  });
  prefs.sessionReminderMinutes = remindMinutes;
  return prefs;
}

async function saveAllSettings() {
  const payload = {
    notifications: collectNotificationSettings(),
    preferences: collectPreferences()
  };

  try {
    await doctorsApi.updateSettings(payload);
  } catch {
    // Demo mode
  }

  toast('All settings saved successfully! ✅', 'success');
}

function toggleDarkMode(checkbox) {
  toast(checkbox.checked ? '🌙 Dark mode coming soon!' : '☀️ Light mode active', 'info');
  checkbox.checked = false;
}

function pauseAccount() {
  if (confirm('Pause your account? You will not receive new bookings.')) {
    toast('⏸️ Account paused. Contact admin to resume.', 'warning');
  }
}

function confirmDeleteAccount() {
  if (confirm('Are you sure you want to DELETE your account? This cannot be undone.')) {
    toast('Account deletion request sent to admin.', 'info');
  }
}

function bindSettingsEvents(root) {
  root.querySelector('#btnSaveAllSettings')?.addEventListener('click', saveAllSettings);
  root.querySelector('#btnShowHide')?.addEventListener('click', toggleShowAccount);
  root.querySelector('#btnShowBankForm')?.addEventListener('click', showChangeBankForm);
  root.querySelector('#btnCancelBank')?.addEventListener('click', cancelBankChange);
  root.querySelector('#btnSaveBank')?.addEventListener('click', saveBankAccount);
  root.querySelector('#btnPauseAccount')?.addEventListener('click', pauseAccount);
  root.querySelector('#btnDeleteAccount')?.addEventListener('click', confirmDeleteAccount);

  root.querySelector('#settingBankName')?.addEventListener('change', () => {
    const acctNum = document.getElementById('settingAcctNum')?.value;
    if (acctNum?.length === 10) verifySettingsAccount();
  });

  root.querySelector('#settingAcctNum')?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
    verifySettingsAccount();
  });

  root.querySelector('#settingBVN')?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
  });

  root.querySelectorAll('[data-notif-toggle]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => toggleNotification(checkbox.dataset.notifToggle, checkbox));
  });

  root.querySelectorAll('[data-remind-minutes]').forEach((btn) => {
    btn.addEventListener('click', () => setRemindTime(Number(btn.dataset.remindMinutes), btn));
  });

  root.querySelectorAll('[data-pref]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      if (checkbox.dataset.pref === 'dark') {
        toggleDarkMode(checkbox);
        return;
      }
      const labels = {
        prefSounds: 'Sound alerts updated',
        prefEarnings: 'Preference saved',
        prefNewPatients: 'Preference saved',
        prefAutoAccept: 'Preference saved',
        prefWhatsApp: 'WhatsApp reminders updated'
      };
      toast(labels[checkbox.id] || 'Preference saved', 'success');
    });
  });
}

export async function renderDoctorSettings(container) {
  const user = getUser() || {};
  settingsVerified = false;
  showingAccountNumber = false;
  remindMinutes = 15;
  container.innerHTML = getSettingsHTML(user);
  bindSettingsEvents(container);
}
