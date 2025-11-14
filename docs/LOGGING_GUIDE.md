# Logging & Monitoring Guide

> **Quick reference for developers using structured logging and metrics**

---

## Quick Start

### Import Logger & Metrics

```typescript
import { logger } from '../config/logger';
import { metrics } from '../config/metrics';
```

### Basic Logging

```typescript
// Info logging
logger.info('User logged in');
logger.info({ userId, email }, 'User logged in');

// Error logging (auto-sent to Sentry)
logger.error({ err: error, userId }, 'Login failed');

// Debug logging (only in development)
logger.debug({ requestBody }, 'Request received');

// Warning logging
logger.warn({ userId, attempts: 5 }, 'Multiple login attempts detected');
```

### Track Metrics

```typescript
// Track user signups
metrics.trackSignup('web');  // source: web, mobile, api

// Track user logins
metrics.trackLogin('password');  // method: password, oauth, magic-link

// Track AI token usage (chat-service only)
metrics.trackAITokens(500, 'gpt-4', userId);

// Update active sessions
metrics.updateActiveSessions(activeCount);
```

---

## Logging Patterns

### HTTP Endpoint Pattern

```typescript
async myEndpoint(req: Request, res: Response) {
  try {
    const { userId, data } = req.body;

    logger.info({ userId, operation: 'myOperation' }, 'Starting operation');

    const result = await myService.doSomething(data);

    logger.info({ userId, result }, 'Operation completed successfully');

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error({
      err: error,
      userId: req.body.userId,
      operation: 'myOperation'
    }, 'Operation failed');

    res.status(500).json({ error: 'Operation failed' });
  }
}
```

### Service Layer Pattern

```typescript
async processPayment(userId: string, amount: number) {
  try {
    logger.info({ userId, amount }, 'Processing payment');

    const result = await stripe.charges.create({...});

    logger.info({
      userId,
      amount,
      chargeId: result.id
    }, 'Payment processed successfully');

    metrics.paymentSuccess.inc({ plan: 'PRO' });

    return result;
  } catch (error) {
    logger.error({
      err: error,
      userId,
      amount
    }, 'Payment processing failed');

    metrics.paymentFailed.inc({ reason: error.code });

    throw error;
  }
}
```

### Background Job Pattern

```typescript
async processJob(job: Job) {
  const { userId, data } = job.data;

  logger.info({
    jobId: job.id,
    userId,
    jobType: job.name
  }, 'Job started');

  try {
    await processData(data);

    logger.info({
      jobId: job.id,
      userId,
      duration: job.duration
    }, 'Job completed');

  } catch (error) {
    logger.error({
      err: error,
      jobId: job.id,
      userId
    }, 'Job failed');

    throw error; // Re-throw for retry logic
  }
}
```

---

## What to Log

### ✅ DO LOG

- **User actions:** Login, signup, important operations
- **Errors:** All caught errors with context
- **Business events:** Payment success, subscription changes
- **Performance:** Slow queries, high latency operations
- **Security:** Failed auth attempts, suspicious activity

### ❌ DON'T LOG

- **Sensitive data:** Passwords, credit cards, API keys
- **PII without masking:** Full names, addresses (use IDs instead)
- **Large payloads:** Trim to relevant fields only
- **High-frequency loops:** Use sampling for metrics instead

---

## Log Levels

### When to Use Each Level

```typescript
// DEBUG - Development only, detailed info
logger.debug({ query, params }, 'Executing database query');

// INFO - Normal operations, important events
logger.info({ userId }, 'User logged in');

// WARN - Potential issues, degraded state
logger.warn({ userId, attempts: 5 }, 'Multiple failed login attempts');

// ERROR - Errors that were handled (auto-sent to Sentry)
logger.error({ err: error, userId }, 'Payment processing failed');

// FATAL - Critical errors, service stopping (auto-sent to Sentry)
logger.fatal({ err: error }, 'Database connection lost, shutting down');
```

---

## Structured Logging Best Practices

### Good Examples ✅

```typescript
// Good: Structured with context
logger.info({
  userId,
  email,
  source: 'web'
}, 'User signup completed');

// Good: Error with full context
logger.error({
  err: error,
  userId,
  operation: 'createOrder',
  orderId
}, 'Order creation failed');

// Good: Specific, actionable message
logger.warn({
  userId,
  balance: -100
}, 'User balance negative, payment required');
```

### Bad Examples ❌

```typescript
// Bad: No structure
console.log('User logged in: ' + userId);

// Bad: Missing context
logger.info('Error occurred');

// Bad: Sensitive data
logger.info({
  password: password,  // ❌ NEVER log passwords
  creditCard: card     // ❌ NEVER log credit cards
}, 'Payment info');

// Bad: Not useful
logger.info('Operation');  // What operation?
```

---

## Metrics Best Practices

### Counter Metrics (for events)

```typescript
// Good: Track business events
metrics.userSignups.inc({ source: 'web' });
metrics.paymentSuccess.inc({ plan: 'PRO' });
metrics.emailSent.inc({ type: 'verification' });

// Use labels for categorization
metrics.httpRequestTotal.inc({
  method: 'POST',
  route: '/api/auth/login',
  status_code: '200'
});
```

