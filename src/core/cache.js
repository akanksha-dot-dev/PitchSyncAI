/**
 * @module cache
 * @description Dual-layer caching system for PitchSync AI.
 *
 * Provides two complementary storage tiers:
 * - **L1 (Memory)**: In-memory `Map` with optional TTL for hot data
 * - **L2 (localStorage)**: Persistent storage with TTL and quota management
 *
 * The unified `cacheGet` / `cacheSet` interface automatically promotes
 * L2 hits into L1 to accelerate repeated reads.
 *
 * State snapshotting (`saveSnapshot` / `restoreSnapshot`) persists
 * essential app state (mode, language, chat history, ticket data)
 * to localStorage for offline resilience inside congested stadiums.
 */

const STORAGE_PREFIX = 'fifa_nexus_';
const SNAPSHOT_KEY = `${STORAGE_PREFIX}snapshot`;
const SNAPSHOT_VERSION = 1;
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

/** @type {Map<string, { value: any, expiry: number }>} */
const memoryCache = new Map();

let autoSaveTimer = null;
let autoSaveUnloadHandler = null;

/* ---- L1: Memory Cache ---- */

/**
 * Get a value from memory cache (L1)
 * @param {string} key
 * @returns {*|null}
 */
export function memGet(key) {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiry && Date.now() > entry.expiry) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
}

/**
 * Set a value in memory cache (L1)
 * @param {string} key
 * @param {*} value
 * @param {number} [ttlMs] - Time-to-live in milliseconds
 */
export function memSet(key, value, ttlMs) {
  memoryCache.set(key, {
    value,
    expiry: ttlMs ? Date.now() + ttlMs : 0,
  });
}

/**
 * Delete a value from memory cache
 * @param {string} key
 */
export function memDelete(key) {
  memoryCache.delete(key);
}

/**
 * Clear all memory cache entries
 */
export function memClear() {
  memoryCache.clear();
}

/* ---- L2: LocalStorage Persistent Cache ---- */

/**
 * Safely read from localStorage
 * @param {string} key
 * @returns {*|null}
 */
export function storageGet(key) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
    // Check TTL if present
    if (parsed._expiry && Date.now() > parsed._expiry) {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
      return null;
    }
    return parsed.value;
  } catch (err) {
    console.warn(`[Cache] Failed to read "${key}" from localStorage:`, err);
    return null;
  }
}

/**
 * Safely write to localStorage
 * @param {string} key
 * @param {*} value
 * @param {number} [ttlMs] - Optional TTL
 */
export function storageSet(key, value, ttlMs) {
  try {
    const entry = {
      value,
      _expiry: ttlMs ? Date.now() + ttlMs : 0,
      _ts: Date.now(),
    };
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(entry));
  } catch (err) {
    console.warn(`[Cache] Failed to write "${key}" to localStorage:`, err);
    // If quota exceeded, try to clear old entries
    if (err.name === 'QuotaExceededError') {
      pruneStorage();
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify({ value, _ts: Date.now() }));
      } catch {
        // Silent fail — storage is truly full
      }
    }
  }
}

/**
 * Remove a key from localStorage
 * @param {string} key
 */
export function storageDelete(key) {
  localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
}

/**
 * Prune oldest entries from localStorage when quota is exceeded
 */
function pruneStorage() {
  const entries = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX) && key !== SNAPSHOT_KEY) {
      try {
        const parsed = JSON.parse(localStorage.getItem(key));
        entries.push({ key, ts: parsed._ts || 0 });
      } catch {
        entries.push({ key, ts: 0 });
      }
    }
  }
  // Remove oldest 25%
  entries.sort((a, b) => a.ts - b.ts);
  const toRemove = Math.max(1, Math.floor(entries.length * 0.25));
  for (let i = 0; i < toRemove; i++) {
    localStorage.removeItem(entries[i].key);
  }
}

/* ---- State Snapshotting ---- */

/**
 * Save a state snapshot to localStorage
 * @param {object} stateData - State to snapshot
 */
export function saveSnapshot(stateData) {
  try {
    const snapshot = {
      version: SNAPSHOT_VERSION,
      timestamp: Date.now(),
      mode: stateData.appMode,
      language: stateData.language,
      chatHistory: (stateData.chatHistory || []).slice(-50), // Keep last 50 messages
      userProfile: stateData.userProfile,
      transitSchedules: stateData.transitSchedules || [],
      savedRoutes: stateData.userProfile?.savedRoutes || [],
    };
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch (err) {
    console.warn('[Cache] Snapshot save failed:', err);
  }
}

/**
 * Restore state snapshot from localStorage
 * @returns {object|null} Restored snapshot data or null
 */
export function restoreSnapshot() {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const snapshot = JSON.parse(raw);
    // Version migration
    if (snapshot.version !== SNAPSHOT_VERSION) {
      console.info('[Cache] Snapshot version mismatch, discarding');
      localStorage.removeItem(SNAPSHOT_KEY);
      return null;
    }
    return snapshot;
  } catch (err) {
    console.warn('[Cache] Snapshot restore failed:', err);
    return null;
  }
}

/**
 * Start auto-save timer
 * @param {Function} getState - Function that returns current state
 */
export function startAutoSave(getState) {
  stopAutoSave();
  autoSaveTimer = setInterval(() => {
    saveSnapshot(getState());
  }, AUTO_SAVE_INTERVAL);

  // Store reference so it can be cleaned up
  autoSaveUnloadHandler = () => saveSnapshot(getState());
  window.addEventListener('beforeunload', autoSaveUnloadHandler);
}

/**
 * Stop auto-save timer
 */
export function stopAutoSave() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
  }
  if (autoSaveUnloadHandler) {
    window.removeEventListener('beforeunload', autoSaveUnloadHandler);
    autoSaveUnloadHandler = null;
  }
}

/* ---- Unified Cache Interface ---- */

/**
 * Get value with L1 → L2 fallthrough
 * @param {string} key
 * @returns {*|null}
 */
export function cacheGet(key) {
  // Try L1 first
  const memValue = memGet(key);
  if (memValue !== null) return memValue;
  // Fall through to L2
  const storageValue = storageGet(key);
  if (storageValue !== null) {
    // Promote to L1 with 5 min TTL
    memSet(key, storageValue, 300000);
    return storageValue;
  }
  return null;
}

/**
 * Set value in both L1 and L2
 * @param {string} key
 * @param {*} value
 * @param {number} [ttlMs]
 */
export function cacheSet(key, value, ttlMs) {
  memSet(key, value, ttlMs);
  storageSet(key, value, ttlMs);
}

/**
 * Get cache statistics for telemetry/monitoring.
 * @returns {{ memoryKeys: number, storageSize: number }}
 */
export function getCacheStats() {
  let storageSize = 0;
  if (typeof localStorage !== 'undefined') {
    try {
      storageSize = Object.keys(localStorage)
        .filter(k => k.startsWith(STORAGE_PREFIX))
        .reduce((sum, k) => sum + (localStorage.getItem(k) || '').length, 0);
    } catch (_) {
      // Fail-silent if localStorage is blocked
    }
  }
  return {
    memoryKeys: memoryCache.size,
    storageSize,
  };
}

