import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import logger from '../config/logger.config';
import { sentryService } from '../services/sentry.service';
import { metricsService } from '../services/metrics.service';

/**
 * Rate Limiting Middleware
 * Prevents abuse and protects against DDoS attacks
 */

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again after 15 minutes',
    },
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    logger.warn('[RateLimit] API rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      method: req.method,
    });

    sentryService.captureMessage(
      `Rate limit exceeded for IP ${req.ip}`,
      'warning',
      {
        component: 'rate-limiter',
        metadata: {
          ip: req.ip,
          url: req.url,
          method: req.method,
        },
      }
    );

    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again after 15 minutes',
      },
    });
  },
});

/**
 * Upgrade endpoint rate limiter
 * 60 requests per minute per user/IP
 * More strict due to AI API costs
 */
export const upgradeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: {
    success: false,
    error: {
      code: 'UPGRADE_RATE_LIMIT_EXCEEDED',
      message: 'Too many upgrade requests, please try again in a minute',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use userId if available, otherwise use IP
    const userId = req.body?.userId || (req as any).userId;
    return userId || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    const userId = req.body?.userId || (req as any).userId;

    logger.warn('[RateLimit] Upgrade rate limit exceeded', {
      userId,
      ip: req.ip,
      url: req.url,
    });

    // Track rate limit violations in metrics
    if (userId) {
      metricsService.recordQuotaExceeded('upgrades', userId);
    }

    sentryService.captureMessage(
      `Upgrade rate limit exceeded for user ${userId || req.ip}`,
      'warning',
      {
        component: 'rate-limiter',
        userId,
        metadata: {
          ip: req.ip,
          url: req.url,
        },
      }
    );

    res.status(429).json({
      success: false,
      error: {
        code: 'UPGRADE_RATE_LIMIT_EXCEEDED',
        message: 'Too many upgrade requests, please try again in a minute',
        retryAfter: 60,
      },
    });
  },
});

/**
 * Eval endpoint rate limiter
 * 10 requests per hour per user
 * Eval runs are expensive
 */
export const evalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    error: {
      code: 'EVAL_RATE_LIMIT_EXCEEDED',
      message: 'Too many evaluation requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const userId = req.body?.userId || (req as any).userId;
    return userId || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    const userId = req.body?.userId || (req as any).userId;

    logger.warn('[RateLimit] Eval rate limit exceeded', {
      userId,
      ip: req.ip,
    });

    sentryService.captureMessage(
      `Eval rate limit exceeded for user ${userId || req.ip}`,
      'warning',
      {
        component: 'rate-limiter',
        userId,
        metadata: {
          ip: req.ip,
        },
      }
    );

    res.status(429).json({
      success: false,
      error: {
        code: 'EVAL_RATE_LIMIT_EXCEEDED',
        message: 'Too many evaluation requests, please try again later',
        retryAfter: 3600, // 1 hour
      },
    });
  },
});

/**
 * Authentication rate limiter
 * Protects against brute force attacks
 * 5 failed attempts per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('[RateLimit] Auth rate limit exceeded', {
      ip: req.ip,
      url: req.url,
    });

    sentryService.captureMessage(
      `Auth rate limit exceeded for IP ${req.ip}`,
      'warning',
      {
        component: 'rate-limiter',
        metadata: {
          ip: req.ip,
          url: req.url,
        },
      }
    );

    res.status(429).json({
      success: false,
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts, please try again after 15 minutes',
        retryAfter: 900, // 15 minutes
      },
    });
  },
});

/**
 * Create custom rate limiter
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message: string;
  code: string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      error: {
        code: options.code,
        message: options.message,
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn(`[RateLimit] Custom rate limit exceeded: ${options.code}`, {
        ip: req.ip,
        url: req.url,
      });

      res.status(429).json({
        success: false,
        error: {
          code: options.code,
          message: options.message,
        },
      });
    },
  });
}
