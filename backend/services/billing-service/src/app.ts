import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { register, collectDefaultMetrics } from 'prom-client';
import { config } from './config/env';
import billingRoutes from './routes/billing.routes';
import { initJaegerTracing, tracingMiddleware } from '@saas/shared/dist/tracing/jaeger';
import {
  initSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler
} from '@saas/shared/dist/config';
import { EventPublisher } from '@saas/shared/dist/events';

// Initialize Sentry FIRST
initSentry({ serviceName: 'billing-service' });

const app = express();
const logger = pino({ level: config.LOG_LEVEL });

// Initialize Event Publisher for Analytics
EventPublisher.getInstance().initialize(config.RABBITMQ_URL, config.ANALYTICS_EXCHANGE)
  .then(() => {
    logger.info('Event publisher initialized for analytics');
  })
  .catch((error) => {
    logger.error('Failed to initialize event publisher', error);
  });

// Initialize Prometheus metrics
collectDefaultMetrics({ register });

// Initialize Jaeger tracing
const tracer = initJaegerTracing('billing-service');

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Sentry request tracking
app.use(sentryRequestHandler());
app.use(sentryTracingHandler());

app.use(pinoHttp({ logger }));

// Distributed tracing
app.use(tracingMiddleware(tracer));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'billing-service',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// API Routes
app.use('/api', billingRoutes);

// Sentry error handler (must be before other error handlers)
app.use(sentryErrorHandler());

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(config.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// Start server
if (require.main === module) {
  app.listen(config.PORT, () => {
    logger.info(`billing-service listening on port ${config.PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    process.exit(0);
  });
}

export default app;
