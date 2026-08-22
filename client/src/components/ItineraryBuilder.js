/**
 * Itinerary Builder Component (Hero Feature - Light Editorial Design)
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
    const totalBudget = Number(budget?.budget ?? trip?.budget) || 0;
    const totalSpent = Number(budget?.totalSpent) || 0;
    const remaining = Number(budget?.remaining ?? totalBudget - totalSpent);
    const percentUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    return {
      totalBudget,
      totalSpent,
      remaining,
      percentUsed,
      byCategory: budget?.byCategory || {},
      overBudgetDays: budget?.overBudgetDays || [],
      isOverBudget: remaining < 0 || (budget?.overBudgetDays || []).length > 0
    };
  }

  function render() {
    if (isLoading) {
      container.innerHTML = `
        <div style="text-align: center; padding: 6rem 0;">
          <div class="spinner" style="width: 44px; height: 44px; border: 3px solid rgba(37, 99, 235, 0.2); border-top-color: var(--color-primary); border-radius: 50%; margin: 0 auto;"></div>
          <p style="color: #64748b; margin-top: 1rem; font-size: 1.05rem;">Loading Itinerary...</p>
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
    const stops = trip.stops || [];
    const datesStr = trip.startDate && trip.endDate
      ? `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`
      : 'Flexible Dates';

    const routeProgression = stops.length > 0
      ? stops.map(s => escapeHtml(s.cityName)).join(' ➔ ')
      : 'No destinations added yet';

    container.innerHTML = `
      <!-- Top Navigation & Title Bar -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--color-border); padding-top: 1rem;">
        <div>
          <button class="btn btn-secondary btn-sm" id="btn-back-to-trips" style="margin-bottom: 0.75rem;">
            ← Back to Dashboard
          </button>
          
          <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
            <h1 style="font-family: var(--font-heading); font-size: 2.4rem; font-weight: 900; color: #0f172a;">
              ${escapeHtml(trip.title)}
            </h1>
            <span class="badge" style="background: var(--color-primary-subtle); color: var(--color-primary); border: 1px solid rgba(37,99,235,0.2); font-weight: 700;">
              📅 ${escapeHtml(datesStr)}
            </span>
            <span class="badge" style="background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; font-weight: 700;">
              📍 ${stops.length} Stops
            </span>
          </div>

          <p style="color: #64748b; font-size: 0.95rem; margin-top: 0.4rem;">
            Route: <strong style="color: #0f172a;">${routeProgression}</strong>
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

      <!-- Mode Switcher Tabs -->
      <div style="display: flex; background: #f1f5f9; padding: 4px; border-radius: var(--radius-md); border: 1px solid var(--color-border); margin-bottom: 2rem; max-width: 480px;">
        <button class="btn btn-sm ${activeViewMode === 'itinerary' ? 'btn-primary' : 'btn-secondary'}" id="tab-mode-itinerary" style="flex: 1; border: none; font-weight: 700;">
          📌 Itinerary
        </button>
        <button class="btn btn-sm ${activeViewMode === 'timeline' ? 'btn-primary' : 'btn-secondary'}" id="tab-mode-timeline" style="flex: 1; border: none; font-weight: 700;">
          🗺️ Route Timeline
        </button>
        <button class="btn btn-sm ${activeViewMode === 'budget' ? 'btn-primary' : 'btn-secondary'}" id="tab-mode-budget" style="flex: 1; border: none; font-weight: 700;">
          💰 Budget (${financials.percentUsed}%)
        </button>
      </div>
      ${financials.isOverBudget ? `<div class="alert alert-danger animate-fade-in" style="margin-bottom:1.5rem;"><strong>Budget warning:</strong> ${financials.remaining < 0 ? 'This trip is over budget.' : `Daily spending exceeds the target on ${financials.overBudgetDays.join(', ')}.`}</div>` : ''}

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
      btn.addEventListener('click', async () => {
        const stopId = btn.getAttribute('data-stop-id');
        if (confirm('Are you sure you want to remove this city and all its activities?')) {
          await api.deleteStop(stopId);
          await fetchTripDetails();
        }
      });
    });

    container.querySelectorAll('.btn-delete-act').forEach(btn => {
      btn.addEventListener('click', async () => {
        const actId = btn.getAttribute('data-act-id');
        await api.deleteItineraryActivity(actId);
        await fetchTripDetails();
      });
    });
  }

  function renderItineraryView(stops, financials) {
    return `
      <div style="display: grid; grid-template-columns: 1fr 340px; gap: 2rem; align-items: start;">
        
        <!-- Left / Main Area: Stops & Connected Itinerary Timeline -->
        <div style="display: flex; flex-direction: column; gap: 2rem;">
          ${stops.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">📍</div>
              <h3 style="color: #0f172a; margin-bottom: 0.5rem;">No stops added yet</h3>
              <p class="empty-state-desc">Add your first destination to start organizing activities, timings, and daily routes.</p>
              <button class="btn btn-primary btn-lg" id="btn-add-stop-empty">+ Add First City</button>
            </div>
          ` : stops.map((stop, idx) => `
            <div class="card animate-fade-in" style="padding: 0; overflow: hidden; border: 1px solid var(--color-border); background: #ffffff; box-shadow: var(--shadow-sm);">
              
              <!-- Stop Header Banner -->
              <div style="padding: 1.25rem 1.5rem; background: #f8fafc; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
                <div style="display: flex; align-items: center; gap: 0.85rem;">
                  <div style="width: 34px; height: 34px; border-radius: 50%; background: var(--color-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem;">
                    ${idx + 1}
                  </div>
                  <div>
                    <h3 style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 800; color: #0f172a; line-height: 1.2;">
                      ${escapeHtml(stop.cityName)}
                    </h3>
                    <span style="font-size: 0.82rem; color: #64748b;">
                      ${stop.startDate ? `📅 ${formatDate(stop.startDate)} ${stop.endDate ? `– ${formatDate(stop.endDate)}` : ''}` : 'Dates flexible'}
                    </span>
                  </div>
                </div>

                <div style="display: flex; gap: 0.5rem; align-items: center;">
                  <button class="btn btn-primary btn-sm btn-add-act-stop" data-stop-id="${escapeHtml(stop.id)}">
                    + Add Activity
                  </button>
                  <button class="btn btn-secondary btn-sm btn-delete-stop" data-stop-id="${escapeHtml(stop.id)}" title="Delete stop" style="color: #ef4444; border-color: rgba(239,68,68,0.2);">
                    🗑️
                  </button>
                </div>
              </div>

              <!-- Stop Activities Timeline -->
              <div style="padding: 1.5rem;">
                ${(!stop.activities || stop.activities.length === 0) ? `
                  <div style="text-align: center; padding: 2rem 1rem; background: #f8fafc; border-radius: var(--radius-md); border: 1px dashed var(--color-border);">
                    <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 0.75rem;">No activities scheduled in ${escapeHtml(stop.cityName)} yet.</p>
                    <button class="btn btn-secondary btn-sm btn-add-act-stop" data-stop-id="${escapeHtml(stop.id)}">+ Add Activity</button>
                  </div>
                ` : `
                  <div style="position: relative; padding-left: 1.75rem;">
                    <!-- Timeline Track Line -->
                    <div style="position: absolute; left: 14px; top: 12px; bottom: 12px; width: 2px; background: linear-gradient(to bottom, var(--color-primary), #e2e8f0);"></div>

                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                      ${stop.activities.map(act => {
                        const costDisplay = act.cost > 0 ? `₹${parseFloat(act.cost).toLocaleString('en-IN')}` : 'Free';
                        return `
                          <div style="position: relative;" class="animate-fade-in">
                            <!-- Timeline node dot -->
                            <div style="position: absolute; left: -1.75rem; top: 1rem; width: 12px; height: 12px; border-radius: 50%; background: var(--color-primary); border: 2px solid #ffffff; box-shadow: 0 0 6px rgba(37,99,235,0.4); z-index: 2;"></div>

                            <div class="card" style="padding: 1rem 1.25rem; background: #ffffff; border: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; box-shadow: var(--shadow-sm);">
                              <div style="display: flex; align-items: center; gap: 1rem;">
                                <div style="font-family: var(--font-heading); font-size: 0.95rem; font-weight: 800; color: var(--color-primary); min-width: 55px;">
                                  ${escapeHtml(act.startTime || '09:00')}
                                </div>
                                <div>
                                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.2rem;">
                                    <span class="badge" style="background: var(--color-primary-subtle); color: var(--color-primary); font-size: 0.72rem; font-weight: 700;">
                                      ${escapeHtml(act.category || 'Sightseeing')}
                                    </span>
                                    <span style="font-size: 0.75rem; color: #64748b;">⏱️ ${escapeHtml(act.duration || '2 hours')}</span>
                                  </div>
                                  <h4 style="font-family: var(--font-heading); font-size: 1.05rem; font-weight: 800; color: #0f172a;">
                                    ${escapeHtml(act.title)}
                                  </h4>
                                </div>
                              </div>

                              <div style="display: flex; align-items: center; gap: 1rem;">
                                <span style="font-weight: 800; color: ${act.cost > 0 ? '#059669' : '#0284c7'}; font-size: 1rem;">
                                  ${costDisplay}
                                </span>
                                <button class="btn btn-secondary btn-sm btn-delete-act" data-stop-id="${escapeHtml(stop.id)}" data-act-id="${escapeHtml(act.id)}" style="color: #ef4444; padding: 0.25rem 0.5rem; font-size: 0.8rem;" title="Remove activity">✕</button>
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

        <!-- Right Sidebar -->
        <aside style="display: flex; flex-direction: column; gap: 1.5rem; position: sticky; top: 80px;">
          <!-- Budget Meter Card -->
          <div class="card" style="padding: 1.5rem; background: #ffffff; border: 1px solid var(--color-border); box-shadow: var(--shadow-sm);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <span style="font-size: 0.82rem; font-weight: 700; text-transform: uppercase; color: #64748b;">Trip Budget</span>
              <span class="badge" style="background: ${financials.isOverBudget ? 'var(--color-danger-bg)' : 'var(--color-success-bg)'}; color: ${financials.isOverBudget ? '#ef4444' : '#059669'}; font-weight: 700;">
                ${financials.percentUsed}% Used
              </span>
            </div>

            <div style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 900; color: #0f172a; margin-bottom: 0.25rem;">
              ₹${financials.totalSpent.toLocaleString('en-IN')}
              <span style="font-size: 0.95rem; font-weight: 500; color: #64748b;">/ ₹${financials.totalBudget.toLocaleString('en-IN')}</span>
            </div>

            <!-- Progress Bar -->
            <div style="height: 8px; border-radius: var(--radius-full); background: #e2e8f0; overflow: hidden; margin: 1rem 0;">
              <div style="width: ${financials.percentUsed}%; height: 100%; background: ${financials.isOverBudget ? '#ef4444' : '#10b981'}; border-radius: var(--radius-full); transition: width 0.4s ease;"></div>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #64748b;">
              <span>Remaining: <strong style="color: ${financials.remaining < 0 ? '#ef4444' : '#059669'};">₹${Math.max(0, financials.remaining).toLocaleString('en-IN')}</strong></span>
              <span>Activities: <strong style="color: #0f172a;">₹${Number(financials.byCategory.activities || 0).toLocaleString('en-IN')}</strong></span>
            </div>

            ${financials.isOverBudget ? `
              <div style="margin-top: 1rem; padding: 0.6rem 0.85rem; background: #fef2f2; border-radius: var(--radius-md); border: 1px solid #fecaca; font-size: 0.82rem; color: #ef4444; font-weight: 600;">
                ⚠️ Estimated spending exceeds total budget.
              </div>
            ` : ''}
          </div>

          <!-- Quick Summary Card -->
          <div class="card" style="padding: 1.5rem; background: #ffffff; border: 1px solid var(--color-border); box-shadow: var(--shadow-sm);">
            <h4 style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 800; color: #0f172a; margin-bottom: 1rem;">
              Itinerary Summary
            </h4>

            <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.9rem;">
              <div style="display: flex; justify-content: space-between; color: #64748b;">
                <span>Total Destinations</span>
                <span style="color: #0f172a; font-weight: 700;">${stops.length} Cities</span>
              </div>
              <div style="display: flex; justify-content: space-between; color: #64748b;">
                <span>Total Activities</span>
                <span style="color: #0f172a; font-weight: 700;">${stops.reduce((acc, s) => acc + (s.activities?.length || 0), 0)} Scheduled</span>
              </div>
            </div>

            <button class="btn btn-secondary" id="btn-add-stop-sidebar" style="width: 100%; margin-top: 1.25rem; justify-content: center; font-weight: 700;">
              + Add Another City
            </button>
          </div>
        </aside>

      </div>
    `;
  }

  function renderTimelineView(stops, financials) {
    if (!stops.length) {
      return `<div class="empty-state animate-fade-in"><div class="empty-state-icon">🗺️</div><h3>No stops to timeline yet</h3><p class="empty-state-desc">Add a destination to see the chronological route timeline.</p><button class="btn btn-primary" id="btn-add-stop-empty">+ Add First City</button></div>`;
    }
    return `
      <div class="card animate-fade-in" style="padding: 2rem; background: #ffffff; border: 1px solid var(--color-border); box-shadow: var(--shadow-sm);">
        <h2 style="font-family: var(--font-heading); font-size: 1.6rem; font-weight: 900; color: #0f172a; margin-bottom: 0.5rem;">
          🗺️ Visual Route Timeline
        </h2>
        <p style="color: #64748b; font-size: 0.95rem; margin-bottom: 2rem;">
          Step-by-step route progression across scheduled cities and planned activity blocks.
        </p>

        <!-- Route Nodes Ribbon -->
        <div style="display: flex; align-items: center; gap: 1rem; overflow-x: auto; padding: 1.5rem; background: #f8fafc; border-radius: var(--radius-lg); border: 1px solid var(--color-border); margin-bottom: 2.5rem;">
          ${stops.map((stop, idx) => `
            <div style="display: flex; align-items: center; gap: 1rem; flex-shrink: 0;">
              <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
                <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--color-primary); color: #fff; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(37,99,235,0.3); font-size: 1rem;">
                  ${idx + 1}
                </div>
                <span style="font-weight: 800; color: #0f172a; font-size: 0.95rem; margin-top: 0.5rem;">${escapeHtml(stop.cityName)}</span>
                <span style="font-size: 0.78rem; color: #64748b;">${stop.activities?.length || 0} Activities</span>
              </div>
              ${idx < stops.length - 1 ? `<span style="font-size: 1.4rem; color: var(--color-primary); font-weight: 800;">➔</span>` : ''}
            </div>
          `).join('')}
        </div>

        <!-- Detailed Chronological Timeline -->
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          ${stops.map((stop, idx) => `
            <div style="padding: 1.25rem 1.5rem; background: #ffffff; border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="font-family: var(--font-heading); font-size: 1.2rem; font-weight: 800; color: #0f172a;">
                  📍 Stop ${idx + 1}: ${escapeHtml(stop.cityName)}
                </h3>
                <span class="badge" style="background: var(--color-primary-subtle); color: var(--color-primary); font-weight: 700;">
                  ${stop.startDate ? formatDate(stop.startDate) : 'Day ' + (idx + 1)}
                </span>
              </div>

              ${(!stop.activities || stop.activities.length === 0) ? `
                <p style="font-size: 0.85rem; color: #94a3b8; font-style: italic;">No specific activities scheduled for this date.</p>
              ` : `
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.75rem;">
                  ${stop.activities.map(act => `
                    <div style="background: #f8fafc; padding: 0.75rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <span style="font-size: 0.75rem; color: var(--color-primary); font-weight: 700;">${escapeHtml(act.startTime || '10:00')}</span>
                        <h5 style="font-weight: 700; color: #0f172a; font-size: 0.92rem;">${escapeHtml(act.title)}</h5>
                      </div>
                      <span style="font-weight: 800; color: #059669; font-size: 0.85rem;">
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
    if (isBudgetLoading) {
      return `<div style="text-align:center;padding:5rem 0;"><div class="spinner" style="width:44px;height:44px;border:3px solid rgba(37,99,235,.2);border-top-color:var(--color-primary);border-radius:50%;margin:0 auto;"></div><p style="color:#64748b;margin-top:1rem;">Loading budget...</p></div>`;
    }
    if (budgetError && !budget) {
      return `<div class="empty-state"><h3>Budget unavailable</h3><p class="empty-state-desc">${escapeHtml(budgetError)}</p></div>`;
    }
    return `
      <div class="card animate-fade-in" style="padding: 2rem; background: #ffffff; border: 1px solid var(--color-border); box-shadow: var(--shadow-sm);">
        <h2 style="font-family: var(--font-heading); font-size: 1.6rem; font-weight: 900; color: #0f172a; margin-bottom: 0.5rem;">
          💰 Trip Budget & Expense Tracking
        </h2>
        <p style="color: #64748b; font-size: 0.95rem; margin-bottom: 2rem;">
          Real-time expense allocation by category, destination, and activity.
        </p>

        <!-- Top Financial KPIs -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 2.5rem;">
          <div class="card" style="padding: 1.25rem; background: #ffffff; border: 1px solid var(--color-border);">
            <span style="font-size: 0.8rem; color: #64748b; text-transform: uppercase; font-weight: 700;">Total Budget</span>
            <div style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 900; color: #0f172a; margin-top: 0.25rem;">
              ₹${financials.totalBudget.toLocaleString('en-IN')}
            </div>
          </div>

          <div class="card" style="padding: 1.25rem; background: #ffffff; border: 1px solid var(--color-border);">
            <span style="font-size: 0.8rem; color: #64748b; text-transform: uppercase; font-weight: 700;">Total Spent</span>
            <div style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 900; color: #0284c7; margin-top: 0.25rem;">
              ₹${financials.totalSpent.toLocaleString('en-IN')}
            </div>
          </div>

          <div class="card" style="padding: 1.25rem; background: #ffffff; border: 1px solid var(--color-border);">
            <span style="font-size: 0.8rem; color: #64748b; text-transform: uppercase; font-weight: 700;">Remaining Budget</span>
            <div style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 900; color: ${financials.remaining < 0 ? '#ef4444' : '#059669'}; margin-top: 0.25rem;">
              ₹${Math.max(0, financials.remaining).toLocaleString('en-IN')}
            </div>
          </div>

          <div class="card" style="padding: 1.25rem; background: #ffffff; border: 1px solid var(--color-border);">
            <span style="font-size: 0.8rem; color: #64748b; text-transform: uppercase; font-weight: 700;">Budget Consumption</span>
            <div style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 900; color: ${financials.isOverBudget ? '#ef4444' : '#d97706'}; margin-top: 0.25rem;">
              ${financials.percentUsed}%
            </div>
          </div>
        </div>

        <!-- Category Breakdown Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
          <div class="card" style="padding: 1.5rem; background: #f8fafc; border: 1px solid var(--color-border);">
            <h4 style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 800; color: #0f172a; margin-bottom: 1.25rem;">
              Category Allocations
            </h4>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.35rem; color: #0f172a;">
                  <span>🏨 Accommodation (Est. 40%)</span>
                  <strong>₹${Number(financials.byCategory.accommodation || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div style="height: 6px; background: #e2e8f0; border-radius: var(--radius-full);">
                  <div style="width: 40%; height: 100%; background: #6366f1; border-radius: var(--radius-full);"></div>
                </div>
              </div>

              <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.35rem; color: #0f172a;">
                  <span>🚆 Transport & Flights (Est. 35%)</span>
                  <strong>₹${Number(financials.byCategory.transport || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div style="height: 6px; background: #e2e8f0; border-radius: var(--radius-full);">
                  <div style="width: 35%; height: 100%; background: #0ea5e9; border-radius: var(--radius-full);"></div>
                </div>
              </div>

              <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.35rem; color: #0f172a;">
                  <span>🎯 Planned Activities</span>
                  <strong>₹${Number(financials.byCategory.activities || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div style="height: 6px; background: #e2e8f0; border-radius: var(--radius-full);">
                  <div style="width: ${financials.totalBudget > 0 ? Math.min(Math.round((financials.byCategory.activities / financials.totalBudget) * 100), 100) : 0}%; height: 100%; background: #10b981; border-radius: var(--radius-full);"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Destination Breakdown -->
          <div class="card" style="padding: 1.5rem; background: #f8fafc; border: 1px solid var(--color-border);">
            <h4 style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 800; color: #0f172a; margin-bottom: 1.25rem;">
              Spending by Destination
            </h4>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              ${stops.map(stop => {
                const stopCost = (stop.activities || []).reduce((acc, a) => acc + (parseFloat(a.cost) || 0), 0);
                return `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: #ffffff; border-radius: var(--radius-sm); border: 1px solid var(--color-border);">
                    <span style="font-weight: 700; color: #0f172a;">📍 ${escapeHtml(stop.cityName)}</span>
                    <span style="font-weight: 800; color: #059669;">₹${stopCost.toLocaleString('en-IN')}</span>
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
