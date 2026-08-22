/**
 * City & Activity Discovery Search Component (Editorial Travel System)
 * Features Light-First Hero Search, Bento Spotlight Card, Real Daily Rupee (₹) Estimates, and Clean Filtering.
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

const COST_MAP = {
  1: { amount: '₹1,500', label: 'Budget-Friendly' },
  2: { amount: '₹3,500', label: 'Moderate' },
  3: { amount: '₹6,500', label: 'Premium' },
  4: { amount: '₹12,000', label: 'Upscale' },
  5: { amount: '₹25,000+', label: 'Luxury' }
};

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
    <!-- Hero Search Section -->
    <div style="text-align: center; margin-bottom: 3rem; display: flex; flex-direction: column; align-items: center; padding-top: 1.5rem;">
      <div class="badge" style="background: var(--color-primary-subtle); color: var(--color-primary); border: 1px solid rgba(0, 109, 100, 0.2); border-radius: var(--radius-full); padding: 0.35rem 1rem; font-size: 0.85rem; font-weight: 700; margin-bottom: 1rem; letter-spacing: 0.04em;">
        ✈️ DISCOVER & EXPLORE
      </div>
      
      <h1 style="font-family: var(--font-heading); font-size: 3.2rem; font-weight: 900; color: #0f172a; letter-spacing: -0.03em; margin-bottom: 0.75rem; line-height: 1.15;">
        Where do you want to go?
      </h1>
      <p style="color: #64748b; font-size: 1.15rem; max-width: 620px; line-height: 1.6; margin-bottom: 2rem;">
        Search curated destinations, compare real daily costs in Rupees (₹), and explore handpicked activities for your next journey.
      </p>

      <!-- 60px Clean Light Hero Search Input -->
      <div style="position: relative; width: 100%; max-width: 720px; margin-bottom: 1.75rem;">
        <div style="position: absolute; left: 1.25rem; top: 50%; transform: translateY(-50%); font-size: 1.25rem; opacity: 0.6;">
          🔍
        </div>
        <input 
          type="text" 
          id="city-search-input" 
          placeholder="Search destinations (e.g. Goa, Paris, Tokyo, Mumbai, Rome)..." 
          style="width: 100%; height: 60px; padding: 0 7.5rem 0 3.5rem; font-size: 1.05rem; background: #ffffff; border: 1px solid var(--color-border); border-radius: var(--radius-full); color: #0f172a; outline: none; box-shadow: 0 8px 30px rgba(15,23,42,0.06); transition: all var(--transition-fast);"
        />
        <button id="btn-hero-search" class="btn btn-primary" style="position: absolute; right: 6px; top: 6px; bottom: 6px; border-radius: var(--radius-full); padding: 0 1.5rem; font-size: 0.95rem; font-weight: 700; background: #006d64;">
          Search
        </button>
      </div>

      <!-- Regional Filter Chips -->
      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; max-width: 960px;" id="region-pills">
        ${REGIONS.map(reg => `
          <button class="btn btn-sm ${reg.id === '' ? 'btn-primary' : 'btn-secondary'}" data-region="${reg.id}" style="border-radius: var(--radius-full); padding: 0.45rem 1rem; font-size: 0.85rem; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.04); ${reg.id === '' ? 'background: #006d64; border-color: #006d64;' : ''}">
            ${reg.label}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Section Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--color-border);" id="results-header">
      <h2 style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 800; color: #0f172a;" id="results-count">
        Featured Destinations
      </h2>
    </div>

    <!-- Destinations Grid / Bento Canvas -->
    <div id="cities-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 1.75rem;">
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
        <div class="spinner" style="width: 36px; height: 36px; border: 3px solid rgba(0, 109, 100, 0.2); border-top-color: #006d64; border-radius: 50%; margin: 0 auto;"></div>
        <p style="color: #64748b; margin-top: 1rem;">Loading curated destinations...</p>
      </div>
    </div>
  `;

  const searchInput = container.querySelector('#city-search-input');
  const heroSearchBtn = container.querySelector('#btn-hero-search');
  const regionPills = container.querySelectorAll('#region-pills button');
  const grid = container.querySelector('#cities-grid');
  const resultsCount = container.querySelector('#results-count');

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
        p.style.background = '#ffffff';
        p.style.borderColor = '#e2e8f0';
        p.style.color = '#0f172a';
      });
      pill.style.background = '#006d64';
      pill.style.borderColor = '#006d64';
      pill.style.color = '#ffffff';
      selectedRegion = pill.getAttribute('data-region') || '';
      loadCities();
    });
  });

  async function loadCities() {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
        <div class="spinner" style="width: 36px; height: 36px; border: 3px solid rgba(0, 109, 100, 0.2); border-top-color: #006d64; border-radius: 50%; margin: 0 auto;"></div>
        <p style="color: #64748b; margin-top: 1rem;">Fetching destinations...</p>
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
            p.style.background = '#ffffff';
            p.style.borderColor = '#e2e8f0';
            p.style.color = '#0f172a';
          });
          regionPills[0].style.background = '#006d64';
          regionPills[0].style.borderColor = '#006d64';
          regionPills[0].style.color = '#ffffff';
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
        const costInfo = COST_MAP[featured.costIndex] || { amount: '₹25,000+', label: 'Luxury' };
        
        const spotlightCard = document.createElement('article');
        spotlightCard.className = 'card animate-fade-in';
        spotlightCard.style.gridColumn = '1 / -1';
        spotlightCard.style.padding = '0';
        spotlightCard.style.overflow = 'hidden';
        spotlightCard.style.display = 'flex';
        spotlightCard.style.flexDirection = window.innerWidth > 768 ? 'row' : 'column';
        spotlightCard.style.border = '1px solid var(--color-border)';
        spotlightCard.style.boxShadow = '0 12px 35px rgba(15, 23, 42, 0.08)';
        spotlightCard.style.cursor = 'pointer';
        spotlightCard.style.background = '#ffffff';
        spotlightCard.style.borderRadius = '24px';

        spotlightCard.innerHTML = `
          <div style="position: relative; flex: 1.3; min-height: 280px; overflow: hidden;">
            <img src="${escapeHtml(featured.imageUrl || '')}" alt="${escapeHtml(featured.name)}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease;" class="spotlight-img" />
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to right, rgba(15,23,42,0.1), rgba(15,23,42,0.6));"></div>
            
            <div style="position: absolute; top: 1rem; left: 1rem; display: flex; gap: 0.5rem;">
              <span class="badge" style="background: #006d64; color: #fff; font-weight: 700; padding: 0.35rem 0.8rem; box-shadow: 0 4px 12px rgba(0,109,100,0.3);">
                ⭐ SPOTLIGHT DESTINATION
              </span>
            </div>

            <div style="position: absolute; bottom: 1rem; left: 1rem;">
              <span class="badge" style="background: rgba(255,255,255,0.94); backdrop-filter: blur(8px); color: #006d64; font-weight: 800; font-size: 0.85rem; border: 1px solid rgba(0,0,0,0.06);">
                Est. Cost: ${costInfo.amount} / day
              </span>
            </div>
          </div>

          <div style="flex: 1; padding: 2.25rem; display: flex; flex-direction: column; justify-content: space-between; background: #ffffff;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <div>
                  <span style="font-size: 0.85rem; color: #006d64; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
                    📍 ${escapeHtml(featured.country)}
                  </span>
                  <h2 style="font-family: var(--font-heading); font-size: 2.4rem; font-weight: 900; color: #0f172a; margin-top: 0.2rem;">
                    ${escapeHtml(featured.name)}
                  </h2>
                </div>
                <span class="badge" style="background: #fef3c7; color: #d97706; font-size: 0.9rem; padding: 0.35rem 0.75rem; border: 1px solid #fde68a; font-weight: 700;">
                  🔥 ${featured.popularity || 95}% Popular
                </span>
              </div>

              <p style="color: #64748b; font-size: 1rem; line-height: 1.6; margin: 1rem 0;">
                Experience the magic of ${escapeHtml(featured.name)}. Discover handpicked local sights, guided activities, cultural landmarks, and authentic culinary journeys.
              </p>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1rem 0; border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); margin-bottom: 1.5rem;">
                <div>
                  <span style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Daily Cost Level</span>
                  <p style="font-weight: 800; color: #006d64; font-size: 1.05rem; margin-top: 0.2rem;">
                    ${costInfo.amount}/day (${costInfo.label})
                  </p>
                </div>
                <div>
                  <span style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Recommended Season</span>
                  <p style="font-weight: 800; color: #0f172a; font-size: 1.05rem; margin-top: 0.2rem;">All Year Round</p>
                </div>
              </div>
            </div>

            <button class="btn btn-primary btn-lg" style="width: 100%; justify-content: center; gap: 0.6rem; background: #006d64; border-radius: 9999px;" id="btn-spotlight-view">
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
        const costInfo = COST_MAP[city.costIndex] || { amount: '₹3,500', label: 'Moderate' };
        
        const card = document.createElement('article');
        card.className = 'card animate-fade-in';
        card.style.padding = '0';
        card.style.overflow = 'hidden';
        card.style.cursor = 'pointer';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.background = '#ffffff';
        card.style.borderRadius = '20px';
        card.style.transition = 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease';

        card.innerHTML = `
          <div style="position: relative; height: 210px; overflow: hidden;">
            <img src="${escapeHtml(city.imageUrl || '')}" alt="${escapeHtml(city.name)}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease;" class="card-img" loading="lazy" />
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.1) 60%, rgba(0,0,0,0.2) 100%);"></div>
            
            <div style="position: absolute; top: 0.75rem; left: 0.75rem; right: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
              <span class="badge" style="background: rgba(255,255,255,0.94); backdrop-filter: blur(6px); color: #006d64; font-weight: 800; font-size: 0.78rem; border: 1px solid rgba(0,0,0,0.06);">
                From ${costInfo.amount}/day
              </span>
              <span class="badge" style="background: rgba(255,255,255,0.94); backdrop-filter: blur(6px); color: #d97706; font-weight: 800; font-size: 0.78rem; border: 1px solid rgba(0,0,0,0.06);">
                🔥 ${city.popularity || 85}%
              </span>
            </div>

            <div style="position: absolute; bottom: 1rem; left: 1rem; right: 1rem;">
              <span style="font-size: 0.75rem; color: #cbd5e1; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">📍 ${escapeHtml(city.country)}</span>
              <h3 style="font-family: var(--font-heading); font-size: 1.45rem; font-weight: 800; color: #fff; margin-top: 0.1rem; line-height: 1.2;">
                ${escapeHtml(city.name)}
              </h3>
            </div>
          </div>

          <div style="padding: 1.25rem 1.5rem; display: flex; flex-direction: column; justify-content: space-between; flex: 1; background: #ffffff;">
            <p style="color: #64748b; font-size: 0.88rem; line-height: 1.5; margin-bottom: 1.25rem;">
              Explore iconic sights, authentic dining, and guided activities in ${escapeHtml(city.name)}.
            </p>

            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0.75rem; border-top: 1px solid var(--color-border);">
              <div>
                <span style="font-size: 0.72rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Est. Daily Spend</span>
                <p style="font-size: 0.95rem; font-weight: 800; color: #006d64;">${costInfo.amount} / day</p>
              </div>
              <button class="btn btn-secondary btn-sm btn-explore-city" data-id="${escapeHtml(city.id)}" style="background: #e6f4f2; border-color: #006d64; color: #006d64; font-weight: 700; border-radius: 9999px;">
                View Activities ➔
              </button>
            </div>
          </div>
        `;

        card.querySelector('.btn-explore-city')?.addEventListener('click', (e) => {
          e.stopPropagation();
          openActivitiesModal(city);
        });

        card.addEventListener('click', () => openActivitiesModal(city));

        const cardImg = card.querySelector('.card-img');
        card.addEventListener('mouseenter', () => {
          card.style.transform = 'translateY(-4px)';
          card.style.boxShadow = '0 12px 30px rgba(15,23,42,0.1)';
          if (cardImg) cardImg.style.transform = 'scale(1.06)';
        });
        card.addEventListener('mouseleave', () => {
          card.style.transform = 'translateY(0)';
          card.style.boxShadow = 'var(--shadow-sm)';
          if (cardImg) cardImg.style.transform = 'scale(1)';
        });

        grid.appendChild(card);
      }

    } catch (err) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: #ef4444;">
          <h3>Failed to load destinations</h3>
          <p style="margin-top: 0.5rem; color: #64748b;">${escapeHtml(err.message)}</p>
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
