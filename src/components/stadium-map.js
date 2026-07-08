/* ============================================================
   FIFA MatchDay GenAI Nexus — Stadium Map Component
   Interactive SVG stadium with density overlays
   ============================================================ */

import { h, $ } from '../utils/dom.js';
import { announce, setAria } from '../utils/a11y.js';
import state, { subscribe } from '../core/state.js';
import { STADIUM_ZONES, ZONE_ICONS } from '../utils/constants.js';

/**
 * Get density color class
 * @param {number} density - 0-100
 * @returns {string}
 */
function getDensityColor(density) {
  if (density >= 85) return '#FCA5A5';
  if (density >= 70) return '#FECACA';
  if (density >= 50) return '#FDE68A';
  if (density >= 30) return '#BBF7D0';
  return '#D1FAE5';
}

function getDensityTextColor(density) {
  if (density >= 70) return '#991B1B';
  if (density >= 50) return '#92400E';
  return '#166534';
}

/**
 * Create the SVG stadium map
 * @param {string} [mode='density'] - 'density' | 'wayfinding'
 * @returns {HTMLElement}
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
    createStadiumSVG(),
  );

  // Subscribe to crowd data updates
  subscribe('crowdData', (data) => updateMapOverlays(data));

  return wrapper;
}

/**
 * Create the stadium SVG
 */
