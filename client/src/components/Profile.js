/**
 * Profile & Settings View (Light Editorial Design)
 * View and update user profile name and avatar image via GET/PUT /api/users/me.
 */
import { api } from '../api.js';
import { setUser } from '../auth.js';

export function renderProfile({ user: initialUser, onUserUpdate }) {
  const container = document.createElement('div');
  container.className = 'main-container animate-fade-in';
  container.style.maxWidth = '760px';
  container.style.margin = '2rem auto 4rem auto';

  let user = { ...initialUser };
  let isLoading = false;
  let isSaving = false;
  let successMessage = '';
  let errorMessage = '';
  let previewAvatar = user?.profileImage || '';

  async function fetchProfile() {
    isLoading = true;
    errorMessage = '';
    render();

    try {
      const data = await api.getMe();
      user = data;
      previewAvatar = data.profileImage || '';
      setUser(data);
      if (onUserUpdate) onUserUpdate(data);
    } catch (err) {
      errorMessage = `Failed to load profile: ${err.message}`;
    } finally {
      isLoading = false;
      render();
    }
  }

  function render() {
    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
    const avatarHtml = previewAvatar
      ? `<img src="${previewAvatar}" alt="${escapeHtml(user.name)}" onerror="this.parentElement.innerHTML='${userInitial}'" />`
      : `<span>${userInitial}</span>`;

    container.innerHTML = `
      <div style="margin-bottom: 2rem; padding-top: 1rem;">
        <span class="badge" style="background: var(--color-primary-subtle); color: var(--color-primary); margin-bottom: 0.35rem; font-weight: 700;">
          ⚙️ PREFERENCES
        </span>
        <h1 style="font-family: var(--font-heading); font-size: 2.4rem; font-weight: 900; color: #0f172a; margin-top: 0.2rem;">
          Account Settings
        </h1>
        <p style="color: #64748b; font-size: 1rem;">
          Manage your personal profile and journey preferences.
        </p>
      </div>

      ${successMessage ? `
        <div style="background: #ecfdf5; border: 1px solid #a7f3d0; color: #059669; padding: 0.85rem 1.25rem; border-radius: var(--radius-md); font-weight: 600; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.6rem;">
          <span>✅</span>
          <span>${escapeHtml(successMessage)}</span>
        </div>
      ` : ''}

      ${errorMessage ? `
        <div style="background: #fef2f2; border: 1px solid #fecaca; color: #ef4444; padding: 0.85rem 1.25rem; border-radius: var(--radius-md); font-weight: 600; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.6rem;">
          <span>⚠️</span>
          <span>${escapeHtml(errorMessage)}</span>
        </div>
      ` : ''}

      <div class="card" style="padding: 2.25rem; background: #ffffff; border: 1px solid var(--color-border); box-shadow: var(--shadow-sm);">
        ${isLoading ? `
          <div style="text-align: center; padding: 3rem 0;">
            <div class="spinner" style="width: 32px; height: 32px; border: 3px solid rgba(37,99,235,0.2); border-top-color: var(--color-primary); border-radius: 50%; margin: 0 auto;"></div>
            <p style="color: #64748b; margin-top: 1rem;">Loading profile details...</p>
          </div>
        ` : `
          <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem; padding-bottom: 1.75rem; border-bottom: 1px solid var(--color-border);">
            <div class="avatar" style="width: 76px; height: 76px; font-size: 2rem; border: 2px solid var(--color-border);" id="avatar-preview-box">
              ${avatarHtml}
            </div>
            <div>
              <h3 style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 800; color: #0f172a; margin-bottom: 0.2rem;">
                ${escapeHtml(user?.name || 'Traveler')}
              </h3>
              <span style="font-size: 0.92rem; color: #64748b; font-weight: 500;">
                ${escapeHtml(user?.email || '')}
              </span>
            </div>
          </div>

          <form id="profile-form">
            <div class="form-group">
              <label class="form-label" for="profile-name">Display Name *</label>
              <input
                type="text"
                id="profile-name"
                class="form-input"
                value="${escapeHtml(user?.name || '')}"
                placeholder="Your full name"
                required
              />
              <div class="form-error-msg" id="name-validation-error" style="display: none; color: #ef4444; font-size: 0.8rem; margin-top: 0.3rem;"></div>
            </div>

            <div class="form-group">
              <label class="form-label" for="profile-email">Email Address</label>
              <input
                type="email"
                id="profile-email"
                class="form-input"
                value="${escapeHtml(user?.email || '')}"
                disabled
                style="background: #f8fafc; color: #94a3b8; cursor: not-allowed;"
              />
              <span style="font-size: 0.78rem; color: #94a3b8; margin-top: 0.3rem; display: block;">Email address cannot be changed.</span>
            </div>

            <div class="form-group">
              <label class="form-label" for="profile-image">Profile Avatar Image URL</label>
              <input
                type="url"
                id="profile-image"
                class="form-input"
                value="${escapeHtml(user?.profileImage || '')}"
                placeholder="https://example.com/avatar.jpg"
              />
              <span style="font-size: 0.78rem; color: #94a3b8; margin-top: 0.3rem; display: block;">Enter a direct image link (JPEG, PNG, WebP) to update your avatar.</span>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--color-border);">
              <button type="button" class="btn btn-secondary" id="btn-reset-profile">
                Discard Changes
              </button>
              <button type="submit" class="btn btn-primary btn-lg" id="btn-save-profile" ${isSaving ? 'disabled' : ''}>
                ${isSaving ? '<div class="spinner" style="width: 16px; height: 16px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%;"></div> Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        `}
      </div>
    `;

    // Live avatar preview on URL input
    const imageInput = container.querySelector('#profile-image');
    imageInput?.addEventListener('input', (e) => {
      previewAvatar = e.target.value.trim();
      const previewBox = container.querySelector('#avatar-preview-box');
      if (previewBox) {
        const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
        previewBox.innerHTML = previewAvatar
          ? `<img src="${previewAvatar}" alt="Preview" onerror="this.parentElement.innerHTML='${initial}'" />`
          : `<span>${initial}</span>`;
      }
    });

    // Reset button
    container.querySelector('#btn-reset-profile')?.addEventListener('click', () => {
      fetchProfile();
    });

    // Submit handler
    container.querySelector('#profile-form')?.addEventListener('submit', handleSaveProfile);
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    const nameInput = container.querySelector('#profile-name');
    const imageInput = container.querySelector('#profile-image');
    const nameError = container.querySelector('#name-validation-error');

    const name = nameInput?.value.trim();
    const profileImage = imageInput?.value.trim() || null;

    // Client-side Validation
    if (!name || name.length === 0) {
      if (nameError) {
        nameError.textContent = 'Name is required and cannot be empty.';
        nameError.style.display = 'block';
      }
      errorMessage = 'Please fix the validation errors before submitting.';
      render();
      return;
    }

    isSaving = true;
    successMessage = '';
    errorMessage = '';
    render();

    try {
      const updatedUser = await api.updateMe({ name, profileImage });
      user = updatedUser;
      previewAvatar = updatedUser.profileImage || '';
      setUser(updatedUser);
      if (onUserUpdate) onUserUpdate(updatedUser);

      successMessage = 'Profile updated successfully!';
    } catch (err) {
      errorMessage = `Failed to update profile: ${err.message}`;
    } finally {
      isSaving = false;
      render();
    }
  }

  return container;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
