import { config, validateConfig } from './config/env';
import { logger } from './utils/logger';
import { initClickHouseClient, testClickHouseConnection } from './database/clickhouse.client';
import { initRabbitMQ, startConsumer, stopConsumer } from './events/consumer';
import { createApp } from './app';

async function startServer() {
  try {
    logger.info('🚀 Starting Analytics Service...');

    // Validate configuration
    validateConfig();

    // Initialize ClickHouse client
    initClickHouseClient();

    // Test ClickHouse connection
    const clickhouseOk = await testClickHouseConnection();
    if (!clickhouseOk) {
      logger.error('❌ ClickHouse connection failed. Exiting...');
      process.exit(1);
    }

    // Initialize RabbitMQ and start consumer
    await initRabbitMQ();
    await startConsumer();

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`✅ Analytics Service running on port ${config.port}`);
      logger.info(`📊 Environment: ${config.nodeEnv}`);
      logger.info(`🗄️  ClickHouse: ${config.clickhouse.host}:${config.clickhouse.port}`);
      logger.info(`🐰 RabbitMQ: ${config.rabbitmq.url}`);
      logger.info(`📈 Health check: http://localhost:${config.port}/health`);
      logger.info(`📊 Metrics: http://localhost:${config.port}/metrics`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(() => {
        logger.info('HTTP server closed');
      });

      // Stop event consumer
      await stopConsumer();

      // Close ClickHouse client
      const { closeClickHouseClient } = await import('./database/clickhouse.client');
      await closeClickHouseClient();

      logger.info('✅ Graceful shutdown completed');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('❌ Failed to start Analytics Service', error);
    process.exit(1);
  }
}

// Start the server
startServer();
