/**
 * @module sos-panel
 * @description Emergency SOS panel for Fan Copilot mode.
 *
 * A high-visibility, collapsible card in the fan sidebar that provides:
 * - Nearest medical station with estimated walk time
 * - Two nearest emergency exits
 * - Security hotline (simulated)
 * - "Alert Staff" button that injects a critical alert into the Ops feed
 */

import { h, $, uid } from '../utils/dom.js';
import { announce } from '../utils/a11y.js';
import state from '../core/state.js';
import { emit } from '../core/events.js';

// Emergency info constants (simulation)
const EMERGENCY_INFO = {
  medical: [
    { name: 'Medical Station 1', location: 'NW Section, Level 1', walkTime: '2 min', icon: '\uD83C\uDFE5' },
    { name: 'Medical Station 2', location: 'SE Section, Level 1', walkTime: '4 min', icon: '\uD83C\uDFE5' },
  ],
  exits: [
    { name: 'Gate A (North)', type: 'Emergency Exit', walkTime: '1 min', icon: '\uD83D\uDEAA' },
    { name: 'Gate G (West)', type: 'Emergency Exit', walkTime: '2 min', icon: '\uD83D\uDEAA' },
    { name: 'Gate E (South)', type: 'Emergency Exit', walkTime: '3 min', icon: '\uD83D\uDEAA' },
  ],
  hotline: '#HELP (4357)',
};

let alertCooldown = false;

/**
 * Create the Emergency SOS panel component.
 * @returns {HTMLElement}
 */
export function createSosPanel() {
  let expanded = false;

  const panel = h('div', {
    class: 'sos-panel',
    id: 'sos-panel',
    role: 'region',
    'aria-label': 'Emergency SOS panel',
  },
    // Collapsed header — always visible
    h('button', {
      class: 'sos-panel__toggle',
      id: 'sos-toggle-btn',
      'aria-expanded': 'false',
      'aria-controls': 'sos-body',
      onClick: () => {
        expanded = !expanded;
        const body = $('#sos-body');
        const btn = $('#sos-toggle-btn');
        if (body) {
          body.style.display = expanded ? 'block' : 'none';
        }
        if (btn) {
          btn.setAttribute('aria-expanded', String(expanded));
          const chevron = btn.querySelector('.sos-chevron');
          if (chevron) chevron.textContent = expanded ? '\u25B2' : '\u25BC';
        }
        if (expanded) announce('SOS emergency panel expanded');
      },
    },
      h('div', { class: 'sos-panel__toggle-left' },
        h('span', { class: 'sos-panel__icon', 'aria-hidden': 'true' }, '\uD83C\uDD98'),
        h('div', {},
          h('span', { class: 'sos-panel__title' }, 'Emergency SOS'),
          h('span', { class: 'sos-panel__subtitle' }, 'Medical \u2022 Exits \u2022 Security'),
        ),
      ),
      h('span', { class: 'sos-chevron text-white opacity-70 text-xs', 'aria-hidden': 'true' }, '\u25BC'),
    ),

    // Expandable body
    h('div', { id: 'sos-body', class: 'sos-panel__body', style: { display: 'none' } },

      // Medical
      h('div', { class: 'sos-section' },
        h('p', { class: 'sos-section__label' }, '\uD83C\uDFE5 Nearest Medical'),
        h('div', { class: 'sos-info-row' },
          h('div', {},
            h('p', { class: 'font-semibold text-sm text-slate-800' }, EMERGENCY_INFO.medical[0].name),
            h('p', { class: 'text-xs text-slate-500' }, EMERGENCY_INFO.medical[0].location),
          ),
          h('span', { class: 'sos-time-badge' }, EMERGENCY_INFO.medical[0].walkTime),
        ),
        h('button', {
          class: 'sos-nav-btn',
          onClick: () => navigateToMedical(),
          'aria-label': 'Navigate to nearest medical station',
        }, '\uD83D\uDDFA\uFE0F Navigate There'),
      ),

      // Emergency Exits
      h('div', { class: 'sos-section' },
        h('p', { class: 'sos-section__label' }, '\uD83D\uDEAA Emergency Exits'),
        ...EMERGENCY_INFO.exits.slice(0, 2).map(exit =>
          h('div', { class: 'sos-info-row' },
            h('span', { class: 'text-sm text-slate-700 font-medium' }, exit.name),
            h('span', { class: 'sos-time-badge' }, exit.walkTime),
          ),
        ),
      ),

      // Security Hotline
      h('div', { class: 'sos-section' },
        h('p', { class: 'sos-section__label' }, '\uD83D\uDEE1\uFE0F Security Hotline'),
        h('div', { class: 'sos-info-row' },
          h('span', { class: 'font-mono font-bold text-sm text-slate-800' }, EMERGENCY_INFO.hotline),
          h('span', { class: 'text-xs text-slate-500' }, 'From any mobile'),
        ),
      ),

      // Alert Staff button
      h('div', { class: 'sos-section sos-section--alert' },
        h('button', {
          class: 'sos-alert-btn',
          id: 'sos-alert-staff-btn',
          'aria-label': 'Alert stadium staff for emergency assistance',
          onClick: handleAlertStaff,
        }, '\uD83D\uDEA8 Alert Stadium Staff'),
        h('p', { class: 'text-xs text-slate-400 mt-1 text-center' }, 'Notifies nearest security & medical team'),
      ),
    ),
  );

  return panel;
}

/**
 * Navigate to medical station by injecting a chat message.
 */
function navigateToMedical() {
  const input = $('#chat-input');
  if (input) {
    input.value = 'I need to get to the nearest medical station urgently. Please guide me.';
    const sendBtn = $('#chat-send-btn');
    if (sendBtn) sendBtn.click();
  }
  announce('Requesting navigation to nearest medical station');
}

/**
 * Handle the Alert Staff button — fires a critical alert into the Ops feed.
 */
function handleAlertStaff() {
  if (alertCooldown) {
    announce('Staff alert already sent. Please wait before sending another.');
    return;
  }

  const alert = {
    id: uid('sos'),
    severity: 'critical',
    zone: 'section_100',
    message: '\uD83C\uDD98 FAN SOS: Emergency assistance requested. Fan-triggered alert via app.',
    action: 'Dispatch nearest security and medical staff immediately',
    timestamp: Date.now(),
    acknowledged: false,
    resolved: false,
    source: 'fan-sos',
  };

  // Push alert into ops state
  state.opsAlerts = [...(state.opsAlerts || []), alert];

  // Emit event so alert feed receives it
  emit('sos:alert', alert);

  // Update button state
  const btn = $('#sos-alert-staff-btn');
  if (btn) {
    btn.textContent = '\u2713 Staff Alerted!';
    btn.classList.add('sos-alert-btn--sent');
    btn.disabled = true;
  }

  // Reset after 30 seconds
  alertCooldown = true;
  setTimeout(() => {
    alertCooldown = false;
    if (btn) {
      btn.textContent = '\uD83D\uDEA8 Alert Stadium Staff';
      btn.classList.remove('sos-alert-btn--sent');
      btn.disabled = false;
    }
  }, 30000);

  announce('Emergency alert sent. Stadium staff have been notified.', 'assertive');
}
