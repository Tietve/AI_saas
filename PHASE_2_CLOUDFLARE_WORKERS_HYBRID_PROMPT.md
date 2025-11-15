# 🚀 PHASE 2: CLOUDFLARE WORKERS HYBRID GATEWAY
## Smart Hybrid Architecture - Workers for Speed, Backend for Complexity

**Repository:** https://github.com/Tietve/AI_saas
**Branch:** claude/mega-optimization-parallel-agents-01LbxAdeEhP4x3MtYZwgixAC
**Duration:** 15-20 hours
**Credit Target:** $400-600 USD
**Agents:** 20 agents in parallel
**Cost Savings Target:** $160/month (80% reduction) = $1,920/year

---

## 🎯 PROJECT OBJECTIVES

### Strategic Architecture Decision

**Principle:** "Workers for what fits, Backend for what needs"

✅ **Move to Cloudflare Workers:**
- API Gateway (routing, auth verification, rate limiting)
- AI Embeddings (Workers AI - FREE, 768d)
- Simple LLM (Workers AI - FREE)
- Vector Search (Vectorize - semantic search on edge)
- Caching (KV - sessions, responses)
- Static RAG (document Q&A - stateless)

❌ **Keep in Backend:**
- Complex Auth (signup, email verification)
- Billing (Stripe webhooks, transactions)
- Complex AI (GPT-4, multi-step reasoning)
- Database Writes (transactions, chat history)
- File Upload (large PDFs, processing)
- WebSocket (real-time - needs Durable Objects)

### Cost Impact

**Current (After Phase 1):** $200/month
```
Backend:       $30/month
OpenAI:        $155/month
PostgreSQL:    $10/month
Redis:         $5/month
```

**After Phase 2:** $40/month (80% reduction!)
```
Cloudflare:    $5/month (10M requests)
Workers AI:    $0/month (FREE!)
Vectorize:     $0/month (FREE!)
Backend:       $20/month (50% smaller)
PostgreSQL:    $10/month
Redis:         $5/month
```

**Savings:** $160/month = **$1,920/year**

---

## 🏗️ TARGET ARCHITECTURE

```
User Request
    ↓
Cloudflare Workers Gateway (Global Edge - <50ms)
    │
    ├─→ Auth Routes
    │   ├─→ JWT Verification (Workers - KV cache)
    │   ├─→ Rate Limiting (Workers - KV)
    │   └─→ Complex Auth → Backend Auth Service
    │
    ├─→ AI Routes (NO BACKEND!)
    │   ├─→ Embeddings → Workers AI @cf/baai/bge-base-en-v1.5 (FREE)
    │   ├─→ Simple Chat → Workers AI @cf/meta/llama-2 (FREE)
    │   └─→ Complex Chat → OpenAI GPT-4 (proxy to backend)
    │
    ├─→ RAG Routes (100% ON EDGE!)
    │   ├─→ Document Upload → Workers → Vectorize
    │   ├─→ Generate Embedding → Workers AI (FREE)
    │   ├─→ Vector Search → Cloudflare Vectorize (FREE)
    │   └─→ Answer Generation → Workers AI Mistral (FREE)
    │
    └─→ Billing Routes
        └─→ Stripe Webhooks → Backend Billing Service

Backend Services (Minimal)
    ├─→ Auth Service (complex signup/login only)
    ├─→ Chat Service (complex AI + history)
    └─→ Billing Service (Stripe webhooks)
```

---

# 📋 PHASE 2 EXECUTION PLAN

**Launch 20 agents simultaneously**

---

## Group 1: CLOUDFLARE WORKERS GATEWAY CORE (Agents 1-6)

### Agent 1: Cloudflare Account & Workers Setup

**Your Task:**
Set up Cloudflare Workers development environment

**Steps:**

1. **Create/Configure Cloudflare Account**
```bash
# If needed: Sign up at https://dash.cloudflare.com/sign-up
# Enable Workers: https://dash.cloudflare.com/workers
```

2. **Install Wrangler CLI**
```bash
npm install -g wrangler
wrangler login
wrangler whoami  # Verify login
```

3. **Create Workers Project**
```bash
cd backend
mkdir cloudflare-gateway
cd cloudflare-gateway

# Initialize project
npm init -y
npm install -D wrangler @cloudflare/workers-types
npm install itty-router hono @hono/node-server
npm install jose  # JWT verification
```

