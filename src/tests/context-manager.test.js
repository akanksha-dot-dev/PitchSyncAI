import { test } from 'node:test';
import assert from 'node:assert';
import { compressContext, assembleContext, getContextStats, estimateTokens, detectFollowUp } from '../services/context-manager.js';

test('estimateTokens calculation', () => {
  assert.strictEqual(estimateTokens('Hello World'), 3);
  assert.strictEqual(estimateTokens('こんにちは'), 3); // 5 CJK characters -> 3 tokens
  assert.strictEqual(estimateTokens(''), 0);
  assert.strictEqual(estimateTokens(null), 0);
});

test('compressContext returns history unchanged when under limit', () => {
  const chatHistory = [
    { role: 'user', text: 'Hi', intent: 'greeting', timestamp: Date.now() },
  ];
  const result = compressContext(chatHistory);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].text, 'Hi');
});

test('compressContext handles non-array input', () => {
  assert.strictEqual(compressContext(null), null);
  assert.strictEqual(compressContext(undefined), undefined);
  assert.strictEqual(compressContext('not-an-array'), 'not-an-array');
});

test('compressContext preserves priority messages and compresses history', () => {
  // Generate 55 messages to exceed both FULL_FIDELITY_LIMIT (20) and
  // trigger eviction (55 - 1 priority = 54 normal > 20+30=50)
  const chatHistory = [];
  for (let i = 0; i < 55; i++) {
    chatHistory.push({
      role: i % 2 === 0 ? 'user' : 'ai',
      text: `Message ${i}`,
      intent: 'general',
      timestamp: Date.now() + i,
    });
  }

  // Inject a priority message early in the history
  chatHistory[2] = {
    role: 'user',
    text: 'I need elevator access',
    intent: 'accessibility',
    timestamp: Date.now() + 2,
  };

  compressContext(chatHistory);

  // 1. The priority message should be preserved
  const accessibilityPreserved = chatHistory.some(m => m.intent === 'accessibility');
  assert.ok(accessibilityPreserved, 'Accessibility message must be preserved');

  // 2. Should have a digest (54 normal messages - 20 full - 30 summary = 4 evicted)
  const hasDigest = chatHistory.some(m => m.type === 'digest');
  assert.ok(hasDigest, 'Should create a digest for evicted messages');

  // 3. Should have summaries
  const hasSummaries = chatHistory.some(m => m.summary === true);
  assert.ok(hasSummaries, 'Should create summaries for tier-2 messages');

  // 4. Total should be less than original
  assert.ok(chatHistory.length < 55, 'Compressed history should be smaller');
});

test('compressContext creates summaries for tier-2 messages', () => {
  // 25 messages: 1 priority + 24 normal. 24 > FULL_FIDELITY_LIMIT(20),
  // so 4 messages should be summarized (no eviction since 4 < SUMMARY_TIER_SIZE of 30)
  const chatHistory = [];
  for (let i = 0; i < 25; i++) {
    chatHistory.push({
      role: i % 2 === 0 ? 'user' : 'ai',
      text: `Message ${i} with some content`,
      intent: 'general',
      timestamp: Date.now() + i,
    });
  }

  // Add one priority message
  chatHistory[0] = {
    role: 'user',
    text: 'I need wheelchair access',
    intent: 'accessibility',
    timestamp: Date.now(),
  };

  compressContext(chatHistory);

  // Should have summaries (24 normal - 20 full = 4 summarized)
  const summaries = chatHistory.filter(m => m.summary === true);
  assert.ok(summaries.length > 0, 'Should create summaries');
  assert.ok(summaries[0].excerpt, 'Summaries should have excerpts');
  assert.ok(summaries[0].intent, 'Summaries should have intents');
});

test('assembleContext builds optimal context', () => {
  const chatHistory = [
    { type: 'digest', messageCount: 5, intentSummary: { general: 5 } },
    { role: 'user', text: 'Hello', intent: 'greeting' },
  ];
  const userProfile = {
    accessibility: { wheelchair: true },
    ticket: { seat: '12' },
  };

  const context = assembleContext(chatHistory, userProfile);
  assert.strictEqual(context.accessibility.wheelchair, true);
  assert.strictEqual(context.hasTicket, true);
  assert.deepStrictEqual(context.recentIntents, ['greeting']);
  assert.ok(context.digest);
});

test('assembleContext handles empty/null inputs', () => {
  const context = assembleContext(null, null);
  assert.deepStrictEqual(context.accessibility, {});
  assert.strictEqual(context.hasTicket, false);
  assert.deepStrictEqual(context.recentIntents, []);
  assert.strictEqual(context.digest, null);
});

test('getContextStats monitors usage', () => {
  const chatHistory = [
    { type: 'digest', messageCount: 5, intentSummary: { general: 5 } },
    { role: 'user', text: 'Hello', intent: 'greeting' },
    { role: 'ai', text: 'Welcome', summary: true },
  ];

  const stats = getContextStats(chatHistory);
  assert.strictEqual(stats.total, 3);
  assert.strictEqual(stats.digests, 1);
  assert.strictEqual(stats.full, 1);
  assert.strictEqual(stats.summarized, 1);
});

// ---- Follow-up Detection ----

test('detectFollowUp identifies wayfinding→food pattern', () => {
  const hint = detectFollowUp(['greeting', 'wayfinding', 'food']);
  assert.strictEqual(hint, 'wayfinding→food');
});

test('detectFollowUp returns null for unrecognized patterns', () => {
  const hint = detectFollowUp(['greeting', 'greeting']);
  assert.strictEqual(hint, null);
});

test('detectFollowUp returns null for insufficient history', () => {
  assert.strictEqual(detectFollowUp([]), null);
  assert.strictEqual(detectFollowUp(['wayfinding']), null);
  assert.strictEqual(detectFollowUp(null), null);
});
