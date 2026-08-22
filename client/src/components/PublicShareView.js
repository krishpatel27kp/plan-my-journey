/**
 * Public Shared Journey View Component
 * Renders read-only shared trips from GET /api/public/trips/:shareToken
 */

export function renderPublicShareView({ shareToken, onBack }) {
  const container = document.createElement('div');
  container.className = 'main-container animate-fade-in';
  container.style.maxWidth = '900px';
  container.style.margin = '2rem auto';

  container.innerHTML = `
    <div style="text-align: center; padding: 4rem 2rem;" id="share-loading">
      <div class="spinner" style="width: 40px; height: 40px; border: 3px solid rgba(99, 102, 241, 0.2); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
      <p style="color: var(--color-text-muted); margin-top: 1rem;">Loading shared journey...</p>
    </div>
    <div id="share-content" style="display: none;"></div>
  `;

  async function fetchTrip() {
    try {
      const res = await fetch(`/api/public/trips/${shareToken}`);
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
      <div class="card" style="text-align: center; padding: 3.5rem 2rem; border-color: rgba(239, 68, 68, 0.3);">
        <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
        <h2 style="color: #f87171; margin-bottom: 0.5rem;">Trip Not Found</h2>
        <p style="color: var(--color-text-muted); margin-bottom: 1.5rem;">${escapeHtml(message)}</p>
        <button class="btn btn-primary" id="btn-back-error">Explore Destinations</button>
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

    let stopsHtml = '';
    if (!trip.stops || trip.stops.length === 0) {
      stopsHtml = `
        <div class="empty-state">
          <p>No stops added to this journey yet.</p>
        </div>
      `;
    } else {
      stopsHtml = `
        <div style="display: flex; flex-direction: column; gap: 1.5rem; margin-top: 1.5rem;">
          ${trip.stops.map((stop, idx) => `
            <div class="card" style="padding: 1.5rem; border-left: 4px solid var(--color-primary); background: var(--color-surface);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                <div>
                  <span style="font-size: 0.8rem; font-weight: 600; color: var(--color-primary-light); text-transform: uppercase; letter-spacing: 0.05em;">
                    Stop ${idx + 1}
                  </span>
                  <h3 style="font-size: 1.35rem; font-family: var(--font-heading); margin-top: 0.2rem;">
                    📍 ${escapeHtml(stop.city)}
                  </h3>
                  ${stop.startDate ? `<p style="color: var(--color-text-muted); font-size: 0.85rem; margin-top: 0.2rem;">📅 Starting ${escapeHtml(stop.startDate)}</p>` : ''}
                </div>
                <span class="badge" style="background: rgba(99, 102, 241, 0.15); color: var(--color-primary-light); padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.8rem;">
                  ${stop.activities ? stop.activities.length : 0} Activities
                </span>
              </div>

              ${stop.activities && stop.activities.length > 0 ? `
                <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem;">
                  ${stop.activities.map(actName => `
                    <div style="background: rgba(15, 23, 42, 0.6); padding: 0.6rem 0.85rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); font-size: 0.9rem; color: #e2e8f0; display: flex; align-items: center;">
                      <span style="color: var(--color-primary-light); margin-right: 0.5rem;">•</span>
                      <span>${escapeHtml(actName)}</span>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <p style="color: var(--color-text-subtle); font-size: 0.85rem; font-style: italic;">No specific activities scheduled for this stop.</p>
              `}
            </div>
          `).join('')}
        </div>
      `;
    }

    content.innerHTML = `
      <div class="card" style="padding: 2rem; margin-bottom: 2rem; background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95)); border-color: var(--color-border);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div class="badge" style="background: rgba(99, 102, 241, 0.15); color: var(--color-primary-light); border: 1px solid rgba(99,102,241,0.3); margin-bottom: 0.5rem;">
              🌟 Shared Journey
            </div>
            <h1 style="font-family: var(--font-heading); font-size: 2.2rem; font-weight: 800; background: linear-gradient(135deg, #fff, #cbd5e1); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
              ${escapeHtml(trip.title)}
            </h1>
            <p style="color: var(--color-text-muted); font-size: 0.95rem; margin-top: 0.25rem;">
              ${trip.stops ? trip.stops.length : 0} Stops • Public Read-Only Itinerary
            </p>
          </div>

          <div style="display: flex; gap: 0.75rem; align-items: center;">
            <button class="btn btn-secondary" id="btn-copy-link">
              🔗 Copy Share Link
            </button>
            <button class="btn btn-primary" id="btn-explore-back">
              Explore Destinations
            </button>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid rgba(255,255,255,0.08);">
          <span style="color: var(--color-text-muted); font-size: 0.9rem;">Estimated Total Cost:</span>
          <span style="font-size: 1.6rem; font-weight: 800; color: #34d399; font-family: var(--font-heading);">
            ${formattedCost}
          </span>
        </div>
      </div>

      <div style="margin-top: 1.5rem;">
        <h2 style="font-family: var(--font-heading); font-size: 1.4rem; margin-bottom: 1rem;">
          Trip Itinerary & Planned Activities
        </h2>
        ${stopsHtml}
      </div>
    `;

    content.querySelector('#btn-explore-back')?.addEventListener('click', onBack);
    
    const copyBtn = content.querySelector('#btn-copy-link');
    copyBtn?.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href);
      copyBtn.textContent = '✓ Link Copied!';
      setTimeout(() => { copyBtn.textContent = '🔗 Copy Share Link'; }, 2000);
    });
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
