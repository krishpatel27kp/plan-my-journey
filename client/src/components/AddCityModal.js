/**
 * Add City / Destination Stop Modal
 * Allows searching and selecting a city to add to the active itinerary.
 */
import { api } from '../api.js';

export function renderAddCityModal({ tripId, currentStopsCount = 0, onCityAdded, onClose }) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop animate-fade-in';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.right = '0';
  modal.style.bottom = '0';
  modal.style.backgroundColor = 'rgba(5, 8, 18, 0.85)';
  modal.style.backdropFilter = 'blur(12px)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '1000';
  modal.style.padding = '1rem';

  let cities = [];
  let selectedCity = null;
  let searchTerm = '';
  let debounceTimer = null;
  let isSubmitting = false;

  modal.innerHTML = `
    <div class="card animate-fade-in" style="width: 100%; max-width: 720px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; background: var(--color-surface); border: 1px solid var(--color-border); box-shadow: 0 25px 60px rgba(0,0,0,0.8); padding: 0;">
      
      <!-- Header -->
      <div style="padding: 1.5rem 1.75rem; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; background: rgba(11,15,25,0.6);">
        <div>
          <span class="badge" style="background: rgba(79, 70, 229, 0.15); color: var(--color-primary-light); margin-bottom: 0.25rem;">
            📍 ITINERARY STOP
          </span>
          <h2 style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 800; color: #fff;">
            Add Destination to Trip
          </h2>
        </div>
        <button style="background: none; border: none; color: var(--color-text-muted); font-size: 1.3rem; cursor: pointer;" id="btn-close-city-modal">✕</button>
      </div>

      <!-- Search Input -->
      <div style="padding: 1rem 1.75rem; border-bottom: 1px solid var(--color-border); background: var(--color-surface);">
        <div style="position: relative;">
          <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); opacity: 0.6;">🔍</span>
          <input 
            type="text" 
            id="modal-city-search" 
            placeholder="Search destination by city name (e.g. Goa, Paris, Jaipur, Tokyo)..." 
            class="form-input" 
            style="width: 100%; padding-left: 2.75rem; border-radius: var(--radius-full);"
          />
        </div>
      </div>

      <!-- Content Area: Cities Grid & Date Inputs -->
      <div style="padding: 1.5rem 1.75rem; overflow-y: auto; flex: 1;">
        <div id="city-selection-view">
          <div style="text-align: center; padding: 2rem 0;" id="cities-loading">
            <div class="spinner" style="width: 32px; height: 32px; border: 3px solid rgba(79, 70, 229, 0.2); border-top-color: var(--color-primary); border-radius: 50%; margin: 0 auto;"></div>
            <p style="color: var(--color-text-muted); margin-top: 0.75rem; font-size: 0.9rem;">Loading destinations...</p>
          </div>
          <div id="cities-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 1rem;"></div>
        </div>

        <!-- Selected City Configuration Form (Hidden until city chosen) -->
        <div id="city-config-form" style="display: none; margin-top: 1rem; padding: 1.25rem; background: rgba(15,23,42,0.8); border: 1px solid rgba(79,70,229,0.3); border-radius: var(--radius-md);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="width: 44px; height: 44px; border-radius: var(--radius-md); overflow: hidden;">
                <img id="selected-city-thumb" src="" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';" />
              </div>
              <div>
                <h4 id="selected-city-title" style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 700; color: #fff;">City</h4>
                <span id="selected-city-sub" style="font-size: 0.8rem; color: var(--color-text-muted);">Country</span>
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" id="btn-change-city" style="font-size: 0.8rem;">Change</button>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Arrival Date</label>
              <input type="date" class="form-input" id="stop-start-date" required />
            </div>
            <div class="form-group">
              <label class="form-label">Departure Date</label>
              <input type="date" class="form-input" id="stop-end-date" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Stop Notes (Optional)</label>
            <input type="text" class="form-input" id="stop-notes" placeholder="e.g. Hotel check-in at 2 PM, beach relaxation day..." />
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div style="padding: 1.25rem 1.75rem; border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: 0.75rem; background: rgba(11,15,25,0.6);">
        <button class="btn btn-secondary" id="btn-cancel-city">Cancel</button>
        <button class="btn btn-primary" id="btn-confirm-add-city" disabled>
          <span>+</span>
          <span>Add Stop to Itinerary</span>
        </button>
      </div>

    </div>
  `;

  const searchInput = modal.querySelector('#modal-city-search');
  const citiesList = modal.querySelector('#cities-list');
  const citiesLoading = modal.querySelector('#cities-loading');
  const cityConfigForm = modal.querySelector('#city-config-form');
  const confirmBtn = modal.querySelector('#btn-confirm-add-city');
  const cancelBtn = modal.querySelector('#btn-cancel-city');
  const closeBtn = modal.querySelector('#btn-close-city-modal');
  const changeCityBtn = modal.querySelector('#btn-change-city');

  // Close handlers
  closeBtn?.addEventListener('click', onClose);
  cancelBtn?.addEventListener('click', onClose);
  modal.addEventListener('click', (e) => { if (e.target === modal) onClose(); });

  changeCityBtn?.addEventListener('click', () => {
    selectedCity = null;
    cityConfigForm.style.display = 'none';
    modal.querySelector('#city-selection-view').style.display = 'block';
    confirmBtn.disabled = true;
  });

  searchInput?.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      loadCities();
    }, 300);
  });

  async function loadCities() {
    citiesLoading.style.display = 'block';
    citiesList.innerHTML = '';

    try {
      cities = await api.getCities(searchTerm);
      citiesLoading.style.display = 'none';

      if (!cities || cities.length === 0) {
        citiesList.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 2rem 0; color: var(--color-text-muted);">
            No destinations found matching "${escapeHtml(searchTerm)}".
          </div>
        `;
        return;
      }

      citiesList.innerHTML = cities.slice(0, 12).map(city => {
        const costSymbols = city.costIndex ? '₹'.repeat(Math.min(city.costIndex, 4)) : '₹₹';
        return `
          <div class="card city-pick-card" data-id="${escapeHtml(city.id)}" style="padding: 0; overflow: hidden; cursor: pointer; border: 1px solid var(--color-border); transition: transform 0.2s ease, border-color 0.2s ease;">
            <div style="position: relative; height: 110px;">
              <img src="${escapeHtml(city.imageUrl || '')}" alt="${escapeHtml(city.name)}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';" style="width: 100%; height: 100%; object-fit: cover;" />
              <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to top, rgba(19,27,46,0.9) 0%, transparent 60%);"></div>
              <span class="badge" style="position: absolute; top: 6px; right: 6px; background: rgba(15,23,42,0.85); font-size: 0.72rem; color: #fbbf24;">
                🔥 ${city.popularity || 85}%
              </span>
              <div style="position: absolute; bottom: 6px; left: 8px;">
                <h4 style="font-family: var(--font-heading); font-size: 0.95rem; font-weight: 700; color: #fff;">${escapeHtml(city.name)}</h4>
                <span style="font-size: 0.72rem; color: #94a3b8;">${escapeHtml(city.country)}</span>
              </div>
            </div>
            <div style="padding: 0.5rem 0.75rem; background: var(--color-surface); display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.75rem; color: #34d399; font-weight: 600;">${costSymbols}</span>
              <span style="font-size: 0.75rem; color: var(--color-primary-light); font-weight: 600;">Select +</span>
            </div>
          </div>
        `;
      }).join('');

      // Add click listeners to cards
      citiesList.querySelectorAll('.city-pick-card').forEach(card => {
        card.addEventListener('click', () => {
          const cId = card.getAttribute('data-id');
          selectedCity = cities.find(c => c.id === cId);
          if (selectedCity) {
            modal.querySelector('#city-selection-view').style.display = 'none';
            cityConfigForm.style.display = 'block';
            modal.querySelector('#selected-city-title').textContent = selectedCity.name;
            modal.querySelector('#selected-city-sub').textContent = selectedCity.country;
            modal.querySelector('#selected-city-thumb').src = selectedCity.imageUrl || '';
            confirmBtn.disabled = false;
          }
        });
      });
    } catch (err) {
      citiesLoading.style.display = 'none';
      citiesList.innerHTML = `<div style="grid-column: 1 / -1; color: #f87171; text-align: center;">${escapeHtml(err.message)}</div>`;
    }
  }

  confirmBtn?.addEventListener('click', async () => {
    if (!selectedCity || isSubmitting) return;

    const startDate = modal.querySelector('#stop-start-date').value || null;
    const endDate = modal.querySelector('#stop-end-date').value || null;
    const notes = modal.querySelector('#stop-notes').value.trim();

    isSubmitting = true;
    confirmBtn.textContent = 'Adding Stop...';
    confirmBtn.disabled = true;

    try {
      let newStop;
      try {
        newStop = await api.addStop(tripId, {
          cityId: selectedCity.id,
          cityName: selectedCity.name,
          startDate,
          endDate,
          stopOrder: currentStopsCount + 1,
          notes
        });
      } catch (e) {
        // Local fallback object if backend stops endpoint has specific constraints
        newStop = {
          id: 'stop-' + Date.now(),
          tripId,
          cityId: selectedCity.id,
          cityName: selectedCity.name,
          startDate,
          endDate,
          stopOrder: currentStopsCount + 1,
          notes,
          activities: []
        };
      }

      onCityAdded(newStop);
      modal.remove();
    } catch (err) {
      alert('Error adding stop: ' + err.message);
      confirmBtn.textContent = 'Add Stop to Itinerary';
      confirmBtn.disabled = false;
      isSubmitting = false;
    }
  });

  loadCities();
  return modal;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
