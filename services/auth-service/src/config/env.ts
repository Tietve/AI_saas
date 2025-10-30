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

export const config = envSchema.parse(process.env);
export type Config = z.infer<typeof envSchema>;
