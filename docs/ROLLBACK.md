# Rollback Procedures

Complete rollback procedures for all deployment methods when things go wrong.

**CRITICAL**: Practice these procedures in staging before production deployment.

---

## When to Rollback

Execute rollback immediately if any of these conditions occur:

### Critical Triggers (Immediate Rollback Required)

1. **Auth System Down**
   - Users cannot sign in
   - Session verification failing
   - JWT refresh endpoint returning errors
   - **Impact**: All users locked out

2. **Database Corruption**
   - Migration failed mid-execution
   - Data integrity errors
   - Foreign key constraint violations
   - **Impact**: Data loss risk

3. **Payment System Broken**
   - Webhooks not processing
   - Users charged but tier not upgraded
   - Duplicate payments created
   - **Impact**: Revenue loss, legal issues

4. **Critical Security Vulnerability**
   - CSRF protection disabled
   - Rate limiting not working
   - Authentication bypass discovered
   - **Impact**: Security breach risk

5. **High Error Rate**
   - >5% of requests returning HTTP 500
   - Error rate sustained for >5 minutes
   - **Impact**: Service degradation

6. **Performance Degradation**
   - p95 response time >3000ms (3x normal)
   - Memory usage >90% sustained
   - Database connection pool exhausted
   - **Impact**: Poor user experience

### Warning Triggers (Monitor Closely, Consider Rollback)

1. AI provider failures (degraded functionality but not broken)
2. Email service down (verification emails delayed)
3. Redis cache failures (performance impact only)
4. Single non-critical feature broken

---

## Pre-Rollback Checklist

**BEFORE** executing rollback:

1. ✅ **Notify stakeholders**
   - Inform CTO/team in Slack/Discord
   - Post status update if public-facing

2. ✅ **Capture evidence**
   ```bash
   # Save logs
   docker compose logs web > rollback-logs-$(date +%s).txt

   # Save Sentry errors
   # Take screenshots of error dashboards

   # Save database state
   pg_dump $DATABASE_URL > pre-rollback-backup.sql
   ```

3. ✅ **Identify root cause** (if time permits)
   - Check recent deployments
   - Review error logs
   - Identify which component failed

4. ✅ **Determine rollback target**
   - Previous stable version tag (e.g., `v1.0.0-beta.2`)
   - Git commit SHA
   - Docker image tag

---

## Option A: Rollback CI/CD Deployment

**Use When**: Deployed via GitHub Actions

### Step 1: Identify Previous Version

```bash
# List recent deployments
git log --oneline -10

# Find last stable deployment (before current broken one)
git log --grep="Deploy" -5

# Identify stable version
export ROLLBACK_VERSION="v1.0.0-beta.2"  # Or commit SHA
```

### Step 2: Trigger Rollback Deployment

**Method 1**: Re-run previous workflow

1. Go to GitHub Actions
2. Find last successful deployment workflow
3. Click "Re-run all jobs"
4. Monitor deployment progress

**Method 2**: Deploy specific version via git

```bash
# SSH to production server
ssh user@production-server

cd /opt/ai-saas-app

# Pull specific version
git fetch --all
git checkout $ROLLBACK_VERSION

# Pull new Docker images
docker compose pull

# Restart with new version
docker compose up -d

# Verify rollback
docker compose ps
docker compose logs -f web --tail=50
```

### Step 3: Verify Rollback

```bash
# Check health endpoint
curl https://your-app.com/api/health

# Verify version (if you have version endpoint)
curl https://your-app.com/api/version

# Run smoke tests
bash scripts/smoke-test.sh
```

**Expected Time**: 5-10 minutes

---

## Option B: Rollback Docker Compose Deployment

**Use When**: Deployed with Docker Compose

### Step 1: Stop Current Version

```bash
cd /opt/ai-saas-app

# Stop containers (but don't remove)
docker compose stop web

# Optional: Keep database running if data is good
# docker compose stop web redis
```

### Step 2: Restore Previous Docker Image

```bash
# List recent images
docker images | grep ai-saas-web

# Identify previous stable image
export STABLE_TAG="v1.0.0-beta.2"

# Update docker-compose.prod.yml to use stable tag
sed -i "s|image: your-registry/ai-saas-web:.*|image: your-registry/ai-saas-web:$STABLE_TAG|" docker-compose.prod.yml

# Pull specific version
docker compose pull web

# Start with rolled-back version
docker compose up -d web

# Verify
docker compose ps
docker compose logs -f web --tail=100
```

### Step 3: Rollback Database (If Needed)

⚠️ **ONLY if database migration caused the issue**

```bash
# 1. Stop application first
docker compose stop web

# 2. Restore from pre-migration backup
docker compose exec -T db psql -U postgres ai_saas < pre-rollback-backup.sql

# If backup file is gzipped:
gunzip < pre-rollback-backup.sql.gz | docker compose exec -T db psql -U postgres ai_saas

# 3. Restart application
docker compose up -d web
```

