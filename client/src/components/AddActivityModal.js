/**
 * Add Activity Modal (Light Editorial Design)
 * Allows searching/selecting curated city activities or adding custom activities to a stop.
 */
import { api } from '../api.js';

const CATEGORIES = [
  { id: '', label: 'All' },
  { id: 'Adventure', label: '🧗 Adventure' },
  { id: 'Sightseeing', label: '🏛️ Sightseeing' },
  { id: 'Food', label: '🍲 Food & Dining' },
  { id: 'Culture', label: '🎭 Culture' },
  { id: 'Relaxing', label: '🌴 Relaxing' },
  { id: 'Shopping', label: '🛍️ Shopping' }
];

export function renderAddActivityModal({ stop, onActivityAdded, onClose }) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop animate-fade-in';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.right = '0';
  modal.style.bottom = '0';
  modal.style.backgroundColor = 'rgba(15, 23, 42, 0.65)';
  modal.style.backdropFilter = 'blur(12px)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '1000';
  modal.style.padding = '1rem';

  let curatedActivities = [];
  let selectedActivity = null;
  let selectedCategory = '';
  let activeTab = 'curated';

  modal.innerHTML = `
    <div class="card animate-fade-in" style="width: 100%; max-width: 680px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; background: #ffffff; border: 1px solid var(--color-border); box-shadow: 0 25px 60px rgba(15,23,42,0.25); padding: 0;">
      
      <!-- Header -->
      <div style="padding: 1.5rem 1.75rem; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; background: #f8fafc;">
        <div>
          <span class="badge" style="background: var(--color-primary-subtle); color: var(--color-primary); margin-bottom: 0.25rem; font-weight: 700;">
            🎯 STOP ACTIVITY • ${escapeHtml(stop.cityName || 'Destination')}
          </span>
          <h2 style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 900; color: #0f172a;">
            Add Activity to Itinerary
          </h2>
        </div>
        <button style="background: none; border: none; color: #64748b; font-size: 1.3rem; cursor: pointer; font-weight: 700;" id="btn-close-act-modal">✕</button>
      </div>

      <!-- Tab Switcher (Curated vs Custom) -->
      <div style="display: flex; padding: 0.75rem 1.75rem; background: #ffffff; border-bottom: 1px solid var(--color-border); gap: 0.5rem;">
        <button class="btn btn-sm btn-primary" id="tab-curated" style="border-radius: var(--radius-full); font-weight: 600;">
          ✨ Curated in ${escapeHtml(stop.cityName || 'City')}
        </button>
        <button class="btn btn-sm btn-secondary" id="tab-custom" style="border-radius: var(--radius-full); font-weight: 600;">
          ✍️ Custom Activity
        </button>
      </div>

      <!-- Category Filter Pills -->
      <div id="curated-filters" style="padding: 0.75rem 1.75rem; background: #f8fafc; border-bottom: 1px solid var(--color-border); display: flex; gap: 0.4rem; overflow-x: auto;">
        ${CATEGORIES.map(c => `
          <button class="btn btn-sm ${c.id === '' ? 'btn-primary' : 'btn-secondary'}" data-cat="${c.id}" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; border-radius: var(--radius-full); white-space: nowrap; font-weight: 600;">
            ${c.label}
          </button>
        `).join('')}
      </div>

      <!-- Content Area -->
      <div style="padding: 1.5rem 1.75rem; overflow-y: auto; flex: 1; background: #ffffff;">
        <!-- Curated List View -->
        <div id="curated-view">
          <div style="text-align: center; padding: 2rem 0;" id="act-loading">
            <div class="spinner" style="width: 32px; height: 32px; border: 3px solid rgba(37, 99, 235, 0.2); border-top-color: var(--color-primary); border-radius: 50%; margin: 0 auto;"></div>
            <p style="color: #64748b; margin-top: 0.75rem; font-size: 0.9rem;">Loading activities...</p>
          </div>
          <div id="act-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem;"></div>
        </div>

        <!-- Custom Configuration Form -->
        <div id="act-config-form" style="display: none;">
          <div class="form-group">
            <label class="form-label">Activity Title</label>
            <input type="text" class="form-input" id="act-title" placeholder="e.g. Scuba Diving, Taj Mahal Sunrise Visit, Food Walk..." required />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="form-input" id="act-category" style="font-weight: 600;">
                <option value="Sightseeing">🏛️ Sightseeing</option>
                <option value="Adventure">🧗 Adventure</option>
                <option value="Food">🍲 Food & Dining</option>
                <option value="Culture">🎭 Culture</option>
                <option value="Relaxing">🌴 Relaxing</option>
                <option value="Shopping">🛍️ Shopping</option>
                <option value="Transport">🚆 Transport</option>
                <option value="Other">✨ Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Start Time</label>
              <input type="time" class="form-input" id="act-time" value="10:00" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Estimated Duration</label>
              <input type="text" class="form-input" id="act-duration" placeholder="e.g. 2 hours" value="2 hours" />
            </div>
            <div class="form-group">
              <label class="form-label">Estimated Cost (₹)</label>
              <input type="number" class="form-input" id="act-cost" placeholder="0 for free" min="0" value="0" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Activity Notes (Optional)</label>
            <input type="text" class="form-input" id="act-notes" placeholder="e.g. Book tickets online, bring sunscreen..." />
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div style="padding: 1.25rem 1.75rem; border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: 0.75rem; background: #f8fafc;">
        <button class="btn btn-secondary" id="btn-cancel-act">Cancel</button>
        <button class="btn btn-primary" id="btn-confirm-add-act" disabled>
          <span>+</span>
          <span>Add Activity to Itinerary</span>
        </button>
      </div>

    </div>
  `;

  const closeBtn = modal.querySelector('#btn-close-act-modal');
  const cancelBtn = modal.querySelector('#btn-cancel-act');
  const confirmBtn = modal.querySelector('#btn-confirm-add-act');
  const tabCurated = modal.querySelector('#tab-curated');
  const tabCustom = modal.querySelector('#tab-custom');
  const curatedFilters = modal.querySelector('#curated-filters');
  const curatedView = modal.querySelector('#curated-view');
  const actConfigForm = modal.querySelector('#act-config-form');
  const actLoading = modal.querySelector('#act-loading');
  const actList = modal.querySelector('#act-list');

  closeBtn?.addEventListener('click', onClose);
  cancelBtn?.addEventListener('click', onClose);
  modal.addEventListener('click', (e) => { if (e.target === modal) onClose(); });

  tabCurated?.addEventListener('click', () => {
    activeTab = 'curated';
    tabCurated.classList.add('btn-primary');
    tabCurated.classList.remove('btn-secondary');
    tabCustom.classList.remove('btn-primary');
    tabCustom.classList.add('btn-secondary');
    curatedFilters.style.display = 'flex';
    curatedView.style.display = 'block';
    actConfigForm.style.display = 'none';
    confirmBtn.disabled = !selectedActivity;
  });

  tabCustom?.addEventListener('click', () => {
    activeTab = 'custom';
    tabCustom.classList.add('btn-primary');
    tabCustom.classList.remove('btn-secondary');
    tabCurated.classList.remove('btn-primary');
    tabCurated.classList.add('btn-secondary');
    curatedFilters.style.display = 'none';
    curatedView.style.display = 'none';
    actConfigForm.style.display = 'block';
    confirmBtn.disabled = false;
  });

  const catBtns = curatedFilters.querySelectorAll('button');
  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      catBtns.forEach(b => { b.classList.remove('btn-primary'); b.classList.add('btn-secondary'); });
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary');
      selectedCategory = btn.getAttribute('data-cat') || '';
      loadActivities();
    });
  });

  async function loadActivities() {
    actLoading.style.display = 'block';
    actList.innerHTML = '';

    try {
      if (stop.cityId) {
        curatedActivities = await api.getCityActivities(stop.cityId, selectedCategory);
      } else {
        curatedActivities = [
          { name: 'City Landmark Exploration', category: 'Sightseeing', durationMinutes: 120, estimatedCost: 500 },
          { name: 'Traditional Culinary Food Tour', category: 'Food', durationMinutes: 90, estimatedCost: 800 },
          { name: 'Sunset Viewpoint & Photography', category: 'Relaxing', durationMinutes: 60, estimatedCost: 0 }
        ];
      }

      actLoading.style.display = 'none';

      if (!curatedActivities || curatedActivities.length === 0) {
        actList.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 2rem 0; color: #64748b;">
            No curated activities found for this category. You can add a custom activity using the tab above!
          </div>
        `;
        return;
      }

      actList.innerHTML = curatedActivities.map(act => {
        const costStr = act.estimatedCost > 0 ? `₹${parseFloat(act.estimatedCost).toLocaleString('en-IN')}` : 'Free';
        const durStr = act.durationMinutes ? `${Math.round(act.durationMinutes / 60)}h` : '2 hours';
        return `
          <div class="card act-pick-card" style="padding: 1.15rem; cursor: pointer; background: #ffffff; border: 1px solid var(--color-border); display: flex; flex-direction: column; justify-content: space-between; transition: border-color 0.2s ease, box-shadow 0.2s ease; box-shadow: var(--shadow-sm);">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span class="badge" style="background: var(--color-primary-subtle); color: var(--color-primary); font-size: 0.72rem; font-weight: 700;">
                  ${escapeHtml(act.category || 'General')}
                </span>
                <span style="font-size: 0.75rem; color: #64748b;">⏱️ ${durStr}</span>
              </div>
              <h4 style="font-family: var(--font-heading); font-size: 1.02rem; font-weight: 800; color: #0f172a; line-height: 1.3;">
                ${escapeHtml(act.name)}
              </h4>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.85rem; padding-top: 0.75rem; border-top: 1px solid var(--color-border);">
              <span style="font-weight: 800; color: ${act.estimatedCost > 0 ? '#059669' : '#0284c7'}; font-size: 0.92rem;">${costStr}</span>
              <button class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 0.25rem 0.65rem;">Select +</button>
            </div>
          </div>
        `;
      }).join('');

      actList.querySelectorAll('.act-pick-card').forEach((card, idx) => {
        card.addEventListener('click', () => {
          actList.querySelectorAll('.act-pick-card').forEach(c => {
            c.style.borderColor = 'var(--color-border)';
            c.style.boxShadow = 'var(--shadow-sm)';
          });
          card.style.borderColor = 'var(--color-primary)';
          card.style.boxShadow = '0 0 0 2px var(--color-primary)';
          selectedActivity = curatedActivities[idx];
          
          modal.querySelector('#act-title').value = selectedActivity.name;
          modal.querySelector('#act-category').value = selectedActivity.category || 'Sightseeing';
          modal.querySelector('#act-cost').value = selectedActivity.estimatedCost || 0;
          modal.querySelector('#act-duration').value = selectedActivity.durationMinutes ? `${Math.round(selectedActivity.durationMinutes / 60)} hours` : '2 hours';
          
          confirmBtn.disabled = false;
        });
      });

    } catch (err) {
      actLoading.style.display = 'none';
      actList.innerHTML = `<div style="grid-column: 1 / -1; color: #ef4444; text-align: center;">${escapeHtml(err.message)}</div>`;
    }
  }

  confirmBtn?.addEventListener('click', () => {
    let title = '';
    let category = 'Sightseeing';
    let startTime = '10:00';
    let duration = '2 hours';
    let cost = 0;
    let notes = '';

    if (activeTab === 'curated' && selectedActivity) {
      title = selectedActivity.name;
      category = selectedActivity.category || 'Sightseeing';
      cost = parseFloat(selectedActivity.estimatedCost) || 0;
      duration = selectedActivity.durationMinutes ? `${Math.round(selectedActivity.durationMinutes / 60)} hours` : '2 hours';
    } else {
      title = modal.querySelector('#act-title').value.trim();
      category = modal.querySelector('#act-category').value;
      startTime = modal.querySelector('#act-time').value || '10:00';
      duration = modal.querySelector('#act-duration').value || '2 hours';
      cost = parseFloat(modal.querySelector('#act-cost').value) || 0;
      notes = modal.querySelector('#act-notes').value.trim();
    }

    if (!title) {
      alert('Please select an activity or enter a title.');
      return;
    }

    const newActivity = {
      id: 'act-' + Date.now(),
      title,
      category,
      startTime,
      duration,
      cost,
      notes
    };

    onActivityAdded(newActivity);
    modal.remove();
  });

  loadActivities();
  return modal;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
