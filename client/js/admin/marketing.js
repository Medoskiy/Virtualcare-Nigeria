import { toast } from '../shared/toast.js';
import { escapeHtml } from '../shared/utils.js';

let mktRoot = null;
let currentMktTab = 'retarget';

const RETARGET_COUNTS = {
  all: 1158,
  new: 127,
  active: 842,
  dormant: 189,
  returning: 284,
  'no-consult': 341
};

const CAMPAIGNS = [
  { title: 'Returning Patient 25% Discount', type: 'Email + Push', sent: '5,234', opens: '71%', status: 'Active', created: '1 Jan 2026' },
  { title: 'New Doctor Onboarding Series', type: 'Email', sent: '89', opens: '84%', status: 'Active', created: '15 Jan 2026' },
  { title: 'World Heart Day Campaign', type: 'Email + SMS', sent: '8,102', opens: '63%', status: 'Completed', created: '25 Sep 2025' },
  { title: 'Malaria Season Awareness', type: 'Push + Email', sent: '12,847', opens: '58%', status: 'Completed', created: '1 Jun 2025' },
  { title: 'Christmas Wellness Drive', type: 'Email + Push + SMS', sent: '9,234', opens: '72%', status: 'Completed', created: '1 Dec 2025' }
];

const SCHEDULED_TIPS = [
  { title: '🦠 Malaria Season Alert', target: 'All Patients', schedule: 'Every Monday 9:00 AM', status: 'active', sent: 4, nextSend: 'Mon, 30 Jun 2026' },
  { title: '❤️ Hypertension Awareness Tip', target: 'Cardiac Patients', schedule: 'Every 2 weeks Wednesday', status: 'active', sent: 6, nextSend: 'Wed, 2 Jul 2026' },
  { title: '💊 Medication Reminder', target: 'Active Patients (842)', schedule: 'Daily 8:00 AM', status: 'paused', sent: 18, nextSend: 'Paused' },
  { title: '👶 Child Immunisation Reminder', target: 'Paediatric Patients', schedule: 'Monthly 1st', status: 'active', sent: 3, nextSend: '1 Jul 2026' }
];

const SOCIAL_TEMPLATE_CHIPS = [
  { label: '👨‍⚕️ Doctor Spotlight', id: 'doc-spotlight' },
  { label: '🎯 Promo Announcement', id: 'promo-announce' },
  { label: '💊 Health Tip', id: 'health-tip-social' },
  { label: '🌟 Patient Testimonial', id: 'testimonial' },
  { label: '🆕 New Feature Alert', id: 'new-feature' },
  { label: '🇳🇬 Nigerian Health Day', id: 'health-day' }
];

const IMAGE_TEMPLATES = [
  '🏥 Hospital Banner',
  '👨‍⚕️ Doctor Card',
  '💊 Health Tip Card',
  '🎯 Promo Banner'
];

const SCHEDULED_POSTS = [
  { content: 'Doctor Spotlight: Dr. Okonkwo...', channels: ['telegram', 'instagram', 'facebook'], scheduled: 'Tomorrow 9:00 AM', status: 'scheduled' },
  { content: 'Malaria Season Alert: Protect...', channels: ['telegram', 'facebook'], scheduled: 'Mon, 30 Jun 9:00 AM', status: 'scheduled' },
  { content: 'Health Tip: Monitor your BP...', channels: ['instagram'], scheduled: 'Weekly Monday 9AM', status: 'recurring' }
];

const SOCIAL_TEMPLATES = {
  'doc-spotlight': `👨‍⚕️ Doctor Spotlight!

Meet Dr. Chukwuemeka Okonkwo — Consultant Cardiologist at LUTH, Lagos.

⭐ Rated 4.97 by 289+ patients
🎓 MDCN Verified · Fellow WACP
❤️ Specialises in Heart Failure & Hypertension

Book a consultation with Dr. Okonkwo today on Virtualcare Nigeria!
📱 virtualcare.ng

#VirtualcareNigeria #Cardiology #NigerianDoctors #TelemedicineNG`,

  'promo-announce': `🎯 SPECIAL OFFER ALERT!

Are you a returning patient? 
You automatically SAVE 25% on every consultation!

✅ No code needed
✅ Applied automatically
✅ Valid on all specialties
✅ Over 80+ verified doctors

Book now → virtualcare.ng

#VirtualcareNigeria #HealthcareNG #Telemedicine #MedicalDiscount`,

  'health-tip-social': `💊 Health Tip of the Day!

Did you know that high blood pressure affects 1 in 3 Nigerians?

🔴 Symptoms to watch:
- Severe headaches
- Chest pain
- Vision problems
- Shortness of breath

Don't ignore the signs. Book a consultation with our cardiologists TODAY on Virtualcare Nigeria!

📱 virtualcare.ng
#HealthTip #Hypertension #VirtualcareNigeria #NigerianHealth`,

  testimonial: `🌟 Patient Testimonial

"Dr. Okonkwo is absolutely exceptional. He took time to explain my condition in detail. I feel so much more confident about my health now. This is the future of healthcare in Nigeria!" — Amaka O., Lagos ⭐⭐⭐⭐⭐

Join 50,000+ Nigerians who trust Virtualcare Nigeria.
📱 Book today → virtualcare.ng

#VirtualcareNigeria #Telemedicine #PatientStories #NigerianHealthcare`,

  'new-feature': `🆕 New Feature Alert!

We just made booking even easier! 🎉

✅ One-tap follow-up booking
✅ Share medical records directly with your doctor  
✅ Prescription download as PDF
✅ WhatsApp appointment reminders

Experience the best telemedicine platform in Nigeria!
📱 virtualcare.ng

#VirtualcareNigeria #NewFeatures #Telemedicine`,

  'health-day': `🇳🇬 World Health Day — Virtualcare Nigeria!

Good health is a right, not a privilege. We are making quality healthcare accessible to every Nigerian — from Lagos to Kano, Enugu to Abuja.

🏥 80+ verified MDCN doctors
📱 Consult from anywhere
💰 Affordable consultation fees
⏰ Available 24/7

Your health. Our mission. 💙
virtualcare.ng

#WorldHealthDay #VirtualcareNigeria #HealthcareForAll #Nigeria`
};

const AI_TIPS = {
  '💊 Medication Reminder':
    '⏰ Medication Reminder!\n\nDear [Name], it\'s time to take your medication. Consistency is key to managing your condition effectively.\n\nIf you have concerns about your medication, book a quick consultation with your doctor today on Virtualcare Nigeria. Stay healthy! 💙',
  '❤️ Cardiac Health':
    '❤️ Heart Health Tip!\n\nDid you know that 1 in 3 Nigerians has high blood pressure? This silent killer can be managed with regular check-ups, healthy diet, and medication.\n\nBook a cardiology consultation today. Our LUTH-certified cardiologists are available now on Virtualcare Nigeria.',
  '🦠 Malaria Prevention':
    '🦠 Malaria Alert — Rainy Season!\n\nWith the rainy season here, mosquito populations are rising. Protect yourself:\n✅ Use insecticide-treated nets\n✅ Remove stagnant water\n✅ Take prophylaxis if advised\n\nFeel feverish? Book a consultation now — don\'t wait!',
  '🧠 Mental Wellness':
    '🧠 Your Mental Health Matters!\n\nStress, anxiety and depression affect millions of Nigerians. There is no shame in seeking help.\n\nOur licensed psychiatrists and counsellors are available for confidential video consultations from the comfort of your home.\n\nBook today on Virtualcare Nigeria. 💙'
};

