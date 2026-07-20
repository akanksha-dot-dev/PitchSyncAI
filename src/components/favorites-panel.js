/**
 * @module favorites-panel
 * @description Fan Favorites / Saved Locations panel for Fan Copilot mode.
 *
 * Lets fans bookmark up to 5 stadium locations (food courts, restrooms,
 * gates, sections). Each saved location shows a "Navigate" quick-action
 * that injects a navigation message into the chat. Favorites persist in
 * localStorage via the existing state-snapshot system.
 */

import { h, $, uid } from '../utils/dom.js';
import { announce } from '../utils/a11y.js';
import state, { subscribe } from '../core/state.js';
import { saveSnapshot } from '../core/cache.js';
import { STADIUM_ZONES, ZONE_ICONS } from '../utils/constants.js';

const MAX_FAVORITES = 5;

// Suggested quick-add locations
const SUGGESTED_LOCATIONS = [
  { zoneId: 'food_court_e', label: 'East Food Court' },
  { zoneId: 'food_court_w', label: 'West Food Court' },
  { zoneId: 'medical_1', label: 'Medical Station 1' },
  { zoneId: 'gate_a', label: 'Gate A (My Entry)' },
  { zoneId: 'concourse_n', label: 'North Concourse' },
  { zoneId: 'vip_lounge', label: 'VIP Lounge' },
];

/**
 * Create the Fan Favorites panel component.
 * @returns {HTMLElement}
 */
export function createFavoritesPanel() {
  const panel = h('div', {
    class: 'favorites-panel card',
    id: 'favorites-panel',
    role: 'region',
    'aria-label': 'My saved locations',
  },
    // Header
    h('div', { class: 'favorites-panel__header' },
      h('h3', { class: 'text-sm font-bold text-slate-800 flex items-center gap-2' },
        h('span', { 'aria-hidden': 'true' }, '\u2B50'),
        'My Favorites',
      ),
      h('span', { class: 'text-xs text-slate-400', id: 'favorites-count' }, '0 / 5'),
    ),

    // Saved locations list
    h('div', { id: 'favorites-list', class: 'favorites-list', 'aria-live': 'polite' }),

    // Quick-add suggestions
    h('div', { class: 'favorites-suggestions', id: 'favorites-suggestions' },
      h('p', { class: 'text-xs text-slate-500 font-medium mb-2' }, 'Quick Add:'),
      h('div', { class: 'favorites-chips', id: 'favorites-chips' }),
    ),
  );

  // Initial render
  renderFavoritesList();
  renderSuggestions();

  // Subscribe to favorites state changes
  subscribe('favorites', () => {
    renderFavoritesList();
    renderSuggestions();
  });

  return panel;
}

/**
 * Render the saved favorites list.
 */
function renderFavoritesList() {
  const list = $('#favorites-list');
  const countEl = $('#favorites-count');
  if (!list) return;

  const favorites = state.favorites || [];
  list.innerHTML = '';

  if (countEl) countEl.textContent = `${favorites.length} / ${MAX_FAVORITES}`;

  if (favorites.length === 0) {
    list.appendChild(
      h('p', { class: 'text-xs text-slate-400 py-2 text-center' },
        'No favorites yet. Add locations below!',
      ),
    );
    return;
  }

  for (const fav of favorites) {
    const zoneInfo = STADIUM_ZONES[fav.zoneId];
    const icon = zoneInfo ? (ZONE_ICONS[zoneInfo.type] || '\uD83D\uDCCD') : '\uD83D\uDCCD';

    const item = h('div', { class: 'favorites-item', id: `fav-${fav.id}` },
      h('span', { class: 'favorites-item__icon', 'aria-hidden': 'true' }, icon),
      h('span', { class: 'favorites-item__label' }, fav.label),
      h('div', { class: 'favorites-item__actions' },
        h('button', {
          class: 'btn btn--ghost btn--sm',
          'aria-label': `Navigate to ${fav.label}`,
          onClick: () => navigateToFavorite(fav),
        }, '\uD83D\uDDFA\uFE0F'),
        h('button', {
          class: 'btn btn--ghost btn--sm text-red-400',
          'aria-label': `Remove ${fav.label} from favorites`,
          onClick: () => removeFavorite(fav.id),
        }, '\u00D7'),
      ),
    );
    list.appendChild(item);
  }
}

/**
 * Render the quick-add suggestion chips (excluding already-saved ones).
 */
function renderSuggestions() {
  const chips = $('#favorites-chips');
  if (!chips) return;

  const favorites = state.favorites || [];
  const savedIds = new Set(favorites.map(f => f.zoneId));
  const available = SUGGESTED_LOCATIONS.filter(s => !savedIds.has(s.zoneId));

  chips.innerHTML = '';

  if (available.length === 0 || favorites.length >= MAX_FAVORITES) {
    const suggestions = $('#favorites-suggestions');
    if (suggestions) suggestions.style.display = 'none';
    return;
  }

  const suggestions = $('#favorites-suggestions');
  if (suggestions) suggestions.style.display = 'block';

  for (const loc of available.slice(0, 4)) {
    const chip = h('button', {
      class: 'favorites-chip',
      'aria-label': `Add ${loc.label} to favorites`,
      onClick: () => addFavorite(loc),
    }, `+ ${loc.label}`);
    chips.appendChild(chip);
  }
}

/**
 * Add a location to favorites.
 * @param {{ zoneId: string, label: string }} loc
 */
function addFavorite(loc) {
  const favorites = state.favorites || [];
  if (favorites.length >= MAX_FAVORITES) {
    announce(`Maximum of ${MAX_FAVORITES} favorites reached. Remove one to add more.`);
    return;
  }
  if (favorites.find(f => f.zoneId === loc.zoneId)) return;

  const newFav = { id: uid('fav'), zoneId: loc.zoneId, label: loc.label };
  state.favorites = [...favorites, newFav];
  saveSnapshot(state);
  announce(`${loc.label} added to favorites`);
}

/**
 * Remove a favorite by id.
 * @param {string} favId
 */
function removeFavorite(favId) {
  const favorites = state.favorites || [];
  const fav = favorites.find(f => f.id === favId);
  state.favorites = favorites.filter(f => f.id !== favId);
  saveSnapshot(state);
  if (fav) announce(`${fav.label} removed from favorites`);
}

/**
 * Navigate to a favorite location by injecting a chat message.
 * @param {{ label: string, zoneId: string }} fav
 */
function navigateToFavorite(fav) {
  const input = $('#chat-input');
  if (input) {
    input.value = `How do I get to ${fav.label}?`;
    const sendBtn = $('#chat-send-btn');
    if (sendBtn) sendBtn.click();
  }
  announce(`Requesting navigation to ${fav.label}`);
}
