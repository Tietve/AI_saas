import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { register, collectDefaultMetrics } from 'prom-client';
import { config } from './config/env';
import authRoutes from './routes/auth.routes';
import debugRoutes from './routes/debug.routes';
import { globalRateLimiter } from './middleware/rate-limit';
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

// Initialize Event Publisher for Analytics
initEventPublisher({
  rabbitmqUrl: config.RABBITMQ_URL,
  exchange: config.ANALYTICS_EXCHANGE,
});

const app = express();
const logger = pino({ level: config.LOG_LEVEL || 'info' });

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

// Distributed tracing
app.use(tracingMiddleware(tracer));

// API Documentation
setupSwagger(app);

// Global rate limiting (100 req/15min per IP)
app.use('/api', globalRateLimiter);

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
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// API Routes
app.use('/api/auth', authRoutes);

// Debug routes (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/debug', debugRoutes);
}

// Sentry error handler (must be before other error handlers)
app.use(sentryErrorHandler());

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
