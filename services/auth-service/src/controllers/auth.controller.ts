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
        // Set session cookie
        res.cookie('session', result.sessionToken, {
          httpOnly: true,
          secure: true, // Always use secure cookies
          sameSite: 'strict', // Stricter CSRF protection
          path: '/',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
          ok: true,
          message: result.message,
          redirectUrl: '/chat'
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

      // Set session cookie
      res.cookie('session', result.sessionToken, {
        httpOnly: true,
        secure: true, // Always use secure cookies
        sameSite: 'strict', // Stricter CSRF protection
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(200).json({
        ok: true,
        message: result.message,
        redirectUrl: '/chat'
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
   * Clear session cookie
   */
  async signout(req: Request, res: Response): Promise<void> {
    res.clearCookie('session', {
      httpOnly: true,
      secure: true, // Always use secure cookies
      sameSite: 'strict', // Stricter CSRF protection
      path: '/'
    });

    res.status(200).json({
      ok: true,
      message: 'Đăng xuất thành công'
    });
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
