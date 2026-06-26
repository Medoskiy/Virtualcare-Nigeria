import { patientsApi, uploadApi, getUser } from '../shared/api.js';
import { toast } from '../shared/toast.js';

export const AVATAR_DATA = {
  male: [
    { emoji: '👨🏿', name: 'Emeka', desc: 'Dark skin' },
    { emoji: '👨🏾', name: 'Tunde', desc: 'Medium dark' },
    { emoji: '👨🏽', name: 'Chukwu', desc: 'Medium skin' },
    { emoji: '👨🏿‍🦱', name: 'Biodun', desc: 'Curly hair' },
    { emoji: '👨🏾‍🦲', name: 'Musa', desc: 'Bald' },
    { emoji: '👨🏿‍🦳', name: 'Alhaji', desc: 'Grey hair' },
    { emoji: '👨🏽‍💼', name: 'Femi', desc: 'Professional' },
    { emoji: '🧔🏿', name: 'Kola', desc: 'Bearded' },
    { emoji: '👨🏾‍💻', name: 'Seun', desc: 'Tech savvy' },
    { emoji: '🧑🏿', name: 'Uche', desc: 'Casual' },
    { emoji: '👨🏿‍🎓', name: 'Dotun', desc: 'Graduate' },
    { emoji: '🧑🏾‍💼', name: 'Obinna', desc: 'Business' }
  ],
  female: [
    { emoji: '👩🏿', name: 'Ngozi', desc: 'Dark skin' },
    { emoji: '👩🏾', name: 'Amaka', desc: 'Medium dark' },
    { emoji: '👩🏽', name: 'Chioma', desc: 'Medium skin' },
    { emoji: '👩🏿‍🦱', name: 'Adaeze', desc: 'Curly hair' },
    { emoji: '👩🏾‍🦰', name: 'Fatima', desc: 'Braids' },
    { emoji: '👩🏿‍🦳', name: 'Mama', desc: 'Grey hair' },
    { emoji: '👩🏽‍💼', name: 'Tola', desc: 'Professional' },
    { emoji: '💁🏿‍♀️', name: 'Shade', desc: 'Confident' },
    { emoji: '👩🏾‍💻', name: 'Kemi', desc: 'Tech savvy' },
    { emoji: '🧕🏿', name: 'Halima', desc: 'Hijab' },
    { emoji: '👩🏿‍🎓', name: 'Blessing', desc: 'Graduate' },
    { emoji: '🧑🏾‍💼', name: 'Ifeoma', desc: 'Business' }
  ],
  doctors: [
    { emoji: '👨🏿‍⚕️', name: 'Dr. Okonkwo', desc: 'Cardiology' },
    { emoji: '👩🏿‍⚕️', name: 'Dr. Nwosu', desc: 'Dermatology' },
    { emoji: '👨🏾‍⚕️', name: 'Dr. Musa', desc: 'General Practice' },
    { emoji: '👩🏾‍⚕️', name: 'Dr. Eze', desc: 'Pediatrics' },
    { emoji: '👨🏽‍⚕️', name: 'Dr. Adeleke', desc: 'Psychiatry' },
    { emoji: '👩🏽‍⚕️', name: 'Dr. Al-Amin', desc: 'Gynecology' },
    { emoji: '🧑🏿‍⚕️', name: 'Dr. Fashola', desc: 'Neurology' },
    { emoji: '👨🏿‍⚕️', name: 'Dr. Abubakar', desc: 'Orthopedics' },
    { emoji: '👩🏿‍⚕️', name: 'Dr. Okafor', desc: 'Ophthalmology' },
    { emoji: '👨🏾‍⚕️', name: 'Dr. Ibrahim', desc: 'ENT' },
    { emoji: '👩🏾‍⚕️', name: 'Dr. Bello', desc: 'Endocrinology' },
    { emoji: '🧑🏽‍⚕️', name: 'Dr. Adeyemi', desc: 'Oncology' }
  ]
};

let selectedAvatar = null;

function isAvatarUrl(avatar) {
  return avatar && (avatar.startsWith('/') || avatar.startsWith('http'));
}

function updateLocalUserAvatar(avatar) {
  const user = getUser();
  if (!user) return;
  user.avatar = avatar;
  localStorage.setItem('vc_user', JSON.stringify(user));
}

