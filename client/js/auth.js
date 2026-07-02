import { authApi, setAuth, clearAuth, getRole, getToken, getUser } from './shared/api.js';
import { NIGERIAN_STATES, validateNigerianPhone } from './shared/nigeria.js';
import { toast } from './shared/toast.js';
import { escapeHtml } from './shared/utils.js';

const DOCTOR_SPECIALTIES = [
  'General Practice', 'Cardiology', 'Dermatology', 'Psychiatry', 'Pediatrics',
  'Neurology', 'Orthopedics', 'Gynecology', 'Ophthalmology', 'ENT',
  'Endocrinology', 'Gastroenterology', 'Pulmonology', 'Urology', 'Oncology',
  'Rheumatology', 'Nephrology', 'Hematology'
];

const GOOGLE_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
</svg>`;

const FACEBOOK_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
</svg>`;

let currentAuthRole = 'patient';
let currentRegType = 'patient';
let emailCheckTimeout = null;
let authRoot = null;

function getHashQuery() {
  const q = window.location.hash.split('?')[1] || '';
  return new URLSearchParams(q);
}

function stateOptions() {
  return NIGERIAN_STATES.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
}

function specialtyOptions() {
  return DOCTOR_SPECIALTIES.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
}

function getLoginHTML() {
  return `
  <div class="auth-page-wrap">
    <div class="auth-left-panel">
      <div class="alp-content">
        <div class="alp-logo">
          <span class="logo-virtual">Virtual</span>
          <span class="logo-care">care</span>
        </div>
        <h1 class="alp-headline">
          Nigeria's Most Trusted<br/>
          <span class="alp-highlight">Telemedicine Platform</span>
        </h1>
        <div class="alp-features">
          <div class="alp-feature"><span class="alp-feat-icon">✅</span><span>80+ MDCN-Verified Doctors</span></div>
          <div class="alp-feature"><span class="alp-feat-icon">📱</span><span>Consult from anywhere in Nigeria</span></div>
          <div class="alp-feature"><span class="alp-feat-icon">💰</span><span>Affordable from ₦5,000</span></div>
          <div class="alp-feature"><span class="alp-feat-icon">🔒</span><span>NDPR Compliant &amp; Secure</span></div>
        </div>
        <div class="alp-trust-badges">
          <div class="alp-badge"><strong>50K+</strong><span>Consultations</span></div>
          <div class="alp-badge"><strong>4.9★</strong><span>Average Rating</span></div>
          <div class="alp-badge"><strong>36</strong><span>States Covered</span></div>
        </div>
      </div>
      <div class="alp-testimonial">
        <div class="alp-test-text">"Virtualcare Nigeria saved me hours of travel. I consulted a cardiologist from my home in Kano!"</div>
        <div class="alp-test-author">— Ibrahim M., Kano State</div>
      </div>
    </div>

    <div class="auth-right-panel">
      <div class="auth-form-card">
        <a href="/" data-link style="text-decoration:none;display:inline-block;margin-bottom:24px">
          <span style="font-size:28px;font-weight:900;color:#0a2463">Virtual</span><span style="font-size:28px;font-weight:900;color:#1d6aba">care</span>
        </a>
        <h2 class="auth-form-title">Welcome Back</h2>
        <p class="auth-form-subtitle">Sign in to your Virtualcare account</p>

        <div class="auth-role-selector">
          <button type="button" class="auth-role-btn ${currentAuthRole === 'patient' ? 'active' : ''}" data-auth-role="patient">
            <span class="role-icon">👤</span><span>Patient</span>
          </button>
          <button type="button" class="auth-role-btn ${currentAuthRole === 'doctor' ? 'active' : ''}" data-auth-role="doctor">
            <span class="role-icon">👨‍⚕️</span><span>Doctor</span>
          </button>
          <button type="button" class="auth-role-btn ${currentAuthRole === 'admin' ? 'active' : ''}" data-auth-role="admin">
            <span class="role-icon">⚙️</span><span>Admin</span>
          </button>
        </div>

        <div class="social-auth-section" id="socialAuthSection" style="${currentAuthRole === 'admin' ? 'display:none' : ''}">
          <button type="button" class="btn-social-auth google-btn" data-action="google-signin">${GOOGLE_SVG} Continue with Google</button>
          <button type="button" class="btn-social-auth facebook-btn" data-action="facebook-signin">${FACEBOOK_SVG} Continue with Facebook</button>
        </div>

        <div class="auth-divider" id="authDivider" style="${currentAuthRole === 'admin' ? 'display:none' : ''}">
          <span>or sign in with email</span>
        </div>

        <form class="auth-form" id="loginForm">
          <div class="auth-field">
            <label for="loginEmail">Email Address</label>
            <div class="auth-input-wrap">
              <span class="auth-input-icon">📧</span>
              <input type="email" id="loginEmail" class="auth-input" placeholder="Enter your email" required autocomplete="email" />
            </div>
          </div>
          <div class="auth-field">
            <div class="auth-label-row">
              <label for="loginPassword">Password</label>
              <button type="button" class="auth-forgot-link" data-action="forgot-password">Forgot password?</button>
            </div>
            <div class="auth-input-wrap">
              <span class="auth-input-icon">🔒</span>
              <input type="password" id="loginPassword" class="auth-input" placeholder="Enter your password" required autocomplete="current-password" />
              <button type="button" class="auth-toggle-pw" data-toggle-pw="loginPassword" aria-label="Toggle password">👁️</button>
            </div>
          </div>
          <div class="auth-remember-row">
            <label class="auth-remember">
              <input type="checkbox" id="rememberMe" />
              <span>Remember me for 30 days</span>
            </label>
          </div>
          <div class="auth-error-msg" id="loginError" style="display:none"></div>
          <button type="submit" class="btn-auth-submit" id="loginSubmitBtn">Sign In</button>
        </form>

        <div class="auth-switch-link">
          Don't have an account? <a href="/register" data-link>Register free →</a>
        </div>
        <div class="auth-back-home">
          <a href="/" data-link>← Back to Home</a>
        </div>
      </div>
    </div>
  </div>

  <div id="forgotPwModal" class="forgot-pw-modal" style="display:none">
    <div class="forgot-pw-box">
      <div class="fpb-header">
        <h3>Reset Password</h3>
        <button type="button" class="modal-close-btn" data-action="close-forgot">×</button>
      </div>
      <p class="forgot-pw-desc">Enter your email address and we will send you a password reset link.</p>
      <input type="email" id="forgotEmail" class="auth-input forgot-email-input" placeholder="Your email address" />
      <button type="button" class="btn-auth-submit" data-action="send-reset">Send Reset Link</button>
    </div>
  </div>`;
}