function createStadiumSVG() {
  const svgNS = 'http://www.w3.org/2000/svg';

  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 440 420');
  svg.setAttribute('class', 'heatmap-svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Stadium map showing crowd density by zone');
  svg.id = 'stadium-svg';

  // Stadium outline (elliptical shape)
  const outline = document.createElementNS(svgNS, 'ellipse');
  outline.setAttribute('cx', '215');
  outline.setAttribute('cy', '205');
  outline.setAttribute('rx', '200');
  outline.setAttribute('ry', '180');
  outline.setAttribute('fill', '#F8FAFC');
  outline.setAttribute('stroke', '#CBD5E1');
  outline.setAttribute('stroke-width', '2');
  svg.appendChild(outline);

  // Inner field
  const field = document.createElementNS(svgNS, 'rect');
  field.setAttribute('x', '140');
  field.setAttribute('y', '140');
  field.setAttribute('width', '150');
  field.setAttribute('height', '130');
  field.setAttribute('rx', '8');
  field.setAttribute('fill', '#BBF7D0');
  field.setAttribute('stroke', '#86EFAC');
  field.setAttribute('stroke-width', '1');
  svg.appendChild(field);

  // Field lines
  const centerLine = document.createElementNS(svgNS, 'line');
  centerLine.setAttribute('x1', '215');
  centerLine.setAttribute('y1', '140');
  centerLine.setAttribute('x2', '215');
  centerLine.setAttribute('y2', '270');
  centerLine.setAttribute('stroke', '#86EFAC');
  centerLine.setAttribute('stroke-width', '1');
  svg.appendChild(centerLine);

  const centerCircle = document.createElementNS(svgNS, 'circle');
  centerCircle.setAttribute('cx', '215');
  centerCircle.setAttribute('cy', '205');
  centerCircle.setAttribute('r', '20');
  centerCircle.setAttribute('fill', 'none');
  centerCircle.setAttribute('stroke', '#86EFAC');
  centerCircle.setAttribute('stroke-width', '1');
  svg.appendChild(centerCircle);

  // Zone overlays
  const zones = [
    // Gates (outer ring)
    { id: 'gate_a', shape: 'circle', cx: 215, cy: 35, r: 20 },
    { id: 'gate_b', shape: 'circle', cx: 370, cy: 75, r: 20 },
    { id: 'gate_c', shape: 'circle', cx: 410, cy: 205, r: 20 },
    { id: 'gate_d', shape: 'circle', cx: 370, cy: 335, r: 20 },
    { id: 'gate_e', shape: 'circle', cx: 215, cy: 380, r: 20 },
    { id: 'gate_f', shape: 'circle', cx: 60, cy: 335, r: 20 },
    { id: 'gate_g', shape: 'circle', cx: 20, cy: 205, r: 20 },
    { id: 'gate_h', shape: 'circle', cx: 60, cy: 75, r: 20 },
    // Sections (inner ring)
    { id: 'section_100', shape: 'rect', x: 155, y: 85, w: 120, h: 45, rx: 6 },
    { id: 'section_200', shape: 'rect', x: 155, y: 280, w: 120, h: 45, rx: 6 },
    { id: 'section_300', shape: 'rect', x: 300, y: 150, w: 45, h: 110, rx: 6 },
    { id: 'section_400', shape: 'rect', x: 85, y: 150, w: 45, h: 110, rx: 6 },
    // Concourses
    { id: 'concourse_n', shape: 'rect', x: 135, y: 55, w: 160, h: 22, rx: 11 },
    { id: 'concourse_s', shape: 'rect', x: 135, y: 335, w: 160, h: 22, rx: 11 },
    // Food Courts
    { id: 'food_court_e', shape: 'rect', x: 355, y: 185, w: 30, h: 40, rx: 6 },
    { id: 'food_court_w', shape: 'rect', x: 50, y: 185, w: 30, h: 40, rx: 6 },
  ];

  for (const z of zones) {
    const zoneData = STADIUM_ZONES[z.id];
    const crowdInfo = state.crowdData?.[z.id];
    const density = crowdInfo?.density || 30;

    let el;
    if (z.shape === 'circle') {
      el = document.createElementNS(svgNS, 'circle');
      el.setAttribute('cx', z.cx);
      el.setAttribute('cy', z.cy);
      el.setAttribute('r', z.r);
    } else {
      el = document.createElementNS(svgNS, 'rect');
      el.setAttribute('x', z.x);
      el.setAttribute('y', z.y);
      el.setAttribute('width', z.w);
      el.setAttribute('height', z.h);
      el.setAttribute('rx', z.rx || 4);
    }

    el.setAttribute('fill', getDensityColor(density));
    el.setAttribute('stroke', '#94A3B8');
    el.setAttribute('stroke-width', '1');
    el.setAttribute('class', 'zone');
    el.setAttribute('data-zone', z.id);
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', `${zoneData?.name || z.id}: ${density}% density`);

    el.addEventListener('click', () => handleZoneClick(z.id));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleZoneClick(z.id);
      }
    });

    svg.appendChild(el);

    // Zone labels
    const labelX = z.shape === 'circle' ? z.cx : z.x + z.w / 2;
    const labelY = z.shape === 'circle' ? z.cy + 4 : z.y + z.h / 2 + 4;
    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', labelX);
    label.setAttribute('y', labelY);
    label.setAttribute('class', 'zone-label');
    label.setAttribute('fill', getDensityTextColor(density));
    label.setAttribute('data-zone-label', z.id);
    label.textContent = `${density}%`;
    svg.appendChild(label);
  }

  const container = h('div', { class: 'overflow-hidden rounded-lg' });
  container.appendChild(svg);
  return container;
}

/**
 * Handle zone click
 */
function handleZoneClick(zoneId) {
  state.selectedZone = zoneId;
  const zoneData = STADIUM_ZONES[zoneId];
  const crowdInfo = state.crowdData?.[zoneId];
  const density = crowdInfo?.density || 0;

  announce(`Selected ${zoneData?.name || zoneId}: ${density}% density, ${crowdInfo?.trend || 'stable'} trend`);

  // Show tooltip/details
  showZoneDetails(zoneId, zoneData, crowdInfo);
}

/**
 * Show zone details panel
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
        h('p', { class: `text-lg font-bold`, style: { color: getDensityTextColor(density) } }, `${density}%`),
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
 * Update map zone overlays with new crowd data
 */
function updateMapOverlays(crowdData) {
  if (!crowdData) return;

  for (const [zoneId, info] of Object.entries(crowdData)) {
    const zoneEl = $(`[data-zone="${zoneId}"]`);
    const labelEl = $(`[data-zone-label="${zoneId}"]`);

    if (zoneEl) {
      zoneEl.setAttribute('fill', getDensityColor(info.density));
      zoneEl.setAttribute('aria-label', `${info.zoneName || zoneId}: ${info.density}% density`);

      // Pulse animation for critical zones
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

export default { createStadiumMap };
