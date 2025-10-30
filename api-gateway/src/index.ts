import app from './app';
import { config } from './config/env';
import { logger } from './middleware/logging';

// Start server
const server = app.listen(config.PORT, () => {
  logger.info(`🚀 API Gateway listening on port ${config.PORT}`);
  logger.info(`📍 Services: Auth(${config.AUTH_SERVICE_URL}), Chat(${config.CHAT_SERVICE_URL}), Billing(${config.BILLING_SERVICE_URL}), Analytics(${config.ANALYTICS_SERVICE_URL})`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});
