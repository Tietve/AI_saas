import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { userRepository } from '../repositories/user.repository';
import { verificationRepository } from '../repositories/verification.repository';
import { config } from '../config/env';
import { PrismaClient } from '@prisma/client';
import { addEmailJob } from './queue.service';

const prisma = new PrismaClient();

export interface SignupResult {
  success: boolean;
  needsVerification: boolean;
  userId?: string;
  email?: string;
  planTier?: string;
  message: string;
  sessionToken?: string;
}

export interface SigninResult {
  success: boolean;
  userId?: string;
  email?: string;
  planTier?: string;
  sessionToken?: string;
  message: string;
  needsVerification?: boolean;
}

export class AuthService {
  /**
   * Register new user
   */
  async signup(email: string, password: string): Promise<SignupResult> {
    // Validate input
    if (!email || !password) {
      throw new Error('Email và mật khẩu là bắt buộc');
    }

    if (password.length < 8) {
      throw new Error('Mật khẩu phải có ít nhất 8 ký tự');
    }

    const emailLower = email.toLowerCase();

    // Check if user exists
    const existingUser = await userRepository.findByEmail(emailLower);
    if (existingUser) {
      // If user exists and email is verified, reject signup
      if (existingUser.emailVerifiedAt) {
        throw new Error('Email đã được sử dụng');
      }

      // If user exists but email is NOT verified, allow re-registration
      // Delete the old unverified user and let them register again
      console.log(`[signup] Deleting unverified user ${existingUser.email} to allow re-registration`);
      await userRepository.deleteById(existingUser.id);
    }

    // Hash password (10 rounds for development, 12 for production)
    const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Check if email verification is required
    const requireVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';

    // Create user
    const user = await userRepository.create({
      email,
      emailLower,
      passwordHash,
      planTier: 'FREE',
      emailVerifiedAt: requireVerification ? null : new Date()
    });

    if (requireVerification) {
      const { token } = await verificationRepository.createVerificationToken(user.id);

      // Send verification email via queue
      await addEmailJob({
        type: 'verification',
        to: email,
        token
      });

      console.log(`[verification] Verification email queued for ${email}`);

      return {
        success: true,
        needsVerification: true,
        userId: user.id,
        email: user.email,
        planTier: user.planTier,
        message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.'
      };
    } else {
      const sessionToken = this.createSessionToken(user.id, user.email);

      return {
        success: true,
        needsVerification: false,
        userId: user.id,
        email: user.email,
        planTier: user.planTier,
        sessionToken,
        message: 'Đăng ký thành công'
      };
    }
  }

  /**
   * Authenticate user and create session
   */
  async signin(email: string, password: string): Promise<SigninResult> {
    // Validate input
    if (!email || !password) {
      throw new Error('Email và mật khẩu là bắt buộc');
    }

    const emailLower = email.toLowerCase();

    // Find user
    const user = await userRepository.findByEmail(emailLower);
    if (!user) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }

