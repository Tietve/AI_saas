/**
 * Account Lockout Protection
 *
 * Prevents brute-force attacks by temporarily locking accounts
 * after multiple failed login attempts.
 *
 * Features:
 * - Lock after 5 failed attempts
 * - 15-minute lockout period
 * - Redis-backed (uses existing Upstash - FREE!)
 * - Automatic unlock after timeout
 */

import { upstash as redis } from '@/lib/redis'
import { logger } from '@/lib/logger'

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION_SECONDS = 900 // 15 minutes
const ATTEMPT_WINDOW_SECONDS = 300 // 5 minutes

/**
 * Record a failed login attempt
 * @param identifier - Email or user ID
 * @returns Whether account is now locked
 */
export async function recordFailedAttempt(identifier: string): Promise<{
  locked: boolean
  attemptsLeft: number
  lockedUntil?: Date
}> {
  if (!redis) {
    // Fallback if Redis not available
    logger.warn('Redis not available, account lockout disabled')
    return { locked: false, attemptsLeft: MAX_ATTEMPTS }
  }

  const key = `lockout:${identifier.toLowerCase()}`

  try {
    // Increment failed attempts
    const attempts = await redis.incr(key)

    // Set expiry on first attempt
    if (attempts === 1) {
      await redis.expire(key, ATTEMPT_WINDOW_SECONDS)
    }

    // Check if account should be locked
    if (attempts >= MAX_ATTEMPTS) {
      // Set lock with longer TTL
      await redis.setex(`lock:${identifier.toLowerCase()}`, LOCKOUT_DURATION_SECONDS, '1')

      const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_SECONDS * 1000)

      logger.warn({
        identifier,
        attempts,
        lockedUntil,
      }, 'Account locked due to too many failed attempts')

      return {
        locked: true,
        attemptsLeft: 0,
        lockedUntil,
      }
    }

    return {
      locked: false,
      attemptsLeft: MAX_ATTEMPTS - attempts,
    }
  } catch (error) {
    logger.error({ err: error, identifier }, 'Failed to record login attempt')
    // Fail open - don't block login if Redis fails
    return { locked: false, attemptsLeft: MAX_ATTEMPTS }
  }
}

/**
 * Check if account is currently locked
 * @param identifier - Email or user ID
 * @returns Lock status and time remaining
 */
export async function isAccountLocked(identifier: string): Promise<{
  locked: boolean
  lockedUntil?: Date
  timeRemaining?: number
}> {
  if (!redis) {
    return { locked: false }
  }

  const lockKey = `lock:${identifier.toLowerCase()}`

  try {
    const ttl = await redis.ttl(lockKey)

    if (ttl > 0) {
      const lockedUntil = new Date(Date.now() + ttl * 1000)

      return {
        locked: true,
        lockedUntil,
        timeRemaining: ttl,
      }
    }

    return { locked: false }
  } catch (error) {
    logger.error({ err: error, identifier }, 'Failed to check account lock')
    // Fail open
    return { locked: false }
  }
}

/**
 * Clear failed attempts after successful login
 * @param identifier - Email or user ID
 */
export async function clearFailedAttempts(identifier: string): Promise<void> {
  if (!redis) return

  const key = `lockout:${identifier.toLowerCase()}`
  const lockKey = `lock:${identifier.toLowerCase()}`

  try {
    await redis.del(key)
    await redis.del(lockKey)

    logger.info({ identifier }, 'Cleared failed login attempts')
  } catch (error) {
    logger.error({ err: error, identifier }, 'Failed to clear login attempts')
  }
}

/**
 * Manually unlock account (for admin use)
 * @param identifier - Email or user ID
 */
export async function unlockAccount(identifier: string): Promise<void> {
  if (!redis) return

  const lockKey = `lock:${identifier.toLowerCase()}`
  const attemptsKey = `lockout:${identifier.toLowerCase()}`

  try {
    await redis.del(lockKey)
    await redis.del(attemptsKey)

    logger.info({ identifier }, 'Account manually unlocked')
  } catch (error) {
    logger.error({ err: error, identifier }, 'Failed to unlock account')
  }
}

/**
 * Get current attempt count
 * @param identifier - Email or user ID
 */
export async function getAttemptCount(identifier: string): Promise<number> {
  if (!redis) return 0

  const key = `lockout:${identifier.toLowerCase()}`

  try {
    const attempts = await redis.get<number>(key)
    return attempts || 0
  } catch (error) {
    logger.error({ err: error, identifier }, 'Failed to get attempt count')
    return 0
  }
}
