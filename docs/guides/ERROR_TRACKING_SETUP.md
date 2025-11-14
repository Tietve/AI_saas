# 🔍 ERROR TRACKING WITH SENTRY - COMPLETE SETUP

**Date**: 2025-10-26
**Status**: ✅ Complete
**Services**: Auth, Chat, Billing

---

## 📊 OVERVIEW

Centralized error tracking has been implemented across all microservices using Sentry. The system captures errors, logs, and performance data with full stack traces and context.

### What is Error Tracking?

Error tracking allows you to:
- **Monitor production errors** in real-time
- **Track error frequency** and patterns
- **Get full stack traces** with context
- **Set up alerts** for critical errors
- **Track performance** metrics
- **Debug faster** with detailed error reports

---

## ✅ WHAT WAS CONFIGURED

### 1. Sentry Client Installation

**Packages installed** in all services:
```bash
npm install @sentry/node @sentry/profiling-node
```

**Services configured**:
- ✅ Auth Service (port 3001)
- ✅ Chat Service (port 3002)
- ✅ Billing Service (port 3003)

### 2. Sentry Configuration Module

Created `src/config/sentry.ts` in each service with:

**Features**:
- Automatic error capture
- Performance monitoring
- Request tracking
- User context tracking
- Breadcrumb logging
- Custom error capture
- Graceful degradation (works without DSN)

**Code Structure**:
```typescript
import { initSentry, sentryRequestHandler, sentryTracingHandler, sentryErrorHandler } from './config/sentry';

// Initialize first (before Express app)
initSentry({ serviceName: 'service-name' });

// Add middleware
app.use(sentryRequestHandler());
app.use(sentryTracingHandler());

// Add error handler (after routes, before other error handlers)
app.use(sentryErrorHandler());
```

### 3. Middleware Integration

**Request Handler**: Captures request context
- User information (id, email)
- Request details (method, URL, headers, query)
- IP address
- Timing information

**Tracing Handler**: Performance monitoring
- Traces request duration
- Identifies slow operations
- Correlates with Jaeger tracing

**Error Handler**: Automatic error capture
- Captures all 4xx and 5xx errors
- Full stack traces
- Request context
- User context

### 4. Error Logging

**Automatic Capture**:
- All exceptions thrown in routes
- Unhandled promise rejections
- HTTP errors (400+)

**Manual Capture**:
```typescript
import { captureException, captureMessage } from './config/sentry';

// Capture exception with context
try {
  // risky operation
} catch (error) {
  captureException(error, {
    operation: 'payment-processing',
    userId: user.id
  });
}

// Capture informational message
captureMessage('User performed critical action', 'warning');
```

---

## 🚀 HOW TO USE

### Development Mode (Local Logging)

By default, without a Sentry DSN, errors are **logged locally only**:

```
ℹ️  Sentry disabled for auth-service (no DSN configured)
   Errors will be logged locally only
```

**Errors appear in console** with full stack traces via Pino logger.

### Production Mode (Send to Sentry)

1. **Sign up** for Sentry.io (free tier) or self-host Sentry

2. **Get your DSN** from Sentry project settings

3. **Add to environment variables**:

```env
# .env file
SENTRY_DSN=https://your-key@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% of requests
SENTRY_PROFILES_SAMPLE_RATE=0.1
```

4. **Restart services** - Sentry will automatically start sending errors:

```
✅ Sentry initialized for auth-service
   Environment: production
   Traces sample rate: 10%
```

---

## 🧪 TESTING ERROR TRACKING

### Debug Endpoints (Development Only)

The auth service includes debug endpoints for testing:

**List all endpoints**:
```bash
curl http://localhost:3001/api/debug
```

**Test 500 error**:
```bash
curl http://localhost:3001/api/debug/error
```

**Test 404 error**:
```bash
curl http://localhost:3001/api/debug/not-found
```

