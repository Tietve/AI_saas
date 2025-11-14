import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

// Global rate limiter
export const globalLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.NODE_ENV === 'production' ? config.RATE_LIMIT_MAX_REQUESTS : 10000, // Very high limit for dev
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 999999, // Temporarily disabled for testing UI changes
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Chat endpoint limiter
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 messages per minute
  message: {
    error: 'Too many chat messages, please slow down.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});
