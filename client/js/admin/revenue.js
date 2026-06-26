import { toast } from '../shared/toast.js';
import { escapeHtml } from '../shared/utils.js';

let revRoot = null;
let currentRevTab = 'invoices';
let currentInvoiceView = 'table';

const INVOICE_DATA = [
  {
    id: 'INV-2026-001', doctorId: 'D-001',
    doctorName: 'Dr. Chukwuemeka Okonkwo',
    doctorInitials: 'CO', specialty: 'Cardiology',
    period: 'June 2026', consultations: 28,
    grossAmount: 420000, platformCut: 126000,
    doctorAmount: 294000, status: 'pending',
    submittedDate: 'Wed, 25 Jun 2026',
    bankName: 'GTBank', accountNo: '0123***789',
    dueDate: '30 Jun 2026', notes: '',
    archived: false
  },
  {
    id: 'INV-2026-002', doctorId: 'D-002',
    doctorName: 'Dr. Adaeze Nwosu',
    doctorInitials: 'AN', specialty: 'Dermatology',
    period: 'June 2026', consultations: 22,
    grossAmount: 220000, platformCut: 66000,
    doctorAmount: 154000, status: 'approved',
    submittedDate: 'Tue, 24 Jun 2026',
    bankName: 'Zenith Bank', accountNo: '2093***456',
    dueDate: '30 Jun 2026', notes: 'Approved',
    archived: false
  },
  {
    id: 'INV-2026-003', doctorId: 'D-003',
    doctorName: 'Dr. Ibrahim Musa',
    doctorInitials: 'IM', specialty: 'General Practice',
    period: 'June 2026', consultations: 48,
    grossAmount: 240000, platformCut: 72000,
    doctorAmount: 168000, status: 'paid',
    submittedDate: 'Mon, 23 Jun 2026',
    bankName: 'Access Bank', accountNo: '0567***234',
    dueDate: '25 Jun 2026', notes: 'Paid via Paystack',
    archived: false
  },
  {
    id: 'INV-2026-004', doctorId: 'D-004',
    doctorName: 'Dr. Chioma Eze',
    doctorInitials: 'CE', specialty: 'Pediatrics',
    period: 'June 2026', consultations: 19,
    grossAmount: 152000, platformCut: 45600,
    doctorAmount: 106400, status: 'pending',
    submittedDate: 'Wed, 25 Jun 2026',
    bankName: 'First Bank', accountNo: '3021***901',
    dueDate: '30 Jun 2026', notes: '',
    archived: false
  },
  {
    id: 'INV-2026-005', doctorId: 'D-005',
    doctorName: 'Dr. Tunde Fashola',
    doctorInitials: 'TF', specialty: 'Neurology',
    period: 'June 2026', consultations: 14,
    grossAmount: 280000, platformCut: 84000,
    doctorAmount: 196000, status: 'approved',
    submittedDate: 'Tue, 24 Jun 2026',
    bankName: 'UBA', accountNo: '1234***567',
    dueDate: '30 Jun 2026', notes: '',
    archived: false
  },
  {
    id: 'INV-2025-089', doctorId: 'D-001',
    doctorName: 'Dr. Chukwuemeka Okonkwo',
    doctorInitials: 'CO', specialty: 'Cardiology',
    period: 'December 2025', consultations: 31,
    grossAmount: 465000, platformCut: 139500,
    doctorAmount: 325500, status: 'paid',
    submittedDate: 'Tue, 30 Dec 2025',
    bankName: 'GTBank', accountNo: '0123***789',
    dueDate: '5 Jan 2026', notes: 'Paid',
    archived: true
  },
  {
    id: 'INV-2025-088', doctorId: 'D-002',
    doctorName: 'Dr. Adaeze Nwosu',
    doctorInitials: 'AN', specialty: 'Dermatology',
    period: 'November 2025', consultations: 24,
    grossAmount: 240000, platformCut: 72000,
    doctorAmount: 168000, status: 'paid',
    submittedDate: 'Mon, 1 Dec 2025',
    bankName: 'Zenith Bank', accountNo: '2093***456',
    dueDate: '5 Dec 2025', notes: 'Paid',
    archived: true
  }
];

const PAYOUT_HISTORY = [
  {
    id: 'PAY-001', doctor: 'Dr. Ibrahim Musa',
    initials: 'IM', invoiceRef: 'INV-2026-003',
    amount: 168000, bank: 'Access Bank',
    accountNo: '0567***234', date: 'Mon, 23 Jun 2026',
    method: 'Paystack Transfer', status: 'success',
    reference: 'PST-2026-88234'
  },
  {
    id: 'PAY-002', doctor: 'Dr. Adaeze Nwosu',
    initials: 'AN', invoiceRef: 'INV-2026-002',
    amount: 154000, bank: 'Zenith Bank',
    accountNo: '2093***456', date: 'Fri, 20 Jun 2026',
    method: 'Paystack Transfer', status: 'success',
    reference: 'PST-2026-77123'
  },
  {
    id: 'PAY-003', doctor: 'Dr. Chioma Eze',
    initials: 'CE', invoiceRef: 'INV-2026-101',
    amount: 98000, bank: 'First Bank',
    accountNo: '3021***901', date: 'Mon, 17 Jun 2026',
    method: 'Paystack Transfer', status: 'success',
    reference: 'PST-2026-66012'
  },
  {
    id: 'PAY-004', doctor: 'Dr. Tunde Fashola',
    initials: 'TF', invoiceRef: 'INV-2026-099',
    amount: 210000, bank: 'UBA',
    accountNo: '1234***567', date: 'Fri, 13 Jun 2026',
    method: 'Paystack Transfer', status: 'pending',
    reference: 'PST-2026-55901'
  }
];

const CHART_MONTHS = [
  { m: 'Jan', rev: 4200000, pay: 2940000, plat: 1260000 },
  { m: 'Feb', rev: 5100000, pay: 3570000, plat: 1530000 },
  { m: 'Mar', rev: 6300000, pay: 4410000, plat: 1890000 },
  { m: 'Apr', rev: 7600000, pay: 5320000, plat: 2280000 },
  { m: 'May', rev: 9400000, pay: 6580000, plat: 2820000 },
  { m: 'Jun', rev: 5200000, pay: 3640000, plat: 1560000 }
];

