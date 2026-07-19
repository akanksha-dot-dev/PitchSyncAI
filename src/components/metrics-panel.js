/**
 * @module metrics-panel
 * @description Four-KPI dashboard panel for Ops Command mode.
 *
 * Displays total occupancy, entry rate, active alert count, and
 * average wait time as animated metric cards with sparkline charts.
 * Subscribes to live crowd-data and alert-state updates.
 */

import { h, $, formatNumber } from '../utils/dom.js';
import state, { subscribe } from '../core/state.js';

// Sparkline historical dataset arrays
const historyData = {
  occupancy: [42, 48, 55, 62, 68, 72, 74],
  entryRate: [120, 145, 180, 210, 195, 160, 140],
  alerts: [1, 2, 1, 3, 2, 4, 2],
  waitTime: [12, 14, 18, 22, 19, 15, 13],
};

/**
 * Create the metrics panel component containing 4 KPI cards.
 *
 * @returns {HTMLElement} Metrics panel DOM element
 */
export function createMetricsPanel() {
  const panel = h('div', {
    class: 'metrics-row',
    id: 'metrics-panel',
    role: 'region',
    'aria-label': 'Key performance indicators',
  },
    createMetricCard('total-occupancy', 'Total Occupancy', '—', '%', 'blue', '🏟️'),
    createMetricCard('entry-rate', 'Entry Rate', '—', '/min', 'green', '🚪'),
    createMetricCard('active-alerts', 'Active Alerts', '0', '', 'amber', '⚠️'),
    createMetricCard('avg-wait', 'Avg Wait Time', '—', 'min', 'red', '⏱️'),
  );

  // Subscribe to crowd data for live updates
  subscribe('crowdData', (data) => updateMetrics(data));
  subscribe('opsAlerts', (alerts) => updateAlertCount(alerts));

  // Initial metric simulation
  setTimeout(() => simulateMetrics(), 500);

  return panel;
}

/**
 * Create a single KPI metric card DOM element.
 *
 * @param {string} id - Card identifier suffix
 * @param {string} label - Card title label
 * @param {string} value - Display value
 * @param {string} unit - Measurement unit
 * @param {'blue'|'green'|'amber'|'red'} color - Accent color theme
 * @param {string} icon - Emoji icon
 * @returns {HTMLElement} Metric card element
 */
function createMetricCard(id, label, value, unit, color, icon) {
  return h('div', {
    class: `metric-card metric-card--${color}`,
    id: `metric-${id}`,
    role: 'status',
    'aria-label': `${label}: ${value}${unit}`,
  },
    h('div', { class: 'flex items-center justify-between' },
      h('div', {},
        h('p', { class: 'metric-card__label' }, label),
        h('div', { class: 'flex items-baseline gap-1' },
          h('span', {
            class: 'metric-card__value',
            id: `metric-value-${id}`,
          }, value),
          h('span', { class: 'text-sm text-slate-500 font-medium' }, unit),
        ),
        h('div', {
          class: 'metric-card__trend metric-card__trend--stable',
          id: `metric-trend-${id}`,
        }, '→ Stable'),
      ),
      h('div', { class: 'text-2xl opacity-30', 'aria-hidden': 'true' }, icon),
    ),
    h('div', {
      class: 'metric-card__sparkline',
      id: `sparkline-${id}`,
    }),
  );
}

/**
 * Draw an inline SVG sparkline chart inside a target container.
 *
 * @param {string} containerId - Target container element ID
 * @param {number[]} data - Array of numeric data points
 * @param {string} color - Hex line color
 */
