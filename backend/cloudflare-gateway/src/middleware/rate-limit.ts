/**
 * Rate Limiting Middleware - KV-based
 *
 * Distributed rate limiting using Cloudflare KV
 * Supports endpoint-specific and user-tier based limits
 */

import { Context, Next } from 'hono';
import type { Env } from '../types/env';
import type { AuthUser } from './auth';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxRequests: number;      // Maximum requests allowed
  windowMs: number;          // Time window in milliseconds
  keyPrefix: string;         // KV key prefix
  message?: string;          // Custom error message
}

/**
 * Predefined rate limits for different endpoints
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Auth endpoints (stricter limits)
  'auth/register': {
    maxRequests: 5,
    windowMs: 3600000,     // 5 requests per hour
    keyPrefix: 'rl:register',
    message: 'Too many registration attempts. Please try again in an hour.',
  },
  'auth/login': {
    maxRequests: 10,
    windowMs: 900000,      // 10 requests per 15 minutes
    keyPrefix: 'rl:login',
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  'auth/forgot-password': {
    maxRequests: 3,
    windowMs: 3600000,     // 3 requests per hour
    keyPrefix: 'rl:forgot',
    message: 'Too many password reset requests. Please check your email.',
  },

  // AI endpoints
  'ai/chat': {
    maxRequests: 100,
    windowMs: 3600000,     // 100 requests per hour
    keyPrefix: 'rl:chat',
    message: 'Rate limit exceeded. Please upgrade for more requests.',
  },
  'ai/embeddings': {
    maxRequests: 200,
    windowMs: 3600000,     // 200 requests per hour
    keyPrefix: 'rl:embeddings',
  },

  // RAG endpoints
  'rag/query': {
    maxRequests: 50,
    windowMs: 3600000,     // 50 requests per hour
    keyPrefix: 'rl:rag',
  },
  'rag/upload': {
    maxRequests: 10,
    windowMs: 3600000,     // 10 uploads per hour
    keyPrefix: 'rl:upload',
  },

  // Default (catch-all)
  'default': {
    maxRequests: 200,
    windowMs: 3600000,     // 200 requests per hour
    keyPrefix: 'rl:default',
  },
};

/**
 * User tier-based rate limits
 */
export const TIER_LIMITS: Record<
  'free' | 'pro' | 'enterprise',
  RateLimitConfig
> = {
  free: {
    maxRequests: 100,
    windowMs: 3600000,      // 100 requests per hour
    keyPrefix: 'rl:tier:free',
    message: 'Free tier limit reached. Upgrade to Pro for 10x more requests!',
  },
  pro: {
    maxRequests: 1000,
    windowMs: 3600000,      // 1000 requests per hour
    keyPrefix: 'rl:tier:pro',
  },
  enterprise: {
    maxRequests: 10000,
    windowMs: 3600000,      // 10k requests per hour
    keyPrefix: 'rl:tier:enterprise',
  },
};

/**
 * Rate limit data stored in KV
 */
interface RateLimitData {
  count: number;
  resetAt: number;          // Unix timestamp in milliseconds
}

/**
 * Rate Limiting Middleware - Endpoint-specific
 *
 * @param endpoint - Endpoint name from RATE_LIMITS
 *
 * @example
 * ```ts
 * app.post('/api/auth/login',
 *   rateLimitMiddleware('auth/login'),
 *   async (c) => { ... }
 * );
 * ```
 */
export function rateLimitMiddleware(endpoint: string) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;

    // Get identifier (IP or user ID)
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Real-IP') || 'unknown';
    const user = c.get('user') as AuthUser | undefined;
    const identifier = user?.id || ip;

    // Create KV key
    const key = `${config.keyPrefix}:${identifier}`;
    const now = Date.now();

    try {
      // Get current rate limit data from KV
      const data = await c.env.KV.get<RateLimitData>(key, 'json');

      if (data && data.resetAt > now) {
        // Within time window
        if (data.count >= config.maxRequests) {
          // Rate limit exceeded
          const retryAfter = Math.ceil((data.resetAt - now) / 1000);

          return c.json({
            error: 'Rate Limit Exceeded',
            message: config.message || 'Too many requests. Please try again later.',
            code: 'RATE_LIMIT_001',
            retryAfter,
            limit: config.maxRequests,
            window: config.windowMs / 1000,
            upgrade: user?.tier === 'free' ? {
              message: 'Upgrade to Pro for 10x more requests',
              url: '/api/billing/upgrade',
            } : undefined,
          }, 429, {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.floor(data.resetAt / 1000).toString(),
          });
        }

        // Increment count
        await c.env.KV.put(key, JSON.stringify({
          count: data.count + 1,
          resetAt: data.resetAt,
        }), {
          expirationTtl: Math.ceil((data.resetAt - now) / 1000),
        });

        // Set rate limit headers
        c.header('X-RateLimit-Limit', config.maxRequests.toString());
        c.header('X-RateLimit-Remaining', (config.maxRequests - data.count - 1).toString());
        c.header('X-RateLimit-Reset', Math.floor(data.resetAt / 1000).toString());
      } else {
        // New window or expired window
        const resetAt = now + config.windowMs;

        await c.env.KV.put(key, JSON.stringify({
          count: 1,
          resetAt,
        }), {
          expirationTtl: Math.ceil(config.windowMs / 1000),
        });

        c.header('X-RateLimit-Limit', config.maxRequests.toString());
        c.header('X-RateLimit-Remaining', (config.maxRequests - 1).toString());
        c.header('X-RateLimit-Reset', Math.floor(resetAt / 1000).toString());
      }

      await next();
    } catch (error) {
      console.error('Rate limit error:', error);
      // Fail open - allow request if KV is down
      await next();
    }
  };
}

