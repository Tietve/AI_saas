# Phase 2: Logging & Monitoring

**Date:** 2025-11-12
**Priority:** 🟠 HIGH
**Status:** Pending
**Estimated Time:** 6 hours
**Blockers:** None (can run parallel to Phase 1)

---

## Context & Links

### Research References
- [PRODUCTION_READINESS_RESEARCH.md](../../PRODUCTION_READINESS_RESEARCH.md) - Lines 17-24 (Monitoring & Observability)
- [PRODUCTION_READINESS_RESEARCH.md](../../PRODUCTION_READINESS_RESEARCH.md) - Lines 289-341 (Prometheus Implementation)

### Related Files
- `backend/services/auth-service/src/app.ts` - Pino logger configured (✅)
- `backend/services/chat-service/src/app.ts` - Pino logger configured (✅)
- **700+ console.log statements** across 49 files (found via grep)
- Sentry initialized in all services (✅)
- Prometheus metrics endpoint at `/metrics` (✅)

---

## Overview

Current state is **partially production-ready** but has critical gaps:

**✅ Good:**
- Pino (structured JSON logging) configured in main app files
- Sentry error tracking initialized
- Prometheus metrics exposed at `/metrics` endpoint
- Jaeger distributed tracing configured

**🔴 Problems:**
- **700+ console.log statements** instead of winston/pino logger
- **No log aggregation** (logs trapped in individual containers)
- **No alerting configured** (Sentry installed but no alert rules)
- **Incomplete metrics** (need custom business metrics)

**Impact:** Cannot debug production issues effectively, no visibility into system health.

---

## Key Insights from Scout Reports

### Finding 1: Console.log Everywhere
**Grep result:** 709 occurrences across 49 files

**Examples:**
- `backend/services/auth-service/src/app.ts:34` - "Skipping initialization in development mode"
- `backend/services/chat-service/src/config/database.ts:2` - Database connection logs
- `backend/services/orchestrator-service/src/scripts/*.ts` - Heavy console usage in scripts

**Issue:**
- Console.log output is unstructured (no timestamps, levels, context)
- Not captured by log aggregation tools (ELK, Datadog)
- Cannot filter by severity (ERROR vs INFO)
- No correlation IDs for request tracing

---

### Finding 2: Pino Configured But Not Used Consistently
**File:** `backend/services/auth-service/src/app.ts:38`

```typescript
const logger = pino({ level: config.LOG_LEVEL || 'info' });
app.use(pinoHttp({ logger }));
```

**Good:** Pino is configured for HTTP request logging.

**Bad:** Controllers and services still use console.log instead of importing logger:

```typescript
// auth.service.ts (example)
console.log('User signup attempt:', email); // ❌ Wrong
logger.info({ email }, 'User signup attempt'); // ✅ Correct
```

---

### Finding 3: Prometheus Metrics Incomplete
**File:** `backend/services/auth-service/src/app.ts:41`

```typescript
collectDefaultMetrics({ register });
```

**Current:** Only default Node.js metrics (CPU, memory, event loop).

**Missing:**
- Business metrics: signups/hour, logins/hour, failed auth attempts
- API metrics: endpoint-specific response times, error rates
- AI metrics: OpenAI tokens used, cost per request, model selection

---

### Finding 4: No Log Aggregation Stack
**Current:** Logs written to stdout, captured by Docker but not aggregated.

**Need:** ELK Stack (Elasticsearch, Logstash, Kibana) or Loki + Grafana for centralized logs.

**Without aggregation:**
- Must SSH into each container to view logs
- No cross-service correlation
- Cannot search historical logs efficiently

---

## Requirements

### Logging Standards
- **Structured Logging:** JSON format (Pino already does this ✅)
- **Log Levels:** DEBUG, INFO, WARN, ERROR, FATAL
- **Context:** Include userId, requestId, serviceName in every log
- **No PII:** Never log passwords, tokens, credit cards

### Monitoring Standards
- **Metrics Retention:** 30 days minimum (Prometheus default: 15 days)
- **Alerting:** PagerDuty/Opsgenie for critical issues (5xx errors, high latency)
- **Dashboards:** Grafana with service health overview
- **Tracing:** Distributed tracing for multi-service requests (Jaeger ✅)

---

## Implementation Steps

### 1. Replace Console.log with Pino Logger (3 hours)

**Action:** Create shared logger instance, replace all console.log statements.

**Step 1.1:** Create shared logger utility
**File:** `backend/shared/logger/index.ts` (create new)

```typescript
import pino from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined, // Use JSON in production
  base: {
    service: process.env.SERVICE_NAME || 'unknown-service',
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
});

// Helper to add request context
export const createRequestLogger = (req: any) => {
  return logger.child({
    requestId: req.id,
    userId: req.user?.id,
    ip: req.ip,
  });
};
```

