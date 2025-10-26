/**
 * Jaeger Tracing for Auth Service
 */

import { initTracer, JaegerTracer } from 'jaeger-client';
import { FORMAT_HTTP_HEADERS, Span } from 'opentracing';
import { Request, Response, NextFunction } from 'express';

export function initJaegerTracing(serviceName: string): JaegerTracer {
  const config = {
    serviceName,
    sampler: {
      type: 'const',
      param: 1, // Sample 100% of requests
    },
    reporter: {
      logSpans: true,
      agentHost: process.env.JAEGER_AGENT_HOST || 'localhost',
      agentPort: parseInt(process.env.JAEGER_AGENT_PORT || '6831'),
    },
  };

  const tracer = initTracer(config, {
    logger: {
      info: (msg: string) => console.log(`[Jaeger] ${msg}`),
      error: (msg: string) => console.error(`[Jaeger] ${msg}`),
    },
  });

  console.log(`✅ Jaeger tracing initialized for ${serviceName}`);
  return tracer;
}

export function tracingMiddleware(tracer: JaegerTracer) {
  return (req: Request & { span?: Span }, res: Response, next: NextFunction) => {
    const parentSpanContext = tracer.extract(FORMAT_HTTP_HEADERS, req.headers);

    const span = tracer.startSpan(`${req.method} ${req.path}`, {
      childOf: parentSpanContext || undefined,
      tags: {
        'span.kind': 'server',
        'http.method': req.method,
        'http.url': req.originalUrl,
        'http.path': req.path,
        'service.name': 'auth-service',
      },
    });

    // Attach span to request
    req.span = span;

    // Finish span on response
    res.on('finish', () => {
      span.setTag('http.status_code', res.statusCode);
      if (res.statusCode >= 400) {
        span.setTag('error', true);
      }
      span.finish();
    });

    next();
  };
}
