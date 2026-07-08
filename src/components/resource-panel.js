/* ============================================================
   FIFA MatchDay GenAI Nexus — Resource Panel Component
   Staff deployment controls for Ops mode
   ============================================================ */

import { h, $, formatNumber } from '../utils/dom.js';
import { announce } from '../utils/a11y.js';
import state, { subscribe } from '../core/state.js';
import { RESOURCE_TYPES, STADIUM_ZONES } from '../utils/constants.js';

/**
 * Create the resource deployment panel
 * @returns {HTMLElement}
 */
export function createResourcePanel() {
  const panel = h('div', {
    class: 'resource-panel',
    id: 'resource-panel',
    role: 'region',
    'aria-label': 'Resource deployment',
  },
    h('div', { class: 'resource-panel__header flex items-center justify-between' },
      h('h3', { class: 'text-base font-bold flex items-center gap-2' },
        h('span', { 'aria-hidden': 'true' }, '👥'),
        'Staff Resources',
      ),
      h('span', { class: 'text-xs text-slate-500' }, `${getTotalDeployed()} deployed`),
    ),
    ...RESOURCE_TYPES.map(type => createResourceItem(type)),
    h('div', { class: 'p-3 border-t border-surface-200' },
      h('button', {
        class: 'btn btn--primary btn--sm w-full',
        id: 'auto-balance-btn',
        onClick: handleAutoBalance,
        'aria-label': 'Auto-balance staff deployment',
      }, '⚡ AI Auto-Balance'),
    ),
  );

  subscribe('crowdData', () => updateDeploymentSuggestions());

  return panel;
}

/**
 * Create a resource type row
 */
function createResourceItem(type) {
  const deployed = getDeployedCount(type.id);
  const available = type.total - deployed;

  return h('div', {
    class: 'resource-item',
    id: `resource-${type.id}`,
  },
    h('div', { class: 'resource-item__info' },
      h('div', {
        class: 'resource-item__icon',
        style: { background: `${type.color}15`, color: type.color },
      }, type.icon),
      h('div', {},
        h('p', { class: 'resource-item__name' }, type.name),
        h('p', { class: 'resource-item__count' },
          h('span', { id: `deployed-${type.id}` }, `${deployed}`),
          ` / ${type.total} deployed`,
        ),
      ),
    ),
    h('div', { class: 'resource-item__controls' },
      h('button', {
        class: 'btn btn--ghost btn--sm',
        'aria-label': `Remove one ${type.name} staff`,
        onClick: () => adjustResource(type.id, -1),
      }, '−'),
      h('span', {
        class: 'text-sm font-bold w-8 text-center',
        id: `resource-count-${type.id}`,
      }, String(deployed)),
      h('button', {
        class: 'btn btn--ghost btn--sm',
        'aria-label': `Add one ${type.name} staff`,
        onClick: () => adjustResource(type.id, 1),
      }, '+'),
    ),
  );
}

/**
 * Get deployed count for a resource type
 */
function getDeployedCount(typeId) {
  const resource = state.resources?.[typeId];
  if (!resource?.deployed) return 0;
  return Object.values(resource.deployed).reduce((sum, n) => sum + n, 0);
}

/**
 * Get total deployed across all types
 */
function getTotalDeployed() {
  let total = 0;
  for (const type of RESOURCE_TYPES) {
    total += getDeployedCount(type.id);
  }
  return total;
}

/**
 * Adjust resource count
 */
function adjustResource(typeId, delta) {
  const resource = state.resources?.[typeId];
  if (!resource) return;

  const current = getDeployedCount(typeId);
  const newCount = Math.max(0, Math.min(resource.total, current + delta));

  // Update state
  const newResources = { ...state.resources };
  newResources[typeId] = {
    ...resource,
    deployed: { ...resource.deployed, general: newCount },
  };
  state.resources = newResources;

  // Update UI
  const countEl = $(`#resource-count-${typeId}`);
  if (countEl) countEl.textContent = String(newCount);

  const deployedEl = $(`#deployed-${typeId}`);
  if (deployedEl) deployedEl.textContent = String(newCount);

  const typeInfo = RESOURCE_TYPES.find(t => t.id === typeId);
  announce(`${typeInfo?.name || typeId}: ${newCount} deployed`);
}

/**
 * AI Auto-balance based on crowd density
 */
function handleAutoBalance() {
  const crowdData = state.crowdData || {};
  const zones = Object.values(crowdData).sort((a, b) => b.density - a.density);

  if (zones.length === 0) {
    announce('No crowd data available for auto-balancing');
    return;
  }

  // Calculate optimal deployment
  const hotZones = zones.filter(z => z.density > 60);
  const newResources = { ...state.resources };

  for (const type of RESOURCE_TYPES) {
    const deployed = {};
    let remaining = type.total;

    // Allocate more to high-density zones
    for (const zone of hotZones) {
      const proportion = zone.density / 100;
      const allocation = Math.min(remaining, Math.ceil(type.total * proportion * 0.3));
      deployed[zone.zoneId] = allocation;
      remaining -= allocation;
    }

    deployed.reserve = remaining;
    newResources[type.id] = { ...newResources[type.id], deployed };
  }

  state.resources = newResources;

  // Update all counts in UI
  for (const type of RESOURCE_TYPES) {
    const count = getDeployedCount(type.id);
    const countEl = $(`#resource-count-${type.id}`);
    if (countEl) countEl.textContent = String(count);
    const deployedEl = $(`#deployed-${type.id}`);
    if (deployedEl) deployedEl.textContent = String(count);
  }

  const btn = $('#auto-balance-btn');
  if (btn) {
    btn.textContent = '✓ Balanced';
    btn.classList.remove('btn--primary');
    btn.classList.add('btn--secondary');
    setTimeout(() => {
      btn.textContent = '⚡ AI Auto-Balance';
      btn.classList.add('btn--primary');
      btn.classList.remove('btn--secondary');
    }, 2000);
  }

  announce('Staff resources auto-balanced based on crowd density');
}

/**
 * Update deployment suggestions based on density changes
 */
function updateDeploymentSuggestions() {
  // Visual hint if density is very high somewhere
  const crowdData = state.crowdData || {};
  const criticalZones = Object.values(crowdData).filter(z => z.density > 85);

  const btn = $('#auto-balance-btn');
  if (btn && criticalZones.length > 0) {
    btn.classList.add('animate-pulse');
    setTimeout(() => btn.classList.remove('animate-pulse'), 3000);
  }
}

export default { createResourcePanel };
