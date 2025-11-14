import pino from 'pino';
import { config } from './config/env';
import { emailWorker } from './workers/email.worker';

const logger = pino({ level: config.LOG_LEVEL });

logger.info('=================================');
logger.info('Email Worker Service Starting...');
logger.info('=================================');
logger.info({
  NODE_ENV: config.NODE_ENV,
  REDIS_HOST: config.REDIS_HOST,
  REDIS_PORT: config.REDIS_PORT,
  SMTP_HOST: config.SMTP_HOST,
  SMTP_PORT: config.SMTP_PORT
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await emailWorker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await emailWorker.close();
  process.exit(0);
});

// Keep process alive
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

logger.info('✅ Email Worker Service is running');
