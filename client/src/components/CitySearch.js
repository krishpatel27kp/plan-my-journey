/**
 * City & Activity Discovery Search Component (Stitch MCP Reference)
 * Features Hero Search, Bento-style Spotlight Card, and Category Filtering.
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
  container.style.maxWidth = '1280px';
  container.style.margin = '1rem auto 3rem auto';

  let searchTerm = '';
  let selectedRegion = '';
  let debounceTimer = null;
  let activeModal = null;

  container.innerHTML = `
    <!-- Hero Search Section (Stitch Reference) -->
    <div style="text-align: center; margin-bottom: 3rem; display: flex; flex-direction: column; align-items: center;">
      <div class="badge" style="background: rgba(79, 70, 229, 0.15); color: var(--color-primary-light); border: 1px solid rgba(79, 70, 229, 0.3); border-radius: var(--radius-full); padding: 0.35rem 0.95rem; font-size: 0.85rem; font-weight: 600; margin-bottom: 1rem;">
        ✈️ DISCOVER & EXPLORE
      </div>
      
      <h1 style="font-family: var(--font-heading); font-size: 3rem; font-weight: 800; background: var(--color-hero-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.02em; margin-bottom: 0.75rem; line-height: 1.15;">
        Where do you want to go?
      </h1>
      <p style="color: var(--color-text-muted); font-size: 1.1rem; max-width: 620px; line-height: 1.6; margin-bottom: 2rem;">
        Search curated destinations, compare cost indices, and explore handpicked activities for your next journey.
      </p>

      <!-- Stitch 60px Hero Search Input -->
      <div style="position: relative; width: 100%; max-width: 700px; margin-bottom: 1.5rem;">
        <div style="position: absolute; left: 1.25rem; top: 50%; transform: translateY(-50%); font-size: 1.25rem; opacity: 0.6;">
          🔍
        </div>
        <input 
          type="text" 
          id="city-search-input" 
          placeholder="Search destinations (e.g. Goa, Paris, Tokyo, Mumbai, Rome)..." 
          style="width: 100%; height: 58px; padding: 0 7.5rem 0 3.4rem; font-size: 1.05rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-full); color: #fff; outline: none; box-shadow: 0 8px 30px rgba(0,0,0,0.4); transition: border-color var(--transition-fast);"
        />
        <button id="btn-hero-search" class="btn btn-primary" style="position: absolute; right: 6px; top: 6px; bottom: 6px; border-radius: var(--radius-full); padding: 0 1.4rem; font-size: 0.9rem;">
          Search
        </button>
      </div>

      <!-- Regional Filter Chips -->
      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; max-width: 960px;" id="region-pills">
        ${REGIONS.map(reg => `
          <button class="btn btn-sm ${reg.id === '' ? 'btn-primary' : 'btn-secondary'}" data-region="${reg.id}" style="border-radius: var(--radius-full); padding: 0.4rem 1rem; font-size: 0.85rem;">
            ${reg.label}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Section Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--color-border);" id="results-header">
      <h2 style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 700; color: var(--color-text);" id="results-count">
        Featured Destinations
      </h2>
    </div>

    <!-- Destinations Grid / Bento Canvas -->
    <div id="cities-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 1.75rem;">
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
        <div class="spinner" style="width: 36px; height: 36px; border: 3px solid rgba(79, 70, 229, 0.2); border-top-color: var(--color-primary); border-radius: 50%; margin: 0 auto;"></div>
        <p style="color: var(--color-text-muted); margin-top: 1rem;">Loading curated destinations...</p>
      </div>
    </div>
  `;

  const searchInput = container.querySelector('#city-search-input');
  const heroSearchBtn = container.querySelector('#btn-hero-search');
  const regionPills = container.querySelectorAll('#region-pills button');
  const grid = container.querySelector('#cities-grid');
  const resultsCount = container.querySelector('#results-count');

  // Event handlers
  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      loadCities();
    }, 300);
  });

  heroSearchBtn.addEventListener('click', () => {
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
        <div class="spinner" style="width: 36px; height: 36px; border: 3px solid rgba(79, 70, 229, 0.2); border-top-color: var(--color-primary); border-radius: 50%; margin: 0 auto;"></div>
        <p style="color: var(--color-text-muted); margin-top: 1rem;">Fetching destinations...</p>
      </div>
    `;

    try {
      const API_BASE = window.__API_BASE_URL__ || (window.location.port === '5173' ? 'http://localhost:5000/api' : '/api');
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (selectedRegion) params.set('region', selectedRegion);

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${API_BASE}/cities${queryStr}`);
      const cities = await res.json();

      if (!res.ok) {
        throw new Error(cities.error?.message || 'Failed to fetch destinations');
      }

      resultsCount.textContent = `${cities.length} ${cities.length === 1 ? 'Destination' : 'Destinations'} Available`;

      if (!cities || cities.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1;" class="empty-state">
            <div class="empty-state-icon">🏖️</div>
            <h3>No destinations found</h3>
            <p class="empty-state-desc">
              We couldn't find any destinations matching "${escapeHtml(searchTerm)}". Try searching for another city name or clearing regional filters.
            </p>
            <button class="btn btn-secondary" id="btn-reset-filters">Reset Filters</button>
          </div>
        `;
        grid.querySelector('#btn-reset-filters')?.addEventListener('click', () => {
          searchInput.value = '';
          searchTerm = '';
          selectedRegion = '';
          regionPills.forEach(p => {
            if (p.getAttribute('data-region') === '') {
              p.classList.add('btn-primary');
              p.classList.remove('btn-secondary');
            } else {
              p.classList.remove('btn-primary');
              p.classList.add('btn-secondary');
            }
          });
          loadCities();
        });
        return;
      }

      grid.innerHTML = '';

      // If we have at least 3 cities and no specific search term, render first city as a Featured Spotlight Bento Card
      const shouldRenderSpotlight = !searchTerm && cities.length >= 3;
      const startIndex = shouldRenderSpotlight ? 1 : 0;

      if (shouldRenderSpotlight) {
        const featured = cities[0];
        const costSymbols = featured.costIndex ? '₹'.repeat(Math.min(featured.costIndex, 4)) : '₹₹';
        const spotlightCard = document.createElement('article');
        spotlightCard.className = 'card animate-fade-in';
        spotlightCard.style.gridColumn = '1 / -1';
        spotlightCard.style.padding = '0';
        spotlightCard.style.overflow = 'hidden';
        spotlightCard.style.display = 'flex';
        spotlightCard.style.flexDirection = window.innerWidth > 768 ? 'row' : 'column';
        spotlightCard.style.border = '1px solid rgba(79, 70, 229, 0.4)';
        spotlightCard.style.boxShadow = '0 12px 35px rgba(79, 70, 229, 0.15)';
        spotlightCard.style.cursor = 'pointer';

        spotlightCard.innerHTML = `
          <div style="position: relative; flex: 1.3; min-height: 280px; overflow: hidden;">
            <img src="${escapeHtml(featured.imageUrl || '')}" alt="${escapeHtml(featured.name)}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease;" class="spotlight-img" />
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to right, rgba(19,27,46,0.1), rgba(19,27,46,0.85));"></div>
            
            <div style="position: absolute; top: 1rem; left: 1rem; display: flex; gap: 0.5rem;">
              <span class="badge" style="background: var(--color-accent-gradient); color: #fff; font-weight: 700; padding: 0.35rem 0.8rem; box-shadow: 0 4px 12px rgba(236,72,153,0.4);">
                ⭐ SPOTLIGHT DESTINATION
              </span>
            </div>

            <div style="position: absolute; bottom: 1rem; left: 1rem;">
              <span class="badge" style="background: rgba(15,23,42,0.9); backdrop-filter: blur(8px); color: #34d399; font-size: 0.85rem; border: 1px solid rgba(255,255,255,0.1);">
                Cost Index: ${costSymbols}
              </span>
            </div>
          </div>

          <div style="flex: 1; padding: 2rem; display: flex; flex-direction: column; justify-content: space-between; background: var(--color-surface);">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <div>
                  <span style="font-size: 0.85rem; color: var(--color-primary-light); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                    📍 ${escapeHtml(featured.country)}
                  </span>
                  <h2 style="font-family: var(--font-heading); font-size: 2.2rem; font-weight: 800; color: #fff; margin-top: 0.2rem;">
                    ${escapeHtml(featured.name)}
                  </h2>
                </div>
                <span class="badge" style="background: rgba(245,158,11,0.15); color: #fbbf24; font-size: 0.9rem; padding: 0.35rem 0.75rem; border: 1px solid rgba(245,158,11,0.3);">
                  🔥 ${featured.popularity || 95}% Popular
                </span>
              </div>

              <p style="color: var(--color-text-muted); font-size: 0.95rem; line-height: 1.6; margin: 1rem 0;">
                Experience the magic of ${escapeHtml(featured.name)}. Discover handpicked local sights, guided activities, cultural landmarks, and authentic culinary journeys.
              </p>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1rem 0; border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); margin-bottom: 1.5rem;">
                <div>
                  <span style="font-size: 0.75rem; color: var(--color-text-subtle); text-transform: uppercase; font-weight: 600;">Cost Level</span>
                  <p style="font-weight: 700; color: #34d399; font-size: 1.05rem; margin-top: 0.2rem;">${costSymbols} (${featured.costIndex <= 2 ? 'Budget Friendly' : (featured.costIndex === 3 ? 'Moderate' : 'Luxury')})</p>
                </div>
                <div>
                  <span style="font-size: 0.75rem; color: var(--color-text-subtle); text-transform: uppercase; font-weight: 600;">Recommended Season</span>
                  <p style="font-weight: 700; color: #fff; font-size: 1.05rem; margin-top: 0.2rem;">All Year Round</p>
                </div>
              </div>
            </div>

            <button class="btn btn-primary btn-lg" style="width: 100%; justify-content: center; gap: 0.6rem;" id="btn-spotlight-view">
              <span>Explore ${escapeHtml(featured.name)} Activities</span>
              <span>→</span>
            </button>
          </div>
        `;

        spotlightCard.querySelector('#btn-spotlight-view')?.addEventListener('click', (e) => {
          e.stopPropagation();
          openActivitiesModal(featured);
        });
        spotlightCard.addEventListener('click', () => openActivitiesModal(featured));

        const spotlightImg = spotlightCard.querySelector('.spotlight-img');
        spotlightCard.addEventListener('mouseenter', () => { if (spotlightImg) spotlightImg.style.transform = 'scale(1.04)'; });
        spotlightCard.addEventListener('mouseleave', () => { if (spotlightImg) spotlightImg.style.transform = 'scale(1)'; });

        grid.appendChild(spotlightCard);
      }

      // Render standard cards
      for (let i = startIndex; i < cities.length; i++) {
        const city = cities[i];
        const costSymbols = city.costIndex ? '₹'.repeat(Math.min(city.costIndex, 4)) : '₹₹';
        const card = document.createElement('article');
        card.className = 'card animate-fade-in';
        card.style.padding = '0';
        card.style.overflow = 'hidden';
        card.style.cursor = 'pointer';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.transition = 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease';

        card.innerHTML = `
          <div style="position: relative; height: 200px; overflow: hidden;">
            <img src="${escapeHtml(city.imageUrl || '')}" alt="${escapeHtml(city.name)}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease;" class="card-img" loading="lazy" />
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to top, rgba(19,27,46,0.95) 0%, rgba(19,27,46,0.2) 60%, rgba(0,0,0,0.4) 100%);"></div>
            
            <div style="position: absolute; top: 0.75rem; left: 0.75rem; right: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
              <span class="badge" style="background: rgba(15,23,42,0.85); backdrop-filter: blur(6px); color: #34d399; font-weight: 700; font-size: 0.8rem; border: 1px solid rgba(255,255,255,0.1);">
                ${costSymbols}
              </span>
              <span class="badge" style="background: rgba(15,23,42,0.85); backdrop-filter: blur(6px); color: #fbbf24; font-weight: 600; font-size: 0.8rem; border: 1px solid rgba(255,255,255,0.1);">
                🔥 ${city.popularity || 85}%
              </span>
            </div>

            <div style="position: absolute; bottom: 0.75rem; left: 1rem; right: 1rem;">
              <span style="font-size: 0.75rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;">📍 ${escapeHtml(city.country)}</span>
              <h3 style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 800; color: #fff; margin-top: 0.1rem;">
                ${escapeHtml(city.name)}
              </h3>
            </div>
          </div>

          <div style="padding: 1rem 1.25rem; background: var(--color-surface); display: flex; justify-content: space-between; align-items: center; flex: 1;">
            <span style="font-size: 0.85rem; color: var(--color-text-muted);">View Local Activities</span>
            <button class="btn btn-secondary btn-sm" style="font-size: 0.82rem; border-color: rgba(79, 70, 229, 0.3); color: var(--color-primary-light);">
              Explore →
            </button>
          </div>
        `;

        const cardImg = card.querySelector('.card-img');
        card.addEventListener('mouseenter', () => {
          card.style.transform = 'translateY(-4px)';
          card.style.borderColor = 'rgba(79, 70, 229, 0.5)';
          card.style.boxShadow = '0 10px 25px rgba(0,0,0,0.4)';
          if (cardImg) cardImg.style.transform = 'scale(1.05)';
        });
        card.addEventListener('mouseleave', () => {
          card.style.transform = 'translateY(0)';
          card.style.borderColor = 'var(--color-border)';
          card.style.boxShadow = 'var(--shadow-sm)';
          if (cardImg) cardImg.style.transform = 'scale(1)';
        });

        card.addEventListener('click', () => openActivitiesModal(city));
        grid.appendChild(card);
      }
    } catch (err) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1;" class="card">
          <p style="color: #f87171; text-align: center;">⚠️ ${escapeHtml(err.message)}</p>
        </div>
      `;
    }
  }

  function openActivitiesModal(city) {
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
