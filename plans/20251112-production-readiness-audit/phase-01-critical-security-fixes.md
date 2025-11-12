# Phase 1: Critical Security Fixes

**Date:** 2025-11-12
**Priority:** 🔴 CRITICAL
**Status:** Pending
**Estimated Time:** 8 hours
**Blockers:** None

---

## Context & Links

### Research References
- [PRODUCTION_READINESS_RESEARCH.md](../../PRODUCTION_READINESS_RESEARCH.md) - Lines 51-106 (Security Best Practices)
- [Auth Service Rate Limit](../../backend/services/auth-service/src/middleware/rate-limit.ts) - Current implementation

### Related Files
- `backend/services/auth-service/src/middleware/rate-limit.ts` - Rate limiters defined but weak
- `backend/services/auth-service/src/routes/auth.routes.ts` - No validation middleware
- `backend/services/chat-service/src/routes/chat.routes.ts` - Missing rate limiting
- `backend/services/auth-service/src/app.ts` - Helmet configured but needs verification

---

## Overview

Current security posture has **3 critical vulnerabilities** that must be fixed before production launch:

1. **Rate Limiting Disabled:** Dev mode allows 10,000 req/15min (should be 100)
2. **No Input Validation:** Auth endpoints lack Joi/Zod validation middleware
3. **Chat Service Unprotected:** No rate limiting on AI chat endpoints

These issues expose the platform to:
- DDoS attacks (unlimited requests)
- SQL injection via unvalidated inputs
- API abuse (OpenAI quota exhaustion)
- Credential stuffing attacks

---

## Key Insights from Scout Reports

### Finding 1: Rate Limiter Effectively Disabled
**File:** `backend/services/auth-service/src/middleware/rate-limit.ts`

```typescript
max: process.env.NODE_ENV === 'production' ? 100 : 10000, // Very high limit for dev
```

**Issue:** Developers set 10,000 req/15min for "testing convenience", but this creates a security anti-pattern. Even dev environments should enforce realistic limits.

**Impact:** Attacker can brute-force 10,000 login attempts in 15 minutes.

---

### Finding 2: Input Validation Schemas Exist But Unused
**File:** `backend/services/orchestrator-service/src/validation/orchestrator.validation.ts`

Zod schemas are defined (✅) but routes don't apply them:

**File:** `backend/services/auth-service/src/routes/auth.routes.ts:61`
```typescript
router.post('/signup', signupRateLimiter, (req, res) => authController.signup(req, res));
```

**Missing:** Validation middleware between rate limiter and controller.

---

### Finding 3: Chat Service Has No Rate Limiting
**File:** `backend/services/chat-service/src/app.ts`

No rate limiter applied to chat routes. Each AI request costs $0.002-$0.03 (GPT-4o), making this a financial vulnerability.

**Impact:** Malicious user can exhaust OpenAI quota in minutes.

---

## Requirements

### Security Standards
- **Rate Limiting:** Express-rate-limit with Redis store (cross-instance sync)
- **Input Validation:** Joi or Zod validation middleware on ALL endpoints
- **SQL Injection:** Prisma ORM (✅ already using) + validated inputs
- **XSS Protection:** Helmet middleware (✅ already configured)
- **CORS:** Strict origin whitelist (verify current config)

### Compliance
- **OWASP Top 10 2023:** Address A01:2021 (Broken Access Control), A03:2021 (Injection)
- **PCI DSS:** If handling payments, rate limiting is required

---

## Implementation Steps

### 1. Fix Rate Limiter Configuration (2 hours)

**Action:** Remove NODE_ENV bypass, enforce production-like limits in all environments.

**Files to modify:**
- `backend/services/auth-service/src/middleware/rate-limit.ts`

**Changes:**
```typescript
// BEFORE (Lines 8, 31, 43)
max: process.env.NODE_ENV === 'production' ? 100 : 10000,

// AFTER
max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
```

**Environment variables to add (.env):**
```bash
# Development: More permissive but still safe
RATE_LIMIT_MAX=500

# Production: Strict
RATE_LIMIT_MAX=100
```

**Test:**
```bash
# Send 101 requests in 15 minutes
for i in {1..101}; do curl http://localhost:3001/api/auth/me; done
# Expect: 101st request returns 429 Too Many Requests
```

---

### 2. Add Input Validation Middleware (3 hours)

**Action:** Create validation middleware using Zod and apply to all routes.

**Step 2.1:** Create validation middleware
**File:** `backend/services/auth-service/src/middleware/validation.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
};
```

**Step 2.2:** Create validation schemas
**File:** `backend/services/auth-service/src/validation/auth.validation.ts`

```typescript
import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
  username: z.string().min(3).max(20).optional(),
});

export const signinSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter'),
});
```

**Step 2.3:** Apply validation to routes
**File:** `backend/services/auth-service/src/routes/auth.routes.ts`

