/**
 * @module state
 * @description Proxy-based reactive state manager for PitchSync AI.
 *
 * Provides a single, observable state tree used across both Fan Copilot
 * and Ops Command modes. Property assignments on the default export are
 * automatically intercepted by a `Proxy` that notifies per-key and
 * wildcard subscribers, enabling fine-grained UI updates without a
 * virtual DOM.
 *
 * Key design decisions:
 * - **Shallow comparison** on `set` prevents redundant notifications.
 * - **Batch helper** collects mutations and fires notifications only
 *   after the updater function completes, avoiding intermediate renders.
 * - **Deep clone** is used for snapshots and resets so consumers never
 *   share references with the internal store.
 */

/** @type {Map<string, Set<Function>>} */
const subscribers = new Map();

/** @type {Set<Function>} */
const wildcardSubs = new Set();

const initialState = {
  // App mode: 'fan' or 'ops'
  appMode: 'fan',

  // Language: ISO 639-1 code
  language: 'en',

  // Chat
  chatHistory: [],
  isTyping: false,
  quickReplies: [],

  // Crowd data: { zoneId: { density, trend, timestamp, alerts } }
  crowdData: {},

  // Transit schedules
  transitSchedules: [],

  // User profile: accessibility prefs, ticket data
  userProfile: {
    name: '',
    accessibility: {
      wheelchair: false,
      visualImpairment: false,
      hearingImpairment: false,
      lowSensory: false,
    },
    ticket: null,
    savedRoutes: [],
  },

  // Ops mode
  opsAlerts: [],
  resources: {
    security: { total: 120, deployed: {} },
    medical: { total: 40, deployed: {} },
    crowdControl: { total: 80, deployed: {} },
    accessibility: { total: 30, deployed: {} },
  },

  // Validation wizard
  wizardOpen: false,
  wizardData: null,

  // UI state
  sidebarOpen: true,
  selectedZone: null,
  mapView: 'density', // 'density' | 'wayfinding' | 'accessibility'

  // System
  isOnline: navigator.onLine,
  lastSync: null,
};

Object.freeze(initialState.userProfile.accessibility);

/**
 * Deep clone helper for initial state reset
 * @param {*} obj
 * @returns {*}
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepClone);
  const clone = {};
  for (const key of Object.keys(obj)) {
    clone[key] = deepClone(obj[key]);
  }
  return clone;
}

/**
 * Notify subscribers for a given key
 * @param {string} key
 * @param {*} value
 * @param {*} oldValue
 */
function notify(key, value, oldValue) {
  const subs = subscribers.get(key);
  if (subs) {
    for (const fn of subs) {
      try {
        fn(value, oldValue, key);
      } catch (err) {
        console.error(`[State] Subscriber error for "${key}":`, err);
      }
    }
  }
  // Notify wildcard subscribers
  for (const fn of wildcardSubs) {
    try {
      fn(value, oldValue, key);
    } catch (err) {
      console.error('[State] Wildcard subscriber error:', err);
    }
  }
}

/** The reactive state proxy */
const state = new Proxy(deepClone(initialState), {
  set(target, key, value) {
    const oldValue = target[key];
    // Skip if value hasn't changed (shallow compare)
    if (oldValue === value) return true;
    target[key] = value;
    notify(String(key), value, oldValue);
    return true;
  },
  deleteProperty(target, key) {
    const oldValue = target[key];
    delete target[key];
    notify(String(key), undefined, oldValue);
    return true;
  },
});

/**
 * Subscribe to state changes for a specific key
 * @param {string} key - State property to watch
 * @param {Function} callback - (newValue, oldValue, key) => void
 * @returns {Function} Unsubscribe function
 */
export function subscribe(key, callback) {
  if (!subscribers.has(key)) {
    subscribers.set(key, new Set());
  }
  subscribers.get(key).add(callback);
  return () => subscribers.get(key)?.delete(callback);
}

/**
 * Subscribe to ALL state changes (wildcard)
 * @param {Function} callback
 * @returns {Function} Unsubscribe function
 */
export function subscribeAll(callback) {
  wildcardSubs.add(callback);
  return () => wildcardSubs.delete(callback);
}

/**
 * Batch multiple state updates without firing intermediate notifications
 * @param {Function} updater - (state) => void
 */
export function batch(updater) {
  const pending = [];
  const batchProxy = new Proxy(state, {
    set(target, key, value) {
      const oldValue = target[key];
      if (oldValue !== value) {
        target[key] = value;
        pending.push({ key: String(key), value, oldValue });
      }
      return true;
    },
  });
  updater(batchProxy);
  // Fire all notifications after batch completes
  for (const { key, value, oldValue } of pending) {
    notify(key, value, oldValue);
  }
}

/**
 * Get a snapshot of the current state (deep clone)
 * @returns {object}
 */
export function getSnapshot() {
  return deepClone(Object.assign({}, state));
}

/**
 * Reset state to initial values
 */
export function resetState() {
  const fresh = deepClone(initialState);
  for (const key of Object.keys(fresh)) {
    state[key] = fresh[key];
  }
}

export default state;
