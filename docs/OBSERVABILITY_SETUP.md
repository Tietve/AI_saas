# 🔍 Observability Stack - Complete Setup

Production-grade error tracking, logging, and monitoring for AI SaaS Platform.

## ✅ What Has Been Implemented

### 1. **Sentry Error Tracking** ✅

**Status**: Fully configured and production-ready

**Features**:
- ✅ Client-side error tracking (browser/React)
- ✅ Server-side error tracking (API routes, SSR)
- ✅ Edge runtime error tracking
- ✅ Session Replay (10% sampling)
- ✅ Performance monitoring (10% in production)
- ✅ Prisma integration
- ✅ Error filtering (browser extensions, non-critical errors)
- ✅ Source maps support
- ✅ Release tracking

**Configuration Files**:
- `sentry.client.config.ts` - Browser/React errors
- `sentry.server.config.ts` - API/SSR errors
- `sentry.edge.config.ts` - Edge runtime errors

**Setup**:
```bash
# Add to .env
SENTRY_DSN=https://your-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

**Usage**:
```typescript
import * as Sentry from '@sentry/nextjs'

// Manually capture error
Sentry.captureException(error)

// Add user context
Sentry.setUser({ id: userId, email: userEmail })

// Add custom context
Sentry.setContext('payment', { orderId, amount })
```

---

### 2. **Pino Structured Logging** ✅

**Status**: Fully configured with helper functions

**Features**:
- ✅ JSON structured logging (production)
- ✅ Pretty formatted logs (development)
- ✅ Automatic error serialization
- ✅ Performance-optimized (async logging)
- ✅ Request ID tracking
- ✅ Helper functions for API, DB, AI requests
- ✅ Sentry integration

**Configuration**: `src/lib/logger.ts`

**Setup**:
```bash
# Optional: Set log level
LOG_LEVEL=debug  # debug, info, warn, error
```

**Usage**:
```typescript
import { logger, logApiRequest, logError } from '@/lib/logger'

// Basic logging
logger.info('User logged in', { userId: '123' })
logger.error('Payment failed', { error, orderId })
logger.debug('Cache hit', { key })

// API request logging
logApiRequest({
  method: 'POST',
  path: '/api/chat',
  userId: '123',
  duration: 523,
  statusCode: 200
})

// Database query logging
logDbQuery({
  operation: 'findMany',
  model: 'User',
  duration: 45,
  count: 10
})

// AI request logging
logAiRequest({
  provider: 'openai',
  model: 'gpt-4o-mini',
  userId: '123',
  tokensIn: 100,
  tokensOut: 50,
  costUsd: 0.002,
  latency: 523
})

// Error logging (logs to both Pino and Sentry)
logError(error, {
  userId: '123',
  extra: { orderId: 'abc' },
  tags: { feature: 'payment' }
})
```

**Log Output Example** (Production):
```json
{
  "level": "info",
  "time": "2025-01-04T10:00:00.000Z",
  "msg": "API POST /api/chat - 523ms",
  "method": "POST",
  "path": "/api/chat",
  "userId": "123",
  "duration": 523,
  "statusCode": 200
}
```

**Log Output Example** (Development):
```
[INFO] 10:00:00 - API POST /api/chat - 523ms
  method: "POST"
  path: "/api/chat"
  userId: "123"
  duration: 523
  statusCode: 200
```

---

### 3. **Logging Middleware** ✅

**Status**: Ready to use

**Features**:
- ✅ Automatic request logging
- ✅ Request ID generation/tracking
- ✅ Duration measurement
- ✅ Error handling
- ✅ User context extraction

**Location**: `src/middleware/logging.ts`

**Usage in API Routes**:
```typescript
import { withLogging } from '@/middleware/logging'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  return withLogging(req, async () => {
    // Your handler logic
    const data = await fetchData()

    return NextResponse.json({ success: true, data })
  })
}
```

**Response Headers**:
- `x-request-id` - Unique request identifier

---

### 4. **React Error Boundaries** ✅

**Status**: Multiple variants available

**Location**: `src/components/error-boundary.tsx`

**Components**:

#### **1. PageErrorBoundary** - For entire pages
```typescript
import { PageErrorBoundary } from '@/components/error-boundary'

export default function MyPage() {
  return (
    <PageErrorBoundary>
      <YourPageContent />
    </PageErrorBoundary>
  )
}
```

#### **2. ComponentErrorBoundary** - For specific components
```typescript
import { ComponentErrorBoundary } from '@/components/error-boundary'

function MyComponent() {
  return (
    <ComponentErrorBoundary componentName="ChatWidget">
      <ChatWidget />
    </ComponentErrorBoundary>
  )
}
```

#### **3. AsyncErrorBoundary** - For async/data-loading components
```typescript
import { AsyncErrorBoundary } from '@/components/error-boundary'

function DataComponent() {
  return (
    <AsyncErrorBoundary>
      <AsyncDataLoader />
    </AsyncErrorBoundary>
  )
}
```

#### **4. useGlobalErrorHandler** - Global error catching
```typescript
import { useGlobalErrorHandler } from '@/components/error-boundary'

