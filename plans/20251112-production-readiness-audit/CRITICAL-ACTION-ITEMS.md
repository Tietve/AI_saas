# CRITICAL ACTION ITEMS - Production Readiness

**Date:** November 12, 2025
**Priority:** URGENT
**Status:** MUST FIX BEFORE LAUNCH

---

## CRITICAL BLOCKERS (Fix This Week) 🚨

### 1. TypeScript Compilation Errors (29 total)

#### Auth Service (21 errors)
**Issue:** Missing Prisma models `workspace` and `userPreferences`

**Files Affected:**
- `backend/services/auth-service/src/services/preferences.service.ts`
- `backend/services/auth-service/src/services/workspace.service.ts`

**Actions:**
```bash
# Option 1: Add models to Prisma schema
cd backend/services/auth-service
# Edit prisma/schema.prisma - add missing models

# Option 2: Remove unused code
# Delete or comment out workspace.service.ts and preferences.service.ts

# Then regenerate Prisma client
npx prisma generate
npx tsc --noEmit  # Verify no errors
```

#### Chat Service (2 errors)
**Issue:** Accessing `prisma.user` which doesn't exist in chat-service schema

**Files:**
- `backend/services/chat-service/src/services/chat.service.ts` (lines 96, 206)

**Actions:**
```typescript
// Remove direct user queries or use auth-service API
// Replace:
await prisma.user.findUnique(...)
// With:
await fetch(`${AUTH_SERVICE_URL}/users/${userId}`)
```

#### Orchestrator Service (6 errors)
**Issue:** Deprecated Sentry SDK usage, missing config fields

**Files:**
- `backend/services/orchestrator-service/src/services/sentry.service.ts`
- `backend/services/orchestrator-service/src/services/llm-judge.service.ts`

**Actions:**
```bash
cd backend/services/orchestrator-service
npm install @sentry/node@latest
# Update Sentry API usage (remove startTransaction, use withSpan)
# Add missing config fields to env.ts
```

---

### 2. Secrets Exposure in Git History 🔐

**CRITICAL SECURITY ISSUE**

**Exposed Credentials:**
- Database URL with production credentials
- OpenAI API key: `sk-proj-c1n_3i737Iky2Gl...`
- Google API key: `AIzaSyDWpg8JQ-LqKPdkkv4RjlP47Aj_nycZiag`
- SMTP password: `hiby vfhw vxkx hryz`
- Upstash Redis credentials
- AUTH_SECRET: `772b39ac897553e300a587ba5d21da7c`

**Immediate Actions (TODAY):**

1. **Remove from git history:**
```bash
# Backup first
git clone --mirror https://github.com/your-repo.git backup.git

# Use BFG Repo-Cleaner (recommended)
brew install bfg  # or download from rtyley.github.io/bfg-repo-cleaner
bfg --delete-files .env
bfg --replace-text passwords.txt  # List of secrets to redact
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

2. **Rotate ALL credentials immediately:**

```bash
# OpenAI - Go to platform.openai.com
# 1. Revoke key: sk-proj-c1n_3i737Iky2Gl...
# 2. Generate new key
# 3. Update in Azure Key Vault (not .env)

# Google API - Go to console.cloud.google.com
# 1. Delete key: AIzaSyDWpg8JQ-LqKPdkkv4RjlP47Aj_nycZiag
# 2. Create new restricted key
# 3. Update in Key Vault

# Generate new AUTH_SECRET
openssl rand -base64 48  # 64 chars minimum
# Update in Key Vault

# SMTP - Change Gmail app password
# Upstash - Regenerate Redis token
# Database - Rotate Neon DB password
```

3. **Configure Azure Key Vault:**
```bash
# Create Key Vault
az keyvault create --name mysaaschat-prod --resource-group prod-rg

# Add secrets
az keyvault secret set --vault-name mysaaschat-prod --name AUTH-SECRET --value "..."
az keyvault secret set --vault-name mysaaschat-prod --name OPENAI-API-KEY --value "..."
# ... repeat for all secrets