```typescript
import { validate } from '../middleware/validation.middleware';
import { signupSchema, signinSchema, resetPasswordSchema } from '../validation/auth.validation';

// BEFORE
router.post('/signup', signupRateLimiter, (req, res) => authController.signup(req, res));

// AFTER
router.post('/signup', signupRateLimiter, validate(signupSchema), (req, res) =>
  authController.signup(req, res)
);
```

**Repeat for all auth routes:** signin, reset-password, forgot-password, verify-email

---

### 3. Add Chat Service Rate Limiting (2 hours)

**Action:** Create and apply rate limiters to chat endpoints.

**File:** `backend/services/chat-service/src/middleware/rate-limit.ts` (create new)

```typescript
import rateLimit from 'express-rate-limit';

// General chat API limiter
export const chatApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  message: 'Too many chat requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// AI message limiter (stricter due to cost)
export const aiMessageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 AI messages per minute per user
  message: 'Too many AI requests, please slow down',
  keyGenerator: (req) => req.user?.id || req.ip, // Per-user limiting
});
```

**File:** `backend/services/chat-service/src/app.ts`

```typescript
import { chatApiLimiter } from './middleware/rate-limit';

// Add after helmet, before routes
app.use('/api', chatApiLimiter);
```

**File:** `backend/services/chat-service/src/routes/chat.routes.ts`

```typescript
import { aiMessageLimiter } from '../middleware/rate-limit';

router.post('/chats/:chatId/messages',
  authMiddleware,
  aiMessageLimiter,  // Add this
  chatController.sendMessage
);
```

---

### 4. Verify Helmet Configuration (1 hour)

**Action:** Audit current helmet setup and enable all recommended headers.

**File:** `backend/services/auth-service/src/app.ts:47`

**Current:**
```typescript
app.use(helmet());
```

**Verify configuration meets best practices:**
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Adjust for your needs
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "same-site" },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));
```

**Test security headers:**
```bash
curl -I http://localhost:3001/health
# Should include:
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# X-Content-Type-Options: nosniff
# X-Frame-Options: SAMEORIGIN
```

---

## Todo List

- [ ] Fix rate limiter env bypass (auth-service) - 1 hour
- [ ] Create validation middleware helper - 30 min
- [ ] Create auth validation schemas - 1 hour
- [ ] Apply validation to all auth routes - 1 hour
- [ ] Create chat rate limiters - 1 hour
- [ ] Apply chat rate limiters - 30 min
- [ ] Enhance helmet configuration - 1 hour
- [ ] Write integration tests for rate limiting - 1 hour
- [ ] Write validation error tests - 1 hour

**Total: 8 hours**

---

## Success Criteria

### Functional Tests
- [ ] Rate limiting blocks 101st request in 15-minute window
- [ ] Validation rejects malformed email (test: "notanemail")
- [ ] Validation rejects weak password (test: "12345")
- [ ] Chat endpoint blocks 11th AI message in 1 minute
- [ ] Helmet adds all security headers (verify via curl)

### Security Audit
- [ ] `npm audit` shows 0 high/critical vulnerabilities
- [ ] OWASP ZAP scan passes (no SQL injection vulnerabilities)
- [ ] Rate limiting prevents brute force (test with tool like `vegeta`)

### Performance
- [ ] Rate limiter adds <5ms overhead (measure with Prometheus)
- [ ] Validation adds <10ms overhead
- [ ] No degradation in p95 response time (<200ms maintained)

---

## Risk Assessment

### Risks
1. **Breaking Changes:** Adding validation may reject currently working requests
   - **Mitigation:** Add validation in "warn" mode first, log errors, fix clients, then enforce
2. **Rate Limiter False Positives:** Shared IP (office/NAT) hits limits
   - **Mitigation:** Use user-based keys when authenticated, IP fallback for public endpoints
3. **Redis Dependency:** Rate limiting with Redis adds infrastructure dependency
   - **Mitigation:** Use memory store for MVP, upgrade to Redis for multi-instance deployments

### Rollback Plan
- Keep old routes without validation as `/api/v1-legacy` temporarily
- Feature flag: `ENABLE_STRICT_VALIDATION=false` to disable enforcement
- Monitor error rates for 48 hours after deployment

---

## Security Considerations

### Authentication Security
- **Password Requirements:** Enforced via Zod (8+ chars, mixed case, numbers)
- **Brute Force Protection:** Rate limiting + account lockout after N failed attempts
- **Token Security:** JWT signed with HS256 (verify secret rotation policy)

### Input Sanitization
- **XSS Prevention:** Helmet + input validation removes script tags
- **SQL Injection:** Prisma parameterized queries (already safe)
- **Path Traversal:** Validate file paths if handling uploads (future concern)

### API Security Headers
All services must return:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy`

**Verification:** Use [securityheaders.com](https://securityheaders.com) after deployment.

---

## Dependencies
- **Phase 2:** Logging replaces console.log with winston (ensures security events logged)
- **Phase 4:** Production deployment requires these fixes before going live

## Next Phase
[Phase 2: Logging & Monitoring](./phase-02-logging-monitoring.md) - Replace console.log, verify Sentry coverage
