/**
 * @module toast-manager
 * @description Global push notification toast system for PitchSync AI.
 *
 * Renders non-intrusive toast notifications in the top-right corner when:
 * - A stadium zone exceeds critical density (crowd alert)
 * - A new transit alert fires (missed connection)
 * - An SOS staff alert is confirmed
 * - A match event occurs (goal, half-time, full-time)
 *
 * Toasts auto-dismiss after 5 seconds with an animated progress bar.
 * A manual close button is always available.
 * ARIA live region with `aria-live="assertive"` for screen-reader support.
 */

import { h, $, uid } from '../utils/dom.js';
import { on } from '../core/events.js';
import { subscribe } from '../core/state.js';
import { DENSITY_CRITICAL_THRESHOLD } from '../utils/constants.js';

const TOAST_DURATION = 5000; // ms
const MAX_TOASTS = 4;

/** Track which zones have already been toasted to prevent spam. */
const toastedZones = new Set();

/**
 * Initialize the toast manager — creates the container and wires event listeners.
 * Must be called once during app init.
 */
export function initToastManager() {
  // Create global toast container if it doesn't exist
  if ($('#toast-container')) return;

  const container = h('div', {
    id: 'toast-container',
    class: 'toast-container',
    role: 'region',
    'aria-label': 'Notifications',
    'aria-live': 'assertive',
    'aria-atomic': 'false',
  });
  document.body.appendChild(container);

  // Wire event listeners
  _listenForCrowdAlerts();
  _listenForMatchEvents();
  _listenForSosEvents();
}

/* ---- Private listeners ---- */

function _listenForCrowdAlerts() {
  subscribe('crowdData', (crowdData) => {
    if (!crowdData) return;
    for (const [zoneId, info] of Object.entries(crowdData)) {
      if (info.density >= DENSITY_CRITICAL_THRESHOLD && !toastedZones.has(zoneId)) {
        toastedZones.add(zoneId);
        showToast({
          type: 'danger',
          icon: '🔴',
          title: 'Zone Critical',
          message: `${info.zoneName || zoneId} has reached ${info.density}% capacity.`,
        });
        // Allow re-toast after 60 seconds
        setTimeout(() => toastedZones.delete(zoneId), 60000);
      }
    }
  });
}

function _listenForMatchEvents() {
  on('match:goal', ({ teamName, player, minute }) => {
    showToast({
      type: 'success',
      icon: '⚽',
      title: 'GOAL!',
      message: `${player} scores for ${teamName} in minute ${minute}!`,
    });
  });

  on('match:halftime', () => {
    showToast({
      type: 'info',
      icon: '⏸',
      title: 'Half Time',
      message: 'Great time to grab food or visit facilities!',
    });
  });

  on('match:fulltime', ({ homeScore, awayScore }) => {
    showToast({
      type: 'info',
      icon: '✅',
      title: 'Full Time',
      message: `Final: USA ${homeScore} – ${awayScore} Brazil. Safe travels home!`,
      duration: 8000,
    });
  });
}

function _listenForSosEvents() {
  on('sos:alert', () => {
    showToast({
      type: 'danger',
      icon: '🆘',
      title: 'SOS Alert Sent',
      message: 'Stadium staff have been notified and are on their way.',
      duration: 7000,
    });
  });
}

/* ---- Public API ---- */

/**
 * Show a toast notification.
 *
 * @param {{ type?: 'info'|'success'|'warning'|'danger', icon?: string, title: string, message: string, duration?: number }} options
 */
export function showToast({ type = 'info', icon = 'ℹ️', title, message, duration = TOAST_DURATION }) {
  const container = $('#toast-container');
  if (!container) return;

  // Enforce max visible toasts
  const existing = container.querySelectorAll('.toast');
  if (existing.length >= MAX_TOASTS) {
    const oldest = existing[0];
    _dismissToast(oldest);
  }

  const toastId = uid('toast');
  let dismissTimer = null;
  let progressInterval = null;

  const progressBar = h('div', {
    class: 'toast__progress',
    id: `${toastId}-progress`,
    role: 'progressbar',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    'aria-valuenow': '100',
  });

  const toast = h('div', {
    id: toastId,
    class: `toast toast--${type}`,
    role: 'alert',
    'aria-label': `${title}: ${message}`,
  },
    h('div', { class: 'toast__body' },
      h('div', { class: 'toast__icon', 'aria-hidden': 'true' }, icon),
      h('div', { class: 'toast__content' },
        h('p', { class: 'toast__title' }, title),
        h('p', { class: 'toast__message' }, message),
      ),
      h('button', {
        class: 'toast__close',
        'aria-label': 'Dismiss notification',
        onClick: () => _dismissToast(toast),
      }, '✕'),
    ),
    progressBar,
  );

  container.appendChild(toast);

  // Trigger entrance animation on next frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('toast--visible'));
  });

  // Animate progress bar
  let elapsed = 0;
  const step = 100;
  progressInterval = setInterval(() => {
    elapsed += step;
    const pct = Math.max(0, 100 - (elapsed / duration) * 100);
    progressBar.style.width = `${pct}%`;
    progressBar.setAttribute('aria-valuenow', String(Math.round(pct)));
    if (elapsed >= duration) clearInterval(progressInterval);
  }, step);

  // Auto-dismiss
  dismissTimer = setTimeout(() => {
    clearInterval(progressInterval);
    _dismissToast(toast);
  }, duration);

  // Store timers on element for cleanup
  toast._dismissTimer = dismissTimer;
  toast._progressInterval = progressInterval;
}

/**
 * Dismiss a toast with slide-out animation.
 * @param {HTMLElement} toast
 */
function _dismissToast(toast) {
  if (!toast || toast._dismissed) return;
  toast._dismissed = true;

  // Clear timers
  if (toast._dismissTimer) clearTimeout(toast._dismissTimer);
  if (toast._progressInterval) clearInterval(toast._progressInterval);

  toast.classList.remove('toast--visible');
  toast.classList.add('toast--hiding');

  setTimeout(() => toast.remove(), 350);
}
