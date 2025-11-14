import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { userRepository } from '../repositories/user.repository';
import { verificationRepository } from '../repositories/verification.repository';
import { config } from '../config/env';
import { PrismaClient } from '@prisma/client';
import { addEmailJob } from './queue.service';
import { jwtService } from '../../../../shared/auth/jwt.utils';
import { tokenManager } from '../../../../shared/auth/token-manager.service';

const prisma = new PrismaClient();

export interface SignupResult {
  success: boolean;
  needsVerification: boolean;
  userId?: string;
  email?: string;
  planTier?: string;
  message: string;
  sessionToken?: string; // Deprecated - use accessToken
  accessToken?: string; // NEW: 15-min access token
  refreshToken?: string; // NEW: 7-day refresh token
}

export interface SigninResult {
  success: boolean;
  userId?: string;
  email?: string;
  planTier?: string;
  sessionToken?: string; // Deprecated - use accessToken
  accessToken?: string; // NEW: 15-min access token
  refreshToken?: string; // NEW: 7-day refresh token
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
      throw new Error('Email đã được sử dụng');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

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
      const tokens = await this.createTokens(user.id, user.email);

      return {
        success: true,
        needsVerification: false,
        userId: user.id,
        email: user.email,
        planTier: user.planTier,
        sessionToken: tokens.accessToken, // Backward compat
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
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

    // Create access and refresh tokens
    const tokens = await this.createTokens(user.id, user.email);

    return {
      success: true,
      userId: user.id,
      email: user.email,
      planTier: user.planTier,
      sessionToken: tokens.accessToken, // Backward compat
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
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
   * Create JWT access and refresh tokens
   * SECURITY FIX: 15-min access + 7-day refresh with RS256
   */
  private async createTokens(userId: string, email: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // Generate access token (15 minutes)
    const accessToken = jwtService.generateAccessToken(userId, email);

    // Generate refresh token (7 days)
    const refreshToken = jwtService.generateRefreshToken(userId, email);

    // Store refresh token in Redis with 7-day TTL
    await tokenManager.storeRefreshToken(userId, refreshToken, 7 * 24 * 60 * 60);

    return { accessToken, refreshToken };
  }

  /**
   * Create JWT session token (DEPRECATED - use createTokens instead)
   * Keeping for backward compatibility
   */
  private async createSessionToken(userId: string, email: string): Promise<string> {
    // For backward compatibility, return access token
    const { accessToken } = await this.createTokens(userId, email);
    return accessToken;
  }

  /**
   * Verify JWT session token (uses RS256 public key)
   */
  verifySessionToken(token: string): { userId: string; email: string } | null {
    const verified = jwtService.verifyToken(token);
    if (!verified) return null;

    return {
      userId: verified.userId,
      email: verified.email
    };
  }

  /**
   * Refresh access token using refresh token
   * NEW METHOD for token refresh flow
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  } | null> {
    try {
      // Verify refresh token signature
      const verified = jwtService.verifyToken(refreshToken);

      if (!verified || verified.type !== 'refresh') {
        console.error('[Auth] Invalid refresh token type');
        return null;
      }

      // Check if refresh token exists in Redis
      const isValid = await tokenManager.verifyRefreshToken(
        verified.userId,
        refreshToken
      );

      if (!isValid) {
        console.error('[Auth] Refresh token not found in Redis');
        return null;
      }

      // Revoke old refresh token (prevent reuse)
      await tokenManager.revokeRefreshToken(verified.userId, refreshToken);

      // Generate new access + refresh tokens
      const tokens = await this.createTokens(verified.userId, verified.email);

      console.log(`[Auth] Tokens refreshed for user ${verified.userId}`);

      return tokens;
    } catch (error) {
      console.error('[Auth] Error refreshing token:', error);
      return null;
    }
  }

  /**
   * Logout - revoke tokens
   * NEW METHOD for proper logout with token blacklisting
   */
  async logout(accessToken: string, userId: string): Promise<void> {
    try {
      // Get token expiration to set blacklist TTL
      const exp = jwtService.getTokenExpiration(accessToken);
      if (exp) {
        const ttl = tokenManager.getRemainingTTL(exp);
        // Blacklist access token
        await tokenManager.blacklistToken(accessToken, ttl);
      }

      // Revoke all refresh tokens for user
      await tokenManager.revokeAllUserTokens(userId);

      console.log(`[Auth] User ${userId} logged out successfully`);
    } catch (error) {
      console.error('[Auth] Error during logout:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
