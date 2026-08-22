/**
 * City Activities Modal Component
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
  modalOverlay.style.backgroundColor = 'rgba(5, 8, 18, 0.85)';
  modalOverlay.style.backdropFilter = 'blur(10px)';
  modalOverlay.style.display = 'flex';
  modalOverlay.style.alignItems = 'center';
  modalOverlay.style.justifyContent = 'center';
  modalOverlay.style.zIndex = '1000';
  modalOverlay.style.padding = '1rem';

  let selectedCategory = '';
  const costSymbols = city.costIndex ? '₹'.repeat(Math.min(city.costIndex, 5)) : '₹₹';

  modalOverlay.innerHTML = `
    <div class="modal" style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); width: 100%; maxWidth: 850px; maxHeight: 90vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 60px -15px rgba(0,0,0,0.8);">
      <div style="position: relative; height: 180px; display: flex; align-items: flex-end; padding: 1.5rem; overflow: hidden;">
        <img src="${escapeHtml(city.imageUrl || '')}" alt="${escapeHtml(city.name)}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(0.65);" />
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to top, #131b2e 10%, rgba(19, 27, 46, 0.3) 60%, rgba(0,0,0,0.5) 100%);"></div>
        <button style="position: absolute; top: 1rem; right: 1rem; width: 36px; height: 36px; border-radius: 50%; background: rgba(15,23,42,0.8); border: 1px solid rgba(255,255,255,0.15); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; font-size: 1.1rem;" id="btn-close-modal">✕</button>
        <div style="position: relative; z-index: 2;">
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.4rem;">
            <span class="badge" style="background: rgba(255,255,255,0.15); color: #fff;">📍 ${escapeHtml(city.country)}</span>
            <span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399;">Cost: ${costSymbols}</span>
            <span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24;">🔥 ${city.popularity || 85}% Popularity</span>
          </div>
          <h2 style="font-family: var(--font-heading); font-size: 2rem; font-weight: 800; color: #fff;">${escapeHtml(city.name)}</h2>
        </div>
      </div>

      <div style="border-bottom: 1px solid var(--color-border); background: rgba(11, 15, 25, 0.6); padding: 0.75rem 1.5rem;">
        <div style="display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 2px;" id="category-pills">
          ${CATEGORIES.map(cat => `
            <button class="btn btn-sm ${cat.id === '' ? 'btn-primary' : 'btn-secondary'}" data-cat="${cat.id}" style="border-radius: var(--radius-full); white-space: nowrap; padding: 0.35rem 0.85rem; font-size: 0.82rem;">
              ${cat.label}
            </button>
          `).join('')}
        </div>
      </div>

      <div style="padding: 1.5rem; overflow-y: auto; flex: 1;" id="activities-container">
        <div style="text-align: center; padding: 3rem 1rem;">
          <div class="spinner" style="width: 32px; height: 32px; border: 3px solid rgba(99, 102, 241, 0.2); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
          <p style="color: var(--color-text-muted); margin-top: 0.75rem; font-size: 0.9rem;">Loading activities in ${escapeHtml(city.name)}...</p>
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
        <div class="spinner" style="width: 32px; height: 32px; border: 3px solid rgba(99, 102, 241, 0.2); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
        <p style="color: var(--color-text-muted); margin-top: 0.75rem; font-size: 0.9rem;">Loading activities...</p>
      </div>
    `;

    try {
      const API_BASE = window.__API_BASE_URL__ || (window.location.port === '5173' ? 'http://localhost:5000/api' : '/api');
      let url = `${API_BASE}/cities/${city.id}/activities`;
      if (selectedCategory) {
        url += `?category=${encodeURIComponent(selectedCategory)}`;
      }
      const res = await fetch(url);
      const acts = await res.json();

      if (!res.ok) {
        throw new Error(acts.error?.message || 'Failed to fetch activities');
      }

      if (!acts || acts.length === 0) {
        actContainer.innerHTML = `
          <div class="empty-state" style="padding: 2.5rem 1rem;">
            <p style="color: var(--color-text-muted);">No activities found in this category for ${escapeHtml(city.name)}.</p>
          </div>
        `;
        return;
      }

      actContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem;">
          ${acts.map(act => `
            <div class="card" style="background: rgba(15, 23, 42, 0.6); padding: 1.1rem; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                  <span class="badge" style="background: rgba(99, 102, 241, 0.12); color: var(--color-primary-light); font-size: 0.75rem;">
                    ${escapeHtml(act.category || 'General')}
                  </span>
                  <span style="font-size: 0.75rem; color: var(--color-text-subtle);">⏱️ ${act.durationMinutes || 60}m</span>
                </div>
                <h4 style="font-family: var(--font-heading); font-size: 1.05rem; font-weight: 600; line-height: 1.35; margin-bottom: 0.75rem;">
                  ${escapeHtml(act.name)}
                </h4>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.06);">
                <div>
                  <span style="font-size: 0.75rem; color: var(--color-text-subtle); display: block;">Est. Cost</span>
                  <span style="font-weight: 700; color: ${act.estimatedCost > 0 ? '#34d399' : '#38bdf8'}; font-size: 0.95rem;">
                    ${act.estimatedCost > 0 ? `₹${act.estimatedCost.toLocaleString('en-IN')}` : 'Free'}
                  </span>
                </div>
                <button class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 0.3rem 0.65rem;" onclick="alert('Added ${escapeHtml(act.name)} to your plan!')">
                  + Add
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) {
      actContainer.innerHTML = `
        <div class="card" style="border-color: rgba(239,68,68,0.3); text-align: center; padding: 2rem;">
          <p style="color: #f87171;">⚠️ ${escapeHtml(err.message)}</p>
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
