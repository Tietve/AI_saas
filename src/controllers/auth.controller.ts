/**
 * Auth Controller
 *
 * Handles HTTP request/response for authentication operations.
 * Validates input, orchestrates service calls, returns responses.
 */

import { injectable, inject } from 'tsyringe'
import { AuthService, SignupInput, SigninInput } from '@/services/auth.service'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Validation schemas
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const signinSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

const requestPasswordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
})

const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export interface ControllerResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  status: number
}

@injectable()
export class AuthController {
  constructor(@inject(AuthService) private authService: AuthService) {}

  /**
   * Sign up a new user
   */
  async signup(input: unknown): Promise<ControllerResponse> {
    try {
      // Validate input
      const validated = signupSchema.parse(input)

      // Call service
      const result = await this.authService.signup(validated as SignupInput)

      return {
        success: true,
        data: result,
        status: 201,
      }
    } catch (error: any) {
      logger.error({ err: error }, 'AuthController.signup failed')

      // Handle validation errors
      if (error.name === 'ZodError') {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.issues?.[0]?.message || 'Invalid input',
          },
          status: 400,
        }
      }

      // Handle business logic errors
      if (error.message === 'Email already in use') {
        return {
          success: false,
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'This email is already registered',
          },
          status: 409,
        }
      }

      if (error.message === 'Email and password are required') {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
          status: 400,
        }
      }

      if (error.message === 'Password must be at least 6 characters') {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
          status: 400,
        }
      }

      // Generic error
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        status: 500,
      }
    }
  }

  /**
   * Sign in an existing user
   */
  async signin(input: unknown): Promise<ControllerResponse> {
    try {
      // Validate input
      const validated = signinSchema.parse(input)

      // Call service
      const result = await this.authService.signin(validated as SigninInput)

      return {
        success: true,
        data: result,
        status: 200,
      }
    } catch (error: any) {
      logger.error({ err: error }, 'AuthController.signin failed')

      // Handle validation errors
      if (error.name === 'ZodError') {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.issues?.[0]?.message || 'Invalid input',
          },
          status: 400,
        }
      }

      // Handle authentication errors
      if (error.message === 'Invalid email or password') {
        return {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
          status: 401,
        }
      }

      if (error.message === 'Email not verified') {
        return {
          success: false,
          error: {
            code: 'EMAIL_NOT_VERIFIED',
            message: 'Please verify your email before signing in',
          },
          status: 403,
        }
      }

      // Generic error
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        status: 500,
      }
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(input: unknown): Promise<ControllerResponse> {
    try {
      // Validate input
      const validated = verifyEmailSchema.parse(input)

      // Call service
      const result = await this.authService.verifyEmail(validated.token)

      return {
        success: true,
        data: { verified: result },
        status: 200,
      }
    } catch (error: any) {
      logger.error({ err: error }, 'AuthController.verifyEmail failed')

      // Handle validation errors
      if (error.name === 'ZodError') {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.issues?.[0]?.message || 'Invalid input',
          },
          status: 400,
        }
      }

      // Handle token errors
      if (error.message === 'Invalid or expired token' || error.message === 'Token expired') {
        return {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: error.message,
          },
          status: 400,
        }
      }

      // Generic error
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        status: 500,
      }
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(input: unknown): Promise<ControllerResponse> {
    try {
      // Validate input
      const validated = requestPasswordResetSchema.parse(input)

      // Call service
      await this.authService.requestPasswordReset(validated.email)

      // Always return success (don't reveal if email exists)
      return {
        success: true,
        data: {
          message: 'If the email exists, a password reset link has been sent',
        },
        status: 200,
      }
    } catch (error: any) {
      logger.error({ err: error }, 'AuthController.requestPasswordReset failed')

      // Handle validation errors
      if (error.name === 'ZodError') {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.issues?.[0]?.message || 'Invalid input',
          },
          status: 400,
        }
      }

      // Generic error
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        status: 500,
      }
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(input: unknown): Promise<ControllerResponse> {
    try {
      // Validate input
      const validated = resetPasswordSchema.parse(input)

      // Call service
      const result = await this.authService.resetPassword(validated.token, validated.newPassword)

      return {
        success: true,
        data: { reset: result },
        status: 200,
      }
    } catch (error: any) {
      logger.error({ err: error }, 'AuthController.resetPassword failed')

      // Handle validation errors
      if (error.name === 'ZodError') {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.issues?.[0]?.message || 'Invalid input',
          },
          status: 400,
        }
      }

      // Handle token errors
      if (
        error.message === 'Invalid or expired token' ||
        error.message === 'Token expired' ||
        error.message === 'Token already used'
      ) {
        return {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: error.message,
          },
          status: 400,
        }
      }

      // Handle password validation
      if (error.message === 'Password must be at least 6 characters') {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
          status: 400,
        }
      }

      // Generic error
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        status: 500,
      }
    }
  }

  /**
   * Resend verification email
   */
  async resendVerification(input: unknown): Promise<ControllerResponse> {
    try {
      // Validate input
      const validated = resendVerificationSchema.parse(input)

      // Call service
      await this.authService.resendVerification(validated.email)

      return {
        success: true,
        data: {
          message: 'Verification email sent',
        },
        status: 200,
      }
    } catch (error: any) {
      logger.error({ err: error }, 'AuthController.resendVerification failed')

      // Handle validation errors
      if (error.name === 'ZodError') {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.issues?.[0]?.message || 'Invalid input',
          },
          status: 400,
        }
      }

      // Handle business logic errors
      if (error.message === 'User not found') {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
          status: 404,
        }
      }

      if (error.message === 'Email already verified') {
        return {
          success: false,
          error: {
            code: 'EMAIL_ALREADY_VERIFIED',
            message: 'Email is already verified',
          },
          status: 400,
        }
      }

      // Generic error
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        status: 500,
      }
    }
  }
}
