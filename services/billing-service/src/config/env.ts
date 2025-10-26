import dotenv from 'dotenv';
dotenv.config();

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3003', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  AUTH_SECRET: process.env.AUTH_SECRET || 'your-super-secret-jwt-key',

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',

  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Plan Prices (monthly in cents)
  PLAN_PLUS_PRICE: parseInt(process.env.PLAN_PLUS_PRICE || '990', 10),
  PLAN_PRO_PRICE: parseInt(process.env.PLAN_PRO_PRICE || '1990', 10),

  // Token Quotas (monthly)
  QUOTA_FREE: parseInt(process.env.QUOTA_FREE || '100000', 10),
  QUOTA_PLUS: parseInt(process.env.QUOTA_PLUS || '1000000', 10),
  QUOTA_PRO: parseInt(process.env.QUOTA_PRO || '5000000', 10),
};
