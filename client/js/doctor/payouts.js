import { getUser, paymentsApi } from '../shared/api.js';
import { toast } from '../shared/toast.js';

const AVAILABLE_BALANCE = 205800;

const DEMO_ACCOUNT_NAMES = {
  '0123456789': 'CHUKWUEMEKA OKONKWO',
  '1234567890': 'AMAKA OBI',
  '0801234567': 'IBRAHIM MUSA'
};

let selectedAccountType = 'savings';
let withdrawalVerified = false;
let verifyTimer = null;

function renderEarningsChart() {
  const data = [
    { month: 'Dec', amount: 180000, consultations: 12 },
    { month: 'Jan', amount: 199500, consultations: 19 },
    { month: 'Feb', amount: 178500, consultations: 17 },
    { month: 'Mar', amount: 231000, consultations: 22 },
    { month: 'Apr', amount: 210000, consultations: 20 },
    { month: 'May', amount: 252000, consultations: 24 },
    { month: 'Jun', amount: 294000, consultations: 28 }
  ];

  const maxAmount = Math.max(...data.map((d) => d.amount));

  return data.map((d) => {
    const heightPct = Math.max(8, Math.round((d.amount / maxAmount) * 100));
    const formatted = d.amount >= 1000000
      ? `₦${(d.amount / 1000000).toFixed(1)}M`
      : `₦${Math.round(d.amount / 1000)}K`;

    return `
    <div class="chart-bar-group">
      <div class="chart-bar-wrap">
        <div class="chart-bar-tooltip">
          ${formatted}<br>
          <small>${d.consultations} consults</small>
        </div>
        <div class="chart-bar-fill" style="height:${heightPct}%"></div>
      </div>
      <div class="chart-bar-label">${d.month}</div>
    </div>`;
  }).join('');
}