function drawSparkline(containerId, data, _color) {
  const container = $(`#${containerId}`);
  if (!container) return;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 100 30');
  svg.setAttribute('class', 'w-full h-full');
  svg.setAttribute('aria-hidden', 'true');

  if (data.length < 2) return;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 28 - ((v - min) / range) * 26;
    return `${x},${y}`;
  });

  // Area fill
  const area = document.createElementNS(svgNS, 'polygon');
  area.setAttribute('points', `0,30 ${points.join(' ')} 100,30`);
  area.setAttribute('fill', color);
  area.setAttribute('opacity', '0.1');
  svg.appendChild(area);

  // Line stroke
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
 * Update metric cards based on live crowd dataset changes.
 *
 * @param {Record<string, { density: number, count: number }>} crowdData - Updated crowd state
 */
function updateMetrics(crowdData) {
  if (!crowdData) return;

  const zones = Object.values(crowdData);
  if (zones.length === 0) return;

  // Calculate average density
  const totalDensity = zones.reduce((sum, z) => sum + z.density, 0);
  const avgDensity = Math.round(totalDensity / zones.length);

  // Update occupancy
  updateMetricValue('total-occupancy', String(avgDensity), avgDensity > 70 ? '↑ +3%' : '→ Stable', '#3B82F6');
  historyData.occupancy.shift();
  historyData.occupancy.push(avgDensity);
  drawSparkline('sparkline-total-occupancy', historyData.occupancy, '#3B82F6');

  // Entry rate calculation
  const totalCount = zones.reduce((sum, z) => sum + (z.count || 0), 0);
  const entryRate = Math.round(totalCount / 40);
  updateMetricValue('entry-rate', formatNumber(entryRate), entryRate > 150 ? '↑ High' : '→ Normal', '#22C55E');
  historyData.entryRate.shift();
  historyData.entryRate.push(entryRate);
  drawSparkline('sparkline-entry-rate', historyData.entryRate, '#22C55E');

  // Avg wait time calculation
  const avgWait = Math.max(3, Math.round((avgDensity / 100) * 25));
  updateMetricValue('avg-wait', `${avgWait}`, avgWait > 15 ? '↑ Long' : '↓ Low', '#EF4444');
  historyData.waitTime.shift();
  historyData.waitTime.push(avgWait);
  drawSparkline('sparkline-avg-wait', historyData.waitTime, '#EF4444');
}

/**
 * Update active alert count card and sparkline.
 *
 * @param {Array<{ resolved: boolean }>} alerts - Active alerts list
 */
function updateAlertCount(alerts) {
  const active = (alerts || []).filter(a => !a.resolved).length;
  updateMetricValue('active-alerts', String(active), active > 2 ? '↑ High' : '✓ Normal', '#F59E0B');
  historyData.alerts.shift();
  historyData.alerts.push(active);
  drawSparkline('sparkline-active-alerts', historyData.alerts, '#F59E0B');
}

/**
 * Update a specific metric card's text, trend indicator, and ARIA label.
 *
 * @param {string} id - Metric card identifier
 * @param {string} val - New value text
 * @param {string} trend - Trend string
 * @param {string} color - Sparkline color
 */
function updateMetricValue(id, val, trend, color) {
  const valEl = $(`#metric-value-${id}`);
  const trendEl = $(`#metric-trend-${id}`);
  if (valEl) valEl.textContent = val;
  if (trendEl) {
    trendEl.textContent = trend;
    trendEl.className = `metric-card__trend ${
      trend.startsWith('↑') ? 'metric-card__trend--up' :
      trend.startsWith('↓') ? 'metric-card__trend--down' : 'metric-card__trend--stable'
    }`;
  }
}

/**
 * Initial metric dataset simulation bootloader.
 */
function simulateMetrics() {
  drawSparkline('sparkline-total-occupancy', historyData.occupancy, '#3B82F6');
  drawSparkline('sparkline-entry-rate', historyData.entryRate, '#22C55E');
  drawSparkline('sparkline-active-alerts', historyData.alerts, '#F59E0B');
  drawSparkline('sparkline-avg-wait', historyData.waitTime, '#EF4444');

  updateMetrics(state.crowdData);
  updateAlertCount(state.opsAlerts);
}
