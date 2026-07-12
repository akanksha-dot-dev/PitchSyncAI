/**
 * @module main
 * @description Application bootstrap for PitchSync AI.
 *
 * Orchestrates the full startup sequence:
 * 1. Restore persisted state from localStorage snapshot
 * 2. Initialize crowd-data and mock ticket
 * 3. Build the app shell (header + main content region)
 * 4. Register hash-based SPA routes (`#/fan`, `#/ops`)
 * 5. Start real-time Firebase crowd-data simulation
 * 6. Enable 30-second auto-save and online/offline detection
 * 7. Wire up the reroute validation wizard
 *
 * Both Fan Copilot and Ops Command views are rendered into the
 * same `#view-container` element; mode switching triggers a full
 * re-render of the active panel.
 */

import state, { subscribe, batch } from './core/state.js';
import { initRouter, route } from './core/router.js';
import { restoreSnapshot, startAutoSave, saveSnapshot } from './core/cache.js';
import { h, $ } from './utils/dom.js';
import { announce } from './utils/a11y.js';
import { generateCrowdData, MOCK_TICKET } from './utils/constants.js';

// Components
import { createHeader } from './components/header.js';
import { createChat } from './components/chat.js';
import { createStadiumMap } from './components/stadium-map.js';
import { createTransitPanel, destroyTransitPanel } from './components/transit-card.js';
import { createTicketCard } from './components/ticket-card.js';
import { createHeatmap } from './components/heatmap.js';
import { createMetricsPanel } from './components/metrics-panel.js';
import { createAlertFeed, destroyAlertFeed } from './components/alert-feed.js';
import { createResourcePanel } from './components/resource-panel.js';
import { initValidationWizard } from './components/validation-wizard.js';

// Services
import { subscribeToCrowdData, cleanup as cleanupFirebase } from './services/firebase.js';

/* ---- App Initialization ---- */

async function init() {
  try {
    // 1. Restore saved state
    const snapshot = restoreSnapshot();
    if (snapshot) {
      batch((s) => {
        if (snapshot.language) s.language = snapshot.language;
        if (snapshot.chatHistory) s.chatHistory = snapshot.chatHistory;
        if (snapshot.userProfile) s.userProfile = snapshot.userProfile;
        if (snapshot.mode) s.appMode = snapshot.mode;
      });
      console.info('[App] State restored from snapshot');
    }

    // 2. Set default user profile with mock ticket
    if (!state.userProfile?.ticket) {
      state.userProfile = {
        ...state.userProfile,
        ticket: MOCK_TICKET,
      };
    }

    // 3. Initialize crowd data
    state.crowdData = generateCrowdData();

    // 4. Build the app shell
    buildAppShell();

    // 5. Initialize routing
    setupRoutes();
    initRouter();

    // 6. Start real-time services
    startRealtimeServices();

    // 7. Start auto-save
    startAutoSave(() => state);

    // 8. Setup online/offline detection
    setupNetworkDetection();

    // 9. Initialize validation wizard
    initValidationWizard();

    // 10. Hide loading screen
    hideLoadingScreen();

    console.info('[App] FIFA MatchDay GenAI Nexus initialized');
    announce('FIFA MatchDay GenAI Nexus is ready');

  } catch (err) {
    console.error('[App] Initialization error:', err);
    hideLoadingScreen();
    showError('Failed to initialize the application. Please refresh the page.');
  }
}

/**
 * Build the main app shell
 */
function buildAppShell() {
  const app = $('#app');
  if (!app) return;

  // Clear loading screen will be done after render
  const shell = h('div', { class: 'flex flex-col min-h-screen' },
    // Header
    createHeader(),

    // Main content area
    h('main', {
      id: 'main-content',
      class: 'app-main',
      role: 'main',
      'aria-label': 'Main content',
    },
      h('div', { id: 'view-container', class: 'flex-1' }),
    ),
  );

  // Keep loading screen, append shell
  app.appendChild(shell);

  // Render initial view
  renderView(state.appMode);
}

/**
 * Setup routes
 */
function setupRoutes() {
  route('#/fan', () => {
    state.appMode = 'fan';
    renderView('fan');
  });

  route('#/ops', () => {
    state.appMode = 'ops';
    renderView('ops');
  });

  // Subscribe to mode changes from the toggle
  subscribe('appMode', (mode) => {
    const hash = `#/${mode}`;
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
    renderView(mode);
  });
}

/**
 * Render the appropriate view based on mode
 */
function renderView(mode) {
  const container = $('#view-container');
  if (!container) return;

  // Clear previous view
  container.innerHTML = '';

  if (mode === 'fan') {
    renderFanMode(container);
  } else {
    renderOpsMode(container);
  }
}

/**
 * Render Fan Copilot mode
 */
function renderFanMode(container) {
  const view = h('div', {
    class: 'fan-mode animate-fade-in',
    id: 'fan-panel',
    role: 'tabpanel',
    'aria-label': 'Fan Copilot Mode',
  },
    // Chat (main area)
    createChat(),

    // Sidebar (map + transit + ticket)
    h('div', { class: 'fan-sidebar' },
      createStadiumMap('density'),
      createTransitPanel(),
      createTicketCard(),
    ),
  );

  container.appendChild(view);
}

/**
 * Render Ops Command mode
 */
function renderOpsMode(container) {
  const view = h('div', {
    class: 'ops-mode animate-fade-in',
    id: 'ops-panel',
    role: 'tabpanel',
    'aria-label': 'Ops Command Mode',
  },
    // Metrics row (spans full width)
    createMetricsPanel(),

    // Heatmap (main area)
    createHeatmap(),

    // Sidebar (alerts + resources)
    h('div', { class: 'ops-sidebar' },
      createAlertFeed(),
      createResourcePanel(),
    ),
  );

  container.appendChild(view);
}

/**
 * Start real-time services
 */
function startRealtimeServices() {
  // Subscribe to crowd data from Firebase (mocked)
  subscribeToCrowdData((data) => {
    state.crowdData = data;
  });
}

/**
 * Setup online/offline detection
 */
function setupNetworkDetection() {
  window.addEventListener('online', () => {
    state.isOnline = true;
    announce('Connection restored');
  });

  window.addEventListener('offline', () => {
    state.isOnline = false;
    announce('You are offline. Some features may be limited.');
  });
}

/**
 * Hide the loading screen
 */
function hideLoadingScreen() {
  const loadingScreen = $('#loading-screen');
  if (loadingScreen) {
    loadingScreen.style.transition = 'opacity 0.3s ease';
    loadingScreen.style.opacity = '0';
    setTimeout(() => loadingScreen.remove(), 300);
  }
}

/**
 * Show error message
 */
function showError(message) {
  const app = $('#app');
  if (!app) return;

  const errorEl = h('div', {
    class: 'fixed inset-0 flex items-center justify-center bg-surface-50 z-50',
    role: 'alert',
  },
    h('div', { class: 'card text-center max-w-md mx-4' },
      h('div', { class: 'text-4xl mb-4' }, '⚠️'),
      h('h2', { class: 'text-lg font-bold text-slate-800 mb-2' }, 'Something went wrong'),
      h('p', { class: 'text-sm text-slate-600 mb-4' }, message),
      h('button', {
        class: 'btn btn--primary',
        onClick: () => window.location.reload(),
      }, 'Refresh Page'),
    ),
  );

  app.appendChild(errorEl);
}

/**
 * Cleanup on unload
 */
window.addEventListener('beforeunload', () => {
  saveSnapshot(state);
  cleanupFirebase();
  destroyTransitPanel();
  destroyAlertFeed();
});

// Boot the application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
