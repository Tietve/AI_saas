import rateLimit from 'express-rate-limit';

/**
 * Global rate limiter - applies to all requests
 * Use RATE_LIMIT_GLOBAL_MAX env var to configure (default: 100)
 */
export const globalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_GLOBAL_MAX || '100'),
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
 * Use RATE_LIMIT_SIGNUP_MAX env var to configure (default: 5)
 */
export const signupRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_SIGNUP_WINDOW_MS || '3600000'), // 1 hour
  max: parseInt(process.env.RATE_LIMIT_SIGNUP_MAX || '5'),
  message: 'Quá nhiều yêu cầu đăng ký từ IP này, vui lòng thử lại sau 1 giờ',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Signin rate limiter - moderate
 * Use RATE_LIMIT_SIGNIN_MAX env var to configure (default: 10)
 */
export const signinRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_SIGNIN_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_SIGNIN_MAX || '10'),
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
