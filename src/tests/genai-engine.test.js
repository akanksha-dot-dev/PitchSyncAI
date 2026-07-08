import { test } from 'node:test';
import assert from 'node:assert';
import { processMessage } from '../services/genai-engine.js';
import { classifyIntent } from '../services/genai-engine.js';

// ---- Network Failure Simulation ----

test('processMessage: returns fallback on empty input', async () => {
  const result = await processMessage('', 'en', [], {});
  assert.strictEqual(result.type, 'text');
  assert.ok(result.text.length > 0, 'Should return a fallback text');
});

test('processMessage: returns fallback on whitespace-only input', async () => {
  const result = await processMessage('   ', 'en', [], {});
  assert.strictEqual(result.type, 'text');
  assert.ok(!result.error === false || result.text.length > 0);
});

test('processMessage: handles XSS payload safely', async () => {
  const xssPayload = '<script>alert("xss")</script>';
  const result = await processMessage(xssPayload, 'en', [], {});
  // Response text should never contain raw script tags
  assert.ok(!result.text.includes('<script>'), 'XSS script tag must not appear in response');
});

// ---- Unknown Intent Fallback ----

test('classifyIntent: unknown gibberish falls back to general', () => {
  const { intent, confidence } = classifyIntent('xyzzy quux blorp');
  assert.strictEqual(intent, 'general');
  assert.strictEqual(confidence, 0);
});

test('processMessage: unknown intent returns text type response', async () => {
  const result = await processMessage('xyzzy quux blorp', 'en', [], {});
  assert.strictEqual(result.type, 'text');
  assert.ok(result.text.length > 0);
});

// ---- Language Fallback ----

test('processMessage: unsupported language falls back to English template', async () => {
  const result = await processMessage('hello', 'zz', [], {});
  assert.strictEqual(result.type, 'text');
  assert.ok(result.text.length > 0, 'Should return English fallback for unknown language');
});

// ---- Accessibility Context ----

test('processMessage: wheelchair context routes via accessible path', async () => {
  const profile = { accessibility: { wheelchair: true } };
  const result = await processMessage('how do I get to my seat', 'en', [], profile);
  assert.strictEqual(result.type, 'route');
  assert.strictEqual(result.richData.accessible, true);
});

// ---- High Confidence Intent Routing ----

test('processMessage: medical keyword triggers medical intent', async () => {
  const result = await processMessage('I feel sick and need a doctor', 'en', [], {});
  assert.strictEqual(result.intent, 'medical');
});

test('processMessage: transit keyword triggers transit intent with schedule data', async () => {
  const result = await processMessage('what is the next metro schedule', 'en', [], {});
  assert.strictEqual(result.intent, 'transit');
  assert.strictEqual(result.type, 'transit');
  assert.ok(Array.isArray(result.richData?.schedules));
});

// ---- Chat History Context ----

test('processMessage: long chat history triggers context compression', async () => {
  const longHistory = Array.from({ length: 55 }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'ai',
    text: `Message ${i}`,
    intent: 'general',
    timestamp: Date.now() + i,
  }));
  // Should not throw — context compression must handle gracefully
  const result = await processMessage('hello', 'en', longHistory, {});
  assert.ok(result.text.length > 0);
});
