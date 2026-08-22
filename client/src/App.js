/**
 * Main Application Component (Pixel-Matched Navigation and Flows)
 * Manages tab state, bottom dock, user session, modal overlays, and full itinerary workflows.
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
  let activeTab = shareToken ? 'share' : (isAuthenticated() ? 'dashboard' : 'dashboard');
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
    activeTab = shareToken ? 'share' : (isAuthenticated() ? 'dashboard' : 'dashboard');
    render();
  });
  window.addEventListener('hashchange', () => {
    shareToken = checkShareRoute();
    activeTab = shareToken ? 'share' : (isAuthenticated() ? 'dashboard' : 'dashboard');
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
    activeTab = 'dashboard';
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

    // 1. Render Top App Bar (Navbar)
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
      alertBox.style.maxWidth = '680px';
      alertBox.style.margin = '0.5rem auto';
      alertBox.style.padding = '0.75rem 1rem';
      alertBox.style.borderRadius = '12px';
      alertBox.style.background = '#fef2f2';
      alertBox.style.border = '1px solid #fecaca';
      alertBox.style.color = '#ef4444';
      alertBox.style.display = 'flex';
      alertBox.style.alignItems = 'center';
      alertBox.innerHTML = `
        <span style="margin-right: 0.5rem;">⚠️</span>
        <span style="flex: 1; font-size: 0.88rem; font-weight: 600;">${notification.message}</span>
        <button style="background: none; border: none; color: inherit; cursor: pointer; font-size: 1.2rem;" id="close-notif">&times;</button>
      `;
      alertBox.querySelector('#close-notif')?.addEventListener('click', () => {
        notification = null;
        alertBox.remove();
      });
      root.appendChild(alertBox);
    }

    // 2. Render Main Content View
    const mainContent = document.createElement('main');
    mainContent.style.flex = '1';

    if (shareToken) {
      mainContent.appendChild(renderPublicShareView({
        shareToken,
        onBack: () => {
          window.history.pushState({}, '', '/');
          shareToken = null;
          activeTab = 'dashboard';
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
    } else if (activeTab === 'itinerary' || activeTab === 'timeline') {
      mainContent.appendChild(renderItineraryBuilder({
        tripId: activeTripId || 'trip-goa-escape',
        initialTrip: activeTripData,
        onBack: () => {
          activeTab = 'dashboard';
          activeTripId = null;
          activeTripData = null;
          render();
        }
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
        user: currentUser || { name: 'Alex', email: 'alex@example.com' },
        onUserUpdate: (updatedUser) => {
          currentUser = updatedUser;
          render();
        }
      }));
    } else {
      // Default: Dashboard (Screen 1)
      const createOnMount = shouldOpenCreateModal;
      shouldOpenCreateModal = false;
      mainContent.appendChild(renderDashboard({
        user: currentUser || { name: 'Alex', email: 'alex@example.com' },
        onNavigate: handleTabChange,
        onOpenTrip: handleOpenTrip,
        openCreateOnMount: createOnMount
      }));
    }

    root.appendChild(mainContent);

    // 3. Render Bottom Dock Navigation (Matching Mockup)
    const bottomDock = document.createElement('nav');
    bottomDock.className = 'bottom-dock';
    bottomDock.innerHTML = `
      <button class="dock-item ${activeTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
        <span class="dock-icon">⊞</span>
        <span>Dashboard</span>
      </button>

      <button class="dock-item ${activeTab === 'my-trips' ? 'active' : ''}" data-tab="my-trips">
        <span class="dock-icon">✈️</span>
        <span>My Trips</span>
      </button>

      <button class="dock-item ${activeTab === 'explore' ? 'active' : ''}" data-tab="explore">
        <span class="dock-icon">🧭</span>
        <span>Explore</span>
      </button>

      <button class="dock-item ${activeTab === 'itinerary' || activeTab === 'timeline' ? 'active' : ''}" data-tab="timeline">
        <span class="dock-icon">📈</span>
        <span>Timeline</span>
      </button>
    `;

    bottomDock.querySelectorAll('.dock-item').forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.getAttribute('data-tab');
        handleTabChange(tab);
      });
    });

    root.appendChild(bottomDock);

    // 4. Render Auth Modal if open
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
