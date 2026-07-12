/**
 * @module events
 * @description Lightweight publish/subscribe event bus with namespace support.
 *
 * Enables decoupled communication between components via named events.
 * Supports:
 * - Direct listeners (`on` / `off`)
 * - One-shot listeners (`once`) that auto-remove after first fire
 * - Namespace wildcards (`fan:*` catches `fan:message`, `fan:typing`)
 *
 * All handler errors are caught and logged so a single failing
 * subscriber never disrupts other listeners.
 */

/** @type {Map<string, Set<Function>>} */
const listeners = new Map();

/** @type {Map<string, Set<Function>>} */
const onceListeners = new Map();

/**
 * Register an event listener
 * @param {string} event - Event name (supports namespacing with ':')
 * @param {Function} handler - Callback
 * @returns {Function} Unsubscribe function
 */
export function on(event, handler) {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event).add(handler);
  return () => off(event, handler);
}

/**
 * Register a one-time event listener
 * @param {string} event
 * @param {Function} handler
 * @returns {Function} Unsubscribe function
 */
export function once(event, handler) {
  if (!onceListeners.has(event)) {
    onceListeners.set(event, new Set());
  }
  onceListeners.get(event).add(handler);
  return () => onceListeners.get(event)?.delete(handler);
}

/**
 * Remove an event listener
 * @param {string} event
 * @param {Function} handler
 */
export function off(event, handler) {
  listeners.get(event)?.delete(handler);
  onceListeners.get(event)?.delete(handler);
}

/**
 * Emit an event with data
 * @param {string} event - Event name
 * @param {*} data - Event payload
 */
export function emit(event, data) {
  // Fire direct listeners
  const handlers = listeners.get(event);
  if (handlers) {
    for (const fn of handlers) {
      try {
        fn(data);
      } catch (err) {
        console.error(`[Events] Handler error for "${event}":`, err);
      }
    }
  }

  // Fire once listeners and remove
  const onceHandlers = onceListeners.get(event);
  if (onceHandlers) {
    for (const fn of onceHandlers) {
      try {
        fn(data);
      } catch (err) {
        console.error(`[Events] Once handler error for "${event}":`, err);
      }
    }
    onceListeners.delete(event);
  }

  // Fire namespace wildcard listeners (e.g., 'fan:*' catches 'fan:message')
  const namespace = event.split(':')[0];
  if (namespace !== event) {
    const wildcardKey = `${namespace}:*`;
    const wildcardHandlers = listeners.get(wildcardKey);
    if (wildcardHandlers) {
      for (const fn of wildcardHandlers) {
        try {
          fn(data, event);
        } catch (err) {
          console.error(`[Events] Wildcard handler error for "${wildcardKey}":`, err);
        }
      }
    }
  }
}

/**
 * Remove all listeners for an event, or all listeners entirely
 * @param {string} [event]
 */
export function removeAll(event) {
  if (event) {
    listeners.delete(event);
    onceListeners.delete(event);
  } else {
    listeners.clear();
    onceListeners.clear();
  }
}

