import { Express } from 'express';
import { createProxyMiddleware, Filter, Options } from 'http-proxy-middleware';
import { config } from '../config/env';
import { authLimiter, chatLimiter } from '../middleware/rateLimiting';
import { logger } from '../middleware/logging';

// Helper to create proxy with common options
// When mounted at /api/auth, Express strips /api/auth from req.url
// So we need to prepend it back for backend services
const createProxy = (target: string, mountPath: string) => {
  const options: Options = {
    target,
    changeOrigin: true,
    // Forward cookies from browser to backend services
    cookieDomainRewrite: '',
    cookiePathRewrite: '/',
    // Handle both stripped and non-stripped paths
    // If path already has mount path, keep it; otherwise prepend it
    pathRewrite: (path, req) => {
      // If path already starts with mountPath, return as-is
      if (path.startsWith(mountPath)) {
        return path;
      }
      // Otherwise prepend mountPath (removing leading slash to avoid double slash)
      return mountPath + path;
    },
    onProxyReq: (proxyReq, req: any) => {
      logger.info(`[PROXY] ${req.method} ${req.originalUrl} -> ${target}${proxyReq.path}`);

      // Re-stream body for POST/PUT/PATCH requests
      if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onProxyRes: (proxyRes, req) => {
      logger.info(`[PROXY] Response ${proxyRes.statusCode} from ${target}`);
    },
    onError: (err, req, res: any) => {
      logger.error({ err, url: req.url }, 'Proxy error');
      if (!res.headersSent) {
        res.status(502).json({
          error: 'Bad Gateway',
          message: 'Service temporarily unavailable'
        });
      }
    }
  };

  return createProxyMiddleware(options);
};

// Export function to setup proxies on Express app
export const setupProxies = (app: Express) => {
  // Auth Service - /api/auth/* -> http://localhost:3001/api/auth/*
  app.use('/api/auth', authLimiter, createProxy(config.AUTH_SERVICE_URL, '/api/auth'));

  // Chat Service - /api/chat/* -> http://localhost:3002/api/chat/*
  app.use('/api/chat', chatLimiter, createProxy(config.CHAT_SERVICE_URL, '/api/chat'));

  // Conversations - /api/conversations/* -> http://localhost:3002/api/conversations/*
  app.use('/api/conversations', chatLimiter, createProxy(config.CHAT_SERVICE_URL, '/api/conversations'));

  // Usage - /api/usage/* -> http://localhost:3002/api/usage/*
  app.use('/api/usage', chatLimiter, createProxy(config.CHAT_SERVICE_URL, '/api/usage'));

  // Billing Service - /api/billing/* -> http://localhost:3003/api/billing/*
  app.use('/api/billing', createProxy(config.BILLING_SERVICE_URL, '/api/billing'));

  // Analytics Service - /api/analytics/* -> http://localhost:3004/api/analytics/*
  app.use('/api/analytics', createProxy(config.ANALYTICS_SERVICE_URL, '/api/analytics'));
};

// Deprecated: Export empty router for backward compatibility
import { Router } from 'express';
export default Router();