function updateSidebarAvatars(display) {
  document.querySelectorAll('.sidebar-avatar, .banner-avatar, .user-avatar').forEach((el) => {
    if (display.type === 'image') {
      el.innerHTML = `<img src="${display.url}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
      el.style.background = 'transparent';
    } else {
      el.textContent = display.emoji;
      el.style.fontSize = '28px';
      el.style.background = '';
    }
  });
}

function applyAvatarDisplay(root, display) {
  const avatarImg = root.querySelector('#avatarImg');
  const avatarEmoji = root.querySelector('#avatarEmoji');
  if (!avatarImg || !avatarEmoji) return;

  if (display.type === 'image') {
    avatarImg.src = display.url;
    avatarImg.style.display = 'block';
    avatarEmoji.style.display = 'none';
  } else {
    avatarImg.style.display = 'none';
    avatarImg.removeAttribute('src');
    avatarEmoji.textContent = display.emoji;
    avatarEmoji.style.display = 'block';
  }
}

function resolveAvatarDisplay(profile) {
  const savedPhoto = localStorage.getItem('patientAvatarPhoto');
  const savedAvatar = localStorage.getItem('patientAvatar');

  if (profile?.avatar && isAvatarUrl(profile.avatar)) {
    return { type: 'image', url: profile.avatar };
  }
  if (savedPhoto) {
    return { type: 'image', url: savedPhoto };
  }
  if (profile?.avatar && !isAvatarUrl(profile.avatar)) {
    return { type: 'emoji', emoji: profile.avatar };
  }
  if (savedAvatar) {
    try {
      const parsed = JSON.parse(savedAvatar);
      if (parsed?.emoji) return { type: 'emoji', emoji: parsed.emoji };
    } catch { /* ignore */ }
  }
  return { type: 'emoji', emoji: '🧑' };
}

export function getAvatarSectionHTML() {
  return `
    <div class="avatar-section">
      <div class="current-avatar-wrap">
        <div class="current-avatar" id="currentAvatar" role="button" tabindex="0" aria-label="Change avatar">
          <img src="" id="avatarImg" alt="" style="display:none;width:100%;height:100%;object-fit:cover;border-radius:50%">
          <span id="avatarEmoji" style="font-size:52px">🧑</span>
        </div>
        <button type="button" class="btn-change-avatar" id="btn-change-avatar">📷 Change Avatar</button>
        <p class="avatar-hint">Choose an avatar or upload your photo</p>
      </div>
    </div>

    <div id="avatarSelectorModal" class="avatar-selector-modal hidden" aria-hidden="true">
      <div class="avatar-modal-box" role="dialog" aria-labelledby="avatarModalTitle">
        <div class="avatar-modal-header">
          <h3 id="avatarModalTitle">Choose Your Avatar</h3>
          <button type="button" class="avatar-modal-close" id="avatar-modal-close" aria-label="Close">×</button>
        </div>

        <div class="avatar-upload-zone" id="avatar-upload-zone">
          <span style="font-size:24px">📤</span>
          <span>Upload your own photo (max 2MB)</span>
        </div>
        <input type="file" id="avatarFileInput" accept="image/jpeg,image/png" style="display:none">

        <div class="avatar-divider"><span>or choose an avatar below</span></div>

        <div class="avatar-category-tabs">
          <button type="button" class="avatar-cat-tab active" data-category="male">👨 Male</button>
          <button type="button" class="avatar-cat-tab" data-category="female">👩 Female</button>
          <button type="button" class="avatar-cat-tab" data-category="doctors">👨‍⚕️ Doctors</button>
        </div>

        <div id="avatarGrid" class="avatar-grid"></div>

        <div class="avatar-selected-preview hidden" id="avatarPreview">
          <span id="previewEmoji" style="font-size:40px"></span>
          <div>
            <p id="previewName" style="font-weight:700;font-size:14px;margin:0"></p>
            <p style="font-size:12px;color:var(--muted);margin:2px 0 0">Selected avatar</p>
          </div>
          <button type="button" class="btn-confirm-avatar" id="btn-confirm-avatar">✅ Use This Avatar</button>
        </div>
      </div>
    </div>
  `;
}

function renderAvatarGrid(root, category) {
  const grid = root.querySelector('#avatarGrid');
  if (!grid) return;

  const avatars = AVATAR_DATA[category] || [];
  grid.innerHTML = avatars.map((avatar) => `
    <div class="avatar-option" data-emoji="${avatar.emoji}" data-name="${avatar.name}" data-desc="${avatar.desc}" title="${avatar.name} — ${avatar.desc}">
      <span class="avatar-opt-emoji">${avatar.emoji}</span>
      <span class="avatar-opt-name">${avatar.name}</span>
      <span class="avatar-opt-desc">${avatar.desc}</span>
    </div>
  `).join('');
}

function openAvatarSelector(root) {
  const modal = root.querySelector('#avatarSelectorModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  selectedAvatar = null;
  const preview = root.querySelector('#avatarPreview');
  preview?.classList.add('hidden');
  const firstTab = root.querySelector('.avatar-cat-tab[data-category="male"]');
  showAvatarCategory(root, 'male', firstTab);
}

function closeAvatarSelector(root) {
  const modal = root.querySelector('#avatarSelectorModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  selectedAvatar = null;
  root.querySelector('#avatarPreview')?.classList.add('hidden');
}

function showAvatarCategory(root, category, clickedTab) {
  root.querySelectorAll('.avatar-cat-tab').forEach((tab) => {
    tab.classList.toggle('active', tab === clickedTab);
  });
  renderAvatarGrid(root, category);
}

function selectAvatar(root, emoji, name, desc) {
  selectedAvatar = { emoji, name, desc };

  root.querySelectorAll('.avatar-option').forEach((opt) => {
    opt.classList.toggle('selected', opt.dataset.emoji === emoji);
  });

  const preview = root.querySelector('#avatarPreview');
  const previewEmoji = root.querySelector('#previewEmoji');
  const previewName = root.querySelector('#previewName');
  preview?.classList.remove('hidden');
  if (previewEmoji) previewEmoji.textContent = emoji;
  if (previewName) previewName.textContent = `${name} — ${desc}`;
}

async function confirmAvatarSelection(root) {
  if (!selectedAvatar) return;

  const display = { type: 'emoji', emoji: selectedAvatar.emoji };
  applyAvatarDisplay(root, display);
  updateSidebarAvatars(display);

  localStorage.setItem('patientAvatar', JSON.stringify(selectedAvatar));
  localStorage.removeItem('patientAvatarPhoto');
  updateLocalUserAvatar(selectedAvatar.emoji);

  closeAvatarSelector(root);
  toast(`Avatar updated to ${selectedAvatar.emoji} ${selectedAvatar.name}!`, 'success');

  try {
    await patientsApi.updateProfile({ avatar: selectedAvatar.emoji });
  } catch {
    /* saved locally */
  }
}

async function handleAvatarUpload(root, file) {
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    toast('Photo too large. Maximum size is 2MB.', 'error');
    return;
  }

  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    toast('Please upload a JPG or PNG image.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    const dataUrl = e.target.result;
    const display = { type: 'image', url: dataUrl };
    applyAvatarDisplay(root, display);
    localStorage.setItem('patientAvatarPhoto', dataUrl);
    localStorage.removeItem('patientAvatar');

    try {
      const res = await uploadApi.avatar(file);
      const url = res.data?.url || dataUrl;
      if (res.data?.url) {
        display.url = url;
        applyAvatarDisplay(root, display);
        updateLocalUserAvatar(url);
      }
      updateSidebarAvatars(display);
      closeAvatarSelector(root);
      toast('Profile photo updated! ✅', 'success');
    } catch {
      updateSidebarAvatars(display);
      closeAvatarSelector(root);
      toast('Photo saved locally. Upload to server failed.', 'warning');
    }
  };
  reader.readAsDataURL(file);
}

export function initAvatarSelector(root, profile) {
  const display = resolveAvatarDisplay(profile);
  applyAvatarDisplay(root, display);
  if (display.type === 'emoji' || display.type === 'image') {
    updateSidebarAvatars(display);
  }

  const open = () => openAvatarSelector(root);
  root.querySelector('#btn-change-avatar')?.addEventListener('click', open);
  root.querySelector('#currentAvatar')?.addEventListener('click', open);
  root.querySelector('#currentAvatar')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  });

  root.querySelector('#avatar-modal-close')?.addEventListener('click', () => closeAvatarSelector(root));
  root.querySelector('#avatarSelectorModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'avatarSelectorModal') closeAvatarSelector(root);
  });

  root.querySelector('#avatar-upload-zone')?.addEventListener('click', () => {
    root.querySelector('#avatarFileInput')?.click();
  });

  root.querySelector('#avatarFileInput')?.addEventListener('change', (e) => {
    handleAvatarUpload(root, e.target.files[0]);
    e.target.value = '';
  });

  root.querySelectorAll('.avatar-cat-tab').forEach((tab) => {
    tab.addEventListener('click', () => showAvatarCategory(root, tab.dataset.category, tab));
  });

  root.querySelector('#avatarGrid')?.addEventListener('click', (e) => {
    const option = e.target.closest('.avatar-option');
    if (!option) return;
    selectAvatar(root, option.dataset.emoji, option.dataset.name, option.dataset.desc);
  });

  root.querySelector('#btn-confirm-avatar')?.addEventListener('click', () => confirmAvatarSelection(root));
}

export function registerAvatarSelectorGlobals() {
  window.openAvatarSelector = () => {
    const root = document.querySelector('.profile-card') || document.querySelector('.dash-content');
    if (root) openAvatarSelector(root);
  };
  window.closeAvatarSelector = () => {
    const root = document.querySelector('.profile-card') || document.querySelector('.dash-content');
    if (root) closeAvatarSelector(root);
  };
}
