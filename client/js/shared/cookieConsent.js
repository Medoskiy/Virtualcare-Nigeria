// NDPR Cookie Consent Banner for Virtualcare Nigeria

export function initCookieConsent() {
  if (localStorage.getItem('vc_cookie_consent')) return;
  if (document.getElementById('vc-cookie-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'vc-cookie-banner';
  banner.style.cssText = `
    position:fixed;bottom:0;left:0;right:0;z-index:99999;
    background:#1e293b;color:#f8fafc;padding:16px 24px;
    display:flex;align-items:center;justify-content:space-between;
    flex-wrap:wrap;gap:12px;box-shadow:0 -4px 20px rgba(0,0,0,0.3);`;

  banner.innerHTML = `
    <div style="flex:1;min-width:250px;">
      <p style="margin:0;font-size:14px;line-height:1.5;">
        🍪 <strong>Cookie & Privacy Notice</strong><br>
        Virtualcare Nigeria uses cookies to improve your experience and comply with the 
        <strong>Nigeria Data Protection Regulation (NDPR)</strong>. 
        Your health data is encrypted and never sold to third parties.
        <a href="/#/privacy-policy" style="color:#60a5fa;text-decoration:none;margin-left:4px;">
          Read our Privacy Policy →
        </a>
      </p>
    </div>
    <div style="display:flex;gap:8px;flex-shrink:0;">
      <button id="vc-cookie-decline" style="
        background:transparent;border:1px solid #64748b;color:#94a3b8;
        padding:8px 16px;border-radius:6px;cursor:pointer;font-size:13px;">
        Essential Only
      </button>
      <button id="vc-cookie-accept" style="
        background:#0066cc;border:none;color:#fff;
        padding:8px 16px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;">
        Accept All
      </button>
    </div>`;

  document.body.appendChild(banner);

  document.getElementById('vc-cookie-accept').addEventListener('click', () => {
    localStorage.setItem('vc_cookie_consent', 'all');
    localStorage.setItem('vc_cookie_consent_date', new Date().toISOString());
    banner.remove();
  });

  document.getElementById('vc-cookie-decline').addEventListener('click', () => {
    localStorage.setItem('vc_cookie_consent', 'essential');
    localStorage.setItem('vc_cookie_consent_date', new Date().toISOString());
    banner.remove();
  });
}
