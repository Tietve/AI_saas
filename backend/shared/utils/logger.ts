/**
 * Centralized logging utility using Pino with Sentry integration
 */

import pino from 'pino';
import * as Sentry from '@sentry/node';

export interface LoggerOptions {
  service: string;
  level?: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  prettyPrint?: boolean;
  sentryDsn?: string;
  environment?: string;
}

export function createLogger(options: LoggerOptions) {
  const { service, level = 'info', prettyPrint = false, sentryDsn, environment = 'production' } = options;

  // Initialize Sentry if DSN provided
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment,
      tracesSampleRate: 1.0,
      beforeSend(event, hint) {
        // Add service context
        event.contexts = event.contexts || {};
        event.contexts.service = { name: service };
        return event;
      }
    });
  }

  const logger = pino({
    name: service,
    level,
    formatters: {
      level: (label) => {
        return { level: label };
      },
      bindings: (bindings) => {
        return {
          pid: bindings.pid,
          host: bindings.hostname,
          service
        };
      }
    },
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
    ...(prettyPrint && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    }),
    hooks: {
      logMethod(inputArgs: any[], method: any) {
        // Send errors to Sentry
        if (inputArgs.length >= 2) {
          const arg1 = inputArgs[0];
          const arg2 = inputArgs[1];

          // Check if this is an error log
          if ((method.name === 'error' || method.name === 'fatal') && sentryDsn) {
            if (arg1 instanceof Error) {
              Sentry.captureException(arg1, {
                level: method.name === 'fatal' ? 'fatal' : 'error',
                contexts: {
                  logger: { message: arg2 }
                }
              });
            } else if (typeof arg1 === 'object' && arg1 !== null && 'err' in arg1 && arg1.err instanceof Error) {
              Sentry.captureException(arg1.err, {
                level: method.name === 'fatal' ? 'fatal' : 'error',
                contexts: {
                  logger: { ...arg1 as Record<string, any>, message: arg2 }
                }
              });
            }
          }
        }
        return method.apply(this, inputArgs);
      }
    }
  });

  return logger;
}

// Request logger middleware
export function createRequestLogger(logger: pino.Logger) {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || generateRequestId();

    req.log = logger.child({ requestId });
    res.setHeader('X-Request-ID', requestId);

    req.log.info({
      req: {
        method: req.method,
        url: req.url,
        headers: sanitizeHeaders(req.headers),
        query: req.query,
        ip: req.ip
      }
    }, 'incoming request');

    res.on('finish', () => {
      const duration = Date.now() - startTime;

      req.log.info({
        res: {
          statusCode: res.statusCode,
          headers: res.getHeaders()
        },
        duration
      }, 'request completed');
    });

    next();
  };
}

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function sanitizeHeaders(headers: any): any {
  const sanitized = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

  for (const header of sensitiveHeaders) {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  }

  return sanitized;
}
