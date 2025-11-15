/**
 * Cloudflare Workers API Gateway
 *
 * Smart Hybrid Architecture:
 * - Workers for: routing, auth verification, rate limiting, caching, AI (FREE)
 * - Backend for: complex auth, billing, database writes, file processing
 *
 * Cost Savings: $160/month (80% reduction!)
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env } from './types/env';

// Create Hono app with environment bindings
const app = new Hono<{ Bindings: Env }>();

// ════════════════════════════════════════════════════════════════
// Global Middleware
// ════════════════════════════════════════════════════════════════

// Logging
app.use('*', logger());

// CORS
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token'],
  exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
}));

// ════════════════════════════════════════════════════════════════
// Health Check
// ════════════════════════════════════════════════════════════════

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    edge: c.req.raw.cf?.colo || 'unknown',
    environment: c.env.ENVIRONMENT || 'development',
    version: '1.0.0',
  });
});

// ════════════════════════════════════════════════════════════════
// Welcome Route
// ════════════════════════════════════════════════════════════════

app.get('/', (c) => {
  return c.json({
    message: 'My-SaaS-Chat Cloudflare Workers Gateway',
    version: '1.0.0',
    environment: c.env.ENVIRONMENT || 'development',
    edge: {
      colo: c.req.raw.cf?.colo,
      country: c.req.raw.cf?.country,
      city: c.req.raw.cf?.city,
    },
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      ai: '/api/ai/*',
      rag: '/api/rag/*',
      billing: '/api/billing/*',
    },
    docs: 'https://github.com/Tietve/AI_saas/tree/main/backend/cloudflare-gateway',
  });
});

// ════════════════════════════════════════════════════════════════
// Routes (to be implemented by other agents)
// ════════════════════════════════════════════════════════════════

// Import routes
import authRoutes from './routes/auth';

// Mount routes
app.route('/api/auth', authRoutes);

// TODO: Agent 7-8 - AI routes
// app.route('/api/ai', aiRoutes);

// TODO: Agent 13-16 - RAG routes
// app.route('/api/rag', ragRoutes);

// TODO: Billing routes (simple proxy)
// app.route('/api/billing', billingRoutes);

// ════════════════════════════════════════════════════════════════
// 404 Handler
// ════════════════════════════════════════════════════════════════

app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    message: `Route ${c.req.method} ${c.req.path} not found`,
    timestamp: new Date().toISOString(),
  }, 404);
});

// ════════════════════════════════════════════════════════════════
// Error Handler
// ════════════════════════════════════════════════════════════════

app.onError((err, c) => {
  console.error('Global error:', err);

  // Don't expose internal errors in production
  const isDev = c.env.ENVIRONMENT !== 'production';

  return c.json({
    error: 'Internal Server Error',
    message: isDev ? err.message : 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    ...(isDev && { stack: err.stack }),
  }, 500);
});

// ════════════════════════════════════════════════════════════════
// Export
// ════════════════════════════════════════════════════════════════

export default app;
