import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.config';
import logger from './config/logger.config';
import { swaggerSpec } from './config/swagger.config';
import { connectDatabase, disconnectDatabase } from './config/database.config';
import { disconnectRedis } from './config/redis.config';
import { initPinecone } from './config/pinecone.config';
import healthRoutes from './routes/health.routes';
import orchestratorRoutes from './routes/orchestrator.routes';
import promptTemplateRoutes from './routes/prompt-template.routes';
import evalRoutes from './routes/eval.routes';
import documentRoutes from './routes/document.routes';
import promptUpgradeRoutes from './routes/prompt-upgrade.routes';
import { startCanaryIncrementJob } from './jobs/canary-increment.job';
import { startNightlyEvalsJob } from './jobs/nightly-evals.job';
import { sentryService } from './services/sentry.service';
import { metricsService } from './services/metrics.service';
import { apiLimiter, upgradeLimiter, evalLimiter } from './middleware/rate-limit.middleware';

// Initialize Sentry for error tracking
sentryService.init();

// Initialize Express app
const app: Application = express();

// Security: Helmet middleware with strict CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // For Swagger UI
      styleSrc: ["'self'", "'unsafe-inline'"], // For Swagger UI
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
}));

// Security: CORS with whitelist
const corsWhitelist = [
  'http://localhost:3000', // Frontend dev
  'http://localhost:3001', // Auth service
  'http://localhost:3006', // Orchestrator service (self)
  env.nodeEnv === 'production' ? 'https://your-production-domain.com' : null,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (corsWhitelist.indexOf(origin) !== -1 || env.nodeEnv === 'development') {
      callback(null, true);
    } else {
      logger.warn('[CORS] Blocked request from unauthorized origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  maxAge: 86400, // 24 hours
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging and metrics middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    // Log request
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
    });

    // Track metrics for upgrade requests
    if (req.url.includes('/api/upgrade')) {
      const status = res.statusCode < 400 ? 'success' : 'error';
      const userId = (req as any).userId; // Assuming userId is set by auth middleware

      metricsService.recordUpgradeRequest(status, userId);
      metricsService.recordUpgradeLatency(duration / 1000, status, userId);
    }
  });

  next();
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Orchestrator Service API Docs',
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await metricsService.getMetrics();
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
  } catch (error) {
    logger.error('[Metrics] Failed to generate metrics:', error);
    sentryService.captureException(error as Error, {
      component: 'metrics',
      operation: 'getMetrics',
    });
    res.status(500).json({
      success: false,
      error: 'Failed to generate metrics',
    });
  }
});

// Security: Apply rate limiters
app.use('/api', apiLimiter); // General API rate limiter

// Routes
app.use('/health', healthRoutes);
app.use('/api', orchestratorRoutes);
app.use('/api/prompts', promptTemplateRoutes);
app.use('/api/eval', evalLimiter, evalRoutes);
app.use('/api/documents', documentRoutes); // Stricter rate limit for eval endpoints
app.use('/api/orchestrator', upgradeLimiter, promptUpgradeRoutes); // Prompt upgrade with rate limit

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'orchestrator-service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.url} not found`,
    },
  });
});

// Error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', error);

  // Capture error in Sentry
  sentryService.captureException(error, {
    component: 'express',
    operation: `${req.method} ${req.url}`,
    userId: (req as any).userId,
    metadata: {
      method: req.method,
      url: req.url,
      body: req.body,
      query: req.query,
    },
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: env.nodeEnv === 'development' ? error.message : 'Internal server error',
      stack: env.nodeEnv === 'development' ? error.stack : undefined,
    },
  });
});

// Startup function
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Initialize Pinecone
    await initPinecone();

    // Start scheduled jobs
    startCanaryIncrementJob();
    startNightlyEvalsJob();

    // Start server
    const server = app.listen(env.port, () => {
      logger.info(`🚀 Orchestrator Service running on port ${env.port}`);
      logger.info(`📊 Environment: ${env.nodeEnv}`);
      logger.info(`🗄️  Database: Connected`);
      logger.info(`🔴 Redis: Connected`);
      logger.info(`🌲 Pinecone: Connected`);
      logger.info(`⏰ Scheduled jobs: Started`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await disconnectDatabase();
          await disconnectRedis();
          logger.info('All connections closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

export default app;
