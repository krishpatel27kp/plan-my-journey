/**
 * Authentication View (Login & Register Modal - Light Editorial Design)
 * Supports email/password credentials, token storage, and easy guest dismissal.
 */
import { api } from '../api.js';
import { setSession } from '../auth.js';

export function renderAuthView({ initialMode = 'login', onSuccess, onClose, onDismiss }) {
  const container = document.createElement('div');
  container.className = 'modal-backdrop animate-fade-in';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.right = '0';
  container.style.bottom = '0';
  container.style.backgroundColor = 'rgba(15, 23, 42, 0.65)';
  container.style.backdropFilter = 'blur(12px)';
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.zIndex = '1000';
  container.style.padding = '1rem';

  let currentMode = initialMode;
  let isLoading = false;
  let errorMessage = '';

  function render() {
    container.innerHTML = `
      <div class="card animate-fade-in" style="width: 100%; max-width: 440px; background: #ffffff; border: 1px solid var(--color-border); box-shadow: 0 25px 60px rgba(15,23,42,0.25); position: relative;">
        <!-- Close / Dismiss Button -->
        <button style="position: absolute; top: 1.25rem; right: 1.25rem; background: none; border: none; color: #64748b; font-size: 1.3rem; cursor: pointer; font-weight: 700;" id="btn-close-auth">✕</button>

        <div style="text-align: center; margin-bottom: 1.75rem;">
          <div class="brand-icon" style="margin: 0 auto 1rem auto; width: 48px; height: 48px; font-size: 1.5rem;">✈️</div>
          <h2 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 900; color: #0f172a; margin-bottom: 0.35rem;">
            ${currentMode === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p style="color: #64748b; font-size: 0.92rem;">
            ${currentMode === 'login' ? 'Enter your credentials to access your trips' : 'Start planning multi-city adventures in minutes'}
          </p>
        </div>

        <div style="display: flex; background: #f1f5f9; padding: 4px; border-radius: var(--radius-md); margin-bottom: 1.5rem; border: 1px solid var(--color-border);">
          <button class="btn btn-sm ${currentMode === 'login' ? 'btn-primary' : 'btn-secondary'}" id="tab-login" style="flex: 1; border: none; border-radius: var(--radius-sm); font-weight: 700;">
            Sign In
          </button>
          <button class="btn btn-sm ${currentMode === 'register' ? 'btn-primary' : 'btn-secondary'}" id="tab-register" style="flex: 1; border: none; border-radius: var(--radius-sm); font-weight: 700;">
            Register
          </button>
        </div>

        ${errorMessage ? `
          <div style="background: #fef2f2; border: 1px solid #fecaca; color: #ef4444; padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.88rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem; font-weight: 600;">
            <span>⚠️</span>
            <span>${escapeHtml(errorMessage)}</span>
          </div>
        ` : ''}

        <form id="auth-form">
          ${currentMode === 'register' ? `
            <div class="form-group">
              <label class="form-label" for="auth-name">Full Name</label>
              <input type="text" id="auth-name" class="form-input" placeholder="e.g. Alex Mercer" required />
            </div>
          ` : ''}

          <div class="form-group">
            <label class="form-label" for="auth-email">Email Address</label>
            <input type="email" id="auth-email" class="form-input" placeholder="you@example.com" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="auth-password">Password</label>
            <input type="password" id="auth-password" class="form-input" placeholder="••••••••" required />
            ${currentMode === 'register' ? `
              <span style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.2rem; display: block;">Must be at least 6 characters</span>
            ` : ''}
          </div>

          <button type="submit" class="btn btn-primary btn-lg" id="btn-auth-submit" style="width: 100%; margin-top: 1.25rem; justify-content: center; font-weight: 700;" ${isLoading ? 'disabled' : ''}>
            ${isLoading ? '<div class="spinner" style="width: 18px; height: 18px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%;"></div> Submitting...' : (currentMode === 'login' ? 'Sign In' : 'Create Free Account')}
          </button>
        </form>
      </div>
    `;

    // Bind Close
    const closeHandler = () => {
      container.remove();
      if (onClose) onClose();
      if (onDismiss) onDismiss();
    };

    container.querySelector('#btn-close-auth')?.addEventListener('click', closeHandler);
    container.addEventListener('click', (e) => {
      if (e.target === container) closeHandler();
    });

    // Tab switcher
    container.querySelector('#tab-login')?.addEventListener('click', () => {
      currentMode = 'login';
      errorMessage = '';
      render();
    });
    container.querySelector('#tab-register')?.addEventListener('click', () => {
      currentMode = 'register';
      errorMessage = '';
      render();
    });

    // Form submit
    const form = container.querySelector('#auth-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorMessage = '';
      isLoading = true;
      render();

      const email = container.querySelector('#auth-email')?.value?.trim();
      const password = container.querySelector('#auth-password')?.value;
      const name = container.querySelector('#auth-name')?.value?.trim();

      try {
        let authData;
        if (currentMode === 'register') {
          authData = await api.register({ name, email, password });
        } else {
          authData = await api.login({ email, password });
        }

        const user = {
          id: authData.id || authData.userId,
          name: authData.name || (authData.user && authData.user.name) || email.split('@')[0],
          email: authData.email || (authData.user && authData.user.email) || email,
          profileImage: authData.profileImage || (authData.user && authData.user.profileImage) || null
        };

        setSession(authData.token, user);
        container.remove();
        if (onSuccess) onSuccess(user);
      } catch (err) {
        isLoading = false;
        errorMessage = err.message || 'Authentication failed. Please check credentials.';
        render();
      }
    });
  }

  render();
  return container;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
