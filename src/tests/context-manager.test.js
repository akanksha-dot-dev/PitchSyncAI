import { test } from 'node:test';
import assert from 'node:assert';
import { compressContext, assembleContext, getContextStats, estimateTokens } from '../services/context-manager.js';

test('estimateTokens calculation', () => {
  assert.strictEqual(estimateTokens('Hello World'), 3);
  assert.strictEqual(estimateTokens('こんにちは'), 3); // 5 CJK characters -> 3 tokens
});

test('compressContext preserves priority and compresses history', () => {
  // Generate a mock chat history with 25 messages
  const chatHistory = [];
  for (let i = 0; i < 25; i++) {
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

  const originalLength = chatHistory.length;
  compressContext(chatHistory);

  // Check compression rules:
  // 1. Should have system digest at the beginning because we evicted past full window
  assert.strictEqual(chatHistory[0].type, 'digest');
  // 2. The priority message should be preserved and pinned
  const accessibilityPreserved = chatHistory.some(m => m.intent === 'accessibility');
  assert.ok(accessibilityPreserved);
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
