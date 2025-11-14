import { Request, Response, NextFunction } from 'express';
import { PERF_THRESHOLDS } from '../cache/cache.config';

export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: number;
  userAgent?: string;
  ip?: string;
}

/**
 * Performance monitoring middleware
 * Tracks API response times and logs slow requests
 */
export function performanceMonitoring() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const endpoint = req.path;
    const method = req.method;

    // Store original end function
    const originalEnd = res.end;

    // Override end function to capture metrics
    res.end = function (this: Response, ...args: any[]): Response {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      const metrics: PerformanceMetrics = {
        endpoint,
        method,
        duration,
        statusCode,
        timestamp: Date.now(),
        userAgent: req.get('user-agent'),
        ip: req.ip || req.socket.remoteAddress,
      };

      // Log slow requests
      if (duration > PERF_THRESHOLDS.SLOW_API_RESPONSE) {
        console.warn(`[Performance] ⚠️ SLOW REQUEST: ${method} ${endpoint} took ${duration}ms`);
      }

      // Log all requests in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${method} ${endpoint} - ${statusCode} - ${duration}ms`);
      }

      // Could send to monitoring service (Prometheus, DataDog, etc.)
      // prometheusClient.recordMetric(metrics);

      // Call original end function
      return originalEnd.apply(this, args);
    };

    next();
  };
}

/**
 * Database query performance monitoring wrapper
 */
export async function measureDbQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;

    if (duration > PERF_THRESHOLDS.SLOW_DB_QUERY) {
      console.warn(`[Performance] ⚠️ SLOW DB QUERY: ${queryName} took ${duration}ms`);
    } else if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] DB Query: ${queryName} - ${duration}ms`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Performance] ❌ DB QUERY FAILED: ${queryName} after ${duration}ms`, error);
    throw error;
  }
}

/**
 * External API call performance monitoring wrapper
 */
export async function measureApiCall<T>(
  apiName: string,
  apiFn: () => Promise<T>,
  threshold: number = PERF_THRESHOLDS.SLOW_API_RESPONSE
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await apiFn();
    const duration = Date.now() - startTime;

    if (duration > threshold) {
      console.warn(`[Performance] ⚠️ SLOW API CALL: ${apiName} took ${duration}ms`);
    } else if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] API Call: ${apiName} - ${duration}ms`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Performance] ❌ API CALL FAILED: ${apiName} after ${duration}ms`, error);
    throw error;
  }
}