# Update Kubernetes deployments to use Key Vault
# Use Azure Key Vault CSI driver
```

---

### 3. Authentication Security Hardening 🔒

**Issue:** Default secret fallback allows token forgery

**File:** `backend/services/auth-service/src/middleware/auth.middleware.ts`

**Current Code (UNSAFE):**
```typescript
const secret = config.AUTH_SECRET || 'default-secret-change-in-production';
```

**Fix:**
```typescript
const secret = config.AUTH_SECRET;
if (!secret) {
  throw new Error('AUTH_SECRET environment variable is required');
}
```

**Additional Hardening:**
```typescript
// Add password complexity validation
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
if (!passwordRegex.test(password)) {
  throw new Error('Password must contain uppercase, lowercase, number, and special character');
}
```

---

### 4. Test Infrastructure Fixes 🧪

**Issue:** Integration tests failing, E2E tests not running

**Actions:**

```bash
# Fix auth-service integration tests
cd backend/services/auth-service
# Edit tests/integration/api.test.ts
# Mock metrics initialization or fix prom-client prefix

# Run E2E tests (supertest now installed)
cd backend/tests/e2e
npm test  # Should pass now
```

**Expected Result:** All tests green ✅

---

## HIGH PRIORITY (This Week) ⚠️

### 5. Input Validation with Zod

**Add to all services:**

```bash
cd backend/services/auth-service
npm install zod

# Create validation schemas
mkdir src/validation
```

```typescript
// src/validation/auth.schema.ts
import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
});

// Use in controller
const { email, password } = signupSchema.parse(req.body);
```

---

### 6. Fix ESLint Errors

**Critical Error:**
```bash
cd backend/services/auth-service
# Replace @ts-ignore with @ts-expect-error in src/config/swagger.ts
```

**Reduce warnings:**
```typescript
// Replace 'any' types with proper types
// Remove unused variables
npm run lint -- --fix  # Auto-fix where possible
```

---

### 7. Add XSS & CSRF Protection

**CSP Headers:**
```typescript
// In app.ts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],  // Adjust as needed
      styleSrc: ["'self'", "'unsafe-inline'"],
    }
  }
}));
```

**Input Sanitization:**
```bash
npm install express-validator
```

```typescript
import { body, validationResult } from 'express-validator';

app.post('/api/auth/signup',
  body('email').isEmail().normalizeEmail(),
  body('password').trim().escape(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ... rest of handler
  }
);
```

---

## VERIFICATION CHECKLIST

Before marking as complete, verify:

- [ ] `npx tsc --noEmit` passes in all services (0 errors)
- [ ] All credentials rotated and removed from git
- [ ] `npm test` passes in auth-service (2/2 integration tests)
- [ ] E2E tests run successfully (3/3 test suites)
- [ ] AUTH_SECRET fallback removed
- [ ] Password complexity validation added
- [ ] ESLint critical error fixed
- [ ] Zod schemas added to auth endpoints
- [ ] CSP headers configured
- [ ] Git history cleaned (no .env in history)

---

## TIMELINE

**Day 1 (Today):**
- Rotate all exposed credentials ✅
- Remove .env from git history ✅
- Fix AUTH_SECRET fallback ✅

**Day 2-3:**
- Fix all TypeScript errors (29 total) ✅
- Fix test failures ✅
- Add input validation (Zod) ✅

**Day 4-5:**
- Security hardening (CSP, sanitization) ✅
- Fix ESLint issues ✅
- Run full test suite ✅

**Day 6-7:**
- Performance testing ✅
- Staging deployment ✅
- Final verification ✅

**Week 2:**
- Beta launch with monitoring ✅
- Production rollout ✅

---

## CONTACT & ESCALATION

**Critical Issues:** Notify project lead immediately
**Security Issues:** Report to security team ASAP
**Blockers:** Document in GitHub issues

---

## SUCCESS CRITERIA

**Ready for Production When:**
1. Zero TypeScript errors ✅
2. All tests passing ✅
3. No secrets in git ✅
4. Security hardening complete ✅
5. Staging tests successful ✅

---

**Last Updated:** November 12, 2025
**Owner:** Development Team
**Review Date:** After critical fixes completed

---

**END OF ACTION ITEMS**