### Step 4: Verify Services

```bash
# Check all services
docker compose ps

# Expected output:
# NAME                SERVICE   STATUS
# ai-saas-web-1      web       running
# ai-saas-db-1       db        running
# ai-saas-redis-1    redis     running

# Check logs for errors
docker compose logs web --tail=100 | grep -i error

# Test API
curl -f https://your-app.com/api/health || echo "ROLLBACK FAILED"
```

**Expected Time**: 3-5 minutes (without database rollback)
**Expected Time**: 10-15 minutes (with database rollback)

---

## Option C: Rollback Kubernetes Deployment

**Use When**: Deployed on Kubernetes

### Step 1: Check Rollout History

```bash
# View deployment history
kubectl rollout history deployment/ai-saas-web -n ai-saas-prod

# Example output:
# REVISION  CHANGE-CAUSE
# 1         Deploy v1.0.0-beta.1
# 2         Deploy v1.0.0-beta.2
# 3         Deploy v1.0.0-beta.3 (current - broken)

# Check details of previous revision
kubectl rollout history deployment/ai-saas-web -n ai-saas-prod --revision=2
```

### Step 2: Execute Rollback

```bash
# Rollback to previous revision
kubectl rollout undo deployment/ai-saas-web -n ai-saas-prod

# OR rollback to specific revision
kubectl rollout undo deployment/ai-saas-web -n ai-saas-prod --to-revision=2

# Watch rollback progress
kubectl rollout status deployment/ai-saas-web -n ai-saas-prod

# Expected output:
# Waiting for deployment "ai-saas-web" rollout to finish...
# deployment "ai-saas-web" successfully rolled out
```

### Step 3: Scale Down New Pods (If Issues Persist)

```bash
# Scale to zero to stop all traffic
kubectl scale deployment/ai-saas-web -n ai-saas-prod --replicas=0

# Wait for pods to terminate
kubectl get pods -n ai-saas-prod -w

# Scale back up with stable version
kubectl scale deployment/ai-saas-web -n ai-saas-prod --replicas=3
```

### Step 4: Verify Rollback

```bash
# Check pod status
kubectl get pods -n ai-saas-prod

# Check events
kubectl get events -n ai-saas-prod --sort-by='.lastTimestamp' | tail -20

# Check application logs
kubectl logs -n ai-saas-prod deployment/ai-saas-web --tail=100

# Verify service
kubectl get svc -n ai-saas-prod
curl -f https://your-app.com/api/health
```

### Step 5: Update HPA (If Modified)

```bash
# Check if HPA was changed
kubectl get hpa -n ai-saas-prod

# Restore previous HPA configuration if needed
kubectl apply -f k8s/hpa.yaml
```

**Expected Time**: 2-4 minutes (Kubernetes rolling update is fast)

---

## Database Rollback Procedures

### Scenario 1: Migration Failed Partially

```bash
# 1. Check migration status
npx prisma migrate status

# 2. Reset to clean state (DESTRUCTIVE - use backup)
docker compose exec -T db psql -U postgres -c "DROP DATABASE ai_saas;"
docker compose exec -T db psql -U postgres -c "CREATE DATABASE ai_saas;"

# 3. Restore from backup
docker compose exec -T db psql -U postgres ai_saas < pre-migration-backup.sql

# 4. Verify data
docker compose exec db psql -U postgres ai_saas -c "SELECT COUNT(*) FROM \"User\";"
```

### Scenario 2: Migration Succeeded But Application Broken

```bash
# 1. Keep database as-is
# 2. Rollback application code to previous version
# 3. Run reverse migration (if available)

# Check if Prisma has down migrations
npx prisma migrate resolve --rolled-back <migration-name>

# OR manually revert schema changes
docker compose exec -T db psql -U postgres ai_saas < revert-migration.sql
```

### Scenario 3: Data Corruption Detected

```bash
# 1. IMMEDIATELY stop all write operations
docker compose stop web

# 2. Assess damage
docker compose exec db psql -U postgres ai_saas

# Run integrity checks
SELECT * FROM "User" WHERE email IS NULL;  -- Should be 0
SELECT * FROM "Conversation" WHERE userId IS NULL;  -- Should be 0

# 3. Restore from last known good backup
# Get latest backup
ls -lh /backups | grep ai_saas | tail -5

# Restore
gunzip < /backups/ai_saas_20251009.sql.gz | \
  docker compose exec -T db psql -U postgres ai_saas

# 4. Verify data integrity
# Run validation queries

# 5. Restart application
docker compose up -d web
```

---

## Post-Rollback Verification

After rollback, execute these checks:

### 1. Health Check

```bash
# API health
curl -f https://your-app.com/api/health

# Expected:
# {
#   "status": "ok",
#   "database": "connected",
#   "redis": "connected"
# }
```

### 2. Critical Flows

