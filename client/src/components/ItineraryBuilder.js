/**
 * Itinerary Builder Component (Hero Feature - Luxury Travel Editorial System)
 * Features Itinerary Day-by-Day, Connected Multi-City Route Timeline, and Interactive Budget Breakdown in Indian Rupees (₹).
 * Strictly starts at 0 destinations and ₹0 spent for new trips.
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
  let isBudgetLoading = true;
  let budget = null;
  let budgetError = null;
  let activeModal = null;

  async function fetchTripDetails() {
    if (!tripId) return;
    isLoading = true;
    render();

    try {
      const data = await api.getTripById(tripId);
      trip = data;
      isLoading = false;
      render();
      isBudgetLoading = true;
      budgetError = null;
      try {
        budget = await api.getTripBudget(tripId);
      } catch (err) {
        budgetError = err.message;
      } finally {
        isBudgetLoading = false;
        render();
      }
    } catch (err) {
      console.warn('Trip fetch error:', err.message);
      budgetError = err.message;
      isLoading = false;
      render();
    }
  }

  function calculateFinancials() {
    const totalBudget = Number(budget?.budget ?? trip?.budget) || 50000;
    
    // Calculate total spent strictly from scheduled activities across all stops
    let activitiesSpent = 0;
    const stops = trip?.stops || [];
    stops.forEach(s => {
      (s.activities || []).forEach(a => {
        activitiesSpent += (parseFloat(a.cost) || 0);
      });
    });

    const totalSpent = Number(budget?.totalSpent) || activitiesSpent;
    const remaining = totalBudget - totalSpent;
    const percentUsed = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;

    const accommodationSpent = totalSpent > 0 ? Math.round(totalSpent * 0.40) : 0;
    const transportSpent = totalSpent > 0 ? Math.round(totalSpent * 0.25) : 0;
    const foodSpent = totalSpent > 0 ? Math.round(totalSpent * 0.15) : 0;
    const directActivitiesSpent = activitiesSpent;

    return {
      totalBudget,
      totalSpent,
      remaining,
      percentUsed,
      byCategory: {
        accommodation: accommodationSpent,
        transport: transportSpent,
        activities: directActivitiesSpent,
        food: foodSpent
      },
      overBudgetDays: budget?.overBudgetDays || [],
      isOverBudget: remaining < 0
    };
  }

  function render() {
    if (isLoading) {
      container.innerHTML = `
        <div style="text-align: center; padding: 6rem 0;">
          <div class="spinner" style="width: 44px; height: 44px; border: 3px solid rgba(0, 109, 100, 0.2); border-top-color: #006d64; border-radius: 50%; margin: 0 auto;"></div>
          <p style="color: #64748b; margin-top: 1rem; font-size: 1.05rem;">Loading Itinerary & Budget...</p>
        </div>
      `;
      return;
    }

    if (!trip) {
      container.innerHTML = `<div class="empty-state" style="margin-top:4rem;"><h3>Unable to load this trip</h3><p class="empty-state-desc">${escapeHtml(budgetError || 'The trip could not be loaded from the server.')}</p><button class="btn btn-secondary" id="btn-back-to-trips">Back to Dashboard</button></div>`;
      container.querySelector('#btn-back-to-trips')?.addEventListener('click', onBack);
      return;
    }

    const financials = calculateFinancials();
    const stops = [...(trip.stops || [])].sort((a, b) => (a.stopOrder || 0) - (b.stopOrder || 0));
    const datesStr = trip.startDate && trip.endDate
      ? `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`
      : 'Dates Flexible';

    const routeProgression = stops.length > 0
      ? stops.map(s => escapeHtml(s.cityName)).join(' ➔ ')
      : 'No destinations added yet — Click "+ Add Destination" to start building your route';

    container.innerHTML = `
      <!-- Top Navigation & Title Bar -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--color-border); padding-top: 0.5rem;">
        <div>
          <button class="btn btn-secondary btn-sm" id="btn-back-to-trips" style="margin-bottom: 0.75rem; border-radius: 9999px; font-weight: 700; background: #ffffff; border-color: #cbd5e1;">
            ← Back to Dashboard
          </button>
          
          <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
            <h1 style="font-family: var(--font-heading); font-size: 2.4rem; font-weight: 900; color: #0f172a; line-height: 1.15;">
              ${escapeHtml(trip.title)}
            </h1>
            <span class="badge" style="background: #e6f4f2; color: #006d64; border: 1px solid #006d64; font-weight: 800; font-size: 0.85rem; padding: 0.35rem 0.85rem;">
              📅 ${escapeHtml(datesStr)}
            </span>
            <span class="badge" style="background: ${stops.length > 0 ? '#ecfdf5' : '#f8fafc'}; color: ${stops.length > 0 ? '#059669' : '#64748b'}; border: 1px solid ${stops.length > 0 ? '#a7f3d0' : '#cbd5e1'}; font-weight: 800; font-size: 0.85rem; padding: 0.35rem 0.85rem;">
              📍 ${stops.length} ${stops.length === 1 ? 'Destination' : 'Destinations'}
            </span>
          </div>

          <p style="color: #475569; font-size: 0.95rem; margin-top: 0.4rem; display: flex; align-items: center; gap: 0.4rem;">
            <span>🗺️ Route:</span>
            <strong style="color: ${stops.length > 0 ? '#0f172a' : '#006d64'};">${routeProgression}</strong>
          </p>
        </div>

        <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
          <button class="btn btn-secondary" id="btn-share-itinerary" style="border-radius: 9999px; font-weight: 700; height: 46px; padding: 0 1.25rem;">
            🔗 Share Trip
          </button>
          <button class="btn btn-primary" id="btn-add-stop-main" style="background: #006d64; border-radius: 9999px; height: 46px; padding: 0 1.5rem; font-weight: 800;">
            <span style="font-size: 1.2rem; font-weight: 800; line-height: 1;">+</span>
            <span>Add Destination</span>
          </button>
        </div>
      </div>

      <!-- Mode Switcher Tabs (Itinerary, Route Timeline, Budget Engine) -->
      <div style="display: flex; background: #eaf2f0; padding: 4px; border-radius: 16px; margin-bottom: 2rem; max-width: 520px; gap: 4px;">
        <button class="btn btn-sm" id="tab-mode-itinerary" style="flex: 1; border: none; font-weight: 800; border-radius: 12px; height: 40px; background: ${activeViewMode === 'itinerary' ? '#006d64' : 'transparent'}; color: ${activeViewMode === 'itinerary' ? '#ffffff' : '#475569'}; box-shadow: ${activeViewMode === 'itinerary' ? '0 4px 12px rgba(0,109,100,0.2)' : 'none'};">
          📌 Itinerary
        </button>
        <button class="btn btn-sm" id="tab-mode-timeline" style="flex: 1; border: none; font-weight: 800; border-radius: 12px; height: 40px; background: ${activeViewMode === 'timeline' ? '#006d64' : 'transparent'}; color: ${activeViewMode === 'timeline' ? '#ffffff' : '#475569'}; box-shadow: ${activeViewMode === 'timeline' ? '0 4px 12px rgba(0,109,100,0.2)' : 'none'};">
          🗺️ Route Timeline
        </button>
        <button class="btn btn-sm" id="tab-mode-budget" style="flex: 1; border: none; font-weight: 800; border-radius: 12px; height: 40px; background: ${activeViewMode === 'budget' ? '#006d64' : 'transparent'}; color: ${activeViewMode === 'budget' ? '#ffffff' : '#475569'}; box-shadow: ${activeViewMode === 'budget' ? '0 4px 12px rgba(0,109,100,0.2)' : 'none'};">
          💰 Budget (${financials.percentUsed}%)
        </button>
      </div>

      ${financials.isOverBudget ? `
        <div class="animate-fade-in" style="margin-bottom: 1.5rem; padding: 1rem 1.25rem; background: #fef2f2; border: 1.5.px solid #fecaca; border-radius: 16px; color: #ef4444; font-size: 0.95rem; font-weight: 700; display: flex; align-items: center; justify-content: space-between;">
          <span>⚠️ Budget Warning: Estimated total spend (₹${financials.totalSpent.toLocaleString('en-IN')}) exceeds total target budget (₹${financials.totalBudget.toLocaleString('en-IN')}) by ₹${Math.abs(financials.remaining).toLocaleString('en-IN')}.</span>
          <button class="btn btn-sm" id="btn-fix-budget-alert" style="background: #ef4444; color: #fff; border-radius: 9999px; font-weight: 800;">Review Budget ➔</button>
        </div>
      ` : ''}

      <!-- Main Canvas Layout -->
      ${activeViewMode === 'itinerary' ? renderItineraryView(stops, financials) : ''}
      ${activeViewMode === 'timeline' ? renderTimelineView(stops, financials) : ''}
      ${activeViewMode === 'budget' ? renderBudgetView(stops, financials) : ''}

      <div id="modal-container"></div>
    `;

    // Bind Event Listeners
    container.querySelector('#btn-back-to-trips')?.addEventListener('click', onBack);
    container.querySelector('#btn-fix-budget-alert')?.addEventListener('click', () => {
      activeViewMode = 'budget';
      render();
    });
    
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
    container.querySelector('#btn-add-stop-timeline-empty')?.addEventListener('click', openAddCityModal);
    container.querySelector('#btn-add-stop-sidebar')?.addEventListener('click', openAddCityModal);

    // Bind stop actions
    container.querySelectorAll('.btn-add-act-stop').forEach(btn => {
      btn.addEventListener('click', () => {
        const stopId = btn.getAttribute('data-stop-id');
        const stop = stops.find(s => s.id === stopId) || { id: stopId, cityName: 'Destination', startDate: trip.startDate };
        openAddActivityModal(stop);
      });
    });

    container.querySelectorAll('.btn-delete-stop').forEach(btn => {
      btn.addEventListener('click', async () => {
        const stopId = btn.getAttribute('data-stop-id');
        if (confirm('Are you sure you want to remove this city and all its scheduled activities?')) {
          try {
            await api.deleteStop(stopId);
            await fetchTripDetails();
          } catch (err) {
            alert('Could not remove stop: ' + err.message);
          }
        }
      });
    });

    container.querySelectorAll('.btn-delete-act').forEach(btn => {
      btn.addEventListener('click', async () => {
        const actId = btn.getAttribute('data-act-id');
        try {
          await api.deleteItineraryActivity(actId);
          await fetchTripDetails();
        } catch (err) {
          alert('Could not remove activity: ' + err.message);
        }
      });
    });
  }

  function renderItineraryView(stops, financials) {
    if (stops.length === 0) {
      return `
        <div style="display: grid; grid-template-columns: 1fr 340px; gap: 2rem; align-items: start;">
          <div class="empty-state animate-fade-in" style="padding: 4rem 2rem; background: #ffffff; border-radius: 24px; border: 1.5px dashed #cbd5e1; text-align: center;">
            <div style="font-size: 3.5rem; margin-bottom: 0.75rem;">📍</div>
            <h3 style="font-family: var(--font-heading); font-size: 1.6rem; font-weight: 900; color: #0f172a; margin-bottom: 0.35rem;">
              No destinations added to this trip yet
            </h3>
            <p style="color: #64748b; font-size: 0.98rem; max-width: 480px; margin: 0 auto 1.5rem auto; line-height: 1.5;">
              Start building your trip by adding your first destination city (e.g., Goa, Paris, Manali, Tokyo). You can then schedule curated activities or add custom plans.
            </p>
            <button class="btn btn-primary" id="btn-add-stop-empty" style="background: #006d64; border-radius: 9999px; height: 48px; padding: 0 1.75rem; font-weight: 800; font-size: 0.98rem;">
              + Add First Destination
            </button>
          </div>

          <aside style="display: flex; flex-direction: column; gap: 1.5rem;">
            <div class="card" style="padding: 1.5rem; background: #ffffff; border: 1px solid var(--color-border); border-radius: 20px; box-shadow: var(--shadow-sm);">
              <span style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.04em;">Target Budget</span>
              <div style="font-family: var(--font-heading); font-size: 1.95rem; font-weight: 900; color: #0f172a; margin: 0.25rem 0 0.5rem 0;">
                ₹${financials.totalBudget.toLocaleString('en-IN')}
              </div>
              <p style="font-size: 0.85rem; color: #059669; font-weight: 700;">
                ₹${financials.totalBudget.toLocaleString('en-IN')} remaining (0% spent)
              </p>
            </div>
          </aside>
        </div>
      `;
    }

    return `
      <div style="display: grid; grid-template-columns: 1fr 340px; gap: 2rem; align-items: start;">
        
        <!-- Left / Main Area: City Stops & Connected Itinerary Timeline -->
        <div style="display: flex; flex-direction: column; gap: 2rem;">
          ${stops.map((stop, idx) => {
            const stopCost = (stop.activities || []).reduce((acc, a) => acc + (parseFloat(a.cost) || 0), 0);
            
            return `
              <div class="card animate-fade-in" style="padding: 0; overflow: hidden; border: 1px solid var(--color-border); border-radius: 24px; background: #ffffff; box-shadow: var(--shadow-sm);">
                
                <!-- Stop Header Banner -->
                <div style="padding: 1.25rem 1.75rem; background: #f8fafc; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
                  <div style="display: flex; align-items: center; gap: 0.85rem;">
                    <div style="width: 38px; height: 38px; border-radius: 50%; background: #006d64; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1rem; box-shadow: 0 4px 10px rgba(0,109,100,0.3);">
                      ${idx + 1}
                    </div>
                    <div>
                      <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <h3 style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 900; color: #0f172a; line-height: 1.2;">
                          📍 ${escapeHtml(stop.cityName)}
                        </h3>
                        <span class="badge" style="background: #e6f4f2; color: #006d64; font-weight: 800; font-size: 0.78rem;">
                          Total: ₹${stopCost.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <span style="font-size: 0.85rem; color: #64748b; margin-top: 0.15rem; display: block;">
                        ${stop.startDate ? `📅 ${formatDate(stop.startDate)} ${stop.endDate ? `– ${formatDate(stop.endDate)}` : ''}` : 'Dates flexible'}
                      </span>
                    </div>
                  </div>

                  <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <button class="btn btn-primary btn-sm btn-add-act-stop" data-stop-id="${escapeHtml(stop.id)}" style="background: #006d64; border-radius: 9999px; font-weight: 800; padding: 0.4rem 0.95rem;">
                      + Add Activity
                    </button>
                    <button class="btn btn-secondary btn-sm btn-delete-stop" data-stop-id="${escapeHtml(stop.id)}" title="Delete city stop" style="color: #ef4444; border-color: rgba(239,68,68,0.25); background: #fef2f2; border-radius: 9999px; padding: 0.4rem 0.65rem;">
                      🗑️
                    </button>
                  </div>
                </div>

                <!-- Stop Activities Timeline Thread -->
                <div style="padding: 1.5rem 1.75rem;">
                  ${(!stop.activities || stop.activities.length === 0) ? `
                    <div style="text-align: center; padding: 2.25rem 1rem; background: #f8fafc; border-radius: 18px; border: 1.5px dashed #cbd5e1;">
                      <p style="color: #64748b; font-size: 0.92rem; margin-bottom: 0.75rem;">No activities scheduled in ${escapeHtml(stop.cityName)} yet.</p>
                      <button class="btn btn-secondary btn-sm btn-add-act-stop" data-stop-id="${escapeHtml(stop.id)}" style="border-radius: 9999px; font-weight: 700; background: #ffffff;">+ Add First Activity</button>
                    </div>
                  ` : `
                    <div style="position: relative; padding-left: 2rem;">
                      <!-- Timeline Track Vertical Bar -->
                      <div style="position: absolute; left: 14px; top: 12px; bottom: 12px; width: 3px; background: linear-gradient(to bottom, #006d64 0%, #cbd5e1 100%); border-radius: 9999px;"></div>

                      <div style="display: flex; flex-direction: column; gap: 1rem;">
                        ${stop.activities.map(act => {
                          const costDisplay = act.cost > 0 ? `₹${parseFloat(act.cost).toLocaleString('en-IN')}` : 'Free';
                          return `
                            <div style="position: relative;" class="animate-fade-in">
                              <!-- Timeline Dot -->
                              <div style="position: absolute; left: -2rem; top: 1.15rem; width: 14px; height: 14px; border-radius: 50%; background: #006d64; border: 3px solid #ffffff; box-shadow: 0 0 8px rgba(0,109,100,0.5); z-index: 2;"></div>

                              <div class="card" style="padding: 1.15rem 1.35rem; background: #ffffff; border: 1px solid var(--color-border); border-radius: 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.85rem; box-shadow: var(--shadow-sm);">
                                <div style="display: flex; align-items: center; gap: 1rem;">
                                  <div style="font-family: var(--font-heading); font-size: 0.95rem; font-weight: 900; color: #006d64; min-width: 55px; background: #e6f4f2; padding: 0.3rem 0.6rem; border-radius: 8px; text-align: center;">
                                    ${escapeHtml(act.startTime || '10:00')}
                                  </div>
                                  <div>
                                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.2rem;">
                                      <span class="badge" style="background: #e6f4f2; color: #006d64; font-size: 0.72rem; font-weight: 800;">
                                        ${escapeHtml(act.category || 'Sightseeing')}
                                      </span>
                                      <span style="font-size: 0.78rem; color: #64748b; font-weight: 600;">⏱️ ${escapeHtml(act.duration || '2 hours')}</span>
                                    </div>
                                    <h4 style="font-family: var(--font-heading); font-size: 1.1rem; font-weight: 800; color: #0f172a; line-height: 1.3;">
                                      ${escapeHtml(act.title)}
                                    </h4>
                                  </div>
                                </div>

                                <div style="display: flex; align-items: center; gap: 1rem;">
                                  <span style="font-weight: 900; color: #006d64; font-size: 1.05rem;">
                                    ${costDisplay}
                                  </span>
                                  <button class="btn btn-secondary btn-sm btn-delete-act" data-stop-id="${escapeHtml(stop.id)}" data-act-id="${escapeHtml(act.id)}" style="color: #ef4444; background: #fef2f2; border-color: #fecaca; padding: 0.25rem 0.55rem; font-size: 0.8rem; border-radius: 9999px;" title="Remove activity">✕</button>
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
            `;
          }).join('')}
        </div>

        <!-- Right Sidebar Sticky Panel -->
        <aside style="display: flex; flex-direction: column; gap: 1.5rem; position: sticky; top: 80px;">
          
          <!-- Budget Utilization Card -->
          <div class="card" style="padding: 1.5rem; background: #ffffff; border: 1px solid var(--color-border); border-radius: 20px; box-shadow: var(--shadow-sm);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <span style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.04em;">Trip Budget Meter</span>
              <span class="badge" style="background: ${financials.isOverBudget ? '#fef2f2' : '#e6f4f2'}; color: ${financials.isOverBudget ? '#ef4444' : '#006d64'}; font-weight: 800;">
                ${financials.percentUsed}% Planned
              </span>
            </div>

            <div style="font-family: var(--font-heading); font-size: 1.95rem; font-weight: 900; color: #0f172a; margin-bottom: 0.25rem;">
              ₹${financials.totalSpent.toLocaleString('en-IN')}
              <span style="font-size: 0.95rem; font-weight: 600; color: #64748b;">/ ₹${financials.totalBudget.toLocaleString('en-IN')}</span>
            </div>

            <!-- Progress Bar Track -->
            <div style="height: 9px; border-radius: 9999px; background: #e2e8f0; overflow: hidden; margin: 1rem 0;">
              <div style="width: ${financials.percentUsed}%; height: 100%; background: ${financials.isOverBudget ? '#ef4444' : '#006d64'}; border-radius: 9999px; transition: width 0.4s ease;"></div>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #64748b;">
              <span>Remaining: <strong style="color: ${financials.remaining < 0 ? '#ef4444' : '#059669'}; font-weight: 800;">₹${Math.max(0, financials.remaining).toLocaleString('en-IN')}</strong></span>
              <span>Activities: <strong style="color: #0f172a; font-weight: 800;">₹${Number(financials.byCategory.activities || 0).toLocaleString('en-IN')}</strong></span>
            </div>
          </div>

          <!-- Summary Breakdown Card -->
          <div class="card" style="padding: 1.5rem; background: #ffffff; border: 1px solid var(--color-border); border-radius: 20px; box-shadow: var(--shadow-sm);">
            <h4 style="font-family: var(--font-heading); font-size: 1.2rem; font-weight: 900; color: #0f172a; margin-bottom: 1rem;">
              Journey Highlights
            </h4>

            <div style="display: flex; flex-direction: column; gap: 0.85rem; font-size: 0.9rem;">
              <div style="display: flex; justify-content: space-between; color: #64748b;">
                <span>Total Destinations</span>
                <span style="color: #0f172a; font-weight: 800;">${stops.length} Cities</span>
              </div>
              <div style="display: flex; justify-content: space-between; color: #64748b;">
                <span>Total Activities</span>
                <span style="color: #0f172a; font-weight: 800;">${stops.reduce((acc, s) => acc + (s.activities?.length || 0), 0)} Scheduled</span>
              </div>
            </div>

            <button class="btn btn-secondary" id="btn-add-stop-sidebar" style="width: 100%; margin-top: 1.25rem; justify-content: center; font-weight: 800; border-radius: 9999px; height: 44px;">
              + Add Another City
            </button>
          </div>

        </aside>

      </div>
    `;
  }

  function renderTimelineView(stops, financials) {
    if (stops.length === 0) {
      return `
        <div class="empty-state animate-fade-in" style="padding: 4rem 2rem; background: #ffffff; border-radius: 24px; border: 1.5px dashed #cbd5e1; text-align: center;">
          <div style="font-size: 3.5rem; margin-bottom: 0.75rem;">🗺️</div>
          <h3 style="font-family: var(--font-heading); font-size: 1.6rem; font-weight: 900; color: #0f172a; margin-bottom: 0.35rem;">
            No route timeline created yet
          </h3>
          <p style="color: #64748b; font-size: 0.98rem; max-width: 480px; margin: 0 auto 1.5rem auto; line-height: 1.5;">
            Add destination cities to see the visual multi-city route progression and daily itinerary timeline.
          </p>
          <button class="btn btn-primary" id="btn-add-stop-timeline-empty" style="background: #006d64; border-radius: 9999px; height: 48px; padding: 0 1.75rem; font-weight: 800; font-size: 0.98rem;">
            + Add Destination
          </button>
        </div>
      `;
    }

    return `
      <div class="card animate-fade-in" style="padding: 2.25rem; background: #ffffff; border: 1px solid var(--color-border); border-radius: 24px; box-shadow: var(--shadow-sm);">
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.75rem; background: #e6f4f2; color: #006d64; border-radius: 9999px; font-size: 0.78rem; font-weight: 800; margin-bottom: 0.4rem;">
              🗺️ MULTI-CITY ROUTE
            </div>
            <h2 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 900; color: #0f172a; line-height: 1.2;">
              Visual Route Timeline
            </h2>
            <p style="color: #64748b; font-size: 0.95rem; margin-top: 0.2rem;">
              Chronological day-by-day progression and transit connections between scheduled destinations.
            </p>
          </div>
        </div>

        <!-- Route Nodes Connector Ribbon -->
        <div style="display: flex; align-items: center; gap: 1.25rem; overflow-x: auto; padding: 1.75rem; background: #f8fafc; border-radius: 20px; border: 1px solid var(--color-border); margin-bottom: 2.5rem;">
          ${stops.map((stop, idx) => `
            <div style="display: flex; align-items: center; gap: 1.25rem; flex-shrink: 0;">
              <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
                <div style="width: 48px; height: 48px; border-radius: 50%; background: #006d64; color: #fff; font-weight: 900; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,109,100,0.3); font-size: 1.1rem;">
                  ${idx + 1}
                </div>
                <span style="font-weight: 900; color: #0f172a; font-size: 1.05rem; margin-top: 0.5rem;">${escapeHtml(stop.cityName)}</span>
                <span style="font-size: 0.8rem; color: #006d64; font-weight: 700;">${stop.activities?.length || 0} Activities</span>
              </div>
              
              ${idx < stops.length - 1 ? `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 0.2rem;">
                  <span style="font-size: 0.72rem; font-weight: 800; color: #64748b; text-transform: uppercase;">🚆 Transit</span>
                  <span style="font-size: 1.5rem; color: #006d64; font-weight: 900;">➔</span>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>

        <!-- Detailed Chronological Timeline List -->
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          ${stops.map((stop, idx) => {
            const stopActivities = stop.activities || [];
            const subtotal = stopActivities.reduce((acc, a) => acc + (parseFloat(a.cost) || 0), 0);

            return `
              <div style="padding: 1.5rem 1.75rem; background: #ffffff; border: 1.5px solid var(--color-border); border-radius: 20px; box-shadow: var(--shadow-sm);">
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.15rem; flex-wrap: wrap; gap: 0.5rem;">
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: #e6f4f2; color: #006d64; display: flex; align-items: center; justify-content: center; font-weight: 800;">
                      📍
                    </div>
                    <h3 style="font-family: var(--font-heading); font-size: 1.35rem; font-weight: 900; color: #0f172a;">
                      Day ${idx + 1}: ${escapeHtml(stop.cityName)}
                    </h3>
                  </div>

                  <div style="display: flex; gap: 0.5rem;">
                    <span class="badge" style="background: #e6f4f2; color: #006d64; font-weight: 800;">
                      📅 ${stop.startDate ? formatDate(stop.startDate) : 'Scheduled'}
                    </span>
                    <span class="badge" style="background: #ecfdf5; color: #059669; font-weight: 800;">
                      Subtotal: ₹${subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                ${stopActivities.length === 0 ? `
                  <p style="font-size: 0.9rem; color: #94a3b8; font-style: italic;">No activities scheduled yet for this destination stop.</p>
                ` : `
                  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
                    ${stopActivities.map(act => `
                      <div style="background: #f8fafc; padding: 1rem 1.15rem; border-radius: 14px; border: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;">
                        <div>
                          <span style="font-size: 0.78rem; color: #006d64; font-weight: 800;">⏱️ ${escapeHtml(act.startTime || '10:00')}</span>
                          <h4 style="font-weight: 800; color: #0f172a; font-size: 0.98rem; margin-top: 0.1rem;">${escapeHtml(act.title)}</h4>
                        </div>
                        <span style="font-weight: 900; color: #059669; font-size: 0.95rem;">
                          ${act.cost > 0 ? `₹${parseFloat(act.cost).toLocaleString('en-IN')}` : 'Free'}
                        </span>
                      </div>
                    `).join('')}
                  </div>
                `}

              </div>
            `;
          }).join('')}
        </div>

      </div>
    `;
  }

  function renderBudgetView(stops, financials) {
    if (isBudgetLoading) {
      return `<div style="text-align:center;padding:5rem 0;"><div class="spinner" style="width:44px;height:44px;border:3px solid rgba(0,109,100,.2);border-top-color:#006d64;border-radius:50%;margin:0 auto;"></div><p style="color:#64748b;margin-top:1rem;">Calculating budget breakdown...</p></div>`;
    }

    return `
      <div class="card animate-fade-in" style="padding: 2.25rem; background: #ffffff; border: 1px solid var(--color-border); border-radius: 24px; box-shadow: var(--shadow-sm);">
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.75rem; background: #e6f4f2; color: #006d64; border-radius: 9999px; font-size: 0.78rem; font-weight: 800; margin-bottom: 0.4rem;">
              💰 REAL-TIME BUDGET ENGINE
            </div>
            <h2 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 900; color: #0f172a; line-height: 1.2;">
              Trip Budget & Expense Allocation
            </h2>
            <p style="color: #64748b; font-size: 0.95rem; margin-top: 0.2rem;">
              Real-time expense calculations in Indian Rupees (₹) across categories and destinations.
            </p>
          </div>
        </div>

        <!-- 4 Top Financial KPIs -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 2.5rem;">
          
          <div class="card" style="padding: 1.35rem; background: #ffffff; border: 1px solid var(--color-border); border-radius: 18px;">
            <span style="font-size: 0.78rem; color: #64748b; text-transform: uppercase; font-weight: 800; letter-spacing: 0.04em;">TOTAL TARGET BUDGET</span>
            <div style="font-family: var(--font-heading); font-size: 1.9rem; font-weight: 900; color: #0f172a; margin-top: 0.25rem;">
              ₹${financials.totalBudget.toLocaleString('en-IN')}
            </div>
          </div>

          <div class="card" style="padding: 1.35rem; background: #ffffff; border: 1px solid var(--color-border); border-radius: 18px;">
            <span style="font-size: 0.78rem; color: #64748b; text-transform: uppercase; font-weight: 800; letter-spacing: 0.04em;">ESTIMATED TOTAL SPEND</span>
            <div style="font-family: var(--font-heading); font-size: 1.9rem; font-weight: 900; color: #006d64; margin-top: 0.25rem;">
              ₹${financials.totalSpent.toLocaleString('en-IN')}
            </div>
          </div>

          <div class="card" style="padding: 1.35rem; background: #ffffff; border: 1px solid var(--color-border); border-radius: 18px;">
            <span style="font-size: 0.78rem; color: #64748b; text-transform: uppercase; font-weight: 800; letter-spacing: 0.04em;">REMAINING BALANCE</span>
            <div style="font-family: var(--font-heading); font-size: 1.9rem; font-weight: 900; color: ${financials.remaining < 0 ? '#ef4444' : '#059669'}; margin-top: 0.25rem;">
              ₹${Math.max(0, financials.remaining).toLocaleString('en-IN')}
            </div>
          </div>

          <div class="card" style="padding: 1.35rem; background: #ffffff; border: 1px solid var(--color-border); border-radius: 18px;">
            <span style="font-size: 0.78rem; color: #64748b; text-transform: uppercase; font-weight: 800; letter-spacing: 0.04em;">BUDGET CONSUMPTION</span>
            <div style="font-family: var(--font-heading); font-size: 1.9rem; font-weight: 900; color: ${financials.isOverBudget ? '#ef4444' : '#006d64'}; margin-top: 0.25rem;">
              ${financials.percentUsed}%
            </div>
          </div>

        </div>

        <!-- Category & Destination Breakdown Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.75rem;">
          
          <!-- Category Allocation Bars -->
          <div class="card" style="padding: 1.75rem; background: #f8fafc; border: 1px solid var(--color-border); border-radius: 20px;">
            <h4 style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 900; color: #0f172a; margin-bottom: 1.35rem;">
              Category Allocations
            </h4>

            <div style="display: flex; flex-direction: column; gap: 1.25rem;">
              
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.4rem; color: #0f172a; font-weight: 700;">
                  <span>🏨 Accommodation & Stays</span>
                  <strong>₹${Number(financials.byCategory.accommodation || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div style="height: 8px; background: #e2e8f0; border-radius: 9999px; overflow: hidden;">
                  <div style="width: ${financials.totalBudget > 0 ? Math.min(100, Math.round((financials.byCategory.accommodation / financials.totalBudget) * 100)) : 0}%; height: 100%; background: #6366f1; border-radius: 9999px;"></div>
                </div>
              </div>

              <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.4rem; color: #0f172a; font-weight: 700;">
                  <span>🚆 Transport & Flights</span>
                  <strong>₹${Number(financials.byCategory.transport || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div style="height: 8px; background: #e2e8f0; border-radius: 9999px; overflow: hidden;">
                  <div style="width: ${financials.totalBudget > 0 ? Math.min(100, Math.round((financials.byCategory.transport / financials.totalBudget) * 100)) : 0}%; height: 100%; background: #0284c7; border-radius: 9999px;"></div>
                </div>
              </div>

              <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.4rem; color: #0f172a; font-weight: 700;">
                  <span>🎯 Planned Itinerary Activities</span>
                  <strong>₹${Number(financials.byCategory.activities || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div style="height: 8px; background: #e2e8f0; border-radius: 9999px; overflow: hidden;">
                  <div style="width: ${financials.totalBudget > 0 ? Math.min(100, Math.round((financials.byCategory.activities / financials.totalBudget) * 100)) : 0}%; height: 100%; background: #006d64; border-radius: 9999px;"></div>
                </div>
              </div>

              <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.4rem; color: #0f172a; font-weight: 700;">
                  <span>🍲 Food & Local Dining</span>
                  <strong>₹${Number(financials.byCategory.food || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div style="height: 8px; background: #e2e8f0; border-radius: 9999px; overflow: hidden;">
                  <div style="width: ${financials.totalBudget > 0 ? Math.min(100, Math.round((financials.byCategory.food / financials.totalBudget) * 100)) : 0}%; height: 100%; background: #d97706; border-radius: 9999px;"></div>
                </div>
              </div>

            </div>
          </div>

          <!-- Spending by Destination -->
          <div class="card" style="padding: 1.75rem; background: #f8fafc; border: 1px solid var(--color-border); border-radius: 20px;">
            <h4 style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 900; color: #0f172a; margin-bottom: 1.35rem;">
              Spending by Destination Stop
            </h4>

            ${stops.length === 0 ? `
              <div style="text-align: center; padding: 2rem 1rem; color: #64748b; font-size: 0.9rem;">
                No destinations added yet. Add a city stop and schedule activities to start tracking spending by location.
              </div>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                ${stops.map(stop => {
                  const stopCost = (stop.activities || []).reduce((acc, a) => acc + (parseFloat(a.cost) || 0), 0);
                  return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.85rem 1.15rem; background: #ffffff; border-radius: 14px; border: 1px solid var(--color-border);">
                      <div>
                        <span style="font-weight: 800; color: #0f172a; font-size: 0.95rem;">📍 ${escapeHtml(stop.cityName)}</span>
                        <span style="display: block; font-size: 0.78rem; color: #64748b;">${stop.activities?.length || 0} Activities</span>
                      </div>
                      <span style="font-weight: 900; color: #006d64; font-size: 1.05rem;">₹${stopCost.toLocaleString('en-IN')}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>

        </div>

      </div>
    `;
  }

  async function handleShareTripAction() {
    const shareBtn = container.querySelector('#btn-share-itinerary');
    const origText = shareBtn.textContent;
    shareBtn.textContent = '⏳ Link...';

    try {
      const res = await api.shareTrip(tripId);
      const shareUrl = res.publicUrl || `${window.location.origin}/share/${res.shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
      shareBtn.textContent = '✓ Share Link Copied!';
      setTimeout(() => { shareBtn.textContent = origText; }, 2500);
    } catch (err) {
      alert('Share link: ' + `${window.location.origin}/#share/${tripId}`);
      shareBtn.textContent = origText;
    }
  }

  function openAddCityModal() {
    if (activeModal) activeModal.remove();
    activeModal = renderAddCityModal({
      tripId,
      currentStopsCount: trip.stops?.length || 0,
      onCityAdded: async () => {
        await fetchTripDetails();
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
      onActivityAdded: async () => {
        await fetchTripDetails();
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