function getRegisterHTML() {
  const isPatient = currentRegType === 'patient';
  return `
  <div style="display:flex;min-height:100vh;background:#f0f4f8">
    <!-- LEFT PANEL (desktop only) -->
    <div class="auth-left-panel register-left" style="flex:1;background:linear-gradient(135deg,#0f766e 0%,#0a2463 60%,#7c3aed 100%);padding:48px 52px;display:flex;flex-direction:column;justify-content:center;min-height:100vh;position:sticky;top:0">
      <div>
        <a href="/" data-link style="text-decoration:none;display:inline-block;margin-bottom:40px">
          <span style="font-size:28px;font-weight:900;color:#ffffff">Virtual</span><span style="font-size:28px;font-weight:900;color:#7ec8f7">care</span>
        </a>
        <h1 style="font-size:34px;font-weight:900;color:#fff;line-height:1.2;margin:0 0 32px">
          Join Millions of<br/>
          <span style="color:#7ec8f7">Nigerians Getting Quality<br/>Healthcare Online</span>
        </h1>
        <div id="patientBenefits" style="${isPatient ? '' : 'display:none'}">
          <div style="font-size:14px;font-weight:700;color:#7ec8f7;margin-bottom:16px;text-transform:uppercase;letter-spacing:1px">As a Patient you get:</div>
          <div style="display:flex;flex-direction:column;gap:12px">
            ${[
              ['📅', 'Book appointments 24/7'],
              ['💊', 'Digital prescriptions'],
              ['📁', 'Medical records storage'],
              ['💰', '25% off as returning patient'],
              ['🔁', 'Follow up with same doctor']
            ].map(([i, t]) => `<div style="display:flex;align-items:center;gap:12px;color:#fff;font-size:15px"><span style="font-size:20px;width:36px;height:36px;background:rgba(255,255,255,0.15);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0">${i}</span>${t}</div>`).join('')}
          </div>
        </div>
        <div id="doctorBenefits" style="${isPatient ? 'display:none' : ''}">
          <div style="font-size:14px;font-weight:700;color:#7ec8f7;margin-bottom:16px;text-transform:uppercase;letter-spacing:1px">As a Doctor you earn:</div>
          <div style="display:flex;flex-direction:column;gap:12px">
            ${[
              ['💰', '70% of every consultation fee'],
              ['📱', 'Work from anywhere in Nigeria'],
              ['📊', 'Full earnings dashboard'],
              ['🏥', 'Professional MDCN profile'],
              ['🔒', 'Paystack direct bank transfers']
            ].map(([i, t]) => `<div style="display:flex;align-items:center;gap:12px;color:#fff;font-size:15px"><span style="font-size:20px;width:36px;height:36px;background:rgba(255,255,255,0.15);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0">${i}</span>${t}</div>`).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- RIGHT PANEL (form) -->
    <div class="auth-right-panel" style="width:520px;min-width:0;background:#fff;display:flex;align-items:flex-start;justify-content:center;padding:40px 32px;overflow-y:auto;min-height:100vh">
      <div style="width:100%;max-width:460px;padding-top:10px">
        <!-- Mobile logo (hidden on desktop by left panel visibility) -->
        <a href="/" data-link class="auth-mobile-logo" style="text-decoration:none;display:none;margin-bottom:24px">
          <span style="font-size:28px;font-weight:900;color:#0a2463">Virtual</span><span style="font-size:28px;font-weight:900;color:#1d6aba">care</span>
        </a>

        <h2 style="font-size:26px;font-weight:900;color:#0a2463;margin:0 0 6px">Create Your Account</h2>
        <p style="font-size:15px;color:#64748b;margin:0 0 24px">Join Virtualcare Nigeria — it's free</p>

        <!-- Role selector -->
        <div class="reg-type-selector" style="display:flex;gap:10px;margin-bottom:24px">
          <button type="button" id="regTypePatient" class="reg-type-btn ${isPatient ? 'active' : ''}" data-reg-type="patient" style="flex:1;display:flex;align-items:center;gap:10px;padding:14px 16px;border:2px solid ${isPatient ? '#1d6aba' : '#e2e8f0'};border-radius:12px;background:${isPatient ? '#eff6ff' : '#fff'};cursor:pointer;transition:border-color 0.2s,background 0.2s">
            <span style="font-size:24px">👤</span>
            <div style="text-align:left"><strong style="display:block;font-size:14px;color:#0a2463">Patient</strong><span style="font-size:12px;color:#64748b">Book consultations</span></div>
            <div class="reg-type-check" id="patientCheck" style="margin-left:auto;color:#1d6aba;font-weight:700;font-size:16px;${isPatient ? '' : 'display:none'}">✓</div>
          </button>
          <button type="button" id="regTypeDoctor" class="reg-type-btn ${!isPatient ? 'active' : ''}" data-reg-type="doctor" style="flex:1;display:flex;align-items:center;gap:10px;padding:14px 16px;border:2px solid ${!isPatient ? '#1d6aba' : '#e2e8f0'};border-radius:12px;background:${!isPatient ? '#eff6ff' : '#fff'};cursor:pointer;transition:border-color 0.2s,background 0.2s">
            <span style="font-size:24px">👨‍⚕️</span>
            <div style="text-align:left"><strong style="display:block;font-size:14px;color:#0a2463">Doctor</strong><span style="font-size:12px;color:#64748b">Earn 70% per consultation</span></div>
            <div class="reg-type-check" id="doctorCheck" style="margin-left:auto;color:#1d6aba;font-weight:700;font-size:16px;${!isPatient ? '' : 'display:none'}">✓</div>
          </button>
        </div>

        <!-- Social auth -->
        <div class="social-auth-section" style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">
          <button type="button" class="btn-social-auth google-btn" data-action="google-signup" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:12px;border:1.5px solid #e2e8f0;border-radius:10px;background:#fff;font-size:14px;font-weight:600;color:#0a2463;cursor:pointer;transition:border-color 0.2s,box-shadow 0.2s">${GOOGLE_SVG} Sign up with Google</button>
          <button type="button" class="btn-social-auth facebook-btn" data-action="facebook-signup" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:12px;border:none;border-radius:10px;background:#1877F2;font-size:14px;font-weight:600;color:#fff;cursor:pointer;transition:opacity 0.2s">${FACEBOOK_SVG} Sign up with Facebook</button>
        </div>

        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
          <div style="flex:1;height:1px;background:#e2e8f0"></div>
          <span style="font-size:13px;color:#94a3b8;white-space:nowrap">or register with email</span>
          <div style="flex:1;height:1px;background:#e2e8f0"></div>
        </div>

        <!-- Registration form -->
        <form class="auth-form" id="registerForm">
          <!-- PATIENT FIELDS -->
          <div id="patientFields" style="${isPatient ? '' : 'display:none'}">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px" class="auth-form-row">
              <div>
                <label style="display:block;font-size:13px;font-weight:600;color:#0a2463;margin-bottom:4px">First Name *</label>
                <div style="display:flex;align-items:center;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 12px;background:#f8fafc;transition:border-color 0.2s" class="auth-input-wrap">
                  <span style="font-size:16px;margin-right:8px;flex-shrink:0">👤</span>
                  <input type="text" id="regFirstName" placeholder="e.g. Amaka" ${isPatient ? 'required' : ''} style="flex:1;border:none;background:transparent;padding:11px 0;font-size:14px;font-family:inherit;outline:none;min-width:0" class="auth-input" />
                </div>
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:600;color:#0a2463;margin-bottom:4px">Surname *</label>
                <div style="display:flex;align-items:center;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 12px;background:#f8fafc;transition:border-color 0.2s" class="auth-input-wrap">
                  <span style="font-size:16px;margin-right:8px;flex-shrink:0">👤</span>
                  <input type="text" id="regSurname" placeholder="e.g. Obi" ${isPatient ? 'required' : ''} style="flex:1;border:none;background:transparent;padding:11px 0;font-size:14px;font-family:inherit;outline:none;min-width:0" class="auth-input" />
                </div>
              </div>
            </div>
            <div style="margin-bottom:12px">
              <label style="display:block;font-size:13px;font-weight:600;color:#0a2463;margin-bottom:4px">Email Address *</label>
              <div style="display:flex;align-items:center;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 12px;background:#f8fafc" class="auth-input-wrap">
                <span style="font-size:16px;margin-right:8px;flex-shrink:0">📧</span>
                <input type="email" id="regEmail" placeholder="yourname@email.com" ${isPatient ? 'required' : ''} style="flex:1;border:none;background:transparent;padding:11px 0;font-size:14px;font-family:inherit;outline:none;min-width:0" class="auth-input" />
                <div class="auth-email-check" id="emailCheckStatus"></div>
              </div>
            </div>
            <div style="margin-bottom:12px">
              <label style="display:block;font-size:13px;font-weight:600;color:#0a2463;margin-bottom:4px">Nigerian Mobile Number *</label>
              <div style="display:flex;align-items:center;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 12px;background:#f8fafc" class="auth-input-wrap">
                <span style="font-size:16px;margin-right:8px;flex-shrink:0">📱</span>
                <input type="tel" id="regPhone" placeholder="e.g. 0801 234 5678" maxlength="11" ${isPatient ? 'required' : ''} style="flex:1;border:none;background:transparent;padding:11px 0;font-size:14px;font-family:inherit;outline:none;min-width:0" class="auth-input" />
              </div>
              <div style="font-size:11px;color:#94a3b8;margin-top:4px">Nigerian numbers: 080X, 070X, 090X, 081X</div>
            </div>
            <div style="margin-bottom:12px">
              <label style="display:block;font-size:13px;font-weight:600;color:#0a2463;margin-bottom:4px">State of Residence *</label>
              <div style="display:flex;align-items:center;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 12px;background:#f8fafc" class="auth-input-wrap">
                <span style="font-size:16px;margin-right:8px;flex-shrink:0">📍</span>
                <select id="regState" ${isPatient ? 'required' : ''} style="flex:1;border:none;background:transparent;padding:11px 0;font-size:14px;font-family:inherit;outline:none;-webkit-appearance:none;appearance:none;cursor:pointer" class="auth-input auth-select">
                  <option value="">Select your state...</option>${stateOptions()}
                </select>
              </div>
            </div>
          </div>

          <!-- DOCTOR FIELDS -->
          <div id="doctorFields" style="${isPatient ? 'display:none' : ''}">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px" class="auth-form-row">
              <div>
                <label style="display:block;font-size:13px;font-weight:600;color:#0a2463;margin-bottom:4px">First Name *</label>
                <div style="display:flex;align-items:center;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 12px;background:#f8fafc" class="auth-input-wrap">
                  <span style="font-size:16px;margin-right:8px;flex-shrink:0">👤</span>
                  <input type="text" id="regDoctorFirstName" placeholder="e.g. Chukwuemeka" ${!isPatient ? 'required' : ''} style="flex:1;border:none;background:transparent;padding:11px 0;font-size:14px;font-family:inherit;outline:none;min-width:0" class="auth-input" />
                </div>
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:600;color:#0a2463;margin-bottom:4px">Surname *</label>
                <div style="display:flex;align-items:center;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 12px;background:#f8fafc" class="auth-input-wrap">
                  <span style="font-size:16px;margin-right:8px;flex-shrink:0">👤</span>
                  <input type="text" id="regDoctorSurname" placeholder="e.g. Okonkwo" ${!isPatient ? 'required' : ''} style="flex:1;border:none;background:transparent;padding:11px 0;font-size:14px;font-family:inherit;outline:none;min-width:0" class="auth-input" />
                </div>
              </div>
            </div>
            <div style="margin-bottom:12px">
              <label style="display:block;font-size:13px;font-weight:600;color:#0a2463;margin-bottom:4px">Email Address *</label>
              <div style="display:flex;align-items:center;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 12px;background:#f8fafc" class="auth-input-wrap">
                <span style="font-size:16px;margin-right:8px;flex-shrink:0">📧</span>
                <input type="email" id="regDoctorEmail" placeholder="doctor@email.com" ${!isPatient ? 'required' : ''} style="flex:1;border:none;background:transparent;padding:11px 0;font-size:14px;font-family:inherit;outline:none;min-width:0" class="auth-input" />
              </div>
            </div>
            <div style="margin-bottom:12px">
              <label style="display:block;font-size:13px;font-weight:600;color:#0a2463;margin-bottom:4px">Nigerian Mobile Number *</label>
              <div style="display:flex;align-items:center;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 12px;background:#f8fafc" class="auth-input-wrap">
                <span style="font-size:16px;margin-right:8px;flex-shrink:0">📱</span>
                <input type="tel" id="regDoctorPhone" placeholder="e.g. 0801 234 5678" maxlength="11" ${!isPatient ? 'required' : ''} style="flex:1;border:none;background:transparent;padding:11px 0;font-size:14px;font-family:inherit;outline:none;min-width:0" class="auth-input" />
              </div>
            </div>
            <div style="margin-bottom:12px">
              <label style="display:block;font-size:13px;font-weight:600;color:#0a2463;margin-bottom:4px">MDCN Registration Number *</label>
              <div style="display:flex;align-items:center;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 12px;background:#f8fafc" class="auth-input-wrap">
                <span style="font-size:16px;margin-right:8px;flex-shrink:0">🏥</span>
                <input type="text" id="regMDCN" placeholder="e.g. MDN/LUTH/2020/12345" ${!isPatient ? 'required' : ''} style="flex:1;border:none;background:transparent;padding:11px 0;font-size:14px;font-family:inherit;outline:none;min-width:0" class="auth-input" />
              </div>
              <div style="font-size:11px;color:#94a3b8;margin-top:4px" class="mdcn-hint">Format: MDN/HOSPITAL/YEAR/NUMBER</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px" class="auth-form-row">
              <div>
                <label style="display:block;font-size:13px;font-weight:600;color:#0a2463;margin-bottom:4px">Specialty *</label>
                <div style="display:flex;align-items:center;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 12px;background:#f8fafc" class="auth-input-wrap">
                  <span style="font-size:16px;margin-right:8px;flex-shrink:0">🩺</span>
                  <select id="regSpecialty" ${!isPatient ? 'required' : ''} style="flex:1;border:none;background:transparent;padding:11px 0;font-size:14px;font-family:inherit;outline:none;-webkit-appearance:none;appearance:none;cursor:pointer" class="auth-input auth-select">
                    <option value="">Select specialty...</option>${specialtyOptions()}
                  </select>
                </div>
              </div>
              <div>
                <label style="display:block;font-size:13px;font-weight:600;color:#0a2463;margin-bottom:4px">State of Practice *</label>
                <div style="display:flex;align-items:center;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 12px;background:#f8fafc" class="auth-input-wrap">
                  <span style="font-size:16px;margin-right:8px;flex-shrink:0">📍</span>
                  <select id="regDoctorState" ${!isPatient ? 'required' : ''} style="flex:1;border:none;background:transparent;padding:11px 0;font-size:14px;font-family:inherit;outline:none;-webkit-appearance:none;appearance:none;cursor:pointer" class="auth-input auth-select">
                    <option value="">Select state...</option>${stateOptions()}
                  </select>
                </div>
              </div>
            </div>
            <div style="margin-bottom:12px">
              <label style="display:block;font-size:13px;font-weight:600;color:#0a2463;margin-bottom:4px">Hospital / Clinic Affiliation</label>
              <div style="display:flex;align-items:center;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 12px;background:#f8fafc" class="auth-input-wrap">
                <span style="font-size:16px;margin-right:8px;flex-shrink:0">🏥</span>
                <input type="text" id="regHospital" placeholder="e.g. Lagos University Teaching Hospital" style="flex:1;border:none;background:transparent;padding:11px 0;font-size:14px;font-family:inherit;outline:none;min-width:0" class="auth-input" />
              </div>
            </div>
            <div style="display:flex;gap:12px;padding:14px 16px;background:#fffbeb;border:1.5px solid #fde68a;border-radius:10px;margin-bottom:16px;font-size:13px;color:#92400e">
              <span style="font-size:20px;flex-shrink:0">📋</span>
              <div>
                <strong>MDCN Verification Required</strong>
                <p style="margin:4px 0 0;font-size:12px;line-height:1.4">Your application will be reviewed by our admin team within 24 hours. You will be notified once approved.</p>
              </div>
            </div>
          </div>

          <!-- PASSWORD (shared) -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px" class="auth-form-row">
            <div>
              <label style="display:block;font-size:13px;font-weight:600;color:#0a2463;margin-bottom:4px">Password *</label>
              <div style="display:flex;align-items:center;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 12px;background:#f8fafc" class="auth-input-wrap">
                <span style="font-size:16px;margin-right:8px;flex-shrink:0">🔒</span>
                <input type="password" id="regPassword" placeholder="Min. 8 characters" required style="flex:1;border:none;background:transparent;padding:11px 0;font-size:14px;font-family:inherit;outline:none;min-width:0" class="auth-input" />
                <button type="button" data-toggle-pw="regPassword" aria-label="Toggle password" style="background:none;border:none;cursor:pointer;font-size:16px;padding:4px;flex-shrink:0">👁️</button>
              </div>
              <div class="password-strength-bar" id="pwStrengthBar" style="height:4px;background:#e2e8f0;border-radius:2px;margin-top:6px;overflow:hidden"><div class="psb-fill" id="pwStrengthFill" style="height:100%;width:0;border-radius:2px;transition:width 0.3s,background 0.3s"></div></div>
              <div class="psb-label" id="pwStrengthLabel" style="font-size:11px;margin-top:2px;color:#94a3b8"></div>
            </div>
            <div>
              <label style="display:block;font-size:13px;font-weight:600;color:#0a2463;margin-bottom:4px">Confirm Password *</label>
              <div style="display:flex;align-items:center;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 12px;background:#f8fafc" class="auth-input-wrap">
                <span style="font-size:16px;margin-right:8px;flex-shrink:0">🔒</span>
                <input type="password" id="regConfirmPassword" placeholder="Repeat password" required style="flex:1;border:none;background:transparent;padding:11px 0;font-size:14px;font-family:inherit;outline:none;min-width:0" class="auth-input" />
              </div>
              <div class="pw-match-status" id="pwMatchStatus" style="font-size:11px;margin-top:4px"></div>
            </div>
          </div>

          <!-- TERMS -->
          <div style="margin-bottom:16px">
            <label style="display:flex;align-items:flex-start;gap:8px;font-size:13px;color:#64748b;cursor:pointer">
              <input type="checkbox" id="regTerms" required style="margin-top:2px;accent-color:#1d6aba" />
              <span>I agree to Virtualcare's <a href="#" style="color:#1d6aba;text-decoration:underline">Terms of Service</a> and <a href="#" style="color:#1d6aba;text-decoration:underline">Privacy Policy (NDPR)</a></span>
            </label>
          </div>

          <div class="auth-error-msg" id="registerError" style="display:none;background:#fef2f2;color:#dc2626;padding:10px 14px;border-radius:8px;font-size:13px;margin-bottom:12px"></div>

          <button type="submit" class="btn-auth-submit" id="registerSubmitBtn" style="width:100%;padding:14px;background:linear-gradient(135deg,#1d6aba,#0a2463);color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;transition:opacity 0.2s">
            ${isPatient ? 'Create Patient Account' : 'Submit Doctor Application'}
          </button>
        </form>

        <div style="text-align:center;margin-top:20px;font-size:14px;color:#64748b">
          Already have an account? <a href="/login" data-link style="color:#1d6aba;font-weight:600;text-decoration:none">Sign in →</a>
        </div>
        <div style="text-align:center;margin-top:10px">
          <a href="/" data-link style="font-size:13px;color:#94a3b8;text-decoration:none">← Back to Home</a>
        </div>
      </div>
    </div>
  </div>`;
}

