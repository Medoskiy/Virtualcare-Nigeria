const colours = {
  success: { bg: '#dcfce7', border: '#16a34a', text: '#15803d' },
  error: { bg: '#fee2e2', border: '#dc2626', text: '#b91c1c' },
  warning: { bg: '#fef3c7', border: '#d97706', text: '#b45309' },
  info: { bg: '#e8f4fd', border: '#1d6aba', text: '#1e40af' }
};

const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

export function showToast(message, type = 'info', duration = 4000) {
  document.getElementById('toast-container')?.remove();

  const c = colours[type] || colours.info;
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: ${c.bg};
    border: 1.5px solid ${c.border};
    color: ${c.text};
    padding: 14px 18px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    max-width: 320px;
    z-index: 9999;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.12);
    animation: slideInToast 0.3s ease;
  `;
  container.innerHTML = `
    <span style="font-size:18px;flex-shrink:0">${icons[type] || icons.info}</span>
    <span style="flex:1;line-height:1.4">${message}</span>
    <button type="button" class="toast-close" style="background:none;border:none;color:${c.text};font-size:18px;cursor:pointer;opacity:0.6;flex-shrink:0">×</button>
  `;
  container.querySelector('.toast-close').onclick = () => container.remove();
  document.body.appendChild(container);
  setTimeout(() => container.remove(), duration);
}

export function initToast() {
  /* legacy compat — showToast creates container on demand */
}

export function toast(message, type = 'info', duration = 4000) {
  showToast(message, type, duration);
}

export function showLoading(target, skeleton = 'card') {
  if (!target) return;
  target.dataset.prevHtml = target.innerHTML;
  target.innerHTML = skeleton === 'cards'
    ? '<div class="skeleton-grid">' + Array(3).fill('<div class="skeleton-card"></div>').join('') + '</div>'
    : '<div class="skeleton-block"></div>';
}

export function hideLoading(target) {
  if (target?.dataset?.prevHtml) {
    target.innerHTML = target.dataset.prevHtml;
    delete target.dataset.prevHtml;
  }
}
