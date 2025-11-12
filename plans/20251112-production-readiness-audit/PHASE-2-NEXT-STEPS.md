# Phase 2: Next Steps Checklist

> **Quick action items to complete Phase 2 implementation**

---

## Immediate Actions (2-4 hours)

### 1. Complete Auth-Service Migration

**Files with console.log remaining:**

```bash
cd backend/services/auth-service/src

# Priority 1: Queue Service (11 instances)
# File: services/queue.service.ts
# Replace: console.error/log/warn with logger.error/info/warn
# Import: import { logger } from '../config/logger';

# Priority 2: Event Publisher (12 instances)
# File: shared/events/publisher.ts
# Same pattern as above

# Priority 3: Workspace Controller (10 instances)
# File: controllers/workspace.controller.ts
# Pattern: logger.error({ err: error, workspaceId }, 'Operation failed')
```

**Quick command to find remaining:**
```bash
grep -n "console\." src/services/queue.service.ts
grep -n "console\." src/shared/events/publisher.ts
grep -n "console\." src/controllers/workspace.controller.ts
```

---

### 2. Migrate Chat-Service Controllers

**Critical files:**

```bash
cd backend/services/chat-service/src

# File: services/openai.service.ts
# Add: import { logger } from '../config/logger';
# Add: import { metrics } from '../config/metrics';
# Replace console.log with logger.info
# Add: metrics.trackAITokens(tokens, model, userId) after each AI call

# File: controllers/chat.controller.ts
# Same pattern, add error logging

# File: services/billing-client.service.ts
# Add structured logging for quota checks
```

---

### 3. Update Service app.ts Files

Each service needs logger/metrics initialization in `app.ts`:

**Template:**
```typescript
import { logger } from './config/logger';
import { metrics } from './config/metrics';

// Add after express app creation
app.use(metrics.requestMetricsMiddleware());

// Update metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const metricsData = await metrics.getMetrics();
    res.set('Content-Type', 'text/plain');
    res.end(metricsData);
  } catch (error) {
    logger.error({ err: error }, 'Failed to get metrics');
    res.status(500).send('Error collecting metrics');
  }
});

// Replace console.log in startup
logger.info(`Service listening on port ${PORT}`);
```

**Apply to:**
- [ ] chat-service/src/app.ts
- [ ] billing-service/src/app.ts
- [ ] analytics-service/src/app.ts

---

## Testing Checklist

### Test Logging

```bash
# Start service
cd backend/services/auth-service
npm run dev

# Trigger signup endpoint
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'

# Check logs - should see structured JSON
# Expected format:
# {"level":"info","time":"2025-11-12T...","service":"auth-service","userId":"...","msg":"User signup completed"}
```

### Test Metrics

```bash
# Check metrics endpoint
curl http://localhost:3001/metrics

# Should include:
# auth_service_user_signups_total{source="web"} 1
# auth_service_http_requests_total{method="POST",route="/api/auth/signup",status_code="200"} 1
# auth_service_http_request_duration_seconds_bucket{method="POST",...} ...
```

### Test Sentry

```bash
# Add to .env
SENTRY_DSN=your_sentry_dsn_here

# Restart service
# Trigger an error endpoint or throw test error
# Check Sentry dashboard - error should appear within 1 minute
```

---

## Deployment Checklist

### Environment Variables

Add to each service's `.env`:

```bash
# Logging
LOG_LEVEL=info
NODE_ENV=production

# Error Tracking
SENTRY_DSN=https://your-key@sentry.io/your-project

# Optional: Disable custom metrics temporarily
# ENABLE_CUSTOM_METRICS=false
```

### Build & Deploy

```bash
# 1. Rebuild shared package (if changed)
cd backend/shared
npm run build

# 2. Verify services can import shared
cd ../services/auth-service
npm run build  # Should succeed

# 3. Deploy services with new env vars
# (Use your existing deployment process)
```

---

## Monitoring Setup

