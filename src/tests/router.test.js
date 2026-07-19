import { test } from 'node:test';
import assert from 'node:assert';

// Mock window environment for Node execution of Router tests
if (typeof globalThis.window === 'undefined') {
  const listeners = {};
  globalThis.window = {
    location: {
      hash: ''
    },
    addEventListener: (event, handler) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    },
    removeEventListener: (event, handler) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(h => h !== handler);
      }
    },
    // Test helper to simulate hashchange
    _triggerHashChange: (newHash) => {
      window.location.hash = newHash;
      if (listeners['hashchange']) {
        for (const handler of listeners['hashchange']) {
          handler();
        }
      }
    }
  };
}

import { route, notFound, beforeEach, initRouter, destroyRouter } from '../core/router.js';

test('Router matches registered paths and parameters', () => {
  // Reset state
  window.location.hash = '';

  let matchedFan = false;
  let matchedZone = null;

  route('#/fan', () => {
    matchedFan = true;
  });

  route('#/zone/:id', (params) => {
    matchedZone = params.id;
  });

  // Reset guard to avoid interference
  beforeEach(null);

  initRouter();

  // Test static route
  window._triggerHashChange('#/fan');
  assert.strictEqual(matchedFan, true);

  // Test dynamic route param match
  window._triggerHashChange('#/zone/gate_a');
  assert.strictEqual(matchedZone, 'gate_a');

  destroyRouter();
});

test('Router guards cancel navigation when returning false', () => {
  // Clean start
  window.location.hash = '#/fan';

  let guardCalled = 0;

  // Register guard BEFORE initRouter to ensure clean state
  beforeEach((to, _from) => {
    guardCalled++;
    if (to === '#/admin') {
      return false; // Block navigation
    }
    return true;
  });

  initRouter();

  // Navigate to blocked route
  window._triggerHashChange('#/admin');
  assert.ok(guardCalled >= 1, 'Guard should have been called');
  // Hash should revert to the previous route (fan) since admin was blocked
  assert.strictEqual(window.location.hash, '#/fan');

  // Clean up
  beforeEach(null);
  destroyRouter();
});

test('Router notFound handler is called for unregistered routes', () => {
  let notFoundCalled = false;
  window.location.hash = '#/fan';

  beforeEach(null);
  notFound(() => { notFoundCalled = true; });

  initRouter();

  window._triggerHashChange('#/nonexistent');
  assert.strictEqual(notFoundCalled, true);

  destroyRouter();
});
