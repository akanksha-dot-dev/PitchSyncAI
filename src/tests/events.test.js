import { test } from 'node:test';
import assert from 'node:assert';
import { on, once, off, emit, removeAll } from '../core/events.js';

test('Event subscription and emission', () => {
  removeAll();
  let received = null;

  const unsub = on('test:event', (data) => {
    received = data;
  });

  emit('test:event', { foo: 'bar' });
  assert.deepStrictEqual(received, { foo: 'bar' });

  // Unsubscribe and verify it is not called again
  received = null;
  unsub();
  emit('test:event', { baz: 'qux' });
  assert.strictEqual(received, null);
});

test('Once event listener lifecycle', () => {
  removeAll();
  let count = 0;

  once('test:once', () => {
    count++;
  });

  emit('test:once');
  emit('test:once');
  assert.strictEqual(count, 1);
});

test('Namespace wildcard events trigger correct callbacks', () => {
  removeAll();
  const receivedWildcards = [];

  on('fan:*', (data, eventName) => {
    receivedWildcards.push({ data, eventName });
  });

  emit('fan:message', 'hello');
  emit('fan:typing', true);
  emit('ops:alert', 'warning'); // should not match

  assert.strictEqual(receivedWildcards.length, 2);
  assert.deepStrictEqual(receivedWildcards[0], { data: 'hello', eventName: 'fan:message' });
  assert.deepStrictEqual(receivedWildcards[1], { data: true, eventName: 'fan:typing' });
});

test('removeAll clears events', () => {
  removeAll();
  let called = false;

  on('temp', () => {
    called = true;
  });

  removeAll('temp');
  emit('temp');
  assert.strictEqual(called, false);
});
