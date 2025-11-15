import { Request, Response } from 'express';
import { AuthController } from '../../src/controllers/auth.controller';
import { authService } from '../../src/services/auth.service';
import { publishAnalyticsEvent } from '@saas/shared/dist/events';
import { metrics } from '../../src/config/metrics';

// Mock dependencies
jest.mock('../../src/services/auth.service');
jest.mock('@saas/shared/dist/events');
jest.mock('../../src/config/metrics');
jest.mock('../../src/config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('AuthController', () => {
  let authController: AuthController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    authController = new AuthController();

    mockRequest = {
      body: {},
      cookies: {},
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent',
      },
      socket: {
        remoteAddress: '127.0.0.1',
      } as any,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should successfully register a new user without email verification', async () => {
      const signupResult = {
        success: true,
        needsVerification: false,
        userId: 'user-123',
        email: 'test@example.com',
        planTier: 'FREE',
        message: 'Đăng ký thành công',
        sessionToken: 'session-token-123',
      };

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      (authService.signup as jest.Mock).mockResolvedValue(signupResult);
      (publishAnalyticsEvent as jest.Mock).mockResolvedValue(undefined);
      (metrics.trackSignup as jest.Mock).mockReturnValue(undefined);

      await authController.signup(mockRequest as Request, mockResponse as Response);

      expect(authService.signup).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(metrics.trackSignup).toHaveBeenCalledWith('web');
      expect(publishAnalyticsEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          user_email: 'test@example.com',
          plan_tier: 'FREE',
        })
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'session',
        'session-token-123',
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        ok: true,
        message: 'Đăng ký thành công',
        redirectUrl: '/chat',
      });
    });

    it('should successfully register with email verification required', async () => {
      const signupResult = {
        success: true,
        needsVerification: true,
        userId: 'user-123',
        email: 'test@example.com',
        planTier: 'FREE',
        message: 'Vui lòng kiểm tra email',
      };

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      (authService.signup as jest.Mock).mockResolvedValue(signupResult);

      await authController.signup(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        ok: true,
        needsVerification: true,
        message: signupResult.message,
        email: 'test@example.com',
      });
      expect(mockResponse.cookie).not.toHaveBeenCalled();
    });

    it('should return 409 for duplicate email', async () => {
      mockRequest.body = {
        email: 'existing@example.com',
        password: 'password123',
      };

      (authService.signup as jest.Mock).mockRejectedValue(
        new Error('Email đã được sử dụng')
      );

      await authController.signup(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Email đã được sử dụng',
      });
    });

    it('should return 400 for weak password', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'weak',
      };

      (authService.signup as jest.Mock).mockRejectedValue(
        new Error('Mật khẩu phải có ít nhất 8 ký tự')
      );

      await authController.signup(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Mật khẩu phải có ít nhất 8 ký tự',
      });
    });

    it('should return 400 for missing email', async () => {
      mockRequest.body = {
        password: 'password123',
      };

      (authService.signup as jest.Mock).mockRejectedValue(
        new Error('Email là bắt buộc')
      );

      await authController.signup(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should handle analytics event publishing failure gracefully', async () => {
      const signupResult = {
        success: true,
        needsVerification: false,
        userId: 'user-123',
        email: 'test@example.com',
        planTier: 'FREE',
        message: 'Đăng ký thành công',
        sessionToken: 'session-token-123',
      };

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      (authService.signup as jest.Mock).mockResolvedValue(signupResult);
      (publishAnalyticsEvent as jest.Mock).mockRejectedValue(
        new Error('Analytics service unavailable')
      );

      await authController.signup(mockRequest as Request, mockResponse as Response);

      // Should still return success even if analytics fails
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        ok: true,
        message: 'Đăng ký thành công',
        redirectUrl: '/chat',
      });
    });
  });

  describe('signin', () => {
    it('should successfully sign in a user', async () => {
      const signinResult = {
        success: true,
        userId: 'user-123',
        email: 'test@example.com',
        planTier: 'FREE',
        sessionToken: 'session-token-123',
        message: 'Đăng nhập thành công',
      };

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      (authService.signin as jest.Mock).mockResolvedValue(signinResult);
      (publishAnalyticsEvent as jest.Mock).mockResolvedValue(undefined);

      await authController.signin(mockRequest as Request, mockResponse as Response);

      expect(authService.signin).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'session',
        'session-token-123',
        expect.any(Object)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        ok: true,
        message: 'Đăng nhập thành công',
        redirectUrl: '/chat',
      });
    });

    it('should return 403 for unverified email', async () => {
      const signinResult = {
        success: false,
        needsVerification: true,
        message: 'Vui lòng xác thực email trước khi đăng nhập',
      };

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      (authService.signin as jest.Mock).mockResolvedValue(signinResult);

      await authController.signin(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: signinResult.message,
        needsVerification: true,
      });
    });

    it('should return 401 for invalid credentials', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      (authService.signin as jest.Mock).mockRejectedValue(
        new Error('Email hoặc mật khẩu không đúng')
      );

      await authController.signin(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Email hoặc mật khẩu không đúng',
      });
    });

    it('should return 429 for locked account', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      (authService.signin as jest.Mock).mockRejectedValue(
        new Error('Tài khoản tạm thời bị khóa')
      );

      await authController.signin(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
    });

    it('should return 400 for missing credentials', async () => {
      mockRequest.body = {};

      (authService.signin as jest.Mock).mockRejectedValue(
        new Error('Email và mật khẩu là bắt buộc')
      );

      await authController.signin(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('signout', () => {
    it('should successfully sign out a user', async () => {
      await authController.signout(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'session',
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        ok: true,
        message: 'Đăng xuất thành công',
      });
    });
  });

  describe('me', () => {
    it('should return current user info', async () => {
      mockRequest.cookies = {
        session: 'valid-token',
      };

      const decodedToken = {
        userId: 'user-123',
        email: 'test@example.com',
      };

      (authService.verifySessionToken as jest.Mock).mockReturnValue(decodedToken);

      await authController.me(mockRequest as Request, mockResponse as Response);

      expect(authService.verifySessionToken).toHaveBeenCalledWith('valid-token');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        ok: true,
        user: {
          id: 'user-123',
          userId: 'user-123',
          email: 'test@example.com',
        },
      });
    });

    it('should return 401 for missing session token', async () => {
      mockRequest.cookies = {};

      await authController.me(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Chưa đăng nhập',
      });
    });

    it('should return 401 for invalid session token', async () => {
      mockRequest.cookies = {
        session: 'invalid-token',
      };

      (authService.verifySessionToken as jest.Mock).mockReturnValue(null);

      await authController.me(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Session không hợp lệ hoặc đã hết hạn',
      });
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify email', async () => {
      mockRequest.body = {
        token: 'valid-verification-token',
      };

      const verifyResult = {
        success: true,
        message: 'Email đã được xác thực thành công',
        userId: 'user-123',
        email: 'test@example.com',
        planTier: 'FREE',
      };

      (authService.verifyEmail as jest.Mock).mockResolvedValue(verifyResult);
      (publishAnalyticsEvent as jest.Mock).mockResolvedValue(undefined);

      await authController.verifyEmail(mockRequest as Request, mockResponse as Response);

      expect(authService.verifyEmail).toHaveBeenCalledWith('valid-verification-token');
      expect(publishAnalyticsEvent).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        ok: true,
        message: 'Email đã được xác thực thành công',
      });
    });

    it('should return 400 for missing token', async () => {
      mockRequest.body = {};

      await authController.verifyEmail(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Token là bắt buộc',
      });
    });

    it('should return 400 for invalid or expired token', async () => {
      mockRequest.body = {
        token: 'invalid-token',
      };

      (authService.verifyEmail as jest.Mock).mockRejectedValue(
        new Error('Token không hợp lệ hoặc đã hết hạn')
      );

      await authController.verifyEmail(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('forgotPassword', () => {
    it('should successfully send password reset email', async () => {
      mockRequest.body = {
        email: 'test@example.com',
      };

      const resetResult = {
        success: true,
        message: 'Nếu email tồn tại, link reset password đã được gửi',
      };

      (authService.requestPasswordReset as jest.Mock).mockResolvedValue(resetResult);

      await authController.forgotPassword(mockRequest as Request, mockResponse as Response);

      expect(authService.requestPasswordReset).toHaveBeenCalledWith('test@example.com');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        ok: true,
        message: resetResult.message,
      });
    });

    it('should return 400 for missing email', async () => {
      mockRequest.body = {};

      await authController.forgotPassword(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Email là bắt buộc',
      });
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password', async () => {
      mockRequest.body = {
        token: 'valid-reset-token',
        password: 'newpassword123',
      };

      const resetResult = {
        success: true,
        message: 'Mật khẩu đã được đổi thành công',
      };

      (authService.resetPassword as jest.Mock).mockResolvedValue(resetResult);

      await authController.resetPassword(mockRequest as Request, mockResponse as Response);

      expect(authService.resetPassword).toHaveBeenCalledWith(
        'valid-reset-token',
        'newpassword123'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        ok: true,
        message: resetResult.message,
      });
    });

    it('should return 400 for missing token or password', async () => {
      mockRequest.body = {
        token: 'valid-token',
      };

      await authController.resetPassword(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Token và mật khẩu mới là bắt buộc',
      });
    });

    it('should return 400 for invalid or expired token', async () => {
      mockRequest.body = {
        token: 'invalid-token',
        password: 'newpassword123',
      };

      (authService.resetPassword as jest.Mock).mockRejectedValue(
        new Error('Token không hợp lệ hoặc đã hết hạn')
      );

      await authController.resetPassword(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for weak new password', async () => {
      mockRequest.body = {
        token: 'valid-token',
        password: 'weak',
      };

      (authService.resetPassword as jest.Mock).mockRejectedValue(
        new Error('Mật khẩu mới phải có ít nhất 8 ký tự')
      );

      await authController.resetPassword(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('resendVerification', () => {
    it('should successfully resend verification email', async () => {
      mockRequest.body = {
        email: 'test@example.com',
      };

      const resendResult = {
        success: true,
        message: 'Email xác thực đã được gửi lại',
      };

      (authService.resendVerificationEmail as jest.Mock).mockResolvedValue(resendResult);

      await authController.resendVerification(mockRequest as Request, mockResponse as Response);

      expect(authService.resendVerificationEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        ok: true,
        message: resendResult.message,
      });
    });

    it('should return 400 for missing email', async () => {
      mockRequest.body = {};

      await authController.resendVerification(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Email là bắt buộc',
      });
    });

    it('should return 400 for non-existent email', async () => {
      mockRequest.body = {
        email: 'nonexistent@example.com',
      };

      (authService.resendVerificationEmail as jest.Mock).mockRejectedValue(
        new Error('Email không tồn tại')
      );

      await authController.resendVerification(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for already verified email', async () => {
      mockRequest.body = {
        email: 'verified@example.com',
      };

      (authService.resendVerificationEmail as jest.Mock).mockRejectedValue(
        new Error('Email đã được xác thực rồi')
      );

      await authController.resendVerification(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });
});
