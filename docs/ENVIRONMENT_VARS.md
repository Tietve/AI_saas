# Environment Variables Documentation

Complete reference for all environment variables used in the AI SaaS platform.

## Table of Contents

1. [Required Variables](#required-variables)
2. [Database Configuration](#database-configuration)
3. [Authentication & Security](#authentication--security)
4. [AI Provider Keys](#ai-provider-keys)
5. [Email Configuration](#email-configuration)
6. [Payment Integration](#payment-integration)
7. [Caching & Rate Limiting](#caching--rate-limiting)
8. [Monitoring & Analytics](#monitoring--analytics)
9. [CDN & Storage](#cdn--storage)
10. [Feature Flags](#feature-flags)
11. [Performance Tuning](#performance-tuning)
12. [Development Flags](#development-flags)

---

## Required Variables

These variables **MUST** be set for the application to function properly.

### `DATABASE_URL`
- **Type**: String (PostgreSQL connection string)
- **Required**: ✅ Yes
- **Scope**: Server-only
- **Example**: `postgresql://user:password@localhost:5432/ai_saas?schema=public&connection_limit=10`
- **Where to get**:
  - Local: PostgreSQL installation
  - Production: Managed database provider (Supabase, Neon, Railway, etc.)
- **Production settings**:
  ```
  postgresql://USER:PASSWORD@HOST:PORT/DATABASE?
    schema=public&
    connection_limit=10&
    pool_timeout=20&
    connect_timeout=10
  ```

### `AUTH_SECRET`
- **Type**: String (minimum 32 characters)
- **Required**: ✅ Yes
- **Scope**: Server-only
- **Example**: `a1b2c3d4e5f6...` (32+ random characters)
- **Where to get**: Generate with:
  ```bash
  openssl rand -base64 32
  # OR
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- **Security**: NEVER commit to version control. Rotate every 90 days in production.

### `NEXT_PUBLIC_APP_URL`
- **Type**: String (URL)
- **Required**: ✅ Yes
- **Scope**: Client + Server
- **Example**: `https://your-domain.com`
- **Where to get**: Your production domain
- **Note**: Must match your actual domain for CORS, redirects, and webhooks

---

## Database Configuration

### `DATABASE_URL`
See [Required Variables](#required-variables)

### `ENABLE_DATABASE_POOLING`
- **Type**: Boolean
- **Required**: ❌ No
- **Default**: `true`
- **Scope**: Server-only
- **Example**: `true`
- **Description**: Enable Prisma connection pooling for better performance

---

## Authentication & Security

### `AUTH_SECRET`
See [Required Variables](#required-variables)

### `AUTH_COOKIE_NAME`
- **Type**: String
- **Required**: ❌ No
- **Default**: `session`
- **Scope**: Server-only
- **Example**: `session`
- **Description**: Name of the httpOnly session cookie

### `CSRF_SECRET`
- **Type**: String (32+ characters)
- **Required**: ❌ No (falls back to AUTH_SECRET)
- **Scope**: Server-only
- **Example**: `<32+ random characters>`
- **Where to get**: Same as AUTH_SECRET generation
- **Description**: Secret for CSRF token signing

### `REQUIRE_EMAIL_VERIFICATION`
- **Type**: Boolean
- **Required**: ❌ No
- **Default**: `false`
- **Scope**: Server-only
- **Example**: `true`
- **Description**: Require users to verify email before accessing chat

---

## AI Provider Keys

At least **ONE** AI provider key is required for the platform to function.

### `OPENAI_API_KEY`
- **Type**: String
- **Required**: ⚠️ At least one provider required
- **Scope**: Server-only
- **Example**: `sk-proj-...`
- **Where to get**:
  1. Visit [OpenAI Platform](https://platform.openai.com/)
  2. Go to Settings → API Keys
  3. Click "Create new secret key"
- **Models enabled**: GPT-4o, GPT-4o-mini, GPT-4-turbo, GPT-3.5-turbo
- **Cost**: Pay-per-token (see [OpenAI Pricing](https://openai.com/pricing))

### `ANTHROPIC_API_KEY`
- **Type**: String
- **Required**: ⚠️ At least one provider required
- **Scope**: Server-only
- **Example**: `sk-ant-api03-...`
- **Where to get**:
  1. Visit [Anthropic Console](https://console.anthropic.com/)
  2. Go to Account → API Keys
  3. Create new key
- **Models enabled**: Claude 3 Opus, Claude 3.5 Sonnet, Claude 3 Haiku
- **Cost**: Pay-per-token (see [Anthropic Pricing](https://anthropic.com/pricing))

### `GOOGLE_API_KEY` (alias: `GEMINI_API_KEY`)
- **Type**: String
- **Required**: ⚠️ At least one provider required
- **Scope**: Server-only
- **Example**: `AIza...`
- **Where to get**:
  1. Visit [Google AI Studio](https://makersuite.google.com/)
  2. Click "Get API Key"
  3. Create key in new or existing project
- **Models enabled**: Gemini 1.5 Pro, Gemini 1.5 Flash
- **Cost**: Free tier available, then pay-per-token

### `GROQ_API_KEY`
- **Type**: String
- **Required**: ❌ No
- **Scope**: Server-only
- **Example**: `gsk_...`
- **Where to get**: [Groq Console](https://console.groq.com/keys)
- **Models enabled**: Llama 3, Mixtral, Gemma
- **Cost**: Free tier with rate limits

### `XAI_API_KEY`
- **Type**: String
- **Required**: ❌ No
- **Scope**: Server-only
- **Example**: `xai-...`
- **Where to get**: [X.AI API](https://x.ai/api)
- **Models enabled**: Grok
- **Cost**: Varies

---

## Email Configuration

Required for user verification, password reset, and notifications.

### `SMTP_HOST`
- **Type**: String
- **Required**: ✅ Yes (if `REQUIRE_EMAIL_VERIFICATION=true`)
- **Scope**: Server-only
- **Example**: `smtp.gmail.com`
- **Where to get**: Your email provider's SMTP settings
- **Common providers**:
  - Gmail: `smtp.gmail.com`
  - SendGrid: `smtp.sendgrid.net`
  - Mailgun: `smtp.mailgun.org`
  - AWS SES: `email-smtp.us-east-1.amazonaws.com`

### `SMTP_PORT`
- **Type**: Number
- **Required**: ✅ Yes (if SMTP enabled)
- **Scope**: Server-only
- **Example**: `587` (TLS) or `465` (SSL)
- **Common values**:
  - `587` - TLS (recommended)
  - `465` - SSL
  - `25` - Unencrypted (not recommended)

### `SMTP_SECURE`
- **Type**: Boolean
- **Required**: ❌ No
- **Default**: `false`
- **Scope**: Server-only
- **Example**: `true`
- **Description**: Use SSL/TLS encryption. Set `true` for port 465, `false` for 587

### `SMTP_USER`
- **Type**: String
- **Required**: ✅ Yes (if SMTP enabled)
- **Scope**: Server-only
- **Example**: `your-email@gmail.com`
- **Where to get**: Your email address

### `SMTP_PASS`
- **Type**: String
- **Required**: ✅ Yes (if SMTP enabled)
- **Scope**: Server-only
- **Example**: `your-app-password`
- **Where to get**:
  - Gmail: [App Passwords](https://myaccount.google.com/apppasswords)
  - SendGrid/Mailgun: API key from dashboard
- **Security**: Use app-specific passwords, not your main email password

### `SMTP_FROM`
- **Type**: String (email format)
- **Required**: ✅ Yes (if SMTP enabled)
- **Scope**: Server-only
- **Example**: `AI SaaS <no-reply@yourdomain.com>`
- **Description**: "From" address for all outgoing emails

---

## Payment Integration

Required for subscription features (PayOS Vietnam payment gateway).

### `PAYOS_CLIENT_ID`
- **Type**: String
- **Required**: ✅ Yes (if payment enabled)
- **Scope**: Server-only
- **Example**: `your-client-id`
- **Where to get**: [PayOS Dashboard](https://my.payos.vn/)

### `PAYOS_API_KEY`
- **Type**: String
- **Required**: ✅ Yes (if payment enabled)
- **Scope**: Server-only
- **Example**: `your-api-key`
- **Where to get**: [PayOS Dashboard](https://my.payos.vn/)

### `PAYOS_CHECKSUM_KEY`
- **Type**: String
- **Required**: ✅ Yes (if payment enabled)
- **Scope**: Server-only
- **Example**: `your-checksum-key`
- **Where to get**: [PayOS Dashboard](https://my.payos.vn/)
- **Description**: Used to verify webhook signatures

---

## Caching & Rate Limiting

### `UPSTASH_REDIS_REST_URL` (alias: `REDIS_URL`)
- **Type**: String (URL)
- **Required**: ❌ No (recommended for production)
- **Scope**: Server-only
- **Example**: `https://your-redis.upstash.io`
- **Where to get**:
  1. Visit [Upstash Console](https://console.upstash.com/)
  2. Create Redis database
  3. Copy REST URL
- **Fallback**: In-memory cache (not shared across instances)

### `UPSTASH_REDIS_REST_TOKEN` (alias: `REDIS_TOKEN`)
- **Type**: String
- **Required**: ❌ No (required if REDIS_URL is set)
- **Scope**: Server-only
- **Example**: `AXm1AAI...`
- **Where to get**: Upstash Console (same page as URL)

### `RATE_LIMIT_BACKEND`
- **Type**: Enum (`memory` | `redis`)
- **Required**: ❌ No
- **Default**: `memory`
- **Scope**: Server-only
- **Example**: `redis`
- **Description**:
  - `memory` - Local rate limiting (resets on restart)
  - `redis` - Distributed rate limiting (requires REDIS_URL)

### `SEMANTIC_CACHE_THRESHOLD`
- **Type**: Number (0.0 - 1.0)
- **Required**: ❌ No
- **Default**: `0.95`
- **Scope**: Server-only
- **Example**: `0.95`
- **Description**: Similarity threshold for cache hits (higher = stricter)

### `SEMANTIC_CACHE_TTL`
- **Type**: Number (seconds)
- **Required**: ❌ No
- **Default**: `3600` (1 hour)
- **Scope**: Server-only
- **Example**: `7200`
- **Description**: Cache entry time-to-live

### `SEMANTIC_CACHE_MAX_RESULTS`
- **Type**: Number
- **Required**: ❌ No
- **Default**: `10`
- **Scope**: Server-only
- **Example**: `20`
- **Description**: Max entries to scan for similarity

---

## Monitoring & Analytics

### `SENTRY_DSN`
- **Type**: String (URL)
- **Required**: ❌ No (recommended for production)
- **Scope**: Server-only
- **Example**: `https://abc123@o123456.ingest.sentry.io/7654321`
- **Where to get**:
  1. Visit [Sentry Dashboard](https://sentry.io/)
  2. Create project
  3. Go to Settings → Client Keys (DSN)
- **Description**: Error tracking and performance monitoring

### `NEXT_PUBLIC_SENTRY_DSN`
- **Type**: String (URL)
- **Required**: ❌ No
- **Scope**: Client + Server
- **Example**: Same as `SENTRY_DSN`
- **Description**: Client-side error tracking (can be same as server DSN)

### `ENABLE_PERFORMANCE_MONITORING`
- **Type**: Boolean
- **Required**: ❌ No
- **Default**: `false`
- **Scope**: Server-only
- **Example**: `true`
- **Description**: Enable detailed performance metrics collection

---

## CDN & Storage

### `CDN_PROVIDER`
- **Type**: Enum (`cloudinary` | `uploadcare` | `s3`)
- **Required**: ❌ No (if file uploads disabled)
- **Scope**: Server-only
- **Example**: `cloudinary`
- **Description**: CDN provider for file uploads

### `CLOUDINARY_CLOUD_NAME`
- **Type**: String
- **Required**: ❌ No (if Cloudinary not used)
- **Scope**: Server-only
- **Example**: `your-cloud-name`
- **Where to get**: [Cloudinary Dashboard](https://cloudinary.com/console)

### `CLOUDINARY_API_KEY`
- **Type**: String
- **Required**: ❌ No
- **Scope**: Server-only
- **Where to get**: Cloudinary Dashboard

### `CLOUDINARY_API_SECRET`
- **Type**: String
- **Required**: ❌ No
- **Scope**: Server-only
- **Where to get**: Cloudinary Dashboard

### `CLOUDINARY_UPLOAD_PRESET`
- **Type**: String
- **Required**: ❌ No
- **Scope**: Server-only
- **Example**: `ml_default`
- **Where to get**: Cloudinary Settings → Upload → Upload presets

### `OCR_SPACE_API_KEY`
- **Type**: String
- **Required**: ❌ No (if OCR disabled)
- **Scope**: Server-only
- **Example**: `K88...`
- **Where to get**: [OCR.space](https://ocr.space/ocrapi)
- **Description**: For PDF text extraction

---

## Feature Flags

### `ENABLE_IMAGE_GENERATION`
- **Type**: Boolean
- **Required**: ❌ No
- **Default**: `true`
- **Scope**: Server-only
- **Example**: `false`
- **Description**: Enable/disable DALL-E image generation

### `ENABLE_AUDIO_PROCESSING`
- **Type**: Boolean
- **Required**: ❌ No
- **Default**: `true`
- **Scope**: Server-only
- **Description**: Enable/disable audio transcription features

### `ENABLE_WEB_SEARCH`
- **Type**: Boolean
- **Required**: ❌ No
- **Default**: `false`
- **Scope**: Server-only
- **Description**: Enable web search capabilities (requires additional API)

### `ENABLE_MODEL_COMPARISON`
- **Type**: Boolean
- **Required**: ❌ No
- **Default**: `true`
- **Scope**: Server-only
- **Description**: Allow users to compare models side-by-side

### `ENABLE_QUERY_CACHING`
- **Type**: Boolean
- **Required**: ❌ No
- **Default**: `true`
- **Scope**: Server-only
- **Description**: Enable semantic query caching

---

## Performance Tuning

### `AI_TIMEOUT_MS`
- **Type**: Number (milliseconds)
- **Required**: ❌ No
- **Default**: `45000` (45 seconds)
- **Scope**: Server-only
- **Example**: `60000`
- **Description**: Max time to wait for AI provider response

### `MAX_TOKENS_PER_REQUEST`
- **Type**: Number
- **Required**: ❌ No
- **Default**: `8000`
- **Scope**: Server-only
- **Example**: `4096`
- **Description**: Maximum tokens allowed in a single request

### `MAX_HISTORY`
- **Type**: Number
- **Required**: ❌ No
- **Default**: `20`
- **Scope**: Server-only
- **Example**: `50`
- **Description**: Max conversation messages to include in context

### `AUTO_SCALING_ENABLED`
- **Type**: Boolean
- **Required**: ❌ No
- **Default**: `false`
- **Scope**: Server-only
- **Description**: Enable auto-scaling features (K8s/cloud only)

### `MIN_INSTANCES`
- **Type**: Number
- **Required**: ❌ No (if auto-scaling disabled)
- **Default**: `1`
- **Scope**: Server-only

### `MAX_INSTANCES`
- **Type**: Number
- **Required**: ❌ No (if auto-scaling disabled)
- **Default**: `10`
- **Scope**: Server-only

---

## Development Flags

**⚠️ WARNING**: These should NEVER be enabled in production!

### `NODE_ENV`
- **Type**: Enum (`development` | `production` | `test`)
- **Required**: ✅ Yes
- **Scope**: Server + Client
- **Example**: `production`
- **Description**: Node environment mode

### `MOCK_AI` / `USE_FAKE_AI`
- **Type**: Boolean
- **Required**: ❌ No
- **Default**: `false`
- **Scope**: Server-only
- **Example**: `true`
- **⚠️ WARNING**: For development only! Returns fake AI responses without API calls

### `DEV_BYPASS_LIMIT`
- **Type**: Boolean
- **Required**: ❌ No
- **Default**: `false`
- **Scope**: Server-only
- **⚠️ WARNING**: For development only! Disables rate limiting and quotas

### `DEV_BYPASS_PAY`
- **Type**: Boolean
- **Required**: ❌ No
- **Default**: `false`
- **Scope**: Server-only
- **⚠️ WARNING**: For development only! Grants Pro tier without payment

### `DEBUG_OPENAI`
- **Type**: Boolean
- **Required**: ❌ No
- **Default**: `false`
- **Scope**: Server-only
- **Description**: Log full OpenAI API responses

### `DEBUG_AUTH`
- **Type**: Boolean
- **Required**: ❌ No
- **Default**: `false`
- **Scope**: Server-only
- **Description**: Log detailed authentication flow

### `LOG_LEVEL`
- **Type**: Enum (`debug` | `info` | `warn` | `error`)
- **Required**: ❌ No
- **Default**: `info`
- **Scope**: Server-only
- **Example**: `debug`
- **Description**: Pino logger level

---

## Quick Setup Checklists

### Minimum Required for Development

```bash
# Required
DATABASE_URL="postgresql://..."
AUTH_SECRET="<32+ random characters>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# At least ONE AI provider
OPENAI_API_KEY="sk-..."
# OR
ANTHROPIC_API_KEY="sk-ant-..."
# OR
GOOGLE_API_KEY="AIza..."
```

### Recommended for Production

```bash
# Core
DATABASE_URL="postgresql://..."
AUTH_SECRET="<32+ random characters from secure source>"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# AI Providers (at least 2 for failover)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Email (required if REQUIRE_EMAIL_VERIFICATION=true)
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_SECURE="true"
SMTP_USER="apikey"
SMTP_PASS="<SendGrid API key>"
SMTP_FROM="YourApp <no-reply@yourdomain.com>"

# Payment (if monetizing)
PAYOS_CLIENT_ID="..."
PAYOS_API_KEY="..."
PAYOS_CHECKSUM_KEY="..."

# Caching & Rate Limiting
REDIS_URL="https://..."
REDIS_TOKEN="..."
RATE_LIMIT_BACKEND="redis"

# Monitoring
SENTRY_DSN="https://..."
NEXT_PUBLIC_SENTRY_DSN="https://..."

# Performance
AI_TIMEOUT_MS="60000"
ENABLE_QUERY_CACHING="true"
SEMANTIC_CACHE_THRESHOLD="0.95"
```

### Production Security Checklist

- [ ] `AUTH_SECRET` is 32+ cryptographically random characters
- [ ] `AUTH_SECRET` is NOT committed to version control
- [ ] All `*_API_KEY` variables are NOT committed to version control
- [ ] `DEV_BYPASS_*` flags are set to `false` or removed
- [ ] `MOCK_AI` is set to `false` or removed
- [ ] `NODE_ENV` is set to `production`
- [ ] `NEXT_PUBLIC_APP_URL` matches your actual domain
- [ ] SMTP credentials are app-specific passwords (not main password)
- [ ] Sentry DSN is project-specific (not shared across apps)
- [ ] Database connection string uses connection pooling settings
- [ ] Redis URL uses TLS in production (`rediss://` not `redis://`)

---

## Environment Files

### `.env.local` (Development)
- Used during local development
- Gitignored by default
- Override with `.env.development` for specific dev settings

### `.env.production` (Production)
- **⚠️ NEVER commit this file**
- Contains production secrets
- Use secret management systems:
  - GitHub Secrets (CI/CD)
  - Kubernetes Secrets
  - Docker Secrets
  - Cloud provider secret managers (AWS Secrets Manager, GCP Secret Manager)

### `.env.example`
- Template for required variables
- Safe to commit (no actual secrets)
- Keep updated when adding new variables

---

## Troubleshooting

### "AUTH_SECRET must be at least 32 characters long"
**Solution**: Generate a new secret:
```bash
openssl rand -base64 32
```

### "Prisma connection pool exhausted"
**Solution**: Adjust DATABASE_URL parameters:
```
?connection_limit=10&pool_timeout=20
```

### "Redis credentials not configured"
**Solution**: Either:
1. Set `REDIS_URL` and `REDIS_TOKEN` for production, OR
2. Set `RATE_LIMIT_BACKEND=memory` for development

### "Sentry not capturing errors"
**Solution**: Verify:
1. `SENTRY_DSN` is set correctly
2. `NODE_ENV=production` (Sentry disabled in development)
3. Check Sentry dashboard for project status

### "Email verification not working"
**Solution**: Check:
1. All SMTP_* variables are set
2. `SMTP_USER` and `SMTP_PASS` are correct
3. Gmail users: Use app-specific password, not main password
4. Check SMTP server logs for connection errors

---

## References

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Prisma Connection Management](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [Sentry Configuration](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Upstash Redis](https://docs.upstash.com/redis)

---

**Last Updated**: 2025-10-09
**Version**: 1.0.0-beta
