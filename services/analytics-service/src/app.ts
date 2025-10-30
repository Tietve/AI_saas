import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { register } from 'prom-client';
import { logger } from './utils/logger';
import { testClickHouseConnection } from './database/clickhouse.client';
import analyticsRoutes from './routes/analytics.routes';

export function createApp(): Application {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });

  // Health check endpoint
  app.get('/health', async (req: Request, res: Response) => {
    try {
      const clickhouseOk = await testClickHouseConnection();

      const health = {
        status: clickhouseOk ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        service: 'analytics-service',
        version: '1.0.0',
        checks: {
          clickhouse: clickhouseOk ? 'up' : 'down',
        },
      };

      res.status(clickhouseOk ? 200 : 503).json(health);
    } catch (error) {
      logger.error('Health check failed', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'analytics-service',
        error: 'Health check failed',
      });
    }
  });

  // Prometheus metrics endpoint
  app.get('/metrics', async (req: Request, res: Response) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (error) {
      logger.error('Failed to get metrics', error);
      res.status(500).json({ error: 'Failed to get metrics' });
    }
  });

  // API routes
  app.use('/api/analytics', analyticsRoutes);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.method} ${req.path} not found`,
    });
  });

  // Error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });

    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
  });

  return app;
}
