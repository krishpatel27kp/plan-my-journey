/**
 * City Activities Modal Component (Light Editorial Design)
 * Displays activity details filtered by category for a selected city.
 */

const CATEGORIES = [
  { id: '', label: 'All Activities' },
  { id: 'Adventure', label: '🧗 Adventure' },
  { id: 'Sightseeing', label: '🏛️ Sightseeing' },
  { id: 'Food', label: '🍲 Food & Dining' },
  { id: 'Culture', label: '🎭 Culture' },
  { id: 'Relaxing', label: '🌴 Relaxing' },
  { id: 'Shopping', label: '🛍️ Shopping' }
];

export function renderCityActivitiesModal({ city, onClose }) {
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-backdrop animate-fade-in';
  modalOverlay.style.position = 'fixed';
  modalOverlay.style.top = '0';
  modalOverlay.style.left = '0';
  modalOverlay.style.right = '0';
  modalOverlay.style.bottom = '0';
  modalOverlay.style.backgroundColor = 'rgba(15, 23, 42, 0.65)';
  modalOverlay.style.backdropFilter = 'blur(10px)';
  modalOverlay.style.display = 'flex';
  modalOverlay.style.alignItems = 'center';
  modalOverlay.style.justifyContent = 'center';
  modalOverlay.style.zIndex = '1000';
  modalOverlay.style.padding = '1rem';

  let selectedCategory = '';
  const costSymbols = city.costIndex ? '₹'.repeat(Math.min(city.costIndex, 5)) : '₹₹';

  modalOverlay.innerHTML = `
    <div class="modal" style="background: #ffffff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); width: 100%; maxWidth: 850px; maxHeight: 90vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 60px -15px rgba(15,23,42,0.25);">
      <div style="position: relative; height: 190px; display: flex; align-items: flex-end; padding: 1.5rem; overflow: hidden;">
        <img src="${escapeHtml(city.imageUrl || '')}" alt="${escapeHtml(city.name)}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(0.75);" />
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to top, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.3) 60%, rgba(0,0,0,0.4) 100%);"></div>
        <button style="position: absolute; top: 1rem; right: 1rem; width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.9); border: 1px solid var(--color-border); color: #0f172a; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; font-size: 1.1rem; font-weight: 700;" id="btn-close-modal">✕</button>
        
        <div style="position: relative; z-index: 2;">
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.4rem;">
            <span class="badge" style="background: rgba(255,255,255,0.25); backdrop-filter: blur(6px); color: #fff; font-weight: 600;">📍 ${escapeHtml(city.country)}</span>
            <span class="badge" style="background: #ecfdf5; color: #059669; font-weight: 700;">Cost: ${costSymbols}</span>
            <span class="badge" style="background: #fef3c7; color: #d97706; font-weight: 700;">🔥 ${city.popularity || 85}% Popular</span>
          </div>
          <h2 style="font-family: var(--font-heading); font-size: 2.2rem; font-weight: 900; color: #fff;">${escapeHtml(city.name)}</h2>
        </div>
      </div>

      <div style="border-bottom: 1px solid var(--color-border); background: #f8fafc; padding: 0.85rem 1.5rem;">
        <div style="display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 2px;" id="category-pills">
          ${CATEGORIES.map(cat => `
            <button class="btn btn-sm ${cat.id === '' ? 'btn-primary' : 'btn-secondary'}" data-cat="${cat.id}" style="border-radius: var(--radius-full); white-space: nowrap; padding: 0.35rem 0.85rem; font-size: 0.82rem; font-weight: 600;">
              ${cat.label}
            </button>
          `).join('')}
        </div>
      </div>

      <div style="padding: 1.5rem; overflow-y: auto; flex: 1; background: #ffffff;" id="activities-container">
        <div style="text-align: center; padding: 3rem 1rem;">
          <div class="spinner" style="width: 32px; height: 32px; border: 3px solid rgba(37, 99, 235, 0.2); border-top-color: var(--color-primary); border-radius: 50%; margin: 0 auto;"></div>
          <p style="color: #64748b; margin-top: 0.75rem; font-size: 0.9rem;">Loading activities in ${escapeHtml(city.name)}...</p>
        </div>
      </div>
    </div>
  `;

  modalOverlay.querySelector('#btn-close-modal')?.addEventListener('click', onClose);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) onClose();
  });

  const catPills = modalOverlay.querySelectorAll('#category-pills button');
  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      catPills.forEach(p => {
        p.classList.remove('btn-primary');
        p.classList.add('btn-secondary');
      });
      pill.classList.remove('btn-secondary');
      pill.classList.add('btn-primary');
      selectedCategory = pill.getAttribute('data-cat') || '';
      loadActivities();
    });
  });

  async function loadActivities() {
    const actContainer = modalOverlay.querySelector('#activities-container');
    actContainer.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem;">
        <div class="spinner" style="width: 32px; height: 32px; border: 3px solid rgba(37, 99, 235, 0.2); border-top-color: var(--color-primary); border-radius: 50%; margin: 0 auto;"></div>
        <p style="color: #64748b; margin-top: 0.75rem; font-size: 0.9rem;">Loading activities...</p>
      </div>
    `;

    try {
      const API_BASE = window.__API_BASE_URL__ || (window.location.port === '5173' ? 'http://localhost:5000/api' : '/api');
      let url = `${API_BASE}/cities/${city.id}/activities`;
      if (selectedCategory) {
        url += `?category=${encodeURIComponent(selectedCategory)}`;
      }

      const res = await fetch(url);
      const activities = await res.json();

      if (!res.ok) {
        throw new Error(activities.error?.message || 'Failed to fetch activities');
      }

      if (!activities || activities.length === 0) {
        actContainer.innerHTML = `
          <div class="empty-state" style="padding: 2.5rem 1rem;">
            <div class="empty-state-icon">🏖️</div>
            <h3>No activities found</h3>
            <p class="empty-state-desc">There are no specific activities listed for this category yet.</p>
          </div>
        `;
        return;
      }

      actContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem;">
          ${activities.map(act => {
            const costFormatted = act.estimatedCost > 0 ? `₹${parseFloat(act.estimatedCost).toLocaleString('en-IN')}` : 'Free';
            const durationStr = act.durationMinutes ? `${Math.round(act.durationMinutes / 60)}h ${act.durationMinutes % 60 ? (act.durationMinutes % 60) + 'm' : ''}` : '2h';
            
            return `
              <div class="card" style="padding: 1.25rem; background: #ffffff; border: 1px solid var(--color-border); display: flex; flex-direction: column; justify-content: space-between; box-shadow: var(--shadow-sm);">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span class="badge" style="background: var(--color-primary-subtle); color: var(--color-primary); font-size: 0.75rem; font-weight: 700;">
                      ${escapeHtml(act.category || 'Sightseeing')}
                    </span>
                    <span style="font-size: 0.78rem; color: #64748b; font-weight: 500;">
                      ⏱️ ${durationStr}
                    </span>
                  </div>
                  <h4 style="font-family: var(--font-heading); font-size: 1.05rem; font-weight: 800; color: #0f172a; line-height: 1.3;">
                    ${escapeHtml(act.name)}
                  </h4>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--color-border);">
                  <span style="font-size: 0.95rem; font-weight: 800; color: ${act.estimatedCost > 0 ? '#059669' : '#0284c7'};">
                    ${costFormatted}
                  </span>
                  <span style="font-size: 0.8rem; color: var(--color-primary); font-weight: 700;">
                    ✓ Curated
                  </span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } catch (err) {
      actContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #ef4444;">
          <p>Failed to load activities: ${escapeHtml(err.message)}</p>
        </div>
      `;
    }
  }

  loadActivities();
  return modalOverlay;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
