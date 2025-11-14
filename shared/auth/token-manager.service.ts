import { redisCache } from '../cache/redis.client';

/**
 * Token Management Service
 *
 * Handles token blacklisting and refresh token storage using Redis
 *
 * SECURITY IMPROVEMENTS:
 * 1. Token revocation on logout - blacklist in Redis
 * 2. Refresh token storage with TTL
 * 3. Prevent token reuse after refresh
 * 4. Automatic cleanup via Redis TTL
 */

const REDIS_PREFIX = {
  BLACKLIST: 'token:blacklist',
  REFRESH: 'token:refresh'
};

export class TokenManagerService {
  /**
   * Blacklist an access token (on logout)
   * TTL = remaining time until token expiry
   */
  async blacklistToken(token: string, expiresInSeconds: number): Promise<void> {
    try {
      const key = `${token}`;
      // Store token in blacklist with TTL = remaining lifetime
      await redisCache.set(
        key,
        { blacklisted: true, timestamp: Date.now() },
        {
          prefix: REDIS_PREFIX.BLACKLIST,
          ttl: expiresInSeconds
        }
      );

      console.log(`[TokenManager] Token blacklisted with TTL ${expiresInSeconds}s`);
    } catch (error) {
      console.error('[TokenManager] Failed to blacklist token:', error);
      throw error;
    }
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const key = `${token}`;
      const result = await redisCache.get(key, {
        prefix: REDIS_PREFIX.BLACKLIST
      });

      return result !== null;
    } catch (error) {
      console.error('[TokenManager] Failed to check blacklist:', error);
      // Fail open - if Redis is down, allow the request
      // Token expiration will still be enforced by JWT verification
      return false;
    }
  }

  /**
   * Store refresh token in Redis
   * Associates userId with refresh token
   */
  async storeRefreshToken(
    userId: string,
    refreshToken: string,
    expiresInSeconds: number = 7 * 24 * 60 * 60 // 7 days
  ): Promise<void> {
    try {
      const key = `${userId}:${refreshToken}`;
      await redisCache.set(
        key,
        {
          userId,
          createdAt: Date.now(),
          expiresAt: Date.now() + expiresInSeconds * 1000
        },
        {
          prefix: REDIS_PREFIX.REFRESH,
          ttl: expiresInSeconds
        }
      );

      console.log(`[TokenManager] Refresh token stored for user ${userId}`);
    } catch (error) {
      console.error('[TokenManager] Failed to store refresh token:', error);
      throw error;
    }
  }

  /**
   * Verify refresh token exists in Redis
   */
  async verifyRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    try {
      const key = `${userId}:${refreshToken}`;
      const result = await redisCache.get(key, {
        prefix: REDIS_PREFIX.REFRESH
      });

      return result !== null;
    } catch (error) {
      console.error('[TokenManager] Failed to verify refresh token:', error);
      return false;
    }
  }

  /**
   * Revoke refresh token (on logout or after use)
   */
  async revokeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    try {
      const key = `${userId}:${refreshToken}`;
      await redisCache.del(key, {
        prefix: REDIS_PREFIX.REFRESH
      });

      console.log(`[TokenManager] Refresh token revoked for user ${userId}`);
    } catch (error) {
      console.error('[TokenManager] Failed to revoke refresh token:', error);
      throw error;
    }
  }

  /**
   * Revoke all refresh tokens for a user (on password reset, security breach)
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      // Get all refresh tokens for user
      const pattern = `${REDIS_PREFIX.REFRESH}:${userId}:*`;
      const keys = await redisCache.keys(pattern);

      if (keys.length > 0) {
        await Promise.all(
          keys.map(key => redisCache.del(key.replace(`${REDIS_PREFIX.REFRESH}:`, ''), {
            prefix: REDIS_PREFIX.REFRESH
          }))
        );

        console.log(`[TokenManager] Revoked ${keys.length} refresh tokens for user ${userId}`);
      }
    } catch (error) {
      console.error('[TokenManager] Failed to revoke all user tokens:', error);
      throw error;
    }
  }

  /**
   * Calculate remaining TTL for token
   */
  getRemainingTTL(expirationTimestamp: number): number {
    const now = Math.floor(Date.now() / 1000);
    const remaining = expirationTimestamp - now;
    return Math.max(0, remaining);
  }
}

export const tokenManager = new TokenManagerService();
