/**
 * Add Destination Modal Component
 * Renders rich curated destination cards with guaranteed synchronous fallback, ₹ daily prices, category filters, and instant '+ Add to Trip' action.
 */
import { api } from '../api.js';

const CATEGORIES = [
  { id: '', label: 'All' },
  { id: 'Beaches', label: 'Beaches' },
  { id: 'Culture', label: 'Culture' },
  { id: 'Nature', label: 'Nature' }
];

const CURATED_DESTINATIONS = [
  {
    id: 'city-goa',
    name: 'Goa',
    country: 'India',
    popularity: 94,
    category: 'Beaches',
    costPerDay: '₹3,500',
    description: 'Sun-kissed beaches, water sports, vibrant beach shacks, and Portuguese colonial villas.',
    imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'city-jaipur',
    name: 'Jaipur',
    country: 'India',
    popularity: 91,
    category: 'Culture',
    costPerDay: '₹2,800',
    description: 'Grand palaces, historic Amber Fort, colourful bazaars, and pink sandstone architecture.',
    imageUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'city-manali',
    name: 'Manali',
    country: 'India',
    popularity: 88,
    category: 'Nature',
    costPerDay: '₹3,200',
    description: 'Snow-capped Himalayan peaks, pine forests, adventure trails, and Solang Valley.',
    imageUrl: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'city-paris',
    name: 'Paris',
    country: 'France',
    popularity: 98,
    category: 'Culture',
    costPerDay: '₹14,500',
    description: 'World-famous art museums, Eiffel Tower, romantic sidewalk cafes, and Seine cruises.',
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'city-tokyo',
    name: 'Tokyo',
    country: 'Japan',
    popularity: 98,
    category: 'Culture',
    costPerDay: '₹12,000',
    description: 'Neon-lit futuristic skyscrapers, serene Shinto shrines, world-class sushi, and Shibuya.',
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'city-leh',
    name: 'Leh',
    country: 'India',
    popularity: 91,
    category: 'Nature',
    costPerDay: '₹4,500',
    description: 'Pangong Tso Lake, high mountain passes, Tibetan monasteries, and starlit night skies.',
    imageUrl: 'https://images.unsplash.com/photo-1581791538302-03537b9c97bf?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'city-pondicherry',
    name: 'Pondicherry',
    country: 'India',
    popularity: 85,
    category: 'Beaches',
    costPerDay: '₹2,400',
    description: 'French quarter promenades, peaceful beaches, heritage cafes, and Auroville.',
    imageUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'city-bali',
    name: 'Bali',
    country: 'Indonesia',
    popularity: 96,
    category: 'Beaches',
    costPerDay: '₹5,500',
    description: 'Tropical beaches, surf breaks, lush rice terraces, and cliffside temples.',
    imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'city-rishikesh',
    name: 'Rishikesh',
    country: 'India',
    popularity: 89,
    category: 'Nature',
    costPerDay: '₹2,000',
    description: 'Ganga river rafting, yoga retreats, tranquil mountain breezes, and evening Aarti.',
    imageUrl: 'https://images.unsplash.com/photo-1542856391-010fb87dcfed?auto=format&fit=crop&w=800&q=80'
  }
];

