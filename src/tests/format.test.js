import { test } from 'node:test';
import assert from 'node:assert';
import { formatMarkdown } from '../utils/format.js';

test('formatMarkdown converts bold syntax', () => {
  const result = formatMarkdown('**Hello** World');
  assert.ok(result.includes('<strong>Hello</strong>'));
  assert.ok(result.includes('World'));
});

test('formatMarkdown converts newlines to br', () => {
  const result = formatMarkdown('Line 1\nLine 2');
  assert.ok(result.includes('<br>'));
});

test('formatMarkdown converts bullet markers', () => {
  const result = formatMarkdown('• Item 1');
  assert.ok(result.includes('&bull;'));
});

test('formatMarkdown sanitizes HTML before formatting', () => {
  const result = formatMarkdown('<script>alert("xss")</script> **bold**');
  assert.ok(!result.includes('<script>'), 'Should not contain script tags');
  assert.ok(result.includes('<strong>bold</strong>'), 'Should still format bold');
});

test('formatMarkdown handles empty input', () => {
  const result = formatMarkdown('');
  assert.strictEqual(result, '');
});

test('formatMarkdown handles combined formatting', () => {
  const result = formatMarkdown('**Title**\n• Item 1\n• Item 2');
  assert.ok(result.includes('<strong>Title</strong>'));
  assert.ok(result.includes('<br>'));
  assert.ok(result.includes('&bull;'));
});
