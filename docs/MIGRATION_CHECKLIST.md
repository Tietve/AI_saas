# Production Migration Checklist

Complete checklist to migrate your AI SaaS platform to production with all optimizations enabled.

---

## 📋 Pre-Migration Tasks

### 1. Environment Configuration

- [ ] Copy `.env.example` to `.env.local`
- [ ] Generate secure `AUTH_SECRET` (min 32 chars):
  ```bash
  openssl rand -base64 32
  ```
- [ ] Configure database URL with connection pooling:
  ```env
  DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&connection_limit=10&pool_timeout=20&connect_timeout=10"
  ```
- [ ] Set up Redis (Upstash recommended):
  ```env
  UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
  UPSTASH_REDIS_REST_TOKEN="your-token"
  ```
- [ ] Configure AI provider API keys:
  ```env
  OPENAI_API_KEY="sk-..."
  ANTHROPIC_API_KEY="sk-ant-..."
  GOOGLE_API_KEY="AIza..."
  ```
- [ ] Set up Sentry:
  ```env
  SENTRY_DSN="https://...@sentry.io/..."
  NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
  ```

### 2. Database Setup

- [ ] Run migrations:
  ```bash
  npm run db:migrate:prod
  ```
- [ ] Verify indexes:
  ```bash
  npx prisma studio
  # Check all tables have proper indexes
  ```
- [ ] Test database connection:
  ```bash
  npm run test:db
  ```
- [ ] Create database backup strategy

### 3. Dependencies

- [ ] Install production dependencies:
  ```bash
  npm install
  ```
- [ ] Verify no vulnerabilities:
  ```bash
  npm audit fix
  ```
- [ ] Update to latest stable versions

---

## 🚀 Migration Steps

### Step 1: Update Next.js Configuration

**File**: `next.config.js`

```javascript
module.exports = {
  experimental: {
    instrumentationHook: true, // Enable cron jobs & instrumentation
  },

  // Production optimizations
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}
```

### Step 2: Update Database Connection String

**File**: `.env.local`

```env
# Development
DATABASE_URL="postgresql://localhost:5432/dev?connection_limit=5"

# Production
DATABASE_URL="postgresql://prod-host:5432/prod?connection_limit=10&pool_timeout=20&connect_timeout=10&sslmode=require"
```

### Step 3: Configure Semantic Cache

**File**: `.env.local`

```env
SEMANTIC_CACHE_THRESHOLD="0.95"
SEMANTIC_CACHE_TTL="3600"
SEMANTIC_CACHE_MAX_RESULTS="10"
```

### Step 4: Replace console.log with Logger

**Find all instances**:
```bash
grep -r "console\." src/
```

**Replace**:
```typescript
// ❌ Old
console.log('User logged in:', userId)
console.error('Error:', error)

// ✅ New
import { logger } from '@/lib/logger'

logger.info({ userId }, 'User logged in')
logger.error({ err: error }, 'Error occurred')
```

### Step 5: Add Validation to API Routes

**Example**: `src/app/api/auth/signup/route.ts`

```typescript
import { validateRequest, withErrorHandler } from '@/lib/validation/middleware'
import { signupSchema } from '@/lib/validation/schemas'

export const POST = withErrorHandler(async (req: Request) => {
  // Validate input
  const body = await validateRequest(req, signupSchema)

  // ... rest of handler
})
```

### Step 6: Enable CSRF Protection on Client

**File**: `src/lib/api-client.ts` (create if not exists)

```typescript
// Fetch CSRF token
async function getCsrfToken() {
  const response = await fetch('/api/csrf')
  const { token } = await response.json()
  return token
}

// Use in requests
const token = await getCsrfToken()
fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': token,
  },
  body: JSON.stringify(data),
})
```

### Step 7: Optimize Database Queries

**Find N+1 queries**:
```bash
npm run dev
# Look for "Potential N+1 detected" in logs
```

**Replace with optimized helpers**:
```typescript
import {
  getUserWithSubscription,
  getConversationWithMessages,
  getUserConversations,
} from '@/lib/database/query-optimizer'
```

### Step 8: Test Cron Jobs

```typescript
// Manual test
import {
  triggerQuotaResetManually,
  triggerSubscriptionRenewalManually
} from '@/lib/cron'

await triggerQuotaResetManually()
await triggerSubscriptionRenewalManually()
```

---

## ✅ Testing Checklist

### Functionality Tests