export function renderAddCityModal({ tripId, currentStopsCount = 0, onCityAdded, onClose }) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop animate-fade-in';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.right = '0';
  modal.style.bottom = '0';
  modal.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
  modal.style.backdropFilter = 'blur(12px)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '1300';
  modal.style.padding = '1.25rem';

  let currentCities = [...CURATED_DESTINATIONS];
  let selectedCategory = '';
  let searchTerm = '';
  let debounceTimer = null;

  function generateCardsHtml(citiesToRender) {
    if (!citiesToRender || citiesToRender.length === 0) {
      return `
        <div style="text-align: center; padding: 3rem 1.5rem; background: #ffffff; border-radius: 20px; border: 1.5px dashed #cbd5e1; margin: 1rem 0;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🏖️</div>
          <h3 style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 0.25rem;">
            No destinations found
          </h3>
          <p style="color: #64748b; font-size: 0.9rem;">
            Try clearing filters or searching for another city name.
          </p>
        </div>
      `;
    }

    return citiesToRender.map(city => {
      const popValue = city.popularity || 94;
      const defaultImg = 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80';
      const costStr = city.costPerDay || '₹3,500';

      return `
        <div class="card dest-card" style="padding: 0; overflow: hidden; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 4px 12px rgba(15,23,42,0.06); background: #ffffff; margin-bottom: 1rem;">
          
          <!-- Image with Popularity & Cost Badges -->
          <div style="position: relative; height: 130px; overflow: hidden; background: #0f172a;">
            <img 
              src="${escapeHtml(city.imageUrl || defaultImg)}" 
              alt="${escapeHtml(city.name)}" 
              style="width: 100%; height: 100%; object-fit: cover;" 
              onerror="this.onerror=null; this.src='${defaultImg}';"
            />
            
            <div style="position: absolute; top: 0.55rem; left: 0.65rem; display: flex; gap: 0.35rem; z-index: 2;">
              <span class="badge" style="background: rgba(255,255,255,0.95); backdrop-filter: blur(6px); color: #006d64; font-weight: 800; font-size: 0.75rem; padding: 0.28rem 0.65rem; border: 1px solid rgba(0,0,0,0.06); border-radius: 9999px; display: flex; align-items: center; gap: 0.3rem;">
                <span>📈</span>
                <span>Popularity ${popValue}</span>
              </span>
              <span class="badge" style="background: rgba(255,255,255,0.95); backdrop-filter: blur(6px); color: #059669; font-weight: 800; font-size: 0.75rem; padding: 0.28rem 0.65rem; border: 1px solid rgba(0,0,0,0.06); border-radius: 9999px;">
                Avg. ${costStr}/day
              </span>
            </div>
          </div>

          <!-- Content Area -->
          <div style="padding: 0.85rem 1.25rem 1rem 1.25rem; background: #ffffff;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
              <h3 style="font-family: var(--font-heading); font-size: 1.2rem; font-weight: 900; color: #0f172a; line-height: 1.2;">
                ${escapeHtml(city.name)}, ${escapeHtml(city.country)}
              </h3>
              <span class="badge" style="background: #e6f4f2; color: #006d64; font-weight: 800; font-size: 0.72rem; padding: 0.25rem 0.55rem; border-radius: 9999px; white-space: nowrap; margin-left: 0.5rem;">
                ${escapeHtml(city.category || 'Culture')}
              </span>
            </div>
            
            <p style="color: #475569; font-size: 0.83rem; line-height: 1.4; margin: 0 0 0.85rem 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${escapeHtml(city.description)}
            </p>

            <!-- Add to Trip CTA Button -->
            <button 
              class="btn btn-add-dest" 
              data-id="${escapeHtml(city.id)}" 
              data-name="${escapeHtml(city.name)}" 
              style="width: 100%; height: 42px; background: #006d64; color: #ffffff; border: none; border-radius: 9999px; font-size: 0.92rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; box-shadow: 0 4px 12px rgba(0,109,100,0.25); transition: opacity 0.15s;"
              onmouseover="this.style.opacity='0.88'" onmouseout="this.style.opacity='1'"
            >
              <span style="font-size: 1.15rem; font-weight: 800; line-height: 1;">+</span>
              <span>Add to Trip</span>
            </button>
          </div>

        </div>
      `;
    }).join('');
  }

  modal.innerHTML = `
    <div class="card animate-fade-in" style="width: 100%; max-width: 600px; height: 88vh; max-height: 88vh; display: flex; flex-direction: column; background: #ffffff; border-radius: 28px; border: 1px solid var(--color-border); box-shadow: 0 25px 70px rgba(15,23,42,0.35); padding: 0; position: relative; overflow: hidden;">
      
      <!-- Top Header -->
      <div style="padding: 1.5rem 1.75rem 1rem 1.75rem; display: flex; justify-content: space-between; align-items: center; background: #ffffff; border-bottom: 1px solid #f1f5f9;">
        <div>
          <div style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.25rem 0.65rem; background: #e6f4f2; color: #006d64; border-radius: 9999px; font-size: 0.75rem; font-weight: 800; margin-bottom: 0.35rem;">
            🗺️ DESTINATION CATALOG
          </div>
          <h2 style="font-family: var(--font-heading); font-size: 1.65rem; font-weight: 900; color: #0f172a; line-height: 1.2;">
            Add Destination
          </h2>
          <p style="color: #64748b; font-size: 0.88rem; margin-top: 0.15rem;">
            Select a destination to attach to your itinerary.
          </p>
        </div>
        <button style="width: 38px; height: 38px; border-radius: 50%; background: #f1f5f9; border: none; color: #0f172a; font-size: 1.15rem; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 700;" id="btn-close-dest-modal">✕</button>
      </div>

      <!-- Search Destinations Input -->
      <div style="padding: 1rem 1.75rem 0.5rem 1.75rem; background: #ffffff;">
        <div style="position: relative;">
          <span style="position: absolute; left: 1.1rem; top: 50%; transform: translateY(-50%); font-size: 1.15rem; color: #64748b;">
            🔍
          </span>
          <input 
            type="text" 
            id="dest-search-input" 
            placeholder="Search destinations (e.g. Goa, Paris, Manali)..." 
            style="width: 100%; height: 48px; padding-left: 2.85rem; padding-right: 1rem; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 14px; font-size: 0.95rem; color: #0f172a; outline: none; transition: border-color 0.2s ease;"
          />
        </div>
      </div>

      <!-- Category Filter Pills (All, Beaches, Culture, Nature) -->
      <div style="padding: 0.5rem 1.75rem 1rem 1.75rem; display: flex; gap: 0.5rem; overflow-x: auto; background: #ffffff; border-bottom: 1px solid #e2e8f0;" id="category-pills">
        ${CATEGORIES.map(c => `
          <button 
            class="btn-cat-pill" 
            data-cat="${c.id}" 
            style="padding: 0.45rem 1.25rem; font-size: 0.88rem; font-weight: 700; border-radius: 9999px; border: 1px solid ${c.id === '' ? '#006d64' : '#cbd5e1'}; background: ${c.id === '' ? '#006d64' : '#f8fafc'}; color: ${c.id === '' ? '#ffffff' : '#0f172a'}; cursor: pointer; white-space: nowrap; transition: all 0.2s ease;"
          >
            ${c.label}
          </button>
        `).join('')}
      </div>

      <!-- Destinations Scroll List (Pre-rendered Immediately) -->
      <div style="padding: 1.5rem 1.75rem 2rem 1.75rem; overflow-y: auto; flex: 1; display: flex; flex-direction: column; background: #f8fafc;" id="dest-list">
        ${generateCardsHtml(currentCities)}
      </div>

    </div>
  `;

  const closeBtn = modal.querySelector('#btn-close-dest-modal');
  const searchInput = modal.querySelector('#dest-search-input');
  const destList = modal.querySelector('#dest-list');
  const catPills = modal.querySelectorAll('.btn-cat-pill');

  closeBtn?.addEventListener('click', onClose);
  modal.addEventListener('click', (e) => { if (e.target === modal) onClose(); });

  function bindAddButtons() {
    destList.querySelectorAll('.btn-add-dest').forEach(btn => {
      btn.addEventListener('click', async () => {
        const cityId = btn.getAttribute('data-id');
        const cityName = btn.getAttribute('data-name');
        btn.innerHTML = '<span>Adding to Itinerary...</span>';
        btn.disabled = true;

        try {
          const newStop = await api.addStop(tripId, {
            cityId,
            cityName,
            stopOrder: currentStopsCount + 1
          });

          if (onCityAdded) {
            await onCityAdded(newStop);
          }
          modal.remove();
        } catch (err) {
          alert('Failed to add destination: ' + (err.message || 'Unknown error'));
          btn.innerHTML = '<span style="font-size:1.15rem;font-weight:800;">+</span><span>Add to Trip</span>';
          btn.disabled = false;
        }

      });
    });
  }

  function filterAndRender() {
    let filtered = [...currentCities];

    if (selectedCategory) {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.country.toLowerCase().includes(query) ||
        (c.description && c.description.toLowerCase().includes(query))
      );
    }

    destList.innerHTML = generateCardsHtml(filtered);
    bindAddButtons();
  }

  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      catPills.forEach(p => {
        p.style.background = '#f8fafc';
        p.style.borderColor = '#cbd5e1';
        p.style.color = '#0f172a';
      });
      pill.style.background = '#006d64';
      pill.style.borderColor = '#006d64';
      pill.style.color = '#ffffff';
      selectedCategory = pill.getAttribute('data-cat') || '';
      filterAndRender();
    });
  });

  searchInput?.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      filterAndRender();
    }, 150);
  });

  async function loadInitialCities() {
    bindAddButtons();
    try {
      const serverCities = await api.getCities();
      if (Array.isArray(serverCities) && serverCities.length > 0) {
        const mapped = serverCities.map(sc => {
          const match = CURATED_DESTINATIONS.find(cd => cd.name.toLowerCase() === sc.name.toLowerCase());
          const costIndex = sc.costIndex || 2;
          const costMap = { 1: '₹1,500', 2: '₹3,500', 3: '₹6,500', 4: '₹12,000', 5: '₹25,000+' };
          return {
            id: sc.id,
            name: sc.name,
            country: sc.country,
            popularity: sc.popularity || (match?.popularity || 90),
            category: match?.category || (sc.country === 'India' ? (sc.name.includes('Goa') || sc.name.includes('Pondicherry') ? 'Beaches' : (sc.name.includes('Manali') || sc.name.includes('Leh') || sc.name.includes('Rishikesh') ? 'Nature' : 'Culture')) : 'Culture'),
            costPerDay: match?.costPerDay || costMap[costIndex] || '₹3,500',
            description: match?.description || `Explore landmarks, sights, and local food in ${sc.name}.`,
            imageUrl: sc.imageUrl || match?.imageUrl || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80'
          };
        });

        const mergedMap = new Map();
        CURATED_DESTINATIONS.forEach(cd => mergedMap.set(cd.name.toLowerCase(), cd));
        mapped.forEach(mc => mergedMap.set(mc.name.toLowerCase(), mc));
        currentCities = Array.from(mergedMap.values());
        filterAndRender();
      }
    } catch (e) {
      // Keep curated destinations
    }
  }

  loadInitialCities();
  return modal;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
