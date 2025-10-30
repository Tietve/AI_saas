import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { register, collectDefaultMetrics } from 'prom-client';
import { config } from './config/env';
import { logger, httpLogger } from './middleware/logging';
import { globalLimiter } from './middleware/rateLimiting';
import proxyRoutes from './routes/proxy';
import { initJaegerTracing, tracingMiddleware } from './tracing/jaeger';

const app = express();

// Initialize Prometheus metrics
collectDefaultMetrics({ register });

// Initialize Jaeger tracing
const tracer = initJaegerTracing('api-gateway');

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (config.ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(httpLogger);

// Distributed tracing
app.use(tracingMiddleware(tracer));

// Global rate limiting
app.use('/api', globalLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Service info
app.get('/', (req, res) => {
  res.json({
    name: 'API Gateway',
    version: '1.0.0',
    services: {
      auth: config.AUTH_SERVICE_URL,
      chat: config.CHAT_SERVICE_URL,
      billing: config.BILLING_SERVICE_URL,
      analytics: config.ANALYTICS_SERVICE_URL
    },
    endpoints: {
      '/api/auth/*': 'Authentication service',
      '/api/chat/*': 'Chat service',
      '/api/billing/*': 'Billing service',
      '/api/analytics/*': 'Analytics service',
      '/health': 'Gateway health check',
      '/metrics': 'Prometheus metrics'
    }
  });
});

// Proxy routes
app.use('/api', proxyRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    availableRoutes: ['/api/auth', '/api/chat', '/api/billing', '/api/analytics', '/health', '/metrics']
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err, url: req.url }, 'Error occurred');

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(config.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;