const TOTAL_REVENUE = 57700000;
const TOTAL_PAYOUT = 40390000;
const MONTHLY_REVENUE = 5200000;
const MONTHLY_PAYOUT = 3640000;
const WEEKLY_REVENUE = 1250000;
const WEEKLY_PAYOUT = 875000;

const ROW_STATUS_CONFIG = {
  pending: { bg: '#fef3c7', color: '#92400e', label: '⏳ Pending' },
  approved: { bg: '#dcfce7', color: '#166534', label: '✅ Approved' },
  paid: { bg: '#dbeafe', color: '#1e40af', label: '💰 Paid' },
  rejected: { bg: '#fee2e2', color: '#991b1b', label: '❌ Rejected' }
};

const CARD_STATUS_CONFIG = {
  pending: { bg: '#fef3c7', color: '#92400e', label: '⏳ Pending', border: '#fde68a' },
  approved: { bg: '#dcfce7', color: '#166534', label: '✅ Approved', border: '#86efac' },
  paid: { bg: '#dbeafe', color: '#1e40af', label: '💰 Paid', border: '#bfdbfe' },
  rejected: { bg: '#fee2e2', color: '#991b1b', label: '❌ Rejected', border: '#fca5a5' }
};

const MODAL_STATUS_CONFIG = {
  pending: { bg: '#d97706', label: '⏳ Pending' },
  approved: { bg: '#16a34a', label: '✅ Approved' },
  paid: { bg: '#1d6aba', label: '💰 Paid' },
  rejected: { bg: '#dc2626', label: '❌ Rejected' }
};

