/**
 * @module match-score-card
 * @description Live match score card for Fan Copilot mode.
 *
 * Displays a simulated live match score with:
 * - Home / Away team names with flag emojis
 * - Live animated match minute ticker
 * - Score with goal-flash animation
 * - Match status badge (PRE / LIVE / HT / FT)
 * - Scrollable event timeline (goals, bookings, substitutions)
 */

import { h, $, uid } from '../utils/dom.js';
import { announce } from '../utils/a11y.js';
import { emit } from '../core/events.js';

// ---- Mock match data ----
const MATCH = {
  home: { name: 'USA', flag: '🇺🇸', short: 'USA' },
  away: { name: 'Brazil', flag: '🇧🇷', short: 'BRA' },
  venue: 'MetLife Stadium',
  kickoff: new Date(Date.now() - 33 * 60 * 1000), // Started 33 min ago
};

/** @type {{ id: string, minute: number, type: 'goal'|'yellow'|'red'|'sub', team: 'home'|'away', player: string, detail?: string }[]} */
const INITIAL_EVENTS = [
  { id: uid('ev'), minute: 12, type: 'goal', team: 'home', player: 'Pulisic', detail: 'Right foot, 18-yard box' },
  { id: uid('ev'), minute: 27, type: 'yellow', team: 'away', player: 'Casemiro', detail: 'Tactical foul' },
  { id: uid('ev'), minute: 31, type: 'goal', team: 'away', player: 'Vinicius Jr', detail: 'Header from corner' },
];

const EVENT_ICONS = {
  goal: '⚽',
  yellow: '🟨',
  red: '🟥',
  sub: '🔄',
};

let matchState = {
  homeScore: 1,
  awayScore: 1,
  minute: 33,
  status: 'live', // 'pre' | 'live' | 'ht' | 'ft'
  events: [...INITIAL_EVENTS],
};

let tickerInterval = null;

/**
 * Create the Match Score Card component.
 * @returns {HTMLElement}
 */
export function createMatchScoreCard() {
  const card = h('div', {
    class: 'match-score-card card',
    id: 'match-score-card',
    role: 'region',
    'aria-label': 'Live match score',
    'aria-live': 'polite',
  },
    // Header
    h('div', { class: 'match-score-card__header' },
      h('span', { class: 'match-live-badge', id: 'match-status-badge', 'aria-label': 'Match status: Live' }, '🔴 LIVE'),
      h('span', { class: 'match-score-card__venue' }, MATCH.venue),
    ),

    // Score board
    h('div', { class: 'match-scoreboard' },
      // Home team
      h('div', { class: 'match-team match-team--home' },
        h('span', { class: 'match-team__flag', 'aria-hidden': 'true' }, MATCH.home.flag),
        h('span', { class: 'match-team__name' }, MATCH.home.short),
      ),

      // Score + minute
      h('div', { class: 'match-score-center' },
        h('div', { class: 'match-score', id: 'match-score', 'aria-label': `Score: ${matchState.homeScore} to ${matchState.awayScore}` },
          h('span', { id: 'home-score', class: 'match-score__digit' }, String(matchState.homeScore)),
          h('span', { class: 'match-score__sep' }, ':'),
          h('span', { id: 'away-score', class: 'match-score__digit' }, String(matchState.awayScore)),
        ),
        h('div', { class: 'match-minute', id: 'match-minute', 'aria-label': `Match minute ${matchState.minute}` },
          h('span', { id: 'match-minute-value' }, `${matchState.minute}'`),
        ),
      ),

      // Away team
      h('div', { class: 'match-team match-team--away' },
        h('span', { class: 'match-team__name' }, MATCH.away.short),
        h('span', { class: 'match-team__flag', 'aria-hidden': 'true' }, MATCH.away.flag),
      ),
    ),

    // Event timeline
    h('div', { class: 'match-events', id: 'match-events', role: 'list', 'aria-label': 'Match events' },
      h('div', { class: 'match-events__title' }, '📋 Match Events'),
      h('div', { class: 'match-events__list', id: 'match-events-list' }),
    ),
  );

  // Seed events
  renderEvents();

  // Start live ticker
  startTicker();

  return card;
}

/**
 * Render all match events newest-last in the timeline.
 */
