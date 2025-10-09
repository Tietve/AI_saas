# Beta War Room - Monitoring & Incident Log

48-hour intensive monitoring setup and log for Beta Production launch.

**Purpose**: Detect and respond to issues immediately after Beta deployment
**Duration**: First 48 hours post-deployment
**Team**: On-call rotation with escalation path

---

## War Room Setup

### 1. Communication Channels

**Primary Channel**: Slack/Discord `#beta-war-room`

**Required Participants**:
- CTO (available for escalation)
- Lead Developer (on-call)
- DevOps Engineer (on-call)
- QA Lead (monitoring)

**Response Times**:
- **Critical Issues** (P0): Acknowledge within 5 minutes
- **High Priority** (P1): Acknowledge within 15 minutes
- **Medium Priority** (P2): Acknowledge within 1 hour
- **Low Priority** (P3): Next business day

---

### 2. Monitoring Dashboard Setup

#### A. Sentry Dashboard

```bash
# Sentry Project: ai-saas-platform
# URL: https://sentry.io/organizations/your-org/projects/ai-saas-platform/

# Configure alerts:
# 1. Error rate > 5% for 5 minutes → Alert #beta-war-room
# 2. New issue (never seen before) → Alert #beta-war-room
# 3. Regression (previously resolved issue) → Alert #beta-war-room
```

**Open in tabs**:
1. Issues Dashboard: https://sentry.io/.../issues/
2. Performance Dashboard: https://sentry.io/.../performance/
3. Releases: https://sentry.io/.../releases/

---

#### B. Custom Metrics Dashboard

Create a simple HTML dashboard or use existing tools:

```bash
# Option 1: Simple curl-based monitoring
while true; do
  clear
  echo "=== AI SaaS Metrics - $(date) ==="

  # Health check
  curl -s https://your-app.com/api/health | jq .

  # System metrics
  echo "\n=== System Metrics ==="
  curl -s https://your-app.com/api/metrics/system | jq .

  # Provider metrics
  echo "\n=== Provider Status ==="
  curl -s https://your-app.com/api/metrics/providers | jq '.providers[] | {name, status, errorRate}'

  # Recent errors
  echo "\n=== Recent Errors ==="
  curl -s https://your-app.com/api/metrics/errors?limit=5 | jq .

  sleep 60  # Refresh every minute
done
```

**Option 2**: Use Grafana + Prometheus (if available)

---

#### C. Server Resource Monitoring

```bash
# SSH to production server
ssh user@production-server

# Monitor resources in tmux/screen
htop

# Monitor Docker containers
watch -n 5 'docker stats --no-stream'

# Monitor logs in real-time
docker compose logs -f web | grep -i "error\|warn\|critical"
```

---

#### D. Database Monitoring

```sql
-- Run this query every 5 minutes

-- Connection usage
SELECT
  count(*) as total_connections,
  count(*) FILTER (WHERE state = 'active') as active,
  count(*) FILTER (WHERE state = 'idle') as idle
FROM pg_stat_activity;

-- Long-running queries (>10 seconds)
SELECT
  pid,
  usename,
  state,
  query,
  now() - query_start as duration
FROM pg_stat_activity
WHERE state != 'idle'
  AND (now() - query_start) > interval '10 seconds'
ORDER BY duration DESC;

-- Table sizes
SELECT
  schemaname || '.' || tablename as table,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

---

### 3. Alert Configuration

#### Sentry Alerts

```yaml
# Alert Rules in Sentry UI
alerts:
  - name: "High Error Rate"
    conditions:
      - error_rate > 5% in 5 minutes
    actions:
      - slack: "#beta-war-room"
      - email: "oncall@yourcompany.com"

  - name: "New Critical Error"
    conditions:
      - new_issue AND level = "error"
    actions:
      - slack: "#beta-war-room"

  - name: "Performance Degradation"
    conditions:
      - p95_response_time > 2000ms
    actions:
      - slack: "#beta-war-room"
```

#### Custom Health Monitoring

```bash
# Create monitoring script: scripts/health-monitor.sh
#!/bin/bash

API_URL="https://your-app.com"
WEBHOOK_URL="<slack-webhook-url>"

