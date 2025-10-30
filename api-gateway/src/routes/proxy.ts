import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config/env';
import { authLimiter, chatLimiter } from '../middleware/rateLimiting';
import { logger } from '../middleware/logging';

const router = Router();

// Helper to create proxy with common options
const createProxy = (target: string, pathRewrite?: Record<string, string>) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    // Forward request body for POST/PUT/PATCH
    onProxyReq: (proxyReq, req: any) => {
      logger.debug(`Proxying ${req.method} ${req.url} to ${target}`);

      // Re-stream body for POST/PUT/PATCH requests
      if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onProxyRes: (proxyRes, req) => {
      logger.debug(`Received response from ${target} - ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
      logger.error({ err, url: req.url }, 'Proxy error');
      if (!res.headersSent) {
        res.status(502).json({
          error: 'Bad Gateway',
          message: 'Service temporarily unavailable'
        });
      }
    }
  });
};

// Auth Service Routes
router.use(
  '/auth',
  authLimiter,
  createProxy(config.AUTH_SERVICE_URL, { '^/auth': '/api/auth' })
);

// Chat Service Routes
router.use(
  '/chat',
  chatLimiter,
  createProxy(config.CHAT_SERVICE_URL, { '^/chat': '/api' })
);

// Billing Service Routes
router.use(
  '/billing',
  createProxy(config.BILLING_SERVICE_URL, { '^/billing': '/api' })
);

// Analytics Service Routes
router.use(
  '/analytics',
  createProxy(config.ANALYTICS_SERVICE_URL, { '^/analytics': '/api/analytics' })
);

export default router;
