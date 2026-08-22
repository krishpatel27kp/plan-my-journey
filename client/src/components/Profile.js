/**
 * Profile & Settings View
 * View and update user profile name and avatar image via GET/PUT /api/users/me.
 */
import { api } from '../api.js';
import { setUser } from '../auth.js';

export function renderProfile({ user: initialUser, onUserUpdate }) {
  const container = document.createElement('div');
  container.className = 'main-container animate-fade-in';

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
      <div style="max-width: 680px; margin: 0 auto;">
        <div style="margin-bottom: 2rem;">
          <h1 style="font-size: 2.2rem; margin-bottom: 0.25rem;">Account Settings</h1>
          <p style="color: var(--color-text-muted); font-size: 1rem;">
            Manage your personal profile and journey preferences.
          </p>
        </div>

        ${successMessage ? `
          <div class="alert alert-success animate-fade-in" id="profile-success-alert">
            <span>✅</span>
            <span>${escapeHtml(successMessage)}</span>
          </div>
        ` : ''}

        ${errorMessage ? `
          <div class="alert alert-danger animate-fade-in" id="profile-error-alert">
            <span>⚠️</span>
            <span>${escapeHtml(errorMessage)}</span>
          </div>
        ` : ''}

        <div class="card" style="padding: 2rem;">
          ${isLoading ? `
            <div style="text-align: center; padding: 3rem 0;">
              <div class="spinner" style="width: 2rem; height: 2rem; border-top-color: var(--color-primary-light);"></div>
              <p style="color: var(--color-text-muted); margin-top: 1rem;">Loading profile details...</p>
            </div>
          ` : `
            <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--color-border);">
              <div class="avatar" style="width: 72px; height: 72px; font-size: 1.75rem;" id="avatar-preview-box">
                ${avatarHtml}
              </div>
              <div>
                <h3 style="font-size: 1.3rem; margin-bottom: 0.25rem;">${escapeHtml(user?.name || 'Traveler')}</h3>
                <span style="font-size: 0.9rem; color: var(--color-text-muted);">${escapeHtml(user?.email || '')}</span>
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
                <div class="form-error-msg" id="name-validation-error" style="display: none;"></div>
              </div>

              <div class="form-group">
                <label class="form-label" for="profile-email">Email Address</label>
                <input
                  type="email"
                  id="profile-email"
                  class="form-input"
                  value="${escapeHtml(user?.email || '')}"
                  disabled
                  style="opacity: 0.65; cursor: not-allowed;"
                />
                <div class="form-hint">Email address cannot be changed.</div>
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
                <div class="form-hint">Enter a direct image link (JPEG, PNG, WebP) to update your avatar.</div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">
                <button type="button" class="btn btn-secondary" id="btn-reset-profile">
                  Discard Changes
                </button>
                <button type="submit" class="btn btn-primary btn-lg" id="btn-save-profile" ${isSaving ? 'disabled' : ''}>
                  ${isSaving ? '<div class="spinner"></div> Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          `}
        </div>
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
      const updated = await api.updateMe({ name, profileImage });
      user = updated;
      previewAvatar = updated.profileImage || null;
      setUser(updated);
      if (onUserUpdate) onUserUpdate(updated);

      successMessage = 'Profile updated successfully!';
      isSaving = false;
      render();

      setTimeout(() => {
        const successAlert = container.querySelector('#profile-success-alert');
        if (successAlert) successAlert.style.display = 'none';
      }, 4000);
    } catch (err) {
      errorMessage = err.message || 'Failed to update profile. Please try again.';
      isSaving = false;
      render();
    }
  }

  // Initial load
  fetchProfile();
  return container;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
