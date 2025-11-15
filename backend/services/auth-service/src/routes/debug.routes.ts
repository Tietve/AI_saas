/**
 * Debug routes for testing error tracking
 * Only available in development
 */

import { Router } from 'express';
import { captureException, captureMessage } from '@saas/shared/dist/config';

const router = Router();

// Only enable in development
if (process.env.NODE_ENV !== 'production') {
  /**
   * Test endpoint - throws an error
   * GET /api/debug/error
   */
  router.get('/error', (req, res, next) => {
    const error = new Error('Test error from auth-service');
    (error as any).status = 500;
    next(error);
  });

  /**
   * Test endpoint - throws 404
   * GET /api/debug/not-found
   */
  router.get('/not-found', (req, res, next) => {
    const error = new Error('Test 404 error');
    (error as any).status = 404;
    next(error);
  });

  /**
   * Test endpoint - uncaught exception
   * GET /api/debug/uncaught
   */
  router.get('/uncaught', (req, res) => {
    throw new Error('Uncaught exception test');
  });

  /**
   * Test endpoint - manual capture
   * GET /api/debug/manual-error
   */
  router.get('/manual-error', (req, res) => {
    try {
      throw new Error('Manual error capture test');
    } catch (error) {
      captureException(error as Error, {
        route: '/api/debug/manual-error',
        user: 'test-user',
      });
      res.json({ message: 'Error captured manually' });
    }
  });

  /**
   * Test endpoint - capture message
   * GET /api/debug/message
   */
  router.get('/message', (req, res) => {
    captureMessage('Test message from auth-service', 'info');
    res.json({ message: 'Message sent to Sentry' });
  });

  /**
   * List all debug endpoints
   * GET /api/debug
   */
  router.get('/', (req, res) => {
    res.json({
      message: 'Debug endpoints (development only)',
      endpoints: [
        { path: '/api/debug/error', description: 'Throws a 500 error' },
        { path: '/api/debug/not-found', description: 'Throws a 404 error' },
        { path: '/api/debug/uncaught', description: 'Throws uncaught exception' },
        { path: '/api/debug/manual-error', description: 'Manually captures error' },
        { path: '/api/debug/message', description: 'Sends info message to Sentry' },
      ],
    });
  });
}

export default router;
