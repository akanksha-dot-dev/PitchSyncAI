/**
 * @module activity-log
 * @description Live Activity Log / Event Timeline for Ops Command mode.
 *
 * Provides a chronological, scrollable log of all significant ops events:
 * - Crowd density threshold crossings (warning / critical)
 * - Alert creation, acknowledgement, and resolution
 * - Staff resource rebalances
 * - Wizard step completions
 *
 * Events are captured by listening to the event bus and state changes.
 * The log is filterable by event type (All | Alerts | Crowd | Resources).
 */

import { h, $, formatTime, uid } from '../utils/dom.js';
import { announce } from '../utils/a11y.js';
import state, { subscribe } from '../core/state.js';
import { on } from '../core/events.js';
import { DENSITY_WARNING_THRESHOLD, DENSITY_CRITICAL_THRESHOLD } from '../utils/constants.js';

/** @type {string} */
let activeFilter = 'all';

/** @type {Set<string>} */
const seenAlerts = new Set();

/** @type {number | null} */
let prevAvgDensity = null;

/**
 * Create the Activity Log panel for Ops Command mode.
 * @returns {HTMLElement}
 */
export function createActivityLog() {
  const panel = h('div', {
    class: 'activity-log card',
    id: 'activity-log',
    role: 'region',
    'aria-label': 'Live activity log',
  },
    // Header
    h('div', { class: 'activity-log__header' },
      h('h3', { class: 'text-sm font-bold text-slate-800 flex items-center gap-2' },
        h('span', { 'aria-hidden': 'true' }, '\uD83D\uDCCB'),
        'Activity Log',
        h('span', { class: 'activity-log__live-dot', 'aria-hidden': 'true' }),
      ),
      h('button', {
        class: 'btn btn--ghost btn--sm',
        'aria-label': 'Clear activity log',
        onClick: clearLog,
      }, 'Clear'),
    ),

    // Filter tabs
    h('div', { class: 'activity-log__filters', role: 'tablist', 'aria-label': 'Filter activity log' },
      createFilterBtn('all', 'All'),
      createFilterBtn('alert', '\u26A0\uFE0F Alerts'),
      createFilterBtn('crowd', '\uD83D\uDC65 Crowd'),
      createFilterBtn('resource', '\uD83D\uDC65 Resources'),
    ),

    // Log entries
    h('div', {
      class: 'activity-log__list',
      id: 'activity-log-list',
      role: 'log',
      'aria-live': 'polite',
      'aria-label': 'Activity log entries',
    }),

    // Empty state placeholder
    h('div', { id: 'activity-log-empty', class: 'activity-log__empty' },
      h('span', { 'aria-hidden': 'true' }, '\uD83D\uDCC4'),
      h('p', {}, 'Events will appear here as they happen'),
    ),
  );

  // Seed a startup log entry
  setTimeout(() => {
    addLogEntry({
      type: 'system',
      message: 'Ops Command mode activated. Monitoring all zones.',
      severity: 'info',
    });
  }, 500);

  // Listen for new alerts
  on('alert:new', (alert) => {
    if (!alert || seenAlerts.has(alert.id)) return;
    seenAlerts.add(alert.id);
    addLogEntry({
      type: 'alert',
      message: `\u26A0\uFE0F [${alert.severity.toUpperCase()}] ${alert.message}`,
      severity: alert.severity,
      zone: alert.zone,
    });
  });

  // Listen for SOS alert
  on('sos:alert', () => {
    addLogEntry({
      type: 'alert',
      message: '\uD83C\uDD98 FAN SOS: Emergency assistance requested by a fan.',
      severity: 'critical',
    });
  });

  // Listen for wizard completions
  on('wizard:complete', (data) => {
    addLogEntry({
      type: 'resource',
      message: `\uD83D\uDD00 Reroute validated for zone ${data?.zone || 'unknown'} — ${data?.result || 'Pending'}`,
      severity: 'info',
    });
  });

  // Monitor crowd data for threshold crossings
  subscribe('crowdData', (crowdData) => checkCrowdThresholds(crowdData));

  // Monitor resource changes
  subscribe('resources', () => {
    addLogEntry({
      type: 'resource',
      message: '\uD83D\uDC65 Staff resources rebalanced based on crowd density.',
      severity: 'info',
    });
  });

  // Monitor opsAlerts for acknowledgements / resolutions
  subscribe('opsAlerts', (alerts) => {
    if (!alerts) return;
    for (const alert of alerts) {
      const ackKey = `ack-${alert.id}`;
      const resKey = `res-${alert.id}`;
      if (alert.acknowledged && !seenAlerts.has(ackKey)) {
        seenAlerts.add(ackKey);
        addLogEntry({
          type: 'alert',
          message: `\u2713 Alert acknowledged: ${alert.message.slice(0, 60)}...`,
          severity: 'info',
        });
      }
      if (alert.resolved && !seenAlerts.has(resKey)) {
        seenAlerts.add(resKey);
        addLogEntry({
          type: 'alert',
          message: `\u2705 Alert resolved: ${alert.message.slice(0, 60)}...`,
          severity: 'info',
        });
      }
    }
  });

  return panel;
}

