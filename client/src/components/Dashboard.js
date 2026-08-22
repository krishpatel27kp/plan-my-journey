/**
 * Dashboard View (User Trips & Itinerary Overview)
 * Calls GET /api/trips (Teammate B contract) and handles loading/empty/error states.
 */
import { api } from '../api.js';

export function renderDashboard({ user, onNavigate }) {
  const container = document.createElement('div');
  container.className = 'main-container animate-fade-in';

  let trips = [];
  let isLoading = true;
  let error = null;
  let isCreateModalOpen = false;

  async function fetchTrips() {
    isLoading = true;
    error = null;
    render();

    try {
      const res = await api.getTrips();
      // Handle response shape (array or { trips: [...] })
      trips = Array.isArray(res) ? res : (res?.trips || []);
      isLoading = false;
      render();
    } catch (err) {
      console.warn('Trips fetch warning (endpoint may be pending from Teammate B):', err.message);
      error = err.message;
      isLoading = false;
      // Fallback empty list if endpoint is 404/not yet implemented by Teammate B
      trips = [];
      render();
    }
  }

  function render() {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h1 style="font-size: 2.2rem; margin-bottom: 0.25rem;">My Journeys</h1>
          <p style="color: var(--color-text-muted); font-size: 1rem;">
            Plan, organize, and explore your upcoming multi-city trips.
          </p>
        </div>
        <button class="btn btn-primary btn-lg" id="btn-open-create-trip">
          <span>✈️</span>
          <span>New Trip</span>
        </button>
      </div>

      ${error ? `
        <div class="alert alert-danger" style="margin-bottom: 2rem;">
          <div style="flex: 1;">
            <strong>Notice:</strong> ${escapeHtml(error)}
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-retry-trips">Retry</button>
        </div>
      ` : ''}

      ${isLoading ? `
        <div style="text-align: center; padding: 5rem 0;">
          <div class="spinner" style="width: 2.5rem; height: 2.5rem; border-width: 3px; border-top-color: var(--color-primary-light);"></div>
          <p style="color: var(--color-text-muted); margin-top: 1rem;">Loading your journeys...</p>
        </div>
      ` : (trips.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">🗺️</div>
          <h3 class="empty-state-title">No trips planned yet</h3>
          <p class="empty-state-desc">
            You haven't created any trips yet. Start planning your dream multi-city itinerary now!
          </p>
          <button class="btn btn-primary btn-lg" id="btn-empty-create-trip">
            <span>✨</span> Create Your First Trip
          </button>
        </div>
      ` : `
        <div class="grid-trips">
          ${trips.map(trip => renderTripCard(trip)).join('')}
        </div>
      `)}

      ${isCreateModalOpen ? renderCreateTripModal() : ''}
    `;

    // Bind Event Listeners
    container.querySelector('#btn-open-create-trip')?.addEventListener('click', () => {
      isCreateModalOpen = true;
      render();
    });

    container.querySelector('#btn-empty-create-trip')?.addEventListener('click', () => {
      isCreateModalOpen = true;
      render();
    });

    container.querySelector('#btn-retry-trips')?.addEventListener('click', () => {
      fetchTrips();
    });

    container.querySelector('#modal-close-trip')?.addEventListener('click', () => {
      isCreateModalOpen = false;
      render();
    });

    container.querySelector('#form-create-trip')?.addEventListener('submit', handleCreateTrip);
  }

  function renderTripCard(trip) {
    const defaultCover = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&auto=format&fit=crop&q=80';
    const cover = trip.cover_image || trip.coverImage || defaultCover;
    const title = trip.title || 'Untitled Adventure';
    const dates = trip.start_date && trip.end_date
      ? `${trip.start_date} → ${trip.end_date}`
      : 'Dates not set';
    const budget = trip.budget ? `${trip.currency || '$'}${Number(trip.budget).toLocaleString()}` : 'Budget not set';
    const status = trip.status || 'planning';

    return `
      <div class="trip-card">
        <img src="${escapeHtml(cover)}" class="trip-card-image" alt="${escapeHtml(title)}" onerror="this.src='${defaultCover}'" />
        <div class="trip-card-body">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
            <h3 class="trip-card-title">${escapeHtml(title)}</h3>
            <span class="badge badge-${status === 'active' ? 'active' : 'planning'}">${status}</span>
          </div>
          <div class="trip-card-dates">
            <span>📅</span>
            <span>${escapeHtml(dates)}</span>
          </div>
          <p style="color: var(--color-text-muted); font-size: 0.875rem; margin-bottom: 1rem; line-height: 1.5;">
            ${escapeHtml(trip.description || 'No description provided.')}
          </p>
          <div class="trip-card-budget">
            <span style="color: var(--color-text-muted);">Est. Budget</span>
            <span style="font-weight: 700; color: var(--color-primary-light);">${escapeHtml(budget)}</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderCreateTripModal() {
    return `
      <div class="modal-overlay animate-fade-in">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Plan a New Journey</h3>
            <button class="modal-close" id="modal-close-trip">&times;</button>
          </div>
          <form id="form-create-trip">
            <div class="form-group">
              <label class="form-label" for="trip-title">Trip Title *</label>
              <input type="text" id="trip-title" class="form-input" placeholder="e.g. Summer in Southern Italy" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="trip-desc">Description</label>
              <textarea id="trip-desc" class="form-textarea" rows="2" placeholder="Brief outline of the adventure..."></textarea>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label" for="trip-start">Start Date</label>
                <input type="date" id="trip-start" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label" for="trip-end">End Date</label>
                <input type="date" id="trip-end" class="form-input" />
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label" for="trip-budget">Budget</label>
                <input type="number" id="trip-budget" class="form-input" placeholder="2500" min="0" step="10" />
              </div>
              <div class="form-group">
                <label class="form-label" for="trip-currency">Currency</label>
                <select id="trip-currency" class="form-select">
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
              <button type="button" class="btn btn-secondary" id="modal-cancel-trip">Cancel</button>
              <button type="submit" class="btn btn-primary" id="modal-submit-trip">Create Journey</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  async function handleCreateTrip(e) {
    e.preventDefault();
    const title = container.querySelector('#trip-title')?.value.trim();
    const description = container.querySelector('#trip-desc')?.value.trim();
    const start_date = container.querySelector('#trip-start')?.value || null;
    const end_date = container.querySelector('#trip-end')?.value || null;
    const budget = parseFloat(container.querySelector('#trip-budget')?.value) || 0;
    const currency = container.querySelector('#trip-currency')?.value || 'USD';

    try {
      const newTrip = await api.createTrip({
        title,
        description,
        start_date,
        end_date,
        budget,
        currency
      });

      isCreateModalOpen = false;
      // If server returns created trip, add it locally
      if (newTrip) {
        trips.unshift(newTrip);
      }
      render();
    } catch (err) {
      alert(`Could not create trip: ${err.message}`);
    }
  }

  // Initial Fetch
  fetchTrips();
  return container;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