while true; do
  # Health check
  if ! curl -f -s "$API_URL/api/health" > /dev/null; then
    # Alert to Slack
    curl -X POST "$WEBHOOK_URL" \
      -H 'Content-Type: application/json' \
      -d "{
        \"text\": \":rotating_light: CRITICAL: API health check failed at $(date)\",
        \"channel\": \"#beta-war-room\"
      }"
  fi

  # Check error rate
  ERROR_RATE=$(curl -s "$API_URL/api/metrics/errors" | jq -r '.errorRate')
  if (( $(echo "$ERROR_RATE > 5" | bc -l) )); then
    curl -X POST "$WEBHOOK_URL" \
      -H 'Content-Type: application/json' \
      -d "{
        \"text\": \":warning: Error rate elevated: ${ERROR_RATE}%\",
        \"channel\": \"#beta-war-room\"
      }"
  fi

  sleep 60  # Check every minute
done
```

Run in background:
```bash
nohup bash scripts/health-monitor.sh &
```

---

### 4. Key Metrics to Watch

| Metric | Normal Range | Warning | Critical | Where to Check |
|--------|--------------|---------|----------|----------------|
| Error Rate | <0.1% | 1-5% | >5% | Sentry / Metrics API |
| Response Time (p95) | <500ms | 500-1000ms | >1000ms | Metrics API |
| Request Rate | Varies | N/A | Sudden 10x spike | Metrics API |
| Database Connections | <50 | 50-80 | >80 (max 100) | Database query |
| Memory Usage | <70% | 70-85% | >85% | `docker stats` |
| CPU Usage | <50% | 50-75% | >75% sustained | `docker stats` |
| Disk Usage | <70% | 70-85% | >85% | `df -h` |
| Active Users | Varies | N/A | Sudden drop to 0 | Analytics |

---

## 48-Hour Monitoring Log Template

### Day 1 - Deployment Day

**Date**: _____________
**Deploy Time**: _______ UTC
**Deploy Version**: v1.0.0-beta
**On-Call Engineer**: _____________

---

#### Hour 0-2: Critical Monitoring Period

| Time | Metric Check | Value | Status | Notes |
|------|--------------|-------|--------|-------|
| T+0min | Deployment completed | ✅ / ❌ | | |
| T+5min | Health check | ✅ / ❌ | | API responding |
| T+5min | Smoke tests | ✅ / ❌ | | Ran POST_DEPLOY_CHECKLIST.md |
| T+10min | Error rate | ___% | ✅ / ⚠️ / ❌ | Target: <0.1% |
| T+10min | Response time (p95) | ___ms | ✅ / ⚠️ / ❌ | Target: <500ms |
| T+10min | Database connections | ___ | ✅ / ⚠️ / ❌ | Target: <50 |
| T+10min | Sentry errors | ___ | ✅ / ⚠️ / ❌ | Any new issues? |
| T+15min | First real user login | ✅ / ❌ | | User ID: _____ |
| T+15min | First chat message | ✅ / ❌ | | Conversation ID: _____ |
| T+30min | Error rate | ___% | ✅ / ⚠️ / ❌ | |
| T+30min | Active users | ___ | ✅ / ⚠️ / ❌ | |
| T+1h | Full metrics check | ✅ / ❌ | | All systems nominal |
| T+2h | Memory usage | ___% | ✅ / ⚠️ / ❌ | |
| T+2h | CPU usage | ___% | ✅ / ⚠️ / ❌ | |

**Incidents (if any)**:
```
[HH:MM] - Description of incident
  - Severity: P0 / P1 / P2 / P3
  - Impact: [User-facing impact]
  - Resolution: [What was done]
  - Root cause: [Why it happened]
