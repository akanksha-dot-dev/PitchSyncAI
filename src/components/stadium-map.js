/**
 * @module stadium-map
 * @description Stadium Map component with interactive SVG overlays.
 *
 * Renders an interactive map of the stadium for the Fan Copilot.
 * Supports density visualizations, wayfinding overlays, and accessibility indicators.
 */

import { h, $ } from '../utils/dom.js';
import { announce } from '../utils/a11y.js';
import state, { subscribe } from '../core/state.js';
import { STADIUM_ZONES, ZONE_ICONS } from '../utils/constants.js';

/**
 * Get density fill color for SVG zone overlays based on crowd percentage.
 *
 * @param {number} density - Crowd density percentage (0–100)
 * @returns {string} Hex color string
 */
function getDensityColor(density) {
  if (density >= 85) return '#FCA5A5';
  if (density >= 70) return '#FECACA';
  if (density >= 50) return '#FDE68A';
  if (density >= 30) return '#BBF7D0';
  return '#D1FAE5';
}

/**
 * Get text contrast color for SVG zone percentage text.
 *
 * @param {number} density - Crowd density percentage (0–100)
 * @returns {string} Hex text color string
 */
function getDensityTextColor(density) {
  if (density >= 70) return '#991B1B';
  if (density >= 50) return '#92400E';
  return '#166534';
}

/**
 * Create the interactive SVG stadium map card component.
 *
 * @param {'density'|'wayfinding'} [mode='density'] - Map overlay mode
 * @returns {HTMLElement} Stadium map card element
 */
export function createStadiumMap(mode = 'density') {
  const wrapper = h('div', {
    class: 'card',
    id: 'stadium-map-card',
  },
    h('div', { class: 'flex items-center justify-between mb-3' },
      h('h3', { class: 'text-sm font-bold text-slate-800 flex items-center gap-2' },
        h('span', { 'aria-hidden': 'true' }, '🏟️'),
        'Stadium Map',
      ),
      h('div', { class: 'flex items-center gap-2' },
        h('span', { class: 'flex items-center gap-1 text-xs' },
          h('span', { class: 'w-3 h-3 rounded-sm inline-block', style: { background: '#D1FAE5' } }),
          'Low',
        ),
        h('span', { class: 'flex items-center gap-1 text-xs' },
          h('span', { class: 'w-3 h-3 rounded-sm inline-block', style: { background: '#FDE68A' } }),
          'Med',
        ),
        h('span', { class: 'flex items-center gap-1 text-xs' },
          h('span', { class: 'w-3 h-3 rounded-sm inline-block', style: { background: '#FCA5A5' } }),
          'High',
        ),
      ),
    ),
    createStadiumSVG(mode),
  );

  subscribe('crowdData', (data) => updateMapOverlays(data));

  return wrapper;
}

/**
 * Render the interactive SVG stadium graphic with zones, gates, and text labels.
 *
 * @param {'density'|'wayfinding'} mode - Visualization mode
 * @returns {HTMLElement} Container div wrapping the SVG element
 */
