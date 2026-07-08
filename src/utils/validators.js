/* ============================================================
   FIFA MatchDay GenAI Nexus — Input Validation & Sanitization
   ============================================================ */

/**
 * Sanitize HTML input to prevent XSS
 * @param {string} input
 * @returns {string}
 */
export function sanitizeHTML(input) {
  if (typeof input !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Validate message length (1-2000 chars)
 * @param {string} msg
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
 * Validate language code (ISO 639-1)
 * @param {string} code
 * @returns {boolean}
 */
export function validateLanguageCode(code) {
  return /^[a-z]{2}(-[A-Z]{2})?$/.test(code);
}

/**
 * Validate zone identifier (e.g., 'A1', 'gate_north', 'section-100')
 * @param {string} zoneId
 * @returns {boolean}
 */
export function validateZoneId(zoneId) {
  return /^[a-zA-Z][a-zA-Z0-9_-]{0,30}$/.test(zoneId);
}

/**
 * Validate gate identifier (A-H)
 * @param {string} gate
 * @returns {boolean}
 */
export function validateGate(gate) {
  return /^[A-H]$/i.test(gate);
}

/**
 * Clamp a number between min and max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Validate API key format (should not be exposed in client)
 * @param {string} key
 * @returns {{ valid: boolean, exposed: boolean }}
 */
export function validateApiKey(key) {
  if (!key || typeof key !== 'string') return { valid: false, exposed: false };
  // Check if it looks like a real API key (potential leak)
  const looksReal = /^(AIza|sk-|pk_|GOOG)[A-Za-z0-9_-]{20,}$/.test(key);
  return { valid: key.length >= 10, exposed: looksReal };
}

/**
 * Rate limiter — prevent abuse of API calls
 * @param {number} maxCalls - Maximum calls allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {{ check: Function, reset: Function }}
 */
export function createRateLimiter(maxCalls, windowMs) {
  const calls = [];

  return {
    /**
     * Check if a call is allowed
     * @returns {boolean}
     */
    check() {
      const now = Date.now();
      // Remove expired entries
      while (calls.length > 0 && calls[0] < now - windowMs) {
        calls.shift();
      }
      if (calls.length >= maxCalls) return false;
      calls.push(now);
      return true;
    },
    reset() {
      calls.length = 0;
    },
  };
}