function fmt(n) {
  if (n >= 1000000) return `₦${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `₦${Math.round(n / 1000)}K`;
  return `₦${n.toLocaleString('en-NG')}`;
}

function fmtNgn(n) {
  return `₦${n.toLocaleString('en-NG')}`;
}

function getActiveInvoices() {
  return INVOICE_DATA.filter((i) => !i.archived);
}

function getArchivedInvoices() {
  return INVOICE_DATA.filter((i) => i.archived);
}

function getInvoiceStats() {
  const active = getActiveInvoices();
  return {
    active,
    pending: active.filter((i) => i.status === 'pending'),
    approved: active.filter((i) => i.status === 'approved'),
    paid: active.filter((i) => i.status === 'paid')
  };
}

function renderRevenueChart() {
  const max = 9400000;
  return CHART_MONTHS.map((d) => {
    const revH = Math.round((d.rev / max) * 100);
    const payH = Math.round((d.pay / max) * 100);
    const platH = Math.round((d.plat / max) * 100);
    return `
    <div class="rcb-group">
      <div class="rcb-bars">
        <div class="rcb-bar rev-bar" style="height:${revH}%"
          title="₦${(d.rev / 1000000).toFixed(1)}M"></div>
        <div class="rcb-bar pay-bar" style="height:${payH}%"
          title="₦${(d.pay / 1000000).toFixed(1)}M"></div>
        <div class="rcb-bar plat-bar" style="height:${platH}%"
          title="₦${(d.plat / 1000000).toFixed(1)}M"></div>
      </div>
      <div class="rcb-label">${escapeHtml(d.m)}</div>
    </div>`;
  }).join('');
}

function renderInvoiceRow(inv) {
  const sc = ROW_STATUS_CONFIG[inv.status] || ROW_STATUS_CONFIG.pending;

  return `
  <tr class="inv-row inv-status-${escapeHtml(inv.status)}"
    id="invRow-${escapeHtml(inv.id)}"
    data-status="${escapeHtml(inv.status)}">
    <td><span class="inv-id-badge">${escapeHtml(inv.id)}</span></td>
    <td>
      <div class="inv-doctor-cell">
        <div class="inv-doc-avatar">${escapeHtml(inv.doctorInitials)}</div>
        <div>
          <div class="inv-doc-name">${escapeHtml(inv.doctorName)}</div>
          <div class="inv-doc-id">#${escapeHtml(inv.doctorId)}</div>
        </div>
      </div>
    </td>
    <td><span class="specialty-chip">${escapeHtml(inv.specialty)}</span></td>
    <td class="inv-period">${escapeHtml(inv.period)}</td>
    <td class="inv-consults">${inv.consultations}</td>
    <td class="inv-gross">${fmtNgn(inv.grossAmount)}</td>
    <td class="inv-platform">${fmtNgn(inv.platformCut)}</td>
    <td class="inv-doctor-payout">${fmtNgn(inv.doctorAmount)}</td>
    <td>
      <div class="inv-bank-cell">
        <div class="inv-bank-name">${escapeHtml(inv.bankName)}</div>
        <div class="inv-acct-no">${escapeHtml(inv.accountNo)}</div>
      </div>
    </td>
    <td class="inv-due ${inv.status === 'pending' ? 'due-urgent' : ''}">
      ${escapeHtml(inv.dueDate)}
    </td>
    <td>
      <span class="inv-status-badge" style="background:${sc.bg};color:${sc.color}">
        ${sc.label}
      </span>
    </td>
    <td>
      <div class="inv-row-actions">
        <button type="button" class="btn-ira view" data-action="view-invoice"
          data-id="${escapeHtml(inv.id)}" title="View">👁️</button>
        ${inv.status === 'pending' ? `
        <button type="button" class="btn-ira approve" data-action="approve-invoice"
          data-id="${escapeHtml(inv.id)}" title="Approve">✅</button>
        <button type="button" class="btn-ira reject" data-action="reject-invoice"
          data-id="${escapeHtml(inv.id)}" title="Reject">✗</button>` : ''}
        ${inv.status === 'approved' ? `
        <button type="button" class="btn-ira pay" data-action="process-payment"
          data-id="${escapeHtml(inv.id)}" title="Pay Now">💸</button>` : ''}
        <button type="button" class="btn-ira download" data-action="download-invoice"
          data-id="${escapeHtml(inv.id)}" title="Download PDF">📄</button>
        <button type="button" class="btn-ira archive" data-action="archive-invoice"
          data-id="${escapeHtml(inv.id)}" title="Archive">🗄️</button>
      </div>
    </td>
  </tr>`;
}

function renderInvoiceCard(inv) {
  const sc = CARD_STATUS_CONFIG[inv.status] || CARD_STATUS_CONFIG.pending;

  return `
  <div class="inv-card" id="invCard-${escapeHtml(inv.id)}"
    style="border-top:3px solid ${sc.border}"
    data-status="${escapeHtml(inv.status)}">
    <div class="inv-card-header">
      <span class="inv-id-badge">${escapeHtml(inv.id)}</span>
      <span class="inv-status-badge" style="background:${sc.bg};color:${sc.color}">
        ${sc.label}
      </span>
    </div>
    <div class="inv-card-doctor">
      <div class="inv-doc-avatar large">${escapeHtml(inv.doctorInitials)}</div>
      <div>
        <div class="inv-doc-name">${escapeHtml(inv.doctorName)}</div>
        <div class="inv-doc-specialty">${escapeHtml(inv.specialty)}</div>
        <div class="inv-period-badge">📅 ${escapeHtml(inv.period)}</div>
      </div>
    </div>
    <div class="inv-card-financials">
      <div class="icf-row"><span>Consultations</span><strong>${inv.consultations}</strong></div>
      <div class="icf-row"><span>Gross Amount</span><strong>${fmtNgn(inv.grossAmount)}</strong></div>
      <div class="icf-row">
        <span>Platform (30%)</span>
        <strong class="platform-cut">${fmtNgn(inv.platformCut)}</strong>
      </div>
      <div class="icf-row total-row">
        <span>Doctor Payout (70%)</span>
        <strong class="doctor-payout">${fmtNgn(inv.doctorAmount)}</strong>
      </div>
    </div>
    <div class="inv-card-bank">
      <span class="icb-label">🏦</span>
      <span>${escapeHtml(inv.bankName)} · ${escapeHtml(inv.accountNo)}</span>
    </div>
    <div class="inv-card-due">
      <span class="icd-label">Due:</span>
      <span class="${inv.status === 'pending' ? 'due-urgent' : ''}">
        ${escapeHtml(inv.dueDate)}
      </span>
    </div>
    <div class="inv-card-actions">
      <button type="button" class="btn-inv-card view" data-action="view-invoice"
        data-id="${escapeHtml(inv.id)}">👁️ View</button>
      ${inv.status === 'pending' ? `
      <button type="button" class="btn-inv-card approve" data-action="approve-invoice"
        data-id="${escapeHtml(inv.id)}">✅ Approve</button>
      <button type="button" class="btn-inv-card reject" data-action="reject-invoice"
        data-id="${escapeHtml(inv.id)}">✗ Reject</button>` : ''}
      ${inv.status === 'approved' ? `
      <button type="button" class="btn-inv-card pay" data-action="process-payment"
        data-id="${escapeHtml(inv.id)}">💸 Pay Now</button>` : ''}
      <button type="button" class="btn-inv-card download" data-action="download-invoice"
        data-id="${escapeHtml(inv.id)}">📄 PDF</button>
    </div>
  </div>`;
}

function renderInvoicesSection(active, pending, approved, paid) {
  return `
  <div class="invoices-section">
    <div class="inv-stats-row">
      <div class="inv-stat-card pending-inv">
        <div class="isc-icon">⏳</div>
        <div class="isc-value" id="invStatPending">${pending.length}</div>
        <div class="isc-label">Pending Review</div>
        <div class="isc-amount" id="invAmtPending">
          ${fmtNgn(pending.reduce((s, i) => s + i.doctorAmount, 0))}
        </div>
      </div>
      <div class="inv-stat-card approved-inv">
        <div class="isc-icon">✅</div>
        <div class="isc-value" id="invStatApproved">${approved.length}</div>
        <div class="isc-label">Approved</div>
        <div class="isc-amount" id="invAmtApproved">
          ${fmtNgn(approved.reduce((s, i) => s + i.doctorAmount, 0))}
        </div>
      </div>
      <div class="inv-stat-card paid-inv">
        <div class="isc-icon">💰</div>
        <div class="isc-value" id="invStatPaid">${paid.length}</div>
        <div class="isc-label">Paid Out</div>
        <div class="isc-amount" id="invAmtPaid">
          ${fmtNgn(paid.reduce((s, i) => s + i.doctorAmount, 0))}
        </div>
      </div>
      <div class="inv-stat-card total-inv">
        <div class="isc-icon">📋</div>
        <div class="isc-value" id="invStatTotal">${active.length}</div>
        <div class="isc-label">Total Active</div>
        <div class="isc-amount" id="invAmtTotal">
          ${fmtNgn(active.reduce((s, i) => s + i.doctorAmount, 0))}
        </div>
      </div>
    </div>

    <div class="inv-toolbar">
      <div class="inv-search-wrap">
        <span class="inv-search-icon">🔍</span>
        <input type="text" id="invoiceSearch" class="inv-search-input"
          placeholder="Search by doctor, invoice ID..." />
      </div>
      <div class="inv-filters">
        <select class="inv-filter-select" id="invoiceStatusFilter">
          <option value="">All Status</option>
          <option value="pending">⏳ Pending</option>
          <option value="approved">✅ Approved</option>
          <option value="paid">💰 Paid</option>
          <option value="rejected">❌ Rejected</option>
        </select>
        <select class="inv-filter-select" id="invoiceSortFilter">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="amount-high">Highest Amount</option>
          <option value="amount-low">Lowest Amount</option>
          <option value="pending-first">Pending First</option>
        </select>
      </div>
      <div class="inv-view-toggle">
        <button type="button" class="ivt-btn active" id="ivt-table"
          data-action="set-invoice-view" data-view="table" title="Table view">☰</button>
        <button type="button" class="ivt-btn" id="ivt-cards"
          data-action="set-invoice-view" data-view="cards" title="Card view">⊞</button>
      </div>
    </div>

    <div id="invoiceTableView" class="inv-table-wrap">
      <table class="inv-table">
        <thead>
          <tr>
            <th>Invoice ID</th>
            <th>Doctor</th>
            <th>Specialty</th>
            <th>Period</th>
            <th>Consultations</th>
            <th>Gross</th>
            <th>Platform (30%)</th>
            <th>Doctor Payout (70%)</th>
            <th>Bank</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="invoiceTableBody">
          ${active.map((inv) => renderInvoiceRow(inv)).join('')}
        </tbody>
      </table>
    </div>

    <div id="invoiceCardsView" style="display:none">
      <div class="inv-cards-grid" id="invoiceCardsGrid">
        ${active.map((inv) => renderInvoiceCard(inv)).join('')}
      </div>
    </div>
  </div>`;
}

function renderPayoutRow(p) {
  const statusLabel = p.status === 'success'
    ? '✅ Success'
    : p.status === 'pending'
      ? '⏳ Pending'
      : '❌ Failed';

  return `
  <tr class="inv-row payout-status-${escapeHtml(p.status)}"
    id="payoutRow-${escapeHtml(p.id)}">
    <td><span class="inv-id-badge">${escapeHtml(p.id)}</span></td>
    <td>
      <span class="inv-ref-link" data-action="view-invoice-ref"
        data-id="${escapeHtml(p.invoiceRef)}">${escapeHtml(p.invoiceRef)}</span>
    </td>
    <td>
      <div class="inv-doctor-cell">
        <div class="inv-doc-avatar">${escapeHtml(p.initials)}</div>
        <div class="inv-doc-name">${escapeHtml(p.doctor)}</div>
      </div>
    </td>
    <td class="inv-doctor-payout">${fmtNgn(p.amount)}</td>
    <td>${escapeHtml(p.bank)}</td>
    <td class="inv-acct-no">${escapeHtml(p.accountNo)}</td>
    <td class="inv-period">${escapeHtml(p.date)}</td>
    <td><span class="method-badge">${escapeHtml(p.method)}</span></td>
    <td><span class="ref-badge">${escapeHtml(p.reference)}</span></td>
    <td>
      <span class="payout-status-badge pst-${escapeHtml(p.status)}">
        ${statusLabel}
      </span>
    </td>
    <td>
      <div class="inv-row-actions">
        <button type="button" class="btn-ira view" data-action="view-payout-receipt"
          data-id="${escapeHtml(p.id)}" title="View Receipt">👁️</button>
        <button type="button" class="btn-ira download" data-action="download-payout-receipt"
          data-id="${escapeHtml(p.id)}" title="Download">📄</button>
      </div>
    </td>
  </tr>`;
}

function renderPayoutHistorySection(payouts) {
  const totalPaid = payouts.reduce(
    (s, p) => s + (p.status === 'success' ? p.amount : 0),
    0
  );

  return `
  <div class="payout-history-section">
    <div class="ph-toolbar">
      <div class="ph-search-wrap">
        <span>🔍</span>
        <input type="text" id="payoutSearch" class="inv-search-input"
          placeholder="Search payouts..." />
      </div>
      <div class="ph-filters">
        <select class="inv-filter-select" id="payoutStatusFilter">
          <option value="">All Status</option>
          <option value="success">✅ Success</option>
          <option value="pending">⏳ Pending</option>
          <option value="failed">❌ Failed</option>
        </select>
        <select class="inv-filter-select" id="payoutSortFilter">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="amount-high">Highest Amount</option>
        </select>
      </div>
      <div class="ph-total-banner">
        Total Paid Out:
        <strong style="color:var(--green)">${fmtNgn(totalPaid)}</strong>
      </div>
    </div>

    <div class="ph-table-wrap">
      <table class="inv-table" id="payoutTable">
        <thead>
          <tr>
            <th>Payout ID</th>
            <th>Invoice Ref</th>
            <th>Doctor</th>
            <th>Amount</th>
            <th>Bank</th>
            <th>Account</th>
            <th>Date</th>
            <th>Method</th>
            <th>Reference</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="payoutTableBody">
          ${payouts.map((p) => renderPayoutRow(p)).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderArchiveSection(archived) {
  return `
  <div class="archive-section">
    <div class="archive-intro-banner">
      <span class="archive-icon">🗄️</span>
      <div>
        <strong>Invoice Archive</strong>
        <p>Invoices older than 6 months are automatically moved here for compliance
          and auditing purposes. Archive records are read-only.</p>
      </div>
      <div class="archive-count-badge" id="archiveCountBadge">
        ${archived.length} archived records
      </div>
    </div>

    <div class="archive-filter-bar">
      <select class="inv-filter-select" id="archivePeriodFilter">
        <option value="">All Periods</option>
        <option value="2025">2025</option>
        <option value="2024">2024</option>
        <option value="2023">2023</option>
      </select>
      <select class="inv-filter-select" id="archiveDoctorFilter">
        <option value="">All Doctors</option>
        <option value="D-001">Dr. Okonkwo</option>
        <option value="D-002">Dr. Adaeze Nwosu</option>
      </select>
      <button type="button" class="btn-export-archive" data-action="export-archive">
        📊 Export Archive
      </button>
    </div>

    <div class="archive-table-wrap">
      <table class="inv-table">
        <thead>
          <tr>
            <th>Invoice ID</th>
            <th>Doctor</th>
            <th>Period</th>
            <th>Consultations</th>
            <th>Doctor Payout</th>
            <th>Platform Cut</th>
            <th>Status</th>
            <th>Submitted</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="archiveTableBody">
          ${archived.map((inv) => `
          <tr class="inv-row archived-row" data-doctor-id="${escapeHtml(inv.doctorId)}"
            data-period="${escapeHtml(inv.period)}">
            <td><span class="inv-id-badge archived">${escapeHtml(inv.id)}</span></td>
            <td>
              <div class="inv-doctor-cell">
                <div class="inv-doc-avatar muted-av">${escapeHtml(inv.doctorInitials)}</div>
                <div class="inv-doc-name muted-name">${escapeHtml(inv.doctorName)}</div>
              </div>
            </td>
            <td class="inv-period muted-text">${escapeHtml(inv.period)}</td>
            <td class="inv-consults muted-text">${inv.consultations}</td>
            <td class="inv-doctor-payout muted-text">${fmtNgn(inv.doctorAmount)}</td>
            <td class="muted-text">${fmtNgn(inv.platformCut)}</td>
            <td><span class="archived-status-badge">🗄️ Archived</span></td>
            <td class="inv-period muted-text">${escapeHtml(inv.submittedDate)}</td>
            <td>
              <div class="inv-row-actions">
                <button type="button" class="btn-ira view" data-action="view-invoice"
                  data-id="${escapeHtml(inv.id)}" title="View">👁️</button>
                <button type="button" class="btn-ira download" data-action="download-invoice"
                  data-id="${escapeHtml(inv.id)}" title="Download">📄</button>
                <button type="button" class="btn-ira unarchive" data-action="unarchive-invoice"
                  data-id="${escapeHtml(inv.id)}" title="Restore">🔄</button>
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function getAdminRevenueHTML() {
  const { active, pending, approved, paid } = getInvoiceStats();
  const archived = getArchivedInvoices();

  return `
  <div class="admin-revenue-page">
    <div class="rev-page-header">
      <div>
        <h2>Revenue &amp; Financial Analytics</h2>
        <p>Complete financial overview, doctor payouts and invoice management</p>
      </div>
      <div class="rev-header-actions">
        <button type="button" class="btn-rev-export" data-action="export-revenue">
          📊 Export Report
        </button>
        <button type="button" class="btn-rev-statement" data-action="generate-statement">
          📄 Statement
        </button>
      </div>
    </div>

    <div class="rev-kpi-grid">
      <div class="rev-kpi-card total-rev-card">
        <div class="rkc-icon-wrap">💰</div>
        <div class="rkc-period">All Time</div>
        <div class="rkc-value">${fmt(TOTAL_REVENUE)}</div>
        <div class="rkc-label">Total Revenue</div>
        <div class="rkc-split-bar">
          <div class="rkc-bar-fill doctors" style="width:70%">70%</div>
          <div class="rkc-bar-fill platform" style="width:30%">30%</div>
        </div>
        <div class="rkc-sub">Platform kept: ₦17.3M</div>
      </div>

      <div class="rev-kpi-card total-payout-card">
        <div class="rkc-icon-wrap">💸</div>
        <div class="rkc-period">All Time</div>
        <div class="rkc-value">${fmt(TOTAL_PAYOUT)}</div>
        <div class="rkc-label">Total Doctor Payouts</div>
        <div class="rkc-trend up">↑ +₦8.4M this month</div>
        <div class="rkc-sub">89 active doctors paid</div>
      </div>

      <div class="rev-kpi-card monthly-rev-card">
        <div class="rkc-icon-wrap">📅</div>
        <div class="rkc-period">June 2026</div>
        <div class="rkc-value">${fmt(MONTHLY_REVENUE)}</div>
        <div class="rkc-label">Monthly Revenue</div>
        <div class="rkc-trend up">↑ +22% vs May</div>
        <div class="rkc-sub">589 consultations</div>
      </div>

      <div class="rev-kpi-card monthly-payout-card">
        <div class="rkc-icon-wrap">🏦</div>
        <div class="rkc-period">June 2026</div>
        <div class="rkc-value">${fmt(MONTHLY_PAYOUT)}</div>
        <div class="rkc-label">Monthly Doctor Payout</div>
        <div class="rkc-trend up">↑ +19% vs May</div>
        <div class="rkc-sub">5 pending invoices</div>
      </div>

      <div class="rev-kpi-card weekly-rev-card">
        <div class="rkc-icon-wrap">📆</div>
        <div class="rkc-period">This Week</div>
        <div class="rkc-value">${fmt(WEEKLY_REVENUE)}</div>
        <div class="rkc-label">Weekly Revenue</div>
        <div class="rkc-trend up">↑ +₦190K vs last week</div>
        <div class="rkc-sub">147 consultations</div>
      </div>

      <div class="rev-kpi-card weekly-payout-card">
        <div class="rkc-icon-wrap">⚡</div>
        <div class="rkc-period">This Week</div>
        <div class="rkc-value">${fmt(WEEKLY_PAYOUT)}</div>
        <div class="rkc-label">Weekly Doctor Payout</div>
        <div class="rkc-trend up">↑ 70% of weekly revenue</div>
        <div class="rkc-sub">Next payout: 30 Jun</div>
      </div>
    </div>

    <div class="rev-chart-card">
      <div class="rcc-header">
        <div>
          <h3>Revenue vs Payout (Last 6 Months)</h3>
          <p>Platform revenue and doctor payouts trend analysis</p>
        </div>
        <div class="rcc-legend">
          <span class="rcc-leg green-leg">● Total Revenue</span>
          <span class="rcc-leg blue-leg">● Doctor Payout (70%)</span>
          <span class="rcc-leg amber-leg">● Platform (30%)</span>
        </div>
      </div>
      <div class="rev-chart-bars">${renderRevenueChart()}</div>
    </div>

    <div class="rev-tabs-wrap">
      <div class="rev-tabs">
        <button type="button" class="rev-tab active" id="revtab-invoices" data-rev-tab="invoices">
          📋 Doctor Invoices
          <span class="rev-tab-count" id="revTabCountInvoices">${active.length}</span>
        </button>
        <button type="button" class="rev-tab" id="revtab-payouts" data-rev-tab="payouts">
          💸 Payout History
          <span class="rev-tab-count" id="revTabCountPayouts">${PAYOUT_HISTORY.length}</span>
        </button>
        <button type="button" class="rev-tab" id="revtab-archive" data-rev-tab="archive">
          🗄️ Archive
          <span class="rev-tab-count archived-count" id="revTabCountArchive">${archived.length}</span>
        </button>
      </div>
    </div>

    <div class="rev-content" id="rev-invoices">
      ${renderInvoicesSection(active, pending, approved, paid)}
    </div>

    <div class="rev-content" id="rev-payouts" style="display:none">
      ${renderPayoutHistorySection(PAYOUT_HISTORY)}
    </div>

    <div class="rev-content" id="rev-archive" style="display:none">
      ${renderArchiveSection(archived)}
    </div>

    <div id="invoiceDetailModal"
      style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);
      z-index:500;align-items:center;justify-content:center;padding:16px;overflow-y:auto">
      <div class="invoice-modal-box" id="invoiceModalBox"></div>
    </div>
  </div>`;
}

function updateInvoiceStats() {
  if (!revRoot) return;
  const { active, pending, approved, paid } = getInvoiceStats();

  const set = (id, val) => {
    const el = revRoot.querySelector(id);
    if (el) el.textContent = val;
  };

  set('#invStatPending', pending.length);
  set('#invStatApproved', approved.length);
  set('#invStatPaid', paid.length);
  set('#invStatTotal', active.length);
  set('#invAmtPending', fmtNgn(pending.reduce((s, i) => s + i.doctorAmount, 0)));
  set('#invAmtApproved', fmtNgn(approved.reduce((s, i) => s + i.doctorAmount, 0)));
  set('#invAmtPaid', fmtNgn(paid.reduce((s, i) => s + i.doctorAmount, 0)));
  set('#invAmtTotal', fmtNgn(active.reduce((s, i) => s + i.doctorAmount, 0)));
  set('#revTabCountInvoices', active.length);
  set('#revTabCountArchive', getArchivedInvoices().length);
}

function refreshInvoiceLists() {
  if (!revRoot) return;
  const active = getActiveInvoices();
  const tbody = revRoot.querySelector('#invoiceTableBody');
  const grid = revRoot.querySelector('#invoiceCardsGrid');
  if (tbody) tbody.innerHTML = active.map((inv) => renderInvoiceRow(inv)).join('');
  if (grid) grid.innerHTML = active.map((inv) => renderInvoiceCard(inv)).join('');
  updateInvoiceStats();
  filterInvoices();
}

function refreshArchiveSection() {
  if (!revRoot) return;
  const archived = getArchivedInvoices();
  const section = revRoot.querySelector('#rev-archive');
  if (section) {
    section.innerHTML = renderArchiveSection(archived);
    revRoot.querySelector('#archivePeriodFilter')?.addEventListener('change', filterArchive);
    revRoot.querySelector('#archiveDoctorFilter')?.addEventListener('change', filterArchive);
  }
  updateInvoiceStats();
}

export function setRevTab(tab, btn) {
  currentRevTab = tab;
  const root = revRoot || document;

  root.querySelectorAll('.rev-tab').forEach((t) => t.classList.remove('active'));
  if (btn) {
    btn.classList.add('active');
  } else {
    root.querySelector(`#revtab-${tab}`)?.classList.add('active');
  }

  root.querySelectorAll('.rev-content').forEach((c) => {
    c.style.display = 'none';
  });

  const content = root.querySelector(`#rev-${tab}`);
  if (content) {
    content.style.display = 'block';
    content.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function setInvoiceView(view, btn) {
  currentInvoiceView = view;
  const root = revRoot || document;

  root.querySelectorAll('.ivt-btn').forEach((b) => b.classList.remove('active'));
  if (btn) {
    btn.classList.add('active');
  } else {
    root.querySelector(`#ivt-${view}`)?.classList.add('active');
  }

  const tableView = root.querySelector('#invoiceTableView');
  const cardsView = root.querySelector('#invoiceCardsView');

  if (view === 'table') {
    if (tableView) tableView.style.display = 'block';
    if (cardsView) cardsView.style.display = 'none';
  } else {
    if (tableView) tableView.style.display = 'none';
    if (cardsView) cardsView.style.display = 'block';
  }
}

function filterInvoices() {
  if (!revRoot) return;
  const search = (revRoot.querySelector('#invoiceSearch')?.value || '').toLowerCase();
  const status = revRoot.querySelector('#invoiceStatusFilter')?.value || '';

  revRoot.querySelectorAll('#invoiceTableBody .inv-row').forEach((row) => {
    const text = row.textContent.toLowerCase();
    const rowStatus = row.dataset.status || '';
    let show = true;
    if (search && !text.includes(search)) show = false;
    if (status && rowStatus !== status) show = false;
    row.style.display = show ? '' : 'none';
  });

  revRoot.querySelectorAll('#invoiceCardsGrid .inv-card').forEach((card) => {
    const text = card.textContent.toLowerCase();
    const cardStatus = card.dataset.status || '';
    let show = true;
    if (search && !text.includes(search)) show = false;
    if (status && cardStatus !== status) show = false;
    card.style.display = show ? '' : 'none';
  });
}

function sortInvoices() {
  if (!revRoot) return;
  const sort = revRoot.querySelector('#invoiceSortFilter')?.value || 'newest';
  const active = getActiveInvoices();
  const statusOrder = { pending: 0, approved: 1, paid: 2, rejected: 3 };

  active.sort((a, b) => {
    switch (sort) {
      case 'oldest': return a.id.localeCompare(b.id);
      case 'amount-high': return b.doctorAmount - a.doctorAmount;
      case 'amount-low': return a.doctorAmount - b.doctorAmount;
      case 'pending-first':
        return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
      default: return b.id.localeCompare(a.id);
    }
  });

  const tbody = revRoot.querySelector('#invoiceTableBody');
  const grid = revRoot.querySelector('#invoiceCardsGrid');
  if (tbody) tbody.innerHTML = active.map((inv) => renderInvoiceRow(inv)).join('');
  if (grid) grid.innerHTML = active.map((inv) => renderInvoiceCard(inv)).join('');
  filterInvoices();
  toast('Invoices sorted ✅', 'info');
}

function filterPayouts() {
  if (!revRoot) return;
  const search = (revRoot.querySelector('#payoutSearch')?.value || '').toLowerCase();
  const status = revRoot.querySelector('#payoutStatusFilter')?.value || '';

  revRoot.querySelectorAll('#payoutTableBody .inv-row').forEach((row) => {
    const text = row.textContent.toLowerCase();
    let show = true;
    if (search && !text.includes(search)) show = false;
    if (status && !row.className.includes(status)) show = false;
    row.style.display = show ? '' : 'none';
  });
}

function sortPayouts() {
  if (!revRoot) return;
  const sort = revRoot.querySelector('#payoutSortFilter')?.value || 'newest';
  const sorted = [...PAYOUT_HISTORY];

  sorted.sort((a, b) => {
    switch (sort) {
      case 'oldest': return a.id.localeCompare(b.id);
      case 'amount-high': return b.amount - a.amount;
      default: return b.id.localeCompare(a.id);
    }
  });

  const tbody = revRoot.querySelector('#payoutTableBody');
  if (tbody) tbody.innerHTML = sorted.map((p) => renderPayoutRow(p)).join('');
  filterPayouts();
  toast('Payouts sorted ✅', 'info');
}

function filterArchive() {
  if (!revRoot) return;
  const period = revRoot.querySelector('#archivePeriodFilter')?.value || '';
  const doctor = revRoot.querySelector('#archiveDoctorFilter')?.value || '';

  revRoot.querySelectorAll('#archiveTableBody .archived-row').forEach((row) => {
    const rowPeriod = row.dataset.period || '';
    const rowDoctor = row.dataset.doctorId || '';
    let show = true;
    if (period && !rowPeriod.includes(period)) show = false;
    if (doctor && rowDoctor !== doctor) show = false;
    row.style.display = show ? '' : 'none';
  });
}

function viewInvoiceDetail(invoiceId) {
  const inv = INVOICE_DATA.find((i) => i.id === invoiceId);
  if (!inv) {
    toast('Invoice not found', 'warning');
    return;
  }

  const sc = MODAL_STATUS_CONFIG[inv.status] || MODAL_STATUS_CONFIG.pending;
  const modal = revRoot?.querySelector('#invoiceDetailModal');
  const box = revRoot?.querySelector('#invoiceModalBox');
  if (!box || !modal) return;

  box.innerHTML = `
    <div class="idm-header" style="background:linear-gradient(135deg, ${sc.bg}, ${sc.bg}cc)">
      <div class="idm-header-content">
        <div class="idm-inv-number">${escapeHtml(inv.id)}</div>
        <h3>Invoice Details</h3>
        <div class="idm-period">📅 Period: ${escapeHtml(inv.period)}</div>
      </div>
      <div class="idm-status-pill">${sc.label}</div>
      <button type="button" class="dam-close-btn" data-action="close-invoice-modal">×</button>
    </div>

    <div class="idm-body">
      <div class="idm-doctor-section">
        <div class="idm-doctor-avatar">${escapeHtml(inv.doctorInitials)}</div>
        <div class="idm-doctor-info">
          <div class="idm-doctor-name">${escapeHtml(inv.doctorName)}</div>
          <div class="idm-doctor-spec">${escapeHtml(inv.specialty)} · #${escapeHtml(inv.doctorId)}</div>
          <div class="idm-doctor-bank">🏦 ${escapeHtml(inv.bankName)} · ${escapeHtml(inv.accountNo)}</div>
        </div>
        <div class="idm-submitted">
          <div class="idm-sub-label">Submitted</div>
          <div class="idm-sub-date">${escapeHtml(inv.submittedDate)}</div>
          <div class="idm-due-date ${inv.status === 'pending' ? 'urgent' : ''}">
            Due: ${escapeHtml(inv.dueDate)}
          </div>
        </div>
      </div>

      <div class="idm-financials">
        <div class="idm-fin-title">💰 Financial Breakdown</div>
        <div class="idm-fin-grid">
          <div class="idm-fin-item">
            <span>Period</span>
            <strong>${escapeHtml(inv.period)}</strong>
          </div>
          <div class="idm-fin-item">
            <span>Total Consultations</span>
            <strong>${inv.consultations}</strong>
          </div>
          <div class="idm-fin-item highlight">
            <span>Gross Revenue</span>
            <strong>${fmtNgn(inv.grossAmount)}</strong>
          </div>
          <div class="idm-fin-item platform">
            <span>Platform Cut (30%)</span>
            <strong>${fmtNgn(inv.platformCut)}</strong>
          </div>
          <div class="idm-fin-item payout">
            <span>Doctor Payout (70%)</span>
            <strong>${fmtNgn(inv.doctorAmount)}</strong>
          </div>
          <div class="idm-fin-item">
            <span>Per Consultation Avg</span>
            <strong>${fmtNgn(Math.round(inv.grossAmount / inv.consultations))}</strong>
          </div>
        </div>
      </div>

      <div class="idm-split-visual">
        <div class="idm-split-bar">
          <div class="idm-split-doctor" style="width:70%">
            Dr. gets 70% · ${fmtNgn(inv.doctorAmount)}
          </div>
          <div class="idm-split-platform" style="width:30%">Platform 30%</div>
        </div>
      </div>

      <div class="idm-notes-section">
        <div class="idm-notes-label">📝 Admin Notes</div>
        <textarea id="invoiceAdminNotes" class="admin-textarea" rows="2"
          placeholder="Add admin notes...">${escapeHtml(inv.notes)}</textarea>
      </div>
    </div>

    <div class="idm-footer">
      <div class="idm-footer-left">
        <button type="button" class="btn-idm-cancel" data-action="close-invoice-modal">
          ← Back
        </button>
      </div>
      <div class="idm-footer-right">
        <button type="button" class="btn-idm-download" data-action="download-invoice"
          data-id="${escapeHtml(inv.id)}">📄 Download PDF</button>
        ${inv.status === 'pending' ? `
        <button type="button" class="btn-idm-reject" data-action="reject-invoice-modal"
          data-id="${escapeHtml(inv.id)}">✗ Reject</button>
        <button type="button" class="btn-idm-approve" data-action="approve-invoice-modal"
          data-id="${escapeHtml(inv.id)}">✅ Approve Invoice</button>` : ''}
        ${inv.status === 'approved' ? `
        <button type="button" class="btn-idm-pay" data-action="process-payment-modal"
          data-id="${escapeHtml(inv.id)}">💸 Process Payment</button>` : ''}
        <button type="button" class="btn-idm-archive" data-action="archive-invoice-modal"
          data-id="${escapeHtml(inv.id)}">🗄️ Archive</button>
      </div>
    </div>`;

  modal.style.display = 'flex';
}

function closeInvoiceModal() {
  revRoot?.querySelector('#invoiceDetailModal')?.style &&
    (revRoot.querySelector('#invoiceDetailModal').style.display = 'none');
}

function approveInvoice(invoiceId) {
  const inv = INVOICE_DATA.find((i) => i.id === invoiceId);
  if (!inv) return;

  inv.status = 'approved';
  refreshInvoiceLists();
  toast(`✅ Invoice ${invoiceId} approved! Ready for payment processing.`, 'success');
}

function rejectInvoice(invoiceId) {
  if (!confirm(`Reject invoice ${invoiceId}? The doctor will be notified.`)) return;

  const inv = INVOICE_DATA.find((i) => i.id === invoiceId);
  if (!inv) return;

  inv.status = 'rejected';
  refreshInvoiceLists();
  toast(`Invoice ${invoiceId} rejected. Doctor notified.`, 'warning');
}

function processPayment(invoiceId) {
  const inv = INVOICE_DATA.find((i) => i.id === invoiceId);
  if (!inv) return;

  if (!confirm(
    `Process payment of ${fmtNgn(inv.doctorAmount)} to ${inv.doctorName} via Paystack?\n` +
    `Bank: ${inv.bankName} · ${inv.accountNo}`
  )) return;

  inv.status = 'paid';
  refreshInvoiceLists();
  toast(
    `💸 Payment of ${fmtNgn(inv.doctorAmount)} initiated to ${inv.doctorName} via ${inv.bankName}! ✅`,
    'success',
    6000
  );
}

function archiveInvoice(invoiceId) {
  if (!confirm(`Archive invoice ${invoiceId}? It will be moved to the archive section.`)) return;

  const inv = INVOICE_DATA.find((i) => i.id === invoiceId);
  if (!inv) return;

  inv.archived = true;
  closeInvoiceModal();
  refreshInvoiceLists();
  refreshArchiveSection();
  toast(`Invoice ${invoiceId} archived. Visible in Archive tab.`, 'info');
}

function unarchiveInvoice(invoiceId) {
  const inv = INVOICE_DATA.find((i) => i.id === invoiceId);
  if (!inv) return;

  inv.archived = false;
  refreshInvoiceLists();
  refreshArchiveSection();
  toast(`Invoice ${invoiceId} restored to active invoices.`, 'success');
}

function downloadInvoice(invoiceId) {
  toast(`Generating PDF for ${invoiceId}...`, 'info');
}

function viewPayoutReceipt(payoutId) {
  toast(`Opening receipt for ${payoutId}...`, 'info');
}

function downloadPayoutReceipt(payoutId) {
  toast(`Downloading receipt for ${payoutId}...`, 'info');
}

function exportArchive() {
  toast('Exporting archive to CSV...', 'info');
}

function exportRevenueReport() {
  toast('Generating revenue report...', 'info');
}

function generateFinancialStatement() {
  toast('Generating financial statement PDF...', 'info');
}

function handleRevAction(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;

  const { action, id, view } = el.dataset;

  switch (action) {
    case 'export-revenue': exportRevenueReport(); break;
    case 'generate-statement': generateFinancialStatement(); break;
    case 'export-archive': exportArchive(); break;
    case 'set-invoice-view': setInvoiceView(view, el); break;
    case 'view-invoice': viewInvoiceDetail(id); break;
    case 'view-invoice-ref': viewInvoiceDetail(id); break;
    case 'close-invoice-modal': closeInvoiceModal(); break;
    case 'approve-invoice': approveInvoice(id); break;
    case 'reject-invoice': rejectInvoice(id); break;
    case 'process-payment': processPayment(id); break;
    case 'download-invoice': downloadInvoice(id); break;
    case 'archive-invoice': archiveInvoice(id); break;
    case 'unarchive-invoice': unarchiveInvoice(id); break;
    case 'approve-invoice-modal':
      approveInvoice(id);
      closeInvoiceModal();
      break;
    case 'reject-invoice-modal':
      rejectInvoice(id);
      closeInvoiceModal();
      break;
    case 'process-payment-modal':
      processPayment(id);
      closeInvoiceModal();
      break;
    case 'archive-invoice-modal':
      archiveInvoice(id);
      break;
    case 'view-payout-receipt': viewPayoutReceipt(id); break;
    case 'download-payout-receipt': downloadPayoutReceipt(id); break;
    default: break;
  }
}

function bindAdminRevenueEvents(root) {
  revRoot = root;

  root.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('[data-rev-tab]');
    if (tabBtn) {
      setRevTab(tabBtn.dataset.revTab, tabBtn);
      return;
    }
    handleRevAction(e);
  });

  root.querySelector('#invoiceSearch')?.addEventListener('input', filterInvoices);
  root.querySelector('#invoiceStatusFilter')?.addEventListener('change', filterInvoices);
  root.querySelector('#invoiceSortFilter')?.addEventListener('change', sortInvoices);
  root.querySelector('#payoutSearch')?.addEventListener('input', filterPayouts);
  root.querySelector('#payoutStatusFilter')?.addEventListener('change', filterPayouts);
  root.querySelector('#payoutSortFilter')?.addEventListener('change', sortPayouts);
  root.querySelector('#archivePeriodFilter')?.addEventListener('change', filterArchive);
  root.querySelector('#archiveDoctorFilter')?.addEventListener('change', filterArchive);

  root.querySelector('#invoiceDetailModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'invoiceDetailModal') closeInvoiceModal();
  });
}

export async function renderAdminRevenue(container) {
  currentRevTab = 'invoices';
  currentInvoiceView = 'table';

  window.INVOICE_DATA = INVOICE_DATA;
  window.PAYOUT_HISTORY_DATA = PAYOUT_HISTORY;

  container.innerHTML = getAdminRevenueHTML();
  bindAdminRevenueEvents(container);

  const pendingTab = sessionStorage.getItem('adminRevTab');
  if (pendingTab) {
    sessionStorage.removeItem('adminRevTab');
    const tabBtn = container.querySelector(`#revtab-${pendingTab}`) ||
      container.querySelector(`[data-rev-tab="${pendingTab}"]`);
    setTimeout(() => setRevTab(pendingTab, tabBtn), 100);
  }
}
