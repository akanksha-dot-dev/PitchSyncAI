/**
 * @module ticket-card
 * @description Digital Ticket component for displaying match entry passes.
 *
 * Renders offline-saved digital tickets with gate, section, row, seat fields
 * and scannable barcodes.
 */

import { h, $ } from '../utils/dom.js';
import { announce } from '../utils/a11y.js';
import state, { subscribe } from '../core/state.js';
import { saveSnapshot } from '../core/cache.js';
import { MOCK_TICKET } from '../utils/constants.js';

/**
 * Create the digital ticket card
 * @returns {HTMLElement}
 */
export function createTicketCard() {
  const ticket = state.userProfile?.ticket || MOCK_TICKET;

  const card = h('div', {
    class: 'card card--accent',
    id: 'ticket-card',
    role: 'region',
    'aria-label': 'Digital ticket',
  },
    h('div', { class: 'flex items-center justify-between mb-3' },
      h('h3', { class: 'text-sm font-bold text-slate-800 flex items-center gap-2' },
        h('span', { 'aria-hidden': 'true' }, '🎟️'),
        'My Ticket',
      ),
      h('button', {
        class: 'btn btn--ghost btn--sm',
        id: 'save-ticket-btn',
        'aria-label': 'Save ticket offline',
        onClick: () => handleSaveOffline(),
      },
        h('span', { 'aria-hidden': 'true' }, '💾'),
        h('span', { class: 'text-xs' }, 'Save Offline'),
      ),
    ),

    // Match info
    h('div', { class: 'text-center mb-3' },
      h('p', { class: 'text-xs text-slate-500 font-medium uppercase tracking-wider' }, ticket.competition),
      h('p', { class: 'text-lg font-extrabold text-slate-800 mt-1' }, ticket.match),
      h('p', { class: 'text-sm text-slate-600 mt-0.5' },
        `${ticket.venue} • ${formatDate(ticket.date)} at ${ticket.time}`,
      ),
    ),

    // Ticket details grid
    h('div', { class: 'grid grid-cols-4 gap-2 text-center py-3 border-t border-b border-surface-200' },
      createTicketField('Gate', ticket.gate),
      createTicketField('Sec', ticket.section),
      createTicketField('Row', ticket.row),
      createTicketField('Seat', ticket.seat),
    ),

    // Barcode
    h('div', { class: 'mt-3 text-center' },
      h('div', {
        class: 'inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-mono text-sm tracking-wider',
        'aria-label': `Barcode: ${ticket.barcode}`,
      },
        h('span', { 'aria-hidden': 'true' }, '▮▯▮▮▯▮▯▯▮▮▯▮'),
        ticket.barcode,
      ),
    ),

    // Offline status
    h('div', {
      id: 'ticket-offline-status',
      class: 'mt-2 text-center text-xs text-slate-400 hidden',
    }, '✓ Saved for offline access'),
  );

  // Check if already saved
  checkOfflineStatus();

  return card;
}

/**
 * Create a ticket detail field
 */
function createTicketField(label, value) {
  return h('div', {},
    h('p', { class: 'text-xs text-slate-500 font-medium' }, label),
    h('p', { class: 'text-xl font-extrabold text-fifa-blue' }, value),
  );
}

/**
 * Format date string
 */
function formatDate(dateStr) {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Save ticket data offline
 */
function handleSaveOffline() {
  const ticket = state.userProfile?.ticket || MOCK_TICKET;

  // Save to state
  state.userProfile = {
    ...state.userProfile,
    ticket,
  };

  // Trigger snapshot save
  saveSnapshot(state);

  // Update UI
  const statusEl = $('#ticket-offline-status');
  if (statusEl) {
    statusEl.classList.remove('hidden');
    statusEl.textContent = '✓ Saved for offline access';
  }

  const btn = $('#save-ticket-btn');
  if (btn) {
    btn.innerHTML = '';
    btn.appendChild(h('span', { 'aria-hidden': 'true' }, '✓'));
    btn.appendChild(h('span', { class: 'text-xs text-green-600' }, 'Saved'));
  }

  announce('Ticket saved for offline access');
}

/**
 * Check if ticket is saved offline
 */
function checkOfflineStatus() {
  setTimeout(() => {
    if (state.userProfile?.ticket) {
      const statusEl = $('#ticket-offline-status');
      if (statusEl) {
        statusEl.classList.remove('hidden');
      }
    }
  }, 200);
}

