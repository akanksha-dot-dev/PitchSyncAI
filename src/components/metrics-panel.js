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

/**
 * Create the metrics panel (4 KPI cards)
 * @returns {HTMLElement}
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
 * Create a single metric card
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
 * Draw a mini sparkline in a container
 */
function drawSparkline(containerId, data, color) {
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
  area.setAttribute('points', `0,28 ${points.join(' ')} 100,28`);
  area.setAttribute('fill', color);
  area.setAttribute('opacity', '0.1');
  svg.appendChild(area);

  // Line
  const line = document.createElementNS(svgNS, 'polyline');
  line.setAttribute('points', points.join(' '));
  line.setAttribute('fill', 'none');
  line.setAttribute('stroke', color);
  line.setAttribute('stroke-width', '1.5');
  line.setAttribute('stroke-linecap', 'round');
  line.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(line);

  // Latest point dot
  const lastPoint = points[points.length - 1].split(',');
  const dot = document.createElementNS(svgNS, 'circle');
  dot.setAttribute('cx', lastPoint[0]);
  dot.setAttribute('cy', lastPoint[1]);
  dot.setAttribute('r', '2.5');
  dot.setAttribute('fill', color);
  svg.appendChild(dot);

  container.innerHTML = '';
  container.appendChild(svg);
}

// Store historical data for sparklines
const metricHistory = {
  occupancy: [],
  entryRate: [],
  alerts: [],
  waitTime: [],
};

/**
 * Update metrics from crowd data
 */
function updateMetrics(crowdData) {
  if (!crowdData || Object.keys(crowdData).length === 0) return;

  // Calculate total occupancy
  let totalCount = 0;
  let totalCapacity = 0;
  for (const info of Object.values(crowdData)) {
    totalCount += info.count || 0;
    totalCapacity += info.capacity || 0;
  }
  const occupancy = totalCapacity > 0 ? Math.round((totalCount / totalCapacity) * 100) : 0;

  // Entry rate (simulated)
  const entryRate = Math.floor(150 + Math.random() * 100);

  // Avg wait time
  const waitTime = Math.round(2 + Math.random() * 6);

  // Update values
  updateMetricValue('total-occupancy', occupancy, '%');
  updateMetricValue('entry-rate', entryRate, '/min');
  updateMetricValue('avg-wait', waitTime, 'min');

  // Track history
  metricHistory.occupancy.push(occupancy);
  metricHistory.entryRate.push(entryRate);
  metricHistory.waitTime.push(waitTime);

  // Keep last 20 points
  for (const key of Object.keys(metricHistory)) {
    if (metricHistory[key].length > 20) metricHistory[key].shift();
  }

  // Update sparklines
  drawSparkline('sparkline-total-occupancy', metricHistory.occupancy, '#1D4ED8');
  drawSparkline('sparkline-entry-rate', metricHistory.entryRate, '#16A34A');
  drawSparkline('sparkline-avg-wait', metricHistory.waitTime, '#DC2626');

  // Update trends
  updateTrend('total-occupancy', metricHistory.occupancy);
  updateTrend('entry-rate', metricHistory.entryRate);
  updateTrend('avg-wait', metricHistory.waitTime);
}

/**
 * Update a single metric value
 */
function updateMetricValue(id, value, unit) {
  const el = $(`#metric-value-${id}`);
  if (el) el.textContent = formatNumber(value);

  const card = $(`#metric-${id}`);
  if (card) card.setAttribute('aria-label', `${id.replace(/-/g, ' ')}: ${value}${unit}`);
}

/**
 * Update alert count
 */
function updateAlertCount(alerts) {
  const count = (alerts || []).filter(a => !a.resolved).length;
  updateMetricValue('active-alerts', count, '');

  metricHistory.alerts.push(count);
  if (metricHistory.alerts.length > 20) metricHistory.alerts.shift();
  drawSparkline('sparkline-active-alerts', metricHistory.alerts, '#EAB308');
}

/**
 * Calculate and display trend
 */
function updateTrend(id, history) {
  if (history.length < 3) return;
  const trendEl = $(`#metric-trend-${id}`);
  if (!trendEl) return;

  const recent = history[history.length - 1];
  const prev = history[history.length - 3];
  const diff = recent - prev;

  if (diff > 2) {
    trendEl.textContent = `↑ +${Math.abs(Math.round(diff))}`;
    trendEl.className = 'metric-card__trend metric-card__trend--up';
  } else if (diff < -2) {
    trendEl.textContent = `↓ -${Math.abs(Math.round(diff))}`;
    trendEl.className = 'metric-card__trend metric-card__trend--down';
  } else {
    trendEl.textContent = '→ Stable';
    trendEl.className = 'metric-card__trend metric-card__trend--stable';
  }
}

/**
 * Simulate initial metrics
 */
function simulateMetrics() {
  // Generate some initial sparkline data
  for (let i = 0; i < 10; i++) {
    metricHistory.occupancy.push(55 + Math.floor(Math.random() * 20));
    metricHistory.entryRate.push(150 + Math.floor(Math.random() * 100));
    metricHistory.alerts.push(Math.floor(Math.random() * 5));
    metricHistory.waitTime.push(2 + Math.floor(Math.random() * 6));
  }
  drawSparkline('sparkline-total-occupancy', metricHistory.occupancy, '#1D4ED8');
  drawSparkline('sparkline-entry-rate', metricHistory.entryRate, '#16A34A');
  drawSparkline('sparkline-active-alerts', metricHistory.alerts, '#EAB308');
  drawSparkline('sparkline-avg-wait', metricHistory.waitTime, '#DC2626');
}