    // Check if account is locked
    const isLocked = await userRepository.isAccountLocked(user.id);
    if (isLocked) {
      throw new Error('Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau 15 phút.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment failed attempts
      await userRepository.incrementFailedAttempts(user.id);
      throw new Error('Email hoặc mật khẩu không đúng');
    }

    // Reset failed attempts on successful login
    await userRepository.resetFailedAttempts(user.id);

    // Check if email is verified
    const requireVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';
    if (requireVerification && !user.emailVerifiedAt) {
      return {
        success: false,
        needsVerification: true,
        message: 'Vui lòng xác thực email trước khi đăng nhập'
      };
    }

    // Create session token
    const sessionToken = this.createSessionToken(user.id, user.email);

    return {
      success: true,
      userId: user.id,
      email: user.email,
      planTier: user.planTier,
      sessionToken,
      message: 'Đăng nhập thành công'
    };
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{ success: boolean; message: string; userId?: string; email?: string; planTier?: string }> {
    const userId = await verificationRepository.verifyEmailToken(token);

    if (!userId) {
      throw new Error('Token không hợp lệ hoặc đã hết hạn');
    }

    await userRepository.markEmailVerified(userId);
    await verificationRepository.deleteVerificationToken(userId);

    // Send welcome email via queue
    const user = await userRepository.findById(userId);
    if (user) {
      await addEmailJob({
        type: 'welcome',
        to: user.email
      });
      console.log(`[verification] Welcome email queued for ${user.email}`);
    }

    return {
      success: true,
      message: 'Email đã được xác thực thành công',
      userId: user?.id,
      email: user?.email,
      planTier: user?.planTier
    };
  }

  /**
   * Request password reset (send email with token)
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const emailLower = email.toLowerCase();
    const user = await userRepository.findByEmail(emailLower);

    if (!user) {
      return {
        success: true,
        message: 'Nếu email tồn tại, link reset password đã được gửi'
      };
    }

    const { token } = await verificationRepository.createPasswordResetToken(user.id);

    // Send password reset email via queue
    await addEmailJob({
      type: 'password-reset',
      to: email,
      token
    });

    console.log(`[password-reset] Password reset email queued for ${email}`);

    return {
      success: true,
      message: 'Nếu email tồn tại, link reset password đã được gửi'
    };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    if (!newPassword || newPassword.length < 8) {
      throw new Error('Mật khẩu mới phải có ít nhất 8 ký tự');
    }

    const userId = await verificationRepository.verifyPasswordResetToken(token);

    if (!userId) {
      throw new Error('Token không hợp lệ hoặc đã hết hạn');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    await verificationRepository.deletePasswordResetToken(userId);

    return {
      success: true,
      message: 'Mật khẩu đã được đổi thành công'
    };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
    const emailLower = email.toLowerCase();
    const user = await userRepository.findByEmail(emailLower);

    if (!user) {
      throw new Error('Email không tồn tại');
    }

    if (user.emailVerifiedAt) {
      throw new Error('Email đã được xác thực rồi');
    }

    const { token } = await verificationRepository.createVerificationToken(user.id);

    // Send verification email via queue
    await addEmailJob({
      type: 'verification',
      to: email,
      token
    });

    console.log(`[resend-verification] Verification email queued for ${email}`);

    return {
      success: true,
      message: 'Email xác thực đã được gửi lại'
    };
  }

  /**
   * Create JWT session token
   */
  private createSessionToken(userId: string, email: string): string {
    // SECURITY: Validate AUTH_SECRET is properly configured
    if (!config.AUTH_SECRET) {
      throw new Error(
        'CRITICAL SECURITY ERROR: AUTH_SECRET environment variable is not set. ' +
        'This is required for JWT token signing. ' +
        'Generate a strong secret with: openssl rand -base64 48'
      );
    }

    if (config.AUTH_SECRET.length < 32) {
      throw new Error(
        'CRITICAL SECURITY ERROR: AUTH_SECRET must be at least 32 characters long. ' +
        'Current length: ' + config.AUTH_SECRET.length + '. ' +
        'Generate a strong secret with: openssl rand -base64 48'
      );
    }

    const secret = config.AUTH_SECRET;
    const expiresIn = '7d';

    return jwt.sign(
      { userId, email },
      secret,
      { expiresIn }
    );
  }

  /**
   * Verify JWT session token
   */
  verifySessionToken(token: string): { userId: string; email: string } | null {
    try {
      // SECURITY: Validate AUTH_SECRET is configured
      if (!config.AUTH_SECRET) {
        throw new Error('AUTH_SECRET is not configured');
      }

      const secret = config.AUTH_SECRET;
      const decoded = jwt.verify(token, secret) as { userId: string; email: string };
      return decoded;
    } catch (error) {
      return null;
    }
  }
}

export const authService = new AuthService();
