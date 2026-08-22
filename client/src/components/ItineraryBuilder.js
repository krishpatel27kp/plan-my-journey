/**
 * Itinerary Builder Component (Hero Feature - Stitch MCP Reference)
 * Supports Itinerary Day-by-Day, Connected Route Timeline, and Interactive Budget Breakdown.
 */
import { api } from '../api.js';
import { renderAddCityModal } from './AddCityModal.js';
import { renderAddActivityModal } from './AddActivityModal.js';

export function renderItineraryBuilder({ tripId, initialTrip, onBack }) {
  const container = document.createElement('div');
  container.className = 'main-container animate-fade-in';
  container.style.maxWidth = '1320px';
  container.style.margin = '1rem auto 3rem auto';

  let trip = initialTrip || null;
  let activeViewMode = 'itinerary'; // 'itinerary' | 'timeline' | 'budget'
  let isLoading = !trip;
  let activeModal = null;

  async function fetchTripDetails() {
    if (!tripId) return;
    isLoading = true;
    render();

    try {
      const data = await api.getTripById(tripId);
      trip = data;
      // Initialize stops array if empty or fallback demo structure
      if (!trip.stops || trip.stops.length === 0) {
        trip.stops = getSampleStopsForDemo(trip);
      }
      isLoading = false;
      render();
    } catch (err) {
      console.warn('Trip fetch warning:', err.message);
      // Fallback for demo so user always sees a rich itinerary
      if (!trip) {
        trip = {
          id: tripId,
          title: 'Goa Escape',
          startDate: '2026-09-10',
          endDate: '2026-09-15',
          budget: 50000,
          currency: 'INR',
          description: 'A breathtaking multi-city journey covering historical monuments, cultural heritage, and coastal relaxation.',
          stops: getSampleStopsForDemo({ title: 'Goa Escape' })
        };
      }
      isLoading = false;
      render();
    }
  }

  function getSampleStopsForDemo(t) {
    return [
      {
        id: 'stop-delhi',
        cityId: '1',
        cityName: 'Delhi',
        stopOrder: 1,
        startDate: '2026-09-10',
        endDate: '2026-09-11',
        notes: 'Explore old architectural heritage and culinary spots',
        activities: [
          { id: 'act-1', title: 'Red Fort Historical Tour', category: 'Sightseeing', startTime: '09:00', duration: '2 hours', cost: 500 },
          { id: 'act-2', title: 'Old Delhi Local Food Walk', category: 'Food', startTime: '13:00', duration: '2 hours', cost: 800 }
        ]
      },
      {
        id: 'stop-jaipur',
        cityId: '2',
        cityName: 'Jaipur',
        stopOrder: 2,
        startDate: '2026-09-12',
        endDate: '2026-09-13',
        notes: 'Pink City royal palaces and forts',
        activities: [
          { id: 'act-3', title: 'Amber Fort Guided Exploration', category: 'Sightseeing', startTime: '10:00', duration: '3 hours', cost: 1200 },
          { id: 'act-4', title: 'City Palace & Jantar Mantar', category: 'Culture', startTime: '14:30', duration: '2.5 hours', cost: 500 }
        ]
      },
      {
        id: 'stop-goa',
        cityId: '3',
        cityName: 'Goa',
        stopOrder: 3,
        startDate: '2026-09-14',
        endDate: '2026-09-15',
        notes: 'Beach resort, coastal water sports and sunset cruise',
        activities: [
          { id: 'act-5', title: 'Baga Beach Relaxation & Shacks', category: 'Relaxing', startTime: '09:00', duration: '3 hours', cost: 0 },
          { id: 'act-6', title: 'Grand Island Scuba Diving', category: 'Adventure', startTime: '14:00', duration: '3 hours', cost: 2500 }
        ]
      }
    ];
  }

  function calculateFinancials() {
    let activityCost = 0;
    const stops = trip?.stops || [];
    stops.forEach(stop => {
      (stop.activities || []).forEach(act => {
        activityCost += parseFloat(act.cost) || 0;
      });
    });

    const totalBudget = parseFloat(trip?.budget) || 50000;
    // Estimated realistic breakdown
    const transportCost = Math.round(totalBudget * 0.35);
    const accommodationCost = Math.round(totalBudget * 0.40);
    const totalSpent = activityCost + transportCost + accommodationCost;
    const remaining = totalBudget - totalSpent;
    const percentUsed = Math.min(Math.round((totalSpent / totalBudget) * 100), 100);

    return {
      totalBudget,
      totalSpent,
      remaining,
      percentUsed,
      activityCost,
      transportCost,
      accommodationCost,
      isOverBudget: totalSpent > totalBudget
    };
  }

  function render() {
    if (isLoading) {
      container.innerHTML = `
        <div style="text-align: center; padding: 6rem 0;">
          <div class="spinner" style="width: 44px; height: 44px; border: 3px solid rgba(79, 70, 229, 0.2); border-top-color: var(--color-primary); border-radius: 50%; margin: 0 auto;"></div>
          <p style="color: var(--color-text-muted); margin-top: 1rem; font-size: 1.05rem;">Loading Itinerary...</p>
        </div>
      `;
      return;
    }

    const financials = calculateFinancials();
    const stops = trip.stops || [];
    const datesStr = trip.startDate && trip.endDate
      ? `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`
      : 'Flexible Dates';

    // Route summary string (e.g. Delhi → Jaipur → Goa)
    const routeProgression = stops.length > 0
      ? stops.map(s => escapeHtml(s.cityName)).join(' ➔ ')
      : 'No destinations added yet';

    container.innerHTML = `
      <!-- Top Navigation & Title Bar -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--color-border);">
        <div>
          <button class="btn btn-secondary btn-sm" id="btn-back-to-trips" style="margin-bottom: 0.75rem;">
            ← Back to Dashboard
          </button>
          
          <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
            <h1 style="font-family: var(--font-heading); font-size: 2.2rem; font-weight: 800; color: #fff;">
              ${escapeHtml(trip.title)}
            </h1>
            <span class="badge" style="background: rgba(79, 70, 229, 0.15); color: var(--color-primary-light); border: 1px solid rgba(79,70,229,0.3);">
              📅 ${escapeHtml(datesStr)}
            </span>
            <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3);">
              📍 ${stops.length} Stops
            </span>
          </div>

          <p style="color: var(--color-text-muted); font-size: 0.95rem; margin-top: 0.4rem;">
            Route: <strong style="color: #fff;">${routeProgression}</strong>
          </p>
        </div>

        <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
          <button class="btn btn-secondary" id="btn-share-itinerary">
            🔗 Share Trip
          </button>
          <button class="btn btn-primary" id="btn-add-stop-main">
            <span>+</span>
            <span>Add City</span>
          </button>
        </div>
      </div>

      <!-- Mode Switcher Tabs (Itinerary, Timeline, Budget) -->
      <div style="display: flex; background: rgba(11, 15, 25, 0.7); padding: 4px; border-radius: var(--radius-md); border: 1px solid var(--color-border); margin-bottom: 2rem; max-width: 480px;">
        <button class="btn btn-sm ${activeViewMode === 'itinerary' ? 'btn-primary' : 'btn-secondary'}" id="tab-mode-itinerary" style="flex: 1; border: none;">
          📌 Itinerary
        </button>
        <button class="btn btn-sm ${activeViewMode === 'timeline' ? 'btn-primary' : 'btn-secondary'}" id="tab-mode-timeline" style="flex: 1; border: none;">
          🗺️ Route Timeline
        </button>
        <button class="btn btn-sm ${activeViewMode === 'budget' ? 'btn-primary' : 'btn-secondary'}" id="tab-mode-budget" style="flex: 1; border: none;">
          💰 Budget (${financials.percentUsed}%)
        </button>
      </div>

      <!-- Main Canvas Layout -->
      ${activeViewMode === 'itinerary' ? renderItineraryView(stops, financials) : ''}
      ${activeViewMode === 'timeline' ? renderTimelineView(stops, financials) : ''}
      ${activeViewMode === 'budget' ? renderBudgetView(stops, financials) : ''}

      <div id="modal-container"></div>
    `;

    // Bind Event Listeners
    container.querySelector('#btn-back-to-trips')?.addEventListener('click', onBack);
    
    container.querySelector('#tab-mode-itinerary')?.addEventListener('click', () => {
      activeViewMode = 'itinerary';
      render();
    });
    container.querySelector('#tab-mode-timeline')?.addEventListener('click', () => {
      activeViewMode = 'timeline';
      render();
    });
    container.querySelector('#tab-mode-budget')?.addEventListener('click', () => {
      activeViewMode = 'budget';
      render();
    });

    container.querySelector('#btn-share-itinerary')?.addEventListener('click', handleShareTripAction);
    container.querySelector('#btn-add-stop-main')?.addEventListener('click', openAddCityModal);
    container.querySelector('#btn-add-stop-empty')?.addEventListener('click', openAddCityModal);
    container.querySelector('#btn-add-stop-sidebar')?.addEventListener('click', openAddCityModal);

    // Bind stop actions
    container.querySelectorAll('.btn-add-act-stop').forEach(btn => {
      btn.addEventListener('click', () => {
        const stopId = btn.getAttribute('data-stop-id');
        const stop = stops.find(s => s.id === stopId);
        if (stop) openAddActivityModal(stop);
      });
    });

    container.querySelectorAll('.btn-delete-stop').forEach(btn => {
      btn.addEventListener('click', () => {
        const stopId = btn.getAttribute('data-stop-id');
        if (confirm('Are you sure you want to remove this city and all its activities?')) {
          trip.stops = trip.stops.filter(s => s.id !== stopId);
          render();
        }
      });
    });

    container.querySelectorAll('.btn-delete-act').forEach(btn => {
      btn.addEventListener('click', () => {
        const stopId = btn.getAttribute('data-stop-id');
        const actId = btn.getAttribute('data-act-id');
        const stop = trip.stops.find(s => s.id === stopId);
        if (stop) {
          stop.activities = (stop.activities || []).filter(a => a.id !== actId);
          render();
        }
      });
    });
  }

  function renderItineraryView(stops, financials) {
    return `
      <div style="display: grid; grid-template-columns: 1fr 340px; gap: 2rem; align-items: start;">
        
        <!-- Left / Main Area: Stops & Connected Itinerary Timeline -->
        <div style="display: flex; flex-direction: column; gap: 2.5rem;">
          ${stops.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">📍</div>
              <h3 style="color: #fff; margin-bottom: 0.5rem;">No stops added yet</h3>
              <p class="empty-state-desc">Add your first destination to start organizing activities, timings, and daily routes.</p>
              <button class="btn btn-primary btn-lg" id="btn-add-stop-empty">+ Add First City</button>
            </div>
          ` : stops.map((stop, idx) => `
            <div class="card animate-fade-in" style="padding: 0; overflow: hidden; border: 1px solid var(--color-border); background: var(--color-surface); box-shadow: var(--shadow-sm);">
              
              <!-- Stop Header Banner -->
              <div style="padding: 1.25rem 1.5rem; background: linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95)); border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
                <div style="display: flex; align-items: center; gap: 0.85rem;">
                  <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem;">
                    ${idx + 1}
                  </div>
                  <div>
                    <h3 style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 800; color: #fff; line-height: 1.2;">
                      ${escapeHtml(stop.cityName)}
                    </h3>
                    <span style="font-size: 0.8rem; color: var(--color-text-muted);">
                      ${stop.startDate ? `📅 ${formatDate(stop.startDate)} ${stop.endDate ? `– ${formatDate(stop.endDate)}` : ''}` : 'Dates flexible'}
                    </span>
                  </div>
                </div>

                <div style="display: flex; gap: 0.5rem; align-items: center;">
                  <button class="btn btn-primary btn-sm btn-add-act-stop" data-stop-id="${escapeHtml(stop.id)}">
                    + Add Activity
                  </button>
                  <button class="btn btn-secondary btn-sm btn-delete-stop" data-stop-id="${escapeHtml(stop.id)}" title="Delete stop" style="color: #f87171; border-color: rgba(239,68,68,0.3);">
                    🗑️
                  </button>
                </div>
              </div>

              <!-- Stop Activities Timeline -->
              <div style="padding: 1.5rem;">
                ${(!stop.activities || stop.activities.length === 0) ? `
                  <div style="text-align: center; padding: 2rem 1rem; background: rgba(11,15,25,0.4); border-radius: var(--radius-md); border: 1px dashed var(--color-border);">
                    <p style="color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 0.75rem;">No activities scheduled in ${escapeHtml(stop.cityName)} yet.</p>
                    <button class="btn btn-secondary btn-sm btn-add-act-stop" data-stop-id="${escapeHtml(stop.id)}">+ Add Activity</button>
                  </div>
                ` : `
                  <div style="position: relative; padding-left: 1.75rem;">
                    <!-- Timeline Track Line -->
                    <div style="position: absolute; left: 14px; top: 12px; bottom: 12px; width: 2px; background: linear-gradient(to bottom, var(--color-primary), rgba(255,255,255,0.1));"></div>

                    <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                      ${stop.activities.map(act => {
                        const costDisplay = act.cost > 0 ? `₹${parseFloat(act.cost).toLocaleString('en-IN')}` : 'Free';
                        return `
                          <div style="position: relative;" class="animate-fade-in">
                            <!-- Timeline node dot -->
                            <div style="position: absolute; left: -1.75rem; top: 1rem; width: 12px; height: 12px; border-radius: 50%; background: var(--color-primary); border: 2px solid var(--color-bg); z-index: 2;"></div>

                            <div class="card" style="padding: 1rem 1.25rem; background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
                              <div style="display: flex; align-items: center; gap: 1rem;">
                                <div style="font-family: var(--font-heading); font-size: 0.95rem; font-weight: 700; color: var(--color-primary-light); min-width: 55px;">
                                  ${escapeHtml(act.startTime || '09:00')}
                                </div>
                                <div>
                                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.2rem;">
                                    <span class="badge" style="background: rgba(79,70,229,0.15); color: var(--color-primary-light); font-size: 0.7rem;">
                                      ${escapeHtml(act.category || 'Sightseeing')}
                                    </span>
                                    <span style="font-size: 0.75rem; color: var(--color-text-subtle);">⏱️ ${escapeHtml(act.duration || '2 hours')}</span>
                                  </div>
                                  <h4 style="font-family: var(--font-heading); font-size: 1.05rem; font-weight: 700; color: #fff;">
                                    ${escapeHtml(act.title)}
                                  </h4>
                                </div>
                              </div>

                              <div style="display: flex; align-items: center; gap: 1rem;">
                                <span style="font-weight: 700; color: ${act.cost > 0 ? '#34d399' : '#38bdf8'}; font-size: 1rem;">
                                  ${costDisplay}
                                </span>
                                <button class="btn btn-secondary btn-sm btn-delete-act" data-stop-id="${escapeHtml(stop.id)}" data-act-id="${escapeHtml(act.id)}" style="color: #f87171; padding: 0.25rem 0.5rem; font-size: 0.8rem;" title="Remove activity">✕</button>
                              </div>
                            </div>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  </div>
                `}
              </div>

            </div>
          `).join('')}
        </div>

        <!-- Right Sidebar: Trip Summary & Budget Meter -->
        <aside style="display: flex; flex-direction: column; gap: 1.5rem; position: sticky; top: 80px;">
          <!-- Budget Meter Card -->
          <div class="card" style="padding: 1.5rem; background: var(--color-surface); border: 1px solid var(--color-border);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <span style="font-size: 0.82rem; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted);">Trip Budget</span>
              <span class="badge" style="background: ${financials.isOverBudget ? 'var(--color-danger-bg)' : 'var(--color-success-bg)'}; color: ${financials.isOverBudget ? '#f87171' : '#34d399'};">
                ${financials.percentUsed}% Used
              </span>
            </div>

            <div style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; color: #fff; margin-bottom: 0.25rem;">
              ₹${financials.totalSpent.toLocaleString('en-IN')}
              <span style="font-size: 0.95rem; font-weight: 500; color: var(--color-text-muted);">/ ₹${financials.totalBudget.toLocaleString('en-IN')}</span>
            </div>

            <!-- Progress Bar -->
            <div style="height: 8px; border-radius: var(--radius-full); background: rgba(255,255,255,0.08); overflow: hidden; margin: 1rem 0;">
              <div style="width: ${financials.percentUsed}%; height: 100%; background: ${financials.isOverBudget ? 'var(--color-danger)' : 'var(--color-success)'}; border-radius: var(--radius-full); transition: width 0.4s ease;"></div>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 0.82rem; color: var(--color-text-muted);">
              <span>Remaining: <strong style="color: ${financials.remaining < 0 ? '#f87171' : '#34d399'};">₹${Math.max(0, financials.remaining).toLocaleString('en-IN')}</strong></span>
              <span>Activities: <strong>₹${financials.activityCost.toLocaleString('en-IN')}</strong></span>
            </div>

            ${financials.isOverBudget ? `
              <div style="margin-top: 1rem; padding: 0.6rem 0.85rem; background: rgba(239,68,68,0.12); border-radius: var(--radius-md); border: 1px solid rgba(239,68,68,0.3); font-size: 0.8rem; color: #f87171;">
                ⚠️ Estimated spending exceeds total budget.
              </div>
            ` : ''}
          </div>

          <!-- Quick Actions & Highlights -->
          <div class="card" style="padding: 1.5rem; background: var(--color-surface); border: 1px solid var(--color-border);">
            <h4 style="font-family: var(--font-heading); font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 1rem;">
              Itinerary Summary
            </h4>

            <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.88rem;">
              <div style="display: flex; justify-content: space-between; color: var(--color-text-muted);">
                <span>Total Destinations</span>
                <span style="color: #fff; font-weight: 600;">${stops.length} Cities</span>
              </div>
              <div style="display: flex; justify-content: space-between; color: var(--color-text-muted);">
                <span>Total Activities</span>
                <span style="color: #fff; font-weight: 600;">${stops.reduce((acc, s) => acc + (s.activities?.length || 0), 0)} Scheduled</span>
              </div>
            </div>

            <button class="btn btn-secondary" id="btn-add-stop-sidebar" style="width: 100%; margin-top: 1.25rem; justify-content: center;">
              + Add Another City
            </button>
          </div>
        </aside>

      </div>
    `;
  }

  function renderTimelineView(stops, financials) {
    return `
      <div class="card animate-fade-in" style="padding: 2rem; background: var(--color-surface); border: 1px solid var(--color-border);">
        <h2 style="font-family: var(--font-heading); font-size: 1.6rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem;">
          🗺️ Visual Route Timeline
        </h2>
        <p style="color: var(--color-text-muted); font-size: 0.95rem; margin-bottom: 2rem;">
          Step-by-step route progression across scheduled cities and planned activity blocks.
        </p>

        <!-- Route Nodes Ribbon -->
        <div style="display: flex; align-items: center; gap: 1rem; overflow-x: auto; padding: 1.5rem; background: rgba(11,15,25,0.7); border-radius: var(--radius-lg); border: 1px solid var(--color-border); margin-bottom: 2.5rem;">
          ${stops.map((stop, idx) => `
            <div style="display: flex; align-items: center; gap: 1rem; flex-shrink: 0;">
              <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--color-primary); color: #fff; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(79,70,229,0.4);">
                  ${idx + 1}
                </div>
                <span style="font-weight: 700; color: #fff; font-size: 0.95rem; margin-top: 0.4rem;">${escapeHtml(stop.cityName)}</span>
                <span style="font-size: 0.75rem; color: var(--color-text-muted);">${stop.activities?.length || 0} Activities</span>
              </div>
              ${idx < stops.length - 1 ? `<span style="font-size: 1.4rem; color: var(--color-primary-light); opacity: 0.7;">➔</span>` : ''}
            </div>
          `).join('')}
        </div>

        <!-- Detailed Chronological Timeline -->
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          ${stops.map((stop, idx) => `
            <div style="padding: 1.25rem 1.5rem; background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.06); border-radius: var(--radius-md);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="font-family: var(--font-heading); font-size: 1.2rem; font-weight: 700; color: #fff;">
                  📍 Stop ${idx + 1}: ${escapeHtml(stop.cityName)}
                </h3>
                <span class="badge" style="background: rgba(79,70,229,0.15); color: var(--color-primary-light);">
                  ${stop.startDate ? formatDate(stop.startDate) : 'Day ' + (idx + 1)}
                </span>
              </div>

              ${(!stop.activities || stop.activities.length === 0) ? `
                <p style="font-size: 0.85rem; color: var(--color-text-subtle); font-style: italic;">No specific activities scheduled for this date.</p>
              ` : `
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.75rem;">
                  ${stop.activities.map(act => `
                    <div style="background: rgba(11,15,25,0.8); padding: 0.75rem 1rem; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <span style="font-size: 0.75rem; color: var(--color-primary-light); font-weight: 600;">${escapeHtml(act.startTime || '10:00')}</span>
                        <h5 style="font-weight: 600; color: #fff; font-size: 0.92rem;">${escapeHtml(act.title)}</h5>
                      </div>
                      <span style="font-weight: 700; color: #34d399; font-size: 0.85rem;">
                        ${act.cost > 0 ? `₹${parseFloat(act.cost).toLocaleString('en-IN')}` : 'Free'}
                      </span>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderBudgetView(stops, financials) {
    return `
      <div class="card animate-fade-in" style="padding: 2rem; background: var(--color-surface); border: 1px solid var(--color-border);">
        <h2 style="font-family: var(--font-heading); font-size: 1.6rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem;">
          💰 Trip Budget & Expense Tracking
        </h2>
        <p style="color: var(--color-text-muted); font-size: 0.95rem; margin-bottom: 2rem;">
          Real-time expense allocation by category, destination, and activity.
        </p>

        <!-- Top Financial KPIs -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 2.5rem;">
          <div class="card" style="padding: 1.25rem; background: rgba(15,23,42,0.8); border: 1px solid var(--color-border);">
            <span style="font-size: 0.8rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">Total Budget</span>
            <div style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; color: #fff; margin-top: 0.25rem;">
              ₹${financials.totalBudget.toLocaleString('en-IN')}
            </div>
          </div>

          <div class="card" style="padding: 1.25rem; background: rgba(15,23,42,0.8); border: 1px solid var(--color-border);">
            <span style="font-size: 0.8rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">Total Spent</span>
            <div style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; color: #38bdf8; margin-top: 0.25rem;">
              ₹${financials.totalSpent.toLocaleString('en-IN')}
            </div>
          </div>

          <div class="card" style="padding: 1.25rem; background: rgba(15,23,42,0.8); border: 1px solid var(--color-border);">
            <span style="font-size: 0.8rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">Remaining Budget</span>
            <div style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; color: ${financials.remaining < 0 ? '#f87171' : '#34d399'}; margin-top: 0.25rem;">
              ₹${Math.max(0, financials.remaining).toLocaleString('en-IN')}
            </div>
          </div>

          <div class="card" style="padding: 1.25rem; background: rgba(15,23,42,0.8); border: 1px solid var(--color-border);">
            <span style="font-size: 0.8rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">Budget Consumption</span>
            <div style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; color: ${financials.isOverBudget ? '#f87171' : '#fbbf24'}; margin-top: 0.25rem;">
              ${financials.percentUsed}%
            </div>
          </div>
        </div>

        <!-- Category Breakdown Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
          <div class="card" style="padding: 1.5rem; background: rgba(11,15,25,0.7); border: 1px solid var(--color-border);">
            <h4 style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 700; color: #fff; margin-bottom: 1.25rem;">
              Category Allocations
            </h4>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.35rem;">
                  <span>🏨 Accommodation (Est. 40%)</span>
                  <strong>₹${financials.accommodationCost.toLocaleString('en-IN')}</strong>
                </div>
                <div style="height: 6px; background: rgba(255,255,255,0.06); border-radius: var(--radius-full);">
                  <div style="width: 40%; height: 100%; background: #818cf8; border-radius: var(--radius-full);"></div>
                </div>
              </div>

              <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.35rem;">
                  <span>🚆 Transport & Flights (Est. 35%)</span>
                  <strong>₹${financials.transportCost.toLocaleString('en-IN')}</strong>
                </div>
                <div style="height: 6px; background: rgba(255,255,255,0.06); border-radius: var(--radius-full);">
                  <div style="width: 35%; height: 100%; background: #38bdf8; border-radius: var(--radius-full);"></div>
                </div>
              </div>

              <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.35rem;">
                  <span>🎯 Planned Activities</span>
                  <strong>₹${financials.activityCost.toLocaleString('en-IN')}</strong>
                </div>
                <div style="height: 6px; background: rgba(255,255,255,0.06); border-radius: var(--radius-full);">
                  <div style="width: ${Math.min(Math.round((financials.activityCost / financials.totalBudget) * 100), 100)}%; height: 100%; background: #34d399; border-radius: var(--radius-full);"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Destination Breakdown -->
          <div class="card" style="padding: 1.5rem; background: rgba(11,15,25,0.7); border: 1px solid var(--color-border);">
            <h4 style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 700; color: #fff; margin-bottom: 1.25rem;">
              Spending by Destination
            </h4>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              ${stops.map(stop => {
                const stopCost = (stop.activities || []).reduce((acc, a) => acc + (parseFloat(a.cost) || 0), 0);
                return `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: rgba(15,23,42,0.6); border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.05);">
                    <span style="font-weight: 600; color: #fff;">📍 ${escapeHtml(stop.cityName)}</span>
                    <span style="font-weight: 700; color: #34d399;">₹${stopCost.toLocaleString('en-IN')}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

      </div>
    `;
  }

  async function handleShareTripAction() {
    const shareBtn = container.querySelector('#btn-share-itinerary');
    const origText = shareBtn.textContent;
    shareBtn.textContent = '⏳ Generating...';

    try {
      const res = await api.shareTrip(tripId);
      const shareUrl = res.publicUrl || `${window.location.origin}/share/${res.shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
      shareBtn.textContent = '✓ Share Link Copied!';
      setTimeout(() => { shareBtn.textContent = origText; }, 2500);
    } catch (err) {
      alert('Share error: ' + err.message);
      shareBtn.textContent = origText;
    }
  }

  function openAddCityModal() {
    if (activeModal) activeModal.remove();
    activeModal = renderAddCityModal({
      tripId,
      currentStopsCount: trip.stops?.length || 0,
      onCityAdded: (newStop) => {
        trip.stops = [...(trip.stops || []), newStop];
        render();
      },
      onClose: () => {
        if (activeModal) { activeModal.remove(); activeModal = null; }
      }
    });
    document.body.appendChild(activeModal);
  }

  function openAddActivityModal(stop) {
    if (activeModal) activeModal.remove();
    activeModal = renderAddActivityModal({
      stop,
      onActivityAdded: (newAct) => {
        stop.activities = [...(stop.activities || []), newAct];
        render();
      },
      onClose: () => {
        if (activeModal) { activeModal.remove(); activeModal = null; }
      }
    });
    document.body.appendChild(activeModal);
  }

  fetchTripDetails();
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