function renderRetargetingSection() {
  return `
  <div class="retargeting-section">

    <div class="section-intro-card retarget-intro">
      <div class="sic-icon">🎯</div>
      <div class="sic-content">
        <h3>User Retargeting</h3>
        <p>Send personalised messages to registered users based on their activity on the platform. Target new, active, and dormant patients with the right message at the right time.</p>
      </div>
      <div class="sic-stats">
        <div class="sic-stat">
          <strong>1,158</strong>
          <span>Total Patients</span>
        </div>
        <div class="sic-stat">
          <strong style="color:var(--green)">842</strong>
          <span>Active</span>
        </div>
        <div class="sic-stat">
          <strong style="color:var(--amber)">189</strong>
          <span>Dormant</span>
        </div>
        <div class="sic-stat">
          <strong style="color:var(--bright-blue)">127</strong>
          <span>New (7 days)</span>
        </div>
      </div>
    </div>

    <div class="segment-cards-grid">

      <div class="segment-card new-segment">
        <div class="seg-header">
          <div class="seg-icon-wrap new">🆕</div>
          <div class="seg-title-info">
            <h4>Newly Registered</h4>
            <p>Joined in the last 7 days</p>
          </div>
          <div class="seg-count new">127 users</div>
        </div>
        <div class="seg-description">
          Welcome new patients and encourage their first consultation. These users registered but may not have booked yet.
        </div>
        <div class="seg-message-preview">
          <div class="smp-label">🤖 AI-Suggested Message:</div>
          <div class="smp-text">
            "Welcome to Virtualcare Nigeria! 🎉 Your health journey starts here. Book your first consultation today — over 80 specialist doctors are ready for you. Get started in minutes!"
          </div>
        </div>
        <div class="seg-channels">
          <label class="seg-channel-opt"><input type="checkbox" checked /> 📱 Push</label>
          <label class="seg-channel-opt"><input type="checkbox" checked /> 📧 Email</label>
          <label class="seg-channel-opt"><input type="checkbox" /> 💬 SMS</label>
        </div>
        <div class="seg-schedule-row">
          <select class="seg-schedule-select">
            <option>Send immediately</option>
            <option>Schedule for tomorrow 9AM</option>
            <option>Send in 3 days</option>
            <option>Custom schedule</option>
          </select>
        </div>
        <button type="button" class="btn-send-segment new-btn" data-action="send-segment" data-segment="new" data-count="127">
          🚀 Send to 127 New Users
        </button>
      </div>

      <div class="segment-card active-segment">
        <div class="seg-header">
          <div class="seg-icon-wrap active">✅</div>
          <div class="seg-title-info">
            <h4>Active Patients</h4>
            <p>Had a consultation in the last 30 days</p>
          </div>
          <div class="seg-count active">842 users</div>
        </div>
        <div class="seg-description">
          Engage your most loyal patients. Encourage follow-up consultations, share new doctor additions, and reward their loyalty.
        </div>
        <div class="seg-message-preview">
          <div class="smp-label">🤖 AI-Suggested Message:</div>
          <div class="smp-text">
            "Hi [Name]! 👋 Thank you for trusting Virtualcare Nigeria. Your next follow-up might be due soon. Book with Dr. [Last Doctor] or explore new specialists. Your health is our priority. 💙"
          </div>
        </div>
        <div class="seg-channels">
          <label class="seg-channel-opt"><input type="checkbox" checked /> 📱 Push</label>
          <label class="seg-channel-opt"><input type="checkbox" checked /> 📧 Email</label>
          <label class="seg-channel-opt"><input type="checkbox" checked /> 💬 SMS</label>
        </div>
        <div class="seg-schedule-row">
          <select class="seg-schedule-select">
            <option>Send immediately</option>
            <option>Every 2 weeks</option>
            <option>Monthly</option>
            <option>Custom schedule</option>
          </select>
        </div>
        <button type="button" class="btn-send-segment active-btn" data-action="send-segment" data-segment="active" data-count="842">
          🚀 Send to 842 Active Users
        </button>
      </div>

      <div class="segment-card dormant-segment">
        <div class="seg-header">
          <div class="seg-icon-wrap dormant">😴</div>
          <div class="seg-title-info">
            <h4>Dormant Patients</h4>
            <p>No activity in over 30 days</p>
          </div>
          <div class="seg-count dormant">189 users</div>
        </div>
        <div class="seg-description">
          Win back dormant patients with a compelling re-engagement message. Remind them of the convenience and doctors available.
        </div>
        <div class="seg-message-preview">
          <div class="smp-label">🤖 AI-Suggested Message:</div>
          <div class="smp-text">
            "We miss you at Virtualcare Nigeria! 🥺 It's been a while. Your health matters — book a quick consultation from the comfort of your home. We have new specialist doctors waiting to help you. Come back today!"
          </div>
        </div>
        <div class="seg-channels">
          <label class="seg-channel-opt"><input type="checkbox" checked /> 📱 Push</label>
          <label class="seg-channel-opt"><input type="checkbox" checked /> 📧 Email</label>
          <label class="seg-channel-opt"><input type="checkbox" checked /> 💬 SMS</label>
        </div>
        <div class="seg-schedule-row">
          <select class="seg-schedule-select">
            <option>Send immediately</option>
            <option>Staggered over 3 days</option>
            <option>Weekly for 4 weeks</option>
            <option>Custom schedule</option>
          </select>
        </div>
        <button type="button" class="btn-send-segment dormant-btn" data-action="send-segment" data-segment="dormant" data-count="189">
          🚀 Win Back 189 Dormant Users
        </button>
      </div>

      <div class="segment-card returning-segment">
        <div class="seg-header">
          <div class="seg-icon-wrap returning">🔁</div>
          <div class="seg-title-info">
            <h4>Returning Patients</h4>
            <p>3+ consultations on platform</p>
          </div>
          <div class="seg-count returning">284 users</div>
        </div>
        <div class="seg-description">
          Reward your most loyal patients. These are your platform champions. Give them exclusive offers and early access.
        </div>
        <div class="seg-message-preview">
          <div class="smp-label">🤖 AI-Suggested Message:</div>
          <div class="smp-text">
            "You are a Virtualcare VIP! 🌟 Thank you for your loyalty — you automatically enjoy 25% off every consultation. As a thank-you, here is an exclusive offer just for you. Book now and save even more! 💙"
          </div>
        </div>
        <div class="seg-channels">
          <label class="seg-channel-opt"><input type="checkbox" checked /> 📱 Push</label>
          <label class="seg-channel-opt"><input type="checkbox" checked /> 📧 Email</label>
          <label class="seg-channel-opt"><input type="checkbox" /> 💬 SMS</label>
        </div>
        <div class="seg-schedule-row">
          <select class="seg-schedule-select">
            <option>Send immediately</option>
            <option>Monthly appreciation</option>
            <option>Custom schedule</option>
          </select>
        </div>
        <button type="button" class="btn-send-segment returning-btn" data-action="send-segment" data-segment="returning" data-count="284">
          🚀 Send to 284 VIP Patients
        </button>
      </div>

    </div>

    <div class="custom-retarget-card">
      <div class="crc-header">
        <h3>✏️ Custom Retargeting Message</h3>
        <p>Write your own personalised message for any user segment</p>
      </div>
      <div class="crc-form">
        <div class="crc-form-row">
          <div class="crc-field">
            <label for="retargetSegment">Target Segment</label>
            <select class="admin-select" id="retargetSegment">
              <option value="all">All Users (1,158)</option>
              <option value="new">Newly Registered (127)</option>
              <option value="active">Active Patients (842)</option>
              <option value="dormant">Dormant Patients (189)</option>
              <option value="returning">Returning Patients (284)</option>
              <option value="no-consult">Registered, Never Consulted (341)</option>
            </select>
          </div>
          <div class="crc-field">
            <label>Send Via</label>
            <div class="crc-channels">
              <label class="crc-ch"><input type="checkbox" value="push" checked /> 📱 Push</label>
              <label class="crc-ch"><input type="checkbox" value="email" checked /> 📧 Email</label>
              <label class="crc-ch"><input type="checkbox" value="sms" /> 💬 SMS</label>
            </div>
          </div>
          <div class="crc-field">
            <label for="retargetSchedule">Schedule</label>
            <select class="admin-select" id="retargetSchedule">
              <option>Send Now</option>
              <option>Tomorrow 8:00 AM</option>
              <option>Tomorrow 12:00 PM</option>
              <option>In 2 days</option>
              <option>Next Monday 9:00 AM</option>
              <option>Custom date/time</option>
            </select>
          </div>
        </div>
        <div class="crc-field">
          <label for="retargetTitle">Message Title</label>
          <input type="text" id="retargetTitle" class="admin-input" placeholder="e.g. We miss you! Come back to Virtualcare" />
        </div>
        <div class="crc-field">
          <label for="retargetBody">
            Message Body
            <span class="crc-personalize-tip">Use [Name], [LastDoctor], [ConsultCount], [Discount] for personalisation</span>
          </label>
          <textarea id="retargetBody" class="admin-textarea" rows="5" placeholder="Hi [Name], we noticed you haven't visited us in a while. Your health is our priority..."></textarea>
          <div class="crc-char-count" id="retargetCharCount">0 / 500 characters</div>
        </div>
        <div class="crc-recipient-count" id="retargetRecipientCount">
          📬 Will be sent to <strong>1,158 users</strong>
        </div>
        <div class="crc-actions">
          <button type="button" class="btn-preview-retarget" data-action="preview-retarget">👁️ Preview Message</button>
          <button type="button" class="btn-schedule-retarget" data-action="schedule-retarget">📅 Schedule</button>
          <button type="button" class="btn-send-retarget" data-action="send-retarget">📤 Send Now</button>
        </div>
      </div>
    </div>

  </div>`;
}