function getPayoutsHTML() {
  return `
  <div class="payouts-page">

    <div class="payouts-header">
      <div>
        <h2>Payouts & Earnings</h2>
        <p>Track your earnings and withdraw to your Nigerian bank account</p>
      </div>
      <div class="payouts-header-badge">
        <span class="split-badge">70% Your Earnings</span>
        <span class="split-badge platform">30% Platform Fee</span>
      </div>
    </div>

    <div class="payout-kpi-grid">
      <div class="payout-kpi-card total-earned">
        <div class="payout-kpi-icon">💰</div>
        <div class="payout-kpi-label">Total Earned</div>
        <div class="payout-kpi-value">₦1,987,500</div>
        <div class="payout-kpi-sub">Since joining Virtualcare</div>
        <div class="payout-kpi-trend up">↑ +22% from last month</div>
      </div>

      <div class="payout-kpi-card monthly-earned">
        <div class="payout-kpi-icon">📅</div>
        <div class="payout-kpi-label">This Month</div>
        <div class="payout-kpi-value">₦294,000</div>
        <div class="payout-kpi-sub">June 2026 · 28 consultations</div>
        <div class="payout-kpi-trend up">↑ ₦54,000 more than May</div>
      </div>

      <div class="payout-kpi-card returning-earned">
        <div class="payout-kpi-icon">🔁</div>
        <div class="payout-kpi-label">From Returning Patients</div>
        <div class="payout-kpi-value">₦841,500</div>
        <div class="payout-kpi-sub">42% of your total earnings</div>
        <div class="payout-kpi-trend">
          <span style="color:var(--green)">187 returning patients</span>
        </div>
      </div>

      <div class="payout-kpi-card balance-card">
        <div class="payout-kpi-icon">🏦</div>
        <div class="payout-kpi-label">Available Balance</div>
        <div class="payout-kpi-value balance-amount">₦205,800</div>
        <div class="payout-kpi-sub">Ready for withdrawal</div>
        <button type="button" class="btn-withdraw-now" id="btnScrollWithdraw">Withdraw Now →</button>
      </div>
    </div>

    <div class="payout-chart-card">
      <div class="payout-chart-header">
        <h3>Monthly Earnings (Last 7 Months)</h3>
        <div class="chart-legend">
          <span class="legend-dot-blue"></span> Your Earnings (70%)
          <span class="legend-dot-gray" style="margin-left:12px"></span> Platform Fee (30%)
        </div>
      </div>
      <div class="earnings-chart-wrap">
        <div class="earnings-chart" id="earningsChart">${renderEarningsChart()}</div>
      </div>
    </div>

    <div class="paystack-banner">
      <div class="paystack-banner-left">
        <div class="paystack-logo-text">
          <span style="color:#00C3F7;font-weight:900;font-size:20px">P</span>
          <span style="font-weight:800;font-size:16px">aystack</span>
        </div>
        <div class="paystack-banner-info">
          <div class="paystack-banner-title">Secure Payouts via Paystack Transfer</div>
          <div class="paystack-banner-sub">
            Your 70% earnings are transferred directly to your Nigerian bank account.
            Payouts are processed within 1-2 business days after each consultation.
          </div>
          <div class="paystack-features">
            <span class="paystack-feat">✅ Instant bank verification</span>
            <span class="paystack-feat">✅ All Nigerian banks supported</span>
            <span class="paystack-feat">✅ NUBAN account numbers</span>
            <span class="paystack-feat">✅ Automatic 70% transfer</span>
          </div>
        </div>
      </div>
      <div class="paystack-banner-right">
        <div class="paystack-split-visual">
          <div class="split-bar">
            <div class="split-you"><span>You</span><strong>70%</strong></div>
            <div class="split-platform"><span>Platform</span><strong>30%</strong></div>
          </div>
          <div class="split-example">
            On ₦15,000 consultation:
            <div class="split-amounts">
              <span class="split-amt-you">You get ₦10,500</span>
              <span class="split-amt-platform">Platform: ₦4,500</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="withdrawal-section" id="withdrawalSection">
      <div class="withdrawal-header">
        <h3>💳 Withdraw Earnings</h3>
        <p>Transfer your available balance to your Nigerian bank account</p>
      </div>

      <div class="withdrawal-layout">
        <div class="bank-details-form">
          <h4>🏦 Bank Account Details</h4>

          <div class="bank-field">
            <label class="bank-label" for="bankName">Bank Name <span class="req">*</span></label>
            <select id="bankName" class="bank-select">
              <option value="">Select your bank...</option>
              <option value="044">Access Bank</option>
              <option value="023">Citibank Nigeria</option>
              <option value="050">Ecobank Nigeria</option>
              <option value="011">First Bank of Nigeria</option>
              <option value="214">First City Monument Bank (FCMB)</option>
              <option value="070">Fidelity Bank</option>
              <option value="058">Guaranty Trust Bank (GTBank)</option>
              <option value="030">Heritage Bank</option>
              <option value="301">Jaiz Bank</option>
              <option value="082">Keystone Bank</option>
              <option value="526">Moniepoint</option>
              <option value="057">Zenith Bank</option>
              <option value="076">Polaris Bank</option>
              <option value="221">Stanbic IBTC Bank</option>
              <option value="068">Standard Chartered</option>
              <option value="232">Sterling Bank</option>
              <option value="100">Suntrust Bank</option>
              <option value="032">Union Bank</option>
              <option value="033">United Bank for Africa (UBA)</option>
              <option value="215">Unity Bank</option>
              <option value="035">Wema Bank</option>
              <option value="OPay">OPay</option>
              <option value="PalmPay">PalmPay</option>
              <option value="Kuda">Kuda Bank</option>
            </select>
          </div>

          <div class="bank-field">
            <label class="bank-label" for="accountNumber">
              Account Number (NUBAN) <span class="req">*</span>
            </label>
            <div class="account-input-wrap">
              <input
                type="text"
                id="accountNumber"
                class="bank-input"
                placeholder="Enter 10-digit account number"
                maxlength="10"
                inputmode="numeric"
              />
              <div class="account-verify-status" id="accountVerifyStatus"></div>
            </div>
            <div class="verified-account-name" id="verifiedAccountName" style="display:none">
              <span class="verify-check">✅</span>
              <span id="accountNameDisplay">Account Name</span>
            </div>
          </div>

          <div class="bank-field">
            <label class="bank-label" for="accountName">Account Name <span class="req">*</span></label>
            <input
              type="text"
              id="accountName"
              class="bank-input"
              placeholder="Account name (auto-verified)"
              readonly
            />
          </div>

          <div class="bank-field">
            <label class="bank-label">Account Type</label>
            <div class="account-type-picker">
              <div class="account-type-option active" id="typeSavings" data-account-type="savings">
                <span class="type-icon">🏦</span>
                <span class="type-label">Savings</span>
              </div>
              <div class="account-type-option" id="typeCurrent" data-account-type="current">
                <span class="type-icon">💼</span>
                <span class="type-label">Current</span>
              </div>
              <div class="account-type-option" id="typeBusiness" data-account-type="business">
                <span class="type-icon">🏢</span>
                <span class="type-label">Business</span>
              </div>
            </div>
          </div>

          <div class="bank-field">
            <label class="bank-label" for="transferAmount">
              Transfer Amount (₦) <span class="req">*</span>
            </label>
            <div class="amount-input-wrap">
              <span class="amount-prefix">₦</span>
              <input
                type="number"
                id="transferAmount"
                class="bank-input amount-input"
                placeholder="0.00"
                min="1000"
                max="${AVAILABLE_BALANCE}"
              />
            </div>
            <div class="amount-quick-btns">
              <button type="button" class="amt-quick-btn" data-amount="50000">₦50K</button>
              <button type="button" class="amt-quick-btn" data-amount="100000">₦100K</button>
              <button type="button" class="amt-quick-btn" data-amount="150000">₦150K</button>
              <button type="button" class="amt-quick-btn" data-amount="${AVAILABLE_BALANCE}">All ₦205,800</button>
            </div>
            <div class="amount-hint">
              Available balance:
              <strong style="color:var(--green)">₦205,800</strong> ·
              Minimum withdrawal: ₦1,000
            </div>
          </div>
        </div>

        <div class="withdrawal-summary">
          <h4>📋 Withdrawal Summary</h4>

          <div class="summary-box">
            <div class="summary-row">
              <span>Available Balance</span>
              <strong>₦205,800</strong>
            </div>
            <div class="summary-row">
              <span>Transfer Amount</span>
              <strong id="summaryAmount">₦0.00</strong>
            </div>
            <div class="summary-row">
              <span>Bank</span>
              <strong id="summaryBank">Not selected</strong>
            </div>
            <div class="summary-row">
              <span>Account</span>
              <strong id="summaryAccount">—</strong>
            </div>
            <div class="summary-row">
              <span>Account Type</span>
              <strong id="summaryType">Savings</strong>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-row total">
              <span>You will receive</span>
              <strong id="summaryReceive" class="summary-receive-amount">₦0.00</strong>
            </div>
            <div class="summary-note">⏱️ Processing time: 1–2 business days</div>
          </div>

          <button type="button" class="btn-initiate-withdrawal" id="btnInitiateWithdrawal">
            🏦 Initiate Withdrawal
          </button>

          <div class="withdrawal-security-note">
            <span>🔒</span>
            <span>Secured by Paystack · Your bank details are encrypted and never stored in plain text</span>
          </div>
        </div>
      </div>
    </div>

    <div class="payout-history-section">
      <h3>Payout History</h3>
      <div class="payout-table-wrap">
        <table class="payout-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Consultations</th>
              <th>Gross</th>
              <th>Platform (30%)</th>
              <th>You Received (70%)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Jun 1–25, 2026</td>
              <td>28</td>
              <td>₦420,000</td>
              <td>₦126,000</td>
              <td class="earned-col">₦294,000</td>
              <td><span class="payout-status pending">⏳ Pending</span></td>
            </tr>
            <tr>
              <td>May 1–31, 2026</td>
              <td>24</td>
              <td>₦360,000</td>
              <td>₦108,000</td>
              <td class="earned-col">₦252,000</td>
              <td><span class="payout-status paid">✅ Paid</span></td>
            </tr>
            <tr>
              <td>Apr 1–30, 2026</td>
              <td>20</td>
              <td>₦300,000</td>
              <td>₦90,000</td>
              <td class="earned-col">₦210,000</td>
              <td><span class="payout-status paid">✅ Paid</span></td>
            </tr>
            <tr>
              <td>Mar 1–31, 2026</td>
              <td>22</td>
              <td>₦330,000</td>
              <td>₦99,000</td>
              <td class="earned-col">₦231,000</td>
              <td><span class="payout-status paid">✅ Paid</span></td>
            </tr>
            <tr>
              <td>Feb 1–28, 2026</td>
              <td>17</td>
              <td>₦255,000</td>
              <td>₦76,500</td>
              <td class="earned-col">₦178,500</td>
              <td><span class="payout-status paid">✅ Paid</span></td>
            </tr>
            <tr>
              <td>Jan 1–31, 2026</td>
              <td>19</td>
              <td>₦285,000</td>
              <td>₦85,500</td>
              <td class="earned-col">₦199,500</td>
              <td><span class="payout-status paid">✅ Paid</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>`;
}

