/**
 * Auth Routes - Proxy to Backend Auth Service
 *
 * Handles authentication requests with rate limiting and analytics tracking
 */

import { Hono } from 'hono';
import { rateLimitMiddleware } from '../middleware/rate-limit';
import { optionalAuthMiddleware, authMiddleware, invalidateToken } from '../middleware/auth';
import type { Env } from '../types/env';

const auth = new Hono<{ Bindings: Env }>();

/**
 * Register - Create new user account
 *
 * Rate limited to 5 requests per hour per IP
 * Proxies to backend auth-service
 */
auth.post('/register', rateLimitMiddleware('auth/register'), async (c) => {
  try {
    const body = await c.req.json();

    // Validate input
    if (!body.email || !body.password || !body.username) {
      return c.json({
        error: 'Validation Error',
        message: 'Missing required fields: email, password, username',
        code: 'AUTH_010',
      }, 400);
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return c.json({
        error: 'Validation Error',
        message: 'Invalid email format',
        code: 'AUTH_011',
      }, 400);
    }

    // Password validation (min 8 chars)
    if (body.password.length < 8) {
      return c.json({
        error: 'Validation Error',
        message: 'Password must be at least 8 characters',
        code: 'AUTH_012',
      }, 400);
    }

    // Proxy to backend
    const response = await fetch(`${c.env.AUTH_SERVICE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': c.req.header('CF-Connecting-IP') || '',
        'X-Real-IP': c.req.header('CF-Connecting-IP') || '',
        'X-Gateway-Version': '1.0.0',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Track registration in D1 (analytics)
    if (response.ok && data.user) {
      c.executionCtx.waitUntil(
        c.env.DB.prepare(`
          INSERT INTO user_registrations (user_id, email, ip, country, timestamp)
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          data.user.id,
          body.email,
          c.req.header('CF-Connecting-IP') || 'unknown',
          c.req.raw.cf?.country || 'unknown',
          new Date().toISOString()
        ).run()
      );

      // Track analytics event
      c.executionCtx.waitUntil(
        c.env.DB.prepare(`
          INSERT INTO analytics_events (event_type, user_id, data, ip, country, timestamp)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          'signup',
          data.user.id,
          JSON.stringify({ username: body.username }),
          c.req.header('CF-Connecting-IP') || 'unknown',
          c.req.raw.cf?.country || 'unknown',
          new Date().toISOString()
        ).run()
      );
    }

    return c.json(data, response.status);
  } catch (error) {
    console.error('Register error:', error);
    return c.json({
      error: 'Internal Server Error',
      message: 'Registration failed. Please try again.',
      code: 'AUTH_013',
    }, 500);
  }
});

/**
 * Login - Authenticate user
 *
 * Rate limited to 10 requests per 15 minutes per IP
 * Tracks successful/failed attempts in D1
 */
auth.post('/login', rateLimitMiddleware('auth/login'), async (c) => {
  try {
    const body = await c.req.json();

    if (!body.email || !body.password) {
      return c.json({
        error: 'Validation Error',
        message: 'Missing email or password',
        code: 'AUTH_014',
      }, 400);
    }

    // Proxy to backend
    const response = await fetch(`${c.env.AUTH_SERVICE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': c.req.header('CF-Connecting-IP') || '',
        'X-Real-IP': c.req.header('CF-Connecting-IP') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Track login attempt
    c.executionCtx.waitUntil(
      c.env.DB.prepare(`
        INSERT INTO login_attempts (email, success, ip, country, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        body.email,
        response.ok ? 1 : 0,
        c.req.header('CF-Connecting-IP') || 'unknown',
        c.req.raw.cf?.country || 'unknown',
        new Date().toISOString()
      ).run()
    );

    // Track analytics event if successful
    if (response.ok && data.user) {
      c.executionCtx.waitUntil(
        c.env.DB.prepare(`
          INSERT INTO analytics_events (event_type, user_id, data, ip, country, timestamp)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          'login',
          data.user.id,
          JSON.stringify({ success: true }),
          c.req.header('CF-Connecting-IP') || 'unknown',
          c.req.raw.cf?.country || 'unknown',
          new Date().toISOString()
        ).run()
      );
    }

    return c.json(data, response.status);
  } catch (error) {
    console.error('Login error:', error);
    return c.json({
      error: 'Internal Server Error',
      message: 'Login failed. Please try again.',
      code: 'AUTH_015',
    }, 500);
  }
});

/**
 * Logout - Invalidate user session
 *
 * Requires authentication
 * Clears JWT cache in KV
 */
auth.post('/logout', authMiddleware, async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7); // Remove 'Bearer '

    // Invalidate cached JWT in KV
    if (token) {
      await invalidateToken(c.env.KV, token);
    }

    // Proxy to backend for session cleanup
    const response = await fetch(`${c.env.AUTH_SERVICE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader || '',
      },
    });

    const data = await response.json();

    // Track analytics event
    const user = c.get('user');
    if (user) {
      c.executionCtx.waitUntil(
        c.env.DB.prepare(`
          INSERT INTO analytics_events (event_type, user_id, timestamp)
          VALUES (?, ?, ?)
        `).bind(
          'logout',
          user.id,
          new Date().toISOString()
        ).run()
      );
    }

    return c.json(data, response.status);
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({
      error: 'Internal Server Error',
      message: 'Logout failed',
      code: 'AUTH_016',
    }, 500);
  }
});

/**
 * Refresh Token - Get new JWT
 *
 * Uses refresh token from header
 */
auth.post('/refresh', async (c) => {
  try {
    const refreshToken = c.req.header('X-Refresh-Token');

    if (!refreshToken) {
      return c.json({
        error: 'Bad Request',
        message: 'No refresh token provided',
        code: 'AUTH_017',
      }, 400);
    }

    // Proxy to backend
    const response = await fetch(`${c.env.AUTH_SERVICE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'X-Refresh-Token': refreshToken,
      },
    });

    const data = await response.json();
    return c.json(data, response.status);
  } catch (error) {
    console.error('Refresh token error:', error);
    return c.json({
      error: 'Internal Server Error',
      message: 'Token refresh failed',
      code: 'AUTH_018',
    }, 500);
  }
});