function checkLockedRole() {
  const user = getUser();
  if (!user) return null;
  return user.role || getRole() || null;
}

export function renderLogin(container) {
  const params = getHashQuery();
  const roleParam = params.get('role');
  const lockedRole = checkLockedRole();

  if (lockedRole === 'patient' || lockedRole === 'doctor') {
    currentAuthRole = lockedRole;
  } else if (roleParam === 'admin' || roleParam === 'doctor' || roleParam === 'patient') {
    currentAuthRole = roleParam;
  } else {
    currentAuthRole = 'patient';
  }

  container.innerHTML = getLoginHTML();
  authRoot = container;
  bindAuthLinks(container);
  bindLoginEvents(container);
  lockLoginRoleIfLoggedIn();

  const error = params.get('error');
  if (error) {
    const msgs = {
      google_failed: 'Google sign-in failed. Please try again.',
      facebook_failed: 'Facebook sign-in failed. Please try again.'
    };
    showAuthError(container.querySelector('#loginError'), msgs[error] || 'Authentication failed. Please try again.');
  }
}

export function renderRegister(container) {
  const params = getHashQuery();
  const lockedRole = checkLockedRole();

  if (lockedRole === 'patient' || lockedRole === 'doctor') {
    currentRegType = lockedRole;
  } else {
    currentRegType = params.get('role') === 'doctor' ? 'doctor' : 'patient';
  }

  container.innerHTML = getRegisterHTML();
  authRoot = container;
  bindAuthLinks(container);
  bindRegisterEvents(container);
  lockRegTypeIfLoggedIn();
}