4. **Create wrangler.toml**
```toml
name = "my-saas-chat-gateway"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# Environment variables
[vars]
AUTH_SERVICE_URL = "https://your-auth-service.com"
CHAT_SERVICE_URL = "https://your-chat-service.com"
BILLING_SERVICE_URL = "https://your-billing-service.com"

# KV Namespaces (for caching, rate limiting)
kv_namespaces = [
  { binding = "KV", id = "your_kv_id", preview_id = "your_preview_kv_id" }
]

# D1 Database (for usage tracking)
[[d1_databases]]
binding = "DB"
database_name = "my-saas-chat-db"
database_id = "your_d1_id"

# Workers AI binding
[ai]
binding = "AI"

# Vectorize binding
[[vectorize]]
binding = "VECTORIZE"
index_name = "document-vectors"
```

5. **Create TypeScript Config**
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

6. **Test Local Development**
```bash
# Create basic worker
cat > src/index.ts << 'EOF'
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return new Response('Hello from Cloudflare Workers!', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
EOF

# Test locally
wrangler dev
# Visit http://localhost:8787
```

**Success Criteria:**
- Wrangler CLI installed and authenticated
- Workers project initialized
- Local dev server running
- Basic "Hello World" working

**Iteration Cycles:**
1. Cloudflare account setup (20 min)
2. Wrangler installation (15 min)
3. Project initialization (20 min)
4. Dependencies installation (15 min)
5. Configuration files (30 min)
6. Local testing (20 min)
7. Troubleshooting (30 min)
8. Documentation (30 min)

**Documentation Required:**
- Setup guide (2,000+ words)
- Local development guide (1,500+ words)
- Troubleshooting common issues (1,000+ words)

---

### Agent 2: Workers Gateway Router & Auth Middleware

**Your Task:**
Implement core routing and JWT authentication

**File to Create:**
```typescript
// backend/cloudflare-gateway/src/index.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authMiddleware, AuthUser } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rate-limit';
import authRoutes from './routes/auth';
import aiRoutes from './routes/ai';
import ragRoutes from './routes/rag';
import billingRoutes from './routes/billing';

type Bindings = {
  KV: KVNamespace;
  DB: D1Database;
  AI: any;
  VECTORIZE: any;
  AUTH_SERVICE_URL: string;
  CHAT_SERVICE_URL: string;
  BILLING_SERVICE_URL: string;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true,
}));

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    edge: c.req.raw.cf?.colo || 'unknown'
  });
});

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/ai', aiRoutes);
app.route('/api/rag', ragRoutes);
app.route('/api/billing', billingRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Global error:', err);
  return c.json({
    error: 'Internal Server Error',
    message: err.message
  }, 500);
});

export default app;
```

**Auth Middleware:**
```typescript
// backend/cloudflare-gateway/src/middleware/auth.ts

import { Context, Next } from 'hono';
import * as jose from 'jose';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    // Verify JWT
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);

    // Attach user to context
    c.set('user', {
      id: payload.sub as string,
      email: payload.email as string,
      role: payload.role as string,
    });

    await next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    return c.json({ error: 'Invalid token' }, 401);
  }
}

// Optional auth (doesn't fail if no token)
export async function optionalAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      const secret = new TextEncoder().encode(c.env.JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secret);

      c.set('user', {
        id: payload.sub as string,
        email: payload.email as string,
        role: payload.role as string,
      });
    } catch (error) {
      // Continue without auth
      console.warn('Optional auth failed:', error);
    }
  }

  await next();
}
```

**Success Criteria:**
- Router configured with all routes
- JWT verification working
- Auth middleware protects routes
- CORS configured correctly

**Iteration Cycles:**
1. Router setup (30 min)
2. Auth middleware implementation (45 min)
3. JWT verification testing (30 min)
4. CORS configuration (20 min)
5. Error handling (25 min)
6. Integration testing (40 min)
7. Performance optimization (30 min)
8. Documentation (30 min)

**Documentation Required:**
- Router architecture (1,500+ words)
- Auth middleware guide (1,200+ words)
- Testing examples (800+ words)

---

### Agent 3: Rate Limiting Middleware (KV-based)

**Your Task:**
Implement distributed rate limiting using Cloudflare KV