**Step 1.2:** Automated replacement script
**File:** `backend/scripts/replace-console-logs.sh` (create new)

```bash
#!/bin/bash
# Replaces console.log with logger.info across all services

services=("auth-service" "chat-service" "billing-service" "orchestrator-service" "analytics-service")

for service in "${services[@]}"; do
  echo "Processing $service..."

  # Find all .ts files (exclude node_modules, dist)
  find "backend/services/$service/src" -name "*.ts" -type f | while read file; do
    # Replace console.log with logger.info
    sed -i 's/console\.log(/logger.info(/g' "$file"
    sed -i 's/console\.error(/logger.error(/g' "$file"
    sed -i 's/console\.warn(/logger.warn(/g' "$file"
    sed -i 's/console\.debug(/logger.debug(/g' "$file"

    # Add logger import at top if not present
    if ! grep -q "import.*logger" "$file"; then
      sed -i '1i import { logger } from "../../../shared/logger";' "$file"
    fi
  done
done

echo "✅ Console.log replacement complete!"
```

**Step 1.3:** Manual review of critical files
- Review `auth.service.ts`, `chat.service.ts`, `billing.service.ts`
- Ensure sensitive data not logged (passwords, tokens)
- Add context to logs (userId, action)

**Example transformation:**
```typescript
// BEFORE
console.log('User login attempt');

// AFTER
logger.info({ userId: user.id, email: user.email }, 'User login attempt');
```

---

### 2. Configure Sentry Alerts (1 hour)

**Action:** Set up alert rules for production errors.

**Step 2.1:** Verify Sentry DSN configured
**File:** `backend/services/auth-service/.env`

```bash
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
SENTRY_ENVIRONMENT=production
```

**Step 2.2:** Configure alert rules (Sentry Dashboard)

Navigate to Sentry Project Settings → Alerts → New Alert Rule:

**Alert 1: High Error Rate**
- **Condition:** Error count > 10 in 5 minutes
- **Action:** Notify #incidents Slack channel + email
- **Severity:** Critical

**Alert 2: Performance Degradation**
- **Condition:** Transaction duration p95 > 1000ms
- **Action:** Notify #performance Slack channel
- **Severity:** Warning

**Alert 3: New Error Type**
- **Condition:** First seen error (new issue)
- **Action:** Notify #engineering Slack channel
- **Severity:** Info

**Step 2.3:** Test alerting
```bash
# Trigger test error in auth-service
curl -X POST http://localhost:3001/api/auth/trigger-error
# Verify alert received in Slack/email within 2 minutes
```

---

### 3. Add Custom Prometheus Metrics (1.5 hours)

**Action:** Add business and API-specific metrics.

**File:** `backend/services/auth-service/src/metrics/auth.metrics.ts` (create new)

```typescript
import { Counter, Histogram, Gauge, register } from 'prom-client';

// Business Metrics
export const signupsTotal = new Counter({
  name: 'auth_signups_total',
  help: 'Total number of user signups',
  labelNames: ['workspace_id'],
  registers: [register],
});

export const loginAttemptsTotal = new Counter({
  name: 'auth_login_attempts_total',
  help: 'Total login attempts',
  labelNames: ['status'], // 'success' or 'failed'
  registers: [register],
});

export const activeUsersGauge = new Gauge({
  name: 'auth_active_users',
  help: 'Number of currently active users',
  registers: [register],
});

// API Performance Metrics
export const authDuration = new Histogram({
  name: 'auth_request_duration_seconds',
  help: 'Auth endpoint response times',
  labelNames: ['endpoint', 'method', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});
```

**File:** `backend/services/auth-service/src/controllers/auth.controller.ts`

```typescript
import { signupsTotal, loginAttemptsTotal } from '../metrics/auth.metrics';

async signup(req, res) {
  const { email, password } = req.body;

  // ... existing logic

  signupsTotal.inc({ workspace_id: workspace.id }); // Track signup
  logger.info({ userId: user.id, email }, 'User signup successful');

  res.json({ message: 'Signup successful', user });
}

async signin(req, res) {
  const { email, password } = req.body;

  try {
    // ... existing logic
    loginAttemptsTotal.inc({ status: 'success' });
    logger.info({ userId: user.id, email }, 'User login successful');
  } catch (error) {
    loginAttemptsTotal.inc({ status: 'failed' });
    logger.warn({ email }, 'Login attempt failed');
    throw error;
  }
}
```

**File:** `backend/services/chat-service/src/metrics/chat.metrics.ts` (create new)

