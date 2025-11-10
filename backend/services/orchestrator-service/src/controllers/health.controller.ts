import { Request, Response } from 'express';
import { prisma } from '../config/database.config';
import { checkRedisConnection } from '../config/redis.config';
import { checkPineconeConnection } from '../config/pinecone.config';
import logger from '../config/logger.config';

/**
 * Basic health check
 */
export async function healthCheck(req: Request, res: Response) {
  res.status(200).json({
    status: 'ok',
    service: 'orchestrator-service',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Database health check
 */
export async function databaseHealthCheck(req: Request, res: Response) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      service: 'database',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[Health] Database check failed:', error);
    res.status(503).json({
      status: 'error',
      service: 'database',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Redis health check
 */
export async function redisHealthCheck(req: Request, res: Response) {
  try {
    const isHealthy = await checkRedisConnection();

    if (isHealthy) {
      res.status(200).json({
        status: 'ok',
        service: 'redis',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'error',
        service: 'redis',
        error: 'Redis connection failed',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('[Health] Redis check failed:', error);
    res.status(503).json({
      status: 'error',
      service: 'redis',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Pinecone health check
 */
export async function pineconeHealthCheck(req: Request, res: Response) {
  try {
    const isHealthy = await checkPineconeConnection();

    if (isHealthy) {
      res.status(200).json({
        status: 'ok',
        service: 'pinecone',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'error',
        service: 'pinecone',
        error: 'Pinecone connection failed',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('[Health] Pinecone check failed:', error);
    res.status(503).json({
      status: 'error',
      service: 'pinecone',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Comprehensive health check (all services)
 */
export async function allHealthChecks(req: Request, res: Response) {
  const results: any = {
    timestamp: new Date().toISOString(),
    services: {},
  };

  let overallStatus = 200;

  // Database
  try {
    await prisma.$queryRaw`SELECT 1`;
    results.services.database = { status: 'ok' };
  } catch (error) {
    results.services.database = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    overallStatus = 503;
  }

  // Redis
  try {
    const isHealthy = await checkRedisConnection();
    results.services.redis = { status: isHealthy ? 'ok' : 'error' };
    if (!isHealthy) overallStatus = 503;
  } catch (error) {
    results.services.redis = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    overallStatus = 503;
  }

  // Pinecone
  try {
    const isHealthy = await checkPineconeConnection();
    results.services.pinecone = { status: isHealthy ? 'ok' : 'error' };
    if (!isHealthy) overallStatus = 503;
  } catch (error) {
    results.services.pinecone = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    overallStatus = 503;
  }

  results.status = overallStatus === 200 ? 'ok' : 'degraded';

  res.status(overallStatus).json(results);
}