/**
 * Create a filter tab button.
 * @param {string} filter
 * @param {string} label
 * @returns {HTMLElement}
 */
function createFilterBtn(filter, label) {
  return h('button', {
    class: `activity-log__filter-btn${activeFilter === filter ? ' activity-log__filter-btn--active' : ''}`,
    id: `log-filter-${filter}`,
    role: 'tab',
    'aria-selected': activeFilter === filter ? 'true' : 'false',
    onClick: () => setFilter(filter),
  }, label);
}

/**
 * Switch the active filter and re-render entries.
 * @param {string} filter
 */
function setFilter(filter) {
  activeFilter = filter;

  // Update button states
  ['all', 'alert', 'crowd', 'resource'].forEach(f => {
    const btn = $(`#log-filter-${f}`);
    if (btn) {
      const isActive = f === filter;
      btn.className = `activity-log__filter-btn${isActive ? ' activity-log__filter-btn--active' : ''}`;
      btn.setAttribute('aria-selected', String(isActive));
    }
  });

  // Show/hide entries
  const list = $('#activity-log-list');
  if (!list) return;
  const entries = list.querySelectorAll('.log-entry');
  entries.forEach(entry => {
    const entryType = entry.getAttribute('data-type');
    entry.style.display = (filter === 'all' || entryType === filter) ? 'flex' : 'none';
  });
}

/**
 * Add a new log entry to the feed.
 * @param {{ type: string, message: string, severity: string, zone?: string }} entry
 */
export function addLogEntry({ type, message, severity = 'info', zone }) {
  const list = $('#activity-log-list');
  const empty = $('#activity-log-empty');
  if (!list) return;

  if (empty) empty.style.display = 'none';

  const severityColors = {
    critical: '#EF4444',
    warning: '#F59E0B',
    info: '#0EA5E9',
    success: '#22C55E',
  };
  const color = severityColors[severity] || severityColors.info;

  const el = h('div', {
    class: 'log-entry',
    'data-type': type,
    style: { display: (activeFilter === 'all' || activeFilter === type) ? 'flex' : 'none' },
  },
    h('div', { class: 'log-entry__dot', style: { background: color } }),
    h('div', { class: 'log-entry__content' },
      h('p', { class: 'log-entry__message' }, message),
      h('p', { class: 'log-entry__time' }, formatTime(Date.now())),
    ),
  );

  // Newest first
  list.insertBefore(el, list.firstChild);

  // Keep max 50 entries
  while (list.children.length > 50) {
    list.removeChild(list.lastChild);
  }

  // Update state
  const entry = { id: uid('log'), type, message, severity, timestamp: Date.now(), zone };
  state.activityLog = [entry, ...(state.activityLog || []).slice(0, 49)];
}

/**
 * Check crowd data for density threshold crossings and log events.
 * @param {object} crowdData
 */
function checkCrowdThresholds(crowdData) {
  if (!crowdData) return;

  const zones = Object.values(crowdData);
  const avgDensity = Math.round(zones.reduce((s, z) => s + z.density, 0) / zones.length);

  // Detect individual critical zone crossings
  for (const zone of zones) {
    const key = `crowd-critical-${zone.zoneId}`;
    if (zone.density >= DENSITY_CRITICAL_THRESHOLD && !seenAlerts.has(key)) {
      seenAlerts.add(key);
      addLogEntry({
        type: 'crowd',
        message: `\uD83D\uDD34 CRITICAL: ${zone.zoneName} reached ${zone.density}% density.`,
        severity: 'critical',
        zone: zone.zoneId,
      });
      // Auto-clear after 30s so it can re-trigger
      setTimeout(() => seenAlerts.delete(key), 30000);
    } else if (zone.density >= DENSITY_WARNING_THRESHOLD && !seenAlerts.has(`crowd-warn-${zone.zoneId}`)) {
      const warnKey = `crowd-warn-${zone.zoneId}`;
      seenAlerts.add(warnKey);
      addLogEntry({
        type: 'crowd',
        message: `\uD83D\uDFE1 WARNING: ${zone.zoneName} at ${zone.density}% — approaching threshold.`,
        severity: 'warning',
        zone: zone.zoneId,
      });
      setTimeout(() => seenAlerts.delete(warnKey), 30000);
    }
  }

  prevAvgDensity = avgDensity;
}

/**
 * Clear the activity log.
 */
function clearLog() {
  const list = $('#activity-log-list');
  const empty = $('#activity-log-empty');
  if (list) list.innerHTML = '';
  if (empty) empty.style.display = 'flex';
  state.activityLog = [];
  seenAlerts.clear();
  prevAvgDensity = null;
  announce('Activity log cleared');
}
