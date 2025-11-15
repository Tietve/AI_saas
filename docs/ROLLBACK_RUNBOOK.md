# Production Rollback Runbook

> **Emergency procedures for rolling back My-SaaS-Chat deployments**
> **Last Updated:** 2025-11-15
> **Version:** 2.0

## Purpose

This runbook provides step-by-step procedures for rolling back production deployments when critical issues are detected.

**Key Objectives:**
- Minimize downtime (< 15 minutes target)
- Preserve data integrity
- Restore service functionality
- Document incident for post-mortem

---

## Table of Contents

- [When to Rollback](#when-to-rollback)
- [Rollback Decision Matrix](#rollback-decision-matrix)
- [Pre-Rollback Checklist](#pre-rollback-checklist)
- [Rollback Procedures](#rollback-procedures)
- [Verification Steps](#verification-steps)
- [Post-Rollback Actions](#post-rollback-actions)
- [Escalation Procedures](#escalation-procedures)

---

## When to Rollback

### Critical Issues (Immediate Rollback Required)

🚨 **Trigger rollback IMMEDIATELY if:**

1. **Service Availability:**
   - [ ] Any critical service down for > 5 minutes
   - [ ] Health checks failing consistently (3/3 checks)
   - [ ] Complete service outage

2. **Error Rates:**
   - [ ] Error rate > 10% for 5 minutes
   - [ ] Error rate > 5% for 10 minutes
   - [ ] Critical endpoint errors > 1%

3. **Performance Degradation:**
   - [ ] P95 response time > 5x baseline for 10 minutes
   - [ ] P50 response time > 3x baseline for 10 minutes
   - [ ] Database query time > 10x baseline

4. **Data Integrity:**
   - [ ] Data corruption detected
   - [ ] Incorrect billing calculations
   - [ ] User data mixing (multi-tenancy breach)
   - [ ] Database migration failure with data loss

5. **Security Issues:**
   - [ ] Active security breach detected
   - [ ] Critical vulnerability exploited
   - [ ] Unauthorized access to user data
   - [ ] Authentication bypass discovered

6. **Critical User Flows Broken:**
   - [ ] Login/signup not working
   - [ ] Payment processing failing
   - [ ] Chat/messaging broken
   - [ ] Data loss on save

### High-Priority Issues (Rollback Recommended)

⚠️ **Consider rollback if:**

1. **Partial Service Degradation:**
   - [ ] Non-critical service down for > 15 minutes
   - [ ] Error rate > 2% for 20 minutes
   - [ ] P95 response time > 2x baseline for 20 minutes

2. **Third-Party Integration Failures:**
   - [ ] Stripe payment integration broken
   - [ ] Email delivery failing (>50% failure rate)
   - [ ] OpenAI API calls failing (>20% failure rate)

3. **Resource Exhaustion:**
   - [ ] Memory usage > 90% sustained
   - [ ] CPU usage > 90% sustained
   - [ ] Disk space < 5% free
   - [ ] Database connections exhausted

4. **Monitoring/Observability Loss:**
   - [ ] Logs not being collected
   - [ ] Metrics not being reported
   - [ ] Alerts not firing

### Medium-Priority Issues (Investigate Before Rollback)

ℹ️ **Investigate and fix if possible, rollback if fix takes > 30 min:**

1. **Minor Performance Issues:**
   - [ ] P95 response time 1.5x baseline
   - [ ] Error rate 0.5-1%
   - [ ] Slow queries (not blocking)

2. **Feature-Specific Issues:**
   - [ ] New feature not working (old features OK)
   - [ ] UI rendering issues (non-blocking)
   - [ ] Analytics data inconsistencies

3. **Configuration Issues:**
   - [ ] Incorrect environment variable (non-critical)
   - [ ] Feature flag misconfiguration
   - [ ] Cache configuration issues

---

## Rollback Decision Matrix

| Issue Severity | Error Rate | Response Time | User Impact | Decision | Max Downtime |
|---------------|-----------|--------------|------------|----------|--------------|
| **Critical** | >10% | >5x baseline | Complete outage | **ROLLBACK NOW** | 5 min |
| **High** | 5-10% | 3-5x baseline | Major degradation | **ROLLBACK** | 15 min |
| **Medium** | 2-5% | 2-3x baseline | Partial degradation | Investigate (30 min) → Rollback | 30 min |
| **Low** | 0.5-2% | 1.5-2x baseline | Minor issues | Fix forward | N/A |

**Decision Maker:**
- Primary: On-call engineer
- Escalation: DevOps lead
- Final authority: Engineering manager

---

## Pre-Rollback Checklist

### 1. Assess Situation (2-3 minutes)

- [ ] **Identify the issue:**
  - What is broken?
  - What changed recently?
  - What is the user impact?

- [ ] **Check metrics:**
  ```bash
  # Error rate
  curl https://api.yourdomain.com/api/analytics/errors/rate

  # Response time
  curl https://api.yourdomain.com/api/analytics/performance/p95

  # Service health
  curl https://api.yourdomain.com/health
  ```

- [ ] **Review recent deployments:**
  ```bash
  git log -5
  docker compose ps
  ```

- [ ] **Estimate impact:**
  - How many users affected?
  - What functionality is broken?
  - Is data at risk?

### 2. Decision Point

**Proceed with rollback if:**
- ✅ Issue meets critical or high-priority criteria
- ✅ Fix will take > allowed downtime
- ✅ Rollback procedure is faster than fix

**DO NOT rollback if:**
- ❌ Quick fix available (< 5 minutes)
- ❌ Issue is isolated to non-critical feature
- ❌ Rollback would cause more harm (e.g., database schema changes)

### 3. Notify Team (1 minute)

- [ ] **Alert team:**
  ```bash
  # Post to Slack #production-alerts
  "🚨 ROLLBACK IN PROGRESS: <brief description>. ETA: <time>. Led by: <name>"
  ```

- [ ] **Update status page:**
  - Set status to "Major outage" or "Partial outage"
  - Add incident message

- [ ] **Assign roles:**
  - Rollback lead: Execute rollback
  - Monitor: Watch metrics during rollback
  - Communication: Update stakeholders

---

## Rollback Procedures

### Procedure A: Code Rollback (No Database Changes)

**Time Estimate:** 5-10 minutes
**Use when:** Code deployment failed, database unchanged

#### Step 1: Identify Last Known Good Version (1 min)

```bash
# List recent tags
git tag --list | tail -10

# Show current version
git log -1

# Identify last stable version (e.g., v1.2.3)
ROLLBACK_VERSION="v1.2.3"
```

#### Step 2: Stop Current Services (30 sec)

```bash
# Stop all services gracefully
docker compose -f docker-compose.prod.yml down --timeout 30
```

#### Step 3: Checkout Previous Version (30 sec)

```bash
# Checkout last known good version
git fetch origin
git checkout $ROLLBACK_VERSION

# Verify checkout
git log -1
```

#### Step 4: Rebuild and Restart Services (3-5 min)

```bash
# Rebuild images
docker compose -f docker-compose.prod.yml build

# Start services in order
docker compose -f docker-compose.prod.yml up -d postgres redis mongodb
sleep 30  # Wait for databases

docker compose -f docker-compose.prod.yml up -d auth-service chat-service billing-service
docker compose -f docker-compose.prod.yml up -d analytics-service orchestrator-service email-worker

docker compose -f docker-compose.prod.yml up -d api-gateway frontend
```

#### Step 5: Verify Rollback (2 min)

```bash
# Check container status
docker compose ps

# Test health endpoints
curl https://api.yourdomain.com/health
curl https://api.yourdomain.com/api/auth/health
curl https://api.yourdomain.com/api/chats/health
curl https://api.yourdomain.com/api/billing/health

# Test critical user flow
./scripts/smoke-tests.sh
```

**Go to [Verification Steps](#verification-steps)**

---

### Procedure B: Code + Database Rollback

**Time Estimate:** 10-20 minutes
**Use when:** Database migration included in deployment

⚠️ **WARNING:** This procedure involves data restore. Ensure backup is recent.

#### Step 1: Identify Backup (2 min)

```bash
# List available backups
./scripts/restore.sh -l

# Or check S3
aws s3 ls s3://my-saas-chat-backups/postgres/

# Identify backup from BEFORE deployment
BACKUP_DATE="2025-11-15"  # Example: today's pre-deployment backup
```

#### Step 2: Create Emergency Backup (2 min)

```bash
# Backup current state (even if broken)
docker compose exec backup-service /backup.sh

# Tag it as "before-rollback"
docker compose exec backup-service mv \
  /backups/postgres_saas_db_$(date +%Y%m%d).sql.gz \
  /backups/postgres_saas_db_before_rollback_$(date +%Y%m%d_%H%M).sql.gz
```

#### Step 3: Stop Services (1 min)

```bash
# Stop all services EXCEPT databases
docker compose -f docker-compose.prod.yml stop \
  auth-service chat-service billing-service analytics-service \
  orchestrator-service email-worker api-gateway frontend
```

#### Step 4: Restore Database (5-10 min)

```bash
# Restore PostgreSQL from backup
./scripts/restore.sh -d $BACKUP_DATE

# Verify restore
docker compose exec postgres psql -U postgres -d saas_db -c "\dt"

# Check row counts
docker compose exec postgres psql -U postgres -d saas_db -c "
  SELECT 'users' AS table, COUNT(*) FROM \"User\"
  UNION ALL
  SELECT 'chats', COUNT(*) FROM \"Chat\"
  UNION ALL
  SELECT 'messages', COUNT(*) FROM \"Message\";
"
```

#### Step 5: Rollback Code (1 min)

```bash
# Checkout previous version
git checkout $ROLLBACK_VERSION

# Verify migrations match restored database
cd backend/services/auth-service
npx prisma migrate status
cd backend/services/chat-service
npx prisma migrate status
```

#### Step 6: Restart Services (2-3 min)

```bash
# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build \
  auth-service chat-service billing-service analytics-service \
  orchestrator-service email-worker

# Wait for startup
sleep 30

# Start gateway and frontend
docker compose -f docker-compose.prod.yml up -d api-gateway frontend
```

#### Step 7: Verify Rollback (2 min)

```bash
# Full verification
./scripts/smoke-tests.sh

# Check data integrity
curl -H "Authorization: Bearer <JWT>" \
  https://api.yourdomain.com/api/chats

# Verify user can login
curl -X POST https://api.yourdomain.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'
```

**Go to [Verification Steps](#verification-steps)**

---

### Procedure C: Partial Rollback (Single Service)

**Time Estimate:** 3-5 minutes
**Use when:** Only one service is failing

#### Step 1: Identify Failed Service (30 sec)

```bash
# Check service status
docker compose ps | grep -v "Up"

# Example: chat-service is failing
FAILED_SERVICE="chat-service"
```

#### Step 2: Rollback Single Service (2-3 min)

```bash
# Find previous working image
docker images | grep $FAILED_SERVICE

# Or rebuild from previous commit
git log --oneline backend/services/$FAILED_SERVICE | head -5

# Checkout service directory from previous commit
git checkout HEAD~1 -- backend/services/$FAILED_SERVICE

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build $FAILED_SERVICE

# Watch logs
docker compose logs -f $FAILED_SERVICE
```

#### Step 3: Verify Service (1 min)

```bash
# Check health
curl https://api.yourdomain.com/api/chats/health

# Test functionality
curl -H "Authorization: Bearer <JWT>" \
  https://api.yourdomain.com/api/chats
```

**Go to [Verification Steps](#verification-steps)**

---

### Procedure D: Emergency Shutdown

**Time Estimate:** 1 minute
**Use when:** Immediate service shutdown required (security breach, data corruption)

⚠️ **LAST RESORT:** Only use when continuing to run would cause more damage.

```bash
# Emergency stop all services
docker compose -f docker-compose.prod.yml down

# Update status page
# "Service temporarily unavailable for emergency maintenance"

# Notify team immediately
# Slack #production-alerts: "🚨 EMERGENCY SHUTDOWN: <reason>"

# Proceed with investigation and full rollback
```

---

## Verification Steps

### 1. Service Health (2 min)

```bash
# All services running
docker compose ps | grep -v "Up" && echo "❌ Some services down" || echo "✅ All services up"

# Health endpoints
for service in auth chat billing analytics; do
  status=$(curl -s -o /dev/null -w "%{http_code}" https://api.yourdomain.com/api/${service}/health)
  if [ "$status" = "200" ]; then
    echo "✅ $service: healthy"
  else
    echo "❌ $service: unhealthy (HTTP $status)"
  fi
done
```

### 2. Critical User Flows (3 min)

```bash
# Run smoke tests
cd scripts
./smoke-tests.sh

# Expected output:
# ✅ User registration working
# ✅ User login working
# ✅ Chat creation working
# ✅ Message sending working
# ✅ Billing checkout working
```

### 3. Performance Metrics (2 min)

```bash
# Check error rate
ERROR_RATE=$(curl -s https://api.yourdomain.com/api/analytics/errors/rate | jq '.rate')
echo "Error rate: $ERROR_RATE%"
if (( $(echo "$ERROR_RATE < 1" | bc -l) )); then
  echo "✅ Error rate acceptable"
else
  echo "❌ Error rate still high"
fi

# Check response time
P95=$(curl -s https://api.yourdomain.com/api/analytics/performance/p95 | jq '.p95')
echo "P95 response time: ${P95}ms"
if (( $(echo "$P95 < 500" | bc -l) )); then
  echo "✅ Response time acceptable"
else
  echo "❌ Response time still high"
fi
```

### 4. Database Integrity (1 min)

```bash
# Check database connections
docker compose exec postgres psql -U postgres -c "SELECT COUNT(*) FROM pg_stat_activity;"

# Verify key tables
docker compose exec postgres psql -U postgres -d saas_db -c "
  SELECT 'User' AS table, COUNT(*) FROM \"User\"
  UNION ALL
  SELECT 'Chat', COUNT(*) FROM \"Chat\"
  UNION ALL
  SELECT 'Message', COUNT(*) FROM \"Message\";
"
```

### 5. Monitor for Stability (15 min)

- [ ] Watch error rate for 15 minutes (should stay < 1%)
- [ ] Monitor response times (should return to baseline)
- [ ] Check logs for repeated errors
- [ ] Verify no new incidents reported

---

## Post-Rollback Actions

### Immediate (0-1 Hour)

- [ ] **Update Status Page:**
  ```
  "Issue resolved. Services restored to previous stable version.
   Investigating root cause. Updates to follow."
  ```

- [ ] **Notify Team:**
  ```bash
  # Slack #production-alerts
  "✅ ROLLBACK COMPLETE. Services restored.
   Current version: $ROLLBACK_VERSION
   Monitoring for stability.
   Post-mortem scheduled for <time>."
  ```

- [ ] **Document Incident:**
  - Create incident report document
  - Note timeline of events
  - Record metrics during incident
  - List actions taken

- [ ] **Continue Monitoring:**
  - Watch error rates (target: < 0.5%)
  - Monitor response times (target: return to baseline)
  - Check user reports (support channels)

### Short-term (1-24 Hours)

- [ ] **Root Cause Analysis:**
  - Review logs from failed deployment
  - Analyze metrics leading up to failure
  - Identify exact cause of failure
  - Determine why issue wasn't caught in testing

- [ ] **Create Fix:**
  - Develop fix for root cause
  - Add tests to prevent regression
  - Test fix in staging environment
  - Prepare for re-deployment

- [ ] **Update Processes:**
  - Add checks to CI/CD pipeline
  - Update testing procedures
  - Improve monitoring/alerting
  - Document lessons learned

### Post-Mortem (24-48 Hours)

- [ ] **Schedule Meeting:**
  - Include: Engineering, DevOps, Product
  - Duration: 1 hour
  - Agenda: Timeline, root cause, prevention

- [ ] **Prepare Post-Mortem Doc:**
  ```markdown
  # Incident Post-Mortem: <Date>

  ## Summary
  - What happened?
  - When did it happen?
  - How long was the impact?
  - How many users affected?

  ## Timeline
  - HH:MM - Deployment started
  - HH:MM - Issue detected
  - HH:MM - Rollback initiated
  - HH:MM - Services restored

  ## Root Cause
  - Technical cause
  - Why wasn't it caught?

  ## Impact
  - Users affected: <number>
  - Downtime: <minutes>
  - Revenue impact: $<amount>

  ## Action Items
  - [ ] Add test for <scenario>
  - [ ] Improve monitoring for <metric>
  - [ ] Update deployment checklist

  ## Lessons Learned
  - What went well?
  - What could be improved?
  ```

- [ ] **Share Post-Mortem:**
  - Distribute to engineering team
  - Share summary with leadership
  - Post to incident history wiki

---

## Escalation Procedures

### Level 1: On-Call Engineer (You)

**Authority:**
- Execute rollback for critical/high-priority issues
- Make deployment decisions

**When to escalate:**
- Rollback not resolving issue
- Data integrity concerns
- Unclear rollback path
- Multiple simultaneous incidents

### Level 2: DevOps Lead

**Contact:**
- Slack: @devops-lead
- Phone: ________________
- PagerDuty: ________________

**When to escalate:**
- Rollback failed
- Database restore issues
- Infrastructure-level problems
- Requires production access decisions

### Level 3: Engineering Manager

**Contact:**
- Slack: @engineering-manager
- Phone: ________________
- Email: ________________

**When to escalate:**
- Major incident (>1 hour downtime)
- Customer data at risk
- Legal/compliance concerns
- Public communication needed

### Level 4: CTO/Leadership

**Contact:**
- Phone: ________________
- Email: ________________

**When to escalate:**
- Extended outage (>4 hours)
- Major data loss
- Security breach
- Press/PR concerns

---

## Rollback Scripts

### Quick Rollback Script

Save as `/home/user/AI_saas/scripts/quick-rollback.sh`:

```bash
#!/bin/bash
set -e

# Quick rollback script
# Usage: ./quick-rollback.sh <version>

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 v1.2.3"
  exit 1
fi

echo "🚨 Starting rollback to $VERSION..."

# Stop services
echo "Stopping services..."
docker compose -f docker-compose.prod.yml down --timeout 30

# Checkout version
echo "Checking out $VERSION..."
git fetch origin
git checkout $VERSION

# Rebuild and start
echo "Rebuilding and starting services..."
docker compose -f docker-compose.prod.yml up -d --build

echo "Waiting for services to start..."
sleep 30

# Health check
echo "Running health checks..."
./scripts/smoke-tests.sh

echo "✅ Rollback complete!"
echo "Monitor services for stability: docker compose logs -f"
```

### Database Restore Script

Already exists at `/home/user/AI_saas/scripts/restore.sh` (referenced throughout this guide).

---

## Checklists

### Pre-Rollback Checklist

- [ ] Issue identified and documented
- [ ] Impact assessed (users, revenue, data)
- [ ] Decision to rollback made
- [ ] Team notified
- [ ] Status page updated
- [ ] Rollback version identified
- [ ] Backup verified (if database rollback needed)

### Rollback Execution Checklist

- [ ] Emergency backup created
- [ ] Services stopped
- [ ] Code rolled back (or database restored)
- [ ] Services restarted
- [ ] Health checks passing
- [ ] Critical user flows tested
- [ ] Metrics returned to normal

### Post-Rollback Checklist

- [ ] Status page updated to resolved
- [ ] Team notified of completion
- [ ] Monitoring for stability (15 min)
- [ ] Incident documented
- [ ] Root cause analysis started
- [ ] Post-mortem scheduled
- [ ] Action items created

---

## Testing Rollback Procedures

**Test rollback procedures quarterly in staging:**

1. Deploy intentionally broken version
2. Trigger rollback based on metrics
3. Execute rollback procedure
4. Verify restoration
5. Document time taken
6. Identify improvements

**Last Tested:** ________________
**Test Results:** ________________
**Improvements Made:** ________________

---

## Frequently Asked Questions

**Q: How do I know if I should rollback or fix forward?**
A: Rollback if fix will take longer than allowed downtime OR data integrity at risk. Fix forward for minor issues.

**Q: What if the rollback also has issues?**
A: Rollback one more version back, or execute emergency shutdown and investigate.

**Q: What if database migration can't be rolled back?**
A: Restore from backup. Always backup before migrations.

**Q: How do I handle data created between deployment and rollback?**
A: For Procedure B (database restore): Data created after deployment will be lost. Communicate to users.

**Q: What if rollback takes longer than expected?**
A: Update status page with ETA. Communicate progress every 15 minutes.

---

## Appendix

### Rollback Decision Tree

```
Issue Detected
    |
    ├─> Critical? (Error >10%, Outage, Data loss)
    |       └─> YES ─> ROLLBACK IMMEDIATELY (Procedure A or B)
    |
    ├─> High Priority? (Error 5-10%, Major degradation)
    |       └─> YES ─> ROLLBACK (Procedure A, B, or C)
    |
    ├─> Medium Priority? (Error 2-5%, Partial degradation)
    |       └─> YES ─> Investigate (30 min) ─> Still broken? ─> ROLLBACK
    |
    └─> Low Priority?
            └─> YES ─> Fix forward
```

### Metrics Baseline (for comparison during rollback)

| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| Error rate | <0.1% | 0.5-2% | >2% |
| P95 response time (auth) | <100ms | 100-200ms | >200ms |
| P95 response time (chat) | <500ms | 500-1000ms | >1000ms |
| Database query time | <50ms | 50-200ms | >200ms |
| CPU usage | <40% | 40-70% | >70% |
| Memory usage | <60% | 60-80% | >80% |

---

**Document Version:** 2.0
**Last Updated:** 2025-11-15
**Next Review:** After first production rollback

**Contact for Questions:**
- DevOps Lead: ________________
- Engineering Manager: ________________
