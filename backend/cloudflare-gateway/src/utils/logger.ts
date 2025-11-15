/**
 * Logging Utilities
 *
 * Structured logging for Cloudflare Workers
 */

import type { Context } from 'hono';
import type { Env } from '../types/env';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log entry structure
 */
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  data?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
  };
}

/**
 * Logger class
 */
export class Logger {
  private context: Context<{ Bindings: Env }>;
  private requestId: string;

  constructor(context: Context<{ Bindings: Env }>) {
    this.context = context;
    this.requestId = context.req.header('cf-ray') || crypto.randomUUID();
  }

  /**
   * Get log level from environment
   */
  private getLogLevel(): LogLevel {
    const level = this.context.env.LOG_LEVEL || 'info';
    return level as LogLevel;
  }

  /**
   * Check if log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevel = this.getLogLevel();
    return levels.indexOf(level) >= levels.indexOf(currentLevel);
  }

  /**
   * Create log entry
   */
  private createEntry(
    level: LogLevel,
    message: string,
    data?: Record<string, any>,
    error?: Error
  ): LogEntry {
    const user = this.context.get('user') as any;

    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
      userId: user?.id,
      data,
      error: error ? {
        message: error.message,
        stack: error.stack,
      } : undefined,
    };
  }

  /**
   * Output log entry
   */
  private output(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const formatted = JSON.stringify(entry);

    switch (entry.level) {
      case 'debug':
      case 'info':
        console.log(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  /**
   * Debug log
   */
  debug(message: string, data?: Record<string, any>): void {
    const entry = this.createEntry('debug', message, data);
    this.output(entry);
  }

  /**
   * Info log
   */
  info(message: string, data?: Record<string, any>): void {
    const entry = this.createEntry('info', message, data);
    this.output(entry);
  }

  /**
   * Warning log
   */
  warn(message: string, data?: Record<string, any>): void {
    const entry = this.createEntry('warn', message, data);
    this.output(entry);
  }

  /**
   * Error log
   */
  error(message: string, error?: Error, data?: Record<string, any>): void {
    const entry = this.createEntry('error', message, data, error);
    this.output(entry);
  }

  /**
   * Log request details
   */
  logRequest(): void {
    const req = this.context.req;

    this.info('Request received', {
      method: req.method,
      path: req.path,
      query: req.query(),
      headers: {
        userAgent: req.header('user-agent'),
        contentType: req.header('content-type'),
      },
      cf: {
        colo: req.raw.cf?.colo,
        country: req.raw.cf?.country,
        city: req.raw.cf?.city,
      },
    });
  }

  /**
   * Log response details
   */
  logResponse(response: Response, duration: number): void {
    this.info('Response sent', {
      status: response.status,
      duration: `${duration}ms`,
      headers: {
        contentType: response.headers.get('content-type'),
      },
    });
  }
}

/**
 * Create logger from context
 */
export function createLogger(context: Context<{ Bindings: Env }>): Logger {
  return new Logger(context);
}
