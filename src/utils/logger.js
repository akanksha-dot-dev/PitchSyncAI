/**
 * @module logger
 * @description Centralized, environment-aware logger for PitchSync AI.
 *
 * Encapsulates console logging behind structured methods (`info`, `warn`, `error`, `debug`)
 * with module tagging and suppression in production environments to maintain
 * clean code standards and prevent console pollution.
 */

const IS_DEV = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';

/**
 * Format a log message with a module tag and timestamp.
 *
 * @param {string} moduleName - Name of the calling module (e.g. 'GenAI', 'State')
 * @param {string} message - Message text
 * @returns {string} Formatted log string
 */
function formatMessage(moduleName, message) {
  const timestamp = new Date().toISOString().slice(11, 19);
  return `[${timestamp}] [${moduleName}] ${message}`;
}

export const logger = {
  /**
   * Log an informational message.
   *
   * @param {string} moduleName - Name of the calling module
   * @param {string} message - Message string
   * @param {...*} args - Additional payload arguments
   */
  info(moduleName, message, ...args) {
    if (IS_DEV) {
      console.info(formatMessage(moduleName, message), ...args);
    }
  },

  /**
   * Log a warning message.
   *
   * @param {string} moduleName - Name of the calling module
   * @param {string} message - Warning message string
   * @param {...*} args - Additional payload arguments
   */
  warn(moduleName, message, ...args) {
    console.warn(formatMessage(moduleName, message), ...args);
  },

  /**
   * Log an error message with error object payload.
   *
   * @param {string} moduleName - Name of the calling module
   * @param {string} message - Error description
   * @param {Error|*} [err] - Exception or error object
   */
  error(moduleName, message, err) {
    if (err) {
      console.error(formatMessage(moduleName, message), err);
    } else {
      console.error(formatMessage(moduleName, message));
    }
  },

  /**
   * Log a debug-level message (development only).
   *
   * @param {string} moduleName - Name of the calling module
   * @param {string} message - Debug message string
   * @param {...*} args - Additional arguments
   */
  debug(moduleName, message, ...args) {
    if (IS_DEV) {
      console.debug(formatMessage(moduleName, message), ...args);
    }
  },
};
