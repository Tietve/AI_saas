/**
 * MSW Browser Setup
 * This sets up the mock service worker for browser environments
 * Useful for Storybook or development mode API mocking
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * Setup MSW worker for browser environments
 * This worker will intercept network requests in the browser
 */
export const worker = setupWorker(...handlers);

/**
 * Example usage in development mode:
 *
 * if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_MOCK_API === 'true') {
 *   const { worker } = await import('./mocks/browser');
 *   worker.start({
 *     onUnhandledRequest: 'bypass',
 *   });
 * }
 */
