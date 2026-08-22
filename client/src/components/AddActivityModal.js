/**
 * Add Activity Modal (Light Editorial Design)
 * Allows searching/selecting curated city activities OR creating custom activities for a stop.
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
  modal.style.backgroundColor = 'rgba(15, 23, 42, 0.7)';
  modal.style.backdropFilter = 'blur(12px)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '1200';
  modal.style.padding = '1rem';

  let curatedActivities = [];
  let selectedActivity = null;
  let selectedCategory = '';
  let activeTab = 'curated';

  modal.innerHTML = `
    <div class="card animate-fade-in" style="width: 100%; max-width: 680px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; background: #ffffff; border-radius: 24px; border: 1px solid var(--color-border); box-shadow: 0 25px 70px rgba(15,23,42,0.3); padding: 0;">
      
      <!-- Header -->
      <div style="padding: 1.5rem 1.75rem; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; background: #ffffff;">
        <div>
          <span class="badge" style="background: #e6f4f2; color: #006d64; margin-bottom: 0.35rem; font-weight: 800; padding: 0.3rem 0.75rem;">
            📍 DESTINATION • ${escapeHtml(stop.cityName || 'Destination')}
          </span>
          <h2 style="font-family: var(--font-heading); font-size: 1.6rem; font-weight: 900; color: #0f172a; line-height: 1.2;">
            Add Activity to Itinerary
          </h2>
        </div>
        <button style="width: 36px; height: 36px; border-radius: 50%; background: #f1f5f9; border: none; color: #0f172a; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 700;" id="btn-close-act-modal">✕</button>
      </div>

      <!-- Tab Switcher (Curated vs Custom) -->
      <div style="display: flex; padding: 0.75rem 1.75rem; background: #ffffff; border-bottom: 1px solid var(--color-border); gap: 0.5rem;">
        <button class="btn btn-sm" id="tab-curated" style="border-radius: 9999px; font-weight: 700; background: #006d64; color: #ffffff; padding: 0.45rem 1.1rem;">
          ✨ Curated Sights
        </button>
        <button class="btn btn-sm" id="tab-custom" style="border-radius: 9999px; font-weight: 700; background: #f8fafc; color: #0f172a; border: 1px solid #cbd5e1; padding: 0.45rem 1.1rem;">
          ✍️ Custom Activity
        </button>
      </div>

      <!-- Category Filter Pills -->
      <div id="curated-filters" style="padding: 0.75rem 1.75rem; background: #f8fafc; border-bottom: 1px solid var(--color-border); display: flex; gap: 0.4rem; overflow-x: auto;">
        ${CATEGORIES.map(c => `
          <button class="btn-cat-pill-act" data-cat="${c.id}" style="padding: 0.35rem 0.85rem; font-size: 0.82rem; border-radius: 9999px; white-space: nowrap; font-weight: 700; border: 1px solid ${c.id === '' ? '#006d64' : '#cbd5e1'}; background: ${c.id === '' ? '#006d64' : '#ffffff'}; color: ${c.id === '' ? '#ffffff' : '#0f172a'}; cursor: pointer;">
            ${c.label}
          </button>
        `).join('')}
      </div>

      <!-- Content Area -->
      <div style="padding: 1.5rem 1.75rem; overflow-y: auto; flex: 1; background: #f8fafc;">
        <!-- Curated List View -->
        <div id="curated-view">
          <div style="text-align: center; padding: 2rem 0;" id="act-loading">
            <div class="spinner" style="width: 32px; height: 32px; border: 3px solid rgba(0, 109, 100, 0.2); border-top-color: #006d64; border-radius: 50%; margin: 0 auto;"></div>
            <p style="color: #64748b; margin-top: 0.75rem; font-size: 0.9rem;">Loading curated activities...</p>
          </div>
          <div id="act-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem;"></div>
        </div>

        <!-- Custom Configuration Form -->
        <div id="act-config-form" style="display: none; background: #ffffff; padding: 1.5rem; border-radius: 20px; border: 1px solid var(--color-border);">
          <div class="form-group" style="margin-bottom: 1.15rem;">
            <label class="form-label" style="font-weight: 700; color: #0f172a; margin-bottom: 0.35rem; display: block;">Activity Title / Name <span style="color: #ef4444;">*</span></label>
            <input type="text" class="form-input" id="act-title" placeholder="e.g. Sunset Scuba Diving, Local Street Food Tour..." required style="width: 100%; height: 46px; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 0 1rem; font-size: 0.95rem;" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.15rem;">
            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-weight: 700; color: #0f172a; margin-bottom: 0.35rem; display: block;">Category</label>
              <select class="form-input" id="act-category" style="width: 100%; height: 46px; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 0 0.85rem; font-weight: 600;">
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
            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-weight: 700; color: #0f172a; margin-bottom: 0.35rem; display: block;">Start Time</label>
              <input type="time" class="form-input" id="act-time" value="10:00" style="width: 100%; height: 46px; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 0 0.85rem;" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.15rem;">
            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-weight: 700; color: #0f172a; margin-bottom: 0.35rem; display: block;">Estimated Duration</label>
              <input type="text" class="form-input" id="act-duration" placeholder="e.g. 2 hours" value="2 hours" style="width: 100%; height: 46px; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 0 1rem;" />
            </div>
            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-weight: 700; color: #0f172a; margin-bottom: 0.35rem; display: block;">Estimated Cost (₹)</label>
              <input type="number" class="form-input" id="act-cost" placeholder="1500" min="0" value="1500" style="width: 100%; height: 46px; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 0 1rem; font-weight: 700; color: #006d64;" />
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-weight: 700; color: #0f172a; margin-bottom: 0.35rem; display: block;">Activity Notes (Optional)</label>
            <input type="text" class="form-input" id="act-notes" placeholder="e.g. Book online, bring sunscreen & swimwear..." style="width: 100%; height: 46px; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 0 1rem;" />
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div style="padding: 1.25rem 1.75rem; border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: 0.75rem; background: #ffffff;">
        <button class="btn btn-secondary" id="btn-cancel-act" style="border-radius: 9999px; height: 46px; padding: 0 1.5rem; font-weight: 700;">Cancel</button>
        <button class="btn btn-primary" id="btn-confirm-add-act" disabled style="background: #006d64; border-radius: 9999px; height: 46px; padding: 0 1.75rem; font-weight: 800; display: flex; align-items: center; gap: 0.4rem;">
          <span style="font-size: 1.2rem; font-weight: 800; line-height: 1;">+</span>
          <span>Add Activity</span>
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
    tabCurated.style.background = '#006d64';
    tabCurated.style.color = '#ffffff';
    tabCurated.style.border = 'none';
    tabCustom.style.background = '#f8fafc';
    tabCustom.style.color = '#0f172a';
    tabCustom.style.border = '1px solid #cbd5e1';

    curatedFilters.style.display = 'flex';
    curatedView.style.display = 'block';
    actConfigForm.style.display = 'none';
    confirmBtn.disabled = !selectedActivity;
  });

  tabCustom?.addEventListener('click', () => {
    activeTab = 'custom';
    tabCustom.style.background = '#006d64';
    tabCustom.style.color = '#ffffff';
    tabCustom.style.border = 'none';
    tabCurated.style.background = '#f8fafc';
    tabCurated.style.color = '#0f172a';
    tabCurated.style.border = '1px solid #cbd5e1';

    curatedFilters.style.display = 'none';
    curatedView.style.display = 'none';
    actConfigForm.style.display = 'block';
    confirmBtn.disabled = false;
  });

  const catBtns = curatedFilters.querySelectorAll('.btn-cat-pill-act');
  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      catBtns.forEach(b => {
        b.style.background = '#ffffff';
        b.style.borderColor = '#cbd5e1';
        b.style.color = '#0f172a';
      });
      btn.style.background = '#006d64';
      btn.style.borderColor = '#006d64';
      btn.style.color = '#ffffff';
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
        curatedActivities = [];
      }

      // Default seed activities fallback
      if (!Array.isArray(curatedActivities) || curatedActivities.length === 0) {
        curatedActivities = [
          { name: `Guided Cultural Tour in ${stop.cityName}`, category: 'Culture', durationMinutes: 120, estimatedCost: 1500 },
          { name: `Sunset Viewpoint & Dining`, category: 'Sightseeing', durationMinutes: 90, estimatedCost: 2200 },
          { name: `Local Water Sports & Adventure`, category: 'Adventure', durationMinutes: 180, estimatedCost: 3500 },
          { name: `Bazaar & Handicraft Shopping`, category: 'Shopping', durationMinutes: 120, estimatedCost: 800 }
        ];
        if (selectedCategory) {
          curatedActivities = curatedActivities.filter(a => a.category.toLowerCase() === selectedCategory.toLowerCase());
        }
      }

      actLoading.style.display = 'none';

      actList.innerHTML = curatedActivities.map(act => {
        const costStr = act.estimatedCost > 0 ? `₹${parseFloat(act.estimatedCost).toLocaleString('en-IN')}` : 'Free';
        const durStr = act.durationMinutes ? `${Math.round(act.durationMinutes / 60)}h` : '2 hours';
        return `
          <div class="card act-pick-card" style="padding: 1.15rem; cursor: pointer; background: #ffffff; border: 1.5px solid var(--color-border); border-radius: 16px; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.2s ease; box-shadow: var(--shadow-sm);">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span class="badge" style="background: #e6f4f2; color: #006d64; font-size: 0.72rem; font-weight: 700;">
                  ${escapeHtml(act.category || 'Sightseeing')}
                </span>
                <span style="font-size: 0.75rem; color: #64748b;">⏱️ ${durStr}</span>
              </div>
              <h4 style="font-family: var(--font-heading); font-size: 1.05rem; font-weight: 800; color: #0f172a; line-height: 1.3;">
                ${escapeHtml(act.name)}
              </h4>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.85rem; padding-top: 0.75rem; border-top: 1px solid var(--color-border);">
              <span style="font-weight: 800; color: #006d64; font-size: 0.95rem;">${costStr}</span>
              <button class="btn btn-secondary btn-sm" style="font-size: 0.78rem; padding: 0.25rem 0.75rem; border-radius: 9999px; font-weight: 700; background: #f1f5f9;">Select +</button>
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
          card.style.borderColor = '#006d64';
          card.style.boxShadow = '0 0 0 2px #006d64';
          selectedActivity = curatedActivities[idx];
          
          modal.querySelector('#act-title').value = selectedActivity.name;
          modal.querySelector('#act-category').value = selectedActivity.category || 'Sightseeing';
          modal.querySelector('#act-cost').value = selectedActivity.estimatedCost || 1500;
          modal.querySelector('#act-duration').value = selectedActivity.durationMinutes ? `${Math.round(selectedActivity.durationMinutes / 60)} hours` : '2 hours';
          
          confirmBtn.disabled = false;
        });
      });

    } catch (err) {
      actLoading.style.display = 'none';
      actList.innerHTML = `<div style="grid-column: 1 / -1; color: #ef4444; text-align: center;">${escapeHtml(err.message)}</div>`;
    }
  }

  confirmBtn?.addEventListener('click', async () => {
    let title = '';
    let category = 'Sightseeing';
    let startTime = '10:00';
    let duration = '2 hours';
    let cost = 0;
    let notes = '';

    if (activeTab === 'curated' && selectedActivity) {
      title = selectedActivity.name;
      category = selectedActivity.category || 'Sightseeing';
      cost = parseFloat(selectedActivity.estimatedCost) || 1500;
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
      alert('Please enter an activity title or pick a curated activity.');
      return;
    }

    try {
      confirmBtn.innerHTML = '<span>Saving...</span>';
      confirmBtn.disabled = true;

      const payload = {
        activityId: selectedActivity?.id || null,
        title,
        category,
        date: stop.startDate || new Date().toISOString().slice(0, 10),
        startTime,
        duration,
        cost,
        notes
      };

      const savedActivity = await api.addStopActivity(stop.id, payload);
      if (onActivityAdded) {
        await onActivityAdded(savedActivity);
      }
      modal.remove();
    } catch (err) {
      confirmBtn.innerHTML = '<span>+ Add Activity</span>';
      confirmBtn.disabled = false;
      alert('Could not save activity: ' + err.message);
    }
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