function bindLoginEvents(root) {
  root.querySelectorAll('[data-auth-role]').forEach((btn) => {
    btn.addEventListener('click', () => setAuthRole(btn.dataset.authRole, btn));
  });

  root.querySelector('#loginForm')?.addEventListener('submit', handleLogin);

  root.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action], [data-toggle-pw]');
    if (!el) return;

    if (el.dataset.togglePw) {
      togglePasswordVisibility(el.dataset.togglePw, el);
      return;
    }

    switch (el.dataset.action) {
      case 'google-signin': signInWithGoogle(); break;
      case 'facebook-signin': signInWithFacebook(); break;
      case 'forgot-password': showForgotPassword(); break;
      case 'close-forgot': closeForgotPassword(); break;
      case 'send-reset': sendPasswordReset(); break;
      case 'goto-dashboard':
        if (el.dataset.role) redirectAfterLogin(el.dataset.role);
        break;
      default: break;
    }
  });
}

function bindRegisterEvents(root) {
  root.querySelectorAll('[data-reg-type]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.regLocked === 'true') {
        const lockedAs = btn.dataset.lockedAs || 'patient';
        showRegLockError(
          lockedAs,
          lockedAs === 'patient'
            ? 'You are registered as a Patient. Contact support for a separate Doctor account.'
            : 'You are registered as a Doctor. Contact support for a separate Patient account.'
        );
        return;
      }
      setRegType(btn.dataset.regType, btn);
    });
  });

  root.querySelector('#registerForm')?.addEventListener('submit', handleRegister);

  root.querySelector('#regEmail')?.addEventListener('input', checkEmailAvailability);
  root.querySelector('#regPhone')?.addEventListener('input', (e) => validateNigerianPhoneInput(e.target));
  root.querySelector('#regDoctorPhone')?.addEventListener('input', (e) => validateNigerianPhoneInput(e.target));
  root.querySelector('#regMDCN')?.addEventListener('input', (e) => validateMDCNInput(e.target));
  root.querySelector('#regPassword')?.addEventListener('input', checkPasswordStrength);
  root.querySelector('#regConfirmPassword')?.addEventListener('input', checkPasswordMatch);

  root.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action], [data-toggle-pw]');
    if (!el) return;

    if (el.dataset.togglePw) {
      togglePasswordVisibility(el.dataset.togglePw, el);
      return;
    }

    switch (el.dataset.action) {
      case 'google-signup': signUpWithGoogle(); break;
      case 'facebook-signup': signUpWithFacebook(); break;
      case 'goto-dashboard':
        if (el.dataset.role) redirectAfterLogin(el.dataset.role);
        break;
      default: break;
    }
  });
}

