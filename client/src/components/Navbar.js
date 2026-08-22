/**
 * Navigation Bar Component
 */

export function renderNavbar({ user, activeTab, onTabChange, onLogout, onOpenAuth }) {
  const nav = document.createElement('header');
  nav.className = 'navbar';

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  const avatarHtml = user?.profileImage
    ? `<img src="${user.profileImage}" alt="${user.name}" onerror="this.onerror=null; this.parentElement.innerHTML='${userInitial}'" />`
    : `<span>${userInitial}</span>`;

  nav.innerHTML = `
    <div class="brand" id="nav-brand">
      <div class="brand-icon">✈️</div>
      <span>Plan My Journey</span>
    </div>

    <nav class="nav-links">
      <button class="nav-btn ${activeTab === 'explore' ? 'active' : ''}" id="nav-tab-explore">
        Explore Cities
      </button>
      ${user ? `
        <button class="nav-btn ${activeTab === 'dashboard' ? 'active' : ''}" id="nav-tab-dashboard">
          Trips Dashboard
        </button>
        <button class="nav-btn ${activeTab === 'profile' ? 'active' : ''}" id="nav-tab-profile">
          Profile & Settings
        </button>
      ` : ''}
    </nav>

    ${user ? `
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.6rem; cursor: pointer;" id="nav-user-badge">
          <div class="avatar">${avatarHtml}</div>
          <div style="display: flex; flex-direction: column; text-align: left; line-height: 1.2;">
            <span style="font-weight: 600; font-size: 0.9rem;">${escapeHtml(user.name)}</span>
            <span style="font-size: 0.75rem; color: var(--color-text-muted);">${escapeHtml(user.email)}</span>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" id="btn-logout" title="Log out">
          Sign Out
        </button>
      </div>
    ` : `
      <div style="display: flex; gap: 0.75rem;">
        <button class="btn btn-primary btn-sm" id="nav-btn-login">
          Sign In / Register
        </button>
      </div>
    `}
  `;

  // Event Listeners
  nav.querySelector('#nav-brand')?.addEventListener('click', () => onTabChange(user ? 'dashboard' : 'explore'));
  nav.querySelector('#nav-tab-explore')?.addEventListener('click', () => onTabChange('explore'));
  nav.querySelector('#nav-tab-dashboard')?.addEventListener('click', () => onTabChange('dashboard'));
  nav.querySelector('#nav-tab-profile')?.addEventListener('click', () => onTabChange('profile'));
  nav.querySelector('#nav-user-badge')?.addEventListener('click', () => onTabChange('profile'));
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