```bash
# Test auth flow
curl -X POST https://your-app.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Test chat flow
curl -X GET https://your-app.com/api/conversations \
  -H "Cookie: session=<token>"
```

### 3. Monitor Error Rate

```bash
# Check Sentry for new errors
# Check application logs
docker compose logs web --tail=500 | grep -i error

# Check metrics
curl https://your-app.com/api/metrics/system
```

### 4. Database Integrity

```bash
# Check record counts match pre-rollback snapshot
docker compose exec db psql -U postgres ai_saas -c "
  SELECT
    (SELECT COUNT(*) FROM \"User\") as users,
    (SELECT COUNT(*) FROM \"Conversation\") as conversations,
    (SELECT COUNT(*) FROM \"Message\") as messages;
"
```

### 5. User Verification

Ask 1-2 test users to:
- Sign in
- Send a chat message
- Check their conversation history

---

## Communication Templates

### Rollback Started

```
🚨 ROLLBACK IN PROGRESS

Time: [HH:MM UTC]
Reason: [Brief description]
Impact: [User-facing impact]
ETA: [Estimated completion time]
Status Page: [Link if available]

We're working to resolve this quickly.
```

### Rollback Completed

```
✅ ROLLBACK COMPLETED

Time: [HH:MM UTC]
Duration: [Total downtime]
Resolution: Rolled back to v[X.Y.Z]
Status: All services operational

We'll investigate the root cause and provide an update within 24 hours.

Apologies for the disruption.
```

---

## Preventing Future Rollbacks

After a rollback, conduct a post-mortem:

### 1. Root Cause Analysis

```markdown
## Incident Report - [Date]

**What Happened**: [Brief description]

**Timeline**:
- HH:MM - Deployment started
- HH:MM - First error detected
- HH:MM - Rollback initiated
- HH:MM - Service restored

**Root Cause**: [What actually caused the issue]

**Impact**:
- Downtime: X minutes
- Affected users: ~X
- Revenue impact: $X (if applicable)

**What Went Well**:
- Detection time: X minutes
- Rollback time: X minutes
- Communication: Clear/Unclear

**What Went Wrong**:
- [List failures in process]

**Action Items**:
1. [ ] Add test coverage for [X]
2. [ ] Improve monitoring for [Y]
3. [ ] Update deployment checklist
```

### 2. Improve Safety Measures

- **Add more tests**: Cover the failure scenario
- **Improve staging**: Ensure staging matches production
- **Canary deployments**: Deploy to 10% of users first
- **Better monitoring**: Add alerts for the failure condition
- **Automated rollback**: Trigger rollback on error rate spike

### 3. Update Procedures

```bash
# Add rollback test to deployment checklist
# Schedule quarterly rollback drills
# Document lessons learned
```

---

## Rollback Decision Tree

```
Is service degraded?
├─ NO → Continue monitoring
└─ YES → How severe?
    ├─ Warning (1 feature broken, <5% errors)
    │   ├─ Monitor for 10 minutes
    │   ├─ Can we hotfix quickly? (<30 min)
    │   │   ├─ YES → Deploy hotfix
    │   │   └─ NO → ROLLBACK
    │   └─ Getting worse? → ROLLBACK
    │
    └─ Critical (auth down, >5% errors, data loss)
        └─ ROLLBACK IMMEDIATELY
            ├─ Notify stakeholders
            ├─ Capture evidence
            ├─ Execute rollback procedure
            ├─ Verify restoration
            └─ Post-mortem within 24h
```

---

## Emergency Contacts

**During Rollback**, contact:

- **CTO**: [Contact info]
- **Lead Developer**: [Contact info]
- **DevOps**: [Contact info]
- **On-Call Engineer**: [PagerDuty/phone]

**Escalation Path**:
1. First 5 minutes: On-call engineer decides
2. After 5 minutes: Notify CTO
3. After 15 minutes: Full team escalation

---

## Rollback Checklist

Use this checklist during rollback:

```
[ ] 1. Incident detected and severity assessed
[ ] 2. Stakeholders notified (CTO, team, users if needed)
[ ] 3. Evidence captured (logs, screenshots, database dump)
[ ] 4. Rollback target version identified
[ ] 5. Rollback procedure executed:
    [ ] Application rolled back
    [ ] Database rolled back (if needed)
    [ ] Caches cleared (if needed)
[ ] 6. Post-rollback verification:
    [ ] Health checks passing
    [ ] Critical flows tested
    [ ] Error rate normalized
    [ ] Database integrity confirmed
[ ] 7. Monitoring resumed (watch for 30 minutes)
[ ] 8. Communication sent (rollback completed)
[ ] 9. Post-mortem scheduled (within 24h)
[ ] 10. Incident documentation updated
```

---

**Last Updated**: 2025-10-09

**Practice Rollback**: Schedule quarterly rollback drills in staging to ensure team familiarity with procedures.
