import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { publishAnalyticsEvent, EventCategory, UserEventType } from '../shared/events';

export class AuthController {
  /**
   * POST /api/auth/signup
   * Register new user
   */
  async signup(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await authService.signup(email, password);

      // Publish analytics event for signup
      if (result.userId) {
        try {
          await publishAnalyticsEvent({
            event_type: UserEventType.SIGNUP,
            event_category: EventCategory.USER,
            service_name: 'auth-service',
            user_id: result.userId,
            user_email: result.email || email,
            plan_tier: result.planTier || 'FREE',
            ip_address: req.ip || req.socket.remoteAddress || '',
            user_agent: req.headers['user-agent'] || '',
          });
          console.log(`[analytics] Published user.signup event for ${result.email}`);
        } catch (analyticsError) {
          // Don't fail the request if analytics publishing fails
          console.error('[analytics] Failed to publish signup event:', analyticsError);
        }
      }

      if (result.needsVerification) {
        res.status(200).json({
          ok: true,
          needsVerification: true,
          message: result.message,
          email: result.email
        });
      } else {
        // Set access token cookie (15 minutes)
        res.cookie('session', result.accessToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          path: '/',
          maxAge: 15 * 60 * 1000 // 15 minutes - SECURITY FIX
        });

        // Set refresh token cookie (7 days)
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
          ok: true,
          message: result.message,
          redirectUrl: '/chat',
          // Also return tokens in body for mobile/API clients
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        });
      }
    } catch (error: any) {
      console.error('[signup] Error:', error);

      // Handle specific errors
      if (error.message === 'Email đã được sử dụng') {
        res.status(409).json({ error: error.message });
      } else if (error.message.includes('Mật khẩu') || error.message.includes('Email')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Có lỗi xảy ra khi đăng ký' });
      }
    }
  }

  /**
   * POST /api/auth/signin
   * Authenticate user and create session
   */
  async signin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await authService.signin(email, password);

      if (!result.success) {
        if (result.needsVerification) {
          res.status(403).json({
            error: result.message,
            needsVerification: true
          });
          return;
        }

        res.status(401).json({ error: result.message });
        return;
      }

      // Publish analytics event for signin
      if (result.userId) {
        try {
          await publishAnalyticsEvent({
            event_type: UserEventType.SIGNIN,
            event_category: EventCategory.USER,
            service_name: 'auth-service',
            user_id: result.userId,
            user_email: result.email || email,
            plan_tier: result.planTier || 'FREE',
            ip_address: req.ip || req.socket.remoteAddress || '',
            user_agent: req.headers['user-agent'] || '',
          });
          console.log(`[analytics] Published user.signin event for ${result.email}`);
        } catch (analyticsError) {
          // Don't fail the request if analytics publishing fails
          console.error('[analytics] Failed to publish signin event:', analyticsError);
        }
      }

      // Set access token cookie (15 minutes)
      res.cookie('session', result.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 15 * 60 * 1000 // 15 minutes - SECURITY FIX
      });

      // Set refresh token cookie (7 days)
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(200).json({
        ok: true,
        message: result.message,
        redirectUrl: '/chat',
        // Also return tokens in body for mobile/API clients
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      });
    } catch (error: any) {
      console.error('[signin] Error:', error);

      // Handle specific errors
      if (error.message.includes('Email hoặc mật khẩu')) {
        res.status(401).json({ error: error.message });
      } else if (error.message.includes('tạm thời bị khóa')) {
        res.status(429).json({ error: error.message });
      } else if (error.message.includes('bắt buộc')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Có lỗi xảy ra khi đăng nhập' });
      }
    }
  }

  /**
   * POST /api/auth/signout
   * Revoke tokens and clear cookies - SECURITY FIX
   */
  async signout(req: Request, res: Response): Promise<void> {
    try {
      const accessToken = req.cookies.session || req.headers.authorization?.replace('Bearer ', '');

      // Verify token to get userId
      const decoded = authService.verifySessionToken(accessToken);

      if (decoded && accessToken) {
        // Revoke tokens in Redis (blacklist access token + revoke refresh tokens)
        await authService.logout(accessToken, decoded.userId);
      }

      // Clear cookies
      res.clearCookie('session', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/'
      });

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/'
      });

      res.status(200).json({
        ok: true,
        message: 'Đăng xuất thành công'
      });
    } catch (error: any) {
      console.error('[signout] Error:', error);
      // Still clear cookies even if revocation fails
      res.clearCookie('session');
      res.clearCookie('refreshToken');

      res.status(200).json({
        ok: true,
        message: 'Đăng xuất thành công'
      });
    }
  }

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token - NEW ENDPOINT
   */
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: 'Refresh token not provided',
          code: 'NO_REFRESH_TOKEN'
        });
        return;
      }

      // Refresh tokens
      const tokens = await authService.refreshAccessToken(refreshToken);

      if (!tokens) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired refresh token. Please login again.',
          code: 'INVALID_REFRESH_TOKEN'
        });
        return;
      }

      // Set new access token cookie (15 minutes)
      res.cookie('session', tokens.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 15 * 60 * 1000
      });

      // Set new refresh token cookie (7 days)
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(200).json({
        ok: true,
        message: 'Token refreshed successfully',
        // Also return tokens in body for mobile/API clients
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
    } catch (error: any) {
      console.error('[refresh] Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to refresh token',
        code: 'REFRESH_ERROR'
      });
    }
  }

  /**
   * GET /api/auth/me
   * Get current user info from session
   */
  async me(req: Request, res: Response): Promise<void> {
    try {
      const sessionToken = req.cookies.session;

      if (!sessionToken) {
        res.status(401).json({ error: 'Chưa đăng nhập' });
        return;
      }

      const decoded = authService.verifySessionToken(sessionToken);

      if (!decoded) {
        res.status(401).json({ error: 'Session không hợp lệ hoặc đã hết hạn' });
        return;
      }

      res.status(200).json({
        ok: true,
        user: {
          userId: decoded.userId,
          email: decoded.email
        }
      });
    } catch (error: any) {
      console.error('[me] Error:', error);
      res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
  }

  /**
   * POST /api/auth/verify-email
   * Verify email with token
   */
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({ error: 'Token là bắt buộc' });
        return;
      }

      const result = await authService.verifyEmail(token);

      // Publish analytics event for email verification
      if (result.userId) {
        try {
          await publishAnalyticsEvent({
            event_type: UserEventType.EMAIL_VERIFIED,
            event_category: EventCategory.USER,
            service_name: 'auth-service',
            user_id: result.userId,
            user_email: result.email || '',
            plan_tier: result.planTier || 'FREE',
          });
          console.log(`[analytics] Published user.email_verified event for ${result.email}`);
        } catch (analyticsError) {
          // Don't fail the request if analytics publishing fails
          console.error('[analytics] Failed to publish email_verified event:', analyticsError);
        }
      }

      res.status(200).json({
        ok: true,
        message: result.message
      });
    } catch (error: any) {
      console.error('[verify-email] Error:', error);

      if (error.message.includes('không hợp lệ') || error.message.includes('hết hạn')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Có lỗi xảy ra khi xác thực email' });
      }
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Request password reset email
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email là bắt buộc' });
        return;
      }

      const result = await authService.requestPasswordReset(email);

      res.status(200).json({
        ok: true,
        message: result.message
      });
    } catch (error: any) {
      console.error('[forgot-password] Error:', error);
      res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
  }

  /**
   * POST /api/auth/reset-password
   * Reset password with token
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        res.status(400).json({ error: 'Token và mật khẩu mới là bắt buộc' });
        return;
      }

      const result = await authService.resetPassword(token, password);

      res.status(200).json({
        ok: true,
        message: result.message
      });
    } catch (error: any) {
      console.error('[reset-password] Error:', error);

      if (error.message.includes('không hợp lệ') || error.message.includes('hết hạn')) {
        res.status(400).json({ error: error.message });
      } else if (error.message.includes('Mật khẩu')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Có lỗi xảy ra khi đổi mật khẩu' });
      }
    }
  }

  /**
   * POST /api/auth/resend-verification
   * Resend verification email
   */
  async resendVerification(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email là bắt buộc' });
        return;
      }

      const result = await authService.resendVerificationEmail(email);

      res.status(200).json({
        ok: true,
        message: result.message
      });
    } catch (error: any) {
      console.error('[resend-verification] Error:', error);

      if (error.message.includes('không tồn tại') || error.message.includes('đã được xác thực')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Có lỗi xảy ra' });
      }
    }
  }
}

export const authController = new AuthController();
