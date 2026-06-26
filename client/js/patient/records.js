import { patientsApi, uploadApi } from '../shared/api.js';
import { formatDate, escapeHtml, MAX_RECORD_FILE_SIZE } from '../shared/utils.js';
import { toast } from '../shared/toast.js';

export async function renderRecords(container) {
  const res = await patientsApi.records();
  const records = res.data.records || [];

  container.innerHTML = `
    <div class="dashboard-header"><h1>Medical Records</h1></div>
    <div class="card" style="margin-bottom:24px;max-width:480px">
      <h3 style="margin-bottom:16px">Upload Record</h3>
      <p class="text-muted" style="margin-bottom:12px;font-size:0.9rem">Accepted formats: PDF, JPG, PNG (max 2MB)</p>
      <p class="text-muted" style="margin-bottom:12px;font-size:0.85rem">Maximum file size: 2MB</p>
      <input type="file" id="record-file" accept=".pdf,.jpg,.jpeg,.png">
      <button class="btn btn-primary btn-sm" id="upload-btn" style="margin-top:12px">Upload</button>
    </div>
    <h3 style="margin-bottom:16px">Your Records</h3>
    ${records.length ? records.map((r) => `
      <div class="card" style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
        <div>
          <strong>${escapeHtml(r.fileName)}</strong>
          <div class="text-muted">${formatDate(r.uploadedAt)} · Shared with ${r.sharedWith?.length || 0} doctor(s)</div>
        </div>
        <div>
          <a href="${r.fileUrl}" target="_blank" class="btn btn-secondary btn-sm">View</a>
          <input type="text" placeholder="Doctor ID to share" class="share-input" data-id="${r._id}" style="padding:8px;margin:0 8px;border:1px solid var(--border);border-radius:8px">
          <button class="btn btn-primary btn-sm share-btn" data-id="${r._id}">Share</button>
        </div>
      </div>
    `).join('') : '<div class="empty-state card">No records uploaded yet</div>'}
  `;

  container.querySelector('#upload-btn').addEventListener('click', async () => {
    const file = container.querySelector('#record-file').files[0];
    if (!file) {
      toast('Select a file', 'warning');
      return;
    }
    if (file.size > MAX_RECORD_FILE_SIZE) {
      toast('File too large. Maximum size is 2MB. Please compress your file and try again.', 'error');
      return;
    }
    await uploadApi.medicalRecord(file);
    toast('Uploaded', 'success');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });

  container.querySelectorAll('.share-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const input = container.querySelector(`.share-input[data-id="${id}"]`);
      const doctorId = input.value.trim();
      if (!doctorId) {
        toast('Enter a doctor ID', 'warning');
        return;
      }
      await patientsApi.shareRecord(id, doctorId);
      toast('Permission granted', 'success');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
  });
}
