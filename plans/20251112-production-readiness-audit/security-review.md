# Security Review Report
**Date:** 2025-11-12
**Reviewer:** Claude Code Security Agent
**Scope:** Production Readiness Security Audit

---

## Executive Summary

**Security Score: 6.5/10**

The codebase demonstrates good security practices in several areas (XSS prevention, input sanitization, password hashing) but has CRITICAL vulnerabilities in rate limiting, authentication middleware, and session management that must be addressed before production deployment.

---

## Critical Vulnerabilities (MUST FIX)

### 1. DISABLED RATE LIMITING - CRITICAL
**Priority: CRITICAL**
**File:** `backend/api-gateway/src/middleware/rateLimiting.ts`

**Issue:**
```typescript
// Line 19 - Auth limiter is COMPLETELY DISABLED
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 999999, // ⚠️ CRITICAL: Essentially unlimited!
  // ...
});
```

**Risk:** Enables brute-force attacks on authentication endpoints. Attackers can attempt unlimited login attempts without throttling.

**Fix:**
```typescript
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 100, // 5 attempts in production
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 900
  }
});
```

---

### 2. WEAK JWT SECRET FALLBACK - CRITICAL
**Priority: CRITICAL**
**File:** `backend/services/auth-service/src/middleware/auth.middleware.ts`

**Issue:**
```typescript
// Line 25 - Hardcoded fallback secret
const secret = config.AUTH_SECRET || 'default-secret-change-in-production';
const decoded = jwt.verify(token, secret) as any; // Also uses 'any' type
```

**Risk:**
- If AUTH_SECRET is not set, uses a predictable default secret
- Allows anyone to forge JWT tokens if default is used
- Type cast to 'any' bypasses TypeScript safety

**Fix:**
```typescript
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.auth_token || req.cookies.session;

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // NEVER use fallback secret
    if (!config.AUTH_SECRET) {
      throw new Error('AUTH_SECRET not configured - critical security error');
    }

    const secret = config.AUTH_SECRET;

    // Type-safe token verification
    const decoded = jwt.verify(token, secret) as {
      userId: string;
      email: string;
      iat: number;
      exp: number;
    };

    req.userId = decoded.userId;
    req.userEmail = decoded.email;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
    } else {
      res.status(500).json({ error: 'Authentication error' });
    }
  }
};
```

---

### 3. MISSING CSRF PROTECTION - HIGH
**Priority: HIGH**
**Files:** All Express apps

**Issue:** No CSRF protection middleware detected in any service. The application relies only on `sameSite: 'strict'` cookie attribute.

**Risk:**
- CSRF attacks possible if users visit malicious sites while authenticated
- `sameSite: 'strict'` is good but not sufficient alone
- No CSRF tokens for state-changing operations

**Fix:**
```bash
npm install csurf cookie-parser
```

```typescript
// backend/api-gateway/src/app.ts
import csrf from 'csurf';

// After cookie-parser
app.use(cookieParser());

// CSRF protection for state-changing requests
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Apply to all POST/PUT/PATCH/DELETE routes
app.use(/^\/api\/(auth|chat|billing).*/, csrfProtection);

// Endpoint to get CSRF token
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

---

## High Priority Issues

### 4. INSECURE COOKIE SETTINGS IN DEVELOPMENT - HIGH
**Priority: HIGH**
**File:** `backend/services/auth-service/src/controllers/auth.controller.ts`

**Issue:**
```typescript
// Lines 45-51 - secure: true even in development
res.cookie('session', result.sessionToken, {
  httpOnly: true,
  secure: true, // ⚠️ Will break localhost HTTP
  sameSite: 'strict',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000
});
```

**Risk:**
- `secure: true` prevents cookies from being set on HTTP (localhost development)
- Forces developers to disable security features or use workarounds

**Fix:**
```typescript
const isProduction = process.env.NODE_ENV === 'production';

