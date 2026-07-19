import { test } from 'node:test';
import assert from 'node:assert';
import state, { subscribe, subscribeAll, batch, getSnapshot, resetState } from '../core/state.js';

test('state change notifies subscribers', () => {
  let calledCount = 0;
  let receivedVal = '';
  
  const unsub = subscribe('appMode', (val) => {
    calledCount++;
    receivedVal = val;
  });

  state.appMode = 'ops';
  assert.strictEqual(calledCount, 1);
  assert.strictEqual(receivedVal, 'ops');

  unsub();
  // Reset for other tests
  state.appMode = 'fan';
});

test('batch updates fire notifications exactly once per key', () => {
  let modeCalled = 0;
  let langCalled = 0;

  const unsubMode = subscribe('appMode', () => modeCalled++);
  const unsubLang = subscribe('language', () => langCalled++);

  batch((s) => {
    s.appMode = 'ops';
    s.language = 'es';
  });

  // Each key should be notified exactly once (not double)
  assert.strictEqual(modeCalled, 1, 'appMode subscriber should fire exactly once');
  assert.strictEqual(langCalled, 1, 'language subscriber should fire exactly once');

  unsubMode();
  unsubLang();
  // Reset
  state.appMode = 'fan';
  state.language = 'en';
});

test('resetState returns to default values', () => {
  state.appMode = 'ops';
  state.language = 'es';
  resetState();
  assert.strictEqual(state.appMode, 'fan');
  assert.strictEqual(state.language, 'en');
});

test('shallow compare skips redundant notifications', () => {
  let callCount = 0;
  const unsub = subscribe('appMode', () => callCount++);

  state.appMode = 'fan'; // Same as current value
  assert.strictEqual(callCount, 0, 'Should not notify for same value');

  state.appMode = 'ops';
  assert.strictEqual(callCount, 1);

  unsub();
  state.appMode = 'fan';
});

test('subscribeAll receives all state changes', () => {
  const changes = [];
  const unsub = subscribeAll((value, oldValue, key) => {
    changes.push(key);
  });

  state.appMode = 'ops';
  state.language = 'fr';

  assert.ok(changes.includes('appMode'));
  assert.ok(changes.includes('language'));

  unsub();
  state.appMode = 'fan';
  state.language = 'en';
});

test('getSnapshot returns a deep clone', () => {
  state.appMode = 'ops';
  const snap = getSnapshot();
  assert.strictEqual(snap.appMode, 'ops');

  // Mutations to snapshot should not affect state
  snap.appMode = 'modified';
  assert.strictEqual(state.appMode, 'ops');

  state.appMode = 'fan';
});

test('unsubscribe prevents further notifications', () => {
  let count = 0;
  const unsub = subscribe('appMode', () => count++);

  state.appMode = 'ops';
  assert.strictEqual(count, 1);

  unsub();
  state.appMode = 'fan';
  assert.strictEqual(count, 1, 'Should not be called after unsubscribe');
});