**Test uncaught exception**:
```bash
curl http://localhost:3001/api/debug/uncaught
```

**Test manual error capture**:
```bash
curl http://localhost:3001/api/debug/manual-error
```

**Test message capture**:
```bash
curl http://localhost:3001/api/debug/message
```

### Expected Output

**Without DSN** (development):
- Errors logged to console with stack traces
- Returns error JSON response
- Pino logger captures all details

**With DSN** (production):
- Errors sent to Sentry
- Visible in Sentry dashboard
- Grouped by error type
- Includes full context

---

## 📝 CONFIGURATION OPTIONS

### Environment Variables

```env
# Required for production
SENTRY_DSN=https://key@sentry.io/project

# Optional configuration
SENTRY_ENVIRONMENT=production        # Environment name
SENTRY_RELEASE=v1.0.0               # Release version
SENTRY_TRACES_SAMPLE_RATE=0.1       # Performance monitoring (10%)
SENTRY_PROFILES_SAMPLE_RATE=0.1     # CPU profiling (10%)
NODE_ENV=production                  # Affects error filtering
```

### Sample Rates

**Development**:
- Traces: 100% (1.0)
- Profiles: 100% (1.0)

**Staging**:
- Traces: 50% (0.5)
- Profiles: 10% (0.1)

**Production**:
- Traces: 10% (0.1)
- Profiles: 5% (0.05)

**High Traffic**:
- Traces: 1% (0.01)
- Profiles: 0.5% (0.005)

---

## 🎯 BEST PRACTICES

### 1. What to Track

**Do track**:
- Application errors and exceptions
- Failed API requests
- Database errors
- External service failures
- Business logic errors
- Performance bottlenecks

**Don't track**:
- Expected validation errors (use logging instead)
- Rate limit errors (unless investigating abuse)
- Test environment errors (filtered automatically)

### 2. Adding Context

```typescript
import { setUser, addBreadcrumb, captureException } from './config/sentry';

// Set user context
setUser({
  id: user.id,
  email: user.email,
  username: user.name
});

// Add breadcrumbs
addBreadcrumb({
  category: 'payment',
  message: 'User initiated payment',
  level: 'info',
  data: { amount: 100, currency: 'USD' }
});

// Capture with custom context
try {
  await processPayment();
} catch (error) {
  captureException(error, {
    paymentId: payment.id,
    userId: user.id,
    amount: payment.amount
  });
  throw error;
}
```

### 3. Error Filtering

The `beforeSend` hook filters errors:

```typescript
beforeSend(event, hint) {
  // Don't send test errors
  if (environment === 'test') {
    return null;
  }

  // Log in development
  if (environment === 'development') {
    console.error('[Sentry]', hint.originalException);
  }

  return event;
}
```

---

## 🔧 INTEGRATION WITH OTHER TOOLS

### Integration with Jaeger Tracing

Both systems work together:
- **Sentry**: Error tracking and performance
- **Jaeger**: Distributed tracing across services

Use both for complete observability:
- Jaeger shows request flow between services
- Sentry shows errors within each service

### Integration with Prometheus

- **Prometheus**: Metrics and alerting
- **Sentry**: Error details and context

Prometheus alerts on error rate spikes, Sentry provides error details.

---

## 🐛 TROUBLESHOOTING

### Issue 1: Errors not appearing in Sentry

**Symptoms**: Local logging works but Sentry shows no errors

**Solutions**:
```bash
# 1. Check DSN is configured
echo $SENTRY_DSN

# 2. Verify service logs show Sentry init
# Look for: "✅ Sentry initialized for service-name"

# 3. Check network connectivity
curl https://sentry.io

# 4. Verify sample rate isn't too low
# SENTRY_TRACES_SAMPLE_RATE should be > 0
```

### Issue 2: Too many errors

**Symptoms**: Sentry quota exceeded

