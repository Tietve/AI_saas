import { PrismaClient, EmailVerificationToken } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class VerificationRepository {
  /**
   * Create email verification token
   */
  async createVerificationToken(userId: string): Promise<{ token: string; tokenHash: string }> {
    // Delete any existing tokens for this user
    await prisma.emailVerificationToken.deleteMany({
      where: { userId }
    });

    // Generate new token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt
      }
    });

    return { token: rawToken, tokenHash };
  }

  /**
   * Verify email token and return userId if valid
   */
  async verifyEmailToken(token: string): Promise<string | null> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const record = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash }
    });

    if (!record) {
      return null;
    }

    // Check if expired
    if (record.expiresAt < new Date()) {
      await prisma.emailVerificationToken.delete({
        where: { tokenHash }
      });
      return null;
    }

    return record.userId;
  }

  /**
   * Delete verification token after successful verification
   */
  async deleteVerificationToken(userId: string): Promise<void> {
    await prisma.emailVerificationToken.deleteMany({
      where: { userId }
    });
  }

  /**
   * Create password reset token
   */
  async createPasswordResetToken(userId: string): Promise<{ token: string; tokenHash: string }> {
    // Delete any existing reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId }
    });

    // Generate new token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes

    await prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt
      }
    });

    return { token: rawToken, tokenHash };
  }

  /**
   * Verify password reset token and return userId if valid
   */
  async verifyPasswordResetToken(token: string): Promise<string | null> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash }
    });

    if (!record) {
      return null;
    }

    // Check if expired
    if (record.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({
        where: { tokenHash }
      });
      return null;
    }

    return record.userId;
  }

  /**
   * Delete password reset token after successful reset
   */
  async deletePasswordResetToken(userId: string): Promise<void> {
    await prisma.passwordResetToken.deleteMany({
      where: { userId }
    });
  }
}

export const verificationRepository = new VerificationRepository();
