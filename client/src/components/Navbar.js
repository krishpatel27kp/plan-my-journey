/**
 * Navigation Bar Component (Pixel-Matched Top Bar)
 * Left Avatar • Centered/Brand 'Plan My Journey' • Right Search Icon
 */

export function renderNavbar({ user, activeTab, onTabChange, onLogout, onOpenAuth }) {
  const nav = document.createElement('header');
  nav.className = 'navbar';

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'A';
  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
  const avatarSrc = user?.profileImage || defaultAvatar;

  nav.innerHTML = `
    <!-- Left: User Avatar -->
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <div class="avatar" id="nav-avatar-btn" style="cursor: pointer; width: 40px; height: 40px; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
        ${user ? `<img src="${escapeHtml(avatarSrc)}" alt="${escapeHtml(user.name)}" onerror="this.onerror=null; this.parentElement.innerHTML='<span>${userInitial}</span>';" />` : `<span style="font-size: 1.1rem;">👤</span>`}
      </div>
    </div>

    <!-- Center: Brand Title -->
    <div class="brand" id="nav-brand" style="margin: 0 auto; display: flex; align-items: center; gap: 0.5rem; color: #006d64; font-family: var(--font-heading); font-size: 1.45rem; font-weight: 900; letter-spacing: -0.02em;">
      <span>Plan My Journey</span>
    </div>

    <!-- Right: Search Icon / Actions -->
    <div style="display: flex; align-items: center; gap: 0.5rem;">
      <button id="nav-search-btn" style="background: none; border: none; font-size: 1.25rem; color: #0f172a; cursor: pointer; padding: 0.4rem; display: flex; align-items: center; justify-content: center; border-radius: 50%;" title="Search Destinations">
        🔍
      </button>

      ${user ? `
        <button class="btn btn-secondary btn-sm" id="btn-logout" title="Log out" style="font-size: 0.78rem; padding: 0.35rem 0.75rem; border-radius: var(--radius-full);">
          Logout
        </button>
      ` : `
        <button class="btn btn-primary btn-sm" id="nav-btn-login" style="font-size: 0.82rem; padding: 0.4rem 0.9rem;">
          Sign In
        </button>
      `}
    </div>
  `;

  // Event Listeners
  nav.querySelector('#nav-brand')?.addEventListener('click', () => onTabChange(user ? 'dashboard' : 'explore'));
  nav.querySelector('#nav-avatar-btn')?.addEventListener('click', () => {
    if (user) {
      onTabChange('profile');
    } else {
      onOpenAuth();
    }
  });
  nav.querySelector('#nav-search-btn')?.addEventListener('click', () => onTabChange('explore'));
  nav.querySelector('#btn-logout')?.addEventListener('click', onLogout);
  nav.querySelector('#nav-btn-login')?.addEventListener('click', onOpenAuth);

  return nav;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
