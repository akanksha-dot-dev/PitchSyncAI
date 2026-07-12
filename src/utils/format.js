/**
 * @module format
 * @description Shared text formatting utilities for rendering markdown-like
 * content in chat bubbles, wizard steps, and other rich-text contexts.
 * All formatting is applied **after** XSS sanitization to ensure safety.
 */

import { sanitizeHTML } from './validators.js';

/**
 * Convert markdown-like syntax to safe HTML for display.
 *
 * Processing order:
 * 1. Sanitize raw text via DOM-based escaping (`sanitizeHTML`)
 * 2. Apply cosmetic transforms (bold, line breaks, bullets) on the
 *    already-escaped string so no user content can inject HTML.
 *
 * @param {string} text - Raw text that may contain `**bold**`, newlines, or `• ` bullets.
 * @returns {string} Safe HTML string ready for `innerHTML` insertion.
 *
 * @example
 * formatMarkdown('**Hello** world\n• Item 1');
 * // => '<strong>Hello</strong> world<br>&bull; Item 1'
 */
export function formatMarkdown(text) {
  const safe = sanitizeHTML(text);
  return safe
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/• /g, '&bull; ');
}
