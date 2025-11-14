# Hotfix Pipeline - Emergency Response Protocol

**Target Response Time**: 2 hours from bug report to production deployment

Complete guide for handling critical production issues during Beta and beyond.

---

## 🚨 When to Use Hotfix Pipeline

### Hotfix Triggers (P0 - Critical)

Use this pipeline **ONLY** for:

1. **Authentication Broken**
   - Users cannot sign in
   - Session verification failing globally
   - Password reset not working

2. **Data Loss Risk**
   - Conversations being deleted unintentionally
   - Messages not saving
   - Export losing data

3. **Payment Issues**
   - Users charged but tier not upgraded
   - Duplicate charges occurring
   - Webhook failures causing data inconsistency

4. **Security Vulnerability**
   - Authentication bypass discovered
   - Data exposure (PII leak)
   - SQL injection confirmed
   - XSS vulnerability actively exploited

5. **Complete Service Outage**
   - API returning 500 for all requests
   - Database connection lost
   - Chat functionality completely down

### NOT Hotfix (Use Normal Process)

❌ Feature requests
❌ Performance optimization
❌ UI improvements
❌ Non-critical bugs
❌ Minor error messages

For non-critical issues, use regular development workflow.

---

## ⏱️ 2-Hour Response Timeline

### Hour 0-0:15 (15 minutes) - Detection & Triage

**0:00 - Alert Received**
- Bug report arrives via email/Discord/monitoring
- On-call engineer notified

**0:05 - Initial Assessment**
- Confirm issue is P0
- Identify affected users (all users vs specific tier)
- Check error rate in Sentry
- Review recent deployments

**0:10 - Decision: Hotfix or Rollback**
- **Rollback** if: Root cause unknown, affecting >50% users, multiple systems failing
- **Hotfix** if: Root cause identified, isolated issue, can fix quickly

**0:15 - Stakeholder Notification**
- Notify CTO/team in Slack/Discord
- Post status update (if public-facing)

---

### Hour 0:15-1:00 (45 minutes) - Development & Testing

**0:15 - Create Hotfix Branch**
```bash
# Get current production commit
git fetch origin main
PROD_COMMIT=$(git rev-parse origin/main)

# Create hotfix branch from production
git checkout -b hotfix/auth-signin-fix-$(date +%Y%m%d) $PROD_COMMIT

# Or if using git-flow
git flow hotfix start auth-signin-fix
```

**0:20 - Reproduce Bug Locally**
```bash
# Pull production database backup (if needed)
# Set production environment variables

# Reproduce the exact error
npm run dev

# Verify you can reproduce the bug
```

**0:25 - Implement Fix**
- Make minimal changes
- Only fix the critical issue
- NO refactoring
- NO additional features
- NO "while we're at it" changes

**0:40 - Write Test**
```typescript
// Add test that would have caught this bug
describe('Hotfix: Auth signin', () => {
  it('should handle missing session cookie', async () => {
    // Test case here
  })
})
```

**0:45 - Test Locally**
```bash
# Run type check
npm run type-check

# Run tests
npm test

# Test manually in browser
npm run dev

# Verify the fix works
# Verify no new bugs introduced
```

**0:55 - Code Review (Fast Track)**
- Push branch to GitHub
- Create pull request with `[HOTFIX]` prefix
- Tag reviewer (CTO or senior dev)
- Explain what broke, how fix works
- Include before/after screenshots

**1:00 - Approval**
- Reviewer approves (or suggests quick changes)
- If changes needed, implement immediately

---

### Hour 1:00-1:45 (45 minutes) - Deployment

**1:00 - Merge to Main**
```bash
# Merge hotfix branch
git checkout main
git merge hotfix/auth-signin-fix-$(date +%Y%m%d) --no-ff

# Tag the hotfix
git tag -a hotfix-v1.0.0-beta.1 -m "Hotfix: Fix auth signin issue"

# Push to remote
git push origin main
git push origin hotfix-v1.0.0-beta.1
```

**1:05 - Build**
```bash
# If CI/CD
# GitHub Actions will auto-build and deploy

# If manual deployment
npm run build:prod

# Verify build succeeded
echo "Build status: $?"
```

**1:15 - Database Migration (if needed)**
```bash
# ONLY if hotfix includes database changes

# 1. Backup current database
pg_dump $DATABASE_URL > hotfix-pre-migration-$(date +%s).sql

# 2. Run migration
npm run db:migrate:prod

# 3. Verify migration
npx prisma db push --accept-data-loss --skip-generate
```

**1:20 - Deploy to Production**

**Option A: Docker Compose**
```bash
ssh user@production-server

cd /opt/ai-saas-app

# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml build web
docker compose -f docker-compose.prod.yml up -d web

# Verify deployment
docker compose ps
docker compose logs -f web --tail=50
```

