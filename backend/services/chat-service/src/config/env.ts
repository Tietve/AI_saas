import dotenv from 'dotenv';

dotenv.config();

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3002'),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',

  // OpenAI (Legacy - keeping for backward compatibility)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',

  // Google Gemini
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

  // JWT
  AUTH_SECRET: process.env.AUTH_SECRET || '',

  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Analytics Events
  RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672',
  ANALYTICS_EXCHANGE: process.env.ANALYTICS_EXCHANGE || 'analytics.events'
} as const;
