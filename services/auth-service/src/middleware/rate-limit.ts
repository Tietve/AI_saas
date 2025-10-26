import rateLimit from 'express-rate-limit';

/**
 * Global rate limiter - applies to all requests
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: 'Quá nhiều requests từ IP này, vui lòng thử lại sau',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth rate limiter - stricter for auth endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window per IP
  message: 'Quá nhiều yêu cầu đăng nhập/đăng ký, vui lòng thử lại sau 15 phút',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Signup rate limiter - very strict
 */
export const signupRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 signups per hour per IP
  message: 'Quá nhiều yêu cầu đăng ký từ IP này, vui lòng thử lại sau 1 giờ',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Signin rate limiter - moderate
 */
export const signinRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes
  message: 'Quá nhiều yêu cầu đăng nhập, vui lòng thử lại sau 15 phút',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Password reset rate limiter - strict
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour
  message: 'Quá nhiều yêu cầu đặt lại mật khẩu, vui lòng thử lại sau 1 giờ',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Email verification rate limiter
 */
export const verificationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 verification emails per hour
  message: 'Quá nhiều yêu cầu gửi email xác thực, vui lòng thử lại sau',
  standardHeaders: true,
  legacyHeaders: false,
});
