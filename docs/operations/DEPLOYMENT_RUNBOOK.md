# Deployment Runbook

Step-by-step procedures for deploying the AI SaaS platform to production.

**Version**: 1.0.0
**Updated**: 2025-11-14
**Target Audience**: DevOps/Operations Team

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Steps](#deployment-steps)
3. [Database Migrations](#database-migrations)
4. [Service Deployment](#service-deployment)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Rollback Procedures](#rollback-procedures)
7. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### 48 Hours Before Deployment

- [ ] Review all commits since last deployment
- [ ] Run security scan: `npm audit`
- [ ] Check for deprecated dependencies
- [ ] Review all open issues marked "deployment"
- [ ] Confirm backup schedule is running

### 24 Hours Before Deployment

- [ ] Notify team about planned deployment
- [ ] Ensure on-call engineer is available
- [ ] Verify all monitoring dashboards are working
- [ ] Test rollback procedures
- [ ] Review any recent database changes

### Before Starting Deployment

**Verify Current State**:
```bash
# Check current deployed version
kubectl get pods -n ai-saas -o wide

# Check service status
kubectl get services -n ai-saas

# Verify database connectivity
psql -h $DB_HOST -U $DB_USER -d ai_saas_prod -c "SELECT version();"

# Check Redis connectivity
redis-cli -h $REDIS_HOST PING

# Verify backups
aws s3 ls s3://ai-saas-backups/postgres/ | head -5
```

**Pre-Deployment Tests**:
```bash
# Run full test suite
npm run test

# Type checking
npm run type-check

# Lint check
npm run lint

# Build verification
npm run build

# Security check
npm audit --audit-level=moderate
```

---

## Deployment Steps

### Step 1: Create Release Tag

```bash
# Determine version (semantic versioning)
# Current: 1.0.0
# Next: 1.0.1 (patch), 1.1.0 (minor), 2.0.0 (major)

export VERSION=1.0.1

# Create annotated tag
git tag -a v${VERSION} -m "Release v${VERSION}"

# Push tag to repository
git push origin v${VERSION}

# Verify tag
git tag -l v${VERSION} -n
```

### Step 2: Build Docker Images

```bash
# Build all images
docker-compose -f docker-compose.production.yml build

# Tag images
docker tag ai-saas-auth-service:latest \
  $REGISTRY/ai-saas-auth-service:${VERSION}
docker tag ai-saas-chat-service:latest \
  $REGISTRY/ai-saas-chat-service:${VERSION}
docker tag ai-saas-billing-service:latest \
  $REGISTRY/ai-saas-billing-service:${VERSION}
docker tag ai-saas-analytics-service:latest \
  $REGISTRY/ai-saas-analytics-service:${VERSION}
docker tag ai-saas-api-gateway:latest \
  $REGISTRY/ai-saas-api-gateway:${VERSION}
docker tag ai-saas-frontend:latest \
  $REGISTRY/ai-saas-frontend:${VERSION}

# Push images
docker push $REGISTRY/ai-saas-auth-service:${VERSION}
docker push $REGISTRY/ai-saas-chat-service:${VERSION}
docker push $REGISTRY/ai-saas-billing-service:${VERSION}
docker push $REGISTRY/ai-saas-analytics-service:${VERSION}
docker push $REGISTRY/ai-saas-api-gateway:${VERSION}
docker push $REGISTRY/ai-saas-frontend:${VERSION}

# Verify images
docker pull $REGISTRY/ai-saas-auth-service:${VERSION}
```

### Step 3: Create Backup

```bash
# Database backup
pg_dump -h $DB_HOST -U $DB_USER ai_saas_prod > \
  /backups/ai_saas_prod_${VERSION}_$(date +%s).sql

# Compress backup
gzip /backups/ai_saas_prod_${VERSION}_*.sql

# Upload to S3
aws s3 cp /backups/ai_saas_prod_${VERSION}_*.sql.gz \
  s3://ai-saas-backups/postgres/

# Verify backup
aws s3 ls s3://ai-saas-backups/postgres/ | grep ${VERSION}

# Remove local backup
rm /backups/ai_saas_prod_${VERSION}_*.sql.gz
```

### Step 4: Update Kubernetes Deployment

```bash
# Prepare manifest
cat > deployment-update.yaml <<EOF
apiVersion: v1
kind: Patch
metadata:
  name: ai-saas-services
spec:
  - name: auth-service
    image: $REGISTRY/ai-saas-auth-service:${VERSION}
  - name: chat-service
    image: $REGISTRY/ai-saas-chat-service:${VERSION}
  - name: billing-service
    image: $REGISTRY/ai-saas-billing-service:${VERSION}
  - name: analytics-service
    image: $REGISTRY/ai-saas-analytics-service:${VERSION}
  - name: api-gateway
    image: $REGISTRY/ai-saas-api-gateway:${VERSION}
  - name: frontend
    image: $REGISTRY/ai-saas-frontend:${VERSION}
EOF

# Apply patch
kubectl apply -f deployment-update.yaml -n ai-saas

# Watch rollout
kubectl rollout status deployment/auth-service -n ai-saas
kubectl rollout status deployment/chat-service -n ai-saas
kubectl rollout status deployment/billing-service -n ai-saas
kubectl rollout status deployment/api-gateway -n ai-saas
```

---

## Database Migrations

### Pre-Migration Validation

```bash
# Check for pending migrations
npx prisma migrate status --preview-feature

# Validate migration files
npx prisma migrate resolve --rolled-back (if needed)

# Check current database state
psql -h $DB_HOST -U $DB_USER -d ai_saas_prod -c \
  "SELECT version FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"
```

### Execute Migrations

```bash
# Create migration (if new schema changes)
npx prisma migrate dev --name "add-new-feature"

# Deploy migration to production
npx prisma migrate deploy --environment PRODUCTION

# Verify migration success
npx prisma migrate status --preview-feature

# Check tables
psql -h $DB_HOST -U $DB_USER -d ai_saas_prod -c \
  "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"
```

### Rollback Migration (If Needed)

```bash
# ⚠️ DANGEROUS: Only if migration failed critically

# Get last migration name
psql -h $DB_HOST -U $DB_USER -d ai_saas_prod -c \
  "SELECT migration_name FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 1;"

# Rollback (if Prisma supports)
npx prisma migrate resolve --rolled-back migration_name

# Or manually revert if data loss acceptable:
psql -h $DB_HOST -U $DB_USER -d ai_saas_prod -c "
  DELETE FROM _prisma_migrations
  WHERE migration_name = 'migration_name';
"

# Restore from backup
psql -h $DB_HOST -U $DB_USER < backup_file.sql
```

---

## Service Deployment

### Blue-Green Deployment Strategy

This minimizes downtime by running two identical environments.

```bash
# Start "green" environment
kubectl apply -f k8s/deployments/green/

# Wait for green to be ready
kubectl wait --for=condition=Ready pod \
  -l version=green -n ai-saas --timeout=300s

# Run smoke tests on green
npm run smoke:green

# Switch traffic to green
kubectl patch service api-gateway -n ai-saas \
  -p '{"spec":{"selector":{"version":"green"}}}'

# Monitor green environment
kubectl logs -f deployment/api-gateway -n ai-saas -l version=green

# If successful, delete blue environment
kubectl delete deployment api-gateway-blue -n ai-saas
```

### Canary Deployment Strategy

Gradually roll out to percentage of traffic.

```bash
# Deploy new version (canary) alongside current (stable)
kubectl apply -f k8s/deployments/canary/

# Wait for canary pods ready
kubectl wait --for=condition=Ready pod \
  -l version=canary -n ai-saas --timeout=300s

# Start with 5% traffic to canary
kubectl patch virtualservice api-gateway -n ai-saas \
  --type merge -p '{"spec":{"hosts":[{"name":"api.yourdomain.com","http":[{"match":[{"uri":{"prefix":"/"}}],"route":[{"destination":{"host":"api-gateway","subset":"stable"},"weight":95},{"destination":{"host":"api-gateway","subset":"canary"},"weight":5}]}]}]}'

# Monitor metrics for 5 minutes
sleep 300
kubectl logs deployment/api-gateway -n ai-saas -l version=canary

# Gradually increase to 25%, 50%, 100%
for weight in 25 50 100; do
  kubectl patch virtualservice api-gateway -n ai-saas \
    --type merge -p "{\"spec\":{\"hosts\":[{\"name\":\"api.yourdomain.com\",\"http\":[{\"match\":[{\"uri\":{\"prefix\":\"/\"}}],\"route\":[{\"destination\":{\"host\":\"api-gateway\",\"subset\":\"stable\"},\"weight\":$((100-weight))},{\"destination\":{\"host\":\"api-gateway\",\"subset\":\"canary\"},\"weight\":${weight}}]}]}]}}"
  sleep 300
done

# Delete stable version
kubectl delete deployment api-gateway-stable -n ai-saas
```

---

## Post-Deployment Verification

### Step 1: Service Health Checks

```bash
# Check all pods are running
kubectl get pods -n ai-saas -o wide

# Check all services are ready
kubectl get services -n ai-saas

# Check for pod restart loops
kubectl get pods -n ai-saas --sort-by=.status.containerStatuses[0].restartCount

# View pod logs for errors
kubectl logs -n ai-saas deployment/api-gateway | grep -i error
kubectl logs -n ai-saas deployment/auth-service | grep -i error
```

### Step 2: API Verification

```bash
# Test API Gateway health endpoint
curl -i https://api.yourdomain.com/health

# Expected response:
# HTTP/2 200 OK
# {"status":"ok"}

# Test authentication endpoint
curl -X POST https://api.yourdomain.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"..."}' \
  | jq .

# Test chat endpoint
TOKEN=$(curl -X POST https://api.yourdomain.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"..."}' \
  | jq -r .data.token)

curl https://api.yourdomain.com/api/chat/conversations \
  -H "Authorization: Bearer $TOKEN" \
  | jq .
```

### Step 3: Smoke Tests

```bash
# Run automated smoke tests
npm run test:smoke

# Expected output:
# ✓ Auth service responding
# ✓ Chat service responding
# ✓ Billing service responding
# ✓ Analytics service responding
# ✓ Database connectivity
# ✓ Redis connectivity
# ✓ API responding correctly
```

### Step 4: Monitoring & Alerts

```bash
# Check Prometheus metrics
curl http://prometheus:9090/api/v1/query?query=http_requests_total

# View Grafana dashboards
# https://grafana.yourdomain.com/dashboards

# Check error rates
# Should be < 1% (99.5% uptime)

# Check latency
# P95 < 500ms, P99 < 1000ms

# Check database connections
# Should be stable, not increasing

# Check Redis memory
# Should be < 80% of max
```

### Step 5: Business Logic Verification

```bash
# Test user signup
curl -X POST https://api.yourdomain.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email":"testuser-'$(date +%s)'@example.com",
    "password":"TestPass123!"
  }'

# Test chat message
# Use UI to send message and verify AI response

# Test billing
# Verify subscription operations work

# Check analytics
# Verify event data is flowing
```

---

## Rollback Procedures

### Automatic Rollback (If Health Checks Fail)

Kubernetes automatically rolls back if new pods fail health checks.

```bash
# Monitor rollback
kubectl rollout history deployment/api-gateway -n ai-saas

# Watch status
kubectl rollout status deployment/api-gateway -n ai-saas --watch
```

### Manual Rollback

```bash
# Get previous version
kubectl rollout history deployment/api-gateway -n ai-saas

# Rollback to previous revision
kubectl rollout undo deployment/api-gateway -n ai-saas

# Rollback to specific revision
kubectl rollout undo deployment/api-gateway -n ai-saas --to-revision=2

# Monitor rollback
kubectl rollout status deployment/api-gateway -n ai-saas --watch

# Verify services are responding
curl https://api.yourdomain.com/health
```

### Database Rollback

```bash
# If migrations need to be rolled back

# Get backup file
aws s3 ls s3://ai-saas-backups/postgres/ | head -10

# Download backup
aws s3 cp s3://ai-saas-backups/postgres/backup.sql.gz /tmp/

# Decompress
gunzip /tmp/backup.sql.gz

# Restore (warning: this will overwrite current database)
psql -h $DB_HOST -U $DB_USER ai_saas_prod < /tmp/backup.sql

# Verify data
psql -h $DB_HOST -U $DB_USER -d ai_saas_prod -c \
  "SELECT COUNT(*) FROM users;"
```

---

## Troubleshooting

### Service Not Starting

```bash
# Check pod events
kubectl describe pod POD_NAME -n ai-saas

# Check logs
kubectl logs POD_NAME -n ai-saas --previous

# Check resource limits
kubectl describe node

# Check image pull
kubectl get events -n ai-saas | grep -i pull
```

### Database Connection Issues

```bash
# Test connectivity
psql -h $DB_HOST -U $DB_USER -d ai_saas_prod -c "SELECT 1;"

# Check connection pool
psql -h $DB_HOST -U $DB_USER -d ai_saas_prod -c \
  "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"

# Increase connection limit if needed
```

### Memory Issues

```bash
# Check pod memory usage
kubectl top pods -n ai-saas

# If out of memory:
# 1. Increase memory limits
# 2. Restart pod to clear memory
# 3. Monitor for memory leaks
kubectl set resources deployment api-gateway \
  -n ai-saas \
  --limits=memory=2Gi
```

### High Latency

```bash
# Check metrics
kubectl top nodes
kubectl top pods -n ai-saas

# Check database slow queries
# In Prometheus: rate(mysql_slow_queries[5m])

# Check network latency
kubectl exec -it POD_NAME -n ai-saas -- ping SERVICE_NAME

# Scale up if needed
kubectl scale deployment api-gateway --replicas=5 -n ai-saas
```

---

## Post-Deployment Documentation

### Create Deployment Summary

```markdown
# Deployment Summary - v1.0.1

**Date**: 2025-11-15
**Deployed By**: DevOps Team
**Status**: ✓ Successful

## Changes Deployed
- Fixed auth token validation
- Added response caching
- Updated dependencies

## Database Migrations
- Added email_verified_at index
- No data migrations

## Deployment Time
- Build: 5 minutes
- Deploy: 10 minutes
- Total: 15 minutes

## Issues Encountered
None

## Rollback Status
Ready (previous version v1.0.0 available)

## Monitoring
- Error rate: 0.2%
- P95 latency: 250ms
- Active connections: 150
```

### Update Change Log

```bash
# Update CHANGELOG.md with deployment details
git add CHANGELOG.md
git commit -m "chore: update changelog for v${VERSION}"
git push origin main
```

---

## On-Call Runbook

### Deployment Failed

1. **Identify Issue**
   ```bash
   kubectl describe pod FAILED_POD -n ai-saas
   kubectl logs FAILED_POD -n ai-saas
   ```

2. **Decide Action**
   - If fixable: Fix and redeploy
   - Otherwise: Rollback

3. **If Rollback**
   ```bash
   kubectl rollout undo deployment/SERVICE_NAME -n ai-saas
   ```

4. **Notify Team**
   - Post in #incidents Slack channel
   - Include what went wrong
   - Include when service restored

### User Reports Error

1. Check error rates
2. Check recent deployments
3. If related to deployment: Rollback
4. Otherwise: Investigate logs

### Performance Degradation

1. Check metrics (Grafana)
2. Check scaling status
3. Scale up if needed
4. Check for queries/operations causing issue
5. Optimize or temporarily restrict if needed

---

## References

- **Kubernetes Docs**: https://kubernetes.io/docs/
- **Helm Charts**: https://helm.sh/docs/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Monitoring Docs**: See `docs/operations/MONITORING_PLAYBOOK.md`
- **Incident Response**: See `docs/operations/INCIDENT_RESPONSE.md`