function createStadiumSVG(_mode) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 400 360');
  svg.setAttribute('class', 'w-full h-auto stadium-map-svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Interactive stadium layout map');

  // Background
  const bg = document.createElementNS(svgNS, 'rect');
  bg.setAttribute('width', '400');
  bg.setAttribute('height', '360');
  bg.setAttribute('fill', '#F8FAFC');
  bg.setAttribute('rx', '8');
  svg.appendChild(bg);

  // Outer bowl ellipse
  const outerBowl = document.createElementNS(svgNS, 'ellipse');
  outerBowl.setAttribute('cx', '200');
  outerBowl.setAttribute('cy', '180');
  outerBowl.setAttribute('rx', '180');
  outerBowl.setAttribute('ry', '150');
  outerBowl.setAttribute('fill', 'none');
  outerBowl.setAttribute('stroke', '#E2E8F0');
  outerBowl.setAttribute('stroke-width', '2');
  svg.appendChild(outerBowl);

  // Field rectangle
  const field = document.createElementNS(svgNS, 'rect');
  field.setAttribute('x', '130');
  field.setAttribute('y', '125');
  field.setAttribute('width', '140');
  field.setAttribute('height', '110');
  field.setAttribute('rx', '8');
  field.setAttribute('fill', '#DCFCE7');
  field.setAttribute('stroke', '#86EFAC');
  field.setAttribute('stroke-width', '1.5');
  svg.appendChild(field);

  // Field text label
  const fieldText = document.createElementNS(svgNS, 'text');
  fieldText.setAttribute('x', '200');
  fieldText.setAttribute('y', '183');
  fieldText.setAttribute('text-anchor', 'middle');
  fieldText.setAttribute('font-size', '20');
  fieldText.textContent = '⚽';
  svg.appendChild(fieldText);

  // Render clickable stadium zones
  const zones = [
    { id: 'gate_a', cx: 200, cy: 38, r: 18, type: 'gate' },
    { id: 'gate_b', cx: 335, cy: 75, r: 18, type: 'gate' },
    { id: 'gate_c', cx: 375, cy: 180, r: 18, type: 'gate' },
    { id: 'gate_d', cx: 335, cy: 285, r: 18, type: 'gate' },
    { id: 'gate_e', cx: 200, cy: 322, r: 18, type: 'gate' },
    { id: 'gate_f', cx: 65, cy: 285, r: 18, type: 'gate' },
    { id: 'gate_g', cx: 25, cy: 180, r: 18, type: 'gate' },
    { id: 'gate_h', cx: 65, cy: 75, r: 18, type: 'gate' },
    { id: 'section_100', shape: 'rect', x: 140, y: 70, w: 120, h: 40, rx: 6, type: 'section' },
    { id: 'section_200', shape: 'rect', x: 140, y: 250, w: 120, h: 40, rx: 6, type: 'section' },
    { id: 'section_300', shape: 'rect', x: 285, y: 135, w: 40, h: 90, rx: 6, type: 'section' },
    { id: 'section_400', shape: 'rect', x: 75, y: 135, w: 40, h: 90, rx: 6, type: 'section' },
  ];

  for (const z of zones) {
    const crowdInfo = state.crowdData?.[z.id];
    const density = crowdInfo?.density || 25;
    const fillColor = getDensityColor(density);
    const textColor = getDensityTextColor(density);

    let el;
    if (z.shape === 'rect') {
      el = document.createElementNS(svgNS, 'rect');
      el.setAttribute('x', z.x);
      el.setAttribute('y', z.y);
      el.setAttribute('width', z.w);
      el.setAttribute('height', z.h);
      el.setAttribute('rx', z.rx || 4);
    } else {
      el = document.createElementNS(svgNS, 'circle');
      el.setAttribute('cx', z.cx);
      el.setAttribute('cy', z.cy);
      el.setAttribute('r', z.r);
    }

    el.setAttribute('fill', fillColor);
    el.setAttribute('stroke', '#CBD5E1');
    el.setAttribute('stroke-width', '1.5');
    el.setAttribute('class', 'zone cursor-pointer hover:opacity-80 transition-opacity');
    el.setAttribute('data-zone', z.id);
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', `${STADIUM_ZONES[z.id]?.name || z.id}: ${density}% density`);

    el.addEventListener('click', () => handleZoneClick(z.id));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleZoneClick(z.id);
      }
    });

    svg.appendChild(el);

    // Percentage text label overlay
    const lx = z.shape === 'rect' ? z.x + z.w / 2 : z.cx;
    const ly = z.shape === 'rect' ? z.y + z.h / 2 + 4 : z.cy + 4;
    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', lx);
    label.setAttribute('y', ly);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '10');
    label.setAttribute('font-weight', '700');
    label.setAttribute('fill', textColor);
    label.setAttribute('pointer-events', 'none');
    label.setAttribute('data-zone-label', z.id);
    label.textContent = `${density}%`;
    svg.appendChild(label);
  }

  const container = h('div', { class: 'overflow-hidden rounded-lg' });
  container.appendChild(svg);
  return container;
}

