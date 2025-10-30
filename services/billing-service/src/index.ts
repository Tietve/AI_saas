import app from './app';
import { config } from './config/env';
import pino from 'pino';

const logger = pino({ level: config.LOG_LEVEL });

// Start server
app.listen(config.PORT, () => {
  logger.info(`billing-service listening on port ${config.PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});
