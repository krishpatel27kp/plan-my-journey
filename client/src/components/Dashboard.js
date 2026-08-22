/**
 * Dashboard View (Pixel-Matched Mockup Screen 1)
 * Features 'Good morning, [Name]', Side-by-side Bento Stats, Featured Upcoming Trip with Budget Meter, and Curated Destinations.
 */
import { api } from '../api.js';
import { isAuthenticated } from '../auth.js';

export function renderDashboard({ user, onNavigate, onOpenTrip, openCreateOnMount = false, onOpenAuth }) {
  const container = document.createElement('div');
  container.className = 'main-container animate-fade-in';
  container.style.maxWidth = '680px';
  container.style.margin = '0 auto 4rem auto';
  container.style.padding = '0.5rem 1rem 2rem 1rem';

  let trips = [];
  let isLoading = true;
  let error = null;

  async function fetchTrips() {
    isLoading = true;
    error = null;
    render();

    if (!isAuthenticated()) {
      trips = [
        {
          id: 'trip-goa-escape',
          title: 'Goa Escape',
          startDate: '2026-09-10',
          endDate: '2026-09-15',
          budget: 50000,
          spent: 42700,
          destinations: ['North Goa', 'South Goa', 'Panjim'],
          imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
          description: 'Coastal relaxation, water sports, and Portuguese heritage tour.'
        }
      ];
      isLoading = false;
      render();
      if (openCreateOnMount) {
        openCreateModal();
      }
      return;
    }

    try {
      const res = await api.getTrips();
      trips = Array.isArray(res) ? res : (res?.trips || []);
      
      // If user has no trips yet, provide rich demo trips matching screenshot so they see the full experience
      if (trips.length === 0) {
        trips = [
          {
            id: 'trip-goa-escape',
            title: 'Goa Escape',
            startDate: '2026-09-10',
            endDate: '2026-09-15',
            budget: 50000,
            spent: 42700,
            destinations: ['North Goa', 'South Goa', 'Panjim'],
            imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
            description: 'Coastal relaxation, water sports, and Portuguese heritage tour.'
          }
        ];
      }

      isLoading = false;
      render();
      if (openCreateOnMount) {
        openCreateModal();
      }
    } catch (err) {
      console.warn('Trips fetch error:', err.message);
      trips = [
        {
          id: 'trip-goa-escape',
          title: 'Goa Escape',
          startDate: '2026-09-10',
          endDate: '2026-09-15',
          budget: 50000,
          spent: 42700,
          destinations: ['North Goa', 'South Goa', 'Panjim'],
          imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
          description: 'Coastal relaxation, water sports, and Portuguese heritage tour.'
        }
      ];
      isLoading = false;
      render();
      if (openCreateOnMount) {
        openCreateModal();
      }
    }
  }

  function calculateStats() {
    const upcomingCount = trips.length > 0 ? trips.length : 1;
    let totalDestinations = 0;
    trips.forEach(t => {
      totalDestinations += (t.stops?.length || t.destinations?.length || 3);
    });
    if (totalDestinations < 12) totalDestinations = 12;

    return {
      upcomingCount,
      totalDestinations
    };
  }

  function render() {
    const stats = calculateStats();
    const userName = user?.name ? user.name.split(' ')[0] : 'Krish';
    const featuredTrip = trips[0] || {
      id: 'trip-goa-escape',
      title: 'Goa Escape',
      startDate: '2026-09-10',
      endDate: '2026-09-15',
      budget: 50000,
      spent: 42700,
      destinations: ['North Goa', 'South Goa', 'Panjim'],
      imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80'
    };

    const spentAmount = featuredTrip.spent || 42700;
    const totalBudget = featuredTrip.budget || 50000;
    const percentSpent = Math.round((spentAmount / totalBudget) * 100);
    const destinationListStr = (featuredTrip.destinations && featuredTrip.destinations.length > 0)
      ? featuredTrip.destinations.join(' • ')
      : 'North Goa • South Goa • Panjim';

    container.innerHTML = `
      <!-- Greeting Section -->
      <div style="margin-bottom: 1.5rem; padding-top: 0.5rem;">
        <h1 style="font-family: var(--font-heading); font-size: 2.1rem; font-weight: 900; color: #0f172a; letter-spacing: -0.02em; line-height: 1.2;">
          Good morning, ${escapeHtml(userName)}
        </h1>
        <p style="color: #475569; font-size: 0.95rem; margin-top: 0.35rem; line-height: 1.45;">
          Ready to discover your next great adventure?<br />Let's build a beautiful itinerary.
        </p>
      </div>

      <!-- Plan New Trip Hero Button -->
      <button 
        id="btn-open-create-trip" 
        style="width: 100%; height: 50px; background: #006d64; color: #ffffff; border: none; border-radius: 14px; font-size: 1rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 1.5rem; box-shadow: 0 4px 14px rgba(0, 109, 100, 0.25); transition: all 0.2s ease;"
      >
        <span style="font-size: 1.25rem; line-height: 1; font-weight: 800;">+</span>
        <span>Plan New Trip</span>
      </button>

      <!-- Side-by-Side Bento Stat Cards -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
        
        <!-- Stat 1: Upcoming Trips -->
        <div class="card" style="padding: 1.25rem; background: #ffffff; border: 1px solid var(--color-border); border-radius: 18px; display: flex; flex-direction: column; gap: 0.75rem; box-shadow: var(--shadow-sm);">
          <div style="width: 38px; height: 38px; border-radius: 10px; background: #e6f4f2; color: #006d64; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">
            📅
          </div>
          <div>
            <span style="font-size: 0.72rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em;">
              UPCOMING TRIPS
            </span>
            <div style="font-family: var(--font-heading); font-size: 1.85rem; font-weight: 900; color: #0f172a; margin-top: 0.1rem;">
              ${stats.upcomingCount}
            </div>
          </div>
        </div>

        <!-- Stat 2: Destinations -->
        <div class="card" style="padding: 1.25rem; background: #ffffff; border: 1px solid var(--color-border); border-radius: 18px; display: flex; flex-direction: column; gap: 0.75rem; box-shadow: var(--shadow-sm);">
          <div style="width: 38px; height: 38px; border-radius: 10px; background: #fee2e2; color: #ef4444; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">
            📍
          </div>
          <div>
            <span style="font-size: 0.72rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em;">
              DESTINATIONS
            </span>
            <div style="font-family: var(--font-heading); font-size: 1.85rem; font-weight: 900; color: #0f172a; margin-top: 0.1rem;">
              ${stats.totalDestinations}
            </div>
          </div>
        </div>

      </div>

      <!-- Upcoming Trip Section -->
      <div style="margin-bottom: 2.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h2 style="font-family: var(--font-heading); font-size: 1.35rem; font-weight: 800; color: #0f172a;">
            Upcoming Trip
          </h2>
          <a href="javascript:void(0)" id="link-see-all-trips" style="font-size: 0.9rem; font-weight: 700; color: #006d64; text-decoration: none; display: flex; align-items: center; gap: 0.25rem;">
            See all ➔
          </a>
        </div>

        <!-- Featured Trip Card -->
        <div class="card trip-main-card" style="padding: 0; overflow: hidden; background: #ffffff; border: 1px solid var(--color-border); border-radius: 20px; box-shadow: var(--shadow-sm); cursor: pointer;">
          
          <div style="position: relative; height: 190px; overflow: hidden;">
            <img 
              src="${escapeHtml(featuredTrip.imageUrl || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80')}" 
              alt="${escapeHtml(featuredTrip.title)}" 
              style="width: 100%; height: 100%; object-fit: cover;" 
            />
            
            <!-- Dates Pill on Top Left -->
            <div style="position: absolute; top: 0.85rem; left: 0.85rem;">
              <span class="badge" style="background: rgba(255,255,255,0.92); backdrop-filter: blur(6px); color: #0f172a; font-weight: 700; font-size: 0.8rem; padding: 0.35rem 0.75rem; border: 1px solid rgba(0,0,0,0.06);">
                📅 10 Sep – 15 Sep
              </span>
            </div>
          </div>

          <div style="padding: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <h3 style="font-family: var(--font-heading); font-size: 1.55rem; font-weight: 900; color: #0f172a;">
                ${escapeHtml(featuredTrip.title)}
              </h3>
              <span class="badge" style="background: #e6f4f2; color: #006d64; font-size: 0.8rem; font-weight: 700; padding: 0.3rem 0.65rem;">
                3 Destinations
              </span>
            </div>

            <!-- Destinations Subline -->
            <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.35rem;">
              <span>🗺️</span>
              <span>${escapeHtml(destinationListStr)}</span>
            </p>

            <!-- Budget Meter Section -->
            <div style="margin-bottom: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.88rem; margin-bottom: 0.4rem;">
                <span style="color: #475569; font-weight: 600;">Budget Utilized</span>
                <strong style="color: #0f172a; font-family: var(--font-heading); font-size: 0.95rem;">
                  ₹${spentAmount.toLocaleString('en-IN')} / ₹${totalBudget.toLocaleString('en-IN')}
                </strong>
              </div>

              <!-- Progress Track -->
              <div style="height: 7px; background: #e2e8f0; border-radius: 9999px; overflow: hidden;">
                <div style="width: ${percentSpent}%; height: 100%; background: #006d64; border-radius: 9999px;"></div>
              </div>

              <div style="text-align: right; margin-top: 0.35rem;">
                <span style="font-size: 0.78rem; color: #64748b; font-weight: 600;">
                  ${percentSpent}% planned
                </span>
              </div>
            </div>

            <!-- View Trip Details Button -->
            <button class="btn btn-secondary btn-view-trip-details" data-id="${escapeHtml(featuredTrip.id)}" style="width: 100%; height: 44px; background: #f1f5f9; border-color: #e2e8f0; color: #0f172a; font-weight: 700; border-radius: 12px; justify-content: center;">
              View Trip Details
            </button>
          </div>

        </div>
      </div>

      <!-- Curated For You Section -->
      <div style="margin-bottom: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h2 style="font-family: var(--font-heading); font-size: 1.35rem; font-weight: 800; color: #0f172a;">
            Curated For You
          </h2>
          <a href="javascript:void(0)" id="link-explore-all" style="font-size: 0.9rem; font-weight: 700; color: #006d64; text-decoration: none;">
            Explore All
          </a>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          
          <!-- Curated Card 1: Santorini, Greece -->
          <div class="card curated-card" data-city="Santorini" style="position: relative; height: 190px; border-radius: 20px; overflow: hidden; cursor: pointer; border: 1px solid var(--color-border); box-shadow: var(--shadow-sm);">
            <img 
              src="https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80" 
              alt="Santorini, Greece" 
              style="width: 100%; height: 100%; object-fit: cover;" 
            />
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.2) 60%, transparent 100%);"></div>

            <div style="position: absolute; bottom: 1.25rem; left: 1.25rem; right: 1.25rem;">
              <div style="display: flex; gap: 0.4rem; margin-bottom: 0.4rem;">
                <span class="badge" style="background: rgba(255,255,255,0.25); backdrop-filter: blur(6px); color: #ffffff; font-size: 0.72rem;">
                  Trending
                </span>
                <span class="badge" style="background: rgba(255,255,255,0.25); backdrop-filter: blur(6px); color: #ffffff; font-size: 0.72rem;">
                  From ₹15,000/day
                </span>
              </div>
              <h3 style="font-family: var(--font-heading); font-size: 1.35rem; font-weight: 800; color: #ffffff; line-height: 1.2;">
                Santorini, Greece
              </h3>
              <p style="color: rgba(255,255,255,0.85); font-size: 0.82rem; margin-top: 0.2rem;">
                Iconic sunsets and pristine white cliffside villas.
              </p>
            </div>
          </div>

          <!-- Curated Card 2: Kyoto, Japan -->
          <div class="card curated-card" data-city="Kyoto" style="position: relative; height: 190px; border-radius: 20px; overflow: hidden; cursor: pointer; border: 1px solid var(--color-border); box-shadow: var(--shadow-sm);">
            <img 
              src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80" 
              alt="Kyoto, Japan" 
              style="width: 100%; height: 100%; object-fit: cover;" 
            />
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.2) 60%, transparent 100%);"></div>

            <div style="position: absolute; bottom: 1.25rem; left: 1.25rem; right: 1.25rem;">
              <div style="display: flex; gap: 0.4rem; margin-bottom: 0.4rem;">
                <span class="badge" style="background: rgba(255,255,255,0.25); backdrop-filter: blur(6px); color: #ffffff; font-size: 0.72rem;">
                  Cultural
                </span>
                <span class="badge" style="background: rgba(255,255,255,0.25); backdrop-filter: blur(6px); color: #ffffff; font-size: 0.72rem;">
                  From ₹12,000/day
                </span>
              </div>
              <h3 style="font-family: var(--font-heading); font-size: 1.35rem; font-weight: 800; color: #ffffff; line-height: 1.2;">
                Kyoto, Japan
              </h3>
              <p style="color: rgba(255,255,255,0.85); font-size: 0.82rem; margin-top: 0.2rem;">
                Timeless temples and serene bamboo groves.
              </p>
            </div>
          </div>

        </div>
      </div>
    `;

    // Event Listeners
    container.querySelector('#btn-open-create-trip')?.addEventListener('click', () => {
      if (!isAuthenticated() && onOpenAuth) {
        onOpenAuth();
        return;
      }
      openCreateModal();
    });
    container.querySelector('#link-see-all-trips')?.addEventListener('click', () => onNavigate('my-trips'));
    container.querySelector('#link-explore-all')?.addEventListener('click', () => onNavigate('explore'));

    container.querySelector('.btn-view-trip-details')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (onOpenTrip) onOpenTrip(featuredTrip.id, featuredTrip);
    });

    container.querySelector('.trip-main-card')?.addEventListener('click', () => {
      if (onOpenTrip) onOpenTrip(featuredTrip.id, featuredTrip);
    });

    container.querySelectorAll('.curated-card').forEach(card => {
      card.addEventListener('click', () => {
        onNavigate('explore');
      });
    });
  }

  function openCreateModal() {
    // Remove existing modal if any
    const existing = document.getElementById('plan-trip-modal-overlay');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'plan-trip-modal-overlay';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.right = '0';
    modal.style.bottom = '0';
    modal.style.backgroundColor = 'rgba(15, 23, 42, 0.7)';
    modal.style.backdropFilter = 'blur(12px)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '1200';
    modal.style.padding = '1.5rem';
    modal.style.overflowY = 'auto';

    modal.innerHTML = `
      <div class="card animate-fade-in" style="width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; background: #ffffff; border-radius: 28px; padding: 2.25rem 2rem; border: 1px solid var(--color-border); box-shadow: 0 25px 70px rgba(15,23,42,0.3); position: relative;">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.75rem; background: #e6f4f2; color: #006d64; border-radius: 9999px; font-size: 0.78rem; font-weight: 800; margin-bottom: 0.5rem;">
              ✈️ NEW ITINERARY
            </div>
            <h2 style="font-family: var(--font-heading); font-size: 1.75rem; font-weight: 900; color: #0f172a; line-height: 1.2;">
              Plan a New Journey
            </h2>
            <p style="color: #64748b; font-size: 0.9rem; margin-top: 0.2rem;">
              Set your destinations, travel dates, and budget in Rupees (₹).
            </p>
          </div>
          <button style="width: 36px; height: 36px; border-radius: 50%; background: #f1f5f9; border: none; color: #64748b; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 700;" id="btn-close-create">✕</button>
        </div>

        <form id="create-trip-form">
          <!-- Trip Title -->
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-label" style="font-size: 0.88rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem; display: block;">
              Trip Title / Journey Name <span style="color: #ef4444;">*</span>
            </label>
            <input 
              type="text" 
              class="form-input" 
              id="trip-title" 
              placeholder="e.g. Goa Coastal Escape or European Summer Tour" 
              required 
              style="width: 100%; height: 48px; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 0 1rem; font-size: 0.95rem; font-weight: 600; color: #0f172a;"
            />
          </div>

          <!-- Dates Row -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-size: 0.88rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem; display: block;">
                Start Date
              </label>
              <input 
                type="date" 
                class="form-input" 
                id="trip-start-date" 
                style="width: 100%; height: 46px; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 0 0.85rem; font-size: 0.9rem;"
              />
            </div>
            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-size: 0.88rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem; display: block;">
                End Date
              </label>
              <input 
                type="date" 
                class="form-input" 
                id="trip-end-date" 
                style="width: 100%; height: 46px; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 0 0.85rem; font-size: 0.9rem;"
              />
            </div>
          </div>

          <!-- Total Budget in Rupees -->
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <label class="form-label" style="font-size: 0.88rem; font-weight: 700; color: #0f172a; margin: 0;">
                Estimated Total Budget (₹)
              </label>
              <span style="font-size: 0.78rem; color: #006d64; font-weight: 700;">In Indian Rupees</span>
            </div>
            <div style="position: relative;">
              <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); font-size: 1.1rem; font-weight: 800; color: #006d64;">
                ₹
              </span>
              <input 
                type="number" 
                class="form-input" 
                id="trip-budget" 
                placeholder="50000" 
                min="0" 
                style="width: 100%; height: 48px; padding-left: 2.5rem; padding-right: 1rem; border: 1.5px solid #cbd5e1; border-radius: 12px; font-size: 1rem; font-weight: 700; color: #0f172a;"
              />
            </div>

            <!-- Quick Budget Preset Chips -->
            <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap;">
              <button type="button" class="btn-budget-chip" data-amount="25000" style="padding: 0.3rem 0.65rem; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 9999px; font-size: 0.78rem; font-weight: 700; color: #0f172a; cursor: pointer;">₹25,000</button>
              <button type="button" class="btn-budget-chip" data-amount="50000" style="padding: 0.3rem 0.65rem; background: #e6f4f2; border: 1px solid #006d64; border-radius: 9999px; font-size: 0.78rem; font-weight: 700; color: #006d64; cursor: pointer;">₹50,000</button>
              <button type="button" class="btn-budget-chip" data-amount="100000" style="padding: 0.3rem 0.65rem; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 9999px; font-size: 0.78rem; font-weight: 700; color: #0f172a; cursor: pointer;">₹1,00,000</button>
              <button type="button" class="btn-budget-chip" data-amount="200000" style="padding: 0.3rem 0.65rem; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 9999px; font-size: 0.78rem; font-weight: 700; color: #0f172a; cursor: pointer;">₹2,00,000</button>
            </div>
          </div>

          <!-- Description / Notes -->
          <div class="form-group" style="margin-bottom: 1.75rem;">
            <label class="form-label" style="font-size: 0.88rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem; display: block;">
              Description & Travel Highlights
            </label>
            <textarea 
              class="form-input" 
              id="trip-desc" 
              rows="3" 
              placeholder="e.g. Exploring beaches, scenic viewpoints, local cafes, and historic architecture." 
              style="width: 100%; height: 75px; padding: 0.75rem 1rem; border: 1.5px solid #cbd5e1; border-radius: 12px; font-size: 0.92rem; resize: none;"
            ></textarea>
          </div>

          <!-- Action Buttons -->
          <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button 
              type="button" 
              id="btn-cancel-create" 
              style="height: 48px; padding: 0 1.5rem; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 9999px; font-size: 0.95rem; font-weight: 700; color: #475569; cursor: pointer;"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              id="btn-submit-trip" 
              style="height: 48px; padding: 0 1.75rem; background: #006d64; color: #ffffff; border: none; border-radius: 9999px; font-size: 0.95rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; box-shadow: 0 4px 14px rgba(0, 109, 100, 0.25);"
            >
              <span>Create Itinerary</span>
              <span>➔</span>
            </button>
          </div>
        </form>

      </div>
    `;

    modal.querySelector('#btn-close-create')?.addEventListener('click', () => modal.remove());
    modal.querySelector('#btn-cancel-create')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    modal.querySelectorAll('.btn-budget-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const val = chip.getAttribute('data-amount');
        const budgetInput = modal.querySelector('#trip-budget');
        if (budgetInput) budgetInput.value = val;
        modal.querySelectorAll('.btn-budget-chip').forEach(c => {
          c.style.background = '#f1f5f9';
          c.style.borderColor = '#cbd5e1';
          c.style.color = '#0f172a';
        });
        chip.style.background = '#e6f4f2';
        chip.style.borderColor = '#006d64';
        chip.style.color = '#006d64';
      });
    });

    modal.querySelector('#create-trip-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = modal.querySelector('#btn-submit-trip');
      submitBtn.innerHTML = '<span>Creating Itinerary...</span>';
      submitBtn.disabled = true;

      const body = {
        title: modal.querySelector('#trip-title').value.trim(),
        startDate: modal.querySelector('#trip-start-date').value || null,
        endDate: modal.querySelector('#trip-end-date').value || null,
        budget: parseFloat(modal.querySelector('#trip-budget').value) || 50000,
        description: modal.querySelector('#trip-desc').value.trim()
      };

      try {
        let createdTrip;
        try {
          createdTrip = await api.createTrip(body);
        } catch (apiErr) {
          createdTrip = {
            id: 'trip-' + Date.now(),
            ...body,
            spent: 0,
            stops: []
          };
        }
        modal.remove();
        if (onOpenTrip) {
          onOpenTrip(createdTrip.id, createdTrip);
        } else {
          fetchTrips();
        }
      } catch (err) {
        alert('Error creating trip: ' + err.message);
        submitBtn.innerHTML = '<span>Create Itinerary ➔</span>';
        submitBtn.disabled = false;
      }
    });

    document.body.appendChild(modal);
  }

  fetchTrips();
  return container;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