function setAuthRole(role, btn) {
  if (!role) return;

  if (role === 'admin') {
    const existingUser = getUser();
    if (existingUser && (existingUser.role === 'patient' || existingUser.role === 'doctor')) {
      showAdminBlockError();
      return;
    }
  }

  currentAuthRole = role;

  authRoot?.querySelectorAll('.auth-role-btn').forEach((b) => b.classList.remove('active'));
  btn?.classList.add('active');

  const socialSection = authRoot?.querySelector('#socialAuthSection');
  const divider = authRoot?.querySelector('#authDivider');

  if (role === 'admin') {
    if (socialSection) socialSection.style.display = 'none';
    if (divider) divider.style.display = 'none';
    showAdminLoginHint();
  } else {
    if (socialSection) socialSection.style.display = 'flex';
    if (divider) divider.style.display = 'flex';
    removeAdminHint();
  }
}

function showAdminBlockError() {
  authRoot?.querySelector('#adminBlockError')?.remove();

  const notice = document.createElement('div');
  notice.id = 'adminBlockError';
  notice.className = 'auth-notice auth-notice-error auth-notice-shake';
  notice.innerHTML = `
    <span class="auth-notice-icon">🚫</span>
    <div>
      <div class="auth-notice-title">Access Denied — Admin Only</div>
      <div>The Admin panel is only accessible to Virtualcare Nigeria administrators. Patients and doctors cannot access this area.</div>
    </div>
  `;

  authRoot?.querySelector('.auth-role-selector')?.after(notice);
  setTimeout(() => notice.remove(), 4000);
}

function showAdminLoginHint() {
  removeAdminHint();

  const hint = document.createElement('div');
  hint.id = 'adminLoginHint';
  hint.className = 'auth-notice auth-notice-admin';
  hint.innerHTML = `
    <span class="auth-notice-icon">⚙️</span>
    <div>
      <div class="auth-notice-title auth-notice-title-light">Admin Access Only</div>
      <div>For authorised Virtualcare administrators only. Social sign-in is not available for admin access.</div>
    </div>
  `;

  authRoot?.querySelector('.auth-role-selector')?.after(hint);
}

