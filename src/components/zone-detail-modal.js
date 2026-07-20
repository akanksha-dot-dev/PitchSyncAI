/**
 * @module zone-detail-modal
 * @description Per-Zone Density Drill-Down Modal for Ops Command mode.
 *
 * Opens when an ops staff member clicks a zone on the heatmap. Shows:
 * - Zone name, density %, capacity count, trend
 * - Active alerts for that zone
 * - Quick actions: Deploy Resource, Trigger Reroute
 *
 * Listens to state.zoneDetailId to know which zone to show.
 * Reacts to live crowdData updates while open.
 */

import { h, $, formatTime } from '../utils/dom.js';
import { announce } from '../utils/a11y.js';
import state, { subscribe } from '../core/state.js';
import { emit } from '../core/events.js';
import { STADIUM_ZONES, ZONE_ICONS, RESOURCE_TYPES } from '../utils/constants.js';

// Per-zone sparkline history cache: { zoneId: number[] }
const zoneHistory = {};

/**
 * Initialize the zone detail modal system.
 * Appends a single modal overlay to the body and wires state subscriptions.
 */
export function initZoneDetailModal() {
  // Only mount once
  if ($('#zone-detail-modal')) return;

  const overlay = h('div', {
    id: 'zone-detail-modal',
    class: 'zone-modal-overlay',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'zone-modal-title',
    style: { display: 'none' },
    onClick: (e) => {
      if (e.target === overlay) closeModal();
    },
  },
    h('div', { class: 'zone-modal-panel' },
      // Close button
      h('button', {
        class: 'zone-modal-close',
        'aria-label': 'Close zone detail',
        onClick: closeModal,
      }, '\u00D7'),

      // Dynamic content area
      h('div', { id: 'zone-modal-content' }),
    ),
  );

  document.body.appendChild(overlay);

  // Subscribe to zone detail open trigger
  subscribe('zoneDetailOpen', (open) => {
    if (open) openModal(state.zoneDetailId);
    else closeModal();
  });

  subscribe('zoneDetailId', (zoneId) => {
    if (zoneId && state.zoneDetailOpen) openModal(zoneId);
  });

  // Live update while modal is open
  subscribe('crowdData', () => {
    if (state.zoneDetailOpen && state.zoneDetailId) {
      renderModalContent(state.zoneDetailId);
    }
  });

  // Keyboard close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.zoneDetailOpen) closeModal();
  });
}

/**
 * Open the modal for a specific zone.
 * @param {string} zoneId
 */
export function openZoneModal(zoneId) {
  state.zoneDetailId = zoneId;
  state.zoneDetailOpen = true;
}

/**
 * Open and render modal for a given zone.
 * @param {string} zoneId
 */
function openModal(zoneId) {
  const overlay = $('#zone-detail-modal');
  if (!overlay) return;

  overlay.style.display = 'flex';
  overlay.setAttribute('aria-hidden', 'false');
  renderModalContent(zoneId);

  // Focus trap
  setTimeout(() => {
    const closeBtn = overlay.querySelector('.zone-modal-close');
    if (closeBtn) closeBtn.focus();
  }, 50);

  announce(`Zone detail opened for ${STADIUM_ZONES[zoneId]?.name || zoneId}`);
}

/**
 * Render the modal content for a given zone.
 * @param {string} zoneId
 */
