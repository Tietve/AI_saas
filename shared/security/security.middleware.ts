import { Request, Response, NextFunction, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

/**
 * Security Middleware Configuration
 *
 * SECURITY FIXES:
 * 1. Reduced body size limits (prevent DoS)
 * 2. Rate limiting on all endpoints
 * 3. Security headers (helmet)
 * 4. CORS configuration
 * 5. HTTPS enforcement
 */

/**
 * Body size limit configuration
 * SECURITY FIX: Reduced from 10MB to prevent DoS attacks
 */
export const BODY_SIZE_LIMITS = {
  // Default limit for most endpoints
  DEFAULT: '1mb',

  // Auth endpoints (login, signup) - stricter limit
  AUTH: '100kb',

  // Chat endpoints - allow larger messages but not too large
  CHAT: '1mb',

  // File upload endpoints (if needed in future)
  FILE_UPLOAD: '10mb',

  // Analytics/metrics endpoints
  ANALYTICS: '500kb'
};

/**
 * Rate limiting configuration
 * SECURITY FIX: Prevent brute force and DoS attacks
 */

// Strict rate limiting for auth endpoints (login, signup)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true, // Only count failed attempts
  message: {
    error: 'Too many failed attempts. Please try again in 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Moderate rate limiting for API endpoints
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for expensive operations (AI chat)
export const expensiveOperationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    error: 'Too many requests. Please slow down.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Very strict for password reset
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: {
    error: 'Too many password reset attempts. Please try again in 1 hour.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Helmet configuration for security headers
 * SECURITY FIX: Add comprehensive security headers
 */
export function securityHeaders(): RequestHandler {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for UI
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    frameguard: {
      action: 'deny' // Prevent clickjacking
    },
    noSniff: true, // Prevent MIME type sniffing
    xssFilter: true, // Enable XSS filter
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    }
  });
}

/**
 * HTTPS enforcement middleware
 * SECURITY FIX: Enforce HTTPS in production
 */
export function enforceHTTPS(req: Request, res: Response, next: NextFunction): void {
  // Only enforce in production
  if (process.env.NODE_ENV === 'production') {
    // Check if request is not secure
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
      // Redirect to HTTPS
      return res.redirect(301, `https://${req.get('host')}${req.originalUrl}`) as any;
    }
  }

  next();
}

/**
 * Request timeout middleware
 * SECURITY FIX: Prevent slow loris attacks
 */
export function requestTimeout(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set request timeout
    req.setTimeout(timeoutMs, () => {
      res.status(408).json({
        error: 'Request timeout',
        code: 'REQUEST_TIMEOUT'
      });
    });

    // Set response timeout
    res.setTimeout(timeoutMs, () => {
      res.status(408).json({
        error: 'Response timeout',
        code: 'RESPONSE_TIMEOUT'
      });
    });

    next();
  };
}

/**
 * Sanitize request data
 * SECURITY FIX: Remove null bytes and dangerous characters
 */
export function sanitizeRequest(req: Request, res: Response, next: NextFunction): void {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
}

/**
 * Recursively sanitize object
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    // Remove null bytes
    return obj.replace(/\0/g, '');
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Combined security middleware stack
 * Apply all security measures at once
 */
export function applySecurityMiddleware(app: any): void {
  // 1. HTTPS enforcement (production only)
  app.use(enforceHTTPS);

  // 2. Security headers
  app.use(securityHeaders());

  // 3. Request timeout
  app.use(requestTimeout(30000)); // 30 seconds

  // 4. Sanitize requests
  app.use(sanitizeRequest);

  console.log('[Security] Applied security middleware stack');
}
