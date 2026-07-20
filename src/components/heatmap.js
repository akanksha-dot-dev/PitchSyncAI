/**
 * @module heatmap
 * @description Real-time crowd density heatmap for Ops Command mode.
 *
 * Renders an SVG stadium overlay with colour-coded zone density
 * (green → yellow → orange → red) and percentage labels.
 * Subscribes to live crowd-data updates from the Firebase mock
 * service to repaint zones in real time.
 */

import { h, $ } from '../utils/dom.js';
import state, { subscribe } from '../core/state.js';
import { STADIUM_ZONES, ZONE_ICONS } from '../utils/constants.js';
import { announce } from '../utils/a11y.js';
import { openZoneModal } from './zone-detail-modal.js';


/**
 * Get hex fill color for a zone based on crowd density percentage.
 *
 * @param {number} density - Crowd density percentage (0–100)
 * @returns {string} Hex color string
 *
 * @example
 * getDensityFill(85); // => '#F97316' (Orange)
 */
function getDensityFill(density) {
  if (density >= 90) return '#EF4444';
  if (density >= 75) return '#F97316';
  if (density >= 60) return '#EAB308';
  if (density >= 40) return '#84CC16';
  return '#22C55E';
}

/**
 * Create the Ops heatmap component container.
 *
 * @returns {HTMLElement} Heatmap region container element
 */
export function createHeatmap() {
  const container = h('div', {
    class: 'heatmap-container',
    id: 'ops-heatmap',
    role: 'region',
    'aria-label': 'Crowd density heatmap',
  },
    h('div', { class: 'heatmap-header' },
      h('h2', { class: 'heatmap-header__title flex items-center gap-2' },
        h('span', { 'aria-hidden': 'true' }, '🗺️'),
        'Live Crowd Density',
      ),
      h('div', { class: 'heatmap-legend' },
        createLegendItem('#22C55E', '0-40%'),
        createLegendItem('#EAB308', '40-75%'),
        createLegendItem('#F97316', '75-90%'),
        createLegendItem('#EF4444', '90%+'),
      ),
    ),
    createOpsStadiumSVG(),
    h('div', { id: 'heatmap-zone-detail', class: 'mt-3' }),
  );

  subscribe('crowdData', (data) => updateHeatmapZones(data));

  return container;
}

/**
 * Create a single legend item for the density scale indicator.
 *
 * @param {string} color - Hex background color
 * @param {string} label - Percentage range label text
 * @returns {HTMLElement} Legend item DOM element
 */
function createLegendItem(color, label) {
  return h('div', { class: 'heatmap-legend__item' },
    h('span', { class: 'heatmap-legend__color', style: { background: color } }),
    h('span', {}, label),
  );
}

/**
 * Create Ops-specific stadium SVG overlay with zones, gates, and text labels.
 *
 * @returns {HTMLElement} SVG wrapper container element
 */
function createOpsStadiumSVG() {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 500 440');
  svg.setAttribute('class', 'w-full h-auto');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Stadium heatmap with real-time crowd density');
  svg.id = 'ops-stadium-svg';

  // Background
  const bg = document.createElementNS(svgNS, 'rect');
  bg.setAttribute('width', '500');
  bg.setAttribute('height', '440');
  bg.setAttribute('fill', '#F8FAFC');
  bg.setAttribute('rx', '12');
  svg.appendChild(bg);

  // Stadium outline
  const outline = document.createElementNS(svgNS, 'ellipse');
  outline.setAttribute('cx', '250');
  outline.setAttribute('cy', '220');
  outline.setAttribute('rx', '220');
  outline.setAttribute('ry', '195');
  outline.setAttribute('fill', 'none');
  outline.setAttribute('stroke', '#CBD5E1');
  outline.setAttribute('stroke-width', '2');
  outline.setAttribute('stroke-dasharray', '8 4');
  svg.appendChild(outline);

  // Field
  const field = document.createElementNS(svgNS, 'rect');
  field.setAttribute('x', '165');
  field.setAttribute('y', '155');
  field.setAttribute('width', '170');
  field.setAttribute('height', '130');
  field.setAttribute('rx', '10');
  field.setAttribute('fill', '#D1FAE5');
  field.setAttribute('stroke', '#86EFAC');
  field.setAttribute('stroke-width', '1.5');
  svg.appendChild(field);

  // Field "⚽" label
  const fieldLabel = document.createElementNS(svgNS, 'text');
  fieldLabel.setAttribute('x', '250');
  fieldLabel.setAttribute('y', '225');
  fieldLabel.setAttribute('text-anchor', 'middle');
  fieldLabel.setAttribute('font-size', '28');
  fieldLabel.textContent = '⚽';
  svg.appendChild(fieldLabel);

  // Zone definitions for ops heatmap
  const zoneConfigs = [
    { id: 'gate_a', cx: 250, cy: 35, r: 22 },
    { id: 'gate_b', cx: 415, cy: 85, r: 22 },
    { id: 'gate_c', cx: 465, cy: 220, r: 22 },
    { id: 'gate_d', cx: 415, cy: 355, r: 22 },
    { id: 'gate_e', cx: 250, cy: 405, r: 22 },
    { id: 'gate_f', cx: 85, cy: 355, r: 22 },
    { id: 'gate_g', cx: 35, cy: 220, r: 22 },
    { id: 'gate_h', cx: 85, cy: 85, r: 22 },
    { id: 'section_100', shape: 'rect', x: 175, y: 90, w: 150, h: 50, rx: 8 },
    { id: 'section_200', shape: 'rect', x: 175, y: 300, w: 150, h: 50, rx: 8 },
    { id: 'section_300', shape: 'rect', x: 345, y: 165, w: 50, h: 130, rx: 8 },
    { id: 'section_400', shape: 'rect', x: 105, y: 165, w: 50, h: 130, rx: 8 },
    { id: 'concourse_n', shape: 'rect', x: 145, y: 60, w: 210, h: 20, rx: 10 },
    { id: 'concourse_s', shape: 'rect', x: 145, y: 360, w: 210, h: 20, rx: 10 },
    { id: 'food_court_e', shape: 'rect', x: 405, y: 195, w: 35, h: 50, rx: 8 },
    { id: 'food_court_w', shape: 'rect', x: 60, y: 195, w: 35, h: 50, rx: 8 },
  ];

  for (const z of zoneConfigs) {
    const zoneInfo = STADIUM_ZONES[z.id];
    const crowdInfo = state.crowdData?.[z.id];
    const density = crowdInfo?.density || 30;

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

    el.setAttribute('fill', getDensityFill(density));
    el.setAttribute('stroke', '#fff');
    el.setAttribute('stroke-width', '2');
    el.setAttribute('opacity', '0.85');
    el.setAttribute('class', 'zone cursor-pointer transition-all');
    el.setAttribute('data-ops-zone', z.id);
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', `${zoneInfo?.name}: ${density}%`);

    el.addEventListener('click', () => openZoneModal(z.id));
    svg.appendChild(el);

    // Zone label
    const lx = z.shape === 'rect' ? z.x + z.w / 2 : z.cx;
    const ly = z.shape === 'rect' ? z.y + z.h / 2 + 4 : z.cy + 5;
    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', lx);
    label.setAttribute('y', ly);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '11');
    label.setAttribute('font-weight', '700');
    label.setAttribute('fill', '#1E293B');
    label.setAttribute('pointer-events', 'none');
    label.setAttribute('data-ops-zone-label', z.id);
    label.textContent = `${density}%`;
    svg.appendChild(label);
  }

  const wrapper = h('div', { class: 'overflow-hidden rounded-lg border border-surface-200' });
  wrapper.appendChild(svg);
  return wrapper;
}

