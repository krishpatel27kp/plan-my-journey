/**
 * Authentication View (Login & Register Modal/Screen - Stitch MCP Reference)
 * Supports email/password credentials, token storage, and easy guest dismissal.
 */
import { api } from '../api.js';
import { setSession } from '../auth.js';

export function renderAuthView({ initialMode = 'login', onSuccess, onDismiss }) {
  const container = document.createElement('div');
  container.className = 'modal-backdrop animate-fade-in';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.right = '0';
  container.style.bottom = '0';
  container.style.backgroundColor = 'rgba(5, 8, 18, 0.85)';
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
      <div class="card animate-fade-in" style="width: 100%; max-width: 440px; background: var(--color-surface); border: 1px solid var(--color-border); box-shadow: 0 25px 60px rgba(0,0,0,0.8); position: relative;">
        <!-- Close / Dismiss Button -->
        <button style="position: absolute; top: 1.25rem; right: 1.25rem; background: none; border: none; color: var(--color-text-muted); font-size: 1.2rem; cursor: pointer;" id="btn-close-auth">✕</button>

        <div style="text-align: center; margin-bottom: 1.75rem;">
          <div class="brand-icon" style="margin: 0 auto 1rem auto; width: 48px; height: 48px; font-size: 1.5rem;">✈️</div>
          <h2 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; color: #fff; margin-bottom: 0.35rem;">
            ${currentMode === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p style="color: var(--color-text-muted); font-size: 0.92rem;">
            ${currentMode === 'login' ? 'Enter your credentials to access your trips' : 'Start planning multi-city adventures in minutes'}
          </p>
        </div>

        <div style="display: flex; background: rgba(11, 15, 25, 0.7); padding: 4px; border-radius: var(--radius-md); margin-bottom: 1.5rem; border: 1px solid var(--color-border);">
          <button class="btn btn-sm ${currentMode === 'login' ? 'btn-primary' : 'btn-secondary'}" id="tab-login" style="flex: 1; border: none; border-radius: var(--radius-sm);">
            Sign In
          </button>
          <button class="btn btn-sm ${currentMode === 'register' ? 'btn-primary' : 'btn-secondary'}" id="tab-register" style="flex: 1; border: none; border-radius: var(--radius-sm);">
            Register
          </button>
        </div>

        ${errorMessage ? `
          <div style="background: var(--color-danger-bg); border: 1px solid rgba(239,68,68,0.3); color: #f87171; padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.88rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
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
              <span style="font-size: 0.75rem; color: var(--color-text-subtle); margin-top: 0.2rem;">Must be at least 6 characters</span>
            ` : ''}
          </div>

          <button type="submit" class="btn btn-primary btn-lg" id="btn-auth-submit" style="width: 100%; margin-top: 1.25rem; justify-content: center;" ${isLoading ? 'disabled' : ''}>
            ${isLoading ? '<div class="spinner" style="width: 18px; height: 18px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%;"></div> Signing In...' : (currentMode === 'login' ? 'Sign In' : 'Create Free Account')}
          </button>
        </form>
      </div>
    `;

    // Bind Close
    container.querySelector('#btn-close-auth')?.addEventListener('click', () => {
      container.remove();
      if (onDismiss) onDismiss();
    });
    container.addEventListener('click', (e) => {
      if (e.target === container) {
        container.remove();
        if (onDismiss) onDismiss();
      }
    });

    // Bind Tabs
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

    // Bind Form Submit
    container.querySelector('#auth-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = container.querySelector('#auth-email')?.value.trim();
      const password = container.querySelector('#auth-password')?.value;
      const name = container.querySelector('#auth-name')?.value?.trim();

      if (currentMode === 'register') {
        if (!name) {
          errorMessage = 'Please enter your full name.';
          render();
          return;
        }
        if (password.length < 6) {
          errorMessage = 'Password must be at least 6 characters long.';
          render();
          return;
        }
      }

      isLoading = true;
      errorMessage = '';
      render();

      try {
        let res;
        if (currentMode === 'login') {
          res = await api.login({ email, password });
        } else {
          res = await api.register({ name, email, password });
        }

        setSession(res.token, {
          id: res.id,
          name: res.name,
          email: res.email
        });

        container.remove();
        if (onSuccess) {
          onSuccess({
            id: res.id,
            name: res.name,
            email: res.email,
            token: res.token
          });
        }
      } catch (err) {
        errorMessage = err.message || 'Authentication failed. Please check credentials.';
        isLoading = false;
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
