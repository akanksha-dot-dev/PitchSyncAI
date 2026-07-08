/* ============================================================
   FIFA MatchDay GenAI Nexus — Header Component
   Branding, mode toggle, language selector
   ============================================================ */

import { h, $ } from '../utils/dom.js';
import { setAria, announce } from '../utils/a11y.js';
import state, { subscribe } from '../core/state.js';
import { emit } from '../core/events.js';
import { LANGUAGES } from '../utils/constants.js';

/**
 * Render the app header
 * @returns {HTMLElement}
 */
export function createHeader() {
  const header = h('header', {
    id: 'app-header',
    class: 'fixed top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-b border-surface-200 shadow-sm',
    role: 'banner',
  },
    // Skip link for accessibility
    h('a', { href: '#main-content', class: 'skip-link' }, 'Skip to main content'),

    h('div', { class: 'max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between gap-4' },
      // Left: Branding
      h('div', { class: 'flex items-center gap-3 flex-shrink-0' },
        h('div', { class: 'w-9 h-9 rounded-lg bg-gradient-to-br from-fifa-blue to-blue-800 flex items-center justify-center text-white text-sm font-extrabold shadow-md', 'aria-hidden': 'true' }, '⚽'),
        h('div', { class: 'hidden sm:block' },
          h('h1', { class: 'text-base font-bold text-slate-800 leading-tight' }, 'MatchDay GenAI Nexus'),
          h('p', { class: 'text-xs text-slate-500 leading-none' }, 'FIFA World Cup 2026™'),
        ),
      ),

      // Center: Mode Toggle
      h('div', { id: 'mode-toggle-container', class: 'flex items-center gap-1 bg-surface-100 rounded-full p-1', role: 'tablist', 'aria-label': 'Application mode' },
        createModeButton('fan', '🎟️', 'Fan Copilot', true),
        createModeButton('ops', '📊', 'Ops Command', false),
      ),

      // Right: Language + Status
      h('div', { class: 'flex items-center gap-3' },
        createLanguageSelector(),
        createOnlineIndicator(),
      ),
    ),
  );

  // Subscribe to mode changes
  subscribe('appMode', (mode) => updateModeToggle(mode));
  subscribe('isOnline', (online) => updateOnlineStatus(online));

  return header;
}

/**
 * Create a mode toggle button
 */
function createModeButton(mode, icon, label, isActive) {
  const btn = h('button', {
    id: `mode-btn-${mode}`,
    class: `flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
      isActive
        ? 'bg-white text-fifa-blue shadow-sm'
        : 'text-slate-500 hover:text-slate-700'
    }`,
    role: 'tab',
    'aria-selected': isActive ? 'true' : 'false',
    'aria-controls': `${mode}-panel`,
    onClick: () => {
      state.appMode = mode;
      announce(`Switched to ${label} mode`);
      emit('mode:change', mode);
    },
  },
    h('span', { 'aria-hidden': 'true' }, icon),
    h('span', { class: 'hidden sm:inline' }, label),
  );
  return btn;
}

/**
 * Create language selector dropdown
 */
function createLanguageSelector() {
  const wrapper = h('div', { class: 'select-wrapper' });
  const select = h('select', {
    id: 'language-selector',
    class: 'select text-sm pr-8 min-w-0 w-20 sm:w-auto',
    'aria-label': 'Select language',
    onChange: (e) => {
      state.language = e.target.value;
      const langName = LANGUAGES[e.target.value]?.name || e.target.value;
      announce(`Language changed to ${langName}`);
      emit('language:change', e.target.value);
    },
  });

  for (const [code, lang] of Object.entries(LANGUAGES)) {
    const option = h('option', { value: code }, `${lang.flag} ${lang.name}`);
    if (code === state.language) option.selected = true;
    select.appendChild(option);
  }

  wrapper.appendChild(select);
  return wrapper;
}

/**
 * Create online/offline indicator
 */
function createOnlineIndicator() {
  return h('div', {
    id: 'online-indicator',
    class: 'flex items-center gap-1.5',
    'aria-label': state.isOnline ? 'Connected' : 'Offline',
    title: state.isOnline ? 'Online' : 'Working offline',
  },
    h('span', {
      class: `status-dot ${state.isOnline ? 'status-dot--online status-dot--pulse' : 'status-dot--offline'}`,
      'aria-hidden': 'true',
    }),
    h('span', { class: 'text-xs text-slate-500 hidden md:inline' }, state.isOnline ? 'Live' : 'Offline'),
  );
}

/**
 * Update mode toggle UI
 */
function updateModeToggle(mode) {
  const fanBtn = $(`#mode-btn-fan`);
  const opsBtn = $(`#mode-btn-ops`);
  if (!fanBtn || !opsBtn) return;

  const activeClass = 'bg-white text-fifa-blue shadow-sm';
  const inactiveClass = 'text-slate-500 hover:text-slate-700';

  if (mode === 'fan') {
    fanBtn.className = `flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${activeClass}`;
    opsBtn.className = `flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${inactiveClass}`;
    fanBtn.setAttribute('aria-selected', 'true');
    opsBtn.setAttribute('aria-selected', 'false');
  } else {
    opsBtn.className = `flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${activeClass}`;
    fanBtn.className = `flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${inactiveClass}`;
    opsBtn.setAttribute('aria-selected', 'true');
    fanBtn.setAttribute('aria-selected', 'false');
  }
}

/**
 * Update online status indicator
 */
function updateOnlineStatus(online) {
  const indicator = $('#online-indicator');
  if (!indicator) return;
  const dot = indicator.querySelector('.status-dot');
  const label = indicator.querySelector('span:last-child');
  if (dot) {
    dot.className = `status-dot ${online ? 'status-dot--online status-dot--pulse' : 'status-dot--offline'}`;
  }
  if (label) label.textContent = online ? 'Live' : 'Offline';
  indicator.setAttribute('aria-label', online ? 'Connected' : 'Offline');
}

export default { createHeader };
