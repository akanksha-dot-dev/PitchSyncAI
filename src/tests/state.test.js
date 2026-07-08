import { test } from 'node:test';
import assert from 'node:assert';
import state, { subscribe, batch, resetState } from '../core/state.js';

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
});

test('batch updates defer notification', () => {
  let modeCalled = 0;
  let langCalled = 0;

  const unsubMode = subscribe('appMode', () => modeCalled++);
  const unsubLang = subscribe('language', () => langCalled++);

  batch((s) => {
    s.appMode = 'fan';
    s.language = 'es';
  });

  assert.strictEqual(modeCalled, 1);
  assert.strictEqual(langCalled, 1);

  unsubMode();
  unsubLang();
});

test('resetState returns to default values', () => {
  state.appMode = 'ops';
  resetState();
  assert.strictEqual(state.appMode, 'fan'); // Should return to default
});