**Solutions**:
```env
# Reduce sample rate
SENTRY_TRACES_SAMPLE_RATE=0.01  # 1% instead of 10%

# Filter noisy errors
# Add to beforeSend hook in sentry.ts
```

### Issue 3: Missing context

**Symptoms**: Errors lack user/request information

**Solution**: Ensure middleware order is correct:
```typescript
// CORRECT ORDER:
app.use(express.json());
app.use(cookieParser());
app.use(sentryRequestHandler());  // After body parsers
app.use(sentryTracingHandler());
// ... other middleware
// ... routes
app.use(sentryErrorHandler());   // Before other error handlers
```

---

## 📊 MONITORING IN PRODUCTION

### Sentry Dashboard Features

**Issues View**:
- See all errors grouped by type
- Frequency and impact
- Affected users
- Last occurrence

**Performance View**:
- Transaction duration
- Slow endpoints
- Database query performance
- External API latency

**Releases**:
- Track errors by version
- See regressions
- Compare releases

**Alerts**:
- Email/Slack on critical errors
- Threshold-based alerts
- Spike detection

---

## 📈 METRICS TO MONITOR

### Key Metrics

1. **Error Rate**: Errors per minute/hour
2. **Unique Errors**: New vs recurring
3. **Affected Users**: How many users hit errors
4. **Error Distribution**: By service, endpoint, environment
5. **Response Time**: P50, P95, P99

### Recommended Alerts

```yaml
# High error rate
- condition: error_rate > 10/min
  action: notify_team

# New error type
- condition: new_error_detected
  action: notify_developers

# Critical endpoint failing
- condition: /api/payment fails
  action: page_on_call

# High latency
- condition: p95_latency > 2s
  action: investigate
```

---

## ✅ VERIFICATION CHECKLIST

- [x] Sentry packages installed in all services
- [x] Configuration module created
- [x] Middleware integrated correctly
- [x] Error handler added
- [x] Manual capture functions working
- [x] Debug endpoints created
- [x] Tested error capture
- [x] Tested manual capture
- [x] Verified local logging works
- [x] Documentation complete
- [ ] Production DSN configured (when deploying)
- [ ] Alerts configured (when deploying)

---

## 📝 FILES MODIFIED/CREATED

### Auth Service
- ✅ `services/auth-service/src/config/sentry.ts` - Sentry configuration
- ✅ `services/auth-service/src/routes/debug.routes.ts` - Test endpoints
- ✅ `services/auth-service/src/app.ts` - Middleware integration
- ✅ `services/auth-service/package.json` - Dependencies

### Chat Service
- ✅ `services/chat-service/src/config/sentry.ts` - Sentry configuration
- ✅ `services/chat-service/src/app.ts` - Middleware integration
- ✅ `services/chat-service/package.json` - Dependencies

### Billing Service
- ✅ `services/billing-service/src/config/sentry.ts` - Sentry configuration
- ✅ `services/billing-service/src/app.ts` - Middleware integration
- ✅ `services/billing-service/package.json` - Dependencies

---

## 🎓 NEXT STEPS

### For Local Development
1. Use debug endpoints to test error scenarios
2. Check console logs for error details
3. Add custom error capture where needed

### For Production
1. Sign up for Sentry.io or self-host
2. Get DSN and add to environment variables
3. Configure sample rates for your traffic
4. Set up alerts for critical errors
5. Monitor dashboard regularly
6. Create error budget and SLOs

---

## 🔗 RESOURCES

- **Sentry Documentation**: https://docs.sentry.io/platforms/node/
- **Sentry Node SDK**: https://docs.sentry.io/platforms/node/guides/express/
- **Self-Hosting Sentry**: https://develop.sentry.dev/self-hosted/
- **Best Practices**: https://docs.sentry.io/platforms/node/best-practices/

---

**Generated**: 2025-10-26
**Status**: ✅ Complete and ready for production
**Next**: API Documentation with Swagger

