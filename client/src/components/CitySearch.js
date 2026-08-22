/**
 * City & Activity Discovery Search Component
 * Provides debounced search, regional filters, and city cards grid.
 */
import { renderCityActivitiesModal } from './CityActivitiesModal.js';

const REGIONS = [
  { id: '', label: '🌍 All Regions' },
  { id: 'north', label: '🏔️ North India' },
  { id: 'south', label: '🌴 South India' },
  { id: 'west', label: '🏖️ West India' },
  { id: 'east', label: '☕ East India' },
  { id: 'europe', label: '🏰 Europe' },
  { id: 'asia', label: '🏮 Asia' },
  { id: 'middle east', label: '🏜️ Middle East' },
  { id: 'north america', label: '🗽 North America' },
  { id: 'south america', label: '💃 South America' },
  { id: 'africa', label: '🦁 Africa' },
  { id: 'oceania', label: '🦘 Oceania' }
];

export function renderCitySearch() {
  const container = document.createElement('div');
  container.className = 'main-container animate-fade-in';
  container.style.maxWidth = '1200px';
  container.style.margin = '2rem auto';
  container.style.padding = '0 1.5rem';

  let searchTerm = '';
  let selectedRegion = '';
  let debounceTimer = null;
  let activeModal = null;

  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 2.5rem; display: flex; flex-direction: column; align-items: center;">
      <div class="badge" style="background: rgba(99, 102, 241, 0.15); color: var(--color-primary-light); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: var(--radius-full); padding: 0.3rem 0.85rem; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.75rem;">
        🗺️ Discover & Explore
      </div>
      <h1 style="font-family: var(--font-heading); font-size: 2.6rem; font-weight: 800; background: linear-gradient(135deg, #ffffff 30%, #94a3b8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.02em; margin-bottom: 0.75rem;">
        Find Your Next Dream Destination
      </h1>
      <p style="color: var(--color-text-muted); font-size: 1.05rem; max-width: 650px; line-height: 1.6; margin-bottom: 2rem;">
        Search curated destinations, compare cost indices, and explore handpicked activities for your next journey.
      </p>

      <!-- Search Input -->
      <div style="position: relative; width: 100%; max-width: 650px; margin-bottom: 1.5rem;">
        <span style="position: absolute; left: 1.25rem; top: 50%; transform: translateY(-50%); font-size: 1.1rem; opacity: 0.6;">🔍</span>
        <input 
          type="text" 
          id="city-search-input" 
          placeholder="Search by city name (e.g. Goa, Paris, Tokyo, Mumbai)..." 
          style="width: 100%; padding: 1rem 3rem 1rem 3.2rem; font-size: 1rem; background-color: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-full); color: var(--color-text); outline: none; box-shadow: 0 8px 30px rgba(0,0,0,0.3);"
        />
        <button id="btn-clear-search" style="display: none; position: absolute; right: 1.25rem; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; font-size: 1rem;">✕</button>
      </div>

      <!-- Regional Filter Pills -->
      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; max-width: 900px;" id="region-pills">
        ${REGIONS.map(reg => `
          <button class="btn btn-sm ${reg.id === '' ? 'btn-primary' : 'btn-secondary'}" data-region="${reg.id}" style="border-radius: var(--radius-full); padding: 0.4rem 0.95rem; font-size: 0.85rem;">
            ${reg.label}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Results Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--color-border);" id="results-header">
      <h2 style="font-family: var(--font-heading); font-size: 1.3rem; font-weight: 600; color: var(--color-text);" id="results-count">
        Searching destinations...
      </h2>
    </div>

    <!-- Cards Grid -->
    <div id="cities-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
        <div class="spinner" style="width: 36px; height: 36px; border: 3px solid rgba(99, 102, 241, 0.2); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
        <p style="color: var(--color-text-muted); margin-top: 1rem;">Loading curated destinations...</p>
      </div>
    </div>
  `;

  const searchInput = container.querySelector('#city-search-input');
  const clearBtn = container.querySelector('#btn-clear-search');
  const regionPills = container.querySelectorAll('#region-pills button');
  const grid = container.querySelector('#cities-grid');
  const resultsCount = container.querySelector('#results-count');

  // Debounced search handler
  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    clearBtn.style.display = searchTerm ? 'block' : 'none';
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      loadCities();
    }, 300);
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchTerm = '';
    clearBtn.style.display = 'none';
    loadCities();
  });

  regionPills.forEach(pill => {
    pill.addEventListener('click', () => {
      regionPills.forEach(p => {
        p.classList.remove('btn-primary');
        p.classList.add('btn-secondary');
      });
      pill.classList.remove('btn-secondary');
      pill.classList.add('btn-primary');
      selectedRegion = pill.getAttribute('data-region') || '';
      loadCities();
    });
  });

  async function loadCities() {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
        <div class="spinner" style="width: 36px; height: 36px; border: 3px solid rgba(99, 102, 241, 0.2); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
        <p style="color: var(--color-text-muted); margin-top: 1rem;">Loading destinations...</p>
      </div>
    `;

    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (selectedRegion) params.set('region', selectedRegion);

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/cities${queryStr}`);
      const cities = await res.json();

      if (!res.ok) {
        throw new Error(cities.error?.message || 'Failed to fetch destinations');
      }

      resultsCount.textContent = `${cities.length} ${cities.length === 1 ? 'Destination' : 'Destinations'} Found`;

      if (!cities || cities.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1;" class="empty-state">
            <div style="font-size: 3rem; margin-bottom: 0.5rem;">🏝️</div>
            <h3>No destinations found</h3>
            <p style="color: var(--color-text-muted); max-width: 400px; margin: 0.5rem auto 0 auto;">
              Try searching for another city name or clearing your region filters.
            </p>
          </div>
        `;
        return;
      }

      grid.innerHTML = '';
      cities.forEach(city => {
        const costSymbols = city.costIndex ? '₹'.repeat(Math.min(city.costIndex, 5)) : '₹₹';
        const card = document.createElement('div');
        card.className = 'card';
        card.style.padding = '0';
        card.style.overflow = 'hidden';
        card.style.cursor = 'pointer';
        card.style.transition = 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';

        card.innerHTML = `
          <div style="position: relative; height: 210px; overflow: hidden;">
            <img src="${escapeHtml(city.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e')}" alt="${escapeHtml(city.name)}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy" />
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to top, rgba(19,27,46,0.95) 0%, rgba(19,27,46,0.2) 60%, rgba(0,0,0,0.4) 100%);"></div>
            
            <div style="position: absolute; top: 0.75rem; left: 0.75rem; right: 0.75rem; display: flex; justify-content: space-between;">
              <span class="badge" style="background: rgba(15,23,42,0.85); backdrop-filter: blur(6px); color: #34d399; font-weight: 700; font-size: 0.8rem; border: 1px solid rgba(255,255,255,0.1);">
                ${costSymbols}
              </span>
              <span class="badge" style="background: rgba(15,23,42,0.85); backdrop-filter: blur(6px); color: #fbbf24; font-weight: 600; font-size: 0.8rem; border: 1px solid rgba(255,255,255,0.1);">
                🔥 ${city.popularity || 85}
              </span>
            </div>

            <div style="position: absolute; bottom: 0.75rem; left: 0.9rem; right: 0.9rem;">
              <span style="font-size: 0.75rem; color: #94a3b8; font-weight: 500; display: block; margin-bottom: 0.2rem;">📍 ${escapeHtml(city.country)}</span>
              <h3 style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 700; color: #fff;">${escapeHtml(city.name)}</h3>
            </div>
          </div>

          <div style="padding: 0.85rem 1rem; background: rgba(15, 23, 42, 0.4); border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: flex-end; align-items: center;">
            <span style="font-size: 0.85rem; font-weight: 600; color: var(--color-primary-light);">View Activities →</span>
          </div>
        `;

        card.addEventListener('click', () => {
          if (activeModal) activeModal.remove();
          activeModal = renderCityActivitiesModal({
            city,
            onClose: () => {
              if (activeModal) {
                activeModal.remove();
                activeModal = null;
              }
            }
          });
          document.body.appendChild(activeModal);
        });

        card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-4px)'; });
        card.addEventListener('mouseleave', () => { card.style.transform = 'translateY(0)'; });

        grid.appendChild(card);
      });
    } catch (err) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1;" class="card">
          <p style="color: #f87171; text-align: center;">⚠️ ${escapeHtml(err.message)}</p>
        </div>
      `;
    }
  }

  loadCities();
  return container;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
