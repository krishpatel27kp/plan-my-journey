/**
 * My Trips Management View Component (Light Editorial Design)
 * Features search, sort, upcoming/past filters, and trip deletion.
 */
import { api } from '../api.js';

export function renderMyTrips({ onOpenTrip, onPlanNewTrip }) {
  const container = document.createElement('div');
  container.className = 'main-container animate-fade-in';
  container.style.maxWidth = '1280px';
  container.style.margin = '2rem auto';

  let trips = [];
  let isLoading = true;
  let searchTerm = '';
  let activeFilter = 'all'; // 'all' | 'upcoming' | 'past'
  let sortBy = 'date-desc';

  async function loadTrips() {
    isLoading = true;
    render();

    try {
      trips = await api.getTrips();
      isLoading = false;
      render();
    } catch (err) {
      console.warn('Trips load fallback:', err.message);
      trips = [
        {
          id: 'demo-trip-1',
          title: 'Goa Escape',
          startDate: '2026-09-10',
          endDate: '2026-09-15',
          budget: 50000,
          currency: 'INR',
          description: 'Delhi-Jaipur-Goa coastal and cultural getaway',
          coverImage: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
          destinationsCount: 3,
          status: 'planning'
        },
        {
          id: 'demo-trip-2',
          title: 'Golden Triangle Exploration',
          startDate: '2026-11-01',
          endDate: '2026-11-08',
          budget: 45000,
          currency: 'INR',
          description: 'Historical tour of Delhi, Agra and Jaipur',
          coverImage: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80',
          destinationsCount: 3,
          status: 'confirmed'
        }
      ];
      isLoading = false;
      render();
    }
  }

  function getFilteredAndSortedTrips() {
    const now = new Date();
    let result = trips.filter(t => {
      const matchesSearch = !searchTerm || t.title.toLowerCase().includes(searchTerm.toLowerCase()) || (t.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (activeFilter === 'upcoming') {
        return !t.endDate || new Date(t.endDate) >= now;
      }
      if (activeFilter === 'past') {
        return t.endDate && new Date(t.endDate) < now;
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.startDate || 0) - new Date(a.startDate || 0);
      if (sortBy === 'date-asc') return new Date(a.startDate || 0) - new Date(b.startDate || 0);
      if (sortBy === 'budget-desc') return (parseFloat(b.budget) || 0) - (parseFloat(a.budget) || 0);
      if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
      return 0;
    });

    return result;
  }

  function render() {
    if (isLoading) {
      container.innerHTML = `
        <div style="text-align: center; padding: 6rem 0;">
          <div class="spinner" style="width: 44px; height: 44px; border: 3px solid rgba(37, 99, 235, 0.2); border-top-color: var(--color-primary); border-radius: 50%; margin: 0 auto;"></div>
          <p style="color: #64748b; margin-top: 1rem; font-size: 1.05rem;">Loading Your Journeys...</p>
        </div>
      `;
      return;
    }

    const filteredTrips = getFilteredAndSortedTrips();

    container.innerHTML = `
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem;">
        <div>
          <span class="badge" style="background: var(--color-primary-subtle); color: var(--color-primary); margin-bottom: 0.35rem; font-weight: 700;">
            ✈️ TRIP MANAGEMENT
          </span>
          <h1 style="font-family: var(--font-heading); font-size: 2.5rem; font-weight: 900; color: #0f172a;">
            My Journeys
          </h1>
          <p style="color: #64748b; font-size: 1rem; margin-top: 0.2rem;">
            Manage, customize, and track all your scheduled multi-city itineraries.
          </p>
        </div>

        <button class="btn btn-primary btn-lg" id="btn-create-trip-main">
          <span>+</span>
          <span>Plan New Trip</span>
        </button>
      </div>

      <!-- Controls Bar: Search, Filters, Sort -->
      <div class="card" style="padding: 1.25rem 1.5rem; background: #ffffff; border: 1px solid var(--color-border); margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; box-shadow: var(--shadow-sm);">
        
        <!-- Search & Filter Tabs -->
        <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; flex: 1;">
          <div style="position: relative; min-width: 240px; flex: 1; max-width: 360px;">
            <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); opacity: 0.5;">🔍</span>
            <input 
              type="text" 
              class="form-input" 
              id="trip-search-input" 
              placeholder="Search by trip title..." 
              value="${escapeHtml(searchTerm)}"
              style="width: 100%; padding-left: 2.5rem; border-radius: var(--radius-full);"
            />
          </div>

          <div style="display: flex; background: #f1f5f9; padding: 3px; border-radius: var(--radius-full); border: 1px solid var(--color-border);">
            <button class="btn btn-sm ${activeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}" data-filter="all" style="border-radius: var(--radius-full); border: none; font-size: 0.82rem; padding: 0.35rem 0.85rem; font-weight: 600;">
              All (${trips.length})
            </button>
            <button class="btn btn-sm ${activeFilter === 'upcoming' ? 'btn-primary' : 'btn-secondary'}" data-filter="upcoming" style="border-radius: var(--radius-full); border: none; font-size: 0.82rem; padding: 0.35rem 0.85rem; font-weight: 600;">
              Upcoming
            </button>
            <button class="btn btn-sm ${activeFilter === 'past' ? 'btn-primary' : 'btn-secondary'}" data-filter="past" style="border-radius: var(--radius-full); border: none; font-size: 0.82rem; padding: 0.35rem 0.85rem; font-weight: 600;">
              Past
            </button>
          </div>
        </div>

        <!-- Sort -->
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <select class="form-input" id="trip-sort-select" style="font-size: 0.85rem; padding: 0.45rem 0.85rem; border-radius: var(--radius-md); font-weight: 600;">
            <option value="date-desc" ${sortBy === 'date-desc' ? 'selected' : ''}>📅 Date: Newest First</option>
            <option value="date-asc" ${sortBy === 'date-asc' ? 'selected' : ''}>📅 Date: Oldest First</option>
            <option value="budget-desc" ${sortBy === 'budget-desc' ? 'selected' : ''}>💰 Budget: High to Low</option>
            <option value="title-asc" ${sortBy === 'title-asc' ? 'selected' : ''}>🔤 Title: A to Z</option>
          </select>
        </div>

      </div>

      <!-- Trips Display Grid -->
      ${filteredTrips.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">✈️</div>
          <h3 style="color: #0f172a; margin-bottom: 0.5rem;">You have no trips matching your filters</h3>
          <p class="empty-state-desc">Create your next unforgettable adventure or clear your search query.</p>
          <button class="btn btn-primary btn-lg" id="btn-create-first-trip">+ Plan Your First Trip</button>
        </div>
      ` : `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.75rem;">
          ${filteredTrips.map(t => {
            const formattedBudget = typeof t.budget === 'number' || !isNaN(parseFloat(t.budget))
              ? `₹${parseFloat(t.budget).toLocaleString('en-IN')}`
              : 'Flexible Budget';
            const datesStr = t.startDate && t.endDate
              ? `${formatDate(t.startDate)} – ${formatDate(t.endDate)}`
              : 'Dates to be announced';
            const defaultCover = 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80';

            return `
              <div class="card trip-card animate-fade-in" style="padding: 0; overflow: hidden; display: flex; flex-direction: column; background: #ffffff; border: 1px solid var(--color-border); box-shadow: var(--shadow-sm); transition: transform 0.25s ease, box-shadow 0.25s ease;">
                
                <div style="position: relative; height: 180px; overflow: hidden;">
                  <img src="${escapeHtml(t.coverImage || defaultCover)}" alt="${escapeHtml(t.title)}" onerror="this.onerror=null; this.src='${defaultCover}';" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease;" />
                  <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.1) 60%, rgba(0,0,0,0.2) 100%);"></div>

                  <span class="badge" style="position: absolute; top: 1rem; right: 1rem; background: rgba(255,255,255,0.92); backdrop-filter: blur(6px); color: #059669; font-weight: 700; border: 1px solid rgba(0,0,0,0.06);">
                    ${formattedBudget}
                  </span>

                  <div style="position: absolute; bottom: 1rem; left: 1.25rem; right: 1.25rem;">
                    <span class="badge" style="background: rgba(255,255,255,0.2); backdrop-filter: blur(6px); color: #fff; margin-bottom: 0.3rem;">
                      📍 ${t.destinationsCount || 3} Destinations
                    </span>
                    <h3 style="font-family: var(--font-heading); font-size: 1.35rem; font-weight: 800; color: #fff; line-height: 1.2;">
                      ${escapeHtml(t.title)}
                    </h3>
                  </div>
                </div>

                <div style="padding: 1.25rem 1.5rem; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; color: #64748b; font-size: 0.88rem; margin-bottom: 0.75rem;">
                      <span>📅</span>
                      <span>${escapeHtml(datesStr)}</span>
                    </div>
                    <p style="color: #64748b; font-size: 0.85rem; line-height: 1.5; margin-bottom: 1.25rem;">
                      ${escapeHtml(t.description || 'Custom planned multi-city journey.')}
                    </p>
                  </div>

                  <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid var(--color-border); gap: 0.5rem;">
                    <button class="btn btn-primary btn-open-trip" data-id="${escapeHtml(t.id)}" style="flex: 1; justify-content: center; font-size: 0.85rem;">
                      View Itinerary →
                    </button>
                    <button class="btn btn-secondary btn-delete-trip" data-id="${escapeHtml(t.id)}" data-title="${escapeHtml(t.title)}" title="Delete Trip" style="color: #ef4444; border-color: rgba(239,68,68,0.2);">
                      🗑️
                    </button>
                  </div>
                </div>

              </div>
            `;
          }).join('')}
        </div>
      `}
    `;

    // Event listeners
    container.querySelector('#btn-create-trip-main')?.addEventListener('click', onPlanNewTrip);
    container.querySelector('#btn-create-first-trip')?.addEventListener('click', onPlanNewTrip);

    const searchInput = container.querySelector('#trip-search-input');
    searchInput?.addEventListener('input', (e) => {
      searchTerm = e.target.value;
      render();
    });

    const filterBtns = container.querySelectorAll('[data-filter]');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        activeFilter = btn.getAttribute('data-filter') || 'all';
        render();
      });
    });

    const sortSelect = container.querySelector('#trip-sort-select');
    sortSelect?.addEventListener('change', (e) => {
      sortBy = e.target.value;
      render();
    });

    container.querySelectorAll('.btn-open-trip').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const selected = trips.find(t => t.id === id);
        onOpenTrip(id, selected);
      });
    });

    container.querySelectorAll('.btn-delete-trip').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const title = btn.getAttribute('data-title');
        if (confirm(`Are you sure you want to delete the trip "${title}"? This cannot be undone.`)) {
          try {
            await api.deleteTrip(id);
          } catch (e) {
            console.warn('Delete trip warning:', e.message);
          }
          trips = trips.filter(t => t.id !== id);
          render();
        }
      });
    });
  }

  loadTrips();
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
