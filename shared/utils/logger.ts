/**
 * Centralized logging utility using Pino
 */

import pino from 'pino';

export interface LoggerOptions {
  service: string;
  level?: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  prettyPrint?: boolean;
}

export function createLogger(options: LoggerOptions) {
  const { service, level = 'info', prettyPrint = false } = options;

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
    })
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
