/**
 * MSW Handlers Index
 * Exports all API mock handlers
 */

import { authHandlers } from './auth';
import { chatHandlers } from './chat';
import { billingHandlers } from './billing';

/**
 * All MSW handlers for API mocking
 * These handlers will intercept HTTP requests matching the defined patterns
 */
export const handlers = [
  ...authHandlers,
  ...chatHandlers,
  ...billingHandlers,
];

// Export individual handler groups for selective mocking
export { authHandlers, chatHandlers, billingHandlers };
