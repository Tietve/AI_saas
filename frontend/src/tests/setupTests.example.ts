/**
 * Test Setup File Example
 * Copy this to setupTests.ts and customize as needed
 *
 * For Jest: Configure in jest.config.js:
 *   setupFilesAfterEnv: ['<rootDir>/src/tests/setupTests.ts']
 *
 * For Vitest: Configure in vitest.config.ts:
 *   test: { setupFiles: ['./src/tests/setupTests.ts'] }
 */

import { server } from './mocks/server';

// Start MSW server before all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'error', // Fail tests on unhandled requests
  });
});

// Reset handlers after each test to ensure test isolation
afterEach(() => {
  server.resetHandlers();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});

// Optional: Add custom matchers (if using @testing-library/jest-dom)
// import '@testing-library/jest-dom';

// Optional: Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Optional: Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Optional: Suppress console errors during tests (use sparingly!)
// const originalError = console.error;
// beforeAll(() => {
//   console.error = jest.fn();
// });
// afterAll(() => {
//   console.error = originalError;
// });