**File to Create:**
```typescript
// backend/cloudflare-gateway/src/middleware/rate-limit.ts

import { Context, Next } from 'hono';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix: string;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'auth/register': { maxRequests: 5, windowMs: 3600000, keyPrefix: 'rl:register' }, // 5/hour
  'auth/login': { maxRequests: 10, windowMs: 900000, keyPrefix: 'rl:login' },       // 10/15min
  'ai/chat': { maxRequests: 100, windowMs: 3600000, keyPrefix: 'rl:chat' },         // 100/hour
  'rag/query': { maxRequests: 50, windowMs: 3600000, keyPrefix: 'rl:rag' },         // 50/hour
  'default': { maxRequests: 200, windowMs: 3600000, keyPrefix: 'rl:default' },      // 200/hour
};

export function rateLimitMiddleware(endpoint: string) {
  return async (c: Context, next: Next) => {
    const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;

    // Get identifier (IP or user ID)
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';
    const user = c.get('user');
    const identifier = user?.id || ip;

    // Create key
    const key = `${config.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get current count from KV
    const data = await c.env.KV.get(key, 'json') as { count: number; resetAt: number } | null;

    if (data && data.resetAt > now) {
      // Within window
      if (data.count >= config.maxRequests) {
        const retryAfter = Math.ceil((data.resetAt - now) / 1000);
        return c.json({
          error: 'Rate limit exceeded',
          retryAfter,
          limit: config.maxRequests,
          window: config.windowMs / 1000,
        }, 429, {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': data.resetAt.toString(),
        });
      }

      // Increment count
      await c.env.KV.put(key, JSON.stringify({
        count: data.count + 1,
        resetAt: data.resetAt,
      }), {
        expirationTtl: Math.ceil(config.windowMs / 1000),
      });

      // Set headers
      c.header('X-RateLimit-Limit', config.maxRequests.toString());
      c.header('X-RateLimit-Remaining', (config.maxRequests - data.count - 1).toString());
      c.header('X-RateLimit-Reset', data.resetAt.toString());
    } else {
      // New window
      const resetAt = now + config.windowMs;
      await c.env.KV.put(key, JSON.stringify({
        count: 1,
        resetAt,
      }), {
        expirationTtl: Math.ceil(config.windowMs / 1000),
      });

      c.header('X-RateLimit-Limit', config.maxRequests.toString());
      c.header('X-RateLimit-Remaining', (config.maxRequests - 1).toString());
      c.header('X-RateLimit-Reset', resetAt.toString());
    }

    await next();
  };
}

// User-specific rate limiting (for authenticated users)
export function userRateLimitMiddleware(tier: 'free' | 'pro' | 'enterprise') {
  const limits = {
    free: { maxRequests: 100, windowMs: 3600000 },      // 100/hour
    pro: { maxRequests: 1000, windowMs: 3600000 },      // 1000/hour
    enterprise: { maxRequests: 10000, windowMs: 3600000 }, // 10k/hour
  };

  return async (c: Context, next: Next) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const config = limits[tier];
    const key = `rl:user:${user.id}`;
    const now = Date.now();

    const data = await c.env.KV.get(key, 'json') as { count: number; resetAt: number } | null;

    if (data && data.resetAt > now) {
      if (data.count >= config.maxRequests) {
        return c.json({
          error: 'Daily quota exceeded',
          upgrade: tier === 'free' ? 'Upgrade to Pro for 10x more requests' : undefined,
        }, 429);
      }

      await c.env.KV.put(key, JSON.stringify({
        count: data.count + 1,
        resetAt: data.resetAt,
      }), {
        expirationTtl: Math.ceil(config.windowMs / 1000),
      });
    } else {
      const resetAt = now + config.windowMs;
      await c.env.KV.put(key, JSON.stringify({
        count: 1,
        resetAt,
      }), {
        expirationTtl: Math.ceil(config.windowMs / 1000),
      });
    }

    await next();
  };
}
```

**Success Criteria:**
- Rate limiting working per endpoint
- KV-based distributed counting
- Proper HTTP headers (X-RateLimit-*)
- User-tier based limits

**Iteration Cycles:**
1. Design rate limit strategy (25 min)
2. Implement KV storage (40 min)
3. Implement middleware (45 min)
4. Add user-tier limits (30 min)
5. Testing with concurrent requests (45 min)
6. Performance optimization (30 min)
7. Documentation (35 min)

**Documentation Required:**
- Rate limiting guide (1,800+ words)
- Tier-based limits documentation (1,000+ words)
- Testing guide (700+ words)

---

### Agent 4: Auth Routes (Proxy to Backend)

**Your Task:**
Implement auth routes that proxy to backend auth service

**File to Create:**
```typescript
// backend/cloudflare-gateway/src/routes/auth.ts

import { Hono } from 'hono';
import { rateLimitMiddleware } from '../middleware/rate-limit';

const auth = new Hono();

