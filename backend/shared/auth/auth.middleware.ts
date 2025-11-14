import { Request, Response, NextFunction } from 'express';
import { jwtService } from './jwt.utils';
import { tokenManager } from './token-manager.service';

/**
 * Authentication Middleware
 *
 * Verifies JWT tokens and checks blacklist
 *
 * SECURITY IMPROVEMENTS:
 * 1. RS256 verification using public key
 * 2. Check token blacklist (logout revocation)
 * 3. Validate token type (access vs refresh)
 * 4. Better error messages for debugging
 */

// Extend Express Request type to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

export interface AuthMiddlewareOptions {
  required?: boolean; // If false, continues even if token is invalid
  allowRefreshToken?: boolean; // If true, accepts refresh tokens too
}

/**
 * Authentication middleware for protecting routes
 */
export function authMiddleware(options: AuthMiddlewareOptions = { required: true }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract token from Authorization header or cookie
      const token = extractToken(req);

      if (!token) {
        if (options.required) {
          return res.status(401).json({
            success: false,
            error: 'No authentication token provided',
            code: 'NO_TOKEN'
          });
        } else {
          // Token not required, continue without user
          return next();
        }
      }

      // Check if token is blacklisted (revoked on logout)
      const isBlacklisted = await tokenManager.isTokenBlacklisted(token);
      if (isBlacklisted) {
        return res.status(401).json({
          success: false,
          error: 'Token has been revoked. Please login again.',
          code: 'TOKEN_REVOKED'
        });
      }

      // Verify token signature and expiration
      const verified = jwtService.verifyToken(token);

      if (!verified) {
        if (options.required) {
          return res.status(401).json({
            success: false,
            error: 'Invalid or expired token',
            code: 'INVALID_TOKEN'
          });
        } else {
          return next();
        }
      }

      // Validate token type
      if (!options.allowRefreshToken && verified.type !== 'access') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token type. Access token required.',
          code: 'WRONG_TOKEN_TYPE'
        });
      }

      // Attach user data to request
      req.user = {
        userId: verified.userId,
        email: verified.email
      };

      next();
    } catch (error: any) {
      console.error('[AuthMiddleware] Error:', error);

      return res.status(500).json({
        success: false,
        error: 'Authentication failed',
        code: 'AUTH_ERROR'
      });
    }
  };
}

/**
 * Extract token from request
 * Checks Authorization header and cookies
 */
function extractToken(req: Request): string | null {
  // 1. Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 2. Check cookie (session token)
  if (req.cookies && req.cookies.session) {
    return req.cookies.session;
  }

  return null;
}

/**
 * Middleware to require authentication
 */
export const requireAuth = authMiddleware({ required: true });

/**
 * Middleware for optional authentication
 */
export const optionalAuth = authMiddleware({ required: false });

/**
 * Middleware to check refresh token
 */
export const requireRefreshToken = authMiddleware({
  required: true,
  allowRefreshToken: true
});