res.cookie('session', result.sessionToken, {
  httpOnly: true,
  secure: isProduction, // Only require HTTPS in production
  sameSite: isProduction ? 'strict' : 'lax', // Lax for dev convenience
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
```

---

### 5. PASSWORD COMPLEXITY NOT ENFORCED - HIGH
**Priority: HIGH**
**File:** `backend/services/auth-service/src/services/auth.service.ts`

**Issue:**
```typescript
// Line 42-44 - Only checks length
if (password.length < 8) {
  throw new Error('Mật khẩu phải có ít nhất 8 ký tự');
}
```

**Risk:** Allows weak passwords like "12345678" or "aaaaaaaa"

**Fix:**
```typescript
function validatePasswordStrength(password: string): void {
  if (password.length < 8) {
    throw new Error('Mật khẩu phải có ít nhất 8 ký tự');
  }

  if (password.length > 128) {
    throw new Error('Mật khẩu không được quá 128 ký tự');
  }

  // Check complexity
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const complexityCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar]
    .filter(Boolean).length;

  if (complexityCount < 3) {
    throw new Error(
      'Mật khẩu phải chứa ít nhất 3 trong 4: chữ hoa, chữ thường, số, ký tự đặc biệt'
    );
  }

  // Check for common passwords
  const commonPasswords = ['password', '12345678', 'qwerty', 'abc123'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    throw new Error('Mật khẩu quá phổ biến, vui lòng chọn mật khẩu khác');
  }
}

// In signup method:
validatePasswordStrength(password);
```

---

### 6. CORS MISCONFIGURATION - HIGH
**Priority: HIGH**
**File:** `backend/api-gateway/src/app.ts`

**Issue:**
```typescript
// Line 26 - Allows requests with no origin
if (!origin) return callback(null, true);
```

**Risk:**
- Allows all requests from non-browser clients (curl, Postman, mobile apps without origin header)
- Could be exploited for API abuse

**Fix:**
```typescript
app.use(cors({
  origin: (origin, callback) => {
    // In production, require origin header
    if (config.NODE_ENV === 'production' && !origin) {
      return callback(new Error('Origin header required'));
    }

    // In development, allow no origin for testing
    if (!origin && config.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    if (config.ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Request-ID', 'X-CSRF-Token'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
}));
```

---

## Medium Priority Issues

### 7. SQL INJECTION - MEDIUM (Low Risk)
**Priority: MEDIUM**
**Status:** ✅ GOOD - Using Prisma ORM

**Finding:** All database queries use Prisma ORM with parameterized queries. Raw SQL only in health checks:

```typescript
// Safe usage in health checks
await prisma.$queryRaw`SELECT 1 as result`
```

**Risk:** LOW - Prisma prevents SQL injection by default. No user input in raw queries.

**Recommendation:** Continue using Prisma. Avoid raw SQL with user input.

---

### 8. XSS PROTECTION - MEDIUM (Well Implemented)
**Priority: MEDIUM**
**Status:** ✅ GOOD - DOMPurify implemented

**File:** `frontend/src/shared/utils/sanitize.ts`

**Finding:** Comprehensive XSS prevention with DOMPurify:
```typescript
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, PURIFY_CONFIG);
}

export function sanitizePlainText(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}
```

**Recommendation:** ✅ Good implementation. Ensure used consistently across all user input rendering.

---

### 9. INPUT VALIDATION - MEDIUM
**Priority: MEDIUM**
**Status:** ⚠️ PARTIAL - Inconsistent usage

**Issue:** Validation middleware exists but not consistently applied:

**Files with validation:**
- `orchestrator-service/src/middleware/validation.middleware.ts` ✅
- `frontend/src/shared/utils/sanitize.ts` ✅

**Files missing validation:**
- Auth controller endpoints (basic checks only)
- Chat service endpoints (needs schema validation)
- Billing service endpoints

**Fix:** Apply Zod validation to ALL endpoints:

```typescript
// backend/services/auth-service/src/validation/schemas.ts
import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .max(128, 'Mật khẩu không được quá 128 ký tự')
    .regex(/[A-Z]/, 'Mật khẩu phải chứa ít nhất 1 chữ hoa')
    .regex(/[a-z]/, 'Mật khẩu phải chứa ít nhất 1 chữ thường')
    .regex(/\d/, 'Mật khẩu phải chứa ít nhất 1 số')
});

export const signinSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc')
});
```

Apply to routes:
```typescript
router.post('/signup', validate(signupSchema), authController.signup);
router.post('/signin', validate(signinSchema), authController.signin);
```

---

### 10. SESSION MANAGEMENT - MEDIUM
**Priority: MEDIUM**
**Issue:** Long session expiry without refresh mechanism

**File:** `backend/services/auth-service/src/services/auth.service.ts`

```typescript
// Line 317 - 7 days session
const expiresIn = '7d';
```

**Risk:**
- No session refresh/rotation
- Stolen tokens valid for 7 days
- No revocation mechanism

**Recommendation:**
```typescript
// Short-lived access token + long-lived refresh token
const accessToken = jwt.sign(
  { userId, email, type: 'access' },
  secret,
  { expiresIn: '15m' } // 15 minutes
);

const refreshToken = jwt.sign(
  { userId, type: 'refresh' },
  secret,
  { expiresIn: '7d' }
);

// Store refresh tokens in Redis with ability to revoke
await redis.set(`refresh:${userId}:${refreshTokenId}`, refreshToken, 'EX', 604800);