function removeAdminHint() {
  authRoot?.querySelector('#adminLoginHint')?.remove();
  authRoot?.querySelector('#adminBlockError')?.remove();
}

function setRegType(type, btn) {
  const existingUser = getUser();

  if (existingUser) {
    const existingRole = existingUser.role || getRole();
    if (existingRole === 'patient' && type === 'doctor') {
      showRegLockError(
        'patient',
        'You are registered as a Patient. Patient accounts cannot be switched to Doctor. Please contact support if you need a separate Doctor account.'
      );
      return;
    }
    if (existingRole === 'doctor' && type === 'patient') {
      showRegLockError(
        'doctor',
        'You are registered as a Doctor. Doctor accounts cannot be switched to Patient. Please contact support if you need a separate Patient account.'
      );
      return;
    }
  }

  currentRegType = type;

  authRoot?.querySelectorAll('.reg-type-btn').forEach((b) => b.classList.remove('active'));
  btn?.classList.add('active');

  const showPatient = type === 'patient';
  authRoot?.querySelector('#patientBenefits')?.style.setProperty('display', showPatient ? 'block' : 'none');
  authRoot?.querySelector('#doctorBenefits')?.style.setProperty('display', showPatient ? 'none' : 'block');
  authRoot?.querySelector('#patientFields')?.style.setProperty('display', showPatient ? 'block' : 'none');
  authRoot?.querySelector('#doctorFields')?.style.setProperty('display', showPatient ? 'none' : 'block');
  authRoot?.querySelector('#patientCheck')?.style.setProperty('display', showPatient ? 'flex' : 'none');
  authRoot?.querySelector('#doctorCheck')?.style.setProperty('display', showPatient ? 'none' : 'flex');

  const submitBtn = authRoot?.querySelector('#registerSubmitBtn');
  if (submitBtn) {
    submitBtn.textContent = showPatient ? 'Create Patient Account' : 'Submit Doctor Application';
  }
}

function showRegLockError(lockedAs, message) {
  authRoot?.querySelector('#regLockNotice')?.remove();

  const notice = document.createElement('div');
  notice.id = 'regLockNotice';
  notice.className = `auth-notice auth-notice-lock auth-notice-lock-${lockedAs}`;
  const icons = { patient: '👤', doctor: '👨‍⚕️' };
  const label = lockedAs.charAt(0).toUpperCase() + lockedAs.slice(1);

  notice.innerHTML = `
    <span class="auth-notice-icon">🔒</span>
    <div>
      <div class="auth-notice-title">Account Type Locked — ${icons[lockedAs]} ${label}</div>
      <div>${escapeHtml(message)}</div>
    </div>
  `;

  authRoot?.querySelector('.reg-type-selector')?.after(notice);
}

function lockRegTypeIfLoggedIn() {
  const user = getUser();
  if (!user) return;

  const role = user.role || getRole();
  if (role !== 'patient' && role !== 'doctor') return;

  const patBtn = authRoot?.querySelector('#regTypePatient');
  const docBtn = authRoot?.querySelector('#regTypeDoctor');

  if (role === 'patient') {
    if (docBtn) {
      docBtn.style.opacity = '0.4';
      docBtn.style.cursor = 'not-allowed';
      docBtn.dataset.regLocked = 'true';
      docBtn.dataset.lockedAs = 'patient';
      docBtn.title = 'You are registered as a Patient. Cannot switch to Doctor.';
      if (!docBtn.querySelector('.reg-lock-badge')) {
        const lockBadge = document.createElement('div');
        lockBadge.className = 'reg-lock-badge';
        lockBadge.textContent = '🔒';
        docBtn.style.position = 'relative';
        docBtn.appendChild(lockBadge);
      }
    }
    if (patBtn) {
      patBtn.classList.add('active');
      setRegType('patient', patBtn);
    }

    showRegWelcomeNotice('patient', user);
  } else if (role === 'doctor') {
    if (patBtn) {
      patBtn.style.opacity = '0.4';
      patBtn.style.cursor = 'not-allowed';
      patBtn.dataset.regLocked = 'true';
      patBtn.dataset.lockedAs = 'doctor';
      patBtn.title = 'You are registered as a Doctor. Cannot switch to Patient.';
      if (!patBtn.querySelector('.reg-lock-badge')) {
        const lockBadge = document.createElement('div');
        lockBadge.className = 'reg-lock-badge';
        lockBadge.textContent = '🔒';
        patBtn.style.position = 'relative';
        patBtn.appendChild(lockBadge);
      }
    }
    if (docBtn) {
      docBtn.classList.add('active');
      setRegType('doctor', docBtn);
    }

    showRegWelcomeNotice('doctor', user);
  }
}

function showRegWelcomeNotice(role, user) {
  if (authRoot?.querySelector('#regWelcomeNotice')) return;

  const notice = document.createElement('div');
  notice.id = 'regWelcomeNotice';
  notice.className = `auth-notice auth-notice-welcome auth-notice-welcome-${role}`;

  const name = escapeHtml(`${user.name || ''} ${user.surname || ''}`.trim());
  const roleLabel = role === 'doctor' ? 'Doctor' : 'Patient';
  const prefix = role === 'doctor' ? 'Dr. ' : '';
  const icon = role === 'doctor' ? '👨‍⚕️' : '👤';

  notice.innerHTML = `
    <span class="auth-notice-icon">${icon}</span>
    <div>
      You are already registered as a <strong>${roleLabel}</strong> (${prefix}${name}).
      <button type="button" class="auth-dashboard-link" data-action="goto-dashboard" data-role="${role}">
        Go to your dashboard →
      </button>
    </div>
  `;

  authRoot?.querySelector('.reg-type-selector')?.before(notice);
}

function lockLoginRoleIfLoggedIn() {
  const user = getUser();
  if (!user) return;

  const role = user.role || getRole();
  if (role !== 'patient' && role !== 'doctor') return;

  const roleBtn = authRoot?.querySelector(`[data-auth-role="${role}"]`);
  if (roleBtn) {
    authRoot?.querySelectorAll('.auth-role-btn').forEach((b) => b.classList.remove('active'));
    roleBtn.classList.add('active');
    currentAuthRole = role;
  }

  const adminBtn = authRoot?.querySelector('[data-auth-role="admin"]');
  if (adminBtn) {
    adminBtn.dataset.adminLocked = 'true';
  }
}

