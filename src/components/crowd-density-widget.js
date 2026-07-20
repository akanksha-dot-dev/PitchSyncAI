/**
 * @module crowd-density-widget
 * @description Real-time crowd density widget for Fan Copilot sidebar.
 *
 * Displays a live-updating compact banner with density levels for the
 * fan's assigned gate and the top congested zones. Color-coded severity
 * and an "Avoid Zone" button inject reroute requests into the chat.
 */

import { h, $ } from '../utils/dom.js';
import { announce } from '../utils/a11y.js';
import state, { subscribe } from '../core/state.js';
import { STADIUM_ZONES } from '../utils/constants.js';

/**
 * Get the severity class and label for a given density percentage.
 * @param {number} density
 * @returns {{ cls: string, label: string, bar: string }}
 */
function getSeverity(density) {
  if (density >= 85) return { cls: 'density-badge--critical', label: 'Critical', bar: '#EF4444' };
  if (density >= 70) return { cls: 'density-badge--high', label: 'High', bar: '#F97316' };
  if (density >= 50) return { cls: 'density-badge--moderate', label: 'Moderate', bar: '#EAB308' };
  return { cls: 'density-badge--low', label: 'Low', bar: '#22C55E' };
}

/**
 * Create the Crowd Density Widget for the Fan sidebar.
 * @returns {HTMLElement}
 */
export function createCrowdDensityWidget() {
  const widget = h('div', {
    class: 'crowd-density-widget card',
    id: 'crowd-density-widget',
    role: 'region',
    'aria-label': 'Live crowd density',
  },
    h('div', { class: 'crowd-density-widget__header' },
      h('h3', { class: 'text-sm font-bold text-slate-800 flex items-center gap-2' },
        h('span', { class: 'crowd-density-widget__live-dot', 'aria-hidden': 'true' }),
        'Live Zone Density',
      ),
      h('span', { class: 'text-xs text-slate-400', id: 'density-last-updated' }, 'Updating...'),
    ),
    h('div', { class: 'crowd-density-widget__zones', id: 'density-zone-list' }),
    h('p', { class: 'text-xs text-slate-400 mt-2 pt-2 border-t border-surface-200' },
      '\uD83D\uDCA1 Tap Avoid to get an AI reroute suggestion in chat.',
    ),
  );

  setTimeout(() => renderDensityZones(), 100);
  subscribe('crowdData', () => renderDensityZones());

  return widget;
}

/**
 * Render the density zone rows inside the widget.
 */
function renderDensityZones() {
  const list = $('#density-zone-list');
  if (!list) return;

  const crowdData = state.crowdData || {};
  const ticket = state.userProfile?.ticket;
  const fanGateId = ticket?.gate ? `gate_${ticket.gate.toLowerCase()}` : null;

  const allZones = Object.values(crowdData).sort((a, b) => b.density - a.density);
  const priorityZones = [];

  if (fanGateId && crowdData[fanGateId]) {
    priorityZones.push(crowdData[fanGateId]);
  }
  for (const z of allZones) {
    if (priorityZones.length >= 4) break;
    if (!priorityZones.find(p => p.zoneId === z.zoneId)) {
      priorityZones.push(z);
    }
  }

  list.innerHTML = '';

  for (const zone of priorityZones.slice(0, 4)) {
    const zoneInfo = STADIUM_ZONES[zone.zoneId];
    if (!zoneInfo) continue;
    const { cls, label, bar } = getSeverity(zone.density);
    const isFanGate = zone.zoneId === fanGateId;

    const row = h('div', { class: `density-zone-row${isFanGate ? ' density-zone-row--my-gate' : ''}` },
      h('div', { class: 'density-zone-row__info' },
        h('span', { class: 'text-xs font-medium text-slate-700 truncate' },
          (isFanGate ? '\u2B50 ' : '') + zoneInfo.name,
        ),
      ),
      h('div', { class: 'density-zone-row__right' },
        h('div', { class: 'density-bar-track' },
          h('div', { class: 'density-bar-fill', style: { width: `${zone.density}%`, background: bar } }),
        ),
        zone.density >= 70
          ? h('button', {
              class: 'density-avoid-btn',
              'aria-label': `Avoid ${zoneInfo.name} - get alternate route`,
              onClick: () => injectAvoidRequest(zoneInfo.name),
            }, 'Avoid')
          : h('span', { class: `density-badge ${cls}` }, `${zone.density}%`),
      ),
    );
    list.appendChild(row);
  }

  const lastUpdated = $('#density-last-updated');
  if (lastUpdated) {
    const now = new Date();
    lastUpdated.textContent = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  }
}

/**
 * Inject an avoid-zone chat message.
 * @param {string} zoneName
 */
function injectAvoidRequest(zoneName) {
  const input = $('#chat-input');
  if (input) {
    input.value = `${zoneName} is too crowded. Can you suggest an alternate route avoiding it?`;
    const sendBtn = $('#chat-send-btn');
    if (sendBtn) sendBtn.click();
  }
  announce(`Requesting alternate route avoiding ${zoneName}`);
}
