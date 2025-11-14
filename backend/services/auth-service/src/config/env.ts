import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  RABBITMQ_URL: z.string().default('amqp://admin:admin@localhost:5672'),
  ANALYTICS_EXCHANGE: z.string().default('analytics.events'),
  AUTH_SECRET: z.string().optional(),
  REQUIRE_EMAIL_VERIFICATION: z.string().optional(),
});

// Parse environment variables
export const config = envSchema.parse(process.env);

// CRITICAL: Validate AUTH_SECRET in production
if (config.NODE_ENV === 'production') {
  if (!config.AUTH_SECRET) {
    throw new Error(
      'CRITICAL SECURITY ERROR: AUTH_SECRET environment variable must be set in production. ' +
      'Generate a strong secret with: openssl rand -base64 48'
    );
  }

  if (config.AUTH_SECRET.length < 32) {
    throw new Error(
      'CRITICAL SECURITY ERROR: AUTH_SECRET must be at least 32 characters long in production. ' +
      `Current length: ${config.AUTH_SECRET.length}. ` +
      'Generate a strong secret with: openssl rand -base64 48'
    );
  }
}

export type Config = z.infer<typeof envSchema>;
