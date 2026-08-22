/**
 * Main Application Component
 * Manages route/tab state, user session, modal overlays, and full itinerary workflows.
 */
import { isAuthenticated, getUser, clearSession } from './auth.js';
import { api } from './api.js';
import { renderNavbar } from './components/Navbar.js';
import { renderAuthView } from './components/AuthView.js';
import { renderDashboard } from './components/Dashboard.js';
import { renderMyTrips } from './components/MyTrips.js';
import { renderItineraryBuilder } from './components/ItineraryBuilder.js';
import { renderProfile } from './components/Profile.js';
import { renderPublicShareView } from './components/PublicShareView.js';
import { renderCitySearch } from './components/CitySearch.js';

export function createApp() {
  const root = document.getElementById('app');

  let currentUser = getUser();
  let shareToken = checkShareRoute();
  let activeTab = shareToken ? 'share' : (isAuthenticated() ? 'dashboard' : 'explore');
  let activeTripId = null;
  let activeTripData = null;
  let isAuthModalOpen = false;
  let authMode = 'login';
  let notification = null;
  let pendingPostAuth = null;
  let shouldOpenCreateModal = false;

  function checkShareRoute() {
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;

    const sharePathMatch = path.match(/^\/share\/([a-zA-Z0-9_-]+)/);
    if (sharePathMatch) return sharePathMatch[1];
    if (searchParams.get('share')) return searchParams.get('share');
    const hashMatch = hash.match(/^#\/?share\/([a-zA-Z0-9_-]+)/);
    if (hashMatch) return hashMatch[1];
    return null;
  }

  // Handle browser back/forward and hash changes live
  window.addEventListener('popstate', () => {
    shareToken = checkShareRoute();
    activeTab = shareToken ? 'share' : (isAuthenticated() ? 'dashboard' : 'explore');
    render();
  });
  window.addEventListener('hashchange', () => {
    shareToken = checkShareRoute();
    activeTab = shareToken ? 'share' : (isAuthenticated() ? 'dashboard' : 'explore');
    render();
  });

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
    if (tab === 'create-trip-modal') {
      if (!isAuthenticated()) {
        isAuthModalOpen = true;
        authMode = 'login';
        render();
        return;
      }
      activeTab = 'dashboard';
      shouldOpenCreateModal = true;
      render();
      return;
    }

    if (tab !== 'explore' && !isAuthenticated()) {
      isAuthModalOpen = true;
      render();
      return;
    }

    shareToken = null;
    activeTab = tab;
    shouldOpenCreateModal = false;
    render();
  }

  function handleOpenTrip(tripId, tripData) {
    activeTripId = tripId;
    activeTripData = tripData;
    activeTab = 'itinerary';
    shareToken = null;
    render();
  }

  function handleLogout() {
    clearSession();
    currentUser = null;
    isAuthModalOpen = false;
    authMode = 'login';
    activeTab = 'explore';
    activeTripId = null;
    activeTripData = null;
    render();
  }

  function handleAuthSuccess(user) {
    currentUser = user;
    isAuthModalOpen = false;
    if (pendingPostAuth) {
      const cb = pendingPostAuth;
      pendingPostAuth = null;
      render();
      cb();
    } else {
      activeTab = 'dashboard';
      render();
    }
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
        pendingPostAuth = null;
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

    if (shareToken) {
      mainContent.appendChild(renderPublicShareView({
        shareToken,
        onBack: () => {
          window.history.pushState({}, '', '/');
          shareToken = null;
          activeTab = 'explore';
          render();
        },
        onOpenAuth: (postAuthCallback) => {
          pendingPostAuth = postAuthCallback;
          isAuthModalOpen = true;
          authMode = 'login';
          render();
        },
        onCopySuccess: (newTripId) => {
          shareToken = null;
          activeTripId = newTripId;
          activeTab = 'itinerary';
          window.history.pushState({}, '', '/');
          render();
        }
      }));
    } else if (activeTab === 'explore') {
      mainContent.appendChild(renderCitySearch());
    } else if (activeTab === 'itinerary') {
      mainContent.appendChild(renderItineraryBuilder({
        tripId: activeTripId,
        initialTrip: activeTripData,
        onBack: () => {
          activeTab = 'dashboard';
          activeTripId = null;
          activeTripData = null;
          render();
        }
      }));
    } else if (isAuthenticated() && currentUser) {
      if (activeTab === 'dashboard') {
        const createOnMount = shouldOpenCreateModal;
        shouldOpenCreateModal = false;
        mainContent.appendChild(renderDashboard({
          user: currentUser,
          onNavigate: handleTabChange,
          onOpenTrip: handleOpenTrip,
          openCreateOnMount: createOnMount
        }));
      } else if (activeTab === 'my-trips') {
        mainContent.appendChild(renderMyTrips({
          onOpenTrip: handleOpenTrip,
          onPlanNewTrip: () => {
            activeTab = 'dashboard';
            shouldOpenCreateModal = true;
            render();
          }
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
        <div class="card animate-fade-in" style="max-width: 600px; margin: 0 auto; padding: 3rem 2rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">✈️</div>
          <h2 style="font-family: var(--font-heading); font-size: 2rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem;">
            Plan the journey. Enjoy the destination.
          </h2>
          <p style="color: var(--color-text-muted); margin-bottom: 2rem; font-size: 1.05rem;">
            Create multi-city itineraries, manage your travel budget, and share your adventures with friends.
          </p>
          <div style="display: flex; justify-content: center; gap: 1rem;">
            <button class="btn btn-primary btn-lg" id="btn-landing-login">Sign In / Register</button>
            <button class="btn btn-secondary btn-lg" id="btn-landing-explore">Explore Cities</button>
          </div>
        </div>
      `;
      landing.querySelector('#btn-landing-login')?.addEventListener('click', () => {
        isAuthModalOpen = true;
        authMode = 'login';
        render();
      });
      landing.querySelector('#btn-landing-explore')?.addEventListener('click', () => {
        activeTab = 'explore';
        render();
      });
      mainContent.appendChild(landing);
    }

    root.appendChild(mainContent);

    // Render Auth Modal if open
    if (isAuthModalOpen) {
      const authModal = renderAuthView({
        initialMode: authMode,
        onSuccess: handleAuthSuccess,
        onClose: () => {
          isAuthModalOpen = false;
          pendingPostAuth = null;
          render();
        }
      });
      root.appendChild(authModal);
    }
  }

  render();
}
