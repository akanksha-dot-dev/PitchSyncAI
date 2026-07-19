import { test } from 'node:test';
import assert from 'node:assert';
import { checkContrast } from '../utils/a11y.js';

// Note: Most a11y functions (announce, createFocusTrap, setupKeyboardNav)
// require a browser DOM and are tested through integration/browser tests.
// Here we test the pure utility functions that work in Node.

test('checkContrast passes AAA for high-contrast colors', () => {
  // #1E40AF (FIFA blue) on #FAFBFC (surface-50)
  const result = checkContrast('#1E40AF', '#FAFBFC');
  assert.ok(result.ratio > 7, `Ratio ${result.ratio} should exceed 7:1`);
  assert.strictEqual(result.passesAAA, true);
});

test('checkContrast fails AAA for low-contrast colors', () => {
  // Light gray on white — low contrast
  const result = checkContrast('#CBD5E1', '#FAFBFC');
  assert.ok(result.ratio < 7, `Ratio ${result.ratio} should be below 7:1`);
  assert.strictEqual(result.passesAAA, false);
});

test('checkContrast black on white is highest contrast', () => {
  const result = checkContrast('#000000', '#FFFFFF');
  assert.ok(result.ratio > 20, 'Black on white should be very high contrast');
  assert.strictEqual(result.passesAAA, true);
});

test('checkContrast same color has contrast of 1', () => {
  const result = checkContrast('#333333', '#333333');
  assert.strictEqual(result.ratio, 1);
  assert.strictEqual(result.passesAAA, false);
});

test('checkContrast handles hex with and without hash', () => {
  const result1 = checkContrast('#000000', '#FFFFFF');
  const result2 = checkContrast('000000', 'FFFFFF');
  assert.strictEqual(result1.ratio, result2.ratio);
});