```

---

#### Hour 2-8: Active Monitoring

**Check every 30 minutes**

| Time | Error Rate | Response Time | Active Users | Database Conn | Memory | CPU | Issues |
|------|-----------|---------------|--------------|---------------|--------|-----|--------|
| T+2h | ___% | ___ms | ___ | ___ | ___% | ___% | |
| T+2.5h | ___% | ___ms | ___ | ___ | ___% | ___% | |
| T+3h | ___% | ___ms | ___ | ___ | ___% | ___% | |
| T+3.5h | ___% | ___ms | ___ | ___ | ___% | ___% | |
| T+4h | ___% | ___ms | ___ | ___ | ___% | ___% | |
| T+4.5h | ___% | ___ms | ___ | ___ | ___% | ___% | |
| T+5h | ___% | ___ms | ___ | ___ | ___% | ___% | |
| T+5.5h | ___% | ___ms | ___ | ___ | ___% | ___% | |
| T+6h | ___% | ___ms | ___ | ___ | ___% | ___% | |
| T+6.5h | ___% | ___ms | ___ | ___ | ___% | ___% | |
| T+7h | ___% | ___ms | ___ | ___ | ___% | ___% | |
| T+7.5h | ___% | ___ms | ___ | ___ | ___% | ___% | |
| T+8h | ___% | ___ms | ___ | ___ | ___% | ___% | |

**Notable Events**:
- [HH:MM] - Event description
- [HH:MM] - Event description

**User Feedback**:
- Positive:
- Negative:
- Bugs reported:

---

#### Hour 8-24: Standard Monitoring

**Check every 2 hours**

| Time | Status | Error Rate | Response Time | Notes |
|------|--------|-----------|---------------|-------|
| T+8h | ✅ / ⚠️ / ❌ | ___% | ___ms | |
| T+10h | ✅ / ⚠️ / ❌ | ___% | ___ms | |
| T+12h | ✅ / ⚠️ / ❌ | ___% | ___ms | |
| T+14h | ✅ / ⚠️ / ❌ | ___% | ___ms | |
| T+16h | ✅ / ⚠️ / ❌ | ___% | ___ms | |
| T+18h | ✅ / ⚠️ / ❌ | ___% | ___ms | |
| T+20h | ✅ / ⚠️ / ❌ | ___% | ___ms | |
| T+22h | ✅ / ⚠️ / ❌ | ___% | ___ms | |
| T+24h | ✅ / ⚠️ / ❌ | ___% | ___ms | **End of Day 1** |

**Day 1 Summary**:
- Total Uptime: ___% (target: 99.9%+)
- Total Incidents: ___
  - P0 (Critical): ___
  - P1 (High): ___
  - P2 (Medium): ___
  - P3 (Low): ___
- Total Users Onboarded: ___
- Total Conversations Created: ___
- Total Messages Sent: ___
- Average Response Time: ___ms
- Peak Error Rate: ___%

**Go/No-Go for Day 2**:
- [ ] Error rate remained <1% for 12+ hours
- [ ] No P0 incidents in last 8 hours
- [ ] System metrics stable (memory, CPU, disk)
- [ ] User feedback mostly positive

**Decision**: ✅ CONTINUE / ⚠️ MONITOR CLOSELY / ❌ ROLLBACK

**Signed**: _____________ (On-Call Engineer)

---

### Day 2 - Stabilization Day

**Date**: _____________
**On-Call Engineer**: _____________

---

#### Hour 24-36: Continued Monitoring

| Time | Status | Error Rate | Response Time | Active Users | Notes |
|------|--------|-----------|---------------|--------------|-------|
| T+24h | ✅ / ⚠️ / ❌ | ___% | ___ms | ___ | |
| T+26h | ✅ / ⚠️ / ❌ | ___% | ___ms | ___ | |
| T+28h | ✅ / ⚠️ / ❌ | ___% | ___ms | ___ | |
| T+30h | ✅ / ⚠️ / ❌ | ___% | ___ms | ___ | |
| T+32h | ✅ / ⚠️ / ❌ | ___% | ___ms | ___ | |
| T+34h | ✅ / ⚠️ / ❌ | ___% | ___ms | ___ | |
| T+36h | ✅ / ⚠️ / ❌ | ___% | ___ms | ___ | |

---

#### Hour 36-48: Final Monitoring Period

| Time | Status | Error Rate | Response Time | Active Users | Notes |
|------|--------|-----------|---------------|--------------|-------|
| T+36h | ✅ / ⚠️ / ❌ | ___% | ___ms | ___ | |
| T+38h | ✅ / ⚠️ / ❌ | ___% | ___ms | ___ | |
| T+40h | ✅ / ⚠️ / ❌ | ___% | ___ms | ___ | |
| T+42h | ✅ / ⚠️ / ❌ | ___% | ___ms | ___ | |
| T+44h | ✅ / ⚠️ / ❌ | ___% | ___ms | ___ | |
| T+46h | ✅ / ⚠️ / ❌ | ___% | ___ms | ___ | |
| T+48h | ✅ / ⚠️ / ❌ | ___% | ___ms | ___ | **War Room End** |

**Day 2 Summary**:
- Total Uptime: ___% (target: 99.9%+)
- Total Incidents: ___
- Total Users Onboarded: ___
- Total Conversations Created: ___
- Total Messages Sent: ___

---

## 48-Hour Summary Report

**Deployment**: v1.0.0-beta
**Start Time**: _____________ UTC
**End Time**: _____________ UTC
**Total Duration**: 48 hours

### Overall Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Uptime | 99.9% | ___% | ✅ / ⚠️ / ❌ |
| Average Error Rate | <0.1% | ___% | ✅ / ⚠️ / ❌ |
| Peak Error Rate | <1% | ___% | ✅ / ⚠️ / ❌ |
| Average Response Time (p95) | <500ms | ___ms | ✅ / ⚠️ / ❌ |
| Peak Response Time (p95) | <1000ms | ___ms | ✅ / ⚠️ / ❌ |

### Incident Summary

**Total Incidents**: ___

**By Severity**:
- P0 (Critical): ___ incidents
  - List: [Brief description of each]
- P1 (High): ___ incidents
  - List: [Brief description of each]
- P2 (Medium): ___ incidents
  - List: [Brief description of each]
- P3 (Low): ___ incidents
  - List: [Brief description of each]

**Mean Time to Detect (MTTD)**: _____ minutes
**Mean Time to Resolve (MTTR)**: _____ minutes

### User Metrics

- Total Users Registered: ___
- Total Users Verified: ___
- Total Conversations: ___
- Total Messages: ___
- Total Payments (if applicable): ___
- User Retention (returned 2+ times): ___

### Performance Insights

**Database**:
- Peak connections: ___ / 100
- Slowest query: ___ms
- Total queries: ___

**AI Providers**:
- OpenAI: ___ requests, ___% success rate
- Anthropic: ___ requests, ___% success rate
- Google: ___ requests, ___% success rate

**Caching**:
- Cache hit rate: ___%
- Total cache hits: ___
- Total cache misses: ___

### Issues Found

1. **[Critical/High/Medium/Low]**: Issue description
   - Impact: [User-facing impact]
   - Root cause: [Technical cause]
   - Resolution: [How it was fixed]
   - Prevention: [How to prevent in future]

2. [Repeat for each significant issue]

### Lessons Learned

**What Went Well**:
- [List positive outcomes]
- [E.g., "Rollback procedure was well-documented and easy to execute"]
- [E.g., "Monitoring caught issues before users reported them"]

**What Could Be Improved**:
- [List areas for improvement]
- [E.g., "Need better alerting for database connection pool"]
- [E.g., "Response time for P1 incidents was too slow"]

**Action Items**:
1. [ ] [Specific improvement to implement]
2. [ ] [E.g., "Add database connection pool monitoring alert"]
3. [ ] [E.g., "Improve documentation for XYZ"]
4. [ ] [E.g., "Add automated tests for ABC"]

### Go-Live Decision

Based on 48-hour monitoring, the team recommends:

**Decision**: ✅ PROCEED TO FULL RELEASE / ⚠️ EXTENDED BETA / ❌ ROLLBACK

**Rationale**:
[Explain why this decision was made based on metrics and incidents]

**Conditions** (if any):
- [E.g., "Fix issue #123 before full release"]
- [E.g., "Monitor error rate for another 24h"]

**Next Steps**:
1. [E.g., "Close war room, switch to normal on-call rotation"]
2. [E.g., "Schedule post-mortem meeting"]
3. [E.g., "Prepare full release announcement"]

---

**Signed Off By**:
- CTO: _____________ Date: _______
- Lead Developer: _____________ Date: _______
- DevOps: _____________ Date: _______

---

## Incident Response Playbook

Quick reference for common incidents during war room monitoring.

### 🔥 P0: API Down (Health Check Failing)

**Immediate Actions**:
1. Check server status: `docker compose ps`
2. Check logs: `docker compose logs web --tail=100`
3. Check database: `docker compose exec db psql -U postgres -c "\l"`
4. If all else fails: **ROLLBACK** (see `docs/ROLLBACK.md`)

---

### 🔴 P1: High Error Rate (>5%)

**Immediate Actions**:
1. Check Sentry for error patterns
2. Identify which endpoint is failing
3. Check if it's a provider issue (OpenAI down?)
4. Consider disabling failing feature temporarily
5. If unresolvable in 15 minutes: **ROLLBACK**

---

### 🟠 P1: Slow Response Times (p95 > 1000ms)

**Immediate Actions**:
1. Check database slow queries
2. Check AI provider latency
3. Check server resources (CPU, memory)
4. Consider scaling up (if Kubernetes: increase replicas)
5. Monitor for 30 minutes, rollback if degrading

---

### 🟡 P2: Database Connection Pool Exhausted

**Immediate Actions**:
1. Check active connections: See database monitoring query above
2. Look for long-running queries
3. Check for connection leaks in code
4. Temporary fix: Increase `connection_limit` in DATABASE_URL
5. Permanent fix: Fix connection leak in code

---

### 🟢 P3: Single Feature Broken

**Actions**:
1. Document issue
2. Create bug ticket
3. Consider feature flag to disable
4. Fix in next deployment
5. No rollback needed

---

**Last Updated**: 2025-10-09

**War Room Protocol**: This document should be actively filled out during the 48-hour monitoring period. Update metrics in real-time and document all incidents immediately.
