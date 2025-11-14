import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';

/**
 * Validation Middleware using Zod
 *
 * SECURITY FIX: Comprehensive input validation to prevent:
 * - SQL injection
 * - NoSQL injection
 * - XSS attacks
 * - Type confusion
 * - Invalid data processing
 */

export interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Generic validation middleware
 */
export function validate(options: ValidationOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (options.body) {
        req.body = await options.body.parseAsync(req.body);
      }

      // Validate query parameters
      if (options.query) {
        req.query = await options.query.parseAsync(req.query);
      }

      // Validate route parameters
      if (options.params) {
        req.params = await options.params.parseAsync(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Validation error',
        code: 'VALIDATION_ERROR'
      });
    }
  };
}

/**
 * Common validation schemas
 */

// Email validation
export const emailSchema = z.string()
  .email('Invalid email format')
  .min(3, 'Email must be at least 3 characters')
  .max(255, 'Email must not exceed 255 characters')
  .transform(val => val.toLowerCase().trim());

// Password validation (strong)
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// UUID validation
export const uuidSchema = z.string()
  .uuid('Invalid UUID format');

// Positive integer
export const positiveIntSchema = z.number()
  .int('Must be an integer')
  .positive('Must be a positive number');

// Safe string (prevent XSS)
export const safeStringSchema = z.string()
  .min(1)
  .max(1000)
  .transform(val => val.trim())
  .refine(val => !/<script|javascript:|onerror=|onclick=/i.test(val), {
    message: 'Invalid characters detected'
  });

/**
 * Auth validation schemas
 */
export const authSchemas = {
  signup: z.object({
    email: emailSchema,
    password: passwordSchema
  }),

  signin: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required')
  }),

  forgotPassword: z.object({
    email: emailSchema
  }),

  resetPassword: z.object({
    token: z.string().min(1, 'Token is required'),
    password: passwordSchema
  }),

  verifyEmail: z.object({
    token: z.string().min(1, 'Token is required')
  }),

  refresh: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required').optional()
  })
};

/**
 * Chat validation schemas
 */
export const chatSchemas = {
  sendMessage: z.object({
    conversationId: z.string().uuid().optional(),
    message: z.string()
      .min(1, 'Message cannot be empty')
      .max(10000, 'Message is too long'),
    model: z.enum(['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo']).optional()
  }),

  getConversation: z.object({
    conversationId: uuidSchema
  }),

  deleteConversation: z.object({
    conversationId: uuidSchema
  }),

  updateConversationTitle: z.object({
    conversationId: uuidSchema,
    title: z.string().min(1).max(200)
  })
};

/**
 * Billing validation schemas
 */
export const billingSchemas = {
  createCheckoutSession: z.object({
    planId: z.enum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']),
    billingCycle: z.enum(['MONTHLY', 'YEARLY']).optional()
  }),

  createPortalSession: z.object({
    returnUrl: z.string().url().optional()
  }),

  webhookEvent: z.object({
    type: z.string(),
    data: z.record(z.any())
  })
};

/**
 * Pagination validation
 */
export const paginationSchema = z.object({
  page: z.string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().int().min(1))
    .optional()
    .default('1'),

  limit: z.string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default('20')
});

/**
 * Export convenience functions for common validations
 */
export const validateAuth = {
  signup: validate({ body: authSchemas.signup }),
  signin: validate({ body: authSchemas.signin }),
  forgotPassword: validate({ body: authSchemas.forgotPassword }),
  resetPassword: validate({ body: authSchemas.resetPassword }),
  verifyEmail: validate({ body: authSchemas.verifyEmail }),
  refresh: validate({ body: authSchemas.refresh })
};

export const validateChat = {
  sendMessage: validate({ body: chatSchemas.sendMessage }),
  getConversation: validate({ params: chatSchemas.getConversation }),
  deleteConversation: validate({ params: chatSchemas.deleteConversation }),
  updateTitle: validate({
    params: z.object({ conversationId: uuidSchema }),
    body: z.object({ title: z.string().min(1).max(200) })
  })
};

export const validateBilling = {
  createCheckout: validate({ body: billingSchemas.createCheckoutSession }),
  createPortal: validate({ body: billingSchemas.createPortalSession })
};
