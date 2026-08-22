/**
 * Public Shared Journey View Component (Stitch MCP Reference)
 * Renders read-only shared trips with connected timeline, cost breakdown, and copy actions.
 */

export function renderPublicShareView({ shareToken, onBack, onOpenAuth, onCopySuccess }) {
  const container = document.createElement('div');
  container.className = 'main-container animate-fade-in';
  container.style.maxWidth = '980px';
  container.style.margin = '2rem auto';

  container.innerHTML = `
    <div style="text-align: center; padding: 5rem 2rem;" id="share-loading">
      <div class="spinner" style="width: 44px; height: 44px; border: 3px solid rgba(79, 70, 229, 0.2); border-top-color: var(--color-primary); border-radius: 50%; margin: 0 auto;"></div>
      <p style="color: var(--color-text-muted); margin-top: 1.25rem; font-size: 1.05rem;">Loading shared journey...</p>
    </div>
    <div id="share-content" style="display: none;"></div>
  `;

  async function fetchTrip() {
    try {
      const API_BASE = window.__API_BASE_URL__ || (window.location.port === '5173' ? 'http://localhost:5000/api' : '/api');
      const res = await fetch(`${API_BASE}/public/trips/${shareToken}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Shared trip not found');
      }

      renderContent(data);
    } catch (err) {
      renderError(err.message);
    }
  }

  function renderError(message) {
    const loading = container.querySelector('#share-loading');
    if (loading) loading.style.display = 'none';

    const content = container.querySelector('#share-content');
    content.style.display = 'block';
    content.innerHTML = `
      <div class="card" style="text-align: center; padding: 4rem 2rem; border-color: rgba(239, 68, 68, 0.3);">
        <div style="font-size: 3.5rem; margin-bottom: 1rem;">⚠️</div>
        <h2 style="color: #f87171; margin-bottom: 0.5rem; font-family: var(--font-heading);">Trip Not Found</h2>
        <p style="color: var(--color-text-muted); margin-bottom: 1.75rem; max-width: 480px; margin-left: auto; margin-right: auto;">${escapeHtml(message)}</p>
        <button class="btn btn-primary btn-lg" id="btn-back-error">Explore Destinations</button>
      </div>
    `;
    content.querySelector('#btn-back-error')?.addEventListener('click', onBack);
  }

  function renderContent(trip) {
    const loading = container.querySelector('#share-loading');
    if (loading) loading.style.display = 'none';

    const content = container.querySelector('#share-content');
    content.style.display = 'block';

    const formattedCost = typeof trip.totalCost === 'number'
      ? `₹${trip.totalCost.toLocaleString('en-IN')}`
      : (trip.totalCost || '₹0');

    let stopsTimelineHtml = '';
    if (!trip.stops || trip.stops.length === 0) {
      stopsTimelineHtml = `
        <div class="empty-state">
          <p>No stops added to this journey yet.</p>
        </div>
      `;
    } else {
      stopsTimelineHtml = `
        <div style="position: relative; padding-left: 2rem; margin-top: 2rem;">
          <!-- Timeline Vertical Track -->
          <div style="position: absolute; left: 18px; top: 10px; bottom: 30px; width: 2px; background: linear-gradient(to bottom, var(--color-primary), var(--color-border));"></div>

          <div style="display: flex; flex-direction: column; gap: 2rem;">
            ${trip.stops.map((stop, idx) => `
              <div style="position: relative;" class="animate-fade-in">
                <!-- Timeline Dot -->
                <div style="position: absolute; left: -2rem; top: 1.25rem; width: 14px; height: 14px; border-radius: 50%; background: var(--color-primary); border: 3px solid var(--color-bg); box-shadow: 0 0 10px var(--color-primary); z-index: 2;"></div>

                <div class="card" style="padding: 1.75rem; background: var(--color-surface); border: 1px solid var(--color-border);">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
                    <div>
                      <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-primary-light); text-transform: uppercase; letter-spacing: 0.05em;">
                        STOP ${idx + 1}
                      </span>
                      <h3 style="font-size: 1.5rem; font-family: var(--font-heading); font-weight: 800; color: #fff; margin-top: 0.15rem;">
                        📍 ${escapeHtml(stop.city)}
                      </h3>
                      ${stop.startDate ? `<p style="color: var(--color-text-muted); font-size: 0.85rem; margin-top: 0.3rem;">📅 Starting ${escapeHtml(stop.startDate)}</p>` : ''}
                    </div>

                    <span class="badge" style="background: rgba(79, 70, 229, 0.15); color: var(--color-primary-light); border: 1px solid rgba(79,70,229,0.3); padding: 0.35rem 0.75rem; font-size: 0.82rem;">
                      ${stop.activities ? stop.activities.length : 0} Activities
                    </span>
                  </div>

                  ${stop.activities && stop.activities.length > 0 ? `
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem; margin-top: 1.25rem;">
                      ${stop.activities.map(actName => `
                        <div style="background: rgba(15, 23, 42, 0.7); padding: 0.75rem 1rem; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.06); font-size: 0.9rem; color: #f1f5f9; display: flex; align-items: center; gap: 0.6rem;">
                          <span style="color: var(--color-primary-light); font-size: 1.1rem;">•</span>
                          <span style="font-weight: 500;">${escapeHtml(actName)}</span>
                        </div>
                      `).join('')}
                    </div>
                  ` : `
                    <p style="color: var(--color-text-subtle); font-size: 0.85rem; font-style: italic;">No specific activities scheduled for this stop.</p>
                  `}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    content.innerHTML = `
      <!-- Hero Trip Card -->
      <div class="card" style="padding: 2.25rem; margin-bottom: 2rem; background: linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95)); border: 1px solid rgba(79, 70, 229, 0.3); box-shadow: 0 15px 40px rgba(0,0,0,0.5);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1.25rem;">
          <div>
            <div class="badge" style="background: var(--color-accent-gradient); color: #fff; font-weight: 700; margin-bottom: 0.75rem; padding: 0.35rem 0.85rem;">
              🌟 SHARED ITINERARY
            </div>
            <h1 style="font-family: var(--font-heading); font-size: 2.5rem; font-weight: 800; background: var(--color-hero-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
              ${escapeHtml(trip.title)}
            </h1>
            <p style="color: var(--color-text-muted); font-size: 1rem; margin-top: 0.35rem;">
              ${trip.stops ? trip.stops.length : 0} Multi-City Stops • Public Read-Only Itinerary
            </p>
          </div>

          <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
            <button class="btn btn-accent" id="btn-clone-trip">
              ✨ Copy Trip to My Account
            </button>
            <button class="btn btn-secondary" id="btn-copy-link">
              🔗 Copy Share Link
            </button>
            <button class="btn btn-secondary" id="btn-explore-back">
              Explore Destinations
            </button>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.08);">
          <span style="color: var(--color-text-muted); font-size: 0.95rem; font-weight: 500;">Estimated Journey Budget:</span>
          <span style="font-size: 2rem; font-weight: 800; color: #34d399; font-family: var(--font-heading);">
            ${formattedCost}
          </span>
        </div>
      </div>

      <!-- Itinerary Section -->
      <div style="margin-top: 2.5rem;">
        <h2 style="font-family: var(--font-heading); font-size: 1.6rem; font-weight: 800; margin-bottom: 0.5rem;">
          Trip Itinerary & Planned Activities
        </h2>
        <p style="color: var(--color-text-muted); font-size: 0.95rem; margin-bottom: 1.5rem;">
          Follow the route step-by-step through scheduled destinations and handpicked activities.
        </p>
        ${stopsTimelineHtml}
      </div>
    `;

    content.querySelector('#btn-explore-back')?.addEventListener('click', onBack);
    
    const copyBtn = content.querySelector('#btn-copy-link');
    copyBtn?.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href);
      copyBtn.textContent = '✓ Link Copied!';
      setTimeout(() => { copyBtn.textContent = '🔗 Copy Share Link'; }, 2000);
    });

    const cloneBtn = content.querySelector('#btn-clone-trip');
    cloneBtn?.addEventListener('click', async () => {
      const token = localStorage.getItem('pmj_token');
      if (!token) {
        if (onOpenAuth) {
          onOpenAuth(() => {
            // Re-trigger copy after successful auth
            cloneTripAction();
          });
        } else {
          alert('Please sign in or create an account to copy this journey to your dashboard.');
        }
        return;
      }

      await cloneTripAction();
    });

    async function cloneTripAction() {
      const token = localStorage.getItem('pmj_token');
      if (!token) return;

      const originalText = cloneBtn.textContent;
      cloneBtn.textContent = '⏳ Copying Trip...';
      cloneBtn.disabled = true;

      try {
        const API_BASE = window.__API_BASE_URL__ || (window.location.port === '5173' ? 'http://localhost:5000/api' : '/api');
        const res = await fetch(`${API_BASE}/trips/${shareToken}/copy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error?.message || 'Failed to copy trip to account');
        }

        cloneBtn.textContent = '✓ Copied to Your Account!';
        setTimeout(() => {
          if (onCopySuccess) {
            onCopySuccess(data.newTripId);
          } else {
            window.location.href = '/';
          }
        }, 1000);
      } catch (err) {
        alert('Copy error: ' + err.message);
        cloneBtn.textContent = originalText;
        cloneBtn.disabled = false;
      }
    }
  }

  fetchTrip();
  return container;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
