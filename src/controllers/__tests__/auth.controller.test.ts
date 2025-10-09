/**
 * Unit tests for AuthController
 *
 * Tests HTTP handling and input validation by mocking services.
 */

import 'reflect-metadata'
import { AuthController } from '../auth.controller'
import { AuthService } from '@/services/auth.service'

// Mock service
jest.mock('@/services/auth.service')

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}))

describe('AuthController', () => {
  let authController: AuthController
  let mockAuthService: jest.Mocked<AuthService>

  beforeEach(() => {
    mockAuthService = new AuthService(null as any, null as any) as jest.Mocked<AuthService>
    authController = new AuthController(mockAuthService)
    jest.clearAllMocks()
  })

  describe('signup', () => {
    it('should successfully signup a user', async () => {
      const signupResult = {
        success: true,
        userId: 'user-123',
        needsVerification: false,
        sessionCookie: {
          name: 'session',
          value: 'token-123',
        },
      }

      mockAuthService.signup.mockResolvedValue(signupResult)

      const result = await authController.signup({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.success).toBe(true)
      expect(result.status).toBe(201)
      expect(result.data).toEqual(signupResult)
      expect(mockAuthService.signup).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    it('should return validation error for invalid email', async () => {
      const result = await authController.signup({
        email: 'invalid-email',
        password: 'password123',
      })

      expect(result.success).toBe(false)
      expect(result.status).toBe(400)
      expect(result.error?.code).toBe('VALIDATION_ERROR')
      expect(mockAuthService.signup).not.toHaveBeenCalled()
    })

    it('should return validation error for short password', async () => {
      const result = await authController.signup({
        email: 'test@example.com',
        password: '12345', // Less than 6 characters
      })

      expect(result.success).toBe(false)
      expect(result.status).toBe(400)
      expect(result.error?.code).toBe('VALIDATION_ERROR')
      expect(mockAuthService.signup).not.toHaveBeenCalled()
    })

    it('should handle email already exists error', async () => {
      mockAuthService.signup.mockRejectedValue(new Error('Email already in use'))

      const result = await authController.signup({
        email: 'existing@example.com',
        password: 'password123',
      })

      expect(result.success).toBe(false)
      expect(result.status).toBe(409)
      expect(result.error?.code).toBe('EMAIL_ALREADY_EXISTS')
    })

    it('should return 201 status for verification required', async () => {
      const signupResult = {
        success: true,
        userId: 'user-123',
        needsVerification: true,
      }

      mockAuthService.signup.mockResolvedValue(signupResult)

      const result = await authController.signup({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.success).toBe(true)
      expect(result.status).toBe(201)
      expect(result.data?.needsVerification).toBe(true)
    })
  })

  describe('signin', () => {
    it('should successfully signin a user', async () => {
      const signinResult = {
        success: true,
        userId: 'user-123',
        sessionCookie: {
          name: 'session',
          value: 'token-123',
        },
      }

      mockAuthService.signin.mockResolvedValue(signinResult)

      const result = await authController.signin({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.success).toBe(true)
      expect(result.status).toBe(200)
      expect(result.data).toEqual(signinResult)
    })

    it('should return validation error for invalid email', async () => {
      const result = await authController.signin({
        email: 'invalid-email',
        password: 'password123',
      })

      expect(result.success).toBe(false)
      expect(result.status).toBe(400)
      expect(result.error?.code).toBe('VALIDATION_ERROR')
    })

    it('should handle invalid credentials error', async () => {
      mockAuthService.signin.mockRejectedValue(new Error('Invalid email or password'))

      const result = await authController.signin({
        email: 'test@example.com',
        password: 'wrongpassword',
      })

      expect(result.success).toBe(false)
      expect(result.status).toBe(401)
      expect(result.error?.code).toBe('INVALID_CREDENTIALS')
    })

    it('should handle email not verified error', async () => {
      mockAuthService.signin.mockRejectedValue(new Error('Email not verified'))

      const result = await authController.signin({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.success).toBe(false)
      expect(result.status).toBe(403)
      expect(result.error?.code).toBe('EMAIL_NOT_VERIFIED')
    })
  })

  describe('verifyEmail', () => {
    it('should successfully verify email', async () => {
      mockAuthService.verifyEmail.mockResolvedValue(true)

      const result = await authController.verifyEmail({
        token: 'valid-token-123',
      })

      expect(result.success).toBe(true)
      expect(result.status).toBe(200)
      expect(result.data?.verified).toBe(true)
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith('valid-token-123')
    })

    it('should return validation error for missing token', async () => {
      const result = await authController.verifyEmail({
        token: '',
      })

      expect(result.success).toBe(false)
      expect(result.status).toBe(400)
      expect(result.error?.code).toBe('VALIDATION_ERROR')
    })

    it('should handle invalid token error', async () => {
      mockAuthService.verifyEmail.mockRejectedValue(new Error('Invalid or expired token'))

      const result = await authController.verifyEmail({
        token: 'invalid-token',
      })

      expect(result.success).toBe(false)
      expect(result.status).toBe(400)
      expect(result.error?.code).toBe('INVALID_TOKEN')
    })
  })

  describe('resetPassword', () => {
    it('should successfully reset password', async () => {
      mockAuthService.resetPassword.mockResolvedValue(true)

      const result = await authController.resetPassword({
        token: 'reset-token-123',
        newPassword: 'newpassword123',
      })

      expect(result.success).toBe(true)
      expect(result.status).toBe(200)
      expect(result.data?.reset).toBe(true)
    })

    it('should return validation error for short password', async () => {
      const result = await authController.resetPassword({
        token: 'reset-token-123',
        newPassword: '12345',
      })

      expect(result.success).toBe(false)
      expect(result.status).toBe(400)
      expect(result.error?.code).toBe('VALIDATION_ERROR')
    })

    it('should handle token already used error', async () => {
      mockAuthService.resetPassword.mockRejectedValue(new Error('Token already used'))

      const result = await authController.resetPassword({
        token: 'used-token',
        newPassword: 'newpassword123',
      })

      expect(result.success).toBe(false)
      expect(result.status).toBe(400)
      expect(result.error?.code).toBe('INVALID_TOKEN')
    })
  })

  describe('requestPasswordReset', () => {
    it('should always return success (security)', async () => {
      mockAuthService.requestPasswordReset.mockResolvedValue()

      const result = await authController.requestPasswordReset({
        email: 'test@example.com',
      })

      expect(result.success).toBe(true)
      expect(result.status).toBe(200)
      expect(result.data?.message).toContain('If the email exists')
    })

    it('should return success even for non-existent email (security)', async () => {
      mockAuthService.requestPasswordReset.mockResolvedValue()

      const result = await authController.requestPasswordReset({
        email: 'nonexistent@example.com',
      })

      expect(result.success).toBe(true)
      expect(result.status).toBe(200)
    })
  })
})
