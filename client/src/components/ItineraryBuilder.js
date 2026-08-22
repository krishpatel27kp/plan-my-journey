/**
 * ItineraryBuilder Component
 * Fully Responsive for Desktop Web & Mobile:
 * - Timeline View: Connected Vertical Ribbon with City Stops, Activity Pills & High-Res Landmark Photos (Screenshot 1)
 * - Budget Analysis View: Responsive Grid with KPI Cards, Daily Average Spend, Donut Category Chart, Destination Breakdown & Interactive Expense Logging (Screenshot 2)
 */
import { api } from '../api.js';
import { renderAddCityModal } from './AddCityModal.js';
import { renderAddActivityModal } from './AddActivityModal.js';

export function renderItineraryBuilder({ tripId, initialTrip, onBack }) {
  const container = document.createElement('div');
  container.className = 'main-container animate-fade-in';
  container.style.maxWidth = '1180px'; // Wide responsive desktop container
  container.style.margin = '1rem auto 5rem auto';
  container.style.padding = '0 1.25rem';

  let trip = initialTrip || null;
  let activeViewMode = 'timeline'; // 'timeline' | 'budget'
  let isLoading = !trip;
  let isBudgetLoading = true;
  let budgetData = null;
  let budgetError = null;
  let activeModal = null;

  const CITY_LANDMARK_IMAGES = {
    'delhi': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
    'jaipur': 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80',
    'goa': 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    'north goa': 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    'south goa': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
    'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    'tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=800&q=80',
    'manali': 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80',
    'mumbai': 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80'
  };

  let _autoOpenedCityModal = false;

  async function fetchTripDetails() {
    if (!tripId) return;
    try {
      const data = await api.getTripById(tripId);
      trip = data;
      isLoading = false;
      render();

      // Auto-open Add City modal on first load if no stops yet
      if (!_autoOpenedCityModal && (!trip.stops || trip.stops.length === 0)) {
        _autoOpenedCityModal = true;
        setTimeout(() => openAddCityModal(), 400);
      }

      isBudgetLoading = true;
      try {
        budgetData = await api.getTripBudget(tripId);
      } catch (e) {
        budgetError = e.message;
      } finally {
        isBudgetLoading = false;
        render();
      }
    } catch (err) {
      isLoading = false;
      budgetError = err.message;
      render();
    }
  }

  function getCalculatedFinancials() {
    const targetBudget = Number(budgetData?.budget ?? trip?.budget) || 0;
    
    // Sum exact activity costs from stops
    let activityTotal = 0;
    const stops = trip?.stops || [];
    stops.forEach(s => {
      (s.activities || []).forEach(a => {
        activityTotal += (parseFloat(a.cost) || 0);
      });
    });

    // Use backend-calculated totalSpent if available, else use activity costs sum, else 0
    const totalSpent = Number(budgetData?.totalSpent) > 0
      ? Number(budgetData.totalSpent)
      : activityTotal;

    const remaining = targetBudget - totalSpent;
    const percentUsed = targetBudget > 0 ? Math.min(100, Math.round((totalSpent / targetBudget) * 100)) : 0;

    // Calculate trip days from dates
    let tripDays = budgetData?.tripLength || 0;
    if (!tripDays && trip?.startDate && trip?.endDate) {
      const s = new Date(trip.startDate), e = new Date(trip.endDate);
      tripDays = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)));
    }
    if (!tripDays) tripDays = stops.length > 0 ? stops.length * 2 : 1;

    const dailyAverage = totalSpent > 0 && tripDays > 0 ? Math.round(totalSpent / tripDays) : 0;

    // Category breakdown from backend or from activity costs
    const transportSpent = Number(budgetData?.byCategory?.transport) || 0;
    const lodgingSpent = Number(budgetData?.byCategory?.lodging || budgetData?.byCategory?.accommodation) || 0;
    const foodSpent = Number(budgetData?.byCategory?.food) || 0;
    const activitiesSpent = Number(budgetData?.byCategory?.activities) || 0;

    // If backend gave nothing but we have activityTotal, distribute it proportionally
    const categorySum = transportSpent + lodgingSpent + foodSpent + activitiesSpent;
    const useEstimated = categorySum === 0 && activityTotal > 0;

    return {
      targetBudget,
      totalSpent,
      remaining,
      percentUsed,
      tripDays,
      dailyAverage,
      byCategory: {
        transport: useEstimated ? Math.round(activityTotal * 0.40) : transportSpent,
        lodging: useEstimated ? Math.round(activityTotal * 0.30) : lodgingSpent,
        food: useEstimated ? Math.round(activityTotal * 0.20) : foodSpent,
        activities: useEstimated ? Math.round(activityTotal * 0.10) : activitiesSpent
      },
      budgetAlert: budgetData?.budgetAlert || null,
      hasData: totalSpent > 0 || targetBudget > 0
    };
  }

  function render() {
    if (isLoading) {
      container.innerHTML = `
        <div style="text-align: center; padding: 6rem 0;">
          <div class="spinner" style="width: 44px; height: 44px; border: 3px solid rgba(0,109,100,0.2); border-top-color: #006d64; border-radius: 50%; margin: 0 auto;"></div>
          <p style="color: #64748b; margin-top: 1rem; font-weight: 700; font-size: 1.05rem;">Loading Journey & Budget Engine...</p>
        </div>
      `;
      return;
    }

    if (!trip) {
      container.innerHTML = `
        <div class="card" style="padding: 3rem 1.5rem; text-align: center; background: #ffffff; border-radius: 24px; border: 1px solid var(--color-border);">
          <h3>Trip not found</h3>
          <p style="color: #64748b; margin: 0.5rem 0 1.5rem 0;">${escapeHtml(budgetError || 'Could not load trip data.')}</p>
          <button class="btn btn-secondary" id="btn-back-dashboard" style="border-radius: 9999px;">Back to Dashboard</button>
        </div>
      `;
      container.querySelector('#btn-back-dashboard')?.addEventListener('click', onBack);
      return;
    }

    const financials = getCalculatedFinancials();
    const stops = [...(trip.stops || [])].sort((a, b) => (a.stopOrder || 0) - (b.stopOrder || 0));

    container.innerHTML = `
      <!-- Top Responsive Header & View Switcher -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <button class="btn btn-secondary btn-sm" id="btn-back-dashboard" style="border-radius: 9999px; font-weight: 700; background: #ffffff; border-color: #cbd5e1; height: 38px; padding: 0 1.1rem;">
            ← Back
          </button>
          <span style="font-size: 1.15rem; font-weight: 900; color: #0f172a;">${escapeHtml(trip.title || 'My Journey')}</span>
        </div>

        <!-- View Switcher Tabs -->
        <div style="display: flex; background: #eaf2f0; padding: 4px; border-radius: 9999px; gap: 4px;">
          <button class="btn-toggle-view" id="tab-timeline" style="padding: 0.45rem 1.4rem; font-size: 0.88rem; font-weight: 800; border-radius: 9999px; border: none; cursor: pointer; transition: all 0.2s ease; background: ${activeViewMode === 'timeline' ? '#006d64' : 'transparent'}; color: ${activeViewMode === 'timeline' ? '#ffffff' : '#475569'}; box-shadow: ${activeViewMode === 'timeline' ? '0 2px 8px rgba(0,109,100,0.25)' : 'none'};">
            🗺️ Timeline
          </button>
          <button class="btn-toggle-view" id="tab-budget" style="padding: 0.45rem 1.4rem; font-size: 0.88rem; font-weight: 800; border-radius: 9999px; border: none; cursor: pointer; transition: all 0.2s ease; background: ${activeViewMode === 'budget' ? '#006d64' : 'transparent'}; color: ${activeViewMode === 'budget' ? '#ffffff' : '#475569'}; box-shadow: ${activeViewMode === 'budget' ? '0 2px 8px rgba(0,109,100,0.25)' : 'none'};">
            💰 Budget & Analysis
          </button>
        </div>

        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary btn-sm" id="btn-share-journey" style="border-radius: 9999px; font-weight: 700; height: 38px; padding: 0 1rem;">
            🔗 Share
          </button>
          <button class="btn btn-primary btn-sm" id="btn-add-dest-action" style="background: #006d64; border-radius: 9999px; font-weight: 800; height: 38px; padding: 0 1.25rem;">
            + Add Destination
          </button>
        </div>
      </div>

      <!-- Main Dynamic Canvas (Timeline or Budget View) -->
      ${activeViewMode === 'timeline' ? renderTimelineSection(stops) : renderBudgetSection(stops, financials)}

      <div id="modal-container"></div>
    `;

    // Bind Event Listeners
    container.querySelector('#btn-back-dashboard')?.addEventListener('click', onBack);
    container.querySelector('#tab-timeline')?.addEventListener('click', () => { activeViewMode = 'timeline'; render(); });
    container.querySelector('#tab-budget')?.addEventListener('click', () => { activeViewMode = 'budget'; render(); });
    container.querySelector('#btn-add-dest-action')?.addEventListener('click', openAddCityModal);
    container.querySelector('#btn-add-first-dest')?.addEventListener('click', openAddCityModal);
    container.querySelector('#btn-add-dest-from-budget')?.addEventListener('click', openAddCityModal);
    container.querySelector('#btn-share-journey')?.addEventListener('click', handleShareTripAction);
    container.querySelector('#btn-add-expense-modal')?.addEventListener('click', openAddExpenseModal);
    container.querySelector('#btn-add-expense-banner')?.addEventListener('click', openAddExpenseModal);

    // Stop & Activity action buttons
    container.querySelectorAll('.btn-add-act-stop').forEach(btn => {
      btn.addEventListener('click', () => {
        const stopId = btn.getAttribute('data-stop-id');
        const stop = stops.find(s => s.id === stopId) || { id: stopId, cityName: 'Destination' };
        openAddActivityModal(stop);
      });
    });
  }

  /**
   * Section 1: Route Timeline View (Pixel-Matched to Screenshot 1)
   */
  function renderTimelineSection(stops) {
    // Empty state: guide user to add their first destination
    if (stops.length === 0) {
      return `
        <div class="animate-fade-in" style="max-width: 680px; margin: 0 auto;">
          <div style="text-align: center; padding: 3rem 1.5rem; background: #f4f8f7; border-radius: 28px;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #006d64, #00a896); display: flex; align-items: center; justify-content: center; font-size: 2.2rem; margin: 0 auto 1.5rem auto; box-shadow: 0 8px 24px rgba(0,109,100,0.25);">
              🗺️
            </div>
            <h2 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 900; color: #0f172a; margin-bottom: 0.5rem;">
              ${escapeHtml(trip.title || 'My Journey')}
            </h2>
            <p style="color: #64748b; font-size: 1rem; line-height: 1.6; margin-bottom: 2rem; max-width: 380px; margin-left: auto; margin-right: auto;">
              Your journey starts here! Add your first destination to build your travel timeline and track your budget.
            </p>
            <button id="btn-add-first-dest" style="display: inline-flex; align-items: center; gap: 0.6rem; padding: 0.85rem 2rem; background: #006d64; color: #ffffff; border: none; border-radius: 9999px; font-size: 1rem; font-weight: 800; cursor: pointer; box-shadow: 0 4px 18px rgba(0,109,100,0.3); transition: transform 0.15s ease;" onmouseover="this.style.transform='scale(1.04)'" onmouseout="this.style.transform='scale(1)'">
              <span style="font-size: 1.3rem;">+</span> Add Your First Destination
            </button>

            <div style="display: flex; justify-content: center; gap: 2rem; margin-top: 2.5rem; flex-wrap: wrap;">
              <div style="text-align: center;">
                <div style="font-size: 1.8rem; margin-bottom: 0.3rem;">✈️</div>
                <div style="font-size: 0.82rem; font-weight: 700; color: #64748b;">Add Cities</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 1.8rem; margin-bottom: 0.3rem;">📅</div>
                <div style="font-size: 0.82rem; font-weight: 700; color: #64748b;">Set Dates</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 1.8rem; margin-bottom: 0.3rem;">💰</div>
                <div style="font-size: 0.82rem; font-weight: 700; color: #64748b;">Track Budget</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 1.8rem; margin-bottom: 0.3rem;">🔗</div>
                <div style="font-size: 0.82rem; font-weight: 700; color: #64748b;">Share Trip</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    const destSummary = stops.map(s => escapeHtml(s.cityName)).join(' • ');
    const tripDaysLabel = (() => {
      if (trip?.startDate && trip?.endDate) {
        const days = Math.max(1, Math.round((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000));
        return `${days} Day${days !== 1 ? 's' : ''}`;
      }
      return `${stops.length} Stop${stops.length !== 1 ? 's' : ''}`;
    })();

    return `
      <div class="animate-fade-in" style="max-width: 680px; margin: 0 auto; background: #f4f8f7; padding: 1.75rem 1rem; border-radius: 28px;">
        
        <!-- Header: Title & Route Subline -->
        <div style="text-align: center; margin-bottom: 2.25rem;">
          <h1 style="font-family: var(--font-heading); font-size: 2.2rem; font-weight: 900; color: #0f172a; line-height: 1.2;">
            ${escapeHtml(trip.title || 'My Journey')}
          </h1>
          <p style="color: #475569; font-size: 0.98rem; font-weight: 600; margin-top: 0.35rem;">
            ${destSummary} | ${tripDaysLabel}
          </p>
        </div>

        <!-- Vertical Connected Route Ribbon -->
        <div style="position: relative; padding-left: 2rem; margin-left: 0.5rem;">
          
          <!-- Continuous Vertical Track Line on Left -->
          ${stops.length > 1 ? `<div style="position: absolute; left: 6px; top: 18px; bottom: 30px; width: 2.5px; background: #006d64; border-radius: 9999px;"></div>` : ''}

          <div style="display: flex; flex-direction: column; gap: 2.5rem;">
            ${stops.map((stop, idx) => {
              const stopCityKey = (stop.cityName || '').toLowerCase();
              const landmarkImg = stop.imageUrl || CITY_LANDMARK_IMAGES[stopCityKey] || `https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80`;
              const dateDisplay = stop.startDate ? formatTimelineDate(stop.startDate) : null;

              const activities = stop.activities && stop.activities.length > 0 ? stop.activities : [];

              return `
                <div style="position: relative;" class="animate-fade-in">
                  
                  <!-- Timeline Node Bullet Dot on Vertical Track -->
                  <div style="position: absolute; left: -2rem; top: 0.35rem; width: 14px; height: 14px; border-radius: 50%; background: #006d64; border: 3px solid #f4f8f7; box-shadow: 0 0 0 2px #006d64; z-index: 2;"></div>

                  <!-- Date & City Stop Header -->
                  <h3 style="font-family: var(--font-heading); font-size: 1.45rem; font-weight: 900; color: #006d64; margin-bottom: 0.85rem; letter-spacing: -0.01em;">
                    ${dateDisplay ? escapeHtml(dateDisplay) + ' - ' : ''}${escapeHtml(stop.cityName)}
                  </h3>

                  <!-- Stop Card (White rounded card with activities & photo) -->
                  <div class="card" style="padding: 1.25rem; background: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 18px rgba(15,23,42,0.04); overflow: hidden;">
                    
                    ${activities.length > 0 ? `
                    <!-- Activities List Inside Stop Card -->
                    <div style="display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 1.15rem;">
                      ${activities.map(act => `
                        <div style="display: flex; align-items: center; gap: 0.75rem; color: #0f172a; font-size: 0.95rem; font-weight: 600;">
                          <span style="font-size: 1.25rem; width: 24px; text-align: center; color: #006d64;">
                            ${act.icon || getActivityIcon(act.category || act.title)}
                          </span>
                          <span>
                            <strong style="color: #0f172a; font-weight: 700;">${escapeHtml(act.startTime || '')}</strong>${act.startTime ? ' - ' : ''}${escapeHtml(act.title)}${act.cost ? ` <span style="color:#006d64;font-size:0.85rem;font-weight:700;"> · ₹${Number(act.cost).toLocaleString('en-IN')}</span>` : ''}
                          </span>
                        </div>
                      `).join('')}
                    </div>` : `
                    <!-- Empty activities state -->
                    <div style="text-align: center; padding: 1.25rem 1rem; color: #94a3b8;">
                      <div style="font-size: 1.6rem; margin-bottom: 0.4rem;">📝</div>
                      <p style="font-size: 0.88rem; font-weight: 600; margin-bottom: 0.85rem;">No activities yet</p>
                      <button class="btn-add-act-stop" data-stop-id="${stop.id}" style="padding: 0.45rem 1.2rem; background: #e6f4f2; color: #006d64; border: 1px solid #006d64; border-radius: 9999px; font-size: 0.82rem; font-weight: 800; cursor: pointer;">+ Add Activity</button>
                    </div>`}

                    <!-- Full-Width High-Res Landmark Photo Banner -->
                    <div style="width: 100%; height: 185px; border-radius: 16px; overflow: hidden; position: relative;">
                      <img 
                        src="${landmarkImg}" 
                        alt="${escapeHtml(stop.cityName)}" 
                        style="width: 100%; height: 100%; object-fit: cover;" 
                        onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80';"
                      />
                    </div>

                    <!-- Add activity button (shown when activities exist too) -->
                    ${activities.length > 0 ? `
                    <div style="margin-top: 0.85rem; text-align: right;">
                      <button class="btn-add-act-stop" data-stop-id="${stop.id}" style="padding: 0.4rem 1rem; background: #f1f5f9; color: #006d64; border: 1px solid #cbd5e1; border-radius: 9999px; font-size: 0.82rem; font-weight: 800; cursor: pointer;">+ Add Activity</button>
                    </div>` : ''}

                  </div>

                </div>
              `;
            }).join('')}
          </div>

        </div>

      </div>
    `;
  }

  /**
   * Section 2: Budget & Expense Analysis View (Fully Responsive for Web & Mobile)
   */
  function renderBudgetSection(stops, financials) {
    const hasNoStops = stops.length === 0;
    const hasNoSpend = financials.totalSpent === 0;

    // By-destination breakdown using real stop data
    const destColors = ['#006d64', '#6366f1', '#d97706', '#10b981', '#ef4444', '#3b82f6'];
    const stopsWithCost = stops.map((stop, i) => {
      // Calculate cost from activities of this stop
      const stopCost = (stop.activities || []).reduce((sum, a) => sum + (parseFloat(a.cost) || 0), 0);
      return { name: stop.cityName, cost: stopCost, color: destColors[i % destColors.length] };
    });
    const totalDestCost = stopsWithCost.reduce((s, d) => s + d.cost, 0);

    return `
      <div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 1.5rem;">
        
        <!-- Top Subheader: Trip Title + Add Expense Button -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 0.4rem; color: #0f172a; font-size: 1.2rem; font-weight: 900;">
            <span style="color: #006d64;">📍</span>
            <span>${escapeHtml(trip.title || 'My Journey')}</span>
          </div>

          <button class="btn btn-primary" id="btn-add-expense-modal" style="background: #006d64; border-radius: 9999px; height: 42px; padding: 0 1.5rem; font-weight: 800; display: flex; align-items: center; gap: 0.4rem; box-shadow: 0 4px 14px rgba(0,109,100,0.25);">
            <span style="font-size: 1.2rem; line-height: 1;">+</span>
            <span>Add Expense</span>
          </button>
        </div>

        ${financials.budgetAlert ? `
        <!-- Budget Alert Banner -->
        <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 20px; padding: 1.15rem 1.35rem; display: flex; gap: 0.85rem; align-items: flex-start;">
          <span style="font-size: 1.4rem; color: #d97706; line-height: 1;">⚠️</span>
          <div>
            <div style="font-weight: 800; color: #92400e; font-size: 0.98rem; margin-bottom: 0.2rem;">Budget Alert</div>
            <p style="color: #b45309; font-size: 0.9rem; line-height: 1.45;">${financials.budgetAlert.message}</p>
          </div>
        </div>` : ''}

        ${hasNoStops ? `
        <!-- Empty state: no destinations -->
        <div style="text-align: center; padding: 2.5rem 1.5rem; background: #f4f8f7; border-radius: 24px;">
          <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">💰</div>
          <h3 style="font-family: var(--font-heading); font-size: 1.35rem; font-weight: 900; color: #0f172a; margin-bottom: 0.5rem;">Budget tracking starts here</h3>
          <p style="color: #64748b; font-size: 0.95rem; line-height: 1.6; max-width: 320px; margin: 0 auto 1.5rem auto;">Add destinations to your timeline to start tracking costs, daily averages, and category breakdowns.</p>
          <button id="btn-add-dest-from-budget" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.75rem; background: #006d64; color: #fff; border: none; border-radius: 9999px; font-weight: 800; font-size: 0.95rem; cursor: pointer;">+ Add Destination</button>
        </div>` : `

        <!-- Responsive 2-Column Grid for Desktop Web / Stacking on Mobile -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.5rem; align-items: start;">
          
          <!-- Left Column / Card 1: Top 3 KPI Financial Card + Daily Average Banner -->
          <div style="display: flex; flex-direction: column; gap: 1.5rem;">
            
            <!-- Top 3 KPI Financial Card -->
            <div class="card" style="background: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; padding: 1.75rem; box-shadow: 0 4px 18px rgba(15,23,42,0.04);">
              
              <div style="display: flex; justify-content: space-between; margin-bottom: 1.25rem;">
                <div>
                  <span style="font-size: 0.78rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em;">TOTAL BUDGET</span>
                  <div style="font-family: var(--font-heading); font-size: 1.95rem; font-weight: 900; color: #0f172a; margin-top: 0.15rem;">
                    ₹${financials.targetBudget.toLocaleString('en-IN')}
                  </div>
                </div>

                <div style="text-align: right;">
                  <span style="font-size: 0.78rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em;">SPENT</span>
                  <div style="font-family: var(--font-heading); font-size: 1.95rem; font-weight: 900; color: #006d64; margin-top: 0.15rem;">
                    ₹${financials.totalSpent.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div style="margin-bottom: 1.35rem;">
                <span style="font-size: 0.78rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em;">REMAINING</span>
                <div style="font-family: var(--font-heading); font-size: 1.95rem; font-weight: 900; color: #0f172a; margin-top: 0.15rem;">
                  ₹${Math.max(0, financials.remaining).toLocaleString('en-IN')}
                </div>
              </div>

              <!-- Progress Track -->
              <div style="display: flex; justify-content: space-between; font-size: 0.88rem; font-weight: 700; margin-bottom: 0.45rem;">
                <span style="color: #0f172a;">Budget Utilization</span>
                <span style="color: #006d64; font-weight: 800;">${financials.percentUsed}% Used</span>
              </div>
              <div style="height: 9px; background: #e2e8f0; border-radius: 9999px; overflow: hidden;">
                <div style="width: ${financials.percentUsed}%; height: 100%; background: #006d64; border-radius: 9999px; transition: width 0.4s ease;"></div>
              </div>

            </div>

            <!-- Daily Average Spend Banner (Deep Teal Card) -->
            <div style="background: #006d64; border-radius: 24px; padding: 1.75rem; color: #ffffff; box-shadow: 0 8px 24px rgba(0,109,100,0.3);">
              
              <div style="width: 42px; height: 42px; border-radius: 14px; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; font-size: 1.35rem; margin-bottom: 1rem;">
                📅
              </div>

              <span style="font-size: 0.92rem; font-weight: 600; opacity: 0.92;">Daily Average Spend</span>
              <div style="font-family: var(--font-heading); font-size: 2.3rem; font-weight: 900; line-height: 1.15; margin: 0.2rem 0 1.25rem 0;">
                ₹${financials.dailyAverage.toLocaleString('en-IN')}
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 0.95rem; font-size: 0.88rem;">
                <span style="opacity: 0.9;">${financials.tripDays} days total</span>
                <span style="background: rgba(255,255,255,0.2); padding: 0.3rem 0.75rem; border-radius: 9999px; font-weight: 700; font-size: 0.8rem;">
                  +12% vs planned
                </span>
              </div>

            </div>

          </div>

          <!-- Right Column: Spend by Category & By Destination -->
          <div style="display: flex; flex-direction: column; gap: 1.5rem;">
            
            <!-- Spend by Category Card (Donut Chart & Dot List) -->
            <div class="card" style="background: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; padding: 1.75rem; box-shadow: 0 4px 18px rgba(15,23,42,0.04);">
              
              <h3 style="font-family: var(--font-heading); font-size: 1.45rem; font-weight: 900; color: #0f172a; margin-bottom: 1.5rem;">
                Spend by Category
              </h3>

              <!-- Circular Donut Chart Representation -->
              <div style="display: flex; justify-content: center; margin-bottom: 1.75rem;">
                <div style="position: relative; width: 140px; height: 140px; border-radius: 50%; background: conic-gradient(#006d64 0% 40%, #6366f1 40% 70%, #d97706 70% 90%, #10b981 90% 100%); display: flex; align-items: center; justify-content: center; box-shadow: inset 0 0 12px rgba(0,0,0,0.05);">
                  <div style="width: 104px; height: 104px; border-radius: 50%; background: #ffffff; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <span style="font-size: 0.75rem; color: #64748b; font-weight: 600;">Total</span>
                    <span style="font-family: var(--font-heading); font-size: 1.65rem; font-weight: 900; color: #0f172a; line-height: 1;">4</span>
                  </div>
                </div>
              </div>

              <!-- Category Dot Items -->
              <div style="display: flex; flex-direction: column; gap: 1rem; font-size: 0.95rem;">
                
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <div style="width: 11px; height: 11px; border-radius: 50%; background: #006d64;"></div>
                    <span style="color: #475569; font-weight: 600;">Transport</span>
                  </div>
                  <strong style="color: #0f172a; font-weight: 800;">₹${financials.byCategory.transport.toLocaleString('en-IN')}</strong>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <div style="width: 11px; height: 11px; border-radius: 50%; background: #6366f1;"></div>
                    <span style="color: #475569; font-weight: 600;">Lodging</span>
                  </div>
                  <strong style="color: #0f172a; font-weight: 800;">₹${financials.byCategory.lodging.toLocaleString('en-IN')}</strong>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <div style="width: 11px; height: 11px; border-radius: 50%; background: #d97706;"></div>
                    <span style="color: #475569; font-weight: 600;">Food</span>
                  </div>
                  <strong style="color: #0f172a; font-weight: 800;">₹${financials.byCategory.food.toLocaleString('en-IN')}</strong>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <div style="width: 11px; height: 11px; border-radius: 50%; background: #10b981;"></div>
                    <span style="color: #475569; font-weight: 600;">Activities</span>
                  </div>
                  <strong style="color: #0f172a; font-weight: 800;">₹${financials.byCategory.activities.toLocaleString('en-IN')}</strong>
                </div>

              </div>

            </div>

            <!-- By Destination Breakdown Card -->
            <div class="card" style="background: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; padding: 1.75rem; box-shadow: 0 4px 18px rgba(15,23,42,0.04);">
              
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="font-family: var(--font-heading); font-size: 1.45rem; font-weight: 900; color: #0f172a;">
                  By Destination
                </h3>
                <span class="badge" style="background: #e6f4f2; color: #006d64; font-weight: 800; font-size: 0.8rem;">
                  ${stops.length} Stop${stops.length !== 1 ? 's' : ''}
                </span>
              </div>

              ${stopsWithCost.length > 0 ? `
              <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                ${stopsWithCost.map(dest => {
                  const pct = totalDestCost > 0 ? Math.round((dest.cost / totalDestCost) * 100) : 0;
                  return `
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.95rem; font-weight: 700; margin-bottom: 0.4rem;">
                      <span style="color: #0f172a;">${escapeHtml(dest.name)}</span>
                      <span style="color: #0f172a; font-weight: 800;">${dest.cost > 0 ? '₹' + dest.cost.toLocaleString('en-IN') : '—'}</span>
                    </div>
                    <div style="height: 7px; background: #e2e8f0; border-radius: 9999px; overflow: hidden;">
                      <div style="width: ${Math.max(pct, dest.cost > 0 ? 4 : 0)}%; height: 100%; background: ${dest.color}; border-radius: 9999px;"></div>
                    </div>
                  </div>`;
                }).join('')}
              </div>` : `
              <div style="text-align: center; padding: 1.5rem; color: #94a3b8;">
                <p style="font-size: 0.9rem; font-weight: 600;">Add activities with costs to see destination breakdown.</p>
              </div>`}

            </div>

          </div>

        </div>
        `}

      </div>
    `;
  }

  function openAddExpenseModal() {
    if (activeModal) activeModal.remove();

    const expenseModal = document.createElement('div');
    expenseModal.className = 'modal-backdrop animate-fade-in';
    expenseModal.style.position = 'fixed';
    expenseModal.style.inset = '0';
    expenseModal.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
    expenseModal.style.backdropFilter = 'blur(12px)';
    expenseModal.style.display = 'flex';
    expenseModal.style.alignItems = 'center';
    expenseModal.style.justifyContent = 'center';
    expenseModal.style.zIndex = '1300';
    expenseModal.style.padding = '1rem';

    expenseModal.innerHTML = `
      <div class="card animate-fade-in" style="width: 100%; max-width: 480px; background: #ffffff; border-radius: 24px; border: 1px solid var(--color-border); padding: 1.75rem; box-shadow: 0 25px 60px rgba(15,23,42,0.35);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <h3 style="font-family: var(--font-heading); font-size: 1.45rem; font-weight: 900; color: #0f172a;">
            + Add Expense
          </h3>
          <button style="width: 34px; height: 34px; border-radius: 50%; background: #f1f5f9; border: none; cursor: pointer; font-weight: 700;" id="btn-close-expense">✕</button>
        </div>

        <form id="form-add-expense" style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 800; color: #0f172a; margin-bottom: 0.35rem;">Expense Title *</label>
            <input type="text" id="exp-title" placeholder="e.g. Flight to Goa, Hotel Stay, Seafood Dinner" required style="width: 100%; height: 44px; padding: 0 1rem; border-radius: 12px; border: 1.5px solid #cbd5e1; outline: none;" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label style="display: block; font-size: 0.85rem; font-weight: 800; color: #0f172a; margin-bottom: 0.35rem;">Amount (₹) *</label>
              <input type="number" id="exp-amount" placeholder="3500" required style="width: 100%; height: 44px; padding: 0 1rem; border-radius: 12px; border: 1.5px solid #cbd5e1; outline: none;" />
            </div>

            <div>
              <label style="display: block; font-size: 0.85rem; font-weight: 800; color: #0f172a; margin-bottom: 0.35rem;">Category</label>
              <select id="exp-category" style="width: 100%; height: 44px; padding: 0 0.75rem; border-radius: 12px; border: 1.5px solid #cbd5e1; outline: none; background: #ffffff;">
                <option value="Transport">Transport</option>
                <option value="Lodging">Lodging</option>
                <option value="Food">Food</option>
                <option value="Activities">Activities</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 800; color: #0f172a; margin-bottom: 0.35rem;">Date</label>
            <input type="date" id="exp-date" value="${new Date().toISOString().slice(0, 10)}" style="width: 100%; height: 44px; padding: 0 1rem; border-radius: 12px; border: 1.5px solid #cbd5e1; outline: none;" />
          </div>

          <button type="submit" class="btn btn-primary" id="btn-submit-expense" style="width: 100%; height: 46px; background: #006d64; border-radius: 9999px; font-weight: 800; margin-top: 0.5rem;">
            Save Expense
          </button>
        </form>
      </div>
    `;

    expenseModal.querySelector('#btn-close-expense')?.addEventListener('click', () => { expenseModal.remove(); });
    expenseModal.addEventListener('click', (e) => { if (e.target === expenseModal) expenseModal.remove(); });

    expenseModal.querySelector('#form-add-expense')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = expenseModal.querySelector('#exp-title').value.trim();
      const amount = parseFloat(expenseModal.querySelector('#exp-amount').value);
      const category = expenseModal.querySelector('#exp-category').value;
      const date = expenseModal.querySelector('#exp-date').value;

      const submitBtn = expenseModal.querySelector('#btn-submit-expense');
      submitBtn.textContent = 'Saving...';
      submitBtn.disabled = true;

      try {
        await api.addExpense(tripId, { title, amount, category, date });
        expenseModal.remove();
        await fetchTripDetails();
      } catch (err) {
        alert('Could not save expense: ' + err.message);
        submitBtn.textContent = 'Save Expense';
        submitBtn.disabled = false;
      }
    });

    activeModal = expenseModal;
    document.body.appendChild(expenseModal);
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

  async function handleShareTripAction() {
    const shareBtn = container.querySelector('#btn-share-journey');
    const origText = shareBtn.textContent;
    shareBtn.textContent = '⏳ Link...';

    try {
      const res = await api.shareTrip(tripId);
      const shareUrl = res.publicUrl || `${window.location.origin}/share/${res.shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
      shareBtn.textContent = '✓ Copied!';
      setTimeout(() => { shareBtn.textContent = origText; }, 2500);
    } catch (err) {
      alert('Share link: ' + `${window.location.origin}/#share/${tripId}`);
      shareBtn.textContent = origText;
    }
  }

  fetchTripDetails();
  return container;
}

function getActivityIcon(categoryOrTitle = '') {
  const t = categoryOrTitle.toLowerCase();
  if (t.includes('flight') || t.includes('del') || t.includes('goi') || t.includes('airport')) return '✈️';
  if (t.includes('hotel') || t.includes('taj') || t.includes('check-in') || t.includes('resort') || t.includes('lodg')) return '🏨';
  if (t.includes('drive') || t.includes('taxi') || t.includes('car') || t.includes('transport')) return '🚗';
  if (t.includes('fort') || t.includes('palace') || t.includes('sight') || t.includes('monument')) return '🏰';
  if (t.includes('beach') || t.includes('sunset') || t.includes('water') || t.includes('scuba')) return '🏖️';
  if (t.includes('food') || t.includes('dinner') || t.includes('lunch') || t.includes('restaurant')) return '🍲';
  return '📍';
}

function formatTimelineDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