function renderModalContent(zoneId) {
  const content = $('#zone-modal-content');
  if (!content) return;

  const zoneInfo = STADIUM_ZONES[zoneId];
  const crowdInfo = state.crowdData?.[zoneId];
  if (!zoneInfo) return;

  const density = crowdInfo?.density || 0;
  const count = crowdInfo?.count || 0;
  const trend = crowdInfo?.trend || 'stable';
  const icon = ZONE_ICONS[zoneInfo.type] || '\uD83D\uDCCD';

  // Maintain sparkline history
  if (!zoneHistory[zoneId]) zoneHistory[zoneId] = [];
  zoneHistory[zoneId].push(density);
  if (zoneHistory[zoneId].length > 12) zoneHistory[zoneId].shift();

  // Find active alerts for this zone
  const zoneAlerts = (state.opsAlerts || []).filter(
    a => a.zone === zoneId && !a.resolved
  );

  const densityColor = density >= 85 ? '#EF4444' : density >= 70 ? '#F97316' : density >= 50 ? '#EAB308' : '#22C55E';

  content.innerHTML = '';
  content.appendChild(
    h('div', { class: 'zone-modal-body' },
      // Title row
      h('div', { class: 'zone-modal-title-row' },
        h('span', { class: 'zone-modal-zone-icon', 'aria-hidden': 'true' }, icon),
        h('div', {},
          h('h2', { id: 'zone-modal-title', class: 'zone-modal-title' }, zoneInfo.name),
          h('p', { class: 'text-xs text-slate-500' }, `Type: ${zoneInfo.type} \u2022 Capacity: ${zoneInfo.capacity.toLocaleString()}`),
        ),
        h('div', {
          class: 'zone-modal-density-ring',
          style: { '--density-color': densityColor },
        },
          h('span', { class: 'zone-modal-density-value', style: { color: densityColor } }, `${density}%`),
        ),
      ),

      // Stats grid
      h('div', { class: 'zone-modal-stats' },
        createStatCell('People', String(count), '\uD83D\uDC65'),
        createStatCell('Capacity', String(zoneInfo.capacity), '\uD83C\uDFDF\uFE0F'),
        createStatCell('Trend', trend === 'rising' ? '\uD83D\uDCC8 Rising' : trend === 'falling' ? '\uD83D\uDCC9 Falling' : '\u27A1\uFE0F Stable', '\uD83D\uDCC4'),
        createStatCell('Available', String(Math.max(0, zoneInfo.capacity - count)), '\u2705'),
      ),

      // Sparkline
      h('div', { class: 'zone-modal-sparkline-wrap' },
        h('p', { class: 'text-xs text-slate-500 mb-1 font-medium' }, 'Density History (last 60 seconds)'),
        h('div', { id: 'zone-modal-sparkline', class: 'zone-modal-sparkline' }),
      ),

      // Active alerts
      zoneAlerts.length > 0
        ? h('div', { class: 'zone-modal-alerts' },
            h('p', { class: 'text-xs font-semibold text-slate-600 mb-2' }, `\u26A0\uFE0F ${zoneAlerts.length} Active Alert${zoneAlerts.length > 1 ? 's' : ''}`),
            ...zoneAlerts.map(alert =>
              h('div', { class: `zone-alert-chip zone-alert-chip--${alert.severity}` },
                h('span', { class: 'zone-alert-chip__dot' }),
                h('span', { class: 'text-xs' }, alert.message.slice(0, 80)),
              ),
            ),
          )
        : h('p', { class: 'text-xs text-green-600 font-medium py-1' }, '\u2705 No active alerts for this zone'),

      // Quick actions
      h('div', { class: 'zone-modal-actions' },
        h('button', {
          class: 'btn btn--secondary btn--sm flex-1',
          onClick: () => handleDeployResource(zoneId, zoneInfo.name),
          'aria-label': `Deploy resource to ${zoneInfo.name}`,
        }, '\uD83D\uDC65 Deploy Resource'),
        h('button', {
          class: 'btn btn--primary btn--sm flex-1',
          onClick: () => handleTriggerReroute(zoneId, zoneInfo.name),
          'aria-label': `Trigger reroute wizard for ${zoneInfo.name}`,
        }, '\uD83D\uDD00 Trigger Reroute'),
      ),
    ),
  );

  // Draw sparkline
  drawZoneSparkline('zone-modal-sparkline', zoneHistory[zoneId], densityColor);
}

/**
 * Create a stat cell.
 * @param {string} label
 * @param {string} value
 * @param {string} icon
 * @returns {HTMLElement}
 */
function createStatCell(label, value, icon) {
  return h('div', { class: 'zone-stat-cell' },
    h('span', { class: 'zone-stat-cell__icon', 'aria-hidden': 'true' }, icon),
    h('p', { class: 'zone-stat-cell__value' }, value),
    h('p', { class: 'zone-stat-cell__label' }, label),
  );
}

/**
 * Draw a mini sparkline for the zone density history.
 * @param {string} containerId
 * @param {number[]} data
 * @param {string} color
 */
function drawZoneSparkline(containerId, data, color) {
  const container = $(`#${containerId}`);
  if (!container || data.length < 2) return;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 200 40');
  svg.setAttribute('class', 'w-full h-full');
  svg.setAttribute('aria-hidden', 'true');

  const min = Math.min(...data);
  const max = Math.max(...data, min + 1);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 200;
    const y = 38 - ((v - min) / range) * 36;
    return `${x},${y}`;
  });

  const area = document.createElementNS(svgNS, 'polygon');
  area.setAttribute('points', `0,40 ${points.join(' ')} 200,40`);
  area.setAttribute('fill', color);
  area.setAttribute('opacity', '0.15');
  svg.appendChild(area);

  const line = document.createElementNS(svgNS, 'polyline');
  line.setAttribute('points', points.join(' '));
  line.setAttribute('fill', 'none');
  line.setAttribute('stroke', color);
  line.setAttribute('stroke-width', '2');
  line.setAttribute('stroke-linecap', 'round');
  line.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(line);

  container.innerHTML = '';
  container.appendChild(svg);
}

/**
 * Deploy additional resources to a zone.
 * @param {string} zoneId
 * @param {string} zoneName
 */
function handleDeployResource(zoneId, zoneName) {
  // Allocate crowd control staff to this zone
  const newResources = { ...state.resources };
  const crowdControl = { ...newResources.crowdControl };
  const deployed = { ...crowdControl.deployed };
  deployed[zoneId] = (deployed[zoneId] || 0) + 5;
  crowdControl.deployed = deployed;
  newResources.crowdControl = crowdControl;
  state.resources = newResources;

  announce(`5 crowd control staff deployed to ${zoneName}`);
  closeModal();
}

/**
 * Trigger the reroute validation wizard for a zone.
 * @param {string} zoneId
 * @param {string} zoneName
 */
function handleTriggerReroute(zoneId, zoneName) {
  const mockAlert = {
    id: `reroute-${zoneId}-${Date.now()}`,
    severity: 'warning',
    zone: zoneId,
    message: `Manual reroute triggered for ${zoneName}`,
    action: 'Review and validate reroute proposal',
    timestamp: Date.now(),
  };

  state.wizardData = { alert: mockAlert, zone: zoneId };
  state.wizardOpen = true;
  emit('wizard:open', { alert: mockAlert, zone: zoneId });

  announce(`Reroute wizard opened for ${zoneName}`);
  closeModal();
}

/**
 * Close the modal.
 */
function closeModal() {
  const overlay = $('#zone-detail-modal');
  if (overlay) {
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
  }
  state.zoneDetailOpen = false;
  state.zoneDetailId = null;
}