- [ ] User can sign up and verify email
- [ ] User can sign in and get session
- [ ] User can send chat messages
- [ ] AI responses are received correctly
- [ ] Semantic cache works (check logs for "cache HIT")
- [ ] CSRF protection works (test with/without token)
- [ ] Rate limiting works
- [ ] Quota enforcement works
- [ ] Payment flow works
- [ ] Webhook processing works

### Performance Tests

- [ ] Database queries < 100ms average
- [ ] No N+1 queries detected
- [ ] Semantic cache hit rate > 20%
- [ ] AI response time < 2s
- [ ] Page load time < 1s
- [ ] Connection pool stable (no exhaustion)

### Monitoring Tests

- [ ] Logs appear in console/file
- [ ] Sentry captures errors
- [ ] Slow queries are logged
- [ ] AI costs are tracked
- [ ] Database health check works:
  ```typescript
  import { checkDatabaseHealth } from '@/lib/prisma'
  const health = await checkDatabaseHealth()
  console.log(health) // { healthy: true, latency: 10 }
  ```

---

## 🔍 Verification Commands

```bash
# 1. Build check
npm run build

# 2. Type check
npm run type-check

# 3. Database check
npm run test:db

# 4. Lint check
npm run lint

# 5. Start production build locally
npm run start

# 6. Check logs
tail -f logs/combined.log
```

---

## 📊 Post-Migration Monitoring

### Day 1: Critical Monitoring

- [ ] Error rate < 0.1%
- [ ] Response time < 2s P95
- [ ] Database connections stable
- [ ] No memory leaks
- [ ] CSRF protection working
- [ ] Semantic cache operational

### Week 1: Performance Monitoring

- [ ] Cache hit rate trending up (target: 30%+)
- [ ] AI costs decreasing
- [ ] Database query times improving
- [ ] No slow query alerts
- [ ] Subscription renewals working
- [ ] Quota resets working

### Month 1: Business Metrics

- [ ] Monthly AI cost < baseline
- [ ] User signup rate stable/increasing
- [ ] Payment success rate > 95%
- [ ] Churn rate acceptable
- [ ] Error rate < 0.01%

---

## 🚨 Rollback Plan

If critical issues occur:

### Immediate Rollback

1. **Revert to previous deployment**:
   ```bash
   git revert HEAD
   npm run build:prod
   ```

2. **Disable new features**:
   ```env
   SEMANTIC_CACHE_THRESHOLD="1.1"  # Effectively disables cache
   LOG_LEVEL="error"  # Reduce logging
   ```

3. **Switch to fallback database**:
   ```env
   DATABASE_URL="postgresql://fallback-host:5432/db"
   ```

### Partial Rollback

- **Disable semantic cache only**:
  ```typescript
  // In multi-provider-gateway.ts
  enableSemanticCache: false
  ```

- **Disable CSRF for specific routes**:
  ```typescript
  // In src/lib/security/csrf.ts
  export const CSRF_EXEMPT_PATHS = [
    // Add problematic routes
  ]
  ```

---

## 📝 Documentation Updates

- [ ] Update README.md with new features
- [ ] Document environment variables
- [ ] Add troubleshooting guide
- [ ] Create deployment runbook
- [ ] Update API documentation

---

## 🎓 Team Training

- [ ] Train team on new logger usage
- [ ] Train team on validation schemas
- [ ] Train team on semantic cache concepts
- [ ] Train team on database optimization
- [ ] Train team on monitoring dashboards

---

## 🔐 Security Checklist

- [ ] No API keys in `.env.example`
- [ ] No API keys in git history
- [ ] CSRF protection enabled
- [ ] Input validation on all routes
- [ ] Rate limiting configured
- [ ] SQL injection prevented (Prisma)
- [ ] XSS prevention (React)
- [ ] HTTPS enforced in production
- [ ] Secure cookies (httpOnly, sameSite)
- [ ] Error messages don't leak info

---

## 📞 Support Contacts

- **Sentry Alerts**: [Your Sentry Dashboard]
- **Database Issues**: [Your DB Provider Support]
- **Redis Issues**: [Upstash Support]
- **Payment Issues**: [PayOS Support]

---

## ✨ Success Criteria

Migration is successful when:

- ✅ All tests pass
- ✅ Error rate < 0.1%
- ✅ Response time < 2s P95
- ✅ Cache hit rate > 20%
- ✅ AI costs reduced by 20%+
- ✅ Database queries optimized
- ✅ No security vulnerabilities
- ✅ Monitoring operational
- ✅ Team trained

---

**Last Updated**: 2025-10-03
**Version**: 2.0
**Migration Owner**: [Your Name]
