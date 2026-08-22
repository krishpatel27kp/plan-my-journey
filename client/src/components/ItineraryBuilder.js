import { api } from '../api.js';

export function renderItineraryBuilder(tripId, onClose) {
  const host = document.createElement('div');
  host.className = 'modal-backdrop animate-fade-in';
  host.style.cssText = 'position:fixed;inset:0;background:rgba(5,8,18,.88);backdrop-filter:blur(10px);z-index:1000;overflow:auto;padding:1rem;';
  let trip = null;
  let budget = null;
  let cities = [];
  let error = '';

  async function load() {
    try {
      [trip, budget, cities] = await Promise.all([api.getTripById(tripId), api.getTripBudget(tripId), api.getCities()]);
      error = '';
    } catch (err) { error = err.message; }
    render();
  }

  function render() {
    const stops = [...(trip?.stops || [])].sort((a, b) => a.stopOrder - b.stopOrder);
    host.innerHTML = `<div class="card" style="max-width:1080px;margin:1rem auto;padding:1.5rem;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;"><div><span class="badge" style="background:rgba(16,185,129,.15);color:#6ee7b7;">ITINERARY</span><h2 style="margin-top:.4rem;">${escapeHtml(trip?.title || 'Loading...')}</h2></div><button class="btn btn-secondary" id="close">Close</button></div>${error ? `<div class="alert alert-danger">${escapeHtml(error)}</div>` : ''}${trip ? `<div style="display:grid;grid-template-columns:1fr 280px;gap:1.25rem;align-items:start;"><section><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem;"><h3>Stops and timeline</h3><button class="btn btn-primary btn-sm" id="add-stop">+ Add stop</button></div>${stops.length ? stops.map((stop, index) => renderStop(stop, index, stops)).join('') : '<div class="empty-state">No stops yet.</div>'}</section><aside class="card" style="padding:1rem;position:sticky;top:1rem;"><h3>Budget</h3><p style="font-size:1.8rem;color:#34d399;margin:.6rem 0;">${money(budget?.remaining)} remaining</p><p style="color:var(--color-text-muted);">${money(budget?.totalSpent)} spent of ${money(budget?.budget)}</p><hr style="margin:1rem 0;border-color:var(--color-border);"><p>Transport: ${money(budget?.byCategory?.transport)}</p><p>Accommodation: ${money(budget?.byCategory?.accommodation)}</p><p>Activities: ${money(budget?.byCategory?.activities)}</p><p>Food: ${money(budget?.byCategory?.food)}</p><p>Other: ${money(budget?.byCategory?.other)}</p>${budget?.overBudgetDays?.length ? `<p style="color:#fbbf24;margin-top:1rem;">Over daily target: ${budget.overBudgetDays.join(', ')}</p>` : ''}</aside></div>` : '<p>Loading itinerary...</p>'}</div>`;
    host.querySelector('#close')?.addEventListener('click', onClose);
    host.querySelector('#add-stop')?.addEventListener('click', addStop);
    host.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', async () => { await api.deleteItineraryActivity(button.dataset.delete); await load(); }));
    host.querySelectorAll('[data-add-activity]').forEach(button => button.addEventListener('click', () => addActivity(button.dataset.addActivity)));
    host.querySelectorAll('[data-move]').forEach(button => button.addEventListener('click', () => moveStop(Number(button.dataset.move), stops)));
  }

  function renderStop(stop, index, stops) {
    const activities = [...(stop.activities || [])].sort((a, b) => `${a.date || ''}${a.startTime || ''}`.localeCompare(`${b.date || ''}${b.startTime || ''}`));
    return `<article class="card" style="padding:1rem;margin-bottom:1rem;"><div style="display:flex;justify-content:space-between;align-items:center;"><div><span style="color:var(--color-primary-light);font-weight:700;">${String(index + 1).padStart(2, '0')}</span><strong style="margin-left:.5rem;">${escapeHtml(stop.cityName)}</strong><small style="display:block;color:var(--color-text-muted);margin:.3rem 0 0 1.8rem;">${escapeHtml(stop.startDate || '')} ${stop.endDate ? `→ ${escapeHtml(stop.endDate)}` : ''}</small></div><div><button class="btn btn-secondary btn-sm" data-move="${index - 1}" ${index === 0 ? 'disabled' : ''}>↑</button> <button class="btn btn-secondary btn-sm" data-move="${index + 1}" ${index === stops.length - 1 ? 'disabled' : ''}>↓</button></div></div><div style="margin:1rem 0 0 1.8rem;">${activities.length ? activities.map(activity => `<div style="display:flex;justify-content:space-between;gap:1rem;border-left:2px solid var(--color-accent);padding:.5rem .75rem;margin:.4rem 0;background:rgba(255,255,255,.03);"><span><strong>${escapeHtml(activity.title)}</strong><small style="display:block;color:var(--color-text-muted);">${escapeHtml(activity.date || '')} ${escapeHtml(activity.startTime || '')}${activity.endTime ? `–${escapeHtml(activity.endTime)}` : ''} · ${money(activity.cost)}</small></span><button class="btn btn-secondary btn-sm" data-delete="${activity.id}">Remove</button></div>`).join('') : '<p style="color:var(--color-text-muted);">No activities scheduled.</p>'}<button class="btn btn-secondary btn-sm" data-add-activity="${stop.id}">+ Add activity</button></div></article>`;
  }

  async function addStop() {
    const input = prompt(`Enter city ID or name: ${cities.map(city => `${city.id} (${city.name})`).join(', ')}`);
    const city = cities.find(item => item.id === input) || cities.find(item => item.name.toLowerCase() === String(input || '').toLowerCase());
    if (!city) return;
    await api.addStop(tripId, { cityId: city.id, startDate: trip.startDate, endDate: trip.endDate, stopOrder: (trip.stops?.length || 0) + 1 });
    await load();
  }

  async function addActivity(stopId) {
    const activityId = prompt('Activity ID from the selected city:');
    const date = prompt('Date (YYYY-MM-DD):');
    if (!activityId || !date) return;
    await api.addStopActivity(stopId, { activityId, date, startTime: prompt('Start time (HH:MM, optional):') || null, endTime: prompt('End time (HH:MM, optional):') || null, cost: Number(prompt('Cost:') || 0) });
    await load();
  }

  async function moveStop(targetIndex, stops) {
    if (targetIndex < 0 || targetIndex >= stops.length) return;
    const currentIndex = targetIndex + (targetIndex < stops.length - 1 ? 1 : -1);
    const reordered = [...stops];
    [reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]];
    await api.reorderStops(tripId, reordered.map(stop => stop.id));
    await load();
  }

  function money(value) { return `${trip?.currency === 'USD' ? '$' : ''}${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`; }
  function escapeHtml(value) { const div = document.createElement('div'); div.textContent = value || ''; return div.innerHTML; }
  load();
  return host;
}