function renderHealthTipsSection() {
  return `
  <div class="health-tips-section">

    <div class="section-intro-card tips-intro">
      <div class="sic-icon">💊</div>
      <div class="sic-content">
        <h3>Health Tips &amp; Scheduled Reminders</h3>
        <p>Send automated health education and appointment reminders to patients based on their activity. All messages are NDPR-compliant and include unsubscribe options.</p>
      </div>
    </div>

    <div class="tips-segments-grid">

      <div class="tips-segment-card">
        <div class="tsc-header new">
          <div class="tsc-icon">🆕</div>
          <div>
            <h4>Newly Registered Patients</h4>
            <p>127 patients · Joined last 7 days</p>
          </div>
          <div class="tsc-status active">● Active</div>
        </div>
        <div class="tsc-schedule-info">
          <div class="tsi-row"><span>📅 Day 1</span><span>Welcome + Platform Tutorial</span></div>
          <div class="tsi-row"><span>📅 Day 3</span><span>How to Book a Consultation</span></div>
          <div class="tsi-row"><span>📅 Day 7</span><span>Featured Doctors Near You</span></div>
          <div class="tsi-row"><span>📅 Day 14</span><span>First Consultation Reminder</span></div>
        </div>
        <div class="tips-message-types">
          <div class="tmt-item"><span class="tmt-icon">💊</span><span>General wellness tips</span></div>
          <div class="tmt-item"><span class="tmt-icon">🏥</span><span>Platform how-to guides</span></div>
          <div class="tmt-item"><span class="tmt-icon">📱</span><span>Doctor spotlight emails</span></div>
        </div>
        <button type="button" class="btn-configure-tips" data-action="configure-tips" data-segment="new">⚙️ Configure Schedule</button>
        <button type="button" class="btn-send-tip new-tip-btn" data-action="send-tip" data-segment="new">📤 Send Welcome Tip Now</button>
      </div>

      <div class="tips-segment-card">
        <div class="tsc-header active-seg">
          <div class="tsc-icon">✅</div>
          <div>
            <h4>Active Registered Patients</h4>
            <p>842 patients · Consulted before</p>
          </div>
          <div class="tsc-status active">● Active</div>
        </div>
        <div class="tsc-schedule-info">
          <div class="tsi-row"><span>📅 Weekly</span><span>Health tip relevant to condition</span></div>
          <div class="tsi-row"><span>📅 Monthly</span><span>Follow-up consultation reminder</span></div>
          <div class="tsi-row"><span>📅 Seasonal</span><span>Malaria, flu, seasonal alerts</span></div>
          <div class="tsi-row"><span>📅 Birthday</span><span>Birthday health check reminder</span></div>
        </div>
        <div class="tips-message-types">
          <div class="tmt-item"><span class="tmt-icon">❤️</span><span>Condition-specific tips</span></div>
          <div class="tmt-item"><span class="tmt-icon">🩺</span><span>Follow-up reminders</span></div>
          <div class="tmt-item"><span class="tmt-icon">💊</span><span>Medication reminders</span></div>
        </div>
        <button type="button" class="btn-configure-tips" data-action="configure-tips" data-segment="active">⚙️ Configure Schedule</button>
        <button type="button" class="btn-send-tip active-tip-btn" data-action="send-tip" data-segment="active">📤 Send Weekly Tip Now</button>
      </div>

      <div class="tips-segment-card">
        <div class="tsc-header dormant-seg">
          <div class="tsc-icon">😴</div>
          <div>
            <h4>Non-active Patients</h4>
            <p>189 patients · 30+ days inactive</p>
          </div>
          <div class="tsc-status paused">⏸ Paused</div>
        </div>
        <div class="tsc-schedule-info">
          <div class="tsi-row"><span>📅 Week 1</span><span>"We miss you" re-engagement</span></div>
          <div class="tsi-row"><span>📅 Week 2</span><span>New doctors &amp; features update</span></div>
          <div class="tsi-row"><span>📅 Week 3</span><span>Health scare + urgency tip</span></div>
          <div class="tsi-row"><span>📅 Week 4</span><span>Final win-back + promo code</span></div>
        </div>
        <div class="tips-message-types">
          <div class="tmt-item"><span class="tmt-icon">🔁</span><span>Re-engagement series</span></div>
          <div class="tmt-item"><span class="tmt-icon">🎁</span><span>Win-back discount offers</span></div>
          <div class="tmt-item"><span class="tmt-icon">⚠️</span><span>Health urgency alerts</span></div>
        </div>
        <button type="button" class="btn-configure-tips" data-action="configure-tips" data-segment="dormant">⚙️ Configure Schedule</button>
        <button type="button" class="btn-send-tip dormant-tip-btn" data-action="activate-dormant">▶️ Activate Re-engagement Series</button>
      </div>

    </div>

    <div class="tip-composer-card">
      <h3>📝 Create Health Tip Message</h3>
      <div class="tip-composer-form">
        <div class="tip-form-row">
          <div class="tip-field">
            <label for="tipCategory">Tip Category</label>
            <select class="admin-select" id="tipCategory">
              <option>💊 Medication Reminder</option>
              <option>❤️ Cardiac Health</option>
              <option>🦠 Malaria Prevention</option>
              <option>🩸 Blood Pressure Tips</option>
              <option>👶 Child Health</option>
              <option>🧠 Mental Wellness</option>
              <option>🍎 Nutrition &amp; Diet</option>
              <option>💪 Fitness Tips</option>
              <option>🤰 Maternal Health</option>
              <option>🦷 Dental Health</option>
              <option>👁️ Eye Care</option>
              <option>🧪 Lab Test Reminder</option>
            </select>
          </div>
          <div class="tip-field">
            <label for="tipTarget">Send To</label>
            <select class="admin-select" id="tipTarget">
              <option>All Patients (1,158)</option>
              <option>New Patients (127)</option>
              <option>Active Patients (842)</option>
              <option>Dormant Patients (189)</option>
              <option>Cardiac Patients</option>
              <option>Hypertension Patients</option>
              <option>Sickle Cell Patients</option>
            </select>
          </div>
          <div class="tip-field">
            <label for="tipSendTime">Send Time</label>
            <select class="admin-select" id="tipSendTime">
              <option>Send Now</option>
              <option>Today 9:00 AM</option>
              <option>Today 12:00 PM</option>
              <option>Today 6:00 PM</option>
              <option>Tomorrow 9:00 AM</option>
              <option>Weekly (every Monday 9AM)</option>
              <option>Bi-weekly</option>
              <option>Monthly</option>
            </select>
          </div>
        </div>
        <div class="tip-field">
          <label for="tipTitle">Tip Title</label>
          <input type="text" id="tipTitle" class="admin-input" placeholder="e.g. 💊 Time for your blood pressure check!" />
        </div>
        <div class="tip-field">
          <label for="tipBody">
            Tip Message
            <button type="button" class="tip-ai-btn" data-action="generate-ai-tip">✨ Generate with AI</button>
          </label>
          <textarea id="tipBody" class="admin-textarea" rows="5" placeholder="Write your health tip here..."></textarea>
        </div>
        <div class="tip-field">
          <label>Include Call-to-Action Button</label>
          <div class="cta-options">
            <label class="cta-opt"><input type="radio" name="tipCTA" value="book" checked /> 📅 Book Consultation</label>
            <label class="cta-opt"><input type="radio" name="tipCTA" value="tips" /> 📖 Read More Tips</label>
            <label class="cta-opt"><input type="radio" name="tipCTA" value="refer" /> 👥 Refer a Friend</label>
            <label class="cta-opt"><input type="radio" name="tipCTA" value="none" /> No Button</label>
          </div>
        </div>
        <div class="tip-actions">
          <button type="button" class="btn-tip-draft" data-action="save-tip-draft">💾 Save Draft</button>
          <button type="button" class="btn-tip-schedule" data-action="schedule-tip">📅 Schedule</button>
          <button type="button" class="btn-tip-send" data-action="send-tip" data-segment="custom">📤 Send Now</button>
        </div>
      </div>
    </div>

    <div class="scheduled-tips-card">
      <h3>📅 Scheduled Health Tips</h3>
      <div class="scheduled-tips-list">
        ${SCHEDULED_TIPS.map((t) => `
          <div class="stl-item">
            <div class="stl-status-dot ${t.status === 'active' ? 'dot-active' : 'dot-paused'}"></div>
            <div class="stl-info">
              <div class="stl-title">${escapeHtml(t.title)}</div>
              <div class="stl-meta">👥 ${escapeHtml(t.target)} · 📅 ${escapeHtml(t.schedule)} · Sent ${t.sent} times</div>
            </div>
            <div class="stl-next">Next: ${escapeHtml(t.nextSend)}</div>
            <div class="stl-actions">
              <button type="button" class="btn-stl-edit" data-action="edit-tip" data-title="${escapeHtml(t.title)}" title="Edit">✏️</button>
              <button type="button" class="btn-stl-toggle ${t.status === 'active' ? 'btn-pause' : 'btn-play'}" data-action="toggle-tip" data-title="${escapeHtml(t.title)}" data-status="${escapeHtml(t.status)}" title="Toggle">${t.status === 'active' ? '⏸️' : '▶️'}</button>
              <button type="button" class="btn-stl-delete" data-action="delete-tip" data-title="${escapeHtml(t.title)}" title="Delete">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

  </div>`;
}

function renderSocialMediaSection() {
  return `
  <div class="social-media-section">

    <div class="section-intro-card social-intro">
      <div class="sic-icon">📲</div>
      <div class="sic-content">
        <h3>Social Media Automation</h3>
        <p>Schedule and publish posts across Telegram, Instagram and Facebook with one click. Promote Virtualcare Nigeria across all channels simultaneously.</p>
      </div>
      <div class="sic-stats">
        <div class="sic-stat">
          <strong style="color:#0088cc">2,847</strong>
          <span>Telegram Members</span>
        </div>
        <div class="sic-stat">
          <strong style="color:#e1306c">1,203</strong>
          <span>Instagram Followers</span>
        </div>
        <div class="sic-stat">
          <strong style="color:#1877f2">4,891</strong>
          <span>Facebook Followers</span>
        </div>
      </div>
    </div>

    <div class="social-channels-grid">

      <div class="social-channel-card telegram">
        <div class="scc-header">
          <div class="scc-logo telegram-logo"><span>✈️</span></div>
          <div class="scc-info">
            <div class="scc-name">Telegram</div>
            <div class="scc-handle">@virtualcarenigeria</div>
          </div>
          <div class="scc-connected">✅ Connected</div>
        </div>
        <div class="scc-stats">
          <div class="scc-stat"><strong>2,847</strong><span>Members</span></div>
          <div class="scc-stat"><strong>89%</strong><span>Msg Read Rate</span></div>
          <div class="scc-stat"><strong>24</strong><span>Posts This Month</span></div>
        </div>
        <div class="scc-last-post">Last post: 2 hours ago</div>
        <button type="button" class="btn-post-channel telegram-btn" data-action="post-channel" data-channel="telegram">✈️ Post to Telegram Now</button>
      </div>

      <div class="social-channel-card instagram">
        <div class="scc-header">
          <div class="scc-logo instagram-logo"><span>📸</span></div>
          <div class="scc-info">
            <div class="scc-name">Instagram</div>
            <div class="scc-handle">@virtualcare_ng</div>
          </div>
          <div class="scc-connected">✅ Connected</div>
        </div>
        <div class="scc-stats">
          <div class="scc-stat"><strong>1,203</strong><span>Followers</span></div>
          <div class="scc-stat"><strong>4.7%</strong><span>Engagement Rate</span></div>
          <div class="scc-stat"><strong>18</strong><span>Posts This Month</span></div>
        </div>
        <div class="scc-last-post">Last post: Yesterday</div>
        <button type="button" class="btn-post-channel instagram-btn" data-action="post-channel" data-channel="instagram">📸 Post to Instagram Now</button>
      </div>

      <div class="social-channel-card facebook">
        <div class="scc-header">
          <div class="scc-logo facebook-logo"><span>👥</span></div>
          <div class="scc-info">
            <div class="scc-name">Facebook</div>
            <div class="scc-handle">Virtualcare Nigeria</div>
          </div>
          <div class="scc-connected">✅ Connected</div>
        </div>
        <div class="scc-stats">
          <div class="scc-stat"><strong>4,891</strong><span>Followers</span></div>
          <div class="scc-stat"><strong>3.2%</strong><span>Engagement Rate</span></div>
          <div class="scc-stat"><strong>21</strong><span>Posts This Month</span></div>
        </div>
        <div class="scc-last-post">Last post: 3 hours ago</div>
        <button type="button" class="btn-post-channel facebook-btn" data-action="post-channel" data-channel="facebook">👥 Post to Facebook Now</button>
      </div>

    </div>

    <div class="one-click-post-card">
      <div class="ocp-header">
        <div class="ocp-icon">⚡</div>
        <div>
          <h3>One-Click Post to All Channels</h3>
          <p>Write once, publish everywhere — Telegram, Instagram and Facebook simultaneously</p>
        </div>
        <div class="ocp-channels-chips">
          <span class="ocp-chip telegram">✈️ TG</span>
          <span class="ocp-chip instagram">📸 IG</span>
          <span class="ocp-chip facebook">👥 FB</span>
        </div>
      </div>

      <div class="ocp-form">
        <div class="ocp-channel-select">
          <div class="ocp-channel-label">Post to:</div>
          <label class="ocp-ch-toggle">
            <input type="checkbox" id="postTelegram" checked />
            <span class="ocp-ch-pill telegram-pill">✈️ Telegram</span>
          </label>
          <label class="ocp-ch-toggle">
            <input type="checkbox" id="postInstagram" checked />
            <span class="ocp-ch-pill instagram-pill">📸 Instagram</span>
          </label>
          <label class="ocp-ch-toggle">
            <input type="checkbox" id="postFacebook" checked />
            <span class="ocp-ch-pill facebook-pill">👥 Facebook</span>
          </label>
        </div>

        <div class="shoutout-templates">
          <div class="st-label">⚡ Quick Shoutout Templates:</div>
          <div class="st-chips">
            ${SOCIAL_TEMPLATE_CHIPS.map((t) => `
              <button type="button" class="st-chip" data-action="load-social-template" data-template="${escapeHtml(t.id)}">${escapeHtml(t.label)}</button>
            `).join('')}
          </div>
        </div>

        <div class="ocp-field">
          <label for="socialPostContent">Post Content</label>
          <textarea id="socialPostContent" class="admin-textarea ocp-textarea" rows="6" placeholder="Write your post here..."></textarea>
          <div class="social-char-info">
            <span id="socialCharCount">0 characters</span>
            <span class="social-limits">TG: No limit · IG: 2200 · FB: 63206</span>
          </div>
        </div>

        <div class="ocp-image-section">
          <label>Post Image (optional)</label>
          <div class="ocp-image-wrap">
            <div class="ocp-image-placeholder" id="socialImagePreview" data-action="select-social-image" role="button" tabindex="0">
              <span>🖼️</span>
              <span>Click to add image</span>
              <span style="font-size:11px">PNG, JPG — Max 5MB</span>
            </div>
            <div class="ocp-image-templates">
              <div class="ocp-img-label">Quick Templates:</div>
              ${IMAGE_TEMPLATES.map((t) => `
                <button type="button" class="ocp-img-template" data-action="select-img-template" data-template="${escapeHtml(t)}">${escapeHtml(t)}</button>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="ocp-schedule-row">
          <div class="ocp-field">
            <label>Post Schedule</label>
            <div class="schedule-options">
              <label class="schedule-opt active" id="schedNow" data-action="select-schedule" data-opt="now">
                <input type="radio" name="postSchedule" value="now" checked /> ⚡ Post Now
              </label>
              <label class="schedule-opt" id="schedLater" data-action="select-schedule" data-opt="later">
                <input type="radio" name="postSchedule" value="later" /> 📅 Schedule
              </label>
              <label class="schedule-opt" id="schedRecurring" data-action="select-schedule" data-opt="recurring">
                <input type="radio" name="postSchedule" value="recurring" /> 🔄 Recurring
              </label>
            </div>
          </div>
          <div class="ocp-field" id="schedDateTimeField" style="display:none">
            <label for="schedDateTime">Date &amp; Time</label>
            <input type="datetime-local" id="schedDateTime" class="admin-input" />
          </div>
          <div class="ocp-field" id="schedRecurringField" style="display:none">
            <label for="recurringFreq">Repeat Every</label>
            <select class="admin-select" id="recurringFreq">
              <option>Daily</option>
              <option>Every 2 days</option>
              <option>Weekly</option>
              <option>Bi-weekly</option>
              <option>Monthly</option>
            </select>
          </div>
        </div>

        <button type="button" class="btn-one-click-post" data-action="publish-all-channels">
          ⚡ One-Click Post to All Selected Channels
        </button>
      </div>
    </div>

    <div class="scheduled-posts-card">
      <h3>📅 Scheduled Posts</h3>
      <div class="scheduled-posts-list">
        ${SCHEDULED_POSTS.map((p) => `
          <div class="spl-item">
            <div class="spl-channels">
              ${p.channels.includes('telegram') ? '<span class="spl-ch tg">✈️</span>' : ''}
              ${p.channels.includes('instagram') ? '<span class="spl-ch ig">📸</span>' : ''}
              ${p.channels.includes('facebook') ? '<span class="spl-ch fb">👥</span>' : ''}
            </div>
            <div class="spl-content">${escapeHtml(p.content)}</div>
            <div class="spl-schedule">📅 ${escapeHtml(p.scheduled)}</div>
            <div class="spl-status ${escapeHtml(p.status)}">${p.status === 'recurring' ? '🔄 Recurring' : '⏰ Scheduled'}</div>
            <div class="spl-actions">
              <button type="button" class="btn-spl-edit" data-action="edit-scheduled-post" title="Edit">✏️</button>
              <button type="button" class="btn-spl-delete" data-action="delete-scheduled-post" title="Delete">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

  </div>`;
}

function renderCampaignsSection() {
  return `
  <div class="campaigns-section">
    <div class="marketing-campaigns">
      <div class="campaigns-header">
        <h3>All Campaigns</h3>
        <button type="button" class="btn-create-campaign" data-action="create-campaign">✉️ New Campaign</button>
      </div>
      ${CAMPAIGNS.map((c) => `
        <div class="campaign-item">
          <div class="campaign-info">
            <div class="campaign-title">${escapeHtml(c.title)}</div>
            <div class="campaign-meta">${escapeHtml(c.type)} · ${escapeHtml(c.sent)} sent · ${escapeHtml(c.opens)} open rate · Created ${escapeHtml(c.created)}</div>
          </div>
          <span class="campaign-status ${c.status === 'Active' ? 'active' : 'completed'}">${escapeHtml(c.status)}</span>
          <button type="button" class="btn-view-campaign" data-action="view-campaign">View</button>
          <button type="button" class="btn-dupe-campaign" data-action="duplicate-campaign">Copy</button>
        </div>
      `).join('')}
    </div>

    <div class="send-notif-section">
      <h3>📣 Send Platform Notification</h3>
      <div class="send-notif-form">
        <div class="sn-field">
          <label for="mktAudience">Target Audience</label>
          <select id="mktAudience" class="admin-select">
            <option>All Users (1,247)</option>
            <option>All Patients (1,158)</option>
            <option>All Doctors (89)</option>
            <option>Returning Patients (284)</option>
            <option>New Registrations (127)</option>
            <option>Dormant Patients (189)</option>
          </select>
        </div>
        <div class="sn-field">
          <label for="mktNotifType">Notification Type</label>
          <select id="mktNotifType" class="admin-select">
            <option>📱 Push Notification</option>
            <option>📧 Email</option>
            <option>📱 + 📧 Both</option>
          </select>
        </div>
        <div class="sn-field">
          <label for="mktTitle">Title</label>
          <input type="text" id="mktTitle" class="admin-input" placeholder="e.g. New specialist doctors available!" />
        </div>
        <div class="sn-field">
          <label for="mktMessage">Message</label>
          <textarea id="mktMessage" class="admin-textarea" rows="4" placeholder="Write your message..."></textarea>
        </div>
        <div class="sn-actions">
          <button type="button" class="btn-send-notif-preview" data-action="preview-notif">👁️ Preview</button>
          <button type="button" class="btn-send-notif" data-action="send-marketing-notif">📤 Send Now</button>
        </div>
      </div>
    </div>
  </div>`;
}

function getMarketingHTML() {
  return `
  <div class="marketing-page">

    <div class="marketing-header">
      <div>
        <h2>Marketing &amp; Outreach</h2>
        <p>Retargeting, health reminders and social media automation</p>
      </div>
      <div class="mkt-header-actions">
        <button type="button" class="btn-create-campaign" data-action="create-campaign">✉️ New Campaign</button>
        <button type="button" class="btn-mkt-analytics" data-action="mkt-analytics">📊 Analytics</button>
      </div>
    </div>

    <div class="marketing-stats">
      <div class="mkt-stat-card">
        <div class="mkt-stat-icon">📧</div>
        <div class="mkt-stat-value">12,847</div>
        <div class="mkt-stat-label">Emails Sent This Month</div>
        <div class="mkt-stat-trend up">↑ +23%</div>
      </div>
      <div class="mkt-stat-card">
        <div class="mkt-stat-icon">📱</div>
        <div class="mkt-stat-value">8,234</div>
        <div class="mkt-stat-label">Push Notifications</div>
        <div class="mkt-stat-trend up">↑ +18%</div>
      </div>
      <div class="mkt-stat-card">
        <div class="mkt-stat-icon">🎯</div>
        <div class="mkt-stat-value">4,521</div>
        <div class="mkt-stat-label">Retargeted Users</div>
        <div class="mkt-stat-trend up">↑ +31%</div>
      </div>
      <div class="mkt-stat-card">
        <div class="mkt-stat-icon">👁️</div>
        <div class="mkt-stat-value">67.3%</div>
        <div class="mkt-stat-label">Email Open Rate</div>
        <div class="mkt-stat-trend up">↑ +4.2%</div>
      </div>
      <div class="mkt-stat-card">
        <div class="mkt-stat-icon">🔁</div>
        <div class="mkt-stat-value">284</div>
        <div class="mkt-stat-label">Re-engaged Patients</div>
        <div class="mkt-stat-trend up">↑ +67</div>
      </div>
      <div class="mkt-stat-card">
        <div class="mkt-stat-icon">📲</div>
        <div class="mkt-stat-value">3,847</div>
        <div class="mkt-stat-label">Social Reach</div>
        <div class="mkt-stat-trend up">↑ +12%</div>
      </div>
    </div>

    <div class="mkt-tabs-wrap">
      <div class="mkt-tabs">
        <button type="button" class="mkt-tab active" id="mktab-retarget" data-mkt-tab="retarget">🎯 Retargeting</button>
        <button type="button" class="mkt-tab" id="mktab-health-tips" data-mkt-tab="health-tips">💊 Health Tips &amp; Reminders</button>
        <button type="button" class="mkt-tab" id="mktab-social" data-mkt-tab="social">📲 Social Media</button>
        <button type="button" class="mkt-tab" id="mktab-campaigns" data-mkt-tab="campaigns">📣 Campaigns</button>
      </div>
    </div>

    <div class="mkt-content" id="mkt-retarget">${renderRetargetingSection()}</div>
    <div class="mkt-content" id="mkt-health-tips" style="display:none">${renderHealthTipsSection()}</div>
    <div class="mkt-content" id="mkt-social" style="display:none">${renderSocialMediaSection()}</div>
    <div class="mkt-content" id="mkt-campaigns" style="display:none">${renderCampaignsSection()}</div>

  </div>`;
}

function setMktTab(tab, btn) {
  currentMktTab = tab;
  const root = mktRoot || document;

  root.querySelectorAll('.mkt-tab').forEach((t) => t.classList.remove('active'));
  if (btn) {
    btn.classList.add('active');
  } else {
    root.querySelector(`#mktab-${tab}`)?.classList.add('active');
  }

  root.querySelectorAll('.mkt-content').forEach((c) => {
    c.style.display = 'none';
  });

  const content = root.querySelector(`#mkt-${tab}`);
  if (content) {
    content.style.display = 'block';
    content.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function sendSegmentMessage(segment, count) {
  const labels = {
    new: 'New Users',
    active: 'Active Patients',
    dormant: 'Dormant Patients',
    returning: 'VIP Returning Patients'
  };
  toast(`📤 Message sent to ${count} ${labels[segment] || segment}! Notifications dispatched.`, 'success', 5000);
}

function updateRetargetCount() {
  const seg = mktRoot?.querySelector('#retargetSegment')?.value || 'all';
  const count = RETARGET_COUNTS[seg] || 0;
  const el = mktRoot?.querySelector('#retargetRecipientCount');
  if (el) {
    el.innerHTML = `📬 Will be sent to <strong>${count.toLocaleString()} users</strong>`;
  }
}

function updateRetargetCharCount() {
  const body = mktRoot?.querySelector('#retargetBody');
  const counter = mktRoot?.querySelector('#retargetCharCount');
  if (body && counter) {
    const len = body.value.length;
    counter.textContent = `${len} / 500 characters`;
    counter.style.color = len > 500 ? 'var(--amber)' : '';
  }
}

function previewRetargetMsg() {
  const title = mktRoot?.querySelector('#retargetTitle')?.value;
  const body = mktRoot?.querySelector('#retargetBody')?.value;
  if (!title || !body) {
    toast('Please fill title and message', 'warning');
    return;
  }
  toast(`Preview: "${title}" — ${body.slice(0, 50)}...`, 'info', 4000);
}

function scheduleRetarget() {
  const title = mktRoot?.querySelector('#retargetTitle')?.value?.trim();
  if (!title) {
    toast('Please enter a message title', 'warning');
    return;
  }
  toast(`📅 Retargeting message scheduled: "${title}"`, 'success');
}

function sendRetargetNow() {
  const title = mktRoot?.querySelector('#retargetTitle')?.value?.trim();
  const body = mktRoot?.querySelector('#retargetBody')?.value?.trim();

  if (!title || !body) {
    toast('Please fill in title and message', 'warning');
    return;
  }

  const seg = mktRoot?.querySelector('#retargetSegment')?.value || 'all';
  const count = RETARGET_COUNTS[seg] || 0;

  toast(`📤 Retargeting message sent to ${count.toLocaleString()} users! ✅`, 'success', 5000);

  const titleEl = mktRoot?.querySelector('#retargetTitle');
  const bodyEl = mktRoot?.querySelector('#retargetBody');
  if (titleEl) titleEl.value = '';
  if (bodyEl) bodyEl.value = '';
  updateRetargetCharCount();
}

function generateAITip() {
  const category = mktRoot?.querySelector('#tipCategory')?.value || '';

  const catKey = Object.keys(AI_TIPS).find((k) => category.includes(k.split(' ').slice(1).join(' ')));
  const tip = catKey
    ? AI_TIPS[catKey]
    : `💊 Health Tip from Virtualcare Nigeria!\n\nYour health is your greatest wealth. Regular medical check-ups can detect problems early and save your life.\n\nBook a consultation with any of our 80+ verified doctors today. Available 24/7 from anywhere in Nigeria!`;

  const textarea = mktRoot?.querySelector('#tipBody');
  if (textarea) textarea.value = tip;
  toast('✨ AI health tip generated!', 'success');
}

function sendTipNow(segment) {
  const titles = {
    new: 'welcome tip',
    active: 'weekly health tip',
    dormant: 're-engagement tip',
    custom: 'health tip'
  };
  toast(`📤 ${titles[segment] || 'Health tip'} sent! ✅`, 'success');
}

function scheduleTip() {
  const title = mktRoot?.querySelector('#tipTitle')?.value?.trim();
  if (!title) {
    toast('Please enter a tip title', 'warning');
    return;
  }
  toast(`📅 Health tip "${title}" scheduled! ✅`, 'success');
}

function saveTipDraft() {
  toast('Draft saved 💾', 'info');
}

function configureTipsSchedule(segment) {
  toast(`Opening schedule editor for ${segment} patients...`, 'info');
}

function activateDormantTips() {
  toast('▶️ Re-engagement series activated for 189 dormant patients! 4-week drip campaign started.', 'success', 5000);
}

function editScheduledTip(title) {
  toast(`Opening editor for: ${title}`, 'info');
}

function toggleTipSchedule(title, status) {
  const action = status === 'active' ? 'paused' : 'activated';
  toast(`Tip schedule ${action}: ${title}`, 'info');
}

function deleteTipSchedule(title) {
  if (confirm(`Delete scheduled tip: "${title}"?`)) {
    toast('Tip schedule deleted.', 'info');
  }
}

function loadSocialTemplate(templateId) {
  const template = SOCIAL_TEMPLATES[templateId];
  if (!template) return;

  const textarea = mktRoot?.querySelector('#socialPostContent');
  if (textarea) {
    textarea.value = template;
    updateSocialCharCount();
  }
  toast('Template loaded! ✅ Edit as needed.', 'success');
}

function updateSocialCharCount() {
  const textarea = mktRoot?.querySelector('#socialPostContent');
  const counter = mktRoot?.querySelector('#socialCharCount');
  if (textarea && counter) {
    const len = textarea.value.length;
    counter.textContent = `${len} characters`;
    counter.style.color = len > 2200 ? 'var(--amber)' : 'var(--muted)';
  }
}

function selectScheduleOpt(opt, label) {
  const root = mktRoot || document;
  root.querySelectorAll('.schedule-opt').forEach((o) => o.classList.remove('active'));
  if (label) label.classList.add('active');

  const radio = label?.querySelector('input[type="radio"]');
  if (radio) radio.checked = true;

  const dateField = root.querySelector('#schedDateTimeField');
  const recurringField = root.querySelector('#schedRecurringField');

  if (dateField) dateField.style.display = opt === 'later' ? 'block' : 'none';
  if (recurringField) recurringField.style.display = opt === 'recurring' ? 'block' : 'none';
}

function publishToAllChannels() {
  const content = mktRoot?.querySelector('#socialPostContent')?.value?.trim();

  if (!content) {
    toast('Please write your post content first', 'warning');
    return;
  }

  const tg = mktRoot?.querySelector('#postTelegram')?.checked;
  const ig = mktRoot?.querySelector('#postInstagram')?.checked;
  const fb = mktRoot?.querySelector('#postFacebook')?.checked;

  const channels = [];
  if (tg) channels.push('✈️ Telegram');
  if (ig) channels.push('📸 Instagram');
  if (fb) channels.push('👥 Facebook');

  if (channels.length === 0) {
    toast('Please select at least one channel', 'warning');
    return;
  }

  toast(`⚡ Published to: ${channels.join(', ')} ✅`, 'success', 5000);

  const textarea = mktRoot?.querySelector('#socialPostContent');
  if (textarea) textarea.value = '';
  updateSocialCharCount();
}

function postToChannel(channel) {
  const names = {
    telegram: '✈️ Telegram',
    instagram: '📸 Instagram',
    facebook: '👥 Facebook'
  };
  toast(`Opening ${names[channel] || channel} post editor...`, 'info');

  const root = mktRoot || document;
  setMktTab('social', root.querySelector('#mktab-social'));

  setTimeout(() => {
    root.querySelector('.one-click-post-card')?.scrollIntoView({ behavior: 'smooth' });

    const tg = root.querySelector('#postTelegram');
    const ig = root.querySelector('#postInstagram');
    const fb = root.querySelector('#postFacebook');
    if (tg) tg.checked = channel === 'telegram';
    if (ig) ig.checked = channel === 'instagram';
    if (fb) fb.checked = channel === 'facebook';
  }, 100);
}

function selectSocialImage() {
  toast('Image picker coming soon!', 'info');
}

function selectImageTemplate(template) {
  const preview = mktRoot?.querySelector('#socialImagePreview');
  if (preview) {
    const emoji = template.split(' ')[0];
    preview.innerHTML = `
      <div style="font-size:40px">${escapeHtml(emoji)}</div>
      <div style="font-size:13px;font-weight:700;color:var(--bright-blue)">${escapeHtml(template)}</div>
      <div style="font-size:11px;color:var(--muted)">Template selected ✅</div>`;
    preview.style.background = 'var(--sky)';
    preview.style.border = '2px solid var(--light-blue)';
  }
  toast(`${template} template selected ✅`, 'success');
}

function editScheduledPost() {
  toast('Opening post editor...', 'info');
}

function deleteScheduledPost() {
  if (confirm('Delete this scheduled post?')) {
    toast('Scheduled post deleted.', 'info');
  }
}

function openCreateCampaignModal() {
  const existing = document.getElementById('create-campaign-modal');
  if (existing) { existing.style.display = 'flex'; return; }

  const modal = document.createElement('div');
  modal.id = 'create-campaign-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:10001;display:flex;align-items:center;justify-content:center;padding:16px';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:16px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.25)">
      <div style="background:linear-gradient(135deg,#0a2463,#1d6aba);padding:20px 24px;border-radius:16px 16px 0 0;display:flex;align-items:center;justify-content:space-between">
        <h3 style="color:#fff;margin:0;font-size:18px;font-weight:800">✉️ New Campaign</h3>
        <button type="button" id="close-camp-modal" style="background:rgba(255,255,255,0.2);border:none;border-radius:50%;width:32px;height:32px;color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center">×</button>
      </div>
      <div style="padding:24px;display:flex;flex-direction:column;gap:16px">
        <div>
          <label style="display:block;font-size:13px;font-weight:600;color:#0a2463;margin-bottom:6px">Campaign Name *</label>
          <input type="text" id="camp-name" placeholder="e.g. Malaria Season Awareness 2026" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:14px;font-family:inherit;box-sizing:border-box" />
        </div>
        <div>
          <label style="display:block;font-size:13px;font-weight:600;color:#0a2463;margin-bottom:6px">Campaign Type *</label>
          <select id="camp-type" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:14px;font-family:inherit;box-sizing:border-box;background:#fff">
            <option>📧 Email</option>
            <option>📱 Push Notification</option>
            <option>📧 + 📱 Email + Push</option>
            <option>📧 + 📱 + SMS All Channels</option>
          </select>
        </div>
        <div>
          <label style="display:block;font-size:13px;font-weight:600;color:#0a2463;margin-bottom:6px">Target Audience *</label>
          <select id="camp-audience" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:14px;font-family:inherit;box-sizing:border-box;background:#fff">
            <option>All Users (1,247)</option>
            <option>All Patients (1,158)</option>
            <option>Returning Patients (284)</option>
            <option>New Registrations (127)</option>
            <option>Dormant Patients (189)</option>
            <option>All Doctors (89)</option>
          </select>
        </div>
        <div>
          <label style="display:block;font-size:13px;font-weight:600;color:#0a2463;margin-bottom:6px">Subject / Title *</label>
          <input type="text" id="camp-subject" placeholder="e.g. Protect yourself this malaria season!" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:14px;font-family:inherit;box-sizing:border-box" />
        </div>
        <div>
          <label style="display:block;font-size:13px;font-weight:600;color:#0a2463;margin-bottom:6px">Message *</label>
          <textarea id="camp-message" rows="4" placeholder="Write your campaign message here..." style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:14px;font-family:inherit;box-sizing:border-box;resize:vertical"></textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <label style="display:block;font-size:13px;font-weight:600;color:#0a2463;margin-bottom:6px">Schedule</label>
            <select id="camp-schedule" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:14px;font-family:inherit;background:#fff">
              <option>Send Immediately</option>
              <option>Schedule for Later</option>
              <option>Recurring Weekly</option>
              <option>Recurring Monthly</option>
            </select>
          </div>
          <div>
            <label style="display:block;font-size:13px;font-weight:600;color:#0a2463;margin-bottom:6px">Priority</label>
            <select id="camp-priority" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:14px;font-family:inherit;background:#fff">
              <option>Normal</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
          </div>
        </div>
        <div style="display:flex;gap:8px;padding-top:8px">
          <button type="button" onclick="document.getElementById('create-campaign-modal').style.display='none'" style="flex:1;padding:12px;background:#f1f5f9;color:#64748b;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer">Cancel</button>
          <button type="button" onclick="
            const name = document.getElementById('camp-name').value.trim();
            if (!name) { alert('Please enter a campaign name'); return; }
            document.getElementById('create-campaign-modal').style.display='none';
            const t = document.createElement('div');
            t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#166534;color:#fff;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;z-index:99999';
            t.textContent = '✅ Campaign created successfully!';
            document.body.appendChild(t);
            setTimeout(() => t.remove(), 3000);
          " style="flex:2;padding:12px;background:linear-gradient(135deg,#1d6aba,#0a2463);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">✉️ Create Campaign</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('#close-camp-modal').addEventListener('click', () => modal.style.display = 'none');
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
}

function duplicateCampaign() {
  toast('Campaign duplicated ✅', 'success');
}

function viewCampaign() {
  toast('Campaign details coming soon!', 'info');
}

function viewMarketingAnalytics() {
  const existing = document.getElementById('mkt-analytics-modal');
  if (existing) { existing.style.display = 'flex'; return; }

  const modal = document.createElement('div');
  modal.id = 'mkt-analytics-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:10001;display:flex;align-items:center;justify-content:center;padding:16px';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:16px;width:100%;max-width:620px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.25)">
      <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:20px 24px;border-radius:16px 16px 0 0;display:flex;align-items:center;justify-content:space-between">
        <h3 style="color:#fff;margin:0;font-size:18px;font-weight:800">📊 Marketing Analytics</h3>
        <button type="button" id="close-analytics-modal" style="background:rgba(255,255,255,0.2);border:none;border-radius:50%;width:32px;height:32px;color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center">×</button>
      </div>
      <div style="padding:24px">
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px">
          ${[
            { icon: '📧', label: 'Emails Sent', value: '34,521', trend: '↑ +12%', color: '#1d6aba' },
            { icon: '👁️', label: 'Open Rate', value: '68.4%', trend: '↑ +5%', color: '#16a34a' },
            { icon: '🖱️', label: 'Click Rate', value: '24.1%', trend: '↑ +3%', color: '#7c3aed' },
            { icon: '🔄', label: 'Conversions', value: '1,247', trend: '↑ +18%', color: '#d97706' }
          ].map(s => `
            <div style="background:#f8fafc;border-radius:12px;padding:14px;border:1px solid #e2e8f0">
              <div style="font-size:20px;margin-bottom:6px">${s.icon}</div>
              <div style="font-size:20px;font-weight:800;color:${s.color}">${s.value}</div>
              <div style="font-size:12px;color:#64748b">${s.label}</div>
              <div style="font-size:11px;color:#16a34a;font-weight:600;margin-top:2px">${s.trend} this month</div>
            </div>
          `).join('')}
        </div>
        <div style="background:#f8fafc;border-radius:12px;padding:16px;margin-bottom:16px">
          <div style="font-size:14px;font-weight:700;color:#0a2463;margin-bottom:12px">📣 Top Performing Campaigns</div>
          ${[
            { name: 'Returning Patient 25% Discount', opens: '71%', conv: '284' },
            { name: 'New Doctor Onboarding Series', opens: '84%', conv: '89' },
            { name: 'Malaria Season Awareness', opens: '63%', conv: '412' }
          ].map(c => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:13px">
              <span style="color:#0a2463;font-weight:500;flex:1">${c.name}</span>
              <span style="color:#16a34a;font-weight:600;margin-left:12px">${c.opens} opens</span>
              <span style="color:#7c3aed;font-weight:600;margin-left:12px">${c.conv} converted</span>
            </div>
          `).join('')}
        </div>
        <button type="button" id="close-analytics-body-btn" style="width:100%;padding:12px;background:#f1f5f9;color:#64748b;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('#close-analytics-modal').addEventListener('click', () => modal.style.display = 'none');
  modal.querySelector('#close-analytics-body-btn').addEventListener('click', () => modal.style.display = 'none');
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
}

function previewMarketingNotif() {
  const title = mktRoot?.querySelector('#mktTitle')?.value?.trim();
  const message = mktRoot?.querySelector('#mktMessage')?.value?.trim();
  if (!title || !message) {
    toast('Please fill in title and message', 'warning');
    return;
  }
  toast(`Preview: "${title}" — ${message.slice(0, 50)}...`, 'info', 4000);
}

function sendMarketingNotif() {
  toast('Platform notification sent! ✅', 'success');
}

function handleMarketingAction(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;

  const { action, segment, count, channel, template, opt, title, status } = el.dataset;

  switch (action) {
    case 'create-campaign': openCreateCampaignModal(); break;
    case 'mkt-analytics': viewMarketingAnalytics(); break;
    case 'send-segment': sendSegmentMessage(segment, Number(count)); break;
    case 'preview-retarget': previewRetargetMsg(); break;
    case 'schedule-retarget': scheduleRetarget(); break;
    case 'send-retarget': sendRetargetNow(); break;
    case 'generate-ai-tip': generateAITip(); break;
    case 'configure-tips': configureTipsSchedule(segment); break;
    case 'send-tip': sendTipNow(segment); break;
    case 'activate-dormant': activateDormantTips(); break;
    case 'save-tip-draft': saveTipDraft(); break;
    case 'schedule-tip': scheduleTip(); break;
    case 'edit-tip': editScheduledTip(title); break;
    case 'toggle-tip': toggleTipSchedule(title, status); break;
    case 'delete-tip': deleteTipSchedule(title); break;
    case 'post-channel': postToChannel(channel); break;
    case 'load-social-template': loadSocialTemplate(template); break;
    case 'select-social-image': selectSocialImage(); break;
    case 'select-img-template': selectImageTemplate(template); break;
    case 'select-schedule': selectScheduleOpt(opt, el); break;
    case 'publish-all-channels': publishToAllChannels(); break;
    case 'edit-scheduled-post': editScheduledPost(); break;
    case 'delete-scheduled-post': deleteScheduledPost(); break;
    case 'view-campaign': viewCampaign(); break;
    case 'duplicate-campaign': duplicateCampaign(); break;
    case 'preview-notif': previewMarketingNotif(); break;
    case 'send-marketing-notif': sendMarketingNotif(); break;
    default: break;
  }
}

function bindMarketingEvents(root) {
  mktRoot = root;
  root.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('[data-mkt-tab]');
    if (tabBtn) {
      setMktTab(tabBtn.dataset.mktTab, tabBtn);
      return;
    }
    handleMarketingAction(e);
  });

  root.querySelector('#retargetBody')?.addEventListener('input', updateRetargetCharCount);
  root.querySelector('#retargetSegment')?.addEventListener('change', updateRetargetCount);
  root.querySelector('#socialPostContent')?.addEventListener('input', updateSocialCharCount);
}

export async function renderMarketing(container) {
  currentMktTab = 'retarget';
  container.innerHTML = getMarketingHTML();
  bindMarketingEvents(container);
  updateRetargetCount();
  updateRetargetCharCount();
  updateSocialCharCount();
}
