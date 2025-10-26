/**
 * Standard error classes for consistent error handling across microservices
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
    };
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: any) {
    super(message, 400, 'BAD_REQUEST', true, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(message, 401, 'UNAUTHORIZED', true, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', details?: any) {
    super(message, 403, 'FORBIDDEN', true, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, 404, 'NOT_FOUND', true, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict', details?: any) {
    super(message, 409, 'CONFLICT', true, details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 422, 'VALIDATION_ERROR', true, details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests', retryAfter?: number) {
    super(message, 429, 'TOO_MANY_REQUESTS', true, { retryAfter });
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(message, 500, 'INTERNAL_ERROR', true, details);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service unavailable', details?: any) {
    super(message, 503, 'SERVICE_UNAVAILABLE', true, details);
  }
}

// Business logic errors
export class QuotaExceededError extends AppError {
  constructor(message: string = 'Quota exceeded', details?: any) {
    super(message, 429, 'QUOTA_EXCEEDED', true, details);
  }
}

export class PaymentRequiredError extends AppError {
  constructor(message: string = 'Payment required', details?: any) {
    super(message, 402, 'PAYMENT_REQUIRED', true, details);
  }
}

export class EmailNotVerifiedError extends AppError {
  constructor(message: string = 'Email not verified', details?: any) {
    super(message, 403, 'EMAIL_NOT_VERIFIED', true, details);
  }
}

export class AccountLockedError extends AppError {
  constructor(message: string = 'Account locked', lockoutUntil?: Date) {
    super(message, 403, 'ACCOUNT_LOCKED', true, { lockoutUntil });
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message: string = 'Invalid credentials') {
    super(message, 401, 'INVALID_CREDENTIALS', true);
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = 'Token expired') {
    super(message, 401, 'TOKEN_EXPIRED', true);
  }
}

export class InvalidTokenError extends AppError {
  constructor(message: string = 'Invalid token') {
    super(message, 401, 'INVALID_TOKEN', true);
  }
}

// Database errors
export class DatabaseError extends AppError {
  constructor(message: string = 'Database error', details?: any) {
    super(message, 500, 'DATABASE_ERROR', false, details);
  }
}

export class RecordNotFoundError extends NotFoundError {
  constructor(resource: string, id?: string) {
    super(
      `${resource}${id ? ` with id ${id}` : ''} not found`,
      { resource, id }
    );
  }
}

// External service errors
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: any) {
    super(
      `External service error: ${service} - ${message}`,
      502,
      'EXTERNAL_SERVICE_ERROR',
      true,
      { service, ...details }
    );
  }
}

export class AIProviderError extends ExternalServiceError {
  constructor(provider: string, message: string, details?: any) {
    super(`AI Provider (${provider})`, message, details);
  }
}

export class PaymentProviderError extends ExternalServiceError {
  constructor(message: string, details?: any) {
    super('Payment Provider', message, details);
  }
}

/**
 * Error handler middleware factory
 */
export function createErrorHandler(logger: any) {
  return (err: Error, req: any, res: any, next: any) => {
    if (err instanceof AppError) {
      logger.error({
        err,
        req: {
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: req.body
        }
      }, `${err.code}: ${err.message}`);

      return res.status(err.statusCode).json({
        success: false,
        error: err.toJSON()
      });
    }

    // Unhandled errors
    logger.fatal({
      err,
      req: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body
      }
    }, 'Unhandled error');

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        ...(process.env.NODE_ENV === 'development' && {
          details: err.message,
          stack: err.stack
        })
      }
    });
  };
}

/**
 * Async error wrapper
 */
export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