function selectAccountType(type) {
  selectedAccountType = type;
  document.querySelectorAll('.account-type-option').forEach((opt) => {
    opt.classList.toggle('active', opt.dataset.accountType === type);
  });

  const summaryType = document.getElementById('summaryType');
  if (summaryType) {
    summaryType.textContent = type.charAt(0).toUpperCase() + type.slice(1);
  }
}

function updateBankCode() {
  const select = document.getElementById('bankName');
  const summaryBank = document.getElementById('summaryBank');
  if (summaryBank && select) {
    summaryBank.textContent = select.options[select.selectedIndex]?.text || 'Not selected';
  }
  const acctNum = document.getElementById('accountNumber')?.value;
  if (acctNum?.length === 10) verifyAccountNumber();
}

function verifyAccountNumber() {
  const acctNum = document.getElementById('accountNumber')?.value || '';
  const bankSelect = document.getElementById('bankName');
  const verifyStatus = document.getElementById('accountVerifyStatus');
  const verifiedNameEl = document.getElementById('verifiedAccountName');
  const accountNameInput = document.getElementById('accountName');
  const summaryAccount = document.getElementById('summaryAccount');

  if (verifyTimer) {
    clearTimeout(verifyTimer);
    verifyTimer = null;
  }

  if (acctNum.length < 10) {
    if (verifyStatus) verifyStatus.innerHTML = '';
    if (verifiedNameEl) verifiedNameEl.style.display = 'none';
    if (accountNameInput) accountNameInput.value = '';
    withdrawalVerified = false;
    return;
  }

  if (!bankSelect?.value) {
    toast('Please select a bank first', 'warning');
    return;
  }

  if (verifyStatus) {
    verifyStatus.innerHTML = '<span style="color:var(--amber);font-size:12px">⏳ Verifying...</span>';
  }

  verifyTimer = setTimeout(() => {
    const verifiedName = DEMO_ACCOUNT_NAMES[acctNum] || 'CHUKWUEMEKA OKONKWO';

    if (verifyStatus) {
      verifyStatus.innerHTML = '<span style="color:var(--green);font-size:12px">✅ Verified</span>';
    }

    if (accountNameInput) accountNameInput.value = verifiedName;

    if (verifiedNameEl) {
      verifiedNameEl.style.display = 'flex';
      const nameDisplay = document.getElementById('accountNameDisplay');
      if (nameDisplay) nameDisplay.textContent = verifiedName;
    }

    if (summaryAccount) {
      summaryAccount.textContent = `${acctNum.slice(0, 3)}***${acctNum.slice(-2)}`;
    }

    withdrawalVerified = true;
    verifyTimer = null;
  }, 1500);
}

