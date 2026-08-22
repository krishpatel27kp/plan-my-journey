/**
 * Main Application Component
 * Manages route/tab state, user session, and modal overlays.
 */
import { isAuthenticated, getUser, clearSession } from './auth.js';
import { api } from './api.js';
import { renderNavbar } from './components/Navbar.js';
import { renderAuthView } from './components/AuthView.js';
import { renderDashboard } from './components/Dashboard.js';
import { renderProfile } from './components/Profile.js';

export function createApp() {
  const root = document.getElementById('app');

  let currentUser = getUser();
  let activeTab = 'dashboard';
  let isAuthModalOpen = !isAuthenticated();
  let authMode = 'login';
  let notification = null;

  // Listen for 401 Unauthorized events from api.js
  window.addEventListener('auth:unauthorized', (event) => {
    currentUser = null;
    isAuthModalOpen = true;
    authMode = 'login';
    notification = {
      type: 'danger',
      message: event.detail?.message || 'Session expired. Please log in.'
    };
    render();
  });

  // Verify and refresh user profile if token exists
  if (isAuthenticated()) {
    api.getMe()
      .then((user) => {
        currentUser = user;
        render();
      })
      .catch((err) => {
        console.warn('Initial session check:', err.message);
      });
  }

  function handleTabChange(tab) {
    if (!isAuthenticated()) {
      isAuthModalOpen = true;
      render();
      return;
    }
    activeTab = tab;
    render();
  }

  function handleLogout() {
    clearSession();
    currentUser = null;
    isAuthModalOpen = true;
    authMode = 'login';
    activeTab = 'dashboard';
    render();
  }

  function handleAuthSuccess(user) {
    currentUser = user;
    isAuthModalOpen = false;
    activeTab = 'dashboard';
    render();
  }

  function render() {
    root.innerHTML = '';

    // Render Navigation
    const nav = renderNavbar({
      user: currentUser,
      activeTab,
      onTabChange: handleTabChange,
      onLogout: handleLogout,
      onOpenAuth: () => {
        isAuthModalOpen = true;
        authMode = 'login';
        render();
      }
    });
    root.appendChild(nav);

    // Global Notification Banner
    if (notification) {
      const alertBox = document.createElement('div');
      alertBox.className = `alert alert-${notification.type} animate-fade-in`;
      alertBox.style.maxWidth = '1140px';
      alertBox.style.margin = '1rem auto 0 auto';
      alertBox.style.width = 'calc(100% - 3rem)';
      alertBox.innerHTML = `
        <span>⚠️</span>
        <span style="flex: 1;">${notification.message}</span>
        <button style="background: none; border: none; color: inherit; cursor: pointer; font-size: 1.2rem;" id="close-notif">&times;</button>
      `;
      alertBox.querySelector('#close-notif')?.addEventListener('click', () => {
        notification = null;
        alertBox.remove();
      });
      root.appendChild(alertBox);
    }

    // Render Main Content View
    const mainContent = document.createElement('main');
    mainContent.style.flex = '1';

    if (isAuthenticated() && currentUser) {
      if (activeTab === 'dashboard') {
        mainContent.appendChild(renderDashboard({
          user: currentUser,
          onNavigate: handleTabChange
        }));
      } else if (activeTab === 'profile') {
        mainContent.appendChild(renderProfile({
          user: currentUser,
          onUserUpdate: (updatedUser) => {
            currentUser = updatedUser;
            render();
          }
        }));
      }
    } else {
      // Unauthenticated Landing placeholder
      const landing = document.createElement('div');
      landing.className = 'main-container';
      landing.style.textAlign = 'center';
      landing.style.padding = '6rem 1.5rem';
      landing.innerHTML = `
        <div class="empty-state" style="max-width: 650px; margin: 0 auto; background: var(--color-surface); border-style: solid;">
          <div class="empty-state-icon">🌍</div>
          <h2 style="font-size: 2rem; margin-bottom: 0.75rem;">Welcome to Plan My Journey</h2>
          <p class="empty-state-desc">
            Collaborative multi-city itinerary planner with smart routing, budget estimation, and frictionless trip sharing.
          </p>
          <div style="display: flex; justify-content: center; gap: 1rem;">
            <button class="btn btn-primary btn-lg" id="landing-btn-login">Sign In</button>
            <button class="btn btn-secondary btn-lg" id="landing-btn-register">Create Free Account</button>
          </div>
        </div>
      `;

      landing.querySelector('#landing-btn-login')?.addEventListener('click', () => {
        isAuthModalOpen = true;
        authMode = 'login';
        render();
      });

      landing.querySelector('#landing-btn-register')?.addEventListener('click', () => {
        isAuthModalOpen = true;
        authMode = 'register';
        render();
      });

      mainContent.appendChild(landing);
    }

    root.appendChild(mainContent);

    // Render Footer
    const footer = document.createElement('footer');
    footer.style.borderTop = '1px solid var(--color-border)';
    footer.style.padding = '1.5rem';
    footer.style.textAlign = 'center';
    footer.style.color = 'var(--color-text-subtle)';
    footer.style.fontSize = '0.85rem';
    footer.innerHTML = `Plan My Journey &copy; 2026 — Built with modern JWT Auth & Collaborative Itinerary Architecture`;
    root.appendChild(footer);

    // Render Auth Modal if triggered
    if (isAuthModalOpen) {
      const authView = renderAuthView({
        initialMode: authMode,
        onSuccess: handleAuthSuccess
      });
      root.appendChild(authView);
    }
  }

  render();
}
