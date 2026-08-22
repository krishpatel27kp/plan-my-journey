/**
 * Authentication View (Login & Register Modal/Screen)
 */
import { api } from '../api.js';
import { setSession } from '../auth.js';

export function renderAuthView({ initialMode = 'login', onSuccess }) {
  const container = document.createElement('div');
  container.className = 'modal-overlay animate-fade-in';

  let currentMode = initialMode;
  let isLoading = false;
  let errorMessage = '';

  function render() {
    container.innerHTML = `
      <div class="modal-card animate-fade-in">
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">✈️</div>
          <h2 style="font-size: 1.75rem; margin-bottom: 0.25rem;">
            ${currentMode === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p style="color: var(--color-text-muted); font-size: 0.9rem;">
            ${currentMode === 'login' ? 'Enter your credentials to access your trips' : 'Start planning multi-city adventures in minutes'}
          </p>
        </div>

        <div style="display: flex; background: var(--color-bg); padding: 4px; border-radius: var(--radius-md); margin-bottom: 1.5rem; border: 1px solid var(--color-border);">
          <button class="btn btn-block btn-sm ${currentMode === 'login' ? 'btn-primary' : 'btn-secondary'}" id="tab-login" style="border: none;">
            Log In
          </button>
          <button class="btn btn-block btn-sm ${currentMode === 'register' ? 'btn-primary' : 'btn-secondary'}" id="tab-register" style="border: none;">
            Sign Up
          </button>
        </div>

        ${errorMessage ? `
          <div class="alert alert-danger">
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
            <input type="email" id="auth-email" class="form-input" placeholder="alex@example.com" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="auth-password">Password</label>
            <input type="password" id="auth-password" class="form-input" placeholder="••••••••" required />
            ${currentMode === 'register' ? `
              <div class="form-hint">Must be at least 6 characters long</div>
            ` : ''}
          </div>

          <button type="submit" class="btn btn-primary btn-block btn-lg" id="btn-auth-submit" style="margin-top: 1.5rem;" ${isLoading ? 'disabled' : ''}>
            ${isLoading ? '<div class="spinner"></div> Processing...' : (currentMode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>
      </div>
    `;

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
      const name = container.querySelector('#auth-name')?.value.trim();

      // Client-side validation
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

        // Store JWT token and user info
        setSession(res.token, {
          id: res.id,
          name: res.name,
          email: res.email
        });

        if (onSuccess) {
          onSuccess({
            id: res.id,
            name: res.name,
            email: res.email,
            token: res.token
          });
        }
      } catch (err) {
        errorMessage = err.message || 'Authentication failed. Please try again.';
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