**Option B: Kubernetes**
```bash
# Build and push Docker image
docker build -t your-registry/ai-saas-web:hotfix-v1.0.0-beta.1 .
docker push your-registry/ai-saas-web:hotfix-v1.0.0-beta.1

# Update deployment
kubectl set image deployment/ai-saas-web \
  web=your-registry/ai-saas-web:hotfix-v1.0.0-beta.1 \
  -n ai-saas-prod

# Watch rollout
kubectl rollout status deployment/ai-saas-web -n ai-saas-prod

# Verify pods
kubectl get pods -n ai-saas-prod
```

**Option C: CI/CD (GitHub Actions)**
```bash
# Push triggers auto-deployment
git push origin main

# Monitor GitHub Actions
# https://github.com/your-org/ai-saas-platform/actions

# Wait for deployment to complete
```

**1:35 - Verify Deployment**
```bash
# Run post-deploy verification
npm run verify:production

# Check specific endpoint that was broken
curl -f https://your-app.com/api/auth/signin \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Check health
curl https://your-app.com/api/health

# Check Sentry for new errors
# https://sentry.io/organizations/your-org/issues/
```

**1:40 - Smoke Test Critical Paths**
- Manually test the fixed functionality
- Test 2-3 related workflows
- Verify no new errors in Sentry

---

### Hour 1:45-2:00 (15 minutes) - Communication & Monitoring

**1:45 - Announce Fix Deployed**

**Template**:
```
✅ HOTFIX DEPLOYED

Issue: [Brief description]
Fix: [What was fixed]
Deploy Time: [HH:MM UTC]
Affected: [Who was affected]
Status: Monitoring closely

Thank you for your patience.
```

Post to:
- Slack/Discord `#incidents`
- Email affected users (if applicable)
- Status page (if public)

**1:50 - Update Bug Report**
- Mark original bug report as "Fixed in hotfix-v1.0.0-beta.1"
- Link to PR and commit
- Document root cause
- Add "Deployed to production" comment

**1:55 - Monitor for 5 Minutes**
- Watch Sentry for new errors
- Check metrics dashboard
- Monitor logs for anomalies

**2:00 - Timeline Complete**
- Hotfix deployed within 2 hours ✅
- Continue monitoring for next 2 hours
- Schedule post-mortem for next day

---

## 🔍 Hotfix Checklist

Print this and keep it at your desk!

```
⏰ HOUR 0-0:15: DETECTION & TRIAGE
[ ] Alert received and acknowledged
[ ] Issue severity confirmed (P0)
[ ] Affected users identified
[ ] Decision: Hotfix or Rollback
[ ] Team notified
[ ] Status update posted

⏰ HOUR 0:15-1:00: DEVELOPMENT & TESTING
[ ] Hotfix branch created from main
[ ] Bug reproduced locally
[ ] Fix implemented (minimal changes only)
[ ] Test written for regression prevention
[ ] Local testing complete
[ ] Type check passing
[ ] PR created with [HOTFIX] prefix
[ ] Code review completed
[ ] PR approved and merged

⏰ HOUR 1:00-1:45: DEPLOYMENT
[ ] Merged to main branch
[ ] Hotfix tag created
[ ] Build completed successfully
[ ] Database backup taken (if migration needed)
[ ] Database migration run (if needed)
[ ] Deployed to production
[ ] Deployment verified (pods running, containers healthy)
[ ] Post-deploy verification passed
[ ] Smoke tests completed
[ ] No new errors in Sentry

⏰ HOUR 1:45-2:00: COMMUNICATION & MONITORING
[ ] Fix deployed announcement posted
[ ] Bug report updated
[ ] Affected users notified
[ ] Monitoring active (next 2 hours)
[ ] Post-mortem scheduled
```

---

## 🛠️ Hotfix Development Guidelines

### DO

✅ **Minimal changes**: Only fix the critical issue
✅ **Test thoroughly**: Test the fix AND related functionality
✅ **Add regression test**: Prevent this bug from returning
✅ **Document**: Clear commit message, PR description
✅ **Fast code review**: Get approval quickly but don't skip review
✅ **Backup first**: Always backup database before migration

### DON'T

❌ **Refactor**: Don't clean up code during hotfix
❌ **Add features**: No "while we're at it" additions
❌ **Skip tests**: Always test locally before deploying
❌ **Deploy without review**: Even hotfixes need approval
❌ **Panic**: Follow the process calmly
❌ **Skip rollback option**: Know how to rollback if hotfix fails

---

## 📝 Hotfix PR Template

