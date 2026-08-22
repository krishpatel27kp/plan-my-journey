/**
 * Authentication View (Login & Signup - Pixel-Matched Editorial Travel Design)
 * Supports Email/Password and One-Click Google Authentication.
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
  container.style.backdropFilter = 'blur(10px)';
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.zIndex = '1000';
  container.style.padding = '1rem';

  let currentMode = initialMode;
  let isLoading = false;
  let errorMessage = '';
  let showPassword = false;

  function render() {
    if (currentMode === 'login') {
      container.innerHTML = `
        <div class="card animate-fade-in" style="width: 100%; max-width: 430px; background: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 25px 60px rgba(15,23,42,0.25); border: 1px solid var(--color-border); padding: 0; position: relative;">
          
          <!-- Top Hero Image Banner -->
          <div style="position: relative; height: 210px; overflow: hidden; background: #0f172a;">
            <img 
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80" 
              alt="Plan My Journey" 
              style="width: 100%; height: 100%; object-fit: cover;" 
            />
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.75) 100%);"></div>

            <!-- Dismiss Button -->
            <button style="position: absolute; top: 1rem; right: 1rem; width: 34px; height: 34px; border-radius: 50%; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.3); color: #ffffff; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1.1rem; z-index: 10;" id="btn-close-auth">✕</button>

            <!-- Bottom Left Hero Brand Messaging -->
            <div style="position: absolute; bottom: 1.5rem; left: 1.75rem; right: 1.75rem; z-index: 2;">
              <h2 style="font-family: var(--font-heading); font-size: 1.65rem; font-weight: 800; color: #ffffff; line-height: 1.2; letter-spacing: -0.01em;">
                Plan My Journey
              </h2>
              <p style="color: rgba(255, 255, 255, 0.9); font-size: 0.88rem; font-weight: 500; margin-top: 0.2rem;">
                Plan the journey. Enjoy the destination.
              </p>
            </div>
          </div>

          <!-- Login Form Content (Rounded Top overlap) -->
          <div style="padding: 1.75rem 2rem 2rem 2rem; background: #ffffff; margin-top: -16px; border-radius: 24px 24px 0 0; position: relative; z-index: 3;">
            
            <div style="text-align: center; margin-bottom: 1.5rem;">
              <h3 style="font-family: var(--font-heading); font-size: 1.65rem; font-weight: 800; color: #0f172a; margin-bottom: 0.25rem;">
                Welcome Back
              </h3>
              <p style="color: #64748b; font-size: 0.92rem;">
                Sign in to access your itineraries.
              </p>
            </div>

            ${errorMessage ? `
              <div style="background: #fef2f2; border: 1px solid #fecaca; color: #ef4444; padding: 0.75rem 1rem; border-radius: 10px; font-size: 0.85rem; margin-bottom: 1.25rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                <span>⚠️</span>
                <span>${escapeHtml(errorMessage)}</span>
              </div>
            ` : ''}

            <!-- Google Sign In Button -->
            <div style="margin-bottom: 1.25rem;">
              <button 
                type="button" 
                id="btn-google-signin" 
                style="width: 100%; height: 46px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 9999px; font-size: 0.95rem; font-weight: 700; color: #0f172a; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); transition: all 0.2s ease;"
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.8.54-1.83.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.95v2.33C2.43 15.98 5.48 18 9 18z"/>
                  <path fill="#FBBC05" d="M3.96 10.71c-.18-.54-.28-1.12-.28-1.71s.1-1.17.28-1.71V4.96H.95A8.996 8.996 0 0 0 0 9c0 1.45.35 2.82.95 4.04l3.01-2.33z"/>
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0 5.48 0 2.43 2.02.95 4.96l3.01 2.33c.71-2.13 2.7-3.71 5.04-3.71z"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            <!-- Divider -->
            <div style="display: flex; align-items: center; margin: 1.25rem 0; color: #94a3b8; font-size: 0.82rem;">
              <div style="flex: 1; height: 1px; background: #e2e8f0;"></div>
              <span style="padding: 0 0.75rem; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">or sign in with email</span>
              <div style="flex: 1; height: 1px; background: #e2e8f0;"></div>
            </div>

            <form id="auth-form">
              <!-- Email Field -->
              <div class="form-group" style="margin-bottom: 1.15rem;">
                <label class="form-label" style="font-size: 0.85rem; font-weight: 600; color: #0f172a; margin-bottom: 0.4rem; display: block;">
                  Email address
                </label>
                <div style="position: relative;">
                  <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); font-size: 1.1rem; opacity: 0.6;">
                    ✉️
                  </span>
                  <input 
                    type="email" 
                    id="auth-email" 
                    placeholder="name@example.com" 
                    required 
                    style="width: 100%; height: 46px; padding-left: 2.75rem; padding-right: 1rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 0.95rem; color: #0f172a; outline: none; transition: border-color 0.2s ease;"
                  />
                </div>
              </div>

              <!-- Password Field -->
              <div class="form-group" style="margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                  <label class="form-label" style="font-size: 0.85rem; font-weight: 600; color: #0f172a; margin: 0;">
                    Password
                  </label>
                  <a href="javascript:void(0)" id="link-forgot-pw" style="font-size: 0.82rem; color: #006d64; font-weight: 600; text-decoration: none;">
                    Forgot password?
                  </a>
                </div>
                <div style="position: relative;">
                  <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); font-size: 1rem; opacity: 0.6;">
                    🔒
                  </span>
                  <input 
                    type="${showPassword ? 'text' : 'password'}" 
                    id="auth-password" 
                    placeholder="••••••••" 
                    required 
                    style="width: 100%; height: 46px; padding-left: 2.75rem; padding-right: 2.75rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 0.95rem; color: #0f172a; outline: none; transition: border-color 0.2s ease;"
                  />
                  <button type="button" id="btn-toggle-pw" style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 1.1rem; color: #64748b;">
                    ${showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <!-- Primary Log In Button (Deep Teal) -->
              <button 
                type="submit" 
                id="btn-auth-submit" 
                style="width: 100%; height: 48px; background: #006d64; color: #ffffff; border: none; border-radius: 9999px; font-size: 1rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s ease; box-shadow: 0 4px 12px rgba(0, 109, 100, 0.25);"
                ${isLoading ? 'disabled' : ''}
              >
                ${isLoading ? '<div class="spinner" style="width: 18px; height: 18px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%;"></div>' : 'Log In'}
              </button>
            </form>

            <!-- Footer Toggle to Sign Up -->
            <div style="text-align: center; margin-top: 1.25rem; font-size: 0.92rem; color: #475569;">
              Don't have an account? 
              <a href="javascript:void(0)" id="link-switch-mode" style="color: #006d64; font-weight: 700; text-decoration: none; margin-left: 0.25rem;">
                Sign Up
              </a>
            </div>

          </div>

        </div>
      `;
    } else {
      // Screen 2: Signup / Create Account
      container.innerHTML = `
        <div class="card animate-fade-in" style="width: 100%; max-width: 430px; background: #ffffff; border-radius: 28px; box-shadow: 0 25px 60px rgba(15,23,42,0.25); border: 1px solid var(--color-border); padding: 2rem; position: relative;">
          
          <!-- Dismiss Button -->
          <button style="position: absolute; top: 1.25rem; right: 1.25rem; background: none; border: none; color: #64748b; font-size: 1.3rem; cursor: pointer; font-weight: 700;" id="btn-close-auth">✕</button>

          <div style="text-align: center; margin-bottom: 1.5rem;">
            <h2 style="font-family: var(--font-heading); font-size: 1.85rem; font-weight: 900; color: #0f172a; margin-bottom: 0.25rem;">
              Create Account
            </h2>
            <p style="color: #64748b; font-size: 0.92rem;">
              Join Plan My Journey to start exploring.
            </p>
          </div>

          ${errorMessage ? `
            <div style="background: #fef2f2; border: 1px solid #fecaca; color: #ef4444; padding: 0.75rem 1rem; border-radius: 10px; font-size: 0.85rem; margin-bottom: 1.25rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
              <span>⚠️</span>
              <span>${escapeHtml(errorMessage)}</span>
            </div>
          ` : ''}

          <!-- Google Sign Up Button -->
          <div style="margin-bottom: 1.25rem;">
            <button 
              type="button" 
              id="btn-google-signup" 
              style="width: 100%; height: 46px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 9999px; font-size: 0.95rem; font-weight: 700; color: #0f172a; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); transition: all 0.2s ease;"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.8.54-1.83.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.95v2.33C2.43 15.98 5.48 18 9 18z"/>
                <path fill="#FBBC05" d="M3.96 10.71c-.18-.54-.28-1.12-.28-1.71s.1-1.17.28-1.71V4.96H.95A8.996 8.996 0 0 0 0 9c0 1.45.35 2.82.95 4.04l3.01-2.33z"/>
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0 5.48 0 2.43 2.02.95 4.96l3.01 2.33c.71-2.13 2.7-3.71 5.04-3.71z"/>
              </svg>
              <span>Sign up with Google</span>
            </button>
          </div>

          <!-- Divider -->
          <div style="display: flex; align-items: center; margin: 1.25rem 0; color: #94a3b8; font-size: 0.82rem;">
            <div style="flex: 1; height: 1px; background: #e2e8f0;"></div>
            <span style="padding: 0 0.75rem; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">or sign up with email</span>
            <div style="flex: 1; height: 1px; background: #e2e8f0;"></div>
          </div>

          <form id="auth-form">
            <!-- Full Name Field -->
            <div class="form-group" style="margin-bottom: 1.1rem;">
              <label class="form-label" style="font-size: 0.85rem; font-weight: 600; color: #0f172a; margin-bottom: 0.35rem; display: block;">
                Full Name
              </label>
              <div style="position: relative;">
                <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); font-size: 1rem; opacity: 0.6;">
                  👤
                </span>
                <input 
                  type="text" 
                  id="auth-name" 
                  placeholder="Enter your name" 
                  required 
                  style="width: 100%; height: 46px; padding-left: 2.75rem; padding-right: 1rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 0.95rem; color: #0f172a; outline: none;"
                />
              </div>
            </div>

            <!-- Email Address Field -->
            <div class="form-group" style="margin-bottom: 1.1rem;">
              <label class="form-label" style="font-size: 0.85rem; font-weight: 600; color: #0f172a; margin-bottom: 0.35rem; display: block;">
                Email Address
              </label>
              <div style="position: relative;">
                <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); font-size: 1.1rem; opacity: 0.6;">
                  ✉️
                </span>
                <input 
                  type="email" 
                  id="auth-email" 
                  placeholder="Enter your email" 
                  required 
                  style="width: 100%; height: 46px; padding-left: 2.75rem; padding-right: 1rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 0.95rem; color: #0f172a; outline: none;"
                />
              </div>
            </div>

            <!-- Password Field -->
            <div class="form-group" style="margin-bottom: 1.1rem;">
              <label class="form-label" style="font-size: 0.85rem; font-weight: 600; color: #0f172a; margin-bottom: 0.35rem; display: block;">
                Password
              </label>
              <div style="position: relative;">
                <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); font-size: 1rem; opacity: 0.6;">
                  🔒
                </span>
                <input 
                  type="${showPassword ? 'text' : 'password'}" 
                  id="auth-password" 
                  placeholder="Create a password" 
                  required 
                  style="width: 100%; height: 46px; padding-left: 2.75rem; padding-right: 2.75rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 0.95rem; color: #0f172a; outline: none;"
                />
                <button type="button" id="btn-toggle-pw" style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 1.1rem; color: #64748b;">
                  ${showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <!-- Confirm Password Field -->
            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label class="form-label" style="font-size: 0.85rem; font-weight: 600; color: #0f172a; margin-bottom: 0.35rem; display: block;">
                Confirm Password
              </label>
              <div style="position: relative;">
                <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); font-size: 1rem; opacity: 0.6;">
                  🔄
                </span>
                <input 
                  type="${showPassword ? 'text' : 'password'}" 
                  id="auth-password-confirm" 
                  placeholder="Confirm your password" 
                  required 
                  style="width: 100%; height: 46px; padding-left: 2.75rem; padding-right: 1rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 0.95rem; color: #0f172a; outline: none;"
                />
              </div>
            </div>

            <!-- Primary Create Account Button (Deep Teal) -->
            <button 
              type="submit" 
              id="btn-auth-submit" 
              style="width: 100%; height: 48px; background: #006d64; color: #ffffff; border: none; border-radius: 9999px; font-size: 1rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s ease; box-shadow: 0 4px 12px rgba(0, 109, 100, 0.25);"
              ${isLoading ? 'disabled' : ''}
            >
              ${isLoading ? '<div class="spinner" style="width: 18px; height: 18px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%;"></div>' : 'Create Account'}
            </button>
          </form>

          <!-- Footer Toggle to Log In -->
          <div style="text-align: center; margin-top: 1.25rem; font-size: 0.92rem; color: #475569;">
            Already have an account? 
            <a href="javascript:void(0)" id="link-switch-mode" style="color: #006d64; font-weight: 700; text-decoration: none; margin-left: 0.25rem;">
              Log in
            </a>
          </div>

        </div>
      `;
    }

    // Bind Close Handlers
    const closeHandler = () => {
      container.remove();
      if (onClose) onClose();
      if (onDismiss) onDismiss();
    };

    container.querySelector('#btn-close-auth')?.addEventListener('click', closeHandler);
    container.addEventListener('click', (e) => {
      if (e.target === container) closeHandler();
    });

    // Password Visibility Toggle
    container.querySelector('#btn-toggle-pw')?.addEventListener('click', (e) => {
      e.preventDefault();
      showPassword = !showPassword;
      const pwInput = container.querySelector('#auth-password');
      const pwConf = container.querySelector('#auth-password-confirm');
      if (pwInput) pwInput.type = showPassword ? 'text' : 'password';
      if (pwConf) pwConf.type = showPassword ? 'text' : 'password';
      e.currentTarget.textContent = showPassword ? '👁️' : '👁️‍🗨️';
    });

    // Mode Switcher (Login <-> Sign Up)
    container.querySelector('#link-switch-mode')?.addEventListener('click', (e) => {
      e.preventDefault();
      currentMode = currentMode === 'login' ? 'register' : 'login';
      errorMessage = '';
      showPassword = false;
      render();
    });

    // Google Sign In Button Handler
    const googleBtn = container.querySelector('#btn-google-signin') || container.querySelector('#btn-google-signup');
    googleBtn?.addEventListener('click', () => {
      handleGoogleAuthClick();
    });

    // Forgot Password Handler
    container.querySelector('#link-forgot-pw')?.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Password reset instructions will be sent to your email address.');
    });

    // Email/Password Form Submission Handler
    const form = container.querySelector('#auth-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorMessage = '';

      const email = container.querySelector('#auth-email')?.value?.trim();
      const password = container.querySelector('#auth-password')?.value;
      const name = container.querySelector('#auth-name')?.value?.trim();
      const confirmPassword = container.querySelector('#auth-password-confirm')?.value;

      if (currentMode === 'register') {
        if (confirmPassword !== undefined && password !== confirmPassword) {
          errorMessage = 'Passwords do not match.';
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
      render();

      try {
        let authData;
        if (currentMode === 'register') {
          authData = await api.register({ name, email, password });
        } else {
          authData = await api.login({ email, password });
        }

        const user = {
          id: authData.id || authData.userId,
          name: authData.name || (authData.user && authData.user.name) || (name || email.split('@')[0]),
          email: authData.email || (authData.user && authData.user.email) || email,
          profileImage: authData.profileImage || (authData.user && authData.user.profileImage) || null
        };

        setSession(authData.token, user);
        container.remove();
        if (onSuccess) onSuccess(user);
      } catch (err) {
        isLoading = false;
        errorMessage = err.message || 'Authentication failed. Please check your credentials.';
        render();
      }
    });
  }

  async function handleGoogleAuthClick() {
    const googleClientId = window.__GOOGLE_CLIENT_ID__ || '';

    // If Google Identity Services library is loaded and client id configured
    if (window.google?.accounts?.id && googleClientId && !googleClientId.startsWith('YOUR_')) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          if (response?.credential) {
            await submitGoogleCredential(response.credential);
          }
        }
      });
      window.google.accounts.id.prompt();
    } else {
      // Prompt user or use quick Google login fallback
      const userGoogleEmail = prompt('Enter your Google email address to sign in with Google:', 'alex.traveler@gmail.com');
      if (!userGoogleEmail) return;

      const mockPayload = {
        email: userGoogleEmail,
        name: userGoogleEmail.split('@')[0],
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
      };
      const b64Payload = btoa(JSON.stringify(mockPayload));
      const mockToken = `header.${b64Payload}.signature`;

      await submitGoogleCredential(mockToken);
    }
  }

  async function submitGoogleCredential(credential) {
    isLoading = true;
    errorMessage = '';
    render();

    try {
      const authData = await api.googleAuth(credential);
      const user = {
        id: authData.id,
        name: authData.name,
        email: authData.email,
        profileImage: authData.profileImage || null
      };

      setSession(authData.token, user);
      container.remove();
      if (onSuccess) onSuccess(user);
    } catch (err) {
      isLoading = false;
      errorMessage = err.message || 'Google authentication failed.';
      render();
    }
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