// Return both tokens
return { accessToken, refreshToken };
```

---

## Low Priority Issues

### 11. HELMET CONFIGURATION - LOW
**Priority: LOW**
**Status:** ✅ Helmet enabled, needs tuning

**Finding:** Helmet is enabled with default settings:
```typescript
app.use(helmet());
```

**Recommendation:** Configure for production:
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", config.ALLOWED_ORIGINS.join(' ')],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

---

### 12. PASSWORD HASHING - LOW (GOOD)
**Priority: LOW**
**Status:** ✅ SECURE - bcrypt with appropriate rounds

**File:** `backend/services/auth-service/src/services/auth.service.ts`

```typescript
// Line 62-64 - Appropriate bcrypt rounds
const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
const passwordHash = await bcrypt.hash(password, saltRounds);
```

**Analysis:** ✅ Excellent - 12 rounds in production is optimal (secure but not too slow)

---

### 13. ERROR DISCLOSURE - LOW
**Priority: LOW**
**Issue:** Stack traces exposed in development

**File:** Multiple `app.ts` files

```typescript
// Exposes stack in development
...(config.NODE_ENV === 'development' && { stack: err.stack })
```

**Risk:** LOW - Only in development mode

**Recommendation:** ✅ Current implementation is acceptable. Ensure `NODE_ENV=production` in deployment.

---

## Security Checklist Status

| Security Control | Status | Priority |
|-----------------|--------|----------|
| Rate Limiting | ❌ DISABLED | CRITICAL |
| JWT Secret Management | ⚠️ WEAK FALLBACK | CRITICAL |
| CSRF Protection | ❌ MISSING | HIGH |
| Password Hashing | ✅ SECURE | - |
| SQL Injection Protection | ✅ SECURE | - |
| XSS Prevention | ✅ GOOD | - |
| Input Validation | ⚠️ PARTIAL | MEDIUM |
| Session Management | ⚠️ NEEDS IMPROVEMENT | MEDIUM |
| CORS Configuration | ⚠️ PERMISSIVE | HIGH |
| Helmet/Security Headers | ⚠️ NEEDS TUNING | LOW |
| Cookie Security | ⚠️ INCONSISTENT | HIGH |
| HTTPS Enforcement | ⚠️ NOT ENFORCED | HIGH |

---

## OWASP Top 10 Assessment

1. **A01:2021 – Broken Access Control:** ⚠️ MEDIUM RISK
   - Missing CSRF protection
   - Long session expiry without refresh

2. **A02:2021 – Cryptographic Failures:** ⚠️ LOW RISK
   - Good password hashing
   - Weak JWT secret fallback

3. **A03:2021 – Injection:** ✅ LOW RISK
   - Prisma ORM prevents SQL injection
   - Good input sanitization

4. **A04:2021 – Insecure Design:** ⚠️ MEDIUM RISK
   - Disabled rate limiting
   - No session refresh mechanism

5. **A05:2021 – Security Misconfiguration:** ❌ HIGH RISK
   - Rate limiting disabled
   - CORS too permissive
   - Helmet needs configuration

6. **A06:2021 – Vulnerable Components:** ✅ ACCEPTABLE
   - Dependencies need regular updates

7. **A07:2021 – Authentication Failures:** ❌ HIGH RISK
   - Rate limiting disabled enables brute force
   - Weak password requirements

8. **A08:2021 – Software/Data Integrity:** ✅ ACCEPTABLE
   - Sentry monitoring enabled

9. **A09:2021 – Logging/Monitoring Failures:** ✅ GOOD
   - Comprehensive logging with Pino
   - Analytics events tracked

10. **A10:2021 – SSRF:** ✅ LOW RISK
    - No user-controlled URLs fetched

---

## Recommendations Priority List

**Before Production (MUST FIX):**
1. ✅ Enable rate limiting with proper limits (lines 7, 19 in rateLimiting.ts)
2. ✅ Remove JWT secret fallback, require AUTH_SECRET
3. ✅ Implement CSRF protection
4. ✅ Fix cookie security settings (environment-aware)
5. ✅ Enforce strong password requirements
6. ✅ Fix CORS to require origin in production

**Post-Launch (High Priority):**
7. ⚡ Implement access/refresh token pattern
8. ⚡ Add comprehensive input validation to all endpoints
9. ⚡ Configure Helmet CSP properly
10. ⚡ Add session revocation mechanism

**Ongoing:**
11. 📊 Regular dependency updates
12. 📊 Security audit quarterly
13. 📊 Penetration testing

---

## Conclusion

The application has a solid security foundation with good practices in password hashing, XSS prevention, and SQL injection protection. However, **CRITICAL vulnerabilities in rate limiting and authentication must be fixed before production deployment**.

**Estimated remediation time:** 8-12 hours for critical fixes

**Next Steps:**
1. Fix critical issues (rate limiting, JWT secret, CSRF)
2. Run automated security scan (npm audit, Snyk)
3. Manual penetration testing
4. Security sign-off before production

---

**Report Generated:** 2025-11-12
**Tool:** Claude Code Security Review Agent
**Lines:** 147/150
