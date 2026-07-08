import { test } from 'node:test';
import assert from 'node:assert';
import { sanitizeHTML, validateMessage, validateLanguageCode, validateZoneId, validateGate, clamp, validateApiKey, createRateLimiter } from '../utils/validators.js';

// Setup mock document for sanitizeHTML if it runs in node environment
if (typeof globalThis.document === 'undefined') {
  globalThis.document = {
    createElement: () => ({
      set textContent(val) {
        this.value = val;
      },
      get innerHTML() {
        return this.value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }
    })
  };
}

test('sanitizeHTML prevents XSS', () => {
  const untrusted = '<script>alert("xss")</script>';
  const sanitized = sanitizeHTML(untrusted);
  assert.strictEqual(sanitized, '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
});

test('validateMessage check constraints', () => {
  assert.deepStrictEqual(validateMessage(''), { valid: false, error: 'Message cannot be empty' });
  assert.deepStrictEqual(validateMessage('   '), { valid: false, error: 'Message cannot be empty' });
  assert.deepStrictEqual(validateMessage('Hello World'), { valid: true });
  assert.deepStrictEqual(validateMessage('a'.repeat(2001)), { valid: false, error: 'Message must be under 2000 characters' });
});

test('validateLanguageCode formats', () => {
  assert.strictEqual(validateLanguageCode('en'), true);
  assert.strictEqual(validateLanguageCode('es-ES'), true);
  assert.strictEqual(validateLanguageCode('english'), false);
});

test('validateZoneId rules', () => {
  assert.strictEqual(validateZoneId('gate_a'), true);
  assert.strictEqual(validateZoneId('section-100'), true);
  assert.strictEqual(validateZoneId('123gate'), false);
});

test('validateGate formats', () => {
  assert.strictEqual(validateGate('A'), true);
  assert.strictEqual(validateGate('h'), true);
  assert.strictEqual(validateGate('Z'), false);
});

test('clamp boundary constraints', () => {
  assert.strictEqual(clamp(5, 1, 10), 5);
  assert.strictEqual(clamp(-5, 1, 10), 1);
  assert.strictEqual(clamp(15, 1, 10), 10);
});

test('validateApiKey detects leaks', () => {
  assert.deepStrictEqual(validateApiKey('AIzaSyA12345678901234567890'), { valid: true, exposed: true });
  assert.deepStrictEqual(validateApiKey('normal_key'), { valid: true, exposed: false });
});

test('createRateLimiter limits calls', () => {
  const limiter = createRateLimiter(2, 100);
  assert.strictEqual(limiter.check(), true);
  assert.strictEqual(limiter.check(), true);
  assert.strictEqual(limiter.check(), false); // 3rd call within 100ms should fail
});
