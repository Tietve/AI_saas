import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import {
  signupRateLimiter,
  signinRateLimiter,
  passwordResetRateLimiter,
  verificationRateLimiter,
  authRateLimiter
} from '../middleware/rate-limit';
import { validateAuth } from '../../../../shared/validation/validation.middleware';

const router = Router();

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register new user account
 *     description: Create a new user account with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SecurePass123
 *     responses:
 *       200:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User created successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: "Too many requests (rate limit: 5 per hour)"
 */
router.post('/signup', signupRateLimiter, validateAuth.signup, (req, res) => authController.signup(req, res));

/**
 * @swagger
 * /api/auth/signin:
 *   post:
 *     summary: Sign in user
 *     description: Authenticate user and create session
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             description: Session cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid credentials
 *       429:
 *         description: "Too many attempts (rate limit: 10 per 15 minutes)"
 */
router.post('/signin', signinRateLimiter, validateAuth.signin, (req, res) => authController.signin(req, res));

/**
 * POST /api/auth/signout
 * Revoke tokens and clear session
 */
router.post('/signout', (req, res) => authController.signout(req, res));

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token - NEW ENDPOINT (SECURITY FIX)
 */
router.post('/refresh', authRateLimiter, validateAuth.refresh, (req, res) => authController.refresh(req, res));

/**
 * GET /api/auth/me
 * Get current user info from session
 */
router.get('/me', (req, res) => authController.me(req, res));

/**
 * POST /api/auth/verify-email
 * Verify email address with token
 */
router.post('/verify-email', authRateLimiter, validateAuth.verifyEmail, (req, res) => authController.verifyEmail(req, res));

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 */
router.post('/forgot-password', passwordResetRateLimiter, validateAuth.forgotPassword, (req, res) => authController.forgotPassword(req, res));

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', passwordResetRateLimiter, validateAuth.resetPassword, (req, res) => authController.resetPassword(req, res));

/**
 * POST /api/auth/resend-verification
 * Resend verification email
 */
router.post('/resend-verification', verificationRateLimiter, (req, res) => authController.resendVerification(req, res));

export default router;
