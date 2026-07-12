import { test } from 'node:test';
import assert from 'node:assert';
import {
  memGet,
  memSet,
  memDelete,
  memClear,
  storageGet,
  storageSet,
  storageDelete,
  cacheGet,
  cacheSet,
  saveSnapshot,
  restoreSnapshot
} from '../core/cache.js';

// Setup mock localStorage if running in Node environment without window
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    }
  };
}

test('Memory cache (L1) operations', () => {
  memClear();
  memSet('testKey', 'testVal');
  assert.strictEqual(memGet('testKey'), 'testVal');

  memDelete('testKey');
  assert.strictEqual(memGet('testKey'), null);
});

test('Memory cache (L1) TTL expiration', async () => {
  memClear();
  memSet('ttlKey', 'ttlVal', 10); // 10ms TTL
  assert.strictEqual(memGet('ttlKey'), 'ttlVal');

  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.strictEqual(memGet('ttlKey'), null);
});

test('LocalStorage cache (L2) operations', () => {
  localStorage.clear();
  storageSet('storageKey', { nested: 'data' });
  assert.deepStrictEqual(storageGet('storageKey'), { nested: 'data' });

  storageDelete('storageKey');
  assert.strictEqual(storageGet('storageKey'), null);
});

test('Unified cache interface fallthrough (L1 -> L2)', () => {
  memClear();
  localStorage.clear();

  // Set in both L1 and L2
  cacheSet('unifiedKey', 'unifiedValue', 5000);
  assert.strictEqual(memGet('unifiedKey'), 'unifiedValue');
  assert.strictEqual(storageGet('unifiedKey'), 'unifiedValue');

  // Clear memory cache only
  memClear();
  assert.strictEqual(memGet('unifiedKey'), null);

  // cacheGet should fetch from L2 and promote to L1
  assert.strictEqual(cacheGet('unifiedKey'), 'unifiedValue');
  assert.strictEqual(memGet('unifiedKey'), 'unifiedValue');
});

test('State snapshotting save and restore', () => {
  localStorage.clear();
  const mockState = {
    appMode: 'ops',
    language: 'es',
    chatHistory: [{ role: 'user', text: 'hi' }],
    userProfile: { name: 'FIFA Fan' },
    transitSchedules: []
  };

  saveSnapshot(mockState);
  const restored = restoreSnapshot();

  assert.ok(restored);
  assert.strictEqual(restored.mode, 'ops');
  assert.strictEqual(restored.language, 'es');
  assert.deepStrictEqual(restored.chatHistory, [{ role: 'user', text: 'hi' }]);
  assert.deepStrictEqual(restored.userProfile, { name: 'FIFA Fan' });
});
