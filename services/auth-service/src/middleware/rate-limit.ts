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
 * NOTE: Increased for testing/development. Set back to 5 for production!
 */
export const signupRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // 50 in dev, 5 in prod
  message: 'Quá nhiều yêu cầu đăng ký từ IP này, vui lòng thử lại sau 1 giờ',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Signin rate limiter - moderate
 * NOTE: Increased for testing/development. Set back to 10 for production!
 */
export const signinRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 100, // 100 in dev, 10 in prod
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
