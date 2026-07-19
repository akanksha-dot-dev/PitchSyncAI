/**
 * @module router
 * @description Hash-based SPA router for PitchSync AI.
 *
 * Maps URL hash fragments (`#/fan`, `#/ops`) to handler functions.
 * Features:
 * - **Direct matching** for static routes (`#/fan` → Fan Copilot)
 * - **Pattern matching** with named params (`#/zone/:id`)
 * - **Navigation guards** (`beforeEach`) for access control
 * - **Query-string parsing** appended after `?`
 *
 * Designed for stadium-grade simplicity: no History API complexity,
 * no external dependencies, works offline in constrained networks.
 */

import { emit } from './events.js';

/** @type {Map<string, Function>} */
const routes = new Map();

/** @type {Function|null} */
let notFoundHandler = null;

/** @type {string} */
let currentRoute = '';

/** @type {Function|null} */
let beforeEachGuard = null;

/**
 * Register a route handler.
 *
 * @param {string} path - Route path (e.g., '#/fan', '#/ops', '#/zone/:id')
 * @param {Function} handler - (params) => void
 *
 * @example
 * route('#/fan', () => renderFanMode());
 * route('#/zone/:id', (params) => showZone(params.id));
 */
export function route(path, handler) {
  routes.set(path, handler);
}

/**
 * Register a 404 handler
 * @param {Function} handler
 */
export function notFound(handler) {
  notFoundHandler = handler;
}

/**
 * Register a global before-each navigation guard.
 * Return `false` to cancel the navigation.
 *
 * @param {Function} guard - (to, from) => boolean
 *
 * @example
 * beforeEach((to, from) => {
 *   if (to === '#/admin' && !isAuthenticated()) return false;
 *   return true;
 * });
 */
export function beforeEach(guard) {
  beforeEachGuard = guard;
}

/**
 * Navigate to a route programmatically
 * @param {string} path
 */
export function navigate(path) {
  if (!path.startsWith('#')) {
    path = `#${path}`;
  }
  window.location.hash = path;
}

/**
 * Get the current route path
 * @returns {string}
 */
export function getCurrentRoute() {
  return currentRoute;
}

/**
 * Parse route parameters from hash
 * @param {string} hash
 * @returns {{ path: string, params: object, query: object }}
 */
function parseHash(hash) {
  const [pathAndParams, queryStr] = hash.split('?');
  const path = pathAndParams || '#/fan';
  const query = {};
  if (queryStr) {
    for (const pair of queryStr.split('&')) {
      const [key, val] = pair.split('=');
      query[decodeURIComponent(key)] = decodeURIComponent(val || '');
    }
  }
  return { path, params: {}, query };
}

/**
 * Match a hash against registered routes
 * Supports simple pattern matching: #/fan/:id
 * @param {string} hash
 * @returns {{ handler: Function|null, params: object }}
 */
function matchRoute(hash) {
  const { path, query } = parseHash(hash);

  // Direct match
  if (routes.has(path)) {
    return { handler: routes.get(path), params: { query } };
  }

  // Pattern match (e.g., #/fan/:zone)
  for (const [pattern, handler] of routes) {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) continue;

    const params = { query };
    let match = true;

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        match = false;
        break;
      }
    }

    if (match) return { handler, params };
  }

  return { handler: notFoundHandler, params: {} };
}

/**
 * Handle route change
 */
function handleRouteChange() {
  const hash = window.location.hash || '#/fan';
  const from = currentRoute;

  // Before-each guard
  if (beforeEachGuard && !beforeEachGuard(hash, from)) {
    // Guard rejected — revert hash
    window.location.hash = from;
    return;
  }

  currentRoute = hash;

  const { handler, params } = matchRoute(hash);

  emit('router:change', { to: hash, from, params });

  if (handler) {
    try {
      handler(params);
    } catch (err) {
      console.error(`[Router] Handler error for "${hash}":`, err);
    }
  } else if (notFoundHandler) {
    notFoundHandler({ path: hash });
  }
}

/**
 * Initialize the router — call once on app boot
 */
export function initRouter() {
  window.addEventListener('hashchange', handleRouteChange);

  // Handle initial route
  if (!window.location.hash) {
    window.location.hash = '#/fan';
  } else {
    handleRouteChange();
  }
}

/**
 * Destroy the router — cleanup
 */
export function destroyRouter() {
  window.removeEventListener('hashchange', handleRouteChange);
}