// In your root layout.tsx
export default function RootLayout({ children }) {
  useGlobalErrorHandler()

  return <html><body>{children}</body></html>
}
```

---

### 5. **API Documentation (Swagger)** ✅

**Status**: Configured with example

**Features**:
- ✅ OpenAPI 3.0 specification
- ✅ Interactive Swagger UI
- ✅ Auto-generated from JSDoc comments
- ✅ Example health endpoint documented

**Access**:
- Swagger UI: http://localhost:3000/api-docs
- OpenAPI JSON: http://localhost:3000/api/docs

**Documentation Pattern**:
```typescript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     tags:
 *       - YourTag
 *     summary: Short description
 *     description: Detailed description
 *     parameters:
 *       - name: userId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       400:
 *         description: Bad request
 */
export async function GET(req: NextRequest) {
  // Handler code
}
```

---

## 📊 Monitoring Dashboard

### Key Metrics to Monitor

**Application Metrics**:
- Request rate (requests/sec)
- Response time (p50, p95, p99)
- Error rate (%)
- Active users

**Infrastructure Metrics**:
- CPU usage (%)
- Memory usage (%)
- Database connections
- Cache hit rate

**AI Provider Metrics** (already tracked):
- Latency per provider
- Cost per provider
- Error rates
- Success rates

**Access Metrics**:
- `/api/metrics/health` - Provider health
- `/api/metrics/dashboard` - Performance dashboard
- `/api/health` - System health

---

## 🚨 Alert Configuration

### Recommended Alerts

**Critical (Page immediately)**:
- Error rate > 5%
- Response time p95 > 5s
- Database connection failures
- System health: unhealthy

**Warning (Notify via email)**:
- Error rate > 1%
- Response time p95 > 2s
- Memory usage > 85%
- CPU usage > 80%

**Info (Log only)**:
- New deployment
- Configuration changes
- Scheduled maintenance

---

## 📝 Best Practices

### Logging

**DO**:
- ✅ Use structured logging (JSON in production)
- ✅ Include relevant context (userId, requestId)
- ✅ Log business events (signup, payment, etc.)
- ✅ Use appropriate log levels
- ✅ Sanitize PII from logs

**DON'T**:
- ❌ Log sensitive data (passwords, tokens, credit cards)
- ❌ Over-log (debug logs in production)
- ❌ Log binary data
- ❌ Use console.log in production code

### Error Tracking

**DO**:
- ✅ Add user context to errors
- ✅ Include breadcrumbs for debugging
- ✅ Set error severity appropriately
- ✅ Group similar errors
- ✅ Add custom tags for filtering

**DON'T**:
- ❌ Send PII to Sentry
- ❌ Track expected errors (404, validation)
- ❌ Ignore error resolution
- ❌ Let error budget exceed threshold

---

## 🔧 Configuration

### Environment Variables

```bash
# Sentry
SENTRY_DSN=https://your-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENABLED=true  # Optional: force enable in dev

# Logging
LOG_LEVEL=info  # debug, info, warn, error
```

---

## 📈 Usage Examples

### Complete API Route with Observability

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/middleware/logging'
import { logger, logError } from '@/lib/logger'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'

const schema = z.object({
  userId: z.string(),
  message: z.string(),
})

export async function POST(req: NextRequest) {
  return withLogging(req, async () => {
    try {
      // Parse and validate input
      const body = await req.json()
      const validated = schema.parse(body)

      // Add user context
      Sentry.setUser({ id: validated.userId })

      // Log business event
      logger.info('Processing user message', {
        userId: validated.userId,
        messageLength: validated.message.length,
      })

      // Process request
      const result = await processMessage(validated)

      // Return success
      return NextResponse.json({
        success: true,
        data: result,
      })

    } catch (error) {
      // Log error
      logError(error as Error, {
        userId: body?.userId,
        tags: { api: 'process-message' },
      })

      // Return error response
      return NextResponse.json(
        { error: 'Failed to process message' },
        { status: 500 }
      )
    }
  })
}
```

---

## 📋 API Documentation Status

All critical production endpoints have been documented with Swagger/OpenAPI:

**✅ Documented Endpoints** (22 total):
- **Metrics** (5 endpoints): Health, Dashboard, Cost Breakdown, Alerts, Trends
- **Authentication** (7 endpoints): Signup, Signin, Signout, Verify Email, Forgot Password, Reset Password, Resend Verification
- **Chat** (2 endpoints): Stream (legacy), Send (production)
- **Conversations** (5 endpoints): List, Create, Get, Update, Delete
- **Payment** (2 endpoints): Create Payment Link, Check Payment Status
- **Projects** (2 endpoints): List Projects, Create Project
- **Health** (1 endpoint): System health check

**Access Documentation**:
- Swagger UI: `http://localhost:3000/api-docs`
- OpenAPI JSON: `http://localhost:3000/api/docs`

---

## 🎯 Next Steps

### To Complete Full Observability:

1. ✅ **Document Core APIs** - Completed
2. **Setup Alerts** - Configure Sentry alerts for critical errors
3. **Dashboard Integration** - Connect to Grafana/Datadog (optional)
4. **Log Aggregation** - Setup ELK stack or Loki (optional)
5. **APM Integration** - Add New Relic or Datadog APM (optional)

---

## 📚 Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Pino Documentation](https://getpino.io/)
- [Swagger/OpenAPI Spec](https://swagger.io/specification/)
- [Error Boundary Best Practices](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)

---

**Status**: Production-ready! ✅
**Last Updated**: January 2025
