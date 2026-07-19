import { test } from 'node:test';
import assert from 'node:assert';
import { logger } from '../utils/logger.js';

test('logger methods execute without errors', () => {
  assert.doesNotThrow(() => {
    logger.info('TestModule', 'Informational message', { sample: 1 });
    logger.warn('TestModule', 'Warning message');
    logger.error('TestModule', 'Error message', new Error('Sample error'));
    logger.debug('TestModule', 'Debug message');
  });
});
