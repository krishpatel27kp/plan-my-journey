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
  container.style.margin = '1rem auto 4rem auto';

  let trip = initialTrip || {
    id: tripId || 'trip-goa-escape',
    title: 'Goa Escape',
    startDate: '2026-09-10',
    endDate: '2026-09-15',
    budget: 50000,
    stops: [
      {
        id: 'stop-1',
        cityName: 'North Goa',
        startDate: '2026-09-10',
        endDate: '2026-09-12',
        stopOrder: 1,
        activities: [
          { id: 'act-1', title: 'Baga Beach Watersports', category: 'Adventure', startTime: '10:00', duration: '3 hours', cost: 2500 },
          { id: 'act-2', title: 'Fort Aguada Heritage Visit', category: 'Sightseeing', startTime: '16:00', duration: '2 hours', cost: 800 }
        ]
      },
      {
        id: 'stop-2',
        cityName: 'South Goa',
        startDate: '2026-09-13',
        endDate: '2026-09-15',
        stopOrder: 2,
        activities: [
          { id: 'act-3', title: 'Palolem Beach Kayaking & Sunset', category: 'Relaxing', startTime: '11:00', duration: '2.5 hours', cost: 1500 }
        ]
      }
    ]
  };

  let activeViewMode = 'itinerary'; // 'itinerary' | 'timeline' | 'budget'
  let isLoading = false;
  let isBudgetLoading = false;
  let budget = null;
  let budgetError = null;
  let activeModal = null;

  async function fetchTripDetails() {
    if (!tripId || tripId.startsWith('trip-goa')) {
      render();
      return;
    }

    try {
      const data = await api.getTripById(tripId);
      if (data && data.id) {
        trip = data;
      }
      render();
    } catch (err) {
      console.warn('Trip fetch fallback:', err.message);
      render();
    }
  }

  function calculateFinancials() {
    const totalBudget = Number(trip?.budget) || 50000;
    
    // Sum activities cost
    let totalActivityCost = 0;
    const byCategory = {
      activities: 0,
      transport: Math.round(totalBudget * 0.25),
      accommodation: Math.round(totalBudget * 0.40)
    };

    (trip.stops || []).forEach(stop => {
      (stop.activities || []).forEach(act => {
        const cost = parseFloat(act.cost) || 0;
        totalActivityCost += cost;
      });
    });

    byCategory.activities = totalActivityCost;
    const totalSpent = totalActivityCost + byCategory.transport + byCategory.accommodation;
    const remaining = totalBudget - totalSpent;
    const percentUsed = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0;

    return {
      totalBudget,
      totalSpent,
      remaining,
      percentUsed,
      byCategory,
      overBudgetDays: [],
      isOverBudget: remaining < 0
    };
  }

  function render() {
    const financials = calculateFinancials();
    const stops = [...(trip.stops || [])].sort((a, b) => (a.stopOrder || 0) - (b.stopOrder || 0));
    const datesStr = trip.startDate && trip.endDate
      ? `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`
      : '10 Sep – 15 Sep 2026';

    const routeProgression = stops.length > 0
      ? stops.map(s => escapeHtml(s.cityName)).join(' ➔ ')
      : 'No destinations added yet';

    container.innerHTML = `
      <!-- Top Navigation & Title Bar -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--color-border); padding-top: 0.5rem;">
        <div>
          <button class="btn btn-secondary btn-sm" id="btn-back-to-trips" style="margin-bottom: 0.75rem; border-radius: 9999px;">
            ← Back to Dashboard
          </button>
          
          <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
            <h1 style="font-family: var(--font-heading); font-size: 2.2rem; font-weight: 900; color: #0f172a; letter-spacing: -0.02em;">
              ${escapeHtml(trip.title)}
            </h1>
            <span class="badge" style="background: #e6f4f2; color: #006d64; font-size: 0.85rem; font-weight: 800; padding: 0.35rem 0.8rem;">
              📅 ${datesStr}
            </span>
          </div>

          <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.4rem; color: #64748b; font-size: 0.92rem;">
            <span>🗺️ Route:</span>
            <strong style="color: #006d64;">${routeProgression}</strong>
          </div>
        </div>

        <div style="display: flex; gap: 0.75rem; align-items: center;">
          <button class="btn btn-secondary" id="btn-share-itinerary" style="border-radius: 9999px; font-weight: 700;">
            🔗 Share Trip
          </button>
          <button class="btn btn-primary" id="btn-add-stop-main" style="border-radius: 9999px; background: #006d64; font-weight: 800; box-shadow: 0 4px 12px rgba(0, 109, 100, 0.25);">
            + Add Destination
          </button>
        </div>
      </div>

      <!-- Mode Switcher Tabs -->
      <div style="display: flex; background: #f1f5f9; padding: 4px; border-radius: 14px; border: 1px solid var(--color-border); margin-bottom: 2rem; max-width: 480px;">
        <button class="btn btn-sm ${activeViewMode === 'itinerary' ? 'btn-primary' : 'btn-secondary'}" id="tab-mode-itinerary" style="flex: 1; border: none; font-weight: 700; ${activeViewMode === 'itinerary' ? 'background: #006d64;' : ''}">
          📌 Itinerary
        </button>
        <button class="btn btn-sm ${activeViewMode === 'timeline' ? 'btn-primary' : 'btn-secondary'}" id="tab-mode-timeline" style="flex: 1; border: none; font-weight: 700; ${activeViewMode === 'timeline' ? 'background: #006d64;' : ''}">
          🗺️ Route Timeline
        </button>
        <button class="btn btn-sm ${activeViewMode === 'budget' ? 'btn-primary' : 'btn-secondary'}" id="tab-mode-budget" style="flex: 1; border: none; font-weight: 700; ${activeViewMode === 'budget' ? 'background: #006d64;' : ''}">
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
      btn.addEventListener('click', async () => {
        const stopId = btn.getAttribute('data-stop-id');
        if (confirm('Are you sure you want to remove this destination?')) {
          trip.stops = trip.stops.filter(s => s.id !== stopId);
          try {
            await api.deleteStop(stopId);
          } catch (e) {}
          render();
        }
      });
    });

    container.querySelectorAll('.btn-delete-act').forEach(btn => {
      btn.addEventListener('click', async () => {
        const stopId = btn.getAttribute('data-stop-id');
        const actId = btn.getAttribute('data-act-id');
        const stop = trip.stops.find(s => s.id === stopId);
        if (stop && stop.activities) {
          stop.activities = stop.activities.filter(a => a.id !== actId);
          try {
            await api.deleteItineraryActivity(actId);
          } catch (e) {}
          render();
        }
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
              <button class="btn btn-primary" id="btn-add-stop-empty" style="background: #006d64; border-radius: 9999px;">
                + Add First Destination
              </button>
            </div>
          ` : stops.map((stop, index) => `
            <div class="card animate-fade-in" style="padding: 0; overflow: hidden; border: 1px solid var(--color-border); border-radius: 20px; box-shadow: var(--shadow-sm); background: #ffffff;">
              
              <!-- Stop Header Bar -->
              <div style="padding: 1.25rem 1.5rem; background: #f8fafc; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <div style="width: 34px; height: 34px; border-radius: 50%; background: #006d64; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem;">
                    ${index + 1}
                  </div>
                  <div>
                    <h3 style="font-family: var(--font-heading); font-size: 1.35rem; font-weight: 900; color: #0f172a; margin: 0;">
                      ${escapeHtml(stop.cityName)}
                    </h3>
                    <span style="font-size: 0.8rem; color: #64748b;">
                      📅 Stop #${index + 1} • ${stop.startDate ? formatDate(stop.startDate) : 'Day ' + (index * 2 + 1)}
                    </span>
                  </div>
                </div>

                <div style="display: flex; gap: 0.5rem;">
                  <button class="btn btn-secondary btn-sm btn-add-act-stop" data-stop-id="${escapeHtml(stop.id)}" style="color: #006d64; font-weight: 700; border-color: #006d64; border-radius: 9999px;">
                    + Add Activity
                  </button>
                  <button class="btn btn-secondary btn-sm btn-delete-stop" data-stop-id="${escapeHtml(stop.id)}" style="color: #ef4444; border-radius: 9999px;" title="Remove Destination">
                    ✕
                  </button>
                </div>
              </div>

              <!-- Stop Activities Timeline -->
              <div style="padding: 1.5rem;">
                ${(!stop.activities || stop.activities.length === 0) ? `
                  <div style="text-align: center; padding: 2rem 1rem; background: #f8fafc; border-radius: 14px; border: 1px dashed var(--color-border);">
                    <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 0.75rem;">No activities scheduled in ${escapeHtml(stop.cityName)} yet.</p>
                    <button class="btn btn-secondary btn-sm btn-add-act-stop" data-stop-id="${escapeHtml(stop.id)}" style="border-radius: 9999px; color: #006d64; font-weight: 700;">+ Add Activity</button>
                  </div>
                ` : `
                  <div style="position: relative; padding-left: 1.75rem;">
                    <!-- Timeline Track Line -->
                    <div style="position: absolute; left: 14px; top: 12px; bottom: 12px; width: 2px; background: linear-gradient(to bottom, #006d64, #e2e8f0);"></div>

                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                      ${stop.activities.map(act => {
                        const costDisplay = act.cost > 0 ? `₹${parseFloat(act.cost).toLocaleString('en-IN')}` : 'Free';
                        return `
                          <div style="position: relative;" class="animate-fade-in">
                            <!-- Timeline node dot -->
                            <div style="position: absolute; left: -1.75rem; top: 1rem; width: 12px; height: 12px; border-radius: 50%; background: #006d64; border: 2px solid #ffffff; box-shadow: 0 0 6px rgba(0,109,100,0.4); z-index: 2;"></div>

                            <div class="card" style="padding: 1rem 1.25rem; background: #ffffff; border: 1px solid var(--color-border); border-radius: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; box-shadow: var(--shadow-sm);">
                              <div style="display: flex; align-items: center; gap: 1rem;">
                                <div style="font-family: var(--font-heading); font-size: 0.95rem; font-weight: 800; color: #006d64; min-width: 55px;">
                                  ${escapeHtml(act.startTime || '10:00')}
                                </div>
                                <div>
                                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.2rem;">
                                    <span class="badge" style="background: #e6f4f2; color: #006d64; font-size: 0.72rem; font-weight: 700;">
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
                                <span style="font-weight: 800; color: #006d64; font-size: 1.05rem;">
                                  ${costDisplay}
                                </span>
                                <button class="btn btn-secondary btn-sm btn-delete-act" data-stop-id="${escapeHtml(stop.id)}" data-act-id="${escapeHtml(act.id)}" style="color: #ef4444; border-radius: 9999px; padding: 0.25rem 0.6rem; font-size: 0.8rem;" title="Remove activity">✕</button>
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
          <div class="card" style="padding: 1.5rem; background: #ffffff; border: 1px solid var(--color-border); border-radius: 20px; box-shadow: var(--shadow-sm);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <span style="font-size: 0.82rem; font-weight: 800; text-transform: uppercase; color: #64748b;">Trip Budget</span>
              <span class="badge" style="background: #e6f4f2; color: #006d64; font-weight: 800;">
                ${financials.percentUsed}% Planned
              </span>
            </div>

            <div style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 900; color: #0f172a; margin-bottom: 0.25rem;">
              ₹${financials.totalSpent.toLocaleString('en-IN')}
              <span style="font-size: 0.95rem; font-weight: 500; color: #64748b;">/ ₹${financials.totalBudget.toLocaleString('en-IN')}</span>
            </div>

            <!-- Progress Bar -->
            <div style="height: 8px; border-radius: 9999px; background: #e2e8f0; overflow: hidden; margin: 1rem 0;">
              <div style="width: ${financials.percentUsed}%; height: 100%; background: #006d64; border-radius: 9999px; transition: width 0.4s ease;"></div>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #64748b;">
              <span>Remaining: <strong style="color: #006d64;">₹${Math.max(0, financials.remaining).toLocaleString('en-IN')}</strong></span>
              <span>Activities: <strong style="color: #0f172a;">₹${Number(financials.byCategory.activities || 0).toLocaleString('en-IN')}</strong></span>
            </div>
          </div>

          <!-- Quick Summary Card -->
          <div class="card" style="padding: 1.5rem; background: #ffffff; border: 1px solid var(--color-border); border-radius: 20px; box-shadow: var(--shadow-sm);">
            <h4 style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 800; color: #0f172a; margin-bottom: 1rem;">
              Itinerary Summary
            </h4>

            <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.9rem;">
              <div style="display: flex; justify-content: space-between; color: #64748b;">
                <span>Total Destinations</span>
                <strong style="color: #0f172a;">${stops.length} Locations</strong>
              </div>
              <div style="display: flex; justify-content: space-between; color: #64748b;">
                <span>Total Activities</span>
                <strong style="color: #0f172a;">
                  ${stops.reduce((acc, s) => acc + (s.activities?.length || 0), 0)} Scheduled
                </strong>
              </div>
            </div>

            <button class="btn btn-secondary btn-sm" id="btn-add-stop-sidebar" style="width: 100%; margin-top: 1.25rem; border-radius: 9999px; font-weight: 700; color: #006d64; border-color: #006d64;">
              + Add Another Destination
            </button>
          </div>
        </aside>

      </div>
    `;
  }

  function renderTimelineView(stops, financials) {
    return `
      <div class="card" style="padding: 2rem; background: #ffffff; border: 1px solid var(--color-border); border-radius: 20px;">
        <h3 style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 900; color: #0f172a; margin-bottom: 1.5rem;">
          🗺️ Connected Route Progression
        </h3>
        
        <div style="display: flex; flex-direction: column; gap: 2rem; position: relative; padding-left: 2rem;">
          <div style="position: absolute; left: 19px; top: 15px; bottom: 15px; width: 3px; background: #006d64;"></div>

          ${stops.map((stop, idx) => `
            <div style="position: relative;">
              <div style="position: absolute; left: -2rem; top: 0; width: 22px; height: 22px; border-radius: 50%; background: #006d64; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800;">
                ${idx + 1}
              </div>
              <div style="background: #f8fafc; padding: 1.25rem; border-radius: 14px; border: 1px solid var(--color-border);">
                <h4 style="font-family: var(--font-heading); font-size: 1.2rem; font-weight: 800; color: #0f172a;">
                  ${escapeHtml(stop.cityName)}
                </h4>
                <p style="color: #64748b; font-size: 0.88rem; margin-top: 0.25rem;">
                  ${stop.activities?.length || 0} activities planned • Estimated Day ${(idx * 2) + 1} to ${(idx * 2) + 2}
                </p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderBudgetView(stops, financials) {
    return `
      <div style="display: flex; flex-direction: column; gap: 2rem;">
        <div class="card" style="padding: 2rem; background: #ffffff; border: 1px solid var(--color-border); border-radius: 20px;">
          <h3 style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 900; color: #0f172a; margin-bottom: 1.5rem;">
            💰 Comprehensive Financial Breakdown
          </h3>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
            <div style="padding: 1.25rem; background: #f8fafc; border-radius: 14px; border: 1px solid var(--color-border);">
              <span style="font-size: 0.8rem; font-weight: 700; color: #64748b;">TOTAL BUDGET</span>
              <div style="font-family: var(--font-heading); font-size: 1.7rem; font-weight: 900; color: #0f172a; margin-top: 0.25rem;">
                ₹${financials.totalBudget.toLocaleString('en-IN')}
              </div>
            </div>

            <div style="padding: 1.25rem; background: #e6f4f2; border-radius: 14px; border: 1px solid rgba(0,109,100,0.2);">
              <span style="font-size: 0.8rem; font-weight: 700; color: #006d64;">ESTIMATED SPEND</span>
              <div style="font-family: var(--font-heading); font-size: 1.7rem; font-weight: 900; color: #006d64; margin-top: 0.25rem;">
                ₹${financials.totalSpent.toLocaleString('en-IN')}
              </div>
            </div>

            <div style="padding: 1.25rem; background: #f8fafc; border-radius: 14px; border: 1px solid var(--color-border);">
              <span style="font-size: 0.8rem; font-weight: 700; color: #64748b;">REMAINING FUNDS</span>
              <div style="font-family: var(--font-heading); font-size: 1.7rem; font-weight: 900; color: #0f172a; margin-top: 0.25rem;">
                ₹${Math.max(0, financials.remaining).toLocaleString('en-IN')}
              </div>
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
      alert('Share link: ' + `${window.location.origin}/#share/demo`);
      shareBtn.textContent = origText;
    }
  }

  function openAddCityModal() {
    if (activeModal) activeModal.remove();
    activeModal = renderAddCityModal({
      tripId,
      currentStopsCount: trip.stops?.length || 0,
      onCityAdded: async (newStop) => {
        if (newStop) {
          if (!trip.stops) trip.stops = [];
          if (!trip.stops.find(s => s.id === newStop.id)) {
            trip.stops.push(newStop);
          }
        }
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
      onActivityAdded: async (newActivity) => {
        if (newActivity && stop) {
          if (!stop.activities) stop.activities = [];
          stop.activities.push(newActivity);
        }
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
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
