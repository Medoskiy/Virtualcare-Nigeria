export function renderPrivacyPolicy(container) {
  container.innerHTML = `
    <div class="container section" style="max-width:800px;margin:0 auto;padding:40px 20px;">
      <h1 style="color:#1e293b;margin-bottom:8px;">Privacy Policy</h1>
      <p style="color:#64748b;margin-bottom:32px;">Last updated: July 1, 2026 · Effective under the Nigeria Data Protection Regulation (NDPR)</p>

      <div class="card" style="padding:32px;margin-bottom:24px;">
        <h2 style="color:#0066cc;">1. Who We Are</h2>
        <p>Virtualcare Nigeria is a telemedicine platform operated in accordance with MDCN guidelines and the Nigeria Data Protection Regulation (NDPR) 2019. We connect patients with MDCN-certified doctors for virtual consultations.</p>
        <p><strong>Data Controller:</strong> Virtualcare Nigeria<br>
        <strong>Contact:</strong> support@virtualcare.me<br>
        <strong>Website:</strong> https://virtualcare.me</p>
      </div>

      <div class="card" style="padding:32px;margin-bottom:24px;">
        <h2 style="color:#0066cc;">2. Data We Collect</h2>
        <p>We collect the following personal and health data:</p>
        <ul style="color:#475569;line-height:2;">
          <li>Full name, email address, phone number</li>
          <li>Date of birth, gender, state of residence</li>
          <li>Medical history, symptoms, prescriptions</li>
          <li>Payment information (processed securely via Paystack)</li>
          <li>Consultation records and doctor notes</li>
          <li>Device information and usage data</li>
        </ul>
      </div>

      <div class="card" style="padding:32px;margin-bottom:24px;">
        <h2 style="color:#0066cc;">3. How We Use Your Data</h2>
        <ul style="color:#475569;line-height:2;">
          <li>To provide telemedicine consultation services</li>
          <li>To connect you with appropriate MDCN-certified doctors</li>
          <li>To process payments for consultations</li>
          <li>To send appointment reminders and health notifications</li>
          <li>To improve our platform and services</li>
          <li>To comply with Nigerian healthcare regulations</li>
        </ul>
      </div>

      <div class="card" style="padding:32px;margin-bottom:24px;">
        <h2 style="color:#0066cc;">4. Your Rights Under NDPR</h2>
        <p>As a data subject under the NDPR, you have the right to:</p>
        <ul style="color:#475569;line-height:2;">
          <li><strong>Access</strong> — Request a copy of your personal data</li>
          <li><strong>Rectification</strong> — Correct inaccurate personal data</li>
          <li><strong>Erasure</strong> — Request deletion of your personal data</li>
          <li><strong>Portability</strong> — Receive your data in a portable format</li>
          <li><strong>Objection</strong> — Object to processing of your data</li>
          <li><strong>Withdraw Consent</strong> — Withdraw consent at any time</li>
        </ul>
        <p style="margin-top:16px;">To exercise these rights, email us at <a href="mailto:support@virtualcare.me" style="color:#0066cc;">support@virtualcare.me</a></p>
      </div>

      <div class="card" style="padding:32px;margin-bottom:24px;">
        <h2 style="color:#0066cc;">5. Data Security</h2>
        <p>We implement industry-standard security measures including:</p>
        <ul style="color:#475569;line-height:2;">
          <li>SSL/TLS encryption for all data in transit</li>
          <li>Encrypted storage for sensitive health data</li>
          <li>JWT-based authentication with secure token expiry</li>
          <li>Regular security audits and vulnerability assessments</li>
          <li>Access controls limiting data access to authorized personnel only</li>
        </ul>
      </div>

      <div class="card" style="padding:32px;margin-bottom:24px;">
        <h2 style="color:#0066cc;">6. Data Retention</h2>
        <p>We retain your personal data for as long as your account is active or as required by Nigerian law. Medical records are retained for a minimum of 6 years in compliance with MDCN guidelines. You may request account deletion at any time.</p>
      </div>

      <div class="card" style="padding:32px;margin-bottom:24px;">
        <h2 style="color:#0066cc;">7. Third Party Services</h2>
        <p>We use the following third-party services:</p>
        <ul style="color:#475569;line-height:2;">
          <li><strong>Paystack</strong> — Payment processing (PCI DSS compliant)</li>
          <li><strong>Agora</strong> — Video and audio consultations</li>
          <li><strong>Termii</strong> — SMS notifications</li>
          <li><strong>Anthropic Claude</strong> — AI health assistant (VirtualAI)</li>
          <li><strong>Google/Facebook</strong> — Optional social login</li>
        </ul>
      </div>

      <div class="card" style="padding:32px;margin-bottom:24px;">
        <h2 style="color:#0066cc;">8. Cookies</h2>
        <p>We use essential cookies for authentication and session management. With your consent, we also use analytics cookies to improve our services. You can manage cookie preferences at any time.</p>
      </div>

      <div class="card" style="padding:32px;margin-bottom:24px;">
        <h2 style="color:#0066cc;">9. Contact & Complaints</h2>
        <p>For privacy concerns or to exercise your NDPR rights:</p>
        <p><strong>Email:</strong> <a href="mailto:support@virtualcare.me" style="color:#0066cc;">support@virtualcare.me</a><br>
        <strong>Website:</strong> <a href="https://virtualcare.me" style="color:#0066cc;">virtualcare.me</a></p>
        <p>You may also lodge a complaint with the <strong>National Information Technology Development Agency (NITDA)</strong> at <a href="https://nitda.gov.ng" style="color:#0066cc;" target="_blank">nitda.gov.ng</a></p>
      </div>

      <div style="text-align:center;margin-top:32px;">
        <a href="/" data-link class="btn btn-primary">← Back to Home</a>
      </div>
    </div>`;
}
