/**
 * City Activities Modal Component (Light Editorial Design)
 * Displays activity details with explicit Rupee (₹) pricing filtered by category for a selected city.
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

const COST_MAP = {
  1: '₹1,500 / day',
  2: '₹3,500 / day',
  3: '₹6,500 / day',
  4: '₹12,000 / day',
  5: '₹25,000+ / day'
};

const DEFAULT_CITY_ACTIVITIES = [
  { name: 'Guided Cultural Heritage Walk', category: 'Culture', durationMinutes: 120, estimatedCost: 1200 },
  { name: 'Sunset Coastal Cruise & Sightseeing', category: 'Sightseeing', durationMinutes: 90, estimatedCost: 2500 },
  { name: 'Authentic Local Food & Tasting Tour', category: 'Food', durationMinutes: 150, estimatedCost: 1800 },
  { name: 'Adventure Outdoor Water Sports', category: 'Adventure', durationMinutes: 180, estimatedCost: 3200 },
  { name: 'Old Town Bazaars & Craft Shopping', category: 'Shopping', durationMinutes: 120, estimatedCost: 800 },
  { name: 'Panoramic Viewpoint & Nature Trek', category: 'Relaxing', durationMinutes: 150, estimatedCost: 950 }
];

export function renderCityActivitiesModal({ city, onClose }) {
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-backdrop animate-fade-in';
  modalOverlay.style.position = 'fixed';
  modalOverlay.style.top = '0';
  modalOverlay.style.left = '0';
  modalOverlay.style.right = '0';
  modalOverlay.style.bottom = '0';
  modalOverlay.style.backgroundColor = 'rgba(15, 23, 42, 0.7)';
  modalOverlay.style.backdropFilter = 'blur(12px)';
  modalOverlay.style.display = 'flex';
  modalOverlay.style.alignItems = 'center';
  modalOverlay.style.justifyContent = 'center';
  modalOverlay.style.zIndex = '1200';
  modalOverlay.style.padding = '1rem';

  let selectedCategory = '';
  const costEstimateStr = COST_MAP[city.costIndex] || '₹3,500 / day';

  modalOverlay.innerHTML = `
    <div class="modal animate-fade-in" style="background: #ffffff; border: 1px solid var(--color-border); border-radius: 24px; width: 100%; max-width: 850px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 70px rgba(15,23,42,0.3);">
      
      <!-- Top Image Banner -->
      <div style="position: relative; height: 200px; display: flex; align-items: flex-end; padding: 1.75rem; overflow: hidden; background: #0f172a;">
        <img src="${escapeHtml(city.imageUrl || '')}" alt="${escapeHtml(city.name)}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" />
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to top, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.3) 60%, rgba(0,0,0,0.3) 100%);"></div>
        <button style="position: absolute; top: 1rem; right: 1rem; width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.92); border: none; color: #0f172a; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; font-size: 1.1rem; font-weight: 700;" id="btn-close-modal">✕</button>
        
        <div style="position: relative; z-index: 2;">
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.4rem;">
            <span class="badge" style="background: rgba(255,255,255,0.25); backdrop-filter: blur(6px); color: #fff; font-weight: 700;">📍 ${escapeHtml(city.country)}</span>
            <span class="badge" style="background: #e6f4f2; color: #006d64; font-weight: 800;">Est. Cost: ${costEstimateStr}</span>
            <span class="badge" style="background: #fef3c7; color: #d97706; font-weight: 800;">🔥 ${city.popularity || 85}% Popular</span>
          </div>
          <h2 style="font-family: var(--font-heading); font-size: 2.2rem; font-weight: 900; color: #fff;">${escapeHtml(city.name)}</h2>
        </div>
      </div>

      <!-- Categories Filter Bar -->
      <div style="border-bottom: 1px solid var(--color-border); background: #f8fafc; padding: 0.85rem 1.5rem;">
        <div style="display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 2px;" id="category-pills">
          ${CATEGORIES.map(cat => `
            <button class="btn btn-sm ${cat.id === '' ? 'btn-primary' : 'btn-secondary'}" data-cat="${cat.id}" style="border-radius: var(--radius-full); white-space: nowrap; padding: 0.4rem 1rem; font-size: 0.84rem; font-weight: 700; ${cat.id === '' ? 'background: #006d64; border-color: #006d64;' : ''}">
              ${cat.label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Activities Grid Container -->
      <div style="padding: 1.5rem; overflow-y: auto; flex: 1; background: #ffffff;" id="activities-container">
        <div style="text-align: center; padding: 3rem 1rem;">
          <div class="spinner" style="width: 32px; height: 32px; border: 3px solid rgba(0, 109, 100, 0.2); border-top-color: #006d64; border-radius: 50%; margin: 0 auto;"></div>
          <p style="color: #64748b; margin-top: 0.75rem; font-size: 0.9rem;">Loading curated activities in ${escapeHtml(city.name)}...</p>
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
        p.style.background = '#ffffff';
        p.style.borderColor = '#cbd5e1';
        p.style.color = '#0f172a';
      });
      pill.style.background = '#006d64';
      pill.style.borderColor = '#006d64';
      pill.style.color = '#ffffff';
      selectedCategory = pill.getAttribute('data-cat') || '';
      loadActivities();
    });
  });

  async function loadActivities() {
    const actContainer = modalOverlay.querySelector('#activities-container');
    actContainer.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem;">
        <div class="spinner" style="width: 32px; height: 32px; border: 3px solid rgba(0, 109, 100, 0.2); border-top-color: #006d64; border-radius: 50%; margin: 0 auto;"></div>
        <p style="color: #64748b; margin-top: 0.75rem; font-size: 0.9rem;">Loading activities...</p>
      </div>
    `;

    try {
      const API_BASE = window.__API_BASE_URL__ || (window.location.port === '5173' ? 'http://localhost:5000/api' : '/api');
      let activities = [];

      try {
        let url = `${API_BASE}/cities/${city.id}/activities`;
        if (selectedCategory) {
          url += `?category=${encodeURIComponent(selectedCategory)}`;
        }
        const res = await fetch(url);
        if (res.ok) {
          activities = await res.json();
        }
      } catch (err) {
        // Fallback below
      }

      if (!Array.isArray(activities) || activities.length === 0) {
        activities = DEFAULT_CITY_ACTIVITIES.map((act, idx) => ({
          id: `act-fallback-${idx}`,
          name: `${act.name} in ${city.name}`,
          category: act.category,
          durationMinutes: act.durationMinutes,
          estimatedCost: act.estimatedCost
        }));
        if (selectedCategory) {
          activities = activities.filter(a => a.category.toLowerCase() === selectedCategory.toLowerCase());
        }
      }

      actContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.25rem;">
          ${activities.map(act => {
            const rawCost = act.estimatedCost != null && act.estimatedCost > 0 ? parseFloat(act.estimatedCost) : 1500;
            const costFormatted = `₹${rawCost.toLocaleString('en-IN')}`;
            const durationStr = act.durationMinutes ? `${Math.round(act.durationMinutes / 60)}h ${act.durationMinutes % 60 ? (act.durationMinutes % 60) + 'm' : ''}` : '2h';
            
            return `
              <div class="card" style="padding: 1.25rem; background: #ffffff; border: 1px solid var(--color-border); border-radius: 16px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: var(--shadow-sm);">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span class="badge" style="background: #e6f4f2; color: #006d64; font-size: 0.75rem; font-weight: 700;">
                      ${escapeHtml(act.category || 'Sightseeing')}
                    </span>
                    <span style="font-size: 0.78rem; color: #64748b; font-weight: 600;">
                      ⏱️ ${durationStr}
                    </span>
                  </div>
                  <h4 style="font-family: var(--font-heading); font-size: 1.05rem; font-weight: 800; color: #0f172a; line-height: 1.3;">
                    ${escapeHtml(act.name)}
                  </h4>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.25rem; padding-top: 0.75rem; border-top: 1px solid var(--color-border);">
                  <span style="font-size: 1rem; font-weight: 800; color: #006d64;">
                    ${costFormatted}
                  </span>
                  <span style="font-size: 0.8rem; color: #64748b; font-weight: 700;">
                    per person
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