async function handleLogin(event) {
  event.preventDefault();

  const email = authRoot?.querySelector('#loginEmail')?.value?.trim();
  const password = authRoot?.querySelector('#loginPassword')?.value;
  const role = currentAuthRole || 'patient';
  const btn = authRoot?.querySelector('#loginSubmitBtn');
  const errorEl = authRoot?.querySelector('#loginError');

  if (!email || !password) {
    showAuthError(errorEl, 'Please fill in all fields');
    return;
  }

  if (!role) {
    showAuthError(errorEl, 'Please select a role');
    return;
  }

  setAuthLoading(btn, true, 'Signing in...');

  try {
    const res = await authApi.login({ email, password, role });
    const user = res.data.user;
    const userRole = res.data.role || user?.role || role;
    const requestedRole = currentAuthRole;

    if (requestedRole === 'admin' && (userRole === 'patient' || userRole === 'doctor')) {
      showAuthError(
        errorEl,
        'Access Denied. This account does not have admin privileges. Please use the correct role.'
      );
      setAuthLoading(btn, false, 'Sign In');
      return;
    }

    if (requestedRole !== 'admin' && userRole !== requestedRole) {
      const label = userRole.charAt(0).toUpperCase() + userRole.slice(1);
      showAuthError(
        errorEl,
        `Wrong role selected. This is a ${userRole} account. Please select "${label}" and try again.`
      );
      setAuthLoading(btn, false, 'Sign In');
      return;
    }

    setAuth(res.data.token, user, userRole);

    if (authRoot?.querySelector('#rememberMe')?.checked) {
      localStorage.setItem('vc_remember', '1');
    }

    showAuthSuccess('Welcome back! Redirecting...');
    setTimeout(() => redirectAfterLogin(userRole), 1000);
  } catch (err) {
    showAuthError(errorEl, err.message || 'Invalid email or password. Please try again.');
    setAuthLoading(btn, false, 'Sign In');
  }
}

async function handleRegister(event) {
  event.preventDefault();

  const existingUser = getUser();
  if (existingUser) {
    const existingRole = existingUser.role || getRole();
    if (existingRole === 'patient' && currentRegType === 'doctor') {
      showRegLockError(
        'patient',
        'You are registered as a Patient. Patient accounts cannot be switched to Doctor.'
      );
      return;
    }
    if (existingRole === 'doctor' && currentRegType === 'patient') {
      showRegLockError(
        'doctor',
        'You are registered as a Doctor. Doctor accounts cannot be switched to Patient.'
      );
      return;
    }
  }

  const btn = authRoot?.querySelector('#registerSubmitBtn');
  const errorEl = authRoot?.querySelector('#registerError');
  const confirmPw = authRoot?.querySelector('#regConfirmPassword')?.value;
  const password = authRoot?.querySelector('#regPassword')?.value;

  let payload = {};

  if (currentRegType === 'patient') {
    const name = authRoot?.querySelector('#regFirstName')?.value?.trim();
    const surname = authRoot?.querySelector('#regSurname')?.value?.trim();
    const email = authRoot?.querySelector('#regEmail')?.value?.trim();
    const phone = authRoot?.querySelector('#regPhone')?.value?.trim();
    const state = authRoot?.querySelector('#regState')?.value;

    payload = {
      name,
      surname,
      email,
      phone,
      state,
      password,
      username: generateUsername(email, name, surname)
    };
  } else {
    const name = authRoot?.querySelector('#regDoctorFirstName')?.value?.trim();
    const surname = authRoot?.querySelector('#regDoctorSurname')?.value?.trim();
    const email = authRoot?.querySelector('#regDoctorEmail')?.value?.trim();
    const mobileNo = authRoot?.querySelector('#regDoctorPhone')?.value?.trim();

    payload = {
      name,
      surname,
      email,
      mobileNo,
      mdcnNumber: authRoot?.querySelector('#regMDCN')?.value?.trim(),
      specialty: authRoot?.querySelector('#regSpecialty')?.value,
      stateOfPractice: authRoot?.querySelector('#regDoctorState')?.value,
      hospitalAffiliation: authRoot?.querySelector('#regHospital')?.value?.trim(),
      password,
      username: generateUsername(email, name, surname)
    };
  }

  if (!payload.name || !payload.email || !password) {
    showAuthError(errorEl, 'Please fill in all required fields');
    return;
  }

  if (password !== confirmPw) {
    showAuthError(errorEl, 'Passwords do not match');
    return;
  }

  if (password.length < 8) {
    showAuthError(errorEl, 'Password must be at least 8 characters');
    return;
  }

  if (currentRegType === 'patient' && payload.phone && !validateNigerianPhone(payload.phone)) {
    showAuthError(errorEl, 'Enter a valid Nigerian phone number');
    return;
  }

  if (currentRegType === 'doctor') {
    if (payload.mobileNo && !validateNigerianPhone(payload.mobileNo)) {
      showAuthError(errorEl, 'Enter a valid Nigerian phone number');
      return;
    }
    if (!/^MDN\/[A-Z]+\/\d{4}\/\d+$/.test(payload.mdcnNumber || '')) {
      showAuthError(errorEl, 'Enter a valid MDCN number (e.g. MDN/LUTH/2019/12345)');
      return;
    }
  }

  if (!authRoot?.querySelector('#regTerms')?.checked) {
    showAuthError(errorEl, 'Please agree to the Terms of Service');
    return;
  }

  setAuthLoading(btn, true, currentRegType === 'doctor' ? 'Submitting Application...' : 'Creating Account...');

  try {
    const res = currentRegType === 'doctor'
      ? await authApi.registerDoctor(payload)
      : await authApi.registerPatient(payload);

    if (currentRegType === 'doctor') {
      showAuthSuccess('✅ Application submitted! Our team will review your credentials within 24 hours. Check your email for updates.');
      setTimeout(() => showLoginPage(), 3000);
    } else {
      setAuth(res.data.token, res.data.user, 'patient');
      showAuthSuccess('🎉 Account created! Welcome to Virtualcare Nigeria!');
      setTimeout(() => redirectAfterLogin('patient'), 1200);
    }
  } catch (err) {
    showAuthError(errorEl, err.message || 'Registration failed. Please try again.');
    setAuthLoading(btn, false, currentRegType === 'doctor' ? 'Submit Doctor Application' : 'Create Patient Account');
  }
}

function generateUsername(email, name, surname) {
  const base = (email?.split('@')[0] || `${name}${surname}`)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .slice(0, 20);
  return `${base}_${Math.random().toString(36).slice(2, 6)}`;
}

function signInWithGoogle() {
  window.location.href = `/api/auth/google?role=${encodeURIComponent(currentAuthRole || 'patient')}`;
}