### Prometheus Configuration

Add to `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'auth-service'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
    scrape_interval: 15s

  - job_name: 'chat-service'
    static_configs:
      - targets: ['localhost:3003']
    metrics_path: '/metrics'
    scrape_interval: 15s

  - job_name: 'billing-service'
    static_configs:
      - targets: ['localhost:3004']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

### Grafana Dashboards

**Create dashboard with panels:**

1. **Request Rate**
   ```promql
   rate(auth_service_http_requests_total[5m])
   ```

2. **Error Rate**
   ```promql
   (rate(auth_service_http_request_errors_total[5m]) /
    rate(auth_service_http_requests_total[5m])) * 100
   ```

3. **Latency (P95)**
   ```promql
   histogram_quantile(0.95,
     rate(auth_service_http_request_duration_seconds_bucket[5m]))
   ```

4. **Signups/Hour**
   ```promql
   increase(auth_service_user_signups_total[1h])
   ```

---

## Common Issues & Solutions

### Issue: Logs not structured (still plain text)

**Solution:**
- Check NODE_ENV is set to 'production'
- Verify prettyPrint is false in logger config
- Restart service after env var change

### Issue: Metrics endpoint returns 404

**Solution:**
- Verify `/metrics` route is registered in app.ts
- Check metrics middleware is installed
- Ensure prom-client is installed

### Issue: Sentry not receiving errors

**Solution:**
- Verify SENTRY_DSN is set correctly
- Check errors are logged with `logger.error()` not `console.error()`
- Check Sentry dashboard for rate limit warnings
- Test with: `logger.error(new Error('Test'), 'Test error')`

### Issue: High memory usage

**Solution:**
- Check for log loops (logging inside loops)
- Verify metrics aren't using user IDs as labels (high cardinality)
- Monitor with: `grep memory /metrics`

---

## Quick Wins (15 minutes each)

### Quick Win 1: Add Business Metric

**Example: Track chat messages sent**

```typescript
// In chat.controller.ts
import { metrics } from '../config/metrics';

// After message sent
metrics.chatMessagesSent.inc({
  model: message.model,
  userId: message.userId
});
```

### Quick Win 2: Add Alert on High Error Rate

**In Grafana:**
1. Create alert rule
2. Condition: Error rate > 5%
3. Action: Send Slack notification

### Quick Win 3: Log API Response Times

```typescript
// In controller
const startTime = Date.now();
const result = await service.doSomething();
const duration = Date.now() - startTime;

logger.info({
  operation: 'doSomething',
  duration,
  userId
}, 'Operation completed');
```

---

## Success Criteria

**Phase 2 is complete when:**

- [ ] All console.log replaced in critical paths
- [ ] All services have logger/metrics config
- [ ] Metrics endpoints return data
- [ ] Sentry receives test errors
- [ ] Prometheus scrapes all services
- [ ] Grafana dashboard shows metrics
- [ ] Load test passes with <5% overhead
- [ ] Documentation updated

---

## Resources

- **Implementation Report:** `./phase-2-implementation-report.md`
- **Logging Guide:** `../../docs/LOGGING_GUIDE.md`
- **Shared Logger:** `backend/shared/utils/logger.ts`
- **Shared Metrics:** `backend/shared/utils/metrics.ts`

---

## Timeline Estimate

| Task | Time | Priority |
|------|------|----------|
| Complete auth-service | 2h | HIGH |
| Migrate chat-service | 3h | HIGH |
| Migrate billing-service | 2h | MEDIUM |
| Migrate analytics-service | 1.5h | MEDIUM |
| Setup monitoring | 4h | HIGH |
| Testing & docs | 2h | MEDIUM |
| **TOTAL** | **14.5h** | - |

---

**Status:** 85% Complete
**Blocking:** None (can deploy current state)
**Next Milestone:** Complete migration + monitoring setup

---

**Created:** 2025-11-12
**Last Updated:** 2025-11-12