```typescript
export const aiTokensUsed = new Counter({
  name: 'chat_ai_tokens_total',
  help: 'Total OpenAI tokens consumed',
  labelNames: ['model', 'user_id'],
  registers: [register],
});

export const aiCostTotal = new Counter({
  name: 'chat_ai_cost_dollars',
  help: 'Total OpenAI cost in USD',
  labelNames: ['model'],
  registers: [register],
});

export const chatMessagesTotal = new Counter({
  name: 'chat_messages_total',
  help: 'Total chat messages sent',
  labelNames: ['model_used'],
  registers: [register],
});
```

---

### 4. Set Up Grafana Dashboards (30 min)

**Action:** Import pre-built dashboards and create custom service dashboard.

**Step 4.1:** Import Node.js dashboard
- Open Grafana → Dashboards → Import
- Dashboard ID: **11159** (Node.js Application Dashboard)
- Data source: Prometheus

**Step 4.2:** Create custom SaaS dashboard
**File:** `backend/monitoring/grafana-dashboards/saas-overview.json`

**Panels to include:**
1. **Signups per hour** (auth_signups_total rate)
2. **Active users** (auth_active_users gauge)
3. **AI requests per minute** (chat_messages_total rate)
4. **OpenAI cost per hour** (chat_ai_cost_dollars rate)
5. **Error rate** (5xx responses / total requests)
6. **API response time p95** (auth_request_duration_seconds quantile)

**Import dashboard:**
```bash
curl -X POST http://localhost:3000/api/dashboards/db \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  -d @grafana-dashboards/saas-overview.json
```

---

## Todo List

- [ ] Create shared logger utility - 30 min
- [ ] Run console.log replacement script - 30 min
- [ ] Manual review critical files (remove PII) - 1 hour
- [ ] Test logging in all services - 30 min
- [ ] Configure Sentry alert rules - 30 min
- [ ] Test Sentry alerting - 30 min
- [ ] Add auth service metrics - 30 min
- [ ] Add chat service metrics - 30 min
- [ ] Instrument controllers with metrics - 30 min
- [ ] Import Grafana Node.js dashboard - 15 min
- [ ] Create custom SaaS dashboard - 30 min
- [ ] Document metrics for team - 15 min

**Total: 6 hours**

---

## Success Criteria

### Logging
- [ ] Zero console.log in production code (verify via grep)
- [ ] All logs have requestId, userId context
- [ ] Logs structured JSON in production (verify output)
- [ ] No PII in logs (passwords, credit cards)
- [ ] Log level configurable via LOG_LEVEL env var

### Monitoring
- [ ] Sentry captures all uncaught errors
- [ ] Sentry alerts fire within 2 minutes of error
- [ ] Prometheus /metrics endpoint returns custom metrics
- [ ] Grafana dashboard shows real-time signups, logins
- [ ] Alert fires when p95 latency > 500ms (test with load)

### Documentation
- [ ] Logging guide for developers (how to use logger)
- [ ] Metrics catalog (what each metric measures)
- [ ] Runbook for common alerts (how to respond)

---

## Risk Assessment

### Risks
1. **Breaking Logs Parsing:** Changing log format may break existing log parsers
   - **Mitigation:** Test in staging first, update parsers before production deploy
2. **Metric Cardinality Explosion:** Too many label values (e.g., userId) can overwhelm Prometheus
   - **Mitigation:** Avoid high-cardinality labels (userId), use aggregations instead
3. **Sentry Quota Exhaustion:** Too many events can exceed Sentry plan
   - **Mitigation:** Set sample rate (10% of transactions), filter noisy errors

### Rollback Plan
- Keep console.log code in git history (easy revert)
- Feature flag: `USE_PINO_LOGGER=false` to disable structured logging temporarily
- Disable Sentry alerts if causing alert fatigue (adjust thresholds)

---

## Security Considerations

### Log Security
- **No Sensitive Data:** Never log passwords, tokens, credit card numbers
- **PII Redaction:** Hash or mask user emails, phone numbers if required
- **Access Control:** Restrict log access to authorized personnel only
- **Retention:** Delete logs after 90 days (GDPR compliance)

### Monitoring Security
- **Metrics Endpoint:** Secure /metrics with basic auth or firewall rules
- **Grafana Access:** Require authentication, use HTTPS
- **Sentry DSN:** Treat as secret, rotate if leaked

---

## Dependencies
- **Phase 1:** Logging helps verify rate limiting and validation working correctly
- **Phase 3:** UX error states need proper error tracking (Sentry)
- **Phase 4:** Production deployment requires logging/monitoring infrastructure

## Next Phase
[Phase 3: UX Completeness](./phase-03-ux-completeness.md) - Add 404 page, error states, offline handling
