import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateUserData {
  email: string;
  emailLower: string;
  passwordHash: string;
  planTier: 'FREE' | 'PLUS' | 'PRO';
  emailVerifiedAt?: Date | null;
}

export class UserRepository {
  /**
   * Find user by email (case-insensitive)
   */
  async findByEmail(email: string): Promise<User | null> {
    const emailLower = email.toLowerCase();
    return prisma.user.findUnique({
      where: { emailLower }
    });
  }

  /**
   * Find user by ID
   */
  async findById(userId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id: userId }
    });
  }

  /**
   * Create new user
   */
  async create(data: CreateUserData): Promise<User> {
    return prisma.user.create({
      data: {
        ...data,
        monthlyTokenUsed: 0
      }
    });
  }

  /**
   * Update email verification timestamp
   */
  async markEmailVerified(userId: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() }
    });
  }

  /**
   * Increment failed login attempts
   */
  async incrementFailedAttempts(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: { increment: 1 },
        lastFailedLoginAt: new Date()
      }
    });
  }

  /**
   * Reset failed login attempts
   */
  async resetFailedAttempts(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lastFailedLoginAt: null
      }
    });
  }

  /**
   * Check if account is locked (5+ failed attempts in last 15 minutes)
   */
  async isAccountLocked(userId: string): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user) return false;

    const lockoutThreshold = 5;
    const lockoutDuration = 15 * 60 * 1000; // 15 minutes

    if (user.failedLoginAttempts >= lockoutThreshold && user.lastFailedLoginAt) {
      const timeSinceLastFail = Date.now() - user.lastFailedLoginAt.getTime();
      return timeSinceLastFail < lockoutDuration;
    }

    return false;
  }
}

export const userRepository = new UserRepository();
