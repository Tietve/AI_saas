import dotenv from 'dotenv';
dotenv.config();

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),

  // Service URLs
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  CHAT_SERVICE_URL: process.env.CHAT_SERVICE_URL || 'http://localhost:3002',
  BILLING_SERVICE_URL: process.env.BILLING_SERVICE_URL || 'http://localhost:3003',
  ANALYTICS_SERVICE_URL: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3004',

  // CORS
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map(o => o.trim()),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};
