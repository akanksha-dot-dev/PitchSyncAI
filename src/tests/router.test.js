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
      listeners[event] = handler;
    },
    removeEventListener: (event, handler) => {
      delete listeners[event];
    },
    // Test helper to simulate hashchange
    _triggerHashChange: (newHash) => {
      window.location.hash = newHash;
      if (listeners['hashchange']) {
        listeners['hashchange']();
      }
    }
  };
}

import { route, notFound, beforeEach, navigate, getCurrentRoute, initRouter, destroyRouter } from '../core/router.js';

test('Router matches registered paths and parameters', () => {
  let matchedFan = false;
  let matchedZone = null;

  route('#/fan', () => {
    matchedFan = true;
  });

  route('#/zone/:id', (params) => {
    matchedZone = params.id;
  });

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
  let guardCalled = 0;
  window.location.hash = '#/fan';

  beforeEach((to, from) => {
    guardCalled++;
    if (to === '#/admin') {
      return false; // Block navigation
    }
    return true;
  });

  initRouter();
  
  // Navigate to blocked route
  window._triggerHashChange('#/admin');
  assert.strictEqual(guardCalled, 1);
  assert.strictEqual(getCurrentRoute(), '#/fan'); // Reverted to previous

  destroyRouter();
});
