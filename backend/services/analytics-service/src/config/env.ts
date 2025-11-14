import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3004', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // ClickHouse
  clickhouse: {
    host: process.env.CLICKHOUSE_HOST || 'localhost',
    port: parseInt(process.env.CLICKHOUSE_PORT || '8123', 10),
    user: process.env.CLICKHOUSE_USER || 'analytics',
    password: process.env.CLICKHOUSE_PASSWORD || 'analytics_password',
    database: process.env.CLICKHOUSE_DB || 'analytics_db',
  },

  // RabbitMQ
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE || 'analytics.events',
    queue: process.env.RABBITMQ_QUEUE || 'analytics_events_queue',
  },

  // Monitoring
  prometheus: {
    enabled: process.env.PROMETHEUS_ENABLED === 'true',
  },
};

// Validate required config
export function validateConfig(): void {
  const required = [
    'CLICKHOUSE_HOST',
    'CLICKHOUSE_USER',
    'CLICKHOUSE_PASSWORD',
    'RABBITMQ_URL',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`⚠️  Missing optional environment variables: ${missing.join(', ')}`);
    console.warn('Using default values from config');
  }
}
