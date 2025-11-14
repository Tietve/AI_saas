import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import logger from '../config/logger.config';
import { sentryService } from '../services/sentry.service';

/**
 * Validation middleware factory
 * Validates request body, query, or params against a Zod schema
 */
export function validate(schema: z.ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;

      // Parse and validate
      const validated = await schema.parseAsync(data);

      // Replace original data with validated data
      if (source === 'body') {
        req.body = validated;
      } else if (source === 'query') {
        req.query = validated as any;
      } else {
        req.params = validated as any;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        logger.warn('[Validation] Request validation failed:', errors);

        // Track validation errors in Sentry (only if unusual patterns)
        if (errors.length > 5 || errors.some(e => e.field.includes('injection'))) {
          sentryService.captureMessage(
            'Suspicious validation failure pattern detected',
            'warning',
            {
              component: 'validation',
              metadata: {
                errors,
                url: req.url,
                ip: req.ip,
              },
            }
          );
        }

        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: errors,
          },
        });
      }

      // Unexpected error
      logger.error('[Validation] Unexpected validation error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'An error occurred during validation',
        },
      });
    }
  };
}

/**
 * Validate user ID from body or header
 */
export function validateUserId(req: Request, res: Response, next: NextFunction) {
  const userId = req.body.userId || req.headers['x-user-id'] as string;

  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'USER_ID_REQUIRED',
        message: 'userId is required in request body or x-user-id header',
      },
    });
  }

  // Attach to request for easy access
  (req as any).userId = userId;
  next();
}