/**
 * User Tier Rate Limiting Middleware
 *
 * Applies rate limits based on user subscription tier
 * Requires authMiddleware to run first
 *
 * @example
 * ```ts
 * app.post('/api/ai/chat',
 *   authMiddleware,
 *   userTierRateLimitMiddleware(),
 *   async (c) => { ... }
 * );
 * ```
 */
export function userTierRateLimitMiddleware() {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const user = c.get('user') as AuthUser | undefined;

    if (!user) {
      return c.json({
        error: 'Unauthorized',
        message: 'Authentication required for tier-based rate limiting',
        code: 'AUTH_009',
      }, 401);
    }

    const tier = user.tier || 'free';
    const config = TIER_LIMITS[tier];

    const key = `${config.keyPrefix}:${user.id}`;
    const now = Date.now();

    try {
      const data = await c.env.KV.get<RateLimitData>(key, 'json');

      if (data && data.resetAt > now) {
        if (data.count >= config.maxRequests) {
          const retryAfter = Math.ceil((data.resetAt - now) / 1000);

          return c.json({
            error: 'Tier Quota Exceeded',
            message: config.message || `${tier} tier quota exceeded`,
            code: 'RATE_LIMIT_002',
            tier,
            retryAfter,
            limit: config.maxRequests,
            upgrade: tier === 'free' ? {
              message: 'Upgrade to Pro for 10x more requests',
              url: '/api/billing/upgrade',
              pricing: {
                pro: '$19/month - 1,000 requests/hour',
                enterprise: '$99/month - 10,000 requests/hour',
              },
            } : tier === 'pro' ? {
              message: 'Upgrade to Enterprise for 10x more requests',
              url: '/api/billing/upgrade',
            } : undefined,
          }, 429, {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.floor(data.resetAt / 1000).toString(),
          });
        }

        await c.env.KV.put(key, JSON.stringify({
          count: data.count + 1,
          resetAt: data.resetAt,
        }), {
          expirationTtl: Math.ceil((data.resetAt - now) / 1000),
        });

        c.header('X-RateLimit-Limit', config.maxRequests.toString());
        c.header('X-RateLimit-Remaining', (config.maxRequests - data.count - 1).toString());
        c.header('X-RateLimit-Reset', Math.floor(data.resetAt / 1000).toString());
        c.header('X-RateLimit-Tier', tier);
      } else {
        const resetAt = now + config.windowMs;

        await c.env.KV.put(key, JSON.stringify({
          count: 1,
          resetAt,
        }), {
          expirationTtl: Math.ceil(config.windowMs / 1000),
        });

        c.header('X-RateLimit-Limit', config.maxRequests.toString());
        c.header('X-RateLimit-Remaining', (config.maxRequests - 1).toString());
        c.header('X-RateLimit-Reset', Math.floor(resetAt / 1000).toString());
        c.header('X-RateLimit-Tier', tier);
      }

      await next();
    } catch (error) {
      console.error('Tier rate limit error:', error);
      await next();
    }
  };
}

/**
 * IP-based Rate Limiting (for public endpoints)
 *
 * @example
 * ```ts
 * app.get('/api/public/data',
 *   ipRateLimitMiddleware(100, 3600000),  // 100 req/hour
 *   async (c) => { ... }
 * );
 * ```
 */
export function ipRateLimitMiddleware(
  maxRequests: number = 100,
  windowMs: number = 3600000
) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Real-IP') || 'unknown';
    const key = `rl:ip:${ip}`;
    const now = Date.now();

    try {
      const data = await c.env.KV.get<RateLimitData>(key, 'json');

      if (data && data.resetAt > now) {
        if (data.count >= maxRequests) {
          const retryAfter = Math.ceil((data.resetAt - now) / 1000);

          return c.json({
            error: 'Rate Limit Exceeded',
            message: 'Too many requests from this IP. Please try again later.',
            code: 'RATE_LIMIT_003',
            retryAfter,
          }, 429, {
            'Retry-After': retryAfter.toString(),
          });
        }

        await c.env.KV.put(key, JSON.stringify({
          count: data.count + 1,
          resetAt: data.resetAt,
        }), {
          expirationTtl: Math.ceil((data.resetAt - now) / 1000),
        });
      } else {
        const resetAt = now + windowMs;

        await c.env.KV.put(key, JSON.stringify({
          count: 1,
          resetAt,
        }), {
          expirationTtl: Math.ceil(windowMs / 1000),
        });
      }

      await next();
    } catch (error) {
      console.error('IP rate limit error:', error);
      await next();
    }
  };
}

/**
 * Check remaining rate limit quota
 *
 * Useful for frontend to display usage
 */
export async function getRateLimitStatus(
  kv: KVNamespace,
  identifier: string,
  config: RateLimitConfig
): Promise<{
  limit: number;
  remaining: number;
  resetAt: number;
}> {
  const key = `${config.keyPrefix}:${identifier}`;
  const data = await kv.get<RateLimitData>(key, 'json');
  const now = Date.now();

  if (!data || data.resetAt <= now) {
    return {
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
    };
  }

  return {
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - data.count),
    resetAt: data.resetAt,
  };
}
