/**
 * Auth Middleware - JWT Verification
 *
 * Verifies JWT tokens from Authorization header
 * Caches valid tokens in KV for performance
 */

import { Context, Next } from 'hono';
import * as jose from 'jose';
import type { Env } from '../types/env';

/**
 * Authenticated user data attached to context
 */
export interface AuthUser {
  id: string;
  email: string;
  role: string;
  workspaceId?: string;
  tier?: 'free' | 'pro' | 'enterprise';
}

/**
 * JWT Payload structure (from backend auth-service)
 */
interface JWTPayload {
  sub: string;                    // User ID
  email: string;
  role: string;
  workspaceId?: string;
  tier?: string;
  iat: number;                    // Issued at
  exp: number;                    // Expiration
}

/**
 * Auth Middleware - Required
 *
 * Verifies JWT and blocks unauthenticated requests
 *
 * @example
 * ```ts
 * app.post('/api/chat', authMiddleware, async (c) => {
 *   const user = c.get('user');
 *   // user is guaranteed to exist
 * });
 * ```
 */
export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header',
      code: 'AUTH_001',
    }, 401);
  }

  const token = authHeader.substring(7); // Remove 'Bearer '

  try {
    // Try to get cached user data from KV
    const cacheKey = `jwt:${token.substring(0, 16)}`; // Use token prefix as key
    const cached = await c.env.KV.get(cacheKey, 'json');

    if (cached) {
      // Cache hit - attach user to context
      c.set('user', cached as AuthUser);
      await next();
      return;
    }

    // Cache miss - verify JWT
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify<JWTPayload>(token, secret);

    // Extract user data
    const user: AuthUser = {
      id: payload.sub || '',
      email: payload.email || '',
      role: payload.role || 'user',
      workspaceId: payload.workspaceId,
      tier: (payload.tier as any) || 'free',
    };

    // Cache user data (TTL = token expiry or 15 minutes)
    const ttl = payload.exp
      ? Math.max(0, payload.exp - Math.floor(Date.now() / 1000))
      : 900; // 15 minutes default

    if (ttl > 0) {
      await c.env.KV.put(cacheKey, JSON.stringify(user), {
        expirationTtl: Math.min(ttl, 900), // Max 15 minutes cache
      });
    }

    // Attach user to context
    c.set('user', user);

    await next();
  } catch (error) {
    console.error('JWT verification failed:', error);

    // Determine error type
    let message = 'Invalid token';
    let code = 'AUTH_002';

    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        message = 'Token expired';
        code = 'AUTH_003';
      } else if (error.message.includes('signature')) {
        message = 'Invalid token signature';
        code = 'AUTH_004';
      }
    }

    return c.json({
      error: 'Unauthorized',
      message,
      code,
    }, 401);
  }
}

/**
 * Optional Auth Middleware
 *
 * Attempts to verify JWT but doesn't block if missing/invalid
 * Useful for endpoints that work for both authenticated and anonymous users
 *
 * @example
 * ```ts
 * app.get('/api/public-data', optionalAuthMiddleware, async (c) => {
 *   const user = c.get('user'); // May be undefined
 *   if (user) {
 *     // Return personalized data
 *   } else {
 *     // Return public data
 *   }
 * });
 * ```
 */
export async function optionalAuthMiddleware(
  c: Context<{ Bindings: Env }>,
  next: Next
) {
  const authHeader = c.req.header('Authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      // Try cache first
      const cacheKey = `jwt:${token.substring(0, 16)}`;
      const cached = await c.env.KV.get(cacheKey, 'json');

      if (cached) {
        c.set('user', cached as AuthUser);
      } else {
        // Verify JWT
        const secret = new TextEncoder().encode(c.env.JWT_SECRET);
        const { payload } = await jose.jwtVerify<JWTPayload>(token, secret);

        const user: AuthUser = {
          id: payload.sub || '',
          email: payload.email || '',
          role: payload.role || 'user',
          workspaceId: payload.workspaceId,
          tier: (payload.tier as any) || 'free',
        };

        const ttl = payload.exp
          ? Math.max(0, payload.exp - Math.floor(Date.now() / 1000))
          : 900;

        if (ttl > 0) {
          await c.env.KV.put(cacheKey, JSON.stringify(user), {
            expirationTtl: Math.min(ttl, 900),
          });
        }

        c.set('user', user);
      }
    } catch (error) {
      // Silently fail - user will be undefined
      console.warn('Optional auth failed:', error);
    }
  }

  await next();
}

/**
 * Role-based Access Control Middleware
 *
 * Requires specific roles to access endpoint
 *
 * @example
 * ```ts
 * app.delete('/api/admin/users/:id',
 *   authMiddleware,
 *   requireRole('admin'),
 *   async (c) => {
 *     // Only admins can access this
 *   }
 * );
 * ```
 */
export function requireRole(...roles: string[]) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const user = c.get('user') as AuthUser | undefined;

    if (!user) {
      return c.json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'AUTH_005',
      }, 401);
    }

    if (!roles.includes(user.role)) {
      return c.json({
        error: 'Forbidden',
        message: `Requires role: ${roles.join(' or ')}`,
        code: 'AUTH_006',
      }, 403);
    }

    await next();
  };
}

/**
 * Tier-based Access Control Middleware
 *
 * Requires specific subscription tier
 *
 * @example
 * ```ts
 * app.post('/api/ai/gpt4',
 *   authMiddleware,
 *   requireTier('pro', 'enterprise'),
 *   async (c) => {
 *     // Only pro/enterprise users can access GPT-4
 *   }
 * );
 * ```
 */
export function requireTier(...tiers: Array<'free' | 'pro' | 'enterprise'>) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const user = c.get('user') as AuthUser | undefined;

    if (!user) {
      return c.json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'AUTH_007',
      }, 401);
    }

    const userTier = user.tier || 'free';

    if (!tiers.includes(userTier)) {
      return c.json({
        error: 'Forbidden',
        message: `This feature requires ${tiers.join(' or ')} tier`,
        code: 'AUTH_008',
        upgrade: userTier === 'free' ? {
          message: 'Upgrade to Pro for access to advanced features',
          url: '/api/billing/upgrade',
        } : undefined,
      }, 403);
    }

    await next();
  };
}

/**
 * Invalidate cached JWT
 *
 * Call this when user logs out or token is revoked
 */
export async function invalidateToken(
  kv: KVNamespace,
  token: string
): Promise<void> {
  const cacheKey = `jwt:${token.substring(0, 16)}`;
  await kv.delete(cacheKey);
}
