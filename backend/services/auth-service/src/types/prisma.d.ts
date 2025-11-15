// Temporary type definitions for Prisma client
// TODO: Replace with actual generated Prisma client

declare module '@prisma/client' {
  export interface User {
    id: string;
    email: string;
    emailLower: string;
    username: string | null;
    passwordHash: string;
    name: string | null;
    avatar: string | null;
    isEmailVerified: boolean;
    emailVerifiedAt: Date | null;
    planTier: string;
    monthlyTokenUsed: number;
    failedLoginAttempts: number;
    lastFailedLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date | null;
  }

  export interface EmailVerificationToken {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    createdAt: Date;
  }

  export interface PasswordResetToken {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    createdAt: Date;
  }

  export class PrismaClient {
    user: any;
    emailVerificationToken: any;
    passwordResetToken: any;
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $transaction: any;
  }
}
