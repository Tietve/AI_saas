import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { register, collectDefaultMetrics } from 'prom-client';
import { config } from './config/env';
import chatRoutes from './routes/chat.routes';
import { initJaegerTracing, tracingMiddleware } from './tracing/jaeger';
import {
  initSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler
} from './config/sentry';
import { EventPublisher } from './shared/events';
import { performanceMonitoring } from '../../../shared/monitoring/performance.middleware';

// Initialize Sentry FIRST
initSentry({ serviceName: 'chat-service' });

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
const tracer = initJaegerTracing('chat-service');

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true
}));
// SECURITY FIX: Reduced body limit from 10mb to 1mb to prevent DoS attacks
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));
app.use(cookieParser());

// Sentry request tracking
app.use(sentryRequestHandler());
app.use(sentryTracingHandler());

app.use(pinoHttp({ logger }));

// Performance monitoring
app.use(performanceMonitoring());

// Distributed tracing
app.use(tracingMiddleware(tracer));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'chat-service',
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
app.use('/api', chatRoutes);

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
    logger.info(`chat-service listening on port ${config.PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    process.exit(0);
  });
}

export default app;
