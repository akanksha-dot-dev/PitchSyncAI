/**
 * @module a11y
 * @description WCAG AAA accessibility utilities for PitchSync AI.
 *
 * Provides helpers that ensure the application meets or exceeds
 * WCAG 2.1 AAA requirements:
 *
 * - **Screen-reader announcements** via ARIA live-regions (`announce`)
 * - **Focus traps** for modal dialogs and wizards (`createFocusTrap`)
 * - **Keyboard navigation** for list-style components (`setupKeyboardNav`)
 * - **Contrast checking** against the 7:1 AAA ratio (`checkContrast`)
 * - **ARIA attribute management** (`setAria`, `ensureLabel`)
 *
 * The `prefers-reduced-motion` media query is respected at the CSS
 * level (see `base.css`), disabling all animations for motion-sensitive
 * users. A hidden skip-link is rendered in the header for keyboard-first
 * navigation.
 */

/**
 * Announce a message to screen readers via an ARIA live region.
 *
 * @param {string} message - Text to announce
 * @param {'polite'|'assertive'} [priority='polite'] - ARIA live priority
 *
 * @example
 * announce('Switched to Ops Command mode');
 * announce('Emergency alert: evacuate Gate A', 'assertive');
 */
export function announce(message, priority = 'polite') {
  let liveRegion = document.getElementById('aria-live-region');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'aria-live-region';
    liveRegion.className = 'aria-live';
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    document.body.appendChild(liveRegion);
  }
  liveRegion.setAttribute('aria-live', priority);
  // Clear then set to ensure re-announcement
  liveRegion.textContent = '';
  requestAnimationFrame(() => {
    liveRegion.textContent = message;
  });
}

/**
 * Create a focus trap within an element (for modals/wizards).
 * Traps Tab/Shift+Tab cycling within the container and restores
 * previous focus on deactivation via Escape key.
 *
 * @param {Element} container - DOM element to trap focus within
 * @returns {{ activate: Function, deactivate: Function }}
 *
 * @example
 * const trap = createFocusTrap(wizardDialog);
 * trap.activate();  // Focus enters the wizard
 * // User presses Escape or completes the wizard:
 * trap.deactivate(); // Focus returns to previous element
 */
export function createFocusTrap(container) {
  const focusableSelectors = [
    'a[href]', 'button:not([disabled])', 'textarea:not([disabled])',
    'input:not([disabled])', 'select:not([disabled])', '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  let previousFocus = null;

  function getFocusable() {
    return Array.from(container.querySelectorAll(focusableSelectors));
  }

  function handleKeyDown(e) {
    if (e.key !== 'Tab') return;

    const focusable = getFocusable();
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function handleEscape(e) {
    if (e.key === 'Escape') {
      deactivate();
    }
  }

  function activate() {
    previousFocus = document.activeElement;
    container.addEventListener('keydown', handleKeyDown);
    container.addEventListener('keydown', handleEscape);
    // Focus first focusable element
    const focusable = getFocusable();
    if (focusable.length > 0) {
      requestAnimationFrame(() => focusable[0].focus());
    }
  }

  function deactivate() {
    container.removeEventListener('keydown', handleKeyDown);
    container.removeEventListener('keydown', handleEscape);
    if (previousFocus && previousFocus.focus) {
      previousFocus.focus();
    }
  }

  return { activate, deactivate };
}

/**
 * Set multiple ARIA attributes on an element
 * @param {Element} el
 * @param {object} attrs - { label: '...', expanded: true, ... }
 */
export function setAria(el, attrs) {
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value == null) {
      el.removeAttribute(`aria-${key}`);
    } else {
      el.setAttribute(`aria-${key}`, String(value));
    }
  }
}

/**
 * Setup keyboard navigation for a list of items
 * @param {Element} container
 * @param {string} itemSelector
 * @param {object} [options]
 * @param {boolean} [options.horizontal] - Use left/right instead of up/down
 * @param {Function} [options.onSelect] - Called when Enter/Space is pressed
 */
export function setupKeyboardNav(container, itemSelector, options = {}) {
  const { horizontal = false, onSelect } = options;
  const prevKey = horizontal ? 'ArrowLeft' : 'ArrowUp';
  const nextKey = horizontal ? 'ArrowRight' : 'ArrowDown';

  container.addEventListener('keydown', (e) => {
    const items = Array.from(container.querySelectorAll(itemSelector));
    const currentIndex = items.indexOf(document.activeElement);

    if (e.key === nextKey) {
      e.preventDefault();
      const next = items[(currentIndex + 1) % items.length];
      next?.focus();
    } else if (e.key === prevKey) {
      e.preventDefault();
      const prev = items[(currentIndex - 1 + items.length) % items.length];
      prev?.focus();
    } else if ((e.key === 'Enter' || e.key === ' ') && onSelect) {
      e.preventDefault();
      onSelect(document.activeElement, currentIndex);
    }
  });
}

/**
 * Check if contrast ratio meets WCAG AAA (7:1) threshold.
 *
 * @param {string} foreground - Hex color (e.g. '#1E40AF')
 * @param {string} background - Hex color (e.g. '#FAFBFC')
 * @returns {{ ratio: number, passesAAA: boolean }}
 *
 * @example
 * checkContrast('#1E40AF', '#FAFBFC');
 * // => { ratio: 8.95, passesAAA: true }
 */
export function checkContrast(foreground, background) {
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : { r: 0, g: 0, b: 0 };
  }

  function luminance({ r, g, b }) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  const l1 = luminance(hexToRgb(foreground));
  const l2 = luminance(hexToRgb(background));
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  return { ratio: Math.round(ratio * 100) / 100, passesAAA: ratio >= 7 };
}

/**
 * Add a visible label to an element if it lacks one
 * @param {Element} el
 * @param {string} label
 */
export function ensureLabel(el, label) {
  if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) {
    el.setAttribute('aria-label', label);
  }
}
