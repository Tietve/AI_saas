import { AuthService, SignupResult, SigninResult } from '../../src/services/auth.service';
import { userRepository } from '../../src/repositories/user.repository';
import { verificationRepository } from '../../src/repositories/verification.repository';
import { addEmailJob } from '../../src/services/queue.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/repositories/verification.repository');
jest.mock('../../src/services/queue.service');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      update: jest.fn(),
    },
  })),
}));

// Mock config
jest.mock('../../src/config/env', () => ({
  config: {
    AUTH_SECRET: 'test-secret-with-at-least-32-characters-for-security',
  },
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();

    // Set default environment
    process.env.REQUIRE_EMAIL_VERIFICATION = 'false';
    process.env.NODE_ENV = 'test';
  });

  describe('signup', () => {
    it('should successfully register a new user without verification', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        planTier: 'FREE',
        emailVerifiedAt: new Date(),
      };

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (userRepository.create as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (jwt.sign as jest.Mock).mockReturnValue('session-token-123');

      const result = await authService.signup('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.needsVerification).toBe(false);
      expect(result.userId).toBe('user-123');
      expect(result.sessionToken).toBe('session-token-123');
      expect(userRepository.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        emailLower: 'test@example.com',
        passwordHash: 'hashed-password',
        planTier: 'FREE',
        emailVerifiedAt: expect.any(Date),
      });
    });

    it('should successfully register with email verification required', async () => {
      process.env.REQUIRE_EMAIL_VERIFICATION = 'true';

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        planTier: 'FREE',
        emailVerifiedAt: null,
      };

      const mockVerification = {
        token: 'verification-token-123',
      };

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (userRepository.create as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (verificationRepository.createVerificationToken as jest.Mock).mockResolvedValue(
        mockVerification
      );
      (addEmailJob as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.signup('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.needsVerification).toBe(true);
      expect(result.userId).toBe('user-123');
      expect(result.sessionToken).toBeUndefined();
      expect(verificationRepository.createVerificationToken).toHaveBeenCalledWith('user-123');
      expect(addEmailJob).toHaveBeenCalledWith({
        type: 'verification',
        to: 'test@example.com',
        token: 'verification-token-123',
      });
    });

    it('should throw error for duplicate email with verified account', async () => {
      const existingUser = {
        id: 'user-existing',
        email: 'existing@example.com',
        emailVerifiedAt: new Date(),
      };

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(existingUser);

      await expect(authService.signup('existing@example.com', 'password123')).rejects.toThrow(
        'Email đã được sử dụng'
      );
    });

    it('should delete unverified user and allow re-registration', async () => {
      const existingUser = {
        id: 'user-unverified',
        email: 'test@example.com',
        emailVerifiedAt: null,
      };

      const newUser = {
        id: 'user-new',
        email: 'test@example.com',
        planTier: 'FREE',
        emailVerifiedAt: new Date(),
      };

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(existingUser);
      (userRepository.deleteById as jest.Mock).mockResolvedValue(undefined);
      (userRepository.create as jest.Mock).mockResolvedValue(newUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (jwt.sign as jest.Mock).mockReturnValue('session-token');

      const result = await authService.signup('test@example.com', 'password123');

      expect(userRepository.deleteById).toHaveBeenCalledWith('user-unverified');
      expect(result.success).toBe(true);
      expect(result.userId).toBe('user-new');
    });

    it('should throw error for missing email or password', async () => {
      await expect(authService.signup('', 'password123')).rejects.toThrow(
        'Email và mật khẩu là bắt buộc'
      );

      await expect(authService.signup('test@example.com', '')).rejects.toThrow(
        'Email và mật khẩu là bắt buộc'
      );
    });

    it('should throw error for weak password', async () => {
      await expect(authService.signup('test@example.com', 'weak')).rejects.toThrow(
        'Mật khẩu phải có ít nhất 8 ký tự'
      );
    });

    it('should use correct bcrypt rounds based on environment', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        planTier: 'FREE',
        emailVerifiedAt: new Date(),
      };

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (userRepository.create as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('token');

      // Test development
      process.env.NODE_ENV = 'development';
      await authService.signup('test@example.com', 'password123');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);

      // Test production
      process.env.NODE_ENV = 'production';
      await authService.signup('test@example.com', 'password123');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
    });
  });

  describe('signin', () => {
    it('should successfully sign in a user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        planTier: 'FREE',
        passwordHash: 'hashed-password',
        emailVerifiedAt: new Date(),
      };

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.isAccountLocked as jest.Mock).mockResolvedValue(false);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (userRepository.resetFailedAttempts as jest.Mock).mockResolvedValue(undefined);
      (jwt.sign as jest.Mock).mockReturnValue('session-token');

      const result = await authService.signin('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.userId).toBe('user-123');
      expect(result.sessionToken).toBe('session-token');
      expect(userRepository.resetFailedAttempts).toHaveBeenCalledWith('user-123');
    });

    it('should throw error for non-existent user', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(authService.signin('nonexistent@example.com', 'password123')).rejects.toThrow(
        'Email hoặc mật khẩu không đúng'
      );
    });

    it('should throw error for locked account', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.isAccountLocked as jest.Mock).mockResolvedValue(true);

      await expect(authService.signin('test@example.com', 'password123')).rejects.toThrow(
        'Tài khoản tạm thời bị khóa'
      );
    });

    it('should throw error and increment failed attempts for wrong password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
      };

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.isAccountLocked as jest.Mock).mockResolvedValue(false);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      (userRepository.incrementFailedAttempts as jest.Mock).mockResolvedValue(undefined);

      await expect(authService.signin('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Email hoặc mật khẩu không đúng'
      );

      expect(userRepository.incrementFailedAttempts).toHaveBeenCalledWith('user-123');
    });

    it('should return error for unverified email when verification required', async () => {
      process.env.REQUIRE_EMAIL_VERIFICATION = 'true';

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        planTier: 'FREE',
        passwordHash: 'hashed-password',
        emailVerifiedAt: null,
      };

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.isAccountLocked as jest.Mock).mockResolvedValue(false);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (userRepository.resetFailedAttempts as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.signin('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.needsVerification).toBe(true);
      expect(result.message).toContain('xác thực email');
    });

    it('should throw error for missing credentials', async () => {
      await expect(authService.signin('', 'password')).rejects.toThrow(
        'Email và mật khẩu là bắt buộc'
      );

      await expect(authService.signin('email@test.com', '')).rejects.toThrow(
        'Email và mật khẩu là bắt buộc'
      );
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify email', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        planTier: 'FREE',
      };

      (verificationRepository.verifyEmailToken as jest.Mock).mockResolvedValue('user-123');
      (userRepository.markEmailVerified as jest.Mock).mockResolvedValue(undefined);
      (verificationRepository.deleteVerificationToken as jest.Mock).mockResolvedValue(undefined);
      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (addEmailJob as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.verifyEmail('valid-token');

      expect(result.success).toBe(true);
      expect(result.userId).toBe('user-123');
      expect(userRepository.markEmailVerified).toHaveBeenCalledWith('user-123');
      expect(verificationRepository.deleteVerificationToken).toHaveBeenCalledWith('user-123');
      expect(addEmailJob).toHaveBeenCalledWith({
        type: 'welcome',
        to: 'test@example.com',
      });
    });

    it('should throw error for invalid token', async () => {
      (verificationRepository.verifyEmailToken as jest.Mock).mockResolvedValue(null);

      await expect(authService.verifyEmail('invalid-token')).rejects.toThrow(
        'Token không hợp lệ hoặc đã hết hạn'
      );
    });
  });

  describe('requestPasswordReset', () => {
    it('should send password reset email for existing user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockResetToken = {
        token: 'reset-token-123',
      };

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (verificationRepository.createPasswordResetToken as jest.Mock).mockResolvedValue(
        mockResetToken
      );
      (addEmailJob as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.requestPasswordReset('test@example.com');

      expect(result.success).toBe(true);
      expect(verificationRepository.createPasswordResetToken).toHaveBeenCalledWith('user-123');
      expect(addEmailJob).toHaveBeenCalledWith({
        type: 'password-reset',
        to: 'test@example.com',
        token: 'reset-token-123',
      });
    });

    it('should return success for non-existent user (security)', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      const result = await authService.requestPasswordReset('nonexistent@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Nếu email tồn tại');
      expect(verificationRepository.createPasswordResetToken).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password', async () => {
      (verificationRepository.verifyPasswordResetToken as jest.Mock).mockResolvedValue('user-123');
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      (verificationRepository.deletePasswordResetToken as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.resetPassword('valid-token', 'newpassword123');

      expect(result.success).toBe(true);
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 12);
      expect(verificationRepository.deletePasswordResetToken).toHaveBeenCalledWith('user-123');
    });

    it('should throw error for weak password', async () => {
      await expect(authService.resetPassword('token', 'weak')).rejects.toThrow(
        'Mật khẩu mới phải có ít nhất 8 ký tự'
      );
    });

    it('should throw error for invalid token', async () => {
      (verificationRepository.verifyPasswordResetToken as jest.Mock).mockResolvedValue(null);

      await expect(authService.resetPassword('invalid-token', 'password123')).rejects.toThrow(
        'Token không hợp lệ hoặc đã hết hạn'
      );
    });
  });

  describe('resendVerificationEmail', () => {
    it('should successfully resend verification email', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        emailVerifiedAt: null,
      };

      const mockVerification = {
        token: 'verification-token',
      };

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (verificationRepository.createVerificationToken as jest.Mock).mockResolvedValue(
        mockVerification
      );
      (addEmailJob as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.resendVerificationEmail('test@example.com');

      expect(result.success).toBe(true);
      expect(addEmailJob).toHaveBeenCalledWith({
        type: 'verification',
        to: 'test@example.com',
        token: 'verification-token',
      });
    });

    it('should throw error for non-existent user', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(authService.resendVerificationEmail('nonexistent@example.com')).rejects.toThrow(
        'Email không tồn tại'
      );
    });

    it('should throw error for already verified email', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        emailVerifiedAt: new Date(),
      };

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      await expect(authService.resendVerificationEmail('test@example.com')).rejects.toThrow(
        'Email đã được xác thực rồi'
      );
    });
  });

  describe('verifySessionToken', () => {
    it('should successfully verify valid token', () => {
      const mockDecoded = {
        userId: 'user-123',
        email: 'test@example.com',
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      const result = authService.verifySessionToken('valid-token');

      expect(result).toEqual(mockDecoded);
      expect(jwt.verify).toHaveBeenCalled();
    });

    it('should return null for invalid token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = authService.verifySessionToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null for expired token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Token expired');
      });

      const result = authService.verifySessionToken('expired-token');

      expect(result).toBeNull();
    });
  });
});
