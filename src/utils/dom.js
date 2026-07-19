/**
 * @module dom
 * @description Lightweight DOM helper utilities for PitchSync AI.
 *
 * Provides a hyperscript-like `h()` function for declarative element
 * creation, query shortcuts (`$`, `$$`), and animation wrappers that
 * leverage the Web Animations API. No virtual DOM — all helpers produce
 * real `HTMLElement` instances for zero-overhead rendering.
 */

/**
 * Create a DOM element with attributes and children.
 *
 * @param {string} tag - HTML tag name
 * @param {object} [attrs] - Attributes and properties
 * @param  {...(string|Node|Array)} children - Child nodes or text
 * @returns {HTMLElement}
 *
 * @example
 * h('div', { class: 'card', onClick: handleClick },
 *   h('h2', {}, 'Title'),
 *   h('p', {}, 'Body text'),
 * );
 */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className' || key === 'class') {
      el.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(el.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      const event = key.slice(2).toLowerCase();
      el.addEventListener(event, value);
    } else if (key === 'dataset' && typeof value === 'object') {
      Object.assign(el.dataset, value);
    } else if (key === 'innerHTML') {
      el.innerHTML = value;
    } else if (value === true) {
      el.setAttribute(key, '');
    } else if (value !== false && value != null) {
      el.setAttribute(key, String(value));
    }
  }

  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    if (typeof child === 'string' || typeof child === 'number') {
      el.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  }

  return el;
}

/**
 * Query a single element.
 *
 * @param {string} selector - CSS selector
 * @param {Element} [root] - Root element (defaults to document)
 * @returns {Element|null}
 *
 * @example
 * const btn = $('#chat-send-btn');
 */
export function $(selector, root = document) {
  return root.querySelector(selector);
}

/**
 * Query all matching elements as an array.
 *
 * @param {string} selector - CSS selector
 * @param {Element} [root] - Root element (defaults to document)
 * @returns {Element[]}
 *
 * @example
 * const items = $$('.alert-item');
 * items.forEach(item => item.classList.add('seen'));
 */
export function $$(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

/**
 * Mount a component into a parent, clearing existing content
 * @param {Element} parent
 * @param {Element|string} content
 */
export function mount(parent, content) {
  parent.innerHTML = '';
  if (typeof content === 'string') {
    parent.appendChild(document.createTextNode(content));
  } else if (content instanceof Node) {
    parent.appendChild(content);
  }
}

/**
 * Append a child without clearing
 * @param {Element} parent
 * @param {Element} child
 */
export function append(parent, child) {
  parent.appendChild(child);
}

/**
 * Remove an element from the DOM
 * @param {Element} el
 */
export function remove(el) {
  el?.parentNode?.removeChild(el);
}

/**
 * Animate an element using Web Animations API
 * @param {Element} el
 * @param {Keyframe[]} keyframes
 * @param {KeyframeAnimationOptions} options
 * @returns {Animation}
 */
export function animate(el, keyframes, options = {}) {
  const defaults = {
    duration: 250,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    fill: 'forwards',
  };
  return el.animate(keyframes, { ...defaults, ...options });
}

/**
 * Wait for an animation to complete, then run callback
 * @param {Element} el
 * @param {Keyframe[]} keyframes
 * @param {KeyframeAnimationOptions} options
 * @returns {Promise<void>}
 */
export async function animateAsync(el, keyframes, options = {}) {
  const anim = animate(el, keyframes, options);
  await anim.finished;
}

/**
 * Format a timestamp to localized time string
 * @param {number|Date} ts
 * @returns {string}
 */
export function formatTime(ts) {
  const date = ts instanceof Date ? ts : new Date(ts);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format a number with locale
 * @param {number} n
 * @returns {string}
 */
export function formatNumber(n) {
  return new Intl.NumberFormat().format(n);
}

/**
 * Debounce a function — delays execution until after `ms` milliseconds
 * of inactivity. Useful for resize handlers and search-as-you-type.
 *
 * @param {Function} fn - Function to debounce
 * @param {number} [ms=300] - Delay in milliseconds
 * @returns {Function} Debounced wrapper
 *
 * @example
 * const debouncedSearch = debounce(search, 250);
 * input.addEventListener('input', debouncedSearch);
 */
export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Throttle a function — limits execution to once every `ms` milliseconds.
 * Useful for scroll handlers and crowd data refresh.
 *
 * @param {Function} fn - Function to throttle
 * @param {number} [ms=300] - Minimum interval in milliseconds
 * @returns {Function} Throttled wrapper
 *
 * @example
 * const throttledUpdate = throttle(updateHeatmap, 500);
 * crowdStream.on('data', throttledUpdate);
 */
export function throttle(fn, ms = 300) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  };
}

/**
 * Generate a unique ID
 * @param {string} [prefix]
 * @returns {string}
 */
export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
