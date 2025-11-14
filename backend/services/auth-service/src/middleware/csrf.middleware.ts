import { Request, Response, NextFunction } from 'express';
import { doubleCsrf } from 'csrf-csrf';

/**
 * CSRF Protection Configuration
 * Uses double-submit cookie pattern for stateless CSRF protection
 */
const csrfConfig = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
  getSessionIdentifier: (req) => (req as any).sessionID || req.ip || 'anonymous',
  cookieName: '__Host-csrf-token',
  cookieOptions: {
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    path: '/',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

/**
 * Middleware to protect routes from CSRF attacks
 * Automatically validates CSRF token for POST, PUT, PATCH, DELETE requests
 */
export const csrfProtection = csrfConfig.doubleCsrfProtection;

/**
 * Middleware to generate and send CSRF token to client
 * Use this on routes that render forms or need to provide token to frontend
 */
export const generateCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  const csrfToken = csrfConfig.generateCsrfToken(req, res);

  // Attach token to response locals for access in controllers
  res.locals.csrfToken = csrfToken;

  next();
};

/**
 * Error handler for CSRF token validation failures
 */
export const csrfErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err === csrfConfig.invalidCsrfTokenError) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_TOKEN_INVALID',
        message: 'Invalid or missing CSRF token',
      },
    });
  }

  next(err);
};