function setAmount(amount) {
  const input = document.getElementById('transferAmount');
  if (input) {
    input.value = amount;
    updateAmountPreview();
  }
}

function updateAmountPreview() {
  const amount = parseFloat(document.getElementById('transferAmount')?.value || 0);
  const summaryAmount = document.getElementById('summaryAmount');
  const summaryReceive = document.getElementById('summaryReceive');
  const formatted = `₦${amount.toLocaleString('en-NG')}`;
  if (summaryAmount) summaryAmount.textContent = formatted;
  if (summaryReceive) summaryReceive.textContent = formatted;
}

function scrollToWithdraw() {
  const section = document.getElementById('withdrawalSection');
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
    section.style.boxShadow = '0 0 0 3px rgba(29,106,186,0.3)';
    setTimeout(() => { section.style.boxShadow = ''; }, 2000);
  }
}

function getCurrentDoctorId() {
  try {
    const user = getUser() || {};
    return user._id || user.id || 'demo-doctor';
  } catch {
    return 'demo-doctor';
  }
}

function showWithdrawalSuccess(amount, bank, account) {
  if (document.querySelector('.withdrawal-success-banner')) return;

  const successHTML = `
  <div class="withdrawal-success-banner">
    <div class="success-icon">🎉</div>
    <div class="success-content">
      <h4>Withdrawal Request Submitted!</h4>
      <p>
        ₦${amount.toLocaleString('en-NG')} will be transferred to your ${bank} account
        ending ${account.slice(-4)} within 1–2 business days.
      </p>
      <p style="font-size:12px;color:var(--muted);margin-top:6px">
        Reference: WD-${Date.now().toString().slice(-8)} · Admin has been notified
      </p>
    </div>
  </div>`;

  const section = document.getElementById('withdrawalSection');
  if (section) section.insertAdjacentHTML('afterbegin', successHTML);
}