```markdown
## [HOTFIX] Title

### Critical Issue

**Severity**: P0
**Affected Users**: [All users / FREE tier / PREMIUM tier / specific users]
**Impact**: [What's broken]
**Error Rate**: [X% of requests failing]

### Root Cause

[What caused the bug]

Example:
> Session cookie was not being set due to missing SameSite
> attribute in production environment, causing all auth requests
> to fail after today's browser update.

### Fix

[What this PR changes]

Example:
> Added SameSite=Lax attribute to session cookie configuration
> in src/lib/auth/session.ts line 45.

### Testing

- [x] Reproduced bug locally
- [x] Verified fix resolves issue
- [x] Added regression test
- [x] Tested related auth flows (signin, signout, refresh)
- [x] Type check passing
- [x] Build passing

### Before/After

**Before**:
- Signin fails with "Session not set" error
- Users cannot authenticate

**After**:
- Signin works correctly
- Session cookie set properly

### Rollback Plan

If this hotfix causes issues:
1. Revert commit [SHA]
2. Redeploy previous version
3. No database changes, so no data migration needed

### Checklist

- [x] Minimal changes (only fix, no refactoring)
- [x] Tested locally
- [x] Regression test added
- [x] Documentation updated (if needed)
- [x] Ready for immediate deployment

### Deployment Notes

- No database migration required
- No config changes required
- Safe to deploy immediately

---

**Deploy ASAP** - Blocking all users
```

---

## 🔙 Hotfix Rollback Procedure

If hotfix makes things worse:

### Quick Rollback

```bash
# Get previous commit before hotfix
PREVIOUS_COMMIT=$(git rev-parse HEAD~1)

# Create revert branch
git checkout -b revert-hotfix-$(date +%Y%m%d) main

# Revert the hotfix
git revert HEAD

# Push and deploy
git push origin revert-hotfix-$(date +%Y%m%d)

# Follow deployment process
```

### Full Rollback (Emergency)

See `docs/ROLLBACK.md` for complete rollback procedures.

---

## 📊 Post-Hotfix Actions

### Immediately After (Same Day)

1. **Monitor for 2 hours**
   - Watch error rates
   - Check user reports
   - Review metrics

2. **Update documentation**
   - Mark bug as fixed
   - Document in CHANGELOG
   - Update any affected docs

3. **Notify stakeholders**
   - Send "all clear" message
   - Update status page

### Next Day

1. **Post-Mortem Meeting** (30 minutes)
   - What happened?
   - Why did it happen?
   - How did we respond?
   - What can we improve?

2. **Write Post-Mortem Doc**
   - Use template below

3. **Create Prevention Tickets**
   - Add tests
   - Improve monitoring
   - Update processes

---

## 📄 Post-Mortem Template

```markdown
# Post-Mortem: [Issue Title]

**Date**: [YYYY-MM-DD]
**Severity**: P0
**Duration**: [X hours]
**Affected**: [X users / X% of users]

## Summary

[2-3 sentence summary of what happened]

## Timeline

- **HH:MM** - Issue detected
- **HH:MM** - Team notified
- **HH:MM** - Root cause identified
- **HH:MM** - Fix deployed
- **HH:MM** - Verified resolved

**Total Time to Fix**: X hours Y minutes

## Root Cause

[Technical explanation of what caused the issue]

## Impact

- Users affected: X
- Error rate: X%
- Duration: X hours
- Revenue impact: $X (if applicable)
- Data loss: Yes/No

## What Went Well

- [Things that worked during response]
- Example: "Hotfix pipeline allowed 2-hour resolution"
- Example: "Team responded quickly and communicated clearly"

## What Went Wrong

- [Things that could have been better]
- Example: "Monitoring didn't catch issue before users reported"
- Example: "Initial diagnosis took 30 minutes"

## Action Items

- [ ] [Specific improvement] - Owner: [Name] - Due: [Date]
- [ ] [Specific improvement] - Owner: [Name] - Due: [Date]

Example:
- [ ] Add integration test for session cookie configuration - Owner: Dev Team - Due: 2025-10-15
- [ ] Improve Sentry alert for auth failures - Owner: DevOps - Due: 2025-10-12

## Lessons Learned

[Key takeaways for next time]
```

---

## 🆘 Emergency Contacts

**On-Call Engineer**: [Phone] | [Email]
**CTO**: [Phone] | [Email]
**DevOps Lead**: [Phone] | [Email]

**Escalation**:
1. First 15 minutes: On-call engineer handles
2. After 30 minutes: Escalate to CTO
3. After 1 hour: Full team escalation

---

## 📞 Communication Templates

### Template 1: Incident Detected

```
🚨 P0 INCIDENT DETECTED

Issue: [Brief description]
Impact: [Who's affected]
Status: Investigating
ETA for fix: TBD (targeting 2 hours)

Updates will be posted every 30 minutes.
```

### Template 2: Fix In Progress

```
🔧 HOTFIX IN PROGRESS

Issue: [Brief description]
Root cause: [What went wrong]
Fix: [What we're doing]
ETA for deployment: [HH:MM UTC]

Current status: [Testing / Deploying / Verifying]
```

### Template 3: Fix Deployed

```
✅ FIX DEPLOYED

Issue: [Brief description]
Fix: [What was fixed]
Deploy time: [HH:MM UTC]
Status: Monitoring closely

Service is now operational. We'll continue monitoring
for the next 2 hours.

Thank you for your patience.
```

---

**Last Updated**: October 9, 2025
**Version**: 1.0

**Practice this pipeline quarterly to ensure team readiness.**
