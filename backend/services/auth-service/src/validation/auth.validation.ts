import { z } from 'zod';

/**
 * Signup validation schema
 */
export const signupSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format')
      .min(5, 'Email must be at least 5 characters')
      .max(255, 'Email must not exceed 255 characters')
      .toLowerCase()
      .trim(),

    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must not exceed 100 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),

    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must not exceed 30 characters')
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Username can only contain letters, numbers, underscores, and hyphens'
      )
      .optional(),

    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must not exceed 100 characters')
      .optional(),
  }),
});

/**
 * Signin validation schema
 */
export const signinSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format')
      .toLowerCase()
      .trim(),

    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password is required'),
  }),
});

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
  }),
});

/**
 * Password reset confirm schema
 */
export const passwordResetConfirmSchema = z.object({
  body: z.object({
    token: z
      .string({ required_error: 'Reset token is required' })
      .min(10, 'Invalid reset token'),

    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must not exceed 100 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
  }),
});

/**
 * Email verification schema
 */
export const verifyEmailSchema = z.object({
  body: z.object({
    token: z
      .string({ required_error: 'Verification token is required' })
      .min(10, 'Invalid verification token'),
  }),
});

/**
 * Refresh token schema
 */
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string({ required_error: 'Refresh token is required' })
      .min(10, 'Invalid refresh token'),
  }),
});

/**
 * Update profile schema
 */
export const updateProfileSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must not exceed 30 characters')
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Username can only contain letters, numbers, underscores, and hyphens'
      )
      .optional(),

    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must not exceed 100 characters')
      .optional(),

    bio: z
      .string()
      .max(500, 'Bio must not exceed 500 characters')
      .optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    {
      message: 'At least one field must be provided for update',
    }
  ),
});

/**
 * Change password schema
 */
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string({ required_error: 'Current password is required' })
      .min(1, 'Current password is required'),

    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'New password must be at least 8 characters')
      .max(100, 'New password must not exceed 100 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
  }).refine(
    (data) => data.currentPassword !== data.newPassword,
    {
      message: 'New password must be different from current password',
      path: ['newPassword'],
    }
  ),
});
