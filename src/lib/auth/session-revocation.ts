/**
 * Session Revocation System
 *
 * Allows immediate logout from all devices or specific sessions.
 * Uses Redis for fast session invalidation (FREE with Upstash!)
 *
 * Features:
 * - Revoke all user sessions
 * - Revoke specific session
 * - Check if session is revoked
 * - List active sessions
 *
 * Cost: $0 (uses existing Upstash Redis)
 */

import { upstash as redis } from '@/lib/redis'
import { logger } from '@/lib/logger'

const SESSION_REVOCATION_PREFIX = 'revoked:session:'
const USER_SESSIONS_PREFIX = 'sessions:user:'

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionId: string): Promise<void> {
  if (!redis) {
    logger.warn('Redis not available, session revocation disabled')
    return
  }

  try {
    // Mark session as revoked (keep for 7 days)
    await redis.setex(`${SESSION_REVOCATION_PREFIX}${sessionId}`, 604800, '1')

    logger.info({ sessionId }, 'Session revoked')
  } catch (error) {
    logger.error({ err: error, sessionId }, 'Failed to revoke session')
    throw error
  }
}

/**
 * Revoke all sessions for a user
 */
export async function revokeAllUserSessions(userId: string): Promise<number> {
  if (!redis) {
    logger.warn('Redis not available, session revocation disabled')
    return 0
  }

  try {
    // Get all user sessions
    const sessionIds = await redis.smembers(`${USER_SESSIONS_PREFIX}${userId}`)
    const sessionArray = (sessionIds as string[]) || []

    if (!sessionArray || sessionArray.length === 0) {
      logger.info({ userId }, 'No active sessions found')
      return 0
    }

    // Revoke each session
    const revokePromises = sessionArray.map((sessionId) =>
      redis!.setex(`${SESSION_REVOCATION_PREFIX}${sessionId}`, 604800, '1')
    )

    await Promise.all(revokePromises)

    // Clear user sessions list
    await redis.del(`${USER_SESSIONS_PREFIX}${userId}`)

    logger.info({ userId, count: sessionArray.length }, 'All user sessions revoked')

    return sessionArray.length
  } catch (error) {
    logger.error({ err: error, userId }, 'Failed to revoke user sessions')
    throw error
  }
}

/**
 * Check if session is revoked
 */
export async function isSessionRevoked(sessionId: string): Promise<boolean> {
  if (!redis) {
    return false // Fail open if Redis unavailable
  }

  try {
    const revoked = await redis.get(`${SESSION_REVOCATION_PREFIX}${sessionId}`)
    return revoked === '1'
  } catch (error) {
    logger.error({ err: error, sessionId }, 'Failed to check session revocation')
    return false // Fail open
  }
}

/**
 * Track active session for user
 */
export async function trackUserSession(
  userId: string,
  sessionId: string
): Promise<void> {
  if (!redis) {
    return
  }

  try {
    // Add session to user's active sessions set
    await redis.sadd(`${USER_SESSIONS_PREFIX}${userId}`, sessionId)

    // Set TTL on user sessions list (30 days)
    await redis.expire(`${USER_SESSIONS_PREFIX}${userId}`, 2592000)

    logger.debug({ userId, sessionId }, 'Session tracked')
  } catch (error) {
    logger.error({ err: error, userId, sessionId }, 'Failed to track session')
  }
}

/**
 * Remove session from tracking when it expires naturally
 */
export async function untrackUserSession(
  userId: string,
  sessionId: string
): Promise<void> {
  if (!redis) {
    return
  }

  try {
    await redis.srem(`${USER_SESSIONS_PREFIX}${userId}`, sessionId)

    logger.debug({ userId, sessionId }, 'Session untracked')
  } catch (error) {
    logger.error({ err: error, userId, sessionId }, 'Failed to untrack session')
  }
}

/**
 * Get all active sessions for a user
 */
export async function getUserActiveSessions(
  userId: string
): Promise<string[]> {
  if (!redis) {
    return []
  }

  try {
    const sessionIds = await redis.smembers(`${USER_SESSIONS_PREFIX}${userId}`)
    return (sessionIds as string[]) || []
  } catch (error) {
    logger.error({ err: error, userId }, 'Failed to get active sessions')
    return []
  }
}

/**
 * Get count of active sessions for a user
 */
export async function getUserSessionCount(userId: string): Promise<number> {
  if (!redis) {
    return 0
  }

  try {
    const count = await redis.scard(`${USER_SESSIONS_PREFIX}${userId}`)
    return count || 0
  } catch (error) {
    logger.error({ err: error, userId }, 'Failed to get session count')
    return 0
  }
}