/**
 * Handle zone selection click event and announce status via ARIA live region.
 *
 * @param {string} zoneId - Stadium zone ID
 */
function handleZoneClick(zoneId) {
  state.selectedZone = zoneId;
  const zoneData = STADIUM_ZONES[zoneId];
  const crowdInfo = state.crowdData?.[zoneId];
  const density = crowdInfo?.density || 0;

  announce(`Selected ${zoneData?.name || zoneId}: ${density}% density, ${crowdInfo?.trend || 'stable'} trend`);
  showZoneDetails(zoneId, zoneData, crowdInfo);
}

/**
 * Render zone detail information card panel below the map.
 *
 * @param {string} zoneId - Stadium zone ID
 * @param {object} zoneData - Zone static data
 * @param {object} crowdInfo - Live crowd metric info
 */
function showZoneDetails(zoneId, zoneData, crowdInfo) {
  let panel = $('#zone-details-panel');
  if (panel) panel.remove();

  if (!zoneData) return;

  const density = crowdInfo?.density || 0;
  const trendIcon = crowdInfo?.trend === 'rising' ? '📈' : crowdInfo?.trend === 'falling' ? '📉' : '➡️';

  panel = h('div', {
    id: 'zone-details-panel',
    class: 'mt-3 p-3 bg-surface-50 rounded-lg border border-surface-200 animate-fade-in',
    role: 'status',
    'aria-label': `Details for ${zoneData.name}`,
  },
    h('div', { class: 'flex items-center justify-between mb-2' },
      h('h4', { class: 'text-sm font-bold text-slate-800 flex items-center gap-1.5' },
        h('span', { 'aria-hidden': 'true' }, ZONE_ICONS[zoneData.type] || '📍'),
        zoneData.name,
      ),
      h('button', {
        class: 'btn btn--ghost btn--sm',
        'aria-label': 'Close zone details',
        onClick: () => panel.remove(),
      }, '✕'),
    ),
    h('div', { class: 'grid grid-cols-3 gap-2 text-center' },
      h('div', {},
        h('p', { class: 'text-xs text-slate-500' }, 'Density'),
        h('p', { class: 'text-lg font-bold', style: { color: getDensityTextColor(density) } }, `${density}%`),
      ),
      h('div', {},
        h('p', { class: 'text-xs text-slate-500' }, 'Trend'),
        h('p', { class: 'text-lg' }, trendIcon),
      ),
      h('div', {},
        h('p', { class: 'text-xs text-slate-500' }, 'Count'),
        h('p', { class: 'text-lg font-bold text-slate-700' }, `${crowdInfo?.count || 0}`),
      ),
    ),
  );

  const card = $('#stadium-map-card');
  if (card) card.appendChild(panel);
}

/**
 * Repaint map SVG zone fills and text labels when live crowd data changes.
 *
 * @param {Record<string, { zoneName: string, density: number, trend: string }>} crowdData - Updated crowd dataset
 */
function updateMapOverlays(crowdData) {
  if (!crowdData) return;

  for (const [zoneId, info] of Object.entries(crowdData)) {
    const zoneEl = $(`[data-zone="${zoneId}"]`);
    const labelEl = $(`[data-zone-label="${zoneId}"]`);

    if (zoneEl) {
      zoneEl.setAttribute('fill', getDensityColor(info.density));
      zoneEl.setAttribute('aria-label', `${info.zoneName || zoneId}: ${info.density}% density`);

      if (info.density >= 85) {
        zoneEl.style.animation = 'pulse-soft 2s ease-in-out infinite';
      } else {
        zoneEl.style.animation = '';
      }
    }

    if (labelEl) {
      labelEl.textContent = `${info.density}%`;
      labelEl.setAttribute('fill', getDensityTextColor(info.density));
    }
  }
}
