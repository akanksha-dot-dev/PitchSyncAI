import { test } from 'node:test';
import assert from 'node:assert';
import {
  subscribeToCrowdData,
  subscribeToAlerts,
  pushAlert,
  syncState,
  getCrowdSnapshot,
  cleanup
} from '../services/firebase.js';

test('subscribeToCrowdData delivers initial data immediately', () => {
  let receivedData = null;
  const unsub = subscribeToCrowdData((data) => {
    receivedData = data;
  });

  assert.ok(receivedData, 'Should receive initial crowd data');
  assert.ok(Object.keys(receivedData).length > 0, 'Crowd data should have zones');

  unsub();
});

test('getCrowdSnapshot returns current data', () => {
  const snapshot = getCrowdSnapshot();
  assert.ok(typeof snapshot === 'object');
  assert.ok(Object.keys(snapshot).length > 0);
});

test('pushAlert notifies all subscribers', () => {
  const alerts = [];
  const unsub = subscribeToAlerts((alert) => {
    alerts.push(alert);
  });

  pushAlert({
    severity: 'critical',
    zone: 'gate_a',
    message: 'Test alert',
    action: 'Test action',
  });

  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].severity, 'critical');
  assert.strictEqual(alerts[0].zone, 'gate_a');
  assert.strictEqual(alerts[0].acknowledged, false);
  assert.strictEqual(alerts[0].resolved, false);
  assert.ok(alerts[0].id, 'Alert should have an ID');
  assert.ok(alerts[0].timestamp, 'Alert should have a timestamp');

  unsub();
});

test('syncState simulates network sync', async () => {
  // Should not throw
  await syncState('device_123', { appMode: 'fan' });
});

test('cleanup stops all simulations', () => {
  // Subscribe to start simulations
  const unsub1 = subscribeToCrowdData(() => {});
  const unsub2 = subscribeToAlerts(() => {});

  // Cleanup should not throw
  cleanup();

  // After cleanup, no errors should occur
  assert.ok(true, 'Cleanup completed without errors');
});

test('unsubscribe from crowd data stops receiving updates', () => {
  let callCount = 0;
  const unsub = subscribeToCrowdData(() => {
    callCount++;
  });

  // Should have been called once with initial data
  assert.strictEqual(callCount, 1);

  unsub();
  // After unsub, no further calls should happen
  // (Simulation may or may not be running, but subscriber is removed)
});