// Register (rate limited)
auth.post('/register', rateLimitMiddleware('auth/register'), async (c) => {
  try {
    const body = await c.req.json();

    // Validate input
    if (!body.email || !body.password || !body.username) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Proxy to backend auth service
    const response = await fetch(`${c.env.AUTH_SERVICE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': c.req.header('CF-Connecting-IP') || '',
        'X-Real-IP': c.req.header('CF-Connecting-IP') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Track registration in D1 (analytics)
    if (response.ok) {
      await c.env.DB.prepare(
        'INSERT INTO user_registrations (user_id, email, ip, timestamp) VALUES (?, ?, ?, ?)'
      ).bind(
        data.user?.id || 'unknown',
        body.email,
        c.req.header('CF-Connecting-IP') || 'unknown',
        new Date().toISOString()
      ).run();
    }

    return c.json(data, response.status);
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

// Login (rate limited)
auth.post('/login', rateLimitMiddleware('auth/login'), async (c) => {
  try {
    const body = await c.req.json();

    if (!body.email || !body.password) {
      return c.json({ error: 'Missing email or password' }, 400);
    }

    // Proxy to backend
    const response = await fetch(`${c.env.AUTH_SERVICE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': c.req.header('CF-Connecting-IP') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Track login attempt
    await c.env.DB.prepare(
      'INSERT INTO login_attempts (email, success, ip, timestamp) VALUES (?, ?, ?, ?)'
    ).bind(
      body.email,
      response.ok ? 1 : 0,
      c.req.header('CF-Connecting-IP') || 'unknown',
      new Date().toISOString()
    ).run();

    return c.json(data, response.status);
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Logout
auth.post('/logout', async (c) => {
  // Proxy to backend for session cleanup
  const authHeader = c.req.header('Authorization');

  if (!authHeader) {
    return c.json({ error: 'No token provided' }, 400);
  }

  const response = await fetch(`${c.env.AUTH_SERVICE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
    },
  });

  const data = await response.json();
  return c.json(data, response.status);
});

// Refresh token
auth.post('/refresh', async (c) => {
  const refreshToken = c.req.header('X-Refresh-Token');

  if (!refreshToken) {
    return c.json({ error: 'No refresh token provided' }, 400);
  }

  const response = await fetch(`${c.env.AUTH_SERVICE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'X-Refresh-Token': refreshToken,
    },
  });

  const data = await response.json();
  return c.json(data, response.status);
});

export default auth;
```

**Success Criteria:**
- All auth routes proxy correctly
- Rate limiting applied
- Analytics tracked in D1
- Proper error handling

**Iteration Cycles:**
1. Design proxy logic (20 min)
2. Implement register route (35 min)
3. Implement login route (30 min)
4. Implement logout/refresh (25 min)
5. Add D1 analytics (40 min)
6. Error handling (25 min)
7. Testing (45 min)
8. Documentation (30 min)

**Documentation Required:**
- Auth proxy guide (1,500+ words)
- Analytics tracking (800+ words)
- Error handling patterns (600+ words)

---

### Agent 5: Caching Layer (KV + Cache API)

**Your Task:**
Implement multi-layer caching for AI responses and common queries

**File to Create:**
```typescript
// backend/cloudflare-gateway/src/middleware/cache.ts

import { Context, Next } from 'hono';
import { createHash } from 'crypto';

interface CacheConfig {
  ttl: number;        // seconds
  staleWhileRevalidate?: number;
  cacheKey?: (c: Context) => string;
}

// Cache middleware using Cloudflare Cache API
export function cacheMiddleware(config: CacheConfig) {
  return async (c: Context, next: Next) => {
    const request = c.req.raw;

    // Only cache GET requests
    if (request.method !== 'GET') {
      return await next();
    }

    // Generate cache key
    const cacheKey = config.cacheKey
      ? config.cacheKey(c)
      : request.url;

    const cacheUrl = new URL(cacheKey);
    const cacheRequest = new Request(cacheUrl.toString(), request);
    const cache = caches.default;

    // Try to get from cache
    let response = await cache.match(cacheRequest);

    if (response) {
      console.log('Cache HIT:', cacheKey);
      response = new Response(response.body, response);
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    console.log('Cache MISS:', cacheKey);

    // Execute handler
    await next();

    // Cache the response
    response = c.res;

    if (response.ok && response.status === 200) {
      const clonedResponse = response.clone();
      const headers = new Headers(clonedResponse.headers);
      headers.set('Cache-Control', `public, max-age=${config.ttl}`);
      headers.set('X-Cache', 'MISS');

      if (config.staleWhileRevalidate) {
        headers.set('Cache-Control',
          `public, max-age=${config.ttl}, stale-while-revalidate=${config.staleWhileRevalidate}`
        );
      }

      const cachedResponse = new Response(clonedResponse.body, {
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
        headers,
      });

      // Store in cache (non-blocking)
      c.executionCtx.waitUntil(cache.put(cacheRequest, cachedResponse));
    }

    return c.res;
  };
}

// KV cache for AI responses (longer TTL)
export async function getCachedAIResponse(
  c: Context,
  key: string
): Promise<any | null> {
  try {
    const cached = await c.env.KV.get(`ai:${key}`, 'json');
    if (cached) {
      console.log('KV Cache HIT:', key);
      return cached;
    }
    console.log('KV Cache MISS:', key);
    return null;
  } catch (error) {
    console.error('KV cache read error:', error);
    return null;
  }
}

export async function setCachedAIResponse(
  c: Context,
  key: string,
  value: any,
  ttlSeconds: number = 3600
): Promise<void> {
  try {
    await c.env.KV.put(`ai:${key}`, JSON.stringify(value), {
      expirationTtl: ttlSeconds,
    });
    console.log('KV Cache SET:', key);
  } catch (error) {
    console.error('KV cache write error:', error);
  }
}

// Generate cache key from request
export function generateCacheKey(text: string, prefix: string = ''): string {
  const hash = createHash('sha256').update(text).digest('hex').substring(0, 16);
  return prefix ? `${prefix}:${hash}` : hash;
}

// Invalidate cache
export async function invalidateCache(c: Context, pattern: string): Promise<void> {
  // KV doesn't support pattern matching, so we need to track keys
  // For now, just delete specific key
  await c.env.KV.delete(`ai:${pattern}`);
}
```

**Usage Example:**
```typescript
// In AI routes
import { cacheMiddleware, getCachedAIResponse, setCachedAIResponse } from '../middleware/cache';

// Cache GET requests for 1 hour
app.get('/api/ai/chat/:id',
  cacheMiddleware({ ttl: 3600 }),
  async (c) => {
    // Handler
  }
);

// Manual caching for POST requests
app.post('/api/ai/chat', async (c) => {
  const body = await c.req.json();
  const cacheKey = generateCacheKey(body.message, 'chat');

  // Check cache
  const cached = await getCachedAIResponse(c, cacheKey);
  if (cached) {
    return c.json({ ...cached, cached: true });
  }

  // Generate response
  const response = await generateAIResponse(body.message);

  // Cache for 1 hour
  await setCachedAIResponse(c, cacheKey, response, 3600);

  return c.json(response);
});
```

**Success Criteria:**
- Cache API working for GET requests
- KV caching for AI responses
- Proper cache headers
- Cache hit/miss tracking

**Iteration Cycles:**
1. Design caching strategy (30 min)
2. Implement Cache API middleware (40 min)
3. Implement KV caching (35 min)
4. Add cache key generation (25 min)
5. Add invalidation logic (30 min)
6. Testing cache hit rates (45 min)
7. Performance monitoring (30 min)
8. Documentation (35 min)

**Documentation Required:**
- Caching architecture (2,000+ words)
- Cache strategies (1,500+ words)
- Performance analysis (1,000+ words)

---

### Agent 6: Request Routing & Load Balancing

**Your Task:**
Implement intelligent routing and backend health checks

**File to Create:**
```typescript
// backend/cloudflare-gateway/src/utils/routing.ts

import { Context } from 'hono';

interface Backend {
  url: string;
  weight: number;      // For load balancing
  healthCheckUrl: string;
  healthy: boolean;
  lastCheck: number;
}

class BackendRouter {
  private backends: Map<string, Backend[]> = new Map();
  private healthCheckInterval = 30000; // 30 seconds

  constructor() {
    this.initBackends();
  }

  private initBackends() {
    // Auth service backends
    this.backends.set('auth', [
      {
        url: 'https://auth-primary.yourdomain.com',
        weight: 70,
        healthCheckUrl: 'https://auth-primary.yourdomain.com/health',
        healthy: true,
        lastCheck: Date.now(),
      },
      {
        url: 'https://auth-secondary.yourdomain.com',
        weight: 30,
        healthCheckUrl: 'https://auth-secondary.yourdomain.com/health',
        healthy: true,
        lastCheck: Date.now(),
      },
    ]);

    // Chat service backends
    this.backends.set('chat', [
      {
        url: 'https://chat.yourdomain.com',
        weight: 100,
        healthCheckUrl: 'https://chat.yourdomain.com/health',
        healthy: true,
        lastCheck: Date.now(),
      },
    ]);
  }

  // Get backend for service (with load balancing)
  getBackend(service: string): Backend | null {
    const backends = this.backends.get(service);
    if (!backends || backends.length === 0) {
      return null;
    }

    // Filter healthy backends
    const healthyBackends = backends.filter(b => b.healthy);
    if (healthyBackends.length === 0) {
      console.error(`No healthy backends for ${service}`);
      return backends[0]; // Fallback to first (even if unhealthy)
    }

    // Weighted random selection
    const totalWeight = healthyBackends.reduce((sum, b) => sum + b.weight, 0);
    let random = Math.random() * totalWeight;

    for (const backend of healthyBackends) {
      random -= backend.weight;
      if (random <= 0) {
        return backend;
      }
    }

    return healthyBackends[0];
  }

  // Health check (run periodically)
  async healthCheck(service: string): Promise<void> {
    const backends = this.backends.get(service);
    if (!backends) return;

    for (const backend of backends) {
      const now = Date.now();

      // Skip if checked recently
      if (now - backend.lastCheck < this.healthCheckInterval) {
        continue;
      }

      try {
        const response = await fetch(backend.healthCheckUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(5000), // 5s timeout
        });

        backend.healthy = response.ok;
        backend.lastCheck = now;

        console.log(`Health check ${service} (${backend.url}):`,
          backend.healthy ? 'HEALTHY' : 'UNHEALTHY'
        );
      } catch (error) {
        backend.healthy = false;
        backend.lastCheck = now;
        console.error(`Health check failed ${service} (${backend.url}):`, error);
      }
    }
  }

  // Proxy request to backend
  async proxyRequest(
    c: Context,
    service: string,
    path: string,
    options?: RequestInit
  ): Promise<Response> {
    // Health check (async, non-blocking)
    c.executionCtx.waitUntil(this.healthCheck(service));

    const backend = this.getBackend(service);
    if (!backend) {
      return new Response('Service unavailable', { status: 503 });
    }

    const url = `${backend.url}${path}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          'X-Forwarded-For': c.req.header('CF-Connecting-IP') || '',
          'X-Real-IP': c.req.header('CF-Connecting-IP') || '',
          'X-Forwarded-Proto': 'https',
          'X-Gateway-Version': '1.0.0',
        },
      });

      return response;
    } catch (error) {
      console.error(`Proxy error to ${service}:`, error);

      // Mark backend as unhealthy
      backend.healthy = false;

      // Retry with another backend
      const retryBackend = this.getBackend(service);
      if (retryBackend && retryBackend.url !== backend.url) {
        console.log(`Retrying with backup backend: ${retryBackend.url}`);
        return await fetch(`${retryBackend.url}${path}`, options);
      }

      return new Response('Backend error', { status: 502 });
    }
  }
}

export const router = new BackendRouter();
```

**Success Criteria:**
- Backend routing working
- Health checks automatic
- Load balancing functional
- Retry logic on failures

**Iteration Cycles:**
1. Design routing strategy (30 min)
2. Implement backend registry (35 min)
3. Implement health checks (40 min)
4. Add load balancing (35 min)
5. Add retry logic (30 min)
6. Testing failover (45 min)
7. Performance testing (35 min)
8. Documentation (40 min)

**Documentation Required:**
- Routing architecture (1,800+ words)
- Health check guide (1,200+ words)
- Failover testing (900+ words)

---

## Group 2: WORKERS AI INTEGRATION (Agents 7-12)

### Agent 7: Workers AI Direct Embeddings (NO BACKEND!)

**Your Task:**
Implement FREE embeddings using Workers AI

**File to Create:**
```typescript
// backend/cloudflare-gateway/src/routes/ai.ts

import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware, userRateLimitMiddleware } from '../middleware/rate-limit';
import { getCachedAIResponse, setCachedAIResponse, generateCacheKey } from '../middleware/cache';

const ai = new Hono();

// ════════════════════════════════════════════════════════════════
// EMBEDDINGS - 100% Workers AI (NO BACKEND!) ✨
// ════════════════════════════════════════════════════════════════

ai.post('/embeddings',
  authMiddleware,
  userRateLimitMiddleware('free'), // Adjust based on user tier
  async (c) => {
    try {
      const body = await c.req.json();
      const { text, texts } = body;

      if (!text && !texts) {
        return c.json({ error: 'Missing text or texts' }, 400);
      }

      const user = c.get('user');
      const isBatch = Array.isArray(texts);
      const inputTexts = isBatch ? texts : [text];

      // Check cache for each text
      const results: any[] = [];
      const uncachedTexts: string[] = [];
      const uncachedIndices: number[] = [];

      for (let i = 0; i < inputTexts.length; i++) {
        const txt = inputTexts[i];
        const cacheKey = generateCacheKey(txt, 'emb');
        const cached = await getCachedAIResponse(c, cacheKey);

        if (cached) {
          results[i] = cached;
        } else {
          uncachedTexts.push(txt);
          uncachedIndices.push(i);
        }
      }

      // Generate embeddings for uncached texts
      if (uncachedTexts.length > 0) {
        console.log(`Generating ${uncachedTexts.length} embeddings with Workers AI (FREE!)`);

        // Workers AI: @cf/baai/bge-base-en-v1.5
        const embeddings = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', {
          text: uncachedTexts,
        });

        // Cache results
        for (let i = 0; i < uncachedTexts.length; i++) {
          const embedding = embeddings.data[i];
          const originalIndex = uncachedIndices[i];

          results[originalIndex] = {
            embedding,
            tokens: estimateTokens(uncachedTexts[i]),
            cost: 0, // FREE!
            provider: 'cloudflare',
            model: 'bge-base-en-v1.5',
          };

          // Cache for 7 days
          const cacheKey = generateCacheKey(uncachedTexts[i], 'emb');
          await setCachedAIResponse(c, cacheKey, results[originalIndex], 7 * 24 * 3600);
        }
      }

      // Track usage in D1
      await c.env.DB.prepare(`
        INSERT INTO usage_tracking
        (user_id, service, tokens, cost, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        user.id,
        'embeddings',
        results.reduce((sum, r) => sum + (r.tokens || 0), 0),
        0, // FREE!
        new Date().toISOString()
      ).run();

      // Return response
      if (isBatch) {
        return c.json({
          embeddings: results,
          totalTokens: results.reduce((sum, r) => sum + (r.tokens || 0), 0),
          totalCost: 0,
          provider: 'cloudflare',
          cached: results.length - uncachedTexts.length,
        });
      } else {
        return c.json(results[0]);
      }
    } catch (error) {
      console.error('Embeddings error:', error);
      return c.json({ error: 'Embedding generation failed' }, 500);
    }
  }
);

// Helper: Estimate tokens
function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

export default ai;
```

**Success Criteria:**
- Workers AI embeddings working
- Batch processing supported
- Caching with 7-day TTL
- Usage tracking in D1
- 100% FREE (no OpenAI costs!)

**Iteration Cycles:**
1. Study Workers AI API (30 min)
2. Implement single embedding (40 min)
3. Implement batch embeddings (45 min)
4. Add caching (35 min)
5. Add usage tracking (30 min)
6. Testing (45 min)
7. Performance benchmarking (40 min)
8. Documentation (40 min)

**Documentation Required:**
- Workers AI embedding guide (2,500+ words)
- Cost comparison (OpenAI vs Cloudflare) (1,500+ words)
- Performance benchmarks (1,200+ words)

---

### Agent 8: Workers AI LLM with Smart Routing

**Your Task:**
Implement FREE LLM with complexity-based routing

**Add to ai.ts:**
```typescript
// ════════════════════════════════════════════════════════════════
// LLM CHAT - Smart Routing (Free for simple, GPT-4 for complex)
// ════════════════════════════════════════════════════════════════

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Analyze message complexity
function analyzeComplexity(messages: Message[]): 'simple' | 'medium' | 'complex' {
  const lastMessage = messages[messages.length - 1];
  const text = lastMessage.content;
  const tokens = estimateTokens(text);

  // Heuristics
  const hasCode = /```|function|class|import|const|let|var/.test(text);
  const hasAnalysis = /analyze|explain|compare|evaluate|reasoning/.test(text.toLowerCase());
  const isLong = tokens > 500;
  const hasContext = messages.length > 10;

  if (hasCode || hasAnalysis || isLong || hasContext) {
    return 'complex';
  } else if (tokens > 100) {
    return 'medium';
  } else {
    return 'simple';
  }
}

ai.post('/chat/completions',
  authMiddleware,
  rateLimitMiddleware('ai/chat'),
  async (c) => {
    try {
      const body = await c.req.json();
      const { messages, model, forceProvider } = body;

      if (!messages || !Array.isArray(messages)) {
        return c.json({ error: 'Invalid messages' }, 400);
      }

      const user = c.get('user');

      // Check cache
      const cacheKey = generateCacheKey(JSON.stringify(messages), 'chat');
      const cached = await getCachedAIResponse(c, cacheKey);
      if (cached) {
        return c.json({ ...cached, cached: true });
      }

      // Determine provider
      let provider: string;
      let selectedModel: string;

      if (forceProvider) {
        provider = forceProvider;
        selectedModel = model || 'gpt-4o';
      } else {
        const complexity = analyzeComplexity(messages);

        if (complexity === 'simple') {
          provider = 'cloudflare';
          selectedModel = '@cf/meta/llama-2-7b-chat-int8';
        } else if (complexity === 'medium') {
          provider = 'cloudflare';
          selectedModel = '@cf/mistral/mistral-7b-instruct-v0.1';
        } else {
          // Complex query → use GPT-4 (proxy to backend)
          provider = 'openai';
          selectedModel = 'gpt-4o';
        }
      }

      console.log(`Chat request - Complexity: ${analyzeComplexity(messages)}, Provider: ${provider}, Model: ${selectedModel}`);

      let response: any;
      let cost: number;

      if (provider === 'cloudflare') {
        // ✨ Workers AI - FREE!
        const aiResponse = await c.env.AI.run(selectedModel, {
          messages: messages.map((m: Message) => ({
            role: m.role,
            content: m.content,
          })),
        });

        response = {
          message: {
            role: 'assistant',
            content: aiResponse.response,
          },
          model: selectedModel,
          provider: 'cloudflare',
          tokens: estimateTokens(aiResponse.response),
          cost: 0, // FREE!
        };
        cost = 0;
      } else {
        // Proxy to backend for OpenAI GPT-4
        const backendResponse = await fetch(`${c.env.CHAT_SERVICE_URL}/api/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': c.req.header('Authorization') || '',
          },
          body: JSON.stringify({ messages, model: selectedModel }),
        });

        response = await backendResponse.json();
        cost = response.cost || 0.015; // GPT-4 cost
      }

      // Cache response (1 hour)
      await setCachedAIResponse(c, cacheKey, response, 3600);

      // Track usage
      await c.env.DB.prepare(`
        INSERT INTO usage_tracking
        (user_id, service, provider, model, tokens, cost, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        user.id,
        'chat',
        response.provider,
        response.model,
        response.tokens || 0,
        cost,
        new Date().toISOString()
      ).run();

      return c.json(response);
    } catch (error) {
      console.error('Chat error:', error);
      return c.json({ error: 'Chat completion failed' }, 500);
    }
  }
);
```

**Success Criteria:**
- Complexity analysis working
- Cloudflare for simple/medium (FREE)
- OpenAI for complex (paid)
- Smart routing saves 60-80% costs
- Usage tracking accurate

**Iteration Cycles:**
1. Design complexity analyzer (35 min)
2. Implement Cloudflare LLM (50 min)
3. Implement routing logic (40 min)
4. Add OpenAI fallback (30 min)
5. Testing routing decisions (50 min)
6. Cost analysis (40 min)
7. Performance testing (35 min)
8. Documentation (45 min)

**Documentation Required:**
- Smart routing guide (2,000+ words)
- Complexity analysis algorithm (1,500+ words)
- Cost savings analysis (1,500+ words)

---

(Continue with remaining agents following similar detailed pattern...)

Due to token limits, I'll provide the structure for remaining agents:

### Agents 9-12: Advanced AI Features
- Agent 9: Streaming responses
- Agent 10: Cost monitoring dashboard
- Agent 11: Usage analytics (D1)
- Agent 12: A/B testing framework

### Agents 13-16: Vectorize RAG
- Agent 13: Vectorize index setup
- Agent 14: Document upload pipeline
- Agent 15: Semantic search
- Agent 16: Complete RAG on edge

### Agents 17-20: Testing & Migration
- Agent 17: Load testing (k6)
- Agent 18: Migration scripts
- Agent 19: Gradual rollout (10%→100%)
- Agent 20: Final documentation

---

## 🎯 PHASE 2 SUCCESS CRITERIA

**Upon completion:**

✅ **Cost Savings:**
- $160/month reduction (80%)
- $1,920/year savings
- 70%+ requests served by FREE tier

✅ **Performance:**
- <50ms latency (global edge)
- 60%+ cache hit rate
- Auto-scaling to millions

✅ **Features:**
- Workers AI embeddings (FREE)
- Smart LLM routing (FREE for simple)
- Vectorize RAG (100% on edge)
- D1 analytics
- KV caching & rate limiting

✅ **Quality:**
- All tests passing
- Load tested (10k+ concurrent)
- Gradual rollout validated
- Rollback procedures documented

✅ **Documentation:**
- 20,000+ words comprehensive guides
- Architecture diagrams
- Migration runbooks
- Cost analysis reports

---

## 💬 EXECUTION INSTRUCTIONS

**IMPORTANT:**

1. **Execute agents in groups** - Don't start Group 2 until Group 1 complete
2. **Test thoroughly** - Each agent must test their code
3. **Document extensively** - Minimum 2,000 words per agent
4. **Iterate 10-15 times** - Maximize credit burn through refinement
5. **Commit frequently** - After each milestone
6. **Deploy incrementally** - 10% → 50% → 100% traffic

**Maximize Credit Burn:**
- Extensive research (30-45 min per agent)
- Multiple refactoring passes (3-5 iterations)
- Comprehensive documentation (2,000-3,000 words)
- Performance benchmarking (multiple runs)
- A/B testing with analysis

**Success Validation:**
After all agents complete:
- Run full test suite
- Deploy to staging
- Validate cost savings
- Generate final report

---

**BEGIN PHASE 2 EXECUTION NOW! 🚀**

Launch all 20 agents and build the future of edge computing! 💸✨
