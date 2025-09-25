/**
 * Advanced Error Handling and Recovery System
 */

import { NextResponse } from 'next/server'
import { performanceMonitor } from '@/lib/monitoring/performance'

export interface ErrorContext {
  userId?: string
  ip?: string
  userAgent?: string
  endpoint?: string
  method?: string
  timestamp?: number
  requestId?: string
  metadata?: Record<string, any>
}

export interface ErrorDetails {
  code: string
  message: string
  statusCode: number
  context: ErrorContext
  stack?: string
  cause?: Error
  recoverable: boolean
  retryable: boolean
  userFriendly: boolean
}

export interface RetryOptions {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
  retryCondition?: (error: Error) => boolean
}

class ErrorHandler {
  private errorCounts = new Map<string, number>()
  private lastErrors = new Map<string, number>()
  private readonly MAX_ERRORS_PER_MINUTE = 10

  /**
   * Classify error type and determine handling strategy
   */
  classifyError(error: Error, context: ErrorContext): ErrorDetails {
    const timestamp = Date.now()
    
    // Database errors
    if (error.message.includes('connection') || error.message.includes('timeout')) {
      return {
        code: 'DATABASE_ERROR',
        message: 'Database connection issue',
        statusCode: 503,
        context: { ...context, timestamp },
        stack: error.stack,
        cause: error,
        recoverable: true,
        retryable: true,
        userFriendly: true,
      }
    }

    // Authentication errors
    if (error.message.includes('unauthorized') || error.message.includes('token')) {
      return {
        code: 'AUTH_ERROR',
        message: 'Authentication required',
        statusCode: 401,
        context: { ...context, timestamp },
        stack: error.stack,
        cause: error,
        recoverable: false,
        retryable: false,
        userFriendly: true,
      }
    }

    // Rate limiting errors
    if (error.message.includes('rate limit') || error.message.includes('too many')) {
      return {
        code: 'RATE_LIMIT_ERROR',
        message: 'Too many requests',
        statusCode: 429,
        context: { ...context, timestamp },
        stack: error.stack,
        cause: error,
        recoverable: true,
        retryable: true,
        userFriendly: true,
      }
    }

    // AI Provider errors
    if (error.message.includes('openai') || error.message.includes('anthropic') || error.message.includes('gemini')) {
      return {
        code: 'AI_PROVIDER_ERROR',
        message: 'AI service temporarily unavailable',
        statusCode: 502,
        context: { ...context, timestamp },
        stack: error.stack,
        cause: error,
        recoverable: true,
        retryable: true,
        userFriendly: true,
      }
    }

    // File upload errors
    if (error.message.includes('file') || error.message.includes('upload')) {
      return {
        code: 'FILE_ERROR',
        message: 'File processing failed',
        statusCode: 400,
        context: { ...context, timestamp },
        stack: error.stack,
        cause: error,
        recoverable: true,
        retryable: false,
        userFriendly: true,
      }
    }

    // Memory errors
    if (error.message.includes('memory') || error.message.includes('heap')) {
      return {
        code: 'MEMORY_ERROR',
        message: 'System resource limit reached',
        statusCode: 507,
        context: { ...context, timestamp },
        stack: error.stack,
        cause: error,
        recoverable: true,
        retryable: true,
        userFriendly: false,
      }
    }

    // Default error
    return {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      statusCode: 500,
      context: { ...context, timestamp },
      stack: error.stack,
      cause: error,
      recoverable: false,
      retryable: false,
      userFriendly: true,
    }
  }

  /**
   * Handle error with appropriate response and logging
   */
  handleError(error: Error, context: ErrorContext): NextResponse {
    const errorDetails = this.classifyError(error, context)
    
    // Log error with context
    this.logError(errorDetails)
    
    // Check for error flooding
    if (this.isErrorFlooding(errorDetails.code)) {
      return NextResponse.json(
        { 
          code: 'ERROR_FLOODING',
          message: 'Too many errors, please try again later',
          retryAfter: 60
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '60'
          }
        }
      )
    }

    // Return appropriate response
    const response = {
      code: errorDetails.code,
      message: errorDetails.userFriendly ? errorDetails.message : 'An error occurred',
      ...(errorDetails.retryable && { retryable: true }),
      ...(errorDetails.recoverable && { recoverable: true }),
      ...(process.env.NODE_ENV === 'development' && {
        stack: errorDetails.stack,
        context: errorDetails.context
      })
    }

