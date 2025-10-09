/**
 * Auth Service
 *
 * Business logic for authentication operations.
 * Handles signup, signin, email verification, password resets.
 */

import { injectable, inject } from 'tsyringe'
import { UserRepository } from '@/repositories/user.repository'
import { EmailService } from './email.service'
import * as bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { createSessionCookie } from '@/lib/auth/session'
import { logger } from '@/lib/logger'

export interface SignupInput {
  email: string
  password: string
}

export interface SigninInput {
  email: string
  password: string
}

export interface SignupResult {
  success: boolean
  userId?: string
  needsVerification: boolean
  sessionCookie?: {
    name: string
    value: string
  }
}

export interface SigninResult {
  success: boolean
  userId?: string
  sessionCookie?: {
    name: string
    value: string
  }
  error?: string
}

@injectable()
export class AuthService {
  constructor(
    @inject(UserRepository) private userRepo: UserRepository,
    @inject(EmailService) private emailService: EmailService
  ) {}

  /**
   * Sign up a new user
   */
  async signup(input: SignupInput): Promise<SignupResult> {
    // Validate input
    if (!input.email || !input.password) {
      throw new Error('Email and password are required')
    }

    if (input.password.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }

    // Check if email is already taken
    const emailTaken = await this.userRepo.isEmailTaken(input.email)
    if (emailTaken) {
      throw new Error('Email already in use')
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 12)

    // Check if email verification is required
    const requireVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true'

    // Create user
    const user = await this.userRepo.create({
      email: input.email,
      passwordHash,
      emailVerifiedAt: requireVerification ? null : new Date(),
      planTier: 'FREE',
    })

    logger.info({ userId: user.id, email: input.email }, 'User created')

    if (requireVerification) {
      // Generate verification token
      const rawToken = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      })

      // Send verification email
      await this.emailService.sendVerificationEmail(input.email, rawToken)

      return {
        success: true,
        userId: user.id,
        needsVerification: true,
      }
    }

    // Auto-login if verification not required
    const sessionCookie = await createSessionCookie(user.id, { email: input.email })

    return {
      success: true,
      userId: user.id,
      needsVerification: false,
      sessionCookie,
    }
  }

  /**
   * Sign in an existing user
   */
  async signin(input: SigninInput): Promise<SigninResult> {
    // Find user by email
    const user = await this.userRepo.findByEmail(input.email)

    if (!user) {
      logger.warn({ email: input.email }, 'Sign in attempt with non-existent email')
      throw new Error('Invalid email or password')
    }

    // Verify password
    const passwordValid = await bcrypt.compare(input.password, user.passwordHash)

    if (!passwordValid) {
      logger.warn({ userId: user.id, email: input.email }, 'Sign in attempt with invalid password')
      throw new Error('Invalid email or password')
    }

    // Check if email is verified (if required)
    const requireVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true'
    if (requireVerification && !user.emailVerifiedAt) {
      throw new Error('Email not verified')
    }

    // Create session
    const sessionCookie = await createSessionCookie(user.id, { email: user.email })

    logger.info({ userId: user.id, email: input.email }, 'User signed in')

    return {
      success: true,
      userId: user.id,
      sessionCookie,
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<boolean> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Find token
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    })

    if (!verificationToken) {
      logger.warn({ token: token.substring(0, 8) }, 'Invalid verification token')
      throw new Error('Invalid or expired token')
    }

    // Check expiration
    if (verificationToken.expiresAt < new Date()) {
      logger.warn({ userId: verificationToken.userId }, 'Expired verification token')
      throw new Error('Token expired')
    }

    // Update user
    await this.userRepo.update(verificationToken.userId, {
      emailVerifiedAt: new Date(),
    })

    // Delete token
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    })

    logger.info({ userId: verificationToken.userId }, 'Email verified')

    return true
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepo.findByEmail(email)

    // Don't reveal if email exists or not (security)
    if (!user) {
      logger.info({ email }, 'Password reset requested for non-existent email')
      return
    }

    // Generate reset token
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    })

    // Send reset email
    await this.emailService.sendPasswordResetEmail(email, rawToken)

    logger.info({ userId: user.id }, 'Password reset token sent')
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Find token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    })

    if (!resetToken) {
      throw new Error('Invalid or expired token')
    }

    // Check expiration
    if (resetToken.expiresAt < new Date()) {
      throw new Error('Token expired')
    }

    // Check if already used
    if (resetToken.usedAt) {
      throw new Error('Token already used')
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12)

    // Update user
    await this.userRepo.update(resetToken.userId, {
      // @ts-ignore - passwordHash is not in UpdateUserInput, but we need it
      passwordHash,
    })

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    })

    logger.info({ userId: resetToken.userId }, 'Password reset')

    return true
  }

  /**
   * Resend verification email
   */
  async resendVerification(email: string): Promise<void> {
    const user = await this.userRepo.findByEmail(email)

    if (!user) {
      throw new Error('User not found')
    }

    if (user.emailVerifiedAt) {
      throw new Error('Email already verified')
    }

    // Delete old tokens
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    })

    // Generate new token
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    })

    // Send verification email
    await this.emailService.sendVerificationEmail(email, rawToken)

    logger.info({ userId: user.id }, 'Verification email resent')
  }
}
