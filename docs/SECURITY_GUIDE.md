# 🔐 Security Guide - AI SaaS Platform

Production-grade security implementation for the AI Chat SaaS platform.

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication & Authorization](#authentication--authorization)
- [CSRF Protection](#csrf-protection)
- [Rate Limiting](#rate-limiting)
- [Input Validation](#input-validation)
- [Security Headers](#security-headers)
- [Best Practices](#best-practices)
- [Security Checklist](#security-checklist)

---

## ✅ Overview

**Security Status**: Production-Ready ✅

This platform implements multiple layers of security:

1. **Authentication**: JWT-based session management
2. **CSRF Protection**: Double Submit Cookie pattern
3. **Rate Limiting**: Redis-based with tier-specific limits
4. **Input Validation**: Zod schema validation
5. **Security Headers**: Comprehensive HTTP security headers
6. **Middleware Protection**: Automatic route protection

---

## 🔑 Authentication & Authorization

### JWT Session Management

**Location**: `src/lib/auth/session.ts`

**Features**:
- ✅ Signed JWT tokens using `jose` library
- ✅ Secure httpOnly cookies
- ✅ 7-day expiration
- ✅ Automatic session refresh
- ✅ Role-based access (extensible)

**Configuration**:
```env
AUTH_SECRET=your-secret-key-min-32-characters  # Required
AUTH_COOKIE_NAME=session                        # Optional, default: 'session'
```

**Usage Example**:
```typescript
import { requireUserId, getSession, isAuthenticated } from '@/lib/auth/session'

// In API routes
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId() // Throws if not authenticated
    // ... your logic
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// Check authentication
const authenticated = await isAuthenticated()

// Get full session
const session = await getSession() // Returns SessionPayload | null
```

**Session Payload Structure**:
```typescript
interface SessionPayload {
  uid: string        // User ID
  email?: string     // User email
  role?: string      // User role (for future RBAC)
  iat: number        // Issued at
  exp: number        // Expires at
}
```

**Protected Routes** (Middleware):
- `/chat`
- `/dashboard`
- `/settings`

---

## 🛡️ CSRF Protection

**Location**: `src/lib/security/csrf.ts`

**Implementation**: Double Submit Cookie pattern with signed JWT tokens

**Features**:
- ✅ Automatic protection for state-changing operations (POST, PUT, DELETE, PATCH)
- ✅ JWT-signed tokens to prevent forgery
- ✅ 24-hour token expiry
- ✅ Exempt paths for webhooks and public endpoints

**How It Works**:
1. Client requests CSRF token: `GET /api/csrf`
2. Server generates signed JWT token
3. Token sent in both response body and httpOnly cookie
4. Client includes token in `X-CSRF-Token` header for protected requests
5. Server verifies cookie and header match

**Client Usage**:
```typescript
// 1. Get CSRF token
const response = await fetch('/api/csrf')
const { token } = await response.json()

// 2. Include in subsequent requests
const result = await fetch('/api/some-endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': token
  },
  body: JSON.stringify(data)
})
```

**Exempt Paths**:
- `/api/auth/signin`
- `/api/auth/signup`
- `/api/auth/verify-email`
- `/api/auth/reset`
- `/api/webhook/payos` (uses signature verification)
- `/api/health`

**Configuration**:
```typescript
// Add custom exempt paths
export const CSRF_EXEMPT_PATHS = [
  // ... existing paths
  '/api/your-public-endpoint'
]
```

---

## ⏱️ Rate Limiting

**Location**: `src/lib/rate-limit/`

**Implementation**: Redis Fixed Window with tier-based limits

**Features**:
- ✅ Redis-backed (persistent across restarts)
- ✅ Fallback to in-memory for development
- ✅ Per-user and per-IP limiting
- ✅ Tier-specific limits (FREE, PLUS, PRO)
- ✅ Automatic rate limit headers

**Configuration by Tier**:

| Tier | Requests/Min | Daily Messages | Burst Limit |
|------|-------------|----------------|-------------|
| FREE | 20          | 20 messages    | 25          |
| PLUS | 60          | Unlimited      | 80          |
| PRO  | 120         | Unlimited      | 150         |

**Usage Example**:
```typescript
import { RedisFixedWindow } from '@/lib/rate-limit/redisFixedWindow'
import { redis } from '@/lib/redis'

const rateLimiter = new RedisFixedWindow(redis)

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromSession()

  // Check rate limit
  const result = await rateLimiter.consume(`user:${userId}`, {
    limit: 60,        // 60 requests
    windowMs: 60000   // per minute
  })

  if (!result.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
          'Retry-After': Math.ceil(result.retryAfterMs / 1000).toString()
        }
      }
    )
  }

  // Continue with request...
}
```

**Automatic Implementation**:
Rate limiting is already applied in:
- `src/app/api/chat/send/route.ts` (chat endpoint)
- Custom limits per user tier

---

## ✅ Input Validation

**Location**: `src/middleware/validation.ts`

**Features**:
- ✅ Zod-based schema validation
- ✅ XSS prevention (sanitization)
- ✅ Common schemas for reuse
- ✅ Detailed error messages
- ✅ Request body and query validation

**Usage Example**:
```typescript
import { withValidation, commonSchemas } from '@/middleware/validation'
import { z } from 'zod'

// Define schema
const createUserSchema = z.object({
  email: commonSchemas.email,
  password: commonSchemas.strongPassword,
  name: commonSchemas.shortText
})

// Use in API route
export const POST = withValidation(
  createUserSchema,
  async (req, validated) => {
    // validated.email is guaranteed to be valid email
    // validated.password is guaranteed to be strong
    // All fields are sanitized

    const user = await createUser(validated)
    return NextResponse.json({ user })
  }
)
```

**Common Schemas**:
```typescript
import { commonSchemas } from '@/middleware/validation'

commonSchemas.email           // Valid email, lowercase, max 255
commonSchemas.password        // Min 6 chars (for compatibility)
commonSchemas.strongPassword  // Min 8, uppercase, lowercase, number
commonSchemas.id              // UUID/CUID
commonSchemas.text            // Max 10k chars, sanitized
commonSchemas.shortText       // Max 255 chars, sanitized
commonSchemas.url             // Valid URL, max 2048
commonSchemas.page            // Pagination page number
commonSchemas.pageSize        // Items per page (1-100)
commonSchemas.searchQuery     // Search query, sanitized
commonSchemas.positiveInt     // Positive integer
commonSchemas.boolean         // Boolean from string
```

**XSS Prevention**:
```typescript
import { sanitizeString } from '@/middleware/validation'

const clean = sanitizeString(userInput)
// Removes: <, >, javascript:, event handlers
```

**Request Size Limiting**:
```typescript
import { withSizeLimit } from '@/middleware/validation'

export async function POST(req: NextRequest) {
  return withSizeLimit(1024 * 1024)( // 1MB limit
    req,
    async () => {
      // Handle request
    }
  )
}
```

---

## 🔒 Security Headers

**Location**: `src/middleware/security-headers.ts`

**Features**:
- ✅ Content Security Policy (CSP)
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ Referrer-Policy
- ✅ Permissions-Policy
- ✅ Strict-Transport-Security (HTTPS)
- ✅ X-XSS-Protection

**Default Headers**:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), ...
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-XSS-Protection: 1; mode=block
```

**Usage in Middleware**:
```typescript
import { applySecurityHeaders } from '@/middleware/security-headers'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  return applySecurityHeaders(response)
}
```

**Custom Configuration**:
```typescript
import { withSecurityHeaders, apiSecurityConfig } from '@/middleware/security-headers'

export const GET = withSecurityHeaders(
  async (req) => {
    return NextResponse.json({ data: '...' })
  },
  apiSecurityConfig // Use API-specific headers
)
```

---

## 📝 Best Practices

### 1. **Authentication**
- ✅ Always use `requireUserId()` for protected routes
- ✅ Never expose JWT secrets
- ✅ Use httpOnly cookies for tokens
- ✅ Implement token refresh for long sessions
- ❌ Don't store sensitive data in JWT payload

### 2. **CSRF Protection**
- ✅ Always include CSRF token for state-changing operations
- ✅ Use `X-CSRF-Token` header
- ✅ Exempt only public endpoints
- ❌ Don't disable CSRF for convenience

### 3. **Rate Limiting**
- ✅ Apply rate limits to all public endpoints
- ✅ Use different limits per tier
- ✅ Log rate limit violations
- ✅ Include rate limit headers in responses
- ❌ Don't use overly restrictive limits for paying users

### 4. **Input Validation**
- ✅ Validate all user input
- ✅ Sanitize strings to prevent XSS
- ✅ Use Zod schemas for type safety
- ✅ Return detailed validation errors
- ❌ Don't trust client-side validation alone

### 5. **Security Headers**
- ✅ Use strict CSP in production
- ✅ Enable HSTS for HTTPS
- ✅ Deny iframe embedding
- ❌ Don't use `unsafe-inline` in production CSP

### 6. **Secrets Management**
- ✅ Use environment variables
- ✅ Never commit secrets to git
- ✅ Rotate secrets regularly
- ✅ Use strong secrets (min 32 chars)
- ❌ Don't hardcode secrets in code

---

## ✓ Security Checklist

### Pre-Production

- [ ] **Environment Variables Set**
  - [ ] `AUTH_SECRET` (min 32 characters)
  - [ ] `CSRF_SECRET` (optional, uses AUTH_SECRET)
  - [ ] API keys stored securely

- [ ] **HTTPS Enabled**
  - [ ] SSL/TLS certificate valid
  - [ ] HTTP redirects to HTTPS
  - [ ] HSTS header enabled

- [ ] **Authentication**
  - [ ] Session expiry configured
  - [ ] Protected routes secured
  - [ ] Password requirements enforced
  - [ ] Email verification working

- [ ] **CSRF Protection**
  - [ ] CSRF middleware enabled
  - [ ] Token endpoint accessible
  - [ ] Exempt paths reviewed
  - [ ] Client implementation tested

- [ ] **Rate Limiting**
  - [ ] Redis connection configured
  - [ ] Tier limits appropriate
  - [ ] Rate limit headers returned
  - [ ] Violation logging enabled

- [ ] **Input Validation**
  - [ ] All endpoints validate input
  - [ ] XSS sanitization applied
  - [ ] File upload limits set
  - [ ] SQL injection prevented (Prisma ORM)

- [ ] **Security Headers**
  - [ ] CSP configured for production
  - [ ] HSTS enabled
  - [ ] X-Frame-Options set
  - [ ] Permissions-Policy restrictive

- [ ] **Monitoring**
  - [ ] Sentry error tracking active
  - [ ] Security logs monitored
  - [ ] Failed auth attempts tracked
  - [ ] Rate limit violations alerted

### Ongoing Maintenance

- [ ] Review security logs weekly
- [ ] Rotate secrets monthly
- [ ] Update dependencies monthly
- [ ] Security audit quarterly
- [ ] Penetration testing annually

---

## 🚨 Incident Response

### If Security Breach Detected:

1. **Immediate Actions**:
   - Rotate all secrets immediately
   - Invalidate all sessions
   - Enable maintenance mode if needed
   - Notify users if PII compromised

2. **Investigation**:
   - Review Sentry errors
   - Check security logs
   - Identify attack vector
   - Assess damage scope

3. **Remediation**:
   - Patch vulnerability
   - Implement additional controls
   - Update security documentation
   - Conduct post-mortem

4. **Communication**:
   - Notify affected users
   - Document incident
   - Update security policies
   - Share learnings with team

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/authentication)

---

**Status**: Production-Ready ✅
**Last Updated**: January 2025
**Security Level**: High 🔐
