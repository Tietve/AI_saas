/**
 * MSW Server Setup for Node.js (Jest/Vitest tests)
 * This sets up the mock server for testing environments
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * Setup MSW server with all handlers
 * This server will intercept network requests during tests
 */
export const server = setupServer(...handlers);

/**
 * Example usage in test setup file (e.g., setupTests.ts):
 *
 * import { server } from './mocks/server';
 *
 * beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
 * afterEach(() => server.resetHandlers());
 * afterAll(() => server.close());
 */
