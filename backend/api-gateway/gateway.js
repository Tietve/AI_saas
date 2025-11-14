import Fastify from 'fastify';
import fastifyHttpProxy from '@fastify/http-proxy';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
        colorize: true
      }
    }
  },
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'reqId',
  disableRequestLogging: false,
  trustProxy: true
});

// Security headers
await fastify.register(fastifyHelmet, {
  contentSecurityPolicy: false, // Disable for development, enable in production
  crossOriginEmbedderPolicy: false
});

// CORS configuration
await fastify.register(fastifyCors, {
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:5173'], // Vite dev server ports
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID']
});

// Rate limiting
await fastify.register(fastifyRateLimit, {
  max: 100, // 100 requests
  timeWindow: '1 minute',
  cache: 10000,
  allowList: ['127.0.0.1'], // Whitelist localhost
  redis: null, // Use in-memory for development, Redis for production
  skipOnError: true,
  addHeaders: {
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true
  }
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return {
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  };
});

// Proxy for auth-service
await fastify.register(async function authProxy(fastify) {
  fastify.register(fastifyHttpProxy, {
    upstream: 'http://localhost:3001',
    prefix: '/api/auth',
    rewritePrefix: '/api/auth',
    http2: false,
    preHandler: async (request, reply) => {
      request.log.info({ url: request.url, method: request.method }, 'Proxying to auth-service');
    },
    replyOptions: {
      rewriteRequestHeaders: (originalReq, headers) => ({
        ...headers,
        'x-forwarded-for': originalReq.ip,
        'x-forwarded-proto': originalReq.protocol,
        'x-forwarded-host': originalReq.hostname
      })
    }
  });
});

// Proxy for chat-service
await fastify.register(async function chatProxy(fastify) {
  fastify.register(fastifyHttpProxy, {
    upstream: 'http://localhost:3003',
    prefix: '/api/chat',
    rewritePrefix: '/api/chat',
    http2: false,
    preHandler: async (request, reply) => {
      request.log.info({ url: request.url, method: request.method }, 'Proxying to chat-service');
    },
    replyOptions: {
      rewriteRequestHeaders: (originalReq, headers) => ({
        ...headers,
        'x-forwarded-for': originalReq.ip,
        'x-forwarded-proto': originalReq.protocol,
        'x-forwarded-host': originalReq.hostname
      })
    }
  });
});

// Proxy for conversations
await fastify.register(async function conversationsProxy(fastify) {
  fastify.register(fastifyHttpProxy, {
    upstream: 'http://localhost:3003',
    prefix: '/api/conversations',
    rewritePrefix: '/api/conversations',
    http2: false,
    preHandler: async (request, reply) => {
      request.log.info({ url: request.url, method: request.method }, 'Proxying to chat-service');
    }
  });
});

// Proxy for usage
await fastify.register(async function usageProxy(fastify) {
  fastify.register(fastifyHttpProxy, {
    upstream: 'http://localhost:3003',
    prefix: '/api/usage',
    rewritePrefix: '/api/usage',
    http2: false,
    preHandler: async (request, reply) => {
      request.log.info({ url: request.url, method: request.method }, 'Proxying to chat-service');
    }
  });
});

// Proxy for billing-service
await fastify.register(async function billingProxy(fastify) {
  fastify.register(fastifyHttpProxy, {
    upstream: 'http://localhost:3004',
    prefix: '/api/billing',
    rewritePrefix: '/api/billing',
    http2: false,
    preHandler: async (request, reply) => {
      request.log.info({ url: request.url, method: request.method }, 'Proxying to billing-service');
    },
    replyOptions: {
      rewriteRequestHeaders: (originalReq, headers) => ({
        ...headers,
        'x-forwarded-for': originalReq.ip,
        'x-forwarded-proto': originalReq.protocol,
        'x-forwarded-host': originalReq.hostname
      })
    }
  });
});

// Proxy for documents (orchestrator-service)
await fastify.register(async function documentsProxy(fastify) {
  fastify.register(fastifyHttpProxy, {
    upstream: 'http://localhost:3006',
    prefix: '/api/documents',
    rewritePrefix: '/api/documents',
    http2: false,
    preHandler: async (request, reply) => {
      request.log.info({ url: request.url, method: request.method }, 'Proxying to orchestrator-service (documents)');
    },
    replyOptions: {
      rewriteRequestHeaders: (originalReq, headers) => ({
        ...headers,
        'x-forwarded-for': originalReq.ip,
        'x-forwarded-proto': originalReq.protocol,
        'x-forwarded-host': originalReq.hostname
      })
    }
  });
});

// Proxy for orchestrator-service
await fastify.register(async function orchestratorProxy(fastify) {
  fastify.register(fastifyHttpProxy, {
    upstream: 'http://localhost:3006',
    prefix: '/api/orchestrator',
    rewritePrefix: '/api/orchestrator',
    http2: false,
    preHandler: async (request, reply) => {
      request.log.info({ url: request.url, method: request.method }, 'Proxying to orchestrator-service');
    },
    replyOptions: {
      rewriteRequestHeaders: (originalReq, headers) => ({
        ...headers,
        'x-forwarded-for': originalReq.ip,
        'x-forwarded-proto': originalReq.protocol,
        'x-forwarded-host': originalReq.hostname
      })
    }
  });
});

// Global error handler
fastify.setErrorHandler(async (error, request, reply) => {
  request.log.error(error);

  if (error.statusCode === 429) {
    return reply.status(429).send({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: error.retryAfter
    });
  }

  const statusCode = error.statusCode || 500;
  return reply.status(statusCode).send({
    error: error.name || 'Internal Server Error',
    message: error.message || 'An unexpected error occurred',
    statusCode,
    timestamp: new Date().toISOString(),
    path: request.url
  });
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 4000, host: '0.0.0.0' });
    console.log('\n🚀 Production API Gateway Started Successfully!\n');
    console.log('📡 Service Routes:');
    console.log('   /api/auth/*          → auth-service (3001)');
    console.log('   /api/chat/*          → chat-service (3003)');
    console.log('   /api/conversations/* → chat-service (3003)');
    console.log('   /api/usage/*         → chat-service (3003)');
    console.log('   /api/billing/*       → billing-service (3004)');
    console.log('   /api/orchestrator/*  → orchestrator-service (3006)');
    console.log('\n✨ Features Enabled:');
    console.log('   ✓ CORS with credentials');
    console.log('   ✓ Rate limiting (100 req/min)');
    console.log('   ✓ Security headers (Helmet)');
    console.log('   ✓ Request logging');
    console.log('   ✓ Error handling');
    console.log('   ✓ Health check at /health\n');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
