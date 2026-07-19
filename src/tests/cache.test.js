import { test } from 'node:test';
import assert from 'node:assert';
import { memSet, memGet, memClear, cacheSet, cacheGet, getCacheStats, saveSnapshot, loadSnapshot } from '../core/cache.js';

test('memSet and memGet store and retrieve values', () => {
  memClear();
  memSet('test_key', { data: 123 }, 60000);
  const result = memGet('test_key');
  assert.deepStrictEqual(result, { data: 123 });
});

test('memGet returns null for expired or missing keys', () => {
  memClear();
  assert.strictEqual(memGet('non_existent'), null);

  memSet('expired_key', 'val', -100);
  assert.strictEqual(memGet('expired_key'), null);
});

test('cacheSet and cacheGet dual-layer caching', () => {
  memClear();
  cacheSet('dual_key', 'dual_val', 60000);
  const result = cacheGet('dual_key');
  assert.strictEqual(result, 'dual_val');
});

test('getCacheStats returns memory and storage metrics', () => {
  memClear();
  memSet('stat_key', 'val', 60000);
  const stats = getCacheStats();
  assert.ok(typeof stats.memoryKeys === 'number');
  assert.ok(stats.memoryKeys >= 1);
});

test('saveSnapshot and loadSnapshot state persistence', () => {
  const mockState = { appMode: 'fan', language: 'es' };
  saveSnapshot(mockState);
  const loaded = loadSnapshot();
  assert.ok(loaded);
});