function renderEvents() {
  const list = $('#match-events-list');
  if (!list) return;
  list.innerHTML = '';

  const sorted = [...matchState.events].sort((a, b) => a.minute - b.minute);
  for (const ev of sorted) {
    const isHome = ev.team === 'home';
    const item = h('div', {
      class: `match-event match-event--${ev.type} ${isHome ? 'match-event--home' : 'match-event--away'}`,
      role: 'listitem',
      'aria-label': `${ev.minute}' ${ev.type}: ${ev.player} (${ev.team === 'home' ? MATCH.home.name : MATCH.away.name})`,
    },
      isHome
        ? h('span', { class: 'match-event__minute' }, `${ev.minute}'`)
        : null,
      h('span', { class: 'match-event__icon', 'aria-hidden': 'true' }, EVENT_ICONS[ev.type] || '•'),
      h('span', { class: 'match-event__player' }, ev.player),
      !isHome
        ? h('span', { class: 'match-event__minute' }, `${ev.minute}'`)
        : null,
    );
    list.appendChild(item);
  }

  // Scroll to bottom
  list.scrollTop = list.scrollHeight;
}

/**
 * Flash a score element with a goal animation.
 * @param {'home'|'away'} team
 */
function flashGoal(team) {
  const el = $(`#${team}-score`);
  if (!el) return;
  el.classList.add('match-score__digit--flash');
  setTimeout(() => el.classList.remove('match-score__digit--flash'), 800);
}

/**
 * Start the live match ticker — advances minute every 10s (simulated).
 */
function startTicker() {
  if (tickerInterval) clearInterval(tickerInterval);

  tickerInterval = setInterval(() => {
    if (matchState.status !== 'live') return;

    matchState.minute = Math.min(matchState.minute + 1, 90);
    const minuteEl = $('#match-minute-value');
    if (minuteEl) minuteEl.textContent = `${matchState.minute}'`;

    // Simulate a random goal at minute 44, 67
    if (matchState.minute === 44) {
      triggerGoal('home', 'Morris');
    } else if (matchState.minute === 67) {
      triggerGoal('away', 'Rodrygo');
    } else if (matchState.minute === 45) {
      setMatchStatus('ht');
      setTimeout(() => setMatchStatus('live'), 15000); // Resume after 15s
    } else if (matchState.minute >= 90) {
      setMatchStatus('ft');
      clearInterval(tickerInterval);
    }
  }, 10000); // Every 10 seconds = 1 simulated match minute
}

/**
 * Trigger a goal event.
 * @param {'home'|'away'} team
 * @param {string} player
 */
function triggerGoal(team, player) {
  if (team === 'home') {
    matchState.homeScore++;
    const el = $('#home-score');
    if (el) el.textContent = String(matchState.homeScore);
  } else {
    matchState.awayScore++;
    const el = $('#away-score');
    if (el) el.textContent = String(matchState.awayScore);
  }

  const scoreEl = $('#match-score');
  if (scoreEl) {
    scoreEl.setAttribute('aria-label', `Score: ${matchState.homeScore} to ${matchState.awayScore}`);
  }

  const event = {
    id: uid('ev'),
    minute: matchState.minute,
    type: 'goal',
    team,
    player,
    detail: 'Simulated goal',
  };
  matchState.events.push(event);
  renderEvents();
  flashGoal(team);

  const teamName = team === 'home' ? MATCH.home.name : MATCH.away.name;
  announce(`GOAL! ${player} scores for ${teamName} in minute ${matchState.minute}!`, 'assertive');

  // Emit event so toast manager can pick it up
  emit('match:goal', { team, player, minute: matchState.minute, teamName });
}

/**
 * Update match status badge.
 * @param {'pre'|'live'|'ht'|'ft'} status
 */
function setMatchStatus(status) {
  matchState.status = status;
  const badge = $('#match-status-badge');
  if (!badge) return;

  const labels = {
    pre: '⏳ PRE',
    live: '🔴 LIVE',
    ht: '⏸ HT',
    ft: '✅ FT',
  };
  const classes = {
    pre: 'match-live-badge match-live-badge--pre',
    live: 'match-live-badge',
    ht: 'match-live-badge match-live-badge--ht',
    ft: 'match-live-badge match-live-badge--ft',
  };
  badge.textContent = labels[status] || labels.live;
  badge.className = classes[status] || 'match-live-badge';
  badge.setAttribute('aria-label', `Match status: ${status.toUpperCase()}`);

  if (status === 'ht') {
    announce('Half time! Match is now at half time.');
    emit('match:halftime', {});
  } else if (status === 'ft') {
    announce(`Full time! Final score: ${MATCH.home.name} ${matchState.homeScore} - ${matchState.awayScore} ${MATCH.away.name}`);
    emit('match:fulltime', { homeScore: matchState.homeScore, awayScore: matchState.awayScore });
  }
}

/**
 * Cleanup the match ticker interval.
 */
export function destroyMatchScoreCard() {
  if (tickerInterval) {
    clearInterval(tickerInterval);
    tickerInterval = null;
  }
}
