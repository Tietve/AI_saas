/**
 * Jaeger Distributed Tracing Library
 * Provides tracing capabilities across microservices
 */

import { initTracer, JaegerTracer } from 'jaeger-client';
import { FORMAT_HTTP_HEADERS, Span, SpanContext } from 'opentracing';
import { Request, Response, NextFunction } from 'express';

interface TracingConfig {
  serviceName: string;
  agentHost?: string;
  agentPort?: number;
  logSpans?: boolean;
}

export class JaegerTracing {
  private tracer: JaegerTracer;
  private serviceName: string;

  constructor(config: TracingConfig) {
    this.serviceName = config.serviceName;

    const tracerConfig = {
      serviceName: config.serviceName,
      sampler: {
        type: 'const',
        param: 1, // Sample 100% of requests
      },
      reporter: {
        logSpans: config.logSpans || false,
        agentHost: config.agentHost || 'localhost',
        agentPort: config.agentPort || 6832,
        collectorEndpoint: `http://${config.agentHost || 'localhost'}:14268/api/traces`,
      },
    };

    this.tracer = initTracer(tracerConfig, {
      logger: {
        info: (msg: string) => console.log(`[Jaeger] ${msg}`),
        error: (msg: string) => console.error(`[Jaeger] ${msg}`),
      },
    });

    console.log(`✅ Jaeger tracer initialized for service: ${config.serviceName}`);
  }

  /**
   * Get tracer instance
   */
  getTracer(): JaegerTracer {
    return this.tracer;
  }

  /**
   * Express middleware for automatic request tracing
   */
  middleware() {
    return (req: Request & { span?: Span }, res: Response, next: NextFunction) => {
      // Extract parent span context from incoming request headers
      const parentSpanContext = this.tracer.extract(
        FORMAT_HTTP_HEADERS,
        req.headers
      ) as SpanContext | null;

      // Start a new span for this request
      const span = this.tracer.startSpan(`HTTP ${req.method} ${req.path}`, {
        childOf: parentSpanContext || undefined,
        tags: {
          'span.kind': 'server',
          'http.method': req.method,
          'http.url': req.originalUrl || req.url,
          'http.path': req.path,
          'service.name': this.serviceName,
        },
      });

      // Add request details
      if (req.query && Object.keys(req.query).length > 0) {
        span.setTag('http.query', JSON.stringify(req.query));
      }

      if (req.body && Object.keys(req.body).length > 0) {
        // Don't log sensitive data
        const sanitizedBody = { ...req.body };
        delete sanitizedBody.password;
        delete sanitizedBody.passwordHash;
        delete sanitizedBody.token;
        span.setTag('http.body', JSON.stringify(sanitizedBody));
      }

      // Attach span to request for use in controllers
      req.span = span;

      // Finish span when response is sent
      const originalSend = res.send;
      res.send = function (data: any) {
        span.setTag('http.status_code', res.statusCode);

        if (res.statusCode >= 400) {
          span.setTag('error', true);
          span.log({
            event: 'error',
            message: `HTTP ${res.statusCode}`,
          });
        }

        span.finish();
        return originalSend.call(this, data);
      };

      // Handle response finish event
      res.on('finish', () => {
        if (!span.context()) {
          // Span was already finished by send override
          return;
        }
        span.setTag('http.status_code', res.statusCode);
        if (res.statusCode >= 400) {
          span.setTag('error', true);
        }
        span.finish();
      });

      next();
    };
  }

  /**
   * Create a child span for operations
   */
  createSpan(operationName: string, parentSpan?: Span): Span {
    return this.tracer.startSpan(operationName, {
      childOf: parentSpan,
    });
  }

  /**
   * Inject trace context into headers for outgoing requests
   */
  injectTraceContext(span: Span, headers: Record<string, string> = {}): Record<string, string> {
    this.tracer.inject(span, FORMAT_HTTP_HEADERS, headers);
    return headers;
  }

  /**
   * Extract trace context from headers
   */
  extractTraceContext(headers: Record<string, any>): SpanContext | null {
    return this.tracer.extract(FORMAT_HTTP_HEADERS, headers) as SpanContext | null;
  }

  /**
   * Close tracer (call on app shutdown)
   */
  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.tracer.close(() => {
        console.log(`✅ Jaeger tracer closed for service: ${this.serviceName}`);
        resolve();
      });
    });
  }
}

/**
 * Helper to trace database operations
 */
export function traceDatabaseOperation<T>(
  span: Span | undefined,
  operation: string,
  queryFunc: () => Promise<T>
): Promise<T> {
  if (!span) {
    return queryFunc();
  }

  const dbSpan = span.tracer().startSpan(`DB: ${operation}`, {
    childOf: span,
    tags: {
      'db.type': 'postgresql',
      'span.kind': 'client',
    },
  });

  return queryFunc()
    .then((result) => {
      dbSpan.setTag('db.success', true);
      dbSpan.finish();
      return result;
    })
    .catch((error) => {
      dbSpan.setTag('error', true);
      dbSpan.setTag('db.success', false);
      dbSpan.log({
        event: 'error',
        message: error.message,
        stack: error.stack,
      });
      dbSpan.finish();
      throw error;
    });
}

/**
 * Helper to trace external API calls
 */
export function traceExternalCall<T>(
  span: Span | undefined,
  serviceName: string,
  operation: string,
  callFunc: () => Promise<T>
): Promise<T> {
  if (!span) {
    return callFunc();
  }

  const externalSpan = span.tracer().startSpan(`External: ${serviceName}/${operation}`, {
    childOf: span,
    tags: {
      'span.kind': 'client',
      'peer.service': serviceName,
    },
  });

  return callFunc()
    .then((result) => {
      externalSpan.setTag('external.success', true);
      externalSpan.finish();
      return result;
    })
    .catch((error) => {
      externalSpan.setTag('error', true);
      externalSpan.setTag('external.success', false);
      externalSpan.log({
        event: 'error',
        message: error.message,
        stack: error.stack,
      });
      externalSpan.finish();
      throw error;
    });
}

/**
 * Export singleton instance factory
 */
let tracingInstance: JaegerTracing | null = null;

export function initializeTracing(config: TracingConfig): JaegerTracing {
  if (tracingInstance) {
    console.warn('⚠️  Tracing already initialized');
    return tracingInstance;
  }

  tracingInstance = new JaegerTracing(config);
  return tracingInstance;
}

export function getTracing(): JaegerTracing | null {
  if (!tracingInstance) {
    console.warn('⚠️  Tracing not initialized');
  }
  return tracingInstance;
}