/**
 * Verify Token - Check if JWT is valid
 *
 * Useful for frontend to check auth status
 */
auth.get('/verify', authMiddleware, async (c) => {
  const user = c.get('user');

  return c.json({
    valid: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      tier: user.tier,
    },
  });
});

/**
 * Forgot Password - Request password reset
 *
 * Rate limited to 3 requests per hour per IP
 */
auth.post('/forgot-password', rateLimitMiddleware('auth/forgot-password'), async (c) => {
  try {
    const body = await c.req.json();

    if (!body.email) {
      return c.json({
        error: 'Validation Error',
        message: 'Email is required',
        code: 'AUTH_019',
      }, 400);
    }

    // Proxy to backend
    const response = await fetch(`${c.env.AUTH_SERVICE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': c.req.header('CF-Connecting-IP') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Always return success to prevent email enumeration
    return c.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return c.json({
      error: 'Internal Server Error',
      message: 'Password reset request failed',
      code: 'AUTH_020',
    }, 500);
  }
});

/**
 * Reset Password - Set new password with reset token
 */
auth.post('/reset-password', async (c) => {
  try {
    const body = await c.req.json();

    if (!body.token || !body.password) {
      return c.json({
        error: 'Validation Error',
        message: 'Missing token or password',
        code: 'AUTH_021',
      }, 400);
    }

    // Password validation
    if (body.password.length < 8) {
      return c.json({
        error: 'Validation Error',
        message: 'Password must be at least 8 characters',
        code: 'AUTH_022',
      }, 400);
    }

    // Proxy to backend
    const response = await fetch(`${c.env.AUTH_SERVICE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return c.json(data, response.status);
  } catch (error) {
    console.error('Reset password error:', error);
    return c.json({
      error: 'Internal Server Error',
      message: 'Password reset failed',
      code: 'AUTH_023',
    }, 500);
  }
});

/**
 * Get Current User - Fetch user profile
 *
 * Requires authentication
 */
auth.get('/me', authMiddleware, async (c) => {
  try {
    const authHeader = c.req.header('Authorization');

    // Proxy to backend
    const response = await fetch(`${c.env.AUTH_SERVICE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader || '',
      },
    });

    const data = await response.json();
    return c.json(data, response.status);
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user data',
      code: 'AUTH_024',
    }, 500);
  }
});

export default auth;