### Gauge Metrics (for current state)

```typescript
// Good: Track current values
metrics.activeSessions.set(currentSessions);
metrics.databaseConnections.set(pool.activeCount);
metrics.queueLength.set(queue.length);
```

### Histogram Metrics (for distributions)

```typescript
// Good: Track durations
const start = Date.now();
await doSomething();
const duration = (Date.now() - start) / 1000;

metrics.operationDuration.observe({ operation: 'doSomething' }, duration);
```

---

## Sentry Integration

### Automatic Error Reporting

All `logger.error()` and `logger.fatal()` calls are automatically sent to Sentry. No additional code needed!

```typescript
// This automatically creates a Sentry event
logger.error({ err: error, userId }, 'Payment failed');
```

### Manual Sentry Context

For advanced use cases, use Sentry SDK directly:

```typescript
import * as Sentry from '@sentry/node';

Sentry.setUser({
  id: userId,
  email: userEmail
});

Sentry.setContext('payment', {
  amount: amount,
  currency: 'USD',
  plan: 'PRO'
});

// Then log error
logger.error({ err: error }, 'Payment processing failed');
```

---

## Monitoring Queries

### Prometheus Queries (Grafana)

```promql
# Request rate (per second)
rate(auth_service_http_requests_total[5m])

# Error rate percentage
(rate(auth_service_http_request_errors_total[5m]) /
 rate(auth_service_http_requests_total[5m])) * 100

# P95 latency
histogram_quantile(0.95,
  rate(auth_service_http_request_duration_seconds_bucket[5m]))

# Signups per hour
increase(auth_service_user_signups_total[1h])

# Active sessions
auth_service_active_sessions
```

### Useful Dashboards

**Service Health:**
- Request rate by endpoint
- Error rate by endpoint
- Latency (p50, p95, p99)
- Active connections

**Business Metrics:**
- Signups per hour/day
- Login success/failure rate
- AI token usage by model
- Payment success rate

---

## Environment Variables

### Required for All Services

```bash
# Logging level
LOG_LEVEL=info  # debug|info|warn|error|fatal

# Environment
NODE_ENV=production  # production|staging|development

# Sentry (error reporting)
SENTRY_DSN=https://...@sentry.io/...
```

### Development vs Production

**Development:**
```bash
LOG_LEVEL=debug
NODE_ENV=development
# Pretty-printed logs (human-readable)
```

**Production:**
```bash
LOG_LEVEL=info
NODE_ENV=production
SENTRY_DSN=https://...
# JSON logs (machine-readable)
```

---

## Troubleshooting

### Logs Not Appearing

1. Check LOG_LEVEL environment variable
2. Verify logger import: `import { logger } from '../config/logger'`
3. Check console - structured logs go to stdout

### Metrics Not Showing Up

1. Verify `/metrics` endpoint: `curl http://localhost:3001/metrics`
2. Check Prometheus configuration
3. Verify metrics collector import

### Sentry Not Receiving Errors

1. Check SENTRY_DSN is set
2. Verify errors are logged with `logger.error()` not `console.error()`
3. Check Sentry dashboard for rate limiting

### Performance Issues

Logging overhead is minimal (<1% CPU), but if issues occur:
1. Reduce LOG_LEVEL to `warn` or `error`
2. Avoid logging in tight loops
3. Sample high-frequency metrics

---

## Migration from console.log

### Search & Replace Patterns

**Basic replacement:**
```typescript
// Before
console.log('User logged in:', userId);

// After
logger.info({ userId }, 'User logged in');
```

**Error replacement:**
```typescript
// Before
console.error('Error:', error);

// After
logger.error({ err: error }, 'Operation failed');
```

**Debug replacement:**
```typescript
// Before
console.log('[DEBUG] Request:', request);

// After
logger.debug({ request }, 'Request received');
```

---

## Resources

- **Pino Documentation:** https://getpino.io/
- **Prometheus Docs:** https://prometheus.io/docs/
- **Sentry Node.js:** https://docs.sentry.io/platforms/node/
- **Grafana Dashboards:** https://grafana.com/grafana/dashboards/

---

## Examples by Service

### Auth-Service

```typescript
import { logger } from '../config/logger';
import { metrics } from '../config/metrics';

// Signup tracking
metrics.trackSignup('web');
logger.info({ userId, email }, 'User signup completed');

// Login tracking
metrics.trackLogin('password');
logger.info({ userId, method: 'password' }, 'User login successful');
```

### Chat-Service

```typescript
import { logger } from '../config/logger';
import { metrics } from '../config/metrics';

// AI usage tracking
metrics.trackAITokens(tokens, 'gpt-4', userId);
logger.info({
  userId,
  model: 'gpt-4',
  tokens,
  cost: tokens * 0.00003
}, 'AI request completed');
```

### Billing-Service

```typescript
import { logger } from '../config/logger';
import { metrics } from '../config/metrics';

// Payment tracking
logger.info({
  userId,
  amount,
  currency: 'USD',
  plan: 'PRO'
}, 'Payment processed');

// Custom metrics
metrics.paymentSuccess.inc({ plan: 'PRO' });
```

---

**Last Updated:** 2025-11-12
**Maintainer:** DevOps Team
