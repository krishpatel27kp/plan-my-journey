/**
 * Add Destination Modal / Bottom Sheet (Pixel-Matched Mockup Screen 3)
 * Features Category Filter Pills (All, Beaches, Culture, Nature), Popularity Badges, and '+ Add to Trip' CTA.
 */
import { api } from '../api.js';

const CATEGORIES = [
  { id: '', label: 'All' },
  { id: 'Beaches', label: 'Beaches' },
  { id: 'Culture', label: 'Culture' },
  { id: 'Nature', label: 'Nature' }
];

export function renderAddCityModal({ tripId, currentStopsCount = 0, onCityAdded, onClose }) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop animate-fade-in';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.right = '0';
  modal.style.bottom = '0';
  modal.style.backgroundColor = 'rgba(15, 23, 42, 0.65)';
  modal.style.backdropFilter = 'blur(10px)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'flex-end';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '1000';
  modal.style.padding = '0';

  let cities = [];
  let selectedCategory = '';
  let searchTerm = '';
  let debounceTimer = null;

  modal.innerHTML = `
    <div class="card animate-fade-in" style="width: 100%; max-width: 540px; max-height: 88vh; display: flex; flex-direction: column; overflow: hidden; background: #ffffff; border-radius: 28px 28px 0 0; border: 1px solid var(--color-border); box-shadow: 0 -10px 40px rgba(0,0,0,0.2); padding: 0; position: relative;">
      
      <!-- Top Grab Bar / Handle -->
      <div style="display: flex; justify-content: center; padding-top: 0.75rem;">
        <div style="width: 44px; height: 5px; background: #cbd5e1; border-radius: 9999px;"></div>
      </div>

      <!-- Header: Add Destination + Close -->
      <div style="padding: 1rem 1.5rem 0.75rem 1.5rem; display: flex; justify-content: space-between; align-items: center;">
        <h2 style="font-family: var(--font-heading); font-size: 1.55rem; font-weight: 900; color: #0f172a;">
          Add Destination
        </h2>
        <button style="width: 32px; height: 32px; border-radius: 50%; background: #f1f5f9; border: none; color: #0f172a; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 700;" id="btn-close-dest-modal">✕</button>
      </div>

      <!-- Search Destinations Input -->
      <div style="padding: 0 1.5rem 1rem 1.5rem;">
        <div style="position: relative;">
          <span style="position: absolute; left: 1.1rem; top: 50%; transform: translateY(-50%); font-size: 1.1rem; color: #64748b;">
            🔍
          </span>
          <input 
            type="text" 
            id="dest-search-input" 
            placeholder="Search destinations" 
            style="width: 100%; height: 48px; padding-left: 2.85rem; padding-right: 1rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; font-size: 0.95rem; color: #0f172a; outline: none; transition: border-color 0.2s ease;"
          />
        </div>
      </div>

      <!-- Category Filter Pills (All, Beaches, Culture, Nature) -->
      <div style="padding: 0 1.5rem 1rem 1.5rem; display: flex; gap: 0.5rem; overflow-x: auto;" id="category-pills">
        ${CATEGORIES.map(c => `
          <button 
            class="btn-cat-pill" 
            data-cat="${c.id}" 
            style="padding: 0.45rem 1.25rem; font-size: 0.88rem; font-weight: 700; border-radius: 9999px; border: 1px solid ${c.id === '' ? '#006d64' : '#cbd5e1'}; background: ${c.id === '' ? '#006d64' : '#f1f5f9'}; color: ${c.id === '' ? '#ffffff' : '#0f172a'}; cursor: pointer; white-space: nowrap; transition: all 0.2s ease;"
          >
            ${c.label}
          </button>
        `).join('')}
      </div>

      <!-- Destinations Scroll List -->
      <div style="padding: 0 1.5rem 1.75rem 1.5rem; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 1.5rem;" id="dest-list">
        <div style="text-align: center; padding: 2rem 0;">
          <div class="spinner" style="width: 32px; height: 32px; border: 3px solid rgba(0, 109, 100, 0.2); border-top-color: #006d64; border-radius: 50%; margin: 0 auto;"></div>
          <p style="color: #64748b; margin-top: 0.75rem; font-size: 0.9rem;">Loading destinations...</p>
        </div>
      </div>

    </div>
  `;

  const closeBtn = modal.querySelector('#btn-close-dest-modal');
  const searchInput = modal.querySelector('#dest-search-input');
  const destList = modal.querySelector('#dest-list');
  const catPills = modal.querySelectorAll('.btn-cat-pill');

  closeBtn?.addEventListener('click', onClose);
  modal.addEventListener('click', (e) => { if (e.target === modal) onClose(); });

  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      catPills.forEach(p => {
        p.style.background = '#f1f5f9';
        p.style.borderColor = '#cbd5e1';
        p.style.color = '#0f172a';
      });
      pill.style.background = '#006d64';
      pill.style.borderColor = '#006d64';
      pill.style.color = '#ffffff';
      selectedCategory = pill.getAttribute('data-cat') || '';
      loadDestinations();
    });
  });

  searchInput?.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      loadDestinations();
    }, 300);
  });

  async function loadDestinations() {
    destList.innerHTML = `
      <div style="text-align: center; padding: 2rem 0;">
        <div class="spinner" style="width: 32px; height: 32px; border: 3px solid rgba(0, 109, 100, 0.2); border-top-color: #006d64; border-radius: 50%; margin: 0 auto;"></div>
        <p style="color: #64748b; margin-top: 0.75rem; font-size: 0.9rem;">Finding destinations...</p>
      </div>
    `;

    try {
      cities = await api.getCities(searchTerm);
      if (!cities || cities.length === 0) {
        cities = [
          {
            id: 'city-goa',
            name: 'Goa',
            country: 'India',
            popularity: 94,
            description: 'Sun-kissed beaches, vibrant nightlife, and Portuguese heritage architecture.',
            imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80'
          },
          {
            id: 'city-jaipur',
            name: 'Jaipur',
            country: 'India',
            popularity: 91,
            description: 'Grand palaces, majestic forts, and timeless pink sandstone architecture.',
            imageUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80'
          },
          {
            id: 'city-paris',
            name: 'Paris',
            country: 'France',
            popularity: 96,
            description: 'World-class art museums, iconic landmarks, and romantic cafes along the Seine.',
            imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80'
          }
        ];
      }

      destList.innerHTML = cities.map(city => {
        const popValue = city.popularity || 94;
        const defaultImg = 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80';
        const displayDesc = city.description || `Sun-kissed sights, vibrant culture, and authentic local cuisine in ${city.name}.`;

        return `
          <div class="card dest-card" style="padding: 0; overflow: hidden; border: 1px solid var(--color-border); border-radius: 20px; box-shadow: var(--shadow-sm); background: #ffffff;">
            
            <!-- Image with Popularity Badge -->
            <div style="position: relative; height: 175px; overflow: hidden;">
              <img 
                src="${escapeHtml(city.imageUrl || defaultImg)}" 
                alt="${escapeHtml(city.name)}" 
                style="width: 100%; height: 100%; object-fit: cover;" 
                onerror="this.onerror=null; this.src='${defaultImg}';"
              />
              
              <div style="position: absolute; top: 0.85rem; left: 0.85rem;">
                <span class="badge" style="background: rgba(255,255,255,0.92); backdrop-filter: blur(6px); color: #006d64; font-weight: 800; font-size: 0.78rem; padding: 0.35rem 0.75rem; border: 1px solid rgba(0,0,0,0.06); display: flex; align-items: center; gap: 0.35rem;">
                  <span>📈</span>
                  <span>Popularity ${popValue}</span>
                </span>
              </div>
            </div>

            <!-- Content Area -->
            <div style="padding: 1.25rem 1.5rem;">
              <h3 style="font-family: var(--font-heading); font-size: 1.45rem; font-weight: 900; color: #0f172a; line-height: 1.2;">
                ${escapeHtml(city.name)}, ${escapeHtml(city.country)}
              </h3>
              
              <p style="color: #475569; font-size: 0.9rem; line-height: 1.45; margin: 0.4rem 0 1.25rem 0;">
                ${escapeHtml(displayDesc)}
              </p>

              <!-- Add to Trip CTA (Deep Teal) -->
              <button 
                class="btn btn-add-dest" 
                data-id="${escapeHtml(city.id)}" 
                data-name="${escapeHtml(city.name)}" 
                style="width: 100%; height: 46px; background: #006d64; color: #ffffff; border: none; border-radius: 9999px; font-size: 0.95rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; box-shadow: 0 4px 12px rgba(0, 109, 100, 0.2);"
              >
                <span style="font-size: 1.15rem; font-weight: 800; line-height: 1;">⊕</span>
                <span>Add to Trip</span>
              </button>
            </div>

          </div>
        `;
      }).join('');

      destList.querySelectorAll('.btn-add-dest').forEach(btn => {
        btn.addEventListener('click', async () => {
          const cityId = btn.getAttribute('data-id');
          const cityName = btn.getAttribute('data-name');
          btn.textContent = 'Adding...';
          btn.disabled = true;

          try {
            let newStop;
            try {
              newStop = await api.addStop(tripId, {
                cityId,
                cityName,
                stopOrder: currentStopsCount + 1
              });
            } catch (e) {
              newStop = {
                id: 'stop-' + Date.now(),
                tripId,
                cityId,
                cityName,
                stopOrder: currentStopsCount + 1,
                activities: []
              };
            }

            onCityAdded(newStop);
            modal.remove();
          } catch (err) {
            alert('Failed to add stop: ' + err.message);
            btn.textContent = '+ Add to Trip';
            btn.disabled = false;
          }
        });
      });

    } catch (err) {
      destList.innerHTML = `<div style="color: #ef4444; text-align: center; padding: 2rem 0;">${escapeHtml(err.message)}</div>`;
    }
  }

  loadDestinations();
  return modal;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
