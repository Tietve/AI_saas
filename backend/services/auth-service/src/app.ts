import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { register, collectDefaultMetrics } from 'prom-client';
import { config } from './config/env';
import { logger } from './config/logger';
import { metrics } from './config/metrics';
import authRoutes from './routes/auth.routes';
import debugRoutes from './routes/debug.routes';
// import preferencesRoutes from './routes/preferences.routes';
// import workspaceRoutes from './routes/workspace.routes';
import { globalRateLimiter } from './middleware/rate-limit';
import { csrfProtection, csrfErrorHandler, generateCsrfToken } from './middleware/csrf.middleware';
import { initJaegerTracing, tracingMiddleware } from './tracing/jaeger';
import {
  initSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler
} from './config/sentry';
import { setupSwagger } from './config/swagger';
import { initEventPublisher } from './shared/events';

// Initialize Sentry FIRST (before Express app)
initSentry({ serviceName: 'auth-service' });

const app = express();

// Initialize Event Publisher for Analytics (skip in development if RabbitMQ not available)
if (config.NODE_ENV === 'production' || process.env.ENABLE_RABBITMQ === 'true') {
  initEventPublisher({
    rabbitmqUrl: config.RABBITMQ_URL,
    exchange: config.ANALYTICS_EXCHANGE,
  });
} else {
  logger.info('[EventPublisher] Skipping initialization in development mode (set ENABLE_RABBITMQ=true to enable)');
}

// Initialize Prometheus default metrics
collectDefaultMetrics({ register });

// Initialize Jaeger tracing
const tracer = initJaegerTracing('auth-service');

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Sentry request tracking (must be first after body parsers)
app.use(sentryRequestHandler());
app.use(sentryTracingHandler());

app.use(pinoHttp({ logger }));

// Metrics middleware
app.use(metrics.requestMetricsMiddleware());

// Distributed tracing
app.use(tracingMiddleware(tracer));

// API Documentation
setupSwagger(app);

// Global rate limiting (100 req/15min per IP)
app.use('/api', globalRateLimiter);

// CSRF Protection (enabled in production, optional in development)
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CSRF === 'true') {
  app.use(csrfProtection);
  logger.info('[CSRF] Protection enabled');
}

// Endpoint to get CSRF token (needed for forms/API clients)
app.get('/api/csrf-token', generateCsrfToken, (req, res) => {
  res.json({
    success: true,
    csrfToken: res.locals.csrfToken,
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'auth-service',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const metricsData = await metrics.getMetrics();
    res.set('Content-Type', 'text/plain');
    res.end(metricsData);
  } catch (error) {
    logger.error({ err: error }, 'Failed to get metrics');
    res.status(500).send('Error collecting metrics');
  }
});

// API Routes
app.use('/api/auth', authRoutes);
// TODO: Add Prisma models for workspace and preferences features
// app.use('/api/preferences', preferencesRoutes);
// app.use('/api/workspaces', workspaceRoutes);

// Debug routes (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/debug', debugRoutes);
}

// Sentry error handler (must be before other error handlers)
app.use(sentryErrorHandler());

// CSRF error handler (must be before generic error handler)
app.use(csrfErrorHandler);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// Only start server if this file is run directly (not imported for testing)
if (require.main === module) {
  const PORT = config.PORT || 3001;
  app.listen(PORT, () => {
    logger.info(`auth-service listening on port ${PORT}`);
    logger.info('Event publisher initialized for analytics');
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    process.exit(0);
  });
}

export default app;
