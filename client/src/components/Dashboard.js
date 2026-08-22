/**
 * Dashboard View (User Trips & Itinerary Overview - Stitch MCP Reference)
 * Features Stats Bento, Rich Trip Cards, Quick Share Actions, and New Trip Modal.
 */
import { api } from '../api.js';

export function renderDashboard({ user, onNavigate }) {
  const container = document.createElement('div');
  container.className = 'main-container animate-fade-in';
  container.style.maxWidth = '1280px';
  container.style.margin = '1rem auto 3rem auto';

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
      trips = Array.isArray(res) ? res : (res?.trips || []);
      isLoading = false;
      render();
    } catch (err) {
      console.warn('Trips fetch error:', err.message);
      error = err.message;
      isLoading = false;
      trips = [];
      render();
    }
  }

  function calculateStats() {
    const tripCount = trips.length;
    let totalBudget = 0;
    let totalDestinations = 0;

    trips.forEach(t => {
      totalBudget += parseFloat(t.budget) || 0;
      totalDestinations += (t.stops?.length || 1);
    });

    return {
      tripCount,
      totalBudget: totalBudget > 0 ? `₹${totalBudget.toLocaleString('en-IN')}` : '₹0',
      totalDestinations: tripCount > 0 ? totalDestinations : 0
    };
  }

  function render() {
    const stats = calculateStats();
    const userName = user?.name || 'Traveler';

    container.innerHTML = `
      <!-- Header Section (Stitch Reference) -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem; flex-wrap: wrap; gap: 1.25rem;">
        <div>
          <div class="badge" style="background: rgba(79, 70, 229, 0.15); color: var(--color-primary-light); border: 1px solid rgba(79, 70, 229, 0.3); margin-bottom: 0.5rem;">
            👋 WELCOME BACK
          </div>
          <h1 style="font-family: var(--font-heading); font-size: 2.4rem; font-weight: 800; color: #fff; margin-top: 0.2rem;">
            Good day, ${escapeHtml(userName)}
          </h1>
          <p style="color: var(--color-text-muted); font-size: 1.05rem; margin-top: 0.35rem;">
            Here's a snapshot of your travel plans and collaborative itineraries.
          </p>
        </div>
        <div style="display: flex; gap: 0.75rem;">
          <button class="btn btn-secondary" id="btn-dashboard-explore">
            🗺️ Explore Cities
          </button>
          <button class="btn btn-primary" id="btn-open-create-trip">
            <span>+</span>
            <span>Plan New Trip</span>
          </button>
        </div>
      </div>

      <!-- Stats Bento Section (Stitch Reference) -->
      <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; margin-bottom: 2.5rem;">
        <div class="card" style="padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; border-color: rgba(255,255,255,0.08);">
          <div style="display: flex; justify-content: space-between; align-items: center; color: var(--color-text-muted);">
            <span style="font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Upcoming Trips</span>
            <span style="font-size: 1.3rem;">✈️</span>
          </div>
          <div style="font-family: var(--font-heading); font-size: 2.2rem; font-weight: 800; color: #fff;">
            ${stats.tripCount}
          </div>
        </div>

        <div class="card" style="padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; border-color: rgba(255,255,255,0.08);">
          <div style="display: flex; justify-content: space-between; align-items: center; color: var(--color-text-muted);">
            <span style="font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Destinations Planned</span>
            <span style="font-size: 1.3rem;">📍</span>
          </div>
          <div style="font-family: var(--font-heading); font-size: 2.2rem; font-weight: 800; color: #fff;">
            ${stats.totalDestinations}
          </div>
        </div>

        <div class="card" style="padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; border-color: rgba(255,255,255,0.08);">
          <div style="display: flex; justify-content: space-between; align-items: center; color: var(--color-text-muted);">
            <span style="font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Total Planned Budget</span>
            <span style="font-size: 1.3rem;">💳</span>
          </div>
          <div style="font-family: var(--font-heading); font-size: 2.2rem; font-weight: 800; color: #34d399;">
            ${stats.totalBudget}
          </div>
        </div>
      </section>

      <!-- Section Title -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--color-border);">
        <h2 style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 700; color: #fff;">
          Your Planned Journeys
        </h2>
      </div>

      <!-- Trips Grid -->
      ${isLoading ? `
        <div style="text-align: center; padding: 5rem 0;">
          <div class="spinner" style="width: 36px; height: 36px; border: 3px solid rgba(79, 70, 229, 0.2); border-top-color: var(--color-primary); border-radius: 50%; margin: 0 auto;"></div>
          <p style="color: var(--color-text-muted); margin-top: 1rem;">Loading your journeys...</p>
        </div>
      ` : (trips.length === 0 ? `
        <div class="empty-state animate-fade-in" style="padding: 4.5rem 2rem;">
          <div class="empty-state-icon">🌍</div>
          <h3 style="font-family: var(--font-heading); font-size: 1.6rem; font-weight: 700; color: #fff; margin-bottom: 0.5rem;">No trips planned yet</h3>
          <p class="empty-state-desc">
            You haven't created any journeys yet. Start planning your dream multi-city itinerary now with budget estimation and smart routing!
          </p>
          <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
            <button class="btn btn-primary btn-lg" id="btn-empty-create-trip">
              <span>✈️</span> Create Your First Trip
            </button>
            <button class="btn btn-secondary btn-lg" id="btn-empty-explore">
              <span>🔍</span> Explore Destinations
            </button>
          </div>
        </div>
      ` : `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.75rem;">
          ${trips.map(trip => renderTripCard(trip)).join('')}
        </div>
      `)}

      <div id="modal-host"></div>
    `;

    // Event Listeners
    container.querySelector('#btn-open-create-trip')?.addEventListener('click', openCreateModal);
    container.querySelector('#btn-empty-create-trip')?.addEventListener('click', openCreateModal);
    container.querySelector('#btn-dashboard-explore')?.addEventListener('click', () => onNavigate('explore'));
    container.querySelector('#btn-empty-explore')?.addEventListener('click', () => onNavigate('explore'));

    // Bind share & action buttons
    container.querySelectorAll('.btn-share-trip').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const tripId = btn.getAttribute('data-id');
        await handleShareTrip(tripId, btn);
      });
    });
  }

  function renderTripCard(trip) {
    const formattedBudget = trip.budget ? `₹${parseFloat(trip.budget).toLocaleString('en-IN')}` : 'Budget not set';
    const datesStr = trip.startDate && trip.endDate
      ? `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`
      : (trip.startDate ? `From ${formatDate(trip.startDate)}` : 'Flexible dates');

    const defaultImg = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';
    const tripImg = trip.imageUrl || defaultImg;

    return `
      <article class="card animate-fade-in" style="padding: 0; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.25s ease, box-shadow 0.25s ease;">
        <div style="position: relative; height: 180px; overflow: hidden;">
          <img src="${escapeHtml(tripImg)}" alt="${escapeHtml(trip.title)}" style="width: 100%; height: 100%; object-fit: cover;" />
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to top, rgba(19,27,46,0.95) 0%, rgba(19,27,46,0.2) 60%, rgba(0,0,0,0.4) 100%);"></div>

          <div style="position: absolute; top: 0.75rem; right: 0.75rem;">
            <span class="badge" style="background: rgba(15,23,42,0.85); backdrop-filter: blur(6px); color: #34d399; font-weight: 700; font-size: 0.8rem; border: 1px solid rgba(255,255,255,0.1);">
              ${formattedBudget}
            </span>
          </div>

          <div style="position: absolute; bottom: 0.75rem; left: 1rem; right: 1rem;">
            <span style="font-size: 0.75rem; color: #94a3b8; font-weight: 600;">📅 ${escapeHtml(datesStr)}</span>
            <h3 style="font-family: var(--font-heading); font-size: 1.35rem; font-weight: 800; color: #fff; margin-top: 0.15rem;">
              ${escapeHtml(trip.title)}
            </h3>
          </div>
        </div>

        <div style="padding: 1.25rem; background: var(--color-surface); display: flex; flex-direction: column; justify-content: space-between; flex: 1;">
          <p style="color: var(--color-text-muted); font-size: 0.88rem; line-height: 1.5; margin-bottom: 1.25rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${escapeHtml(trip.description || 'Custom multi-city journey.')}
          </p>

          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0.75rem; border-top: 1px solid var(--color-border);">
            <button class="btn btn-secondary btn-sm btn-share-trip" data-id="${escapeHtml(trip.id)}" style="font-size: 0.8rem;">
              🔗 Share Link
            </button>
            <span style="font-size: 0.8rem; color: var(--color-primary-light); font-weight: 600;">
              ${trip.stops?.length || 1} Stops
            </span>
          </div>
        </div>
      </article>
    `;
  }

  async function handleShareTrip(tripId, buttonEl) {
    const originalText = buttonEl.textContent;
    buttonEl.textContent = '⏳ Sharing...';
    try {
      const API_BASE = window.__API_BASE_URL__ || (window.location.port === '5173' ? 'http://localhost:5000/api' : '/api');
      const token = localStorage.getItem('pmj_token');
      const res = await fetch(`${API_BASE}/trips/${tripId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to generate share link');

      const fullUrl = data.publicUrl || `${window.location.origin}/share/${data.shareToken}`;
      await navigator.clipboard.writeText(fullUrl);
      buttonEl.textContent = '✓ Link Copied!';
      setTimeout(() => { buttonEl.textContent = originalText; }, 2500);
    } catch (err) {
      alert('Share error: ' + err.message);
      buttonEl.textContent = originalText;
    }
  }

  function openCreateModal() {
    const modalHost = container.querySelector('#modal-host');
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.right = '0';
    modal.style.bottom = '0';
    modal.style.backgroundColor = 'rgba(5, 8, 18, 0.85)';
    modal.style.backdropFilter = 'blur(10px)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '1000';
    modal.style.padding = '1rem';

    modal.innerHTML = `
      <div class="card" style="width: 100%; max-width: 520px; background: var(--color-surface); border: 1px solid var(--color-border); box-shadow: 0 25px 60px rgba(0,0,0,0.8);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h2 style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 800; color: #fff;">
            ✈️ Plan a New Journey
          </h2>
          <button style="background: none; border: none; color: var(--color-text-muted); font-size: 1.2rem; cursor: pointer;" id="btn-close-create">✕</button>
        </div>

        <form id="create-trip-form">
          <div class="form-group">
            <label class="form-label">Trip Title</label>
            <input type="text" class="form-input" id="trip-title" placeholder="e.g. Golden Triangle Tour or Euro Summer" required />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Start Date</label>
              <input type="date" class="form-input" id="trip-start-date" />
            </div>
            <div class="form-group">
              <label class="form-label">End Date</label>
              <input type="date" class="form-input" id="trip-end-date" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Estimated Total Budget (₹)</label>
            <input type="number" class="form-input" id="trip-budget" placeholder="e.g. 50000" min="0" />
          </div>

          <div class="form-group">
            <label class="form-label">Description / Notes</label>
            <textarea class="form-input" id="trip-desc" rows="3" placeholder="Add details about your itinerary, companions, or travel wishlist..."></textarea>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.75rem;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-create">Cancel</button>
            <button type="submit" class="btn btn-primary" id="btn-submit-trip">Create Trip</button>
          </div>
        </form>
      </div>
    `;

    modal.querySelector('#btn-close-create')?.addEventListener('click', () => modal.remove());
    modal.querySelector('#btn-cancel-create')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    modal.querySelector('#create-trip-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = modal.querySelector('#btn-submit-trip');
      submitBtn.textContent = 'Saving...';
      submitBtn.disabled = true;

      const body = {
        title: modal.querySelector('#trip-title').value.trim(),
        startDate: modal.querySelector('#trip-start-date').value || null,
        endDate: modal.querySelector('#trip-end-date').value || null,
        budget: parseFloat(modal.querySelector('#trip-budget').value) || 0,
        description: modal.querySelector('#trip-desc').value.trim()
      };

      try {
        await api.createTrip(body);
        modal.remove();
        fetchTrips();
      } catch (err) {
        alert('Error creating trip: ' + err.message);
        submitBtn.textContent = 'Create Trip';
        submitBtn.disabled = false;
      }
    });

    modalHost.appendChild(modal);
  }

  fetchTrips();
  return container;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