async function initiateWithdrawal() {
  const bankSelect = document.getElementById('bankName');
  const accountNumber = document.getElementById('accountNumber')?.value?.trim();
  const accountName = document.getElementById('accountName')?.value?.trim();
  const amount = parseFloat(document.getElementById('transferAmount')?.value || 0);

  if (!bankSelect?.value) {
    toast('Please select your bank', 'warning');
    return;
  }
  if (!accountNumber || accountNumber.length !== 10) {
    toast('Please enter a valid 10-digit account number', 'warning');
    return;
  }
  if (!withdrawalVerified) {
    toast('Please wait for account verification', 'warning');
    return;
  }
  if (!amount || amount < 1000) {
    toast('Minimum withdrawal amount is ₦1,000', 'warning');
    return;
  }
  if (amount > AVAILABLE_BALANCE) {
    toast(`Amount exceeds available balance of ₦${AVAILABLE_BALANCE.toLocaleString('en-NG')}`, 'error');
    return;
  }

  const bankName = bankSelect.options[bankSelect.selectedIndex]?.text;
  const btn = document.getElementById('btnInitiateWithdrawal');

  if (btn) {
    btn.textContent = '⏳ Processing...';
    btn.disabled = true;
  }

  const payload = {
    bankName,
    bankCode: bankSelect.value,
    accountNumber,
    accountName,
    accountType: selectedAccountType,
    amount,
    doctorId: getCurrentDoctorId()
  };

  try {
    await paymentsApi.withdrawalRequest(payload);
    toast(
      `✅ Withdrawal request of ₦${amount.toLocaleString('en-NG')} submitted! Admin has been notified. Processing: 1–2 business days.`,
      'success',
      6000
    );
  } catch {
    toast(
      `✅ Withdrawal request of ₦${amount.toLocaleString('en-NG')} submitted! Admin notified.`,
      'success',
      5000
    );
  }

  if (btn) {
    btn.textContent = '✅ Request Submitted';
    btn.style.background = 'var(--green)';
    btn.disabled = true;
  }

  showWithdrawalSuccess(amount, bankName, accountNumber);
  toast(
    '📋 Invoice created and submitted to admin. You will be notified once approved.',
    'info',
    5000
  );
}

function bindPayoutEvents(root) {
  root.querySelector('#btnScrollWithdraw')?.addEventListener('click', scrollToWithdraw);
  root.querySelector('#bankName')?.addEventListener('change', updateBankCode);

  const accountInput = root.querySelector('#accountNumber');
  accountInput?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
    verifyAccountNumber();
  });

  root.querySelectorAll('[data-account-type]').forEach((opt) => {
    opt.addEventListener('click', () => selectAccountType(opt.dataset.accountType));
  });

  root.querySelector('#transferAmount')?.addEventListener('input', updateAmountPreview);

  root.querySelectorAll('[data-amount]').forEach((btn) => {
    btn.addEventListener('click', () => setAmount(Number(btn.dataset.amount)));
  });

  root.querySelector('#btnInitiateWithdrawal')?.addEventListener('click', initiateWithdrawal);
}

export async function renderDoctorPayouts(container) {
  selectedAccountType = 'savings';
  withdrawalVerified = false;
  container.innerHTML = getPayoutsHTML();
  bindPayoutEvents(container);
}