    return NextResponse.json(response, { status: errorDetails.statusCode })
  }

  /**
   * Retry operation with exponential backoff
   */
  async retryOperation<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
    }
  ): Promise<T> {
    let lastError: Error
    let delay = options.baseDelay

    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        // Check if error is retryable
        if (options.retryCondition && !options.retryCondition(lastError)) {
          throw lastError
        }

        // Don't retry on last attempt
        if (attempt === options.maxRetries) {
          throw lastError
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay))
        
        // Exponential backoff
        delay = Math.min(delay * options.backoffFactor, options.maxDelay)
        
        console.log(`[ErrorHandler] Retry attempt ${attempt + 1}/${options.maxRetries} after ${delay}ms`)
      }
    }

    throw lastError!
  }

  /**
   * Circuit breaker pattern for external services
   */
  async withCircuitBreaker<T>(
    serviceName: string,
    operation: () => Promise<T>,
    options: {
      failureThreshold?: number
      recoveryTimeout?: number
      monitoringPeriod?: number
    } = {}
  ): Promise<T> {
    const {
      failureThreshold = 5,
      recoveryTimeout = 60000, // 1 minute
      monitoringPeriod = 60000, // 1 minute
    } = options

    const circuitKey = `circuit_breaker_${serviceName}`
    const now = Date.now()

    // Check if circuit is open
    const circuitState = this.getCircuitState(circuitKey)
    if (circuitState.isOpen && now - circuitState.lastFailure < recoveryTimeout) {
      throw new Error(`Circuit breaker open for ${serviceName}`)
    }

    try {
      const result = await operation()
      
      // Reset circuit on success
      this.resetCircuit(circuitKey)
      
      return result
    } catch (error) {
      // Record failure
      this.recordFailure(circuitKey, now)
      
      // Check if we should open circuit
      const failureCount = this.getFailureCount(circuitKey, monitoringPeriod)
      if (failureCount >= failureThreshold) {
        this.openCircuit(circuitKey, now)
        console.warn(`[ErrorHandler] Circuit breaker opened for ${serviceName}`)
      }
      
      throw error
    }
  }

  /**
   * Log error with structured information
   */
  private logError(errorDetails: ErrorDetails): void {
    const logData = {
      code: errorDetails.code,
      message: errorDetails.message,
      statusCode: errorDetails.statusCode,
      context: errorDetails.context,
      recoverable: errorDetails.recoverable,
      retryable: errorDetails.retryable,
      timestamp: new Date().toISOString(),
    }

    // Log to console with appropriate level
    if (errorDetails.statusCode >= 500) {
      console.error('[ErrorHandler] Server Error:', logData)
    } else if (errorDetails.statusCode >= 400) {
      console.warn('[ErrorHandler] Client Error:', logData)
    } else {
      console.log('[ErrorHandler] Error:', logData)
    }

    // Record error in performance monitoring
    // Note: performanceMonitor doesn't have recordError method, so we skip this
  }

  /**
   * Check if error flooding is occurring
   */
  private isErrorFlooding(errorCode: string): boolean {
    const now = Date.now()
    const minuteAgo = now - 60000

    // Clean old error records
    for (const [key, timestamp] of this.lastErrors.entries()) {
      if (timestamp < minuteAgo) {
        this.lastErrors.delete(key)
        this.errorCounts.delete(key)
      }
    }

    // Count errors in the last minute
    const errorKey = `${errorCode}_${Math.floor(now / 60000)}`
    const count = this.errorCounts.get(errorKey) || 0
    this.errorCounts.set(errorKey, count + 1)
    this.lastErrors.set(errorKey, now)

    return count >= this.MAX_ERRORS_PER_MINUTE
  }

  // Circuit breaker state management
  private circuitStates = new Map<string, { isOpen: boolean; lastFailure: number }>()
  private failureCounts = new Map<string, Array<number>>()

  private getCircuitState(circuitKey: string) {
    return this.circuitStates.get(circuitKey) || { isOpen: false, lastFailure: 0 }
  }

  private resetCircuit(circuitKey: string): void {
    this.circuitStates.set(circuitKey, { isOpen: false, lastFailure: 0 })
    this.failureCounts.delete(circuitKey)
  }

  private recordFailure(circuitKey: string, timestamp: number): void {
    const failures = this.failureCounts.get(circuitKey) || []
    failures.push(timestamp)
    this.failureCounts.set(circuitKey, failures)
  }

  private getFailureCount(circuitKey: string, period: number): number {
    const failures = this.failureCounts.get(circuitKey) || []
    const cutoff = Date.now() - period
    return failures.filter(timestamp => timestamp > cutoff).length
  }

  private openCircuit(circuitKey: string, timestamp: number): void {
    this.circuitStates.set(circuitKey, { isOpen: true, lastFailure: timestamp })
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler()

// Error handling decorators
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: Partial<ErrorContext> = {}
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await fn(...args)
    } catch (error) {
      const errorContext: ErrorContext = {
        ...context,
        timestamp: Date.now(),
      }

      // Re-throw as NextResponse for API routes
      if (error instanceof NextResponse) {
        throw error
      }

      // Return NextResponse instead of throwing it for API routes
      return errorHandler.handleError(error as Error, errorContext)
    }
  }
}

export function withRetry<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options?: RetryOptions
) {
  return async (...args: T): Promise<R> => {
    return errorHandler.retryOperation(() => fn(...args), options)
  }
}

export function withCircuitBreaker<T extends any[], R>(
  serviceName: string,
  fn: (...args: T) => Promise<R>,
  options?: Parameters<typeof errorHandler.withCircuitBreaker>[2]
) {
  return async (...args: T): Promise<R> => {
    return errorHandler.withCircuitBreaker(serviceName, () => fn(...args), options)
  }
}

// Common error types
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public context?: ErrorContext
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super('VALIDATION_ERROR', message, 400, context)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, context?: ErrorContext) {
    super('NOT_FOUND', `${resource} not found`, 404, context)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', context?: ErrorContext) {
    super('UNAUTHORIZED', message, 401, context)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', context?: ErrorContext) {
    super('RATE_LIMIT', message, 429, context)
  }
}

// Helper functions
export const handleError = (error: Error, context?: ErrorContext) =>
  errorHandler.handleError(error, context || {})

export const retry = <T>(operation: () => Promise<T>, options?: RetryOptions) =>
  errorHandler.retryOperation(operation, options)
