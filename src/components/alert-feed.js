/**
 * @module alert-feed
 * @description AI-generated operational alert feed for Ops Command mode.
 *
 * Subscribes to the Firebase alert simulation and renders severity-coded
 * alert cards with acknowledge / resolve / reroute actions.
 * ARIA live-region announcements ensure screen-reader accessibility.
 */

import { h, $, formatTime } from '../utils/dom.js';
import { announce } from '../utils/a11y.js';
import state from '../core/state.js';
import { subscribeToAlerts } from '../services/firebase.js';
import { emit } from '../core/events.js';
import { STADIUM_ZONES } from '../utils/constants.js';

let unsubAlerts = null;

/**
 * Create the alert feed component
 * @returns {HTMLElement}
 */
export function createAlertFeed() {
  const feed = h('div', {
    class: 'alert-feed',
    id: 'alert-feed',
    role: 'region',
    'aria-label': 'Operational alerts',
  },
    h('div', { class: 'alert-feed__header' },
      h('h3', { class: 'alert-feed__title' },
        h('span', { 'aria-hidden': 'true' }, '🔔'),
        'AI Alerts',
        h('span', {
          id: 'alert-count-badge',
          class: 'badge badge--danger ml-2',
          'aria-label': '0 unresolved alerts',
        }, '0'),
      ),
      h('button', {
        class: 'btn btn--ghost btn--sm',
        'aria-label': 'Clear resolved alerts',
        onClick: clearResolvedAlerts,
      }, 'Clear'),
    ),
    h('div', {
      class: 'alert-feed__list',
      id: 'alert-feed-list',
      role: 'list',
      'aria-live': 'polite',
    }),
  );

  // Subscribe to Firebase alerts
  unsubAlerts = subscribeToAlerts(handleNewAlert);

  return feed;
}

/**
 * Handle a new alert from Firebase
 */
function handleNewAlert(alert) {
  // Add to state
  state.opsAlerts = [...(state.opsAlerts || []), alert];

  // Render the alert
  renderAlert(alert);

  // Update count
  updateAlertCount();

  // Announce for screen readers
  const severity = alert.severity === 'critical' ? 'Critical' : alert.severity === 'warning' ? 'Warning' : 'Info';
  announce(`${severity} alert: ${alert.message}`, alert.severity === 'critical' ? 'assertive' : 'polite');
}

/**
 * Get CSS badge class for a given severity.
 * @param {string} severity
 * @returns {string}
 */
function getSeverityBadgeClass(severity) {
  const map = { critical: 'danger', warning: 'warning', info: 'info' };
  return `badge badge--${map[severity] || 'info'}`;
}

/**
 * Get human-readable label for a given severity.
 * @param {string} severity
 * @returns {string}
 */
function getSeverityLabel(severity) {
  const map = { critical: 'Critical', warning: 'Warning', info: 'Info' };
  return map[severity] || 'Info';
}

/**
 * Render a single alert item
 */
function renderAlert(alert) {
  const list = $('#alert-feed-list');
  if (!list) return;

  const zoneInfo = STADIUM_ZONES[alert.zone];
  const zoneName = zoneInfo?.name || alert.zone;

  const item = h('div', {
    class: 'alert-item',
    id: `alert-${alert.id}`,
    role: 'listitem',
    'aria-label': `${getSeverityLabel(alert.severity)} alert for ${zoneName}: ${alert.message}`,
  },
    h('div', { class: `alert-item__indicator alert-item__indicator--${alert.severity}` }),
    h('div', { class: 'alert-item__content' },
      h('div', { class: 'flex items-center gap-2' },
        h('span', { class: 'alert-item__zone' }, zoneName),
        h('span', {
          class: getSeverityBadgeClass(alert.severity),
        }, alert.severity),
      ),
      h('p', { class: 'alert-item__message' }, alert.message),
      alert.action ? h('p', { class: 'text-xs text-fifa-blue font-medium mt-1' }, `💡 ${alert.action}`) : null,
      h('p', { class: 'alert-item__time' }, formatTime(alert.timestamp)),
      h('div', { class: 'alert-item__actions' },
        !alert.acknowledged
          ? h('button', {
              class: 'btn btn--secondary btn--sm',
              onClick: () => acknowledgeAlert(alert.id),
              'aria-label': `Acknowledge alert for ${zoneName}`,
            }, '✓ Ack')
          : h('span', { class: 'text-xs text-green-600 font-medium' }, '✓ Acknowledged'),
        !alert.resolved
          ? h('button', {
              class: 'btn btn--primary btn--sm',
              onClick: () => resolveAlert(alert.id),
              'aria-label': `Resolve alert for ${zoneName}`,
            }, 'Resolve')
          : null,
        alert.severity !== 'info'
          ? h('button', {
              class: 'btn btn--ghost btn--sm',
              onClick: () => {
                state.wizardOpen = true;
                state.wizardData = { alert, zone: alert.zone };
                emit('wizard:open', { alert, zone: alert.zone });
              },
              'aria-label': 'Validate reroute for this alert',
            }, '🔀 Reroute')
          : null,
      ),
    ),
  );

  // Prepend (newest first)
  list.insertBefore(item, list.firstChild);

  // Keep max 20 visible alerts
  while (list.children.length > 20) {
    list.removeChild(list.lastChild);
  }
}

/**
 * Acknowledge an alert
 */
function acknowledgeAlert(alertId) {
  state.opsAlerts = (state.opsAlerts || []).map(a =>
    a.id === alertId ? { ...a, acknowledged: true } : a
  );

  const item = $(`#alert-${alertId}`);
  if (item) {
    const ackBtns = Array.from(item.querySelectorAll('.btn--secondary'));
    ackBtns.forEach(btn => {
      const badge = h('span', { class: 'text-xs text-green-600 font-medium' }, '✓ Acknowledged');
      btn.replaceWith(badge);
    });
  }

  announce('Alert acknowledged');
}

/**
 * Resolve an alert
 */
function resolveAlert(alertId) {
  state.opsAlerts = (state.opsAlerts || []).map(a =>
    a.id === alertId ? { ...a, resolved: true, acknowledged: true } : a
  );

  const item = $(`#alert-${alertId}`);
  if (item) {
    item.style.opacity = '0.5';
    item.querySelector('.alert-item__indicator')?.classList.add('opacity-30');
  }

  updateAlertCount();
  announce('Alert resolved');
}

/**
 * Clear resolved alerts from the feed
 */
function clearResolvedAlerts() {
  state.opsAlerts = (state.opsAlerts || []).filter(a => !a.resolved);
  const list = $('#alert-feed-list');
  if (!list) return;

  const resolved = list.querySelectorAll('.alert-item');
  resolved.forEach(item => {
    if (item.style.opacity === '0.5') {
      item.remove();
    }
  });

  updateAlertCount();
  announce('Resolved alerts cleared');
}

/**
 * Update the alert count badge
 */
function updateAlertCount() {
  const badge = $('#alert-count-badge');
  if (!badge) return;

  const unresolvedCount = (state.opsAlerts || []).filter(a => !a.resolved).length;
  badge.textContent = String(unresolvedCount);
  badge.setAttribute('aria-label', `${unresolvedCount} unresolved alerts`);
}

/**
 * Cleanup
 */
export function destroyAlertFeed() {
  if (unsubAlerts) {
    unsubAlerts();
    unsubAlerts = null;
  }
}