/**
 * Show detailed information card for a selected zone in Ops mode.
 *
 * @param {string} zoneId - Stadium zone identifier
 */
function showOpsZoneDetail(zoneId) {
  const detailContainer = $('#heatmap-zone-detail');
  if (!detailContainer) return;

  const zoneInfo = STADIUM_ZONES[zoneId];
  const crowdInfo = state.crowdData?.[zoneId];
  if (!zoneInfo) return;

  const density = crowdInfo?.density || 0;
  const trend = crowdInfo?.trend || 'stable';
  const count = crowdInfo?.count || 0;

  detailContainer.innerHTML = '';
  detailContainer.appendChild(
    h('div', { class: 'p-3 bg-surface-50 rounded-lg border border-surface-200 animate-fade-in' },
      h('div', { class: 'flex items-center justify-between mb-2' },
        h('h4', { class: 'text-sm font-bold flex items-center gap-1.5' },
          h('span', { 'aria-hidden': 'true' }, ZONE_ICONS[zoneInfo.type] || '📍'),
          zoneInfo.name,
        ),
        h('span', {
          class: `badge ${density >= 75 ? 'badge--danger' : density >= 50 ? 'badge--warning' : 'badge--success'}`,
        }, `${density}%`),
      ),
      h('div', { class: 'grid grid-cols-4 gap-3 text-center text-xs' },
        h('div', {},
          h('p', { class: 'text-slate-500' }, 'Count'),
          h('p', { class: 'font-bold text-base' }, String(count)),
        ),
        h('div', {},
          h('p', { class: 'text-slate-500' }, 'Capacity'),
          h('p', { class: 'font-bold text-base' }, String(zoneInfo.capacity)),
        ),
        h('div', {},
          h('p', { class: 'text-slate-500' }, 'Trend'),
          h('p', { class: 'font-bold text-base' },
            trend === 'rising' ? '📈' : trend === 'falling' ? '📉' : '➡️',
          ),
        ),
        h('div', {},
          h('p', { class: 'text-slate-500' }, 'Type'),
          h('p', { class: 'font-bold text-base' }, zoneInfo.type),
        ),
      ),
    )
  );

  announce(`${zoneInfo.name}: ${density}% density, trend ${trend}`);
}

/**
 * Update heatmap SVG zones and text labels when new live crowd data arrives.
 *
 * @param {Record<string, { zoneName: string, density: number }>} crowdData - Updated crowd dataset
 */
function updateHeatmapZones(crowdData) {
  if (!crowdData) return;
  for (const [zoneId, info] of Object.entries(crowdData)) {
    const el = $(`[data-ops-zone="${zoneId}"]`);
    const label = $(`[data-ops-zone-label="${zoneId}"]`);
    if (el) {
      el.setAttribute('fill', getDensityFill(info.density));
      el.setAttribute('aria-label', `${info.zoneName}: ${info.density}%`);
      el.setAttribute('opacity', info.density >= 90 ? '1' : '0.85');
    }
    if (label) {
      label.textContent = `${info.density}%`;
    }
  }
}
