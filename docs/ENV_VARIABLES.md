# Environment Variables Documentation

This document lists all environment variables used across the AI SaaS platform services.

## Table of Contents

1. [Redis Configuration](#redis-configuration)
2. [Development Mode](#development-mode)
3. [Cost Limits & Monitoring](#cost-limits--monitoring)
4. [Cache Configuration](#cache-configuration)
5. [OpenAI Configuration](#openai-configuration)
6. [Database Configuration](#database-configuration)
7. [Service URLs](#service-urls)

---

## Redis Configuration

### Required for Production

```bash
# Redis connection URL (preferred method)
REDIS_URL=redis://localhost:6379

# OR use individual settings
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_password
REDIS_DB=0

# For Upstash Redis (serverless)
UPSTASH_REDIS_REST_URL=https://your-region.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

**Where Used**:
- `shared/cache/redis.client.ts` - Centralized Redis client
- `shared/queue/queue.service.ts` - BullMQ job queues
- `services/auth-service/src/services/queue.service.ts` - Email queue

**Default Values**:
- `REDIS_HOST`: `localhost`
- `REDIS_PORT`: `6379`
- `REDIS_DB`: `0`

---

## Development Mode

### Skip Expensive Operations in Development

```bash
# Skip OpenAI API calls - use mock responses
DEV_SKIP_OPENAI=true

# Skip Stripe API calls - use mock payments
DEV_SKIP_STRIPE=true

# Skip email sending - log emails instead
DEV_SKIP_EMAIL=true

# Node environment
NODE_ENV=development  # Automatically enables mock mode
```

**Where Used**:
- `shared/cache/cache.config.ts` - Dev config constants
- `services/chat-service/src/services/openai.service.ts` - OpenAI mock mode
- `services/billing-service/src/services/stripe.service.ts` - Stripe mock mode
- `services/email-worker/src/services/email.service.ts` - Email mock mode

**Benefits**:
- ✅ Zero cost for development/testing
- ✅ Faster local development (no API latency)
- ✅ No need for production API keys

---

## Cost Limits & Monitoring

### OpenAI Cost Thresholds

```bash
# Daily cost limit in USD
OPENAI_DAILY_LIMIT=100

# Hourly cost limit in USD
OPENAI_HOURLY_LIMIT=20

# Alert threshold percentage (default: 80)
# Alerts when reaching 80% of limit
COST_ALERT_THRESHOLD=80
```

**Where Used**:
- `shared/cache/cache.config.ts` - Threshold configuration
- `shared/monitoring/cost-tracker.service.ts` - Cost tracking & alerts
- `services/chat-service/src/services/chat.service.ts` - Cost recording

**How It Works**:
```bash
# When costs reach 80% of limit:
[CostTracker] ⚠️ ALERT: OpenAI hourly cost ($16.00) approaching limit ($20)

# When costs exceed limit:
[CostTracker] 🚨 CRITICAL: OpenAI daily limit EXCEEDED! ($105.00)
```

---

## Cache Configuration

### Cache TTL Settings (Optional)

```bash
# OpenAI response cache TTL (seconds)
# Default: 3600 (1 hour)
CACHE_OPENAI_TTL=3600

# User quota cache TTL (seconds)
# Default: 60 (1 minute)
CACHE_QUOTA_TTL=60

# Conversation messages cache TTL (seconds)
# Default: 300 (5 minutes)
CACHE_MESSAGES_TTL=300

# Analytics cache TTL (seconds)
# Default: 600 (10 minutes)
CACHE_ANALYTICS_TTL=600
```

**Where Used**:
- `shared/cache/cache.config.ts` - TTL constants

**Default Values** (if not set):
```typescript
export const CACHE_TTL = {
  USER_QUOTA: 60,                // 1 minute
  OPENAI_RESPONSE: 3600,         // 1 hour
  CONVERSATION_MESSAGES: 300,    // 5 minutes
  ANALYTICS_METRICS: 600,        // 10 minutes
  BILLING_PLAN_INFO: 86400,      // 24 hours
};
```

---

## OpenAI Configuration

### API Configuration

```bash
# OpenAI API Key
OPENAI_API_KEY=sk-your-openai-api-key

# Default model (optional)
OPENAI_DEFAULT_MODEL=gpt-4

# Max tokens for completions (optional)
OPENAI_MAX_TOKENS=2000
```

**Where Used**:
- `services/chat-service/src/services/openai.service.ts`
- `services/chat-service/src/config/env.ts`

**Supported Models**:
- `gpt-4` - Most capable, highest cost
- `gpt-4-turbo` - Faster, lower cost than GPT-4
- `gpt-4o` - Optimized for chat
- `gpt-4o-mini` - Fastest, lowest cost
- `gpt-3.5-turbo` - Fast and cheap

---

## Database Configuration

### PostgreSQL

```bash
# Database URL
DATABASE_URL=postgresql://user:password@localhost:5432/ai_saas

# For Neon (serverless PostgreSQL)
DATABASE_URL=postgresql://user:password@ep-xxx.region.neon.tech/dbname

# Connection pool settings (optional)
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

**Where Used**:
- All services with Prisma (auth, chat, billing)
- `services/*/prisma/schema.prisma`

---

## Service URLs

### Internal Service Communication

```bash
# Auth service URL
AUTH_SERVICE_URL=http://localhost:3001

# Chat service URL
CHAT_SERVICE_URL=http://localhost:3002

# Billing service URL
BILLING_SERVICE_URL=http://localhost:3003

# Analytics service URL
ANALYTICS_SERVICE_URL=http://localhost:3004

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

**Where Used**:
- `services/chat-service/src/services/billing-client.service.ts`
- All service `src/config/env.ts` files
- API Gateway routing configuration

---

## Complete Example `.env` File

```bash
# ============================================
# REDIS CONFIGURATION
# ============================================
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# ============================================
# DEVELOPMENT MODE
# ============================================
NODE_ENV=development
DEV_SKIP_OPENAI=true
DEV_SKIP_STRIPE=true
DEV_SKIP_EMAIL=true

# ============================================
# COST LIMITS & MONITORING
# ============================================
OPENAI_DAILY_LIMIT=100
OPENAI_HOURLY_LIMIT=20
COST_ALERT_THRESHOLD=80

# ============================================
# CACHE CONFIGURATION (OPTIONAL)
# ============================================
CACHE_OPENAI_TTL=3600
CACHE_QUOTA_TTL=60
CACHE_MESSAGES_TTL=300
CACHE_ANALYTICS_TTL=600

# ============================================
# OPENAI CONFIGURATION
# ============================================
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_DEFAULT_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000

# ============================================
# DATABASE CONFIGURATION
# ============================================
DATABASE_URL=postgresql://user:password@localhost:5432/ai_saas
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# ============================================
# SERVICE URLS
# ============================================
AUTH_SERVICE_URL=http://localhost:3001
CHAT_SERVICE_URL=http://localhost:3002
BILLING_SERVICE_URL=http://localhost:3003
ANALYTICS_SERVICE_URL=http://localhost:3004
FRONTEND_URL=http://localhost:3000

# ============================================
# OTHER SERVICES (EXISTING)
# ============================================
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SENTRY_DSN=https://your-sentry-dsn
RABBITMQ_URL=amqp://admin:admin@localhost:5672
```

---

## Environment-Specific Configuration

### Development

```bash
NODE_ENV=development
DEV_SKIP_OPENAI=true
DEV_SKIP_STRIPE=true
DEV_SKIP_EMAIL=true
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:password@localhost:5432/ai_saas_dev
```

### Staging

```bash
NODE_ENV=staging
DEV_SKIP_OPENAI=false
DEV_SKIP_STRIPE=false
DEV_SKIP_EMAIL=false
REDIS_URL=redis://staging-redis:6379
DATABASE_URL=postgresql://user:password@staging-db:5432/ai_saas_staging
OPENAI_DAILY_LIMIT=50
OPENAI_HOURLY_LIMIT=10
```

### Production

```bash
NODE_ENV=production
DEV_SKIP_OPENAI=false
DEV_SKIP_STRIPE=false
DEV_SKIP_EMAIL=false
REDIS_URL=redis://:password@production-redis:6379
DATABASE_URL=postgresql://user:password@production-db:5432/ai_saas_prod
OPENAI_DAILY_LIMIT=500
OPENAI_HOURLY_LIMIT=50
CACHE_OPENAI_TTL=7200  # 2 hours in production
```

---

## Monitoring Environment Variables

### Check Current Configuration

```bash
# In development
npm run dev

# Check logs for configuration
[Redis] Connected to Redis server
[OpenAIService] No valid API key or DEV mode enabled. Using MOCK responses.
[CostTracker] Daily limit set to $100
```

### Verify Redis Connection

```bash
# Test Redis connection
redis-cli -u $REDIS_URL ping
# Expected: PONG
```

### Verify Cache is Working

```bash
# Send duplicate messages and check logs
curl -X POST http://localhost:3002/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Expected logs:
[OpenAI Cache] Cache MISS for model gpt-4
[OpenAI] API call completed in 3500ms, cost: $0.0045
[OpenAI Cache] Cached response for model gpt-4

# Second request:
[OpenAI Cache] Cache HIT for model gpt-4
[OpenAI] Cache hit! Saved $0.0045
```

---

## Troubleshooting

### Redis Connection Issues

```bash
# Error: Redis connection failed
[Redis] Connection error: ECONNREFUSED

# Solution: Check Redis is running
redis-cli ping

# Start Redis if not running
redis-server
```

### OpenAI Mock Mode Not Working

```bash
# Issue: Still making real API calls in dev

# Check environment variables
echo $NODE_ENV          # Should be "development"
echo $DEV_SKIP_OPENAI   # Should be "true"

# Solution: Set variables correctly
export NODE_ENV=development
export DEV_SKIP_OPENAI=true
```

### Cache Not Working

```bash
# Issue: No cache hits

# Check Redis connection
redis-cli KEYS "openai:*"

# If no keys, check cache is being set
redis-cli MONITOR

# Look for SET commands in logs
```

---

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong passwords** for Redis in production
3. **Rotate API keys** regularly
4. **Use environment-specific** API keys (dev/staging/prod)
5. **Encrypt sensitive values** in production (use Kubernetes secrets)

---

## Additional Resources

- [Redis Configuration Guide](https://redis.io/docs/management/config/)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Upstash Redis](https://upstash.com/docs/redis/overall/getstarted)
- [Neon PostgreSQL](https://neon.tech/docs/introduction)

---

**Last Updated**: 2025-11-14
**Maintained By**: Development Team
