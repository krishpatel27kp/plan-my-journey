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
    if (currentUser) {
      currentUser = null;
      isAuthModalOpen = true;
      authMode = 'login';
      notification = {
        type: 'danger',
        message: event.detail?.message || 'Session expired. Please log in.'
      };
      render();
    }
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
    render();
  }

  function render() {
    root.innerHTML = '';

    // Handle Public Share view
    if (shareToken || activeTab === 'share') {
      root.appendChild(renderPublicShareView({
        shareToken: shareToken || 'demo',
        onCopySuccess: (newTripId) => {
          activeTripId = newTripId;
          shareToken = null;
          activeTab = 'itinerary';
          notification = { type: 'success', message: 'Trip successfully copied to your itineraries!' };
          render();
        },
        onRequestAuth: () => {
          isAuthModalOpen = true;
          authMode = 'login';
          render();
        }
      }));
      return;
    }

    // 1. Render Top Header
    const navbar = renderNavbar({
      user: currentUser,
      activeTab,
      onNavigate: handleTabChange,
      onOpenLogin: () => {
        isAuthModalOpen = true;
        authMode = 'login';
        render();
      },
      onOpenSignup: () => {
        isAuthModalOpen = true;
        authMode = 'register';
        render();
      },
      onLogout: () => {
        clearSession();
        currentUser = null;
        activeTab = 'dashboard';
        notification = { type: 'info', message: 'You have been logged out.' };
        render();
      }
    });
    root.appendChild(navbar);

    // Global Notification Banner
    if (notification) {
      const banner = document.createElement('div');
      const bgMap = {
        success: 'rgba(0, 109, 100, 0.95)',
        danger: '#ef4444',
        info: '#0f172a'
      };
      banner.style.position = 'fixed';
      banner.style.top = '1rem';
      banner.style.left = '50%';
      banner.style.transform = 'translateX(-50%)';
      banner.style.zIndex = '2000';
      banner.style.background = bgMap[notification.type] || '#006d64';
      banner.style.color = '#ffffff';
      banner.style.padding = '0.75rem 1.5rem';
      banner.style.borderRadius = '9999px';
      banner.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
      banner.style.fontWeight = '600';
      banner.style.fontSize = '0.9rem';
      banner.className = 'animate-fade-in';
      banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span>${notification.message}</span>
          <button style="background: none; border: none; color: #ffffff; cursor: pointer; font-size: 1.1rem; margin-left: 0.5rem;" id="btn-close-banner">✕</button>
        </div>
      `;
      banner.querySelector('#btn-close-banner')?.addEventListener('click', () => banner.remove());
      setTimeout(() => { banner.remove(); }, 4000);
      root.appendChild(banner);
      notification = null;
    }

    // 2. Render Main Content Container based on Active Tab
    const mainContent = document.createElement('main');
    mainContent.id = 'main-content-view';

    if (activeTab === 'explore') {
      mainContent.appendChild(renderCitySearch({
        onSelectCity: (city) => {
          // Open city in modal or add stop
        }
      }));
    } else if (activeTab === 'itinerary' || activeTab === 'timeline') {
      const fallbackTripId = activeTripId || 'default-trip';
      mainContent.appendChild(renderItineraryBuilder({
        tripId: fallbackTripId,
        initialTrip: activeTripData,
        onBack: () => {
          activeTab = 'dashboard';
          render();
        },
        onRequestAuth: () => {
          isAuthModalOpen = true;
          authMode = 'login';
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
        },
        onOpenAuth: () => {
          isAuthModalOpen = true;
          authMode = 'login';
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
        openCreateOnMount: createOnMount,
        onOpenAuth: () => {
          isAuthModalOpen = true;
          authMode = 'login';
          render();
        }
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

    bottomDock.querySelectorAll('.dock-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        handleTabChange(tab);
      });
    });

    root.appendChild(bottomDock);

    // 4. Modal Overlays
    if (isAuthModalOpen) {
      const authModal = renderAuthView({
        initialMode: authMode,
        onSuccess: (user) => {
          currentUser = user;
          isAuthModalOpen = false;
          notification = { type: 'success', message: `Welcome, ${user.name}!` };
          if (pendingPostAuth) {
            const nextAction = pendingPostAuth;
            pendingPostAuth = null;
            nextAction();
          } else {
            render();
          }
        },
        onClose: () => {
          isAuthModalOpen = false;
          render();
        }
      });
      root.appendChild(authModal);
    }
  }

  render();
}
