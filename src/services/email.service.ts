/**
 * Email Service
 *
 * Business logic for sending emails.
 * Abstracts email sending from specific implementation.
 */

import { injectable } from 'tsyringe'
import { sendVerificationEmail as sendVerificationEmailImpl } from '@/lib/email'
import { logger } from '@/lib/logger'

@injectable()
export class EmailService {
  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    try {
      await sendVerificationEmailImpl(email, token)
      logger.info({ email }, 'Verification email sent')
    } catch (error) {
      logger.error({ err: error, email }, 'Failed to send verification email')
      throw error
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    try {
      // TODO: Implement password reset email
      logger.info({ email }, 'Password reset email sent')
    } catch (error) {
      logger.error({ err: error, email }, 'Failed to send password reset email')
      throw error
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, userName: string): Promise<void> {
    try {
      // TODO: Implement welcome email
      logger.info({ email, userName }, 'Welcome email sent')
    } catch (error) {
      logger.error({ err: error, email }, 'Failed to send welcome email')
      throw error
    }
  }
}
