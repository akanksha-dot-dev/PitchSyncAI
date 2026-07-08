/* ============================================================
   FIFA MatchDay GenAI Nexus — Transit Card Component
   Dynamic transit schedule display cards
   ============================================================ */

import { h, $, formatTime } from '../utils/dom.js';
import { announce } from '../utils/a11y.js';
import state, { subscribe } from '../core/state.js';
import { getSchedule, getDepartureCountdown, getTransitMode } from '../services/transit.js';
import { TRANSIT_MODES } from '../utils/constants.js';

let countdownTimer = null;

/**
 * Create the transit schedules panel
 * @returns {HTMLElement}
 */
export function createTransitPanel() {
  const panel = h('div', {
    class: 'card',
    id: 'transit-panel',
    role: 'region',
    'aria-label': 'Transit schedules',
  },
    h('div', { class: 'flex items-center justify-between mb-3' },
      h('h3', { class: 'text-sm font-bold text-slate-800 flex items-center gap-2' },
        h('span', { 'aria-hidden': 'true' }, '🚇'),
        'Transit Departures',
      ),
      h('button', {
        class: 'btn btn--ghost btn--sm',
        'aria-label': 'Refresh transit schedules',
        onClick: () => refreshTransit(),
      }, '↻'),
    ),
    h('div', { id: 'transit-list', class: 'space-y-2' }),
  );

  // Initial render
  setTimeout(() => refreshTransit(), 100);

  // Auto-refresh every 60 seconds
  countdownTimer = setInterval(() => updateCountdowns(), 15000);

  return panel;
}

/**
 * Refresh transit schedules
 */
function refreshTransit() {
  const list = $('#transit-list');
  if (!list) return;

  const schedules = getSchedule();
  state.transitSchedules = schedules;

  list.innerHTML = '';

  const upcoming = schedules.slice(0, 6);

  if (upcoming.length === 0) {
    list.appendChild(
      h('div', { class: 'empty-state py-6' },
        h('span', { class: 'empty-state__icon' }, '🚌'),
        h('p', { class: 'empty-state__title' }, 'No upcoming departures'),
      )
    );
    return;
  }

  for (const schedule of upcoming) {
    list.appendChild(createTransitCard(schedule));
  }
}

/**
 * Create a single transit card
 * @param {object} schedule
 * @returns {HTMLElement}
 */
function createTransitCard(schedule) {
  const countdown = getDepartureCountdown(schedule.departure);
  const modeInfo = getTransitMode(schedule.mode);

  const card = h('div', {
    class: 'flex items-center gap-3 p-2.5 rounded-lg border border-surface-200 hover:border-surface-300 hover:bg-surface-50 transition-all duration-200',
    id: `transit-${schedule.id}`,
    role: 'listitem',
    'aria-label': `${modeInfo.name}: ${schedule.line} departing in ${countdown.text}`,
  },
    // Mode icon
    h('div', {
      class: 'w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0',
      style: { background: modeInfo.color },
      'aria-hidden': 'true',
    }, TRANSIT_MODES[schedule.mode]?.icon || '🚌'),

    // Info
    h('div', { class: 'flex-1 min-w-0' },
      h('p', { class: 'text-sm font-semibold text-slate-800 truncate' }, schedule.line),
      h('p', { class: 'text-xs text-slate-500 truncate' }, schedule.destination),
      h('div', { class: 'flex items-center gap-2 mt-0.5' },
        schedule.accessible
          ? h('span', { class: 'text-xs text-green-600', 'aria-label': 'Wheelchair accessible' }, '♿')
          : null,
        schedule.delay > 0
          ? h('span', { class: 'badge badge--warning' }, `+${schedule.delay}m delay`)
          : null,
        h('span', { class: 'text-xs text-slate-400' },
          `${Math.max(10, schedule.capacity)}% capacity`,
        ),
      ),
    ),

    // Countdown
    h('div', { class: 'text-right flex-shrink-0' },
      h('p', {
        class: `text-lg font-bold ${countdown.isUrgent ? 'text-red-600' : 'text-slate-800'}`,
        'data-countdown': schedule.id,
        'data-departure': schedule.departure,
      }, countdown.text),
      h('p', { class: 'text-xs text-slate-500' }, formatTime(new Date(schedule.departure))),
    ),
  );

  return card;
}

/**
 * Update all departure countdowns
 */
function updateCountdowns() {
  const countdownEls = document.querySelectorAll('[data-countdown]');
  for (const el of countdownEls) {
    const departure = el.getAttribute('data-departure');
    if (departure) {
      const countdown = getDepartureCountdown(departure);
      el.textContent = countdown.text;
      el.className = `text-lg font-bold ${countdown.isUrgent ? 'text-red-600' : 'text-slate-800'}`;
    }
  }
}

/**
 * Cleanup timer
 */
export function destroyTransitPanel() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

export default { createTransitPanel, destroyTransitPanel };