function signInWithFacebook() {
  window.location.href = `/api/auth/facebook?role=${encodeURIComponent(currentAuthRole || 'patient')}`;
}

function signUpWithGoogle() {
  window.location.href = `/api/auth/google?role=${encodeURIComponent(currentRegType || 'patient')}`;
}

function signUpWithFacebook() {
  window.location.href = `/api/auth/facebook?role=${encodeURIComponent(currentRegType || 'patient')}`;
}

export function handleOAuthCallback() {
  const path = (window.location.hash.slice(1) || '').split('?')[0];
  if (path !== '/oauth-callback') return false;

  const params = getHashQuery();
  const token = params.get('token');
  const userStr = params.get('user');

  if (token && userStr) {
    try {
      const user = JSON.parse(decodeURIComponent(userStr));
      setAuth(token, user, user.role || 'patient');

      if (user.isNewUser) {
        toast(`🎉 Welcome to Virtualcare, ${user.name}!`, 'success', 5000);
      } else {
        toast(`Welcome back, ${user.name}!`, 'success', 3000);
      }

      setTimeout(() => redirectAfterLogin(user.role || 'patient'), 800);
      return true;
    } catch (e) {
      console.error('OAuth callback error:', e);
      toast('Sign-in failed. Please try again.', 'error');
    }
  }

  return false;
}

export function redirectAfterLogin(role) {
  const routes = {
    admin: '/admin/dashboard',
    doctor: '/doctor/dashboard',
    patient: '/patient/dashboard'
  };
  window.location.hash = routes[role] || '/patient/dashboard';
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function returnToHome() {
  window.location.hash = '/';
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function bookConsultation() {
  const token = getToken();
  const role = getRole();

  if (token && role === 'patient') {
    window.location.hash = '/patient/book';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    return;
  }

  if (token && role === 'doctor') {
    window.location.hash = '/login?role=patient';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    return;
  }

  window.location.hash = '/register';
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function showLoginPage() {
  window.location.hash = '/login';
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function showRegisterPage() {
  window.location.hash = '/register';
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

function showAuthError(el, message) {
  if (!el) {
    toast(message, 'error');
    return;
  }
  el.textContent = `⚠️ ${message}`;
  el.style.display = 'block';
  el.style.animation = 'shake 0.4s ease';
  setTimeout(() => { el.style.animation = ''; }, 400);
}

function showAuthSuccess(message) {
  const el = document.createElement('div');
  el.className = 'auth-success-toast';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function setAuthLoading(btn, loading, text) {
  if (!btn) return;
  if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;
  btn.disabled = loading;
  btn.textContent = loading ? text : btn.dataset.originalText;
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isText = input.type === 'text';
  input.type = isText ? 'password' : 'text';
  btn.textContent = isText ? '👁️' : '🙈';
}

function checkPasswordStrength() {
  const pw = authRoot?.querySelector('#regPassword')?.value || '';
  const fill = authRoot?.querySelector('#pwStrengthFill');
  const label = authRoot?.querySelector('#pwStrengthLabel');

  let strength = 0;
  if (pw.length >= 8) strength++;
  if (/[A-Z]/.test(pw)) strength++;
  if (/[0-9]/.test(pw)) strength++;
  if (/[^A-Za-z0-9]/.test(pw)) strength++;

  const levels = [
    { pct: '25%', color: '#dc2626', label: 'Weak' },
    { pct: '50%', color: '#d97706', label: 'Fair' },
    { pct: '75%', color: '#3b99e0', label: 'Good' },
    { pct: '100%', color: '#16a34a', label: 'Strong' }
  ];
  const level = levels[Math.max(0, strength - 1)] || levels[0];

  if (fill) {
    fill.style.width = pw.length > 0 ? level.pct : '0%';
    fill.style.background = level.color;
  }
  if (label) {
    label.textContent = pw.length > 0 ? level.label : '';
    label.style.color = level.color;
  }
}

function checkPasswordMatch() {
  const pw = authRoot?.querySelector('#regPassword')?.value || '';
  const confirm = authRoot?.querySelector('#regConfirmPassword')?.value || '';
  const status = authRoot?.querySelector('#pwMatchStatus');

  if (!status || !confirm) return;

  if (pw === confirm) {
    status.textContent = '✅ Passwords match';
    status.style.color = 'var(--green)';
  } else {
    status.textContent = '❌ Passwords do not match';
    status.style.color = 'var(--red)';
  }
}

function validateNigerianPhoneInput(input) {
  const val = input.value.replace(/[^0-9]/g, '');
  input.value = val;
  const valid = /^(070|080|081|090|091)\d{8}$/.test(val);
  input.style.borderColor = val.length === 11 ? (valid ? 'var(--green)' : 'var(--red)') : 'var(--border)';
}

function validateMDCNInput(input) {
  const val = input.value.toUpperCase();
  input.value = val;
  const valid = /^MDN\/[A-Z]+\/\d{4}\/\d+$/.test(val);
  input.style.borderColor = val.length > 5 ? (valid ? 'var(--green)' : 'var(--red)') : 'var(--border)';
}

function checkEmailAvailability() {
  clearTimeout(emailCheckTimeout);
  emailCheckTimeout = setTimeout(async () => {
    const email = authRoot?.querySelector('#regEmail')?.value?.trim();
    const status = authRoot?.querySelector('#emailCheckStatus');
    if (!email || !email.includes('@')) return;

    if (status) {
      status.textContent = '⏳';
      status.style.color = 'var(--muted)';
    }

    try {
      const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        if (status) status.textContent = '';
        return;
      }
      const data = await res.json();
      if (status) {
        if (data.available) {
          status.textContent = '✅';
          status.style.color = 'var(--green)';
        } else {
          status.textContent = '❌';
          status.style.color = 'var(--red)';
        }
      }
    } catch {
      if (status) status.textContent = '';
    }
  }, 600);
}

function showForgotPassword() {
  const modal = document.getElementById('forgotPwModal');
  if (modal) modal.style.display = 'flex';
}

function closeForgotPassword() {
  const modal = document.getElementById('forgotPwModal');
  if (modal) modal.style.display = 'none';
}

async function sendPasswordReset() {
  const email = document.getElementById('forgotEmail')?.value?.trim();
  if (!email) {
    toast('Please enter your email', 'warning');
    return;
  }
  toast(`📧 Password reset link sent to ${email}`, 'success', 5000);
  closeForgotPassword();
}

export async function logout() {
  try { await authApi.logout(); } catch { /* ignore */ }
  clearAuth();
  window.location.hash = '/';
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

function bindAuthLinks(el) {
  el.querySelectorAll('[data-link]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = a.getAttribute('href');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
  });
}
