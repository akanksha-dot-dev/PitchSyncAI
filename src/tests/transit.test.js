import { test } from 'node:test';
import assert from 'node:assert';
import {
  getSchedule,
  getScheduleByMode,
  getNextDeparture,
  getAdjustedSchedule,
  simulateDelay,
  getDepartureCountdown
} from '../services/transit.js';
import { memClear } from '../core/cache.js';

test('getSchedule cache and retrieval', () => {
  memClear();
  const schedules = getSchedule();
  assert.ok(Array.isArray(schedules));
  assert.ok(schedules.length > 0);

  // Cached schedule should match
  const secondCall = getSchedule();
  assert.deepStrictEqual(schedules, secondCall);
});

test('getScheduleByMode filters items', () => {
  memClear();
  const metroOnly = getScheduleByMode('metro');
  assert.ok(metroOnly.every(s => s.mode === 'metro'));
});

test('getDepartureCountdown calculation', () => {
  const now = new Date();
  
  // Test immediate
  const countdownNow = getDepartureCountdown(now.toISOString());
  assert.strictEqual(countdownNow.text, 'Departing now');
  assert.strictEqual(countdownNow.isUrgent, true);

  // Test urgent (2 minutes)
  const twoMinsLater = new Date(now.getTime() + 2 * 60000);
  const countdownUrgent = getDepartureCountdown(twoMinsLater.toISOString());
  assert.strictEqual(countdownUrgent.text, '2 min');
  assert.strictEqual(countdownUrgent.isUrgent, true);

  // Test normal (10 minutes)
  const tenMinsLater = new Date(now.getTime() + 10 * 60000);
  const countdownNormal = getDepartureCountdown(tenMinsLater.toISOString());
  assert.strictEqual(countdownNormal.text, '10 min');
  assert.strictEqual(countdownNormal.isUrgent, false);
});

test('getAdjustedSchedule surge scheduling triggers when density is high', () => {
  memClear();
  const normalSchedules = getAdjustedSchedule(50);
  
  memClear();
  const surgeSchedules = getAdjustedSchedule(90);

  // High density (> 80%) should inject extra departures (Surge)
  assert.ok(surgeSchedules.length > normalSchedules.length);
  assert.ok(surgeSchedules.some(s => s.line.includes('Surge')));
});

test('simulateDelay updates the delayed entry', () => {
  memClear();
  const schedules = getSchedule();
  const firstId = schedules[0].id;

  const updated = simulateDelay(firstId, 15);
  assert.ok(updated);
  assert.strictEqual(updated.delay, 15);

  const reFetched = getSchedule().find(s => s.id === firstId);
  assert.strictEqual(reFetched.delay, 15);
});
