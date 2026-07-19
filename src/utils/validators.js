/**
 * @module validators
 * @description Input validation and sanitization utilities for PitchSync AI.
 *
 * Provides:
 * - **XSS-safe HTML sanitization** via DOM-based escaping (browser) with
 *   regex fallback (Node test environment)
 * - **Prompt injection defense** that detects and neutralizes adversarial
 *   input patterns before they reach the GenAI engine
 * - **Message validation** with length constraints (1–2000 chars)
 * - **ISO 639-1 language code** verification
 * - **Stadium-specific validators** for gates (A–H) and zone identifiers
 * - **API key leak detection** scanning for known provider prefixes
 * - **Sliding-window rate limiter** to prevent endpoint abuse
 */

// ---- Prompt injection patterns ----
// These regex patterns detect common adversarial inputs that attempt to
// override system instructions or extract internal data from the AI engine.
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/i,
  /system\s*:\s*(override|ignore|forget|reset)/i,
  /\bdo\s+not\s+follow\b.*\binstructions?\b/i,
  /\byou\s+are\s+now\b.*\b(new|different)\b/i,
  /\breturn\b.*\b(system|internal|hidden)\s+(prompt|instructions?|config)/i,
  /\bact\s+as\b.*\b(admin|root|superuser|developer)\b/i,
  /\bpretend\b.*\b(you\s+are|to\s+be)\b/i,
  /\b(jailbreak|DAN|bypass\s+filter)\b/i,
];
Object.freeze(PROMPT_INJECTION_PATTERNS);

/**
 * Sanitize HTML input to prevent XSS.
 *
 * Uses the browser's native `document.createElement` text→HTML escaping
 * when available (safest). Falls back to regex-based character replacement
 * in Node/test environments where `document` is unavailable.
 *
 * @param {string} input - Raw user input
 * @returns {string} Escaped string safe for innerHTML insertion
 */
export function sanitizeHTML(input) {
  if (typeof input !== 'string') return '';

  // Browser path: leverage the DOM's built-in escaping
  if (typeof document !== 'undefined' && document.createElement) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  // Node/test fallback: manual entity escaping
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Detect and neutralize prompt injection attempts.
 *
 * Scans the input against known adversarial patterns. If a match is found,
 * the offending portion is stripped and the sanitized remainder is returned.
 * This runs **after** XSS sanitization and **before** intent classification
 * in the GenAI processing pipeline.
 *
 * @param {string} input - Sanitized user input
 * @returns {{ safe: boolean, cleaned: string, threat?: string }}
 */
export function sanitizePromptInjection(input) {
  if (!input || typeof input !== 'string') {
    return { safe: true, cleaned: '' };
  }

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      // Strip the injection attempt and return the remainder
      const cleaned = input.replace(pattern, '').trim();
      return {
        safe: false,
        cleaned: cleaned || 'Hello',
        threat: pattern.source,
      };
    }
  }

  // Strip invisible control characters (U+200B zero-width space, etc.)
  // that could be used to smuggle hidden instructions
  const withoutControl = input.replace(/[\u200B-\u200F\u2028-\u202F\uFEFF]/g, '');

  return { safe: true, cleaned: withoutControl };
}

/**
 * Validate message length (1–2000 characters).
 *
 * @param {string} msg - User message to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateMessage(msg) {
  if (!msg || typeof msg !== 'string') {
    return { valid: false, error: 'Message cannot be empty' };
  }
  const trimmed = msg.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  if (trimmed.length > 2000) {
    return { valid: false, error: 'Message must be under 2000 characters' };
  }
  return { valid: true };
}

/**
 * Validate ISO 639-1 language code (e.g. 'en', 'es-ES').
 *
 * @param {string} code - Language code to check
 * @returns {boolean} True if code matches ISO 639-1 format
 */
export function validateLanguageCode(code) {
  return /^[a-z]{2}(-[A-Z]{2})?$/.test(code);
}

/**
 * Validate a stadium zone identifier.
 *
 * Accepts alphanumeric IDs with underscores/hyphens, starting with a
 * letter, max 31 characters (e.g. 'gate_a', 'section-100', 'vip_lounge').
 *
 * @param {string} zoneId - Zone identifier to validate
 * @returns {boolean}
 */
export function validateZoneId(zoneId) {
  return /^[a-zA-Z][a-zA-Z0-9_-]{0,30}$/.test(zoneId);
}

/**
 * Validate a stadium gate identifier (A–H only).
 *
 * @param {string} gate - Gate letter to validate
 * @returns {boolean}
 */
export function validateGate(gate) {
  return /^[A-H]$/i.test(gate);
}

/**
 * Clamp a numeric value to the inclusive range [min, max].
 *
 * @param {number} value - Value to clamp
 * @param {number} min - Lower bound
 * @param {number} max - Upper bound
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Validate an API key format and detect potential credential leaks.
 *
 * Checks for known provider prefixes (Google AIza*, OpenAI sk-*,
 * Stripe pk_*, GOOG*) that would indicate a real secret was
 * accidentally embedded in client-side code.
 *
 * @param {string} key - Potential API key string
 * @returns {{ valid: boolean, exposed: boolean }}
 */
export function validateApiKey(key) {
  if (!key || typeof key !== 'string') return { valid: false, exposed: false };
  // Check if it looks like a real API key (potential leak)
  const looksReal = /^(AIza|sk-|pk_|GOOG)[A-Za-z0-9_-]{20,}$/.test(key);
  return { valid: key.length >= 10, exposed: looksReal };
}

/**
 * Create a sliding-window rate limiter.
 *
 * Tracks call timestamps in a FIFO array and evicts entries older than
 * `windowMs`. New calls are rejected when the window contains ≥ `maxCalls`
 * entries, preventing abuse of API endpoints or chat submissions.
 *
 * @param {number} maxCalls - Maximum calls allowed within the window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {{ check: () => boolean, reset: () => void }}
 */
export function createRateLimiter(maxCalls, windowMs) {
  const calls = [];

  return {
    /**
     * Check if a call is allowed under the rate limit.
     * @returns {boolean} True if the call is permitted
     */
    check() {
      const now = Date.now();
      // Remove expired entries outside the sliding window
      while (calls.length > 0 && calls[0] < now - windowMs) {
        calls.shift();
      }
      if (calls.length >= maxCalls) return false;
      calls.push(now);
      return true;
    },
    /** Reset the limiter, clearing all tracked calls. */
    reset() {
      calls.length = 0;
    },
  };
}
