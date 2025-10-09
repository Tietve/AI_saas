# Environment Variables Documentation

Complete guide to environment variables for multi-cloud deployment of the AI SaaS Chat application.

## Table of Contents

- [Overview](#overview)
- [Multi-Cloud Deployment Mapping](#multi-cloud-deployment-mapping)
- [Variable Reference](#variable-reference)
  - [Core Configuration](#core-configuration)
  - [Database](#database)
  - [Authentication & Security](#authentication--security)
  - [AI Providers](#ai-providers)
  - [Email Configuration](#email-configuration)
  - [Payment Gateway](#payment-gateway)
  - [Storage](#storage)
  - [Caching & Rate Limiting](#caching--rate-limiting)
  - [Monitoring & Analytics](#monitoring--analytics)
  - [Cloudflare](#cloudflare)
  - [Azure-Specific](#azure-specific)
  - [Feature Flags](#feature-flags)
  - [Client-Side Variables](#client-side-variables)
- [Validation](#validation)
- [Security Best Practices](#security-best-practices)
- [Quick Reference](#quick-reference)

---

## Overview

This application uses a **split architecture** for multi-cloud deployment:

- **Vercel**: Hosts the Next.js frontend and API routes (serverless functions)
- **Azure App Service**: Optional dedicated backend for heavy workloads
- **Shared Services**: Database (Neon), Redis (Upstash), Storage (R2/Azure Blob)

Environment variables are categorized into:
- **Client-side** (`NEXT_PUBLIC_*`): Exposed to the browser, deployed to Vercel
- **Server-side**: Secret values, deployed to both Vercel and Azure
- **Shared**: Used by both platforms (database, Redis, etc.)

---

## Multi-Cloud Deployment Mapping

| Variable Category | Vercel (Frontend) | Azure (Backend) | Notes |
|-------------------|-------------------|-----------------|-------|
| **Client Variables** (`NEXT_PUBLIC_*`) | ✅ Required | ❌ Not needed | Bundled in client code |
| **Database** | ✅ Required | ✅ Required | Shared PostgreSQL (Neon) |
| **Authentication** | ✅ Required | ✅ Required | Shared secret keys |
| **AI Providers** | ✅ Required | ✅ Required | API keys for AI services |
| **Email (SMTP/Resend)** | ✅ Required | ⚠️ Optional | Only if Azure handles email |
| **Payment (PayOS)** | ✅ Required | ⚠️ Optional | Only if Azure handles webhooks |
| **Redis/Upstash** | ✅ Required | ✅ Required | Shared cache & rate limiting |
| **Storage (R2)** | ✅ Required | ✅ Required | Shared file storage |
| **Storage (Azure Blob)** | ⚠️ Optional | ✅ If used | Azure-specific storage |
| **Monitoring (Sentry)** | ✅ Recommended | ✅ Recommended | Error tracking & analytics |
| **CORS** | ❌ Not applicable | ✅ Required | Only for API backend |
| **Azure Insights** | ❌ Not applicable | ✅ Recommended | Azure monitoring |
| **Cloudflare** | ✅ Optional | ✅ Optional | CDN, R2, Turnstile |

### Deployment Priority

**Minimum Required for Vercel:**
```bash
# Core
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
APP_URL=https://your-app.vercel.app

# Database
DATABASE_URL=postgresql://...

# Auth
AUTH_SECRET=your-32-char-secret

# Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# AI (at least one)
OPENAI_API_KEY=sk-...
```

**Additional for Azure Backend:**
```bash
# CORS
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-domain.com

# Azure Monitoring
AZURE_APP_INSIGHTS_KEY=...
```

---

## Variable Reference

### Core Configuration

#### `NODE_ENV`
- **Type**: `development` | `production` | `test`
- **Required**: Yes
- **Default**: `development`
- **Vercel**: ✅ | **Azure**: ✅
- **Description**: Runtime environment mode

#### `APP_URL`
- **Type**: URL string
- **Required**: Yes
- **Vercel**: ✅ | **Azure**: ✅
- **Example**: `https://your-app.vercel.app`
- **Description**: Backend API URL (server-side)

#### `NEXTAUTH_URL`
- **Type**: URL string
- **Required**: No (deprecated, use `APP_URL`)
- **Vercel**: ⚠️ | **Azure**: ⚠️
- **Description**: Legacy auth URL configuration

#### `LOG_LEVEL`
- **Type**: `debug` | `info` | `warn` | `error`
- **Required**: No
- **Default**: `info`
- **Vercel**: ✅ | **Azure**: ✅
- **Description**: Logging verbosity level

---

### Database

#### `DATABASE_URL`
- **Type**: PostgreSQL connection string
- **Required**: Yes
- **Vercel**: ✅ | **Azure**: ✅
- **Example**:
  ```
  postgresql://user:pass@host.neon.tech:5432/dbname?sslmode=require&connection_limit=10&pool_timeout=20
  ```
- **Description**: PostgreSQL connection string with pooling parameters
- **Production Tips**:
  - Use connection pooling: `connection_limit=10`
  - Set timeouts: `pool_timeout=20`, `connect_timeout=10`
  - Enable SSL: `sslmode=require`

---

### Authentication & Security

#### `AUTH_SECRET`
- **Type**: String (min 32 characters)
- **Required**: Yes
- **Vercel**: ✅ | **Azure**: ✅
- **Generate**: `openssl rand -base64 32`
- **Description**: Secret key for JWT signing
- **Security**: MUST be cryptographically random, never commit to git

#### `AUTH_COOKIE_NAME`
- **Type**: String
- **Required**: No
- **Default**: `session`
- **Vercel**: ✅ | **Azure**: ✅
- **Description**: Name of the session cookie

#### `CORS_ALLOWED_ORIGINS`
- **Type**: Comma-separated URLs
- **Required**: No (defaults to `APP_URL`)
- **Vercel**: ❌ | **Azure**: ✅
- **Example**: `https://app.com,https://www.app.com`
- **Description**: Allowed CORS origins for API requests (Azure only)

---

### AI Providers

At least **one** AI provider key is required.

#### `OPENAI_API_KEY`
- **Type**: String (starts with `sk-`)
- **Required**: Recommended
- **Vercel**: ✅ | **Azure**: ✅
- **Get from**: https://platform.openai.com/api-keys
- **Example**: `sk-proj-abc123...`

#### `ANTHROPIC_API_KEY`
- **Type**: String (starts with `sk-ant-`)
- **Required**: No
- **Vercel**: ✅ | **Azure**: ✅
- **Get from**: https://console.anthropic.com/account/keys
- **Example**: `sk-ant-api03-...`

#### `GOOGLE_API_KEY`
- **Type**: String (starts with `AIza`)
- **Required**: No
- **Vercel**: ✅ | **Azure**: ✅
- **Get from**: https://makersuite.google.com/app/apikey
- **Example**: `AIzaSy...`

#### `GROQ_API_KEY`
- **Type**: String (starts with `gsk_`)
- **Required**: No
- **Vercel**: ✅ | **Azure**: ✅
- **Get from**: https://console.groq.com/keys
- **Example**: `gsk_...`

#### `XAI_API_KEY`
- **Type**: String (starts with `xai-`)
- **Required**: No
- **Vercel**: ✅ | **Azure**: ✅
- **Get from**: https://x.ai/api
- **Example**: `xai-...`

#### `AI_PROVIDER`
- **Type**: `openai` | `anthropic` | `google` | `groq` | `xai`
- **Required**: No
- **Default**: `openai`
- **Vercel**: ✅ | **Azure**: ✅
- **Description**: Default AI provider to use

#### `AI_MODEL`
- **Type**: String
- **Required**: No
- **Default**: `gpt-4o-mini`
- **Vercel**: ✅ | **Azure**: ✅
- **Description**: Default AI model to use

#### `AI_TIMEOUT_MS`
- **Type**: Number (milliseconds)
- **Required**: No
- **Default**: `45000`
- **Vercel**: ✅ | **Azure**: ✅
- **Description**: AI request timeout

#### `INTENT_MODEL`
- **Type**: String
- **Required**: No
- **Vercel**: ✅ | **Azure**: ✅
- **Description**: Model for intent classification

---

### Email Configuration

Choose **either** SMTP or Resend.

#### SMTP Configuration

#### `SMTP_HOST`
- **Type**: String
- **Required**: If email verification enabled
- **Vercel**: ✅ | **Azure**: ⚠️
- **Example**: `smtp.gmail.com`

#### `SMTP_PORT`
- **Type**: Number
- **Required**: If email verification enabled
- **Vercel**: ✅ | **Azure**: ⚠️
- **Example**: `587`

#### `SMTP_SECURE`
- **Type**: `true` | `false`
- **Required**: If email verification enabled
- **Vercel**: ✅ | **Azure**: ⚠️
- **Example**: `true`

#### `SMTP_USER`
- **Type**: Email address
- **Required**: If email verification enabled
- **Vercel**: ✅ | **Azure**: ⚠️
- **Example**: `noreply@yourdomain.com`

#### `SMTP_PASS`
- **Type**: String (app password)
- **Required**: If email verification enabled
- **Vercel**: ✅ | **Azure**: ⚠️
- **Description**: SMTP password or app-specific password

#### `SMTP_FROM`
- **Type**: Email address or "Name <email>"
- **Required**: If email verification enabled
- **Vercel**: ✅ | **Azure**: ⚠️
- **Example**: `"AI SaaS" <noreply@yourdomain.com>`

#### `REQUIRE_EMAIL_VERIFICATION`
- **Type**: `true` | `false`
- **Required**: No
- **Default**: `false`
- **Vercel**: ✅ | **Azure**: ✅
- **Description**: Enable email verification on signup

#### Resend Alternative

#### `RESEND_API_KEY`
- **Type**: String (starts with `re_`)
- **Required**: If using Resend instead of SMTP
- **Vercel**: ✅ | **Azure**: ⚠️
- **Get from**: https://resend.com/api-keys
- **Example**: `re_123abc...`
- **Description**: Modern email API alternative to SMTP

---

### Payment Gateway

#### `PAYOS_CLIENT_ID`
- **Type**: String
- **Required**: If payment enabled
- **Vercel**: ✅ | **Azure**: ⚠️
- **Get from**: PayOS Dashboard
- **Description**: PayOS client identifier

#### `PAYOS_API_KEY`
- **Type**: String
- **Required**: If payment enabled
- **Vercel**: ✅ | **Azure**: ⚠️
- **Description**: PayOS API key

#### `PAYOS_CHECKSUM_KEY`
- **Type**: String
- **Required**: If payment enabled
- **Vercel**: ✅ | **Azure**: ⚠️
- **Description**: PayOS checksum key for webhook verification

#### `PAYOS_WEBHOOK_SECRET`
- **Type**: String
- **Required**: No
- **Vercel**: ✅ | **Azure**: ⚠️
- **Description**: Additional webhook secret

---

### Storage

Choose **either** Cloudflare R2 or Azure Blob Storage.

#### Cloudflare R2 (Recommended for Vercel)

#### `R2_ACCOUNT_ID`
- **Type**: String
- **Required**: If using R2
- **Vercel**: ✅ | **Azure**: ✅
- **Get from**: Cloudflare Dashboard
- **Description**: Cloudflare account ID

#### `R2_ACCESS_KEY_ID`
- **Type**: String
- **Required**: If using R2
- **Vercel**: ✅ | **Azure**: ✅
- **Description**: R2 access key ID (S3-compatible)

#### `R2_SECRET_ACCESS_KEY`
- **Type**: String
- **Required**: If using R2
- **Vercel**: ✅ | **Azure**: ✅
- **Description**: R2 secret access key

#### `R2_BUCKET_NAME`
- **Type**: String
- **Required**: If using R2
- **Vercel**: ✅ | **Azure**: ✅
- **Example**: `my-saas-uploads`
- **Description**: R2 bucket name

#### `R2_PUBLIC_URL`
- **Type**: URL
- **Required**: No
- **Vercel**: ✅ | **Azure**: ✅
- **Example**: `https://uploads.yourdomain.com`
- **Description**: Public URL for R2 bucket (if using custom domain)

#### Azure Blob Storage (Recommended for Azure)

#### `AZURE_STORAGE_ACCOUNT_NAME`
- **Type**: String
- **Required**: If using Azure Blob
- **Vercel**: ⚠️ | **Azure**: ✅
- **Description**: Azure Storage account name

#### `AZURE_STORAGE_ACCOUNT_KEY`
- **Type**: String
- **Required**: If using Azure Blob
- **Vercel**: ⚠️ | **Azure**: ✅
- **Description**: Azure Storage account key

#### `AZURE_STORAGE_CONNECTION_STRING`
- **Type**: String
- **Required**: Alternative to account name/key
- **Vercel**: ⚠️ | **Azure**: ✅
- **Example**: `DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...`
- **Description**: Complete Azure Storage connection string

#### `AZURE_BLOB_CONTAINER_NAME`
- **Type**: String
- **Required**: No
- **Default**: `uploads`
- **Vercel**: ⚠️ | **Azure**: ✅
- **Description**: Azure Blob container name

---

### Caching & Rate Limiting

#### `UPSTASH_REDIS_REST_URL`
- **Type**: URL
- **Required**: Yes (highly recommended)
- **Vercel**: ✅ | **Azure**: ✅
- **Get from**: https://console.upstash.com
- **Example**: `https://your-redis.upstash.io`
- **Description**: Upstash Redis REST URL

#### `UPSTASH_REDIS_REST_TOKEN`
- **Type**: String
- **Required**: Yes (highly recommended)
- **Vercel**: ✅ | **Azure**: ✅
- **Description**: Upstash Redis REST token

#### `RATE_PM`
- **Type**: Number
- **Required**: No
- **Vercel**: ✅ | **Azure**: ✅
- **Description**: Rate limit per minute

#### `MAX_HISTORY`
- **Type**: Number
- **Required**: No
- **Default**: `20`
- **Vercel**: ✅ | **Azure**: ✅
- **Description**: Max conversation history messages

---

### Monitoring & Analytics

#### `SENTRY_DSN`
- **Type**: URL
- **Required**: No (recommended for production)
- **Vercel**: ✅ | **Azure**: ✅
- **Get from**: https://sentry.io
- **Description**: Sentry DSN for error tracking (server-side)

#### `SENTRY_AUTH_TOKEN`
- **Type**: String
- **Required**: No
- **Vercel**: ✅ | **Azure**: ✅
- **Description**: Sentry auth token for source maps upload

---

### Cloudflare

#### `CLOUDFLARE_API_TOKEN`
- **Type**: String
- **Required**: No
- **Vercel**: ✅ | **Azure**: ✅
- **Description**: Cloudflare API token

#### `CLOUDFLARE_ZONE_ID`
- **Type**: String
- **Required**: No
- **Vercel**: ✅ | **Azure**: ✅
- **Description**: Cloudflare zone ID

#### `CLOUDFLARE_TURNSTILE_SECRET`
- **Type**: String
- **Required**: If using Turnstile
- **Vercel**: ✅ | **Azure**: ✅
- **Get from**: Cloudflare Turnstile dashboard
- **Description**: Turnstile secret key (server-side)

---

### Azure-Specific

#### `AZURE_APP_INSIGHTS_KEY`
- **Type**: String
- **Required**: No (recommended for Azure)
- **Vercel**: ❌ | **Azure**: ✅
- **Get from**: Azure Portal
- **Description**: Azure Application Insights key

#### `AZURE_KEY_VAULT_URL`
- **Type**: URL
- **Required**: No
- **Vercel**: ❌ | **Azure**: ✅
- **Example**: `https://your-vault.vault.azure.net`
- **Description**: Azure Key Vault URL for secret management

---

### Feature Flags

**WARNING**: These should be `0` or `false` in production!

#### `MOCK_AI`
- **Type**: `0` | `1`
- **Required**: No
- **Default**: `0`
- **Vercel**: ⚠️ Dev only | **Azure**: ⚠️ Dev only
- **Description**: Use mock AI responses (development only)

#### `DEV_BYPASS_PAY`
- **Type**: `0` | `1`
- **Required**: No
- **Default**: `0`
- **Vercel**: ⚠️ Dev only | **Azure**: ⚠️ Dev only
- **Description**: Bypass payment checks (development only)

#### `DEV_BYPASS_LIMIT`
- **Type**: `0` | `1`
- **Required**: No
- **Default**: `0`
- **Vercel**: ⚠️ Dev only | **Azure**: ⚠️ Dev only
- **Description**: Bypass rate limits (development only)

#### `DEBUG_OPENAI`
- **Type**: `0` | `1`
- **Required**: No
- **Default**: `0`
- **Vercel**: ⚠️ Dev only | **Azure**: ⚠️ Dev only
- **Description**: Log OpenAI API responses

---

### Client-Side Variables

These variables are **bundled in the client code** and exposed to browsers.

#### `NEXT_PUBLIC_APP_URL`
- **Type**: URL
- **Required**: Yes
- **Vercel**: ✅ | **Azure**: ❌
- **Example**: `https://your-app.vercel.app`
- **Description**: Public-facing app URL

#### `NEXT_PUBLIC_BASE_URL`
- **Type**: URL
- **Required**: No
- **Vercel**: ✅ | **Azure**: ❌
- **Description**: Alternative to `NEXT_PUBLIC_APP_URL`

#### `NEXT_PUBLIC_API_URL`
- **Type**: URL
- **Required**: No (defaults to `NEXT_PUBLIC_APP_URL`)
- **Vercel**: ✅ | **Azure**: ❌
- **Example**: `https://api-backend.azurewebsites.net`
- **Description**: Separate API backend URL

#### `NEXT_PUBLIC_SENTRY_DSN`
- **Type**: URL
- **Required**: No
- **Vercel**: ✅ | **Azure**: ❌
- **Description**: Sentry DSN for client-side error tracking

#### `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- **Type**: String
- **Required**: No
- **Vercel**: ✅ | **Azure**: ❌
- **Example**: `G-XXXXXXXXXX`
- **Description**: Google Analytics measurement ID

#### `NEXT_PUBLIC_POSTHOG_KEY`
- **Type**: String
- **Required**: No
- **Vercel**: ✅ | **Azure**: ❌
- **Description**: PostHog API key

#### `NEXT_PUBLIC_POSTHOG_HOST`
- **Type**: URL
- **Required**: No
- **Vercel**: ✅ | **Azure**: ❌
- **Default**: `https://app.posthog.com`
- **Description**: PostHog host URL

#### `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY`
- **Type**: String
- **Required**: If using Turnstile
- **Vercel**: ✅ | **Azure**: ❌
- **Get from**: Cloudflare Turnstile dashboard
- **Description**: Turnstile site key (client-side)

#### `NEXT_PUBLIC_ENABLE_ANALYTICS`
- **Type**: `true` | `false`
- **Required**: No
- **Vercel**: ✅ | **Azure**: ❌
- **Description**: Enable/disable client-side analytics

#### `NEXT_PUBLIC_ENABLE_CHAT_EXPORT`
- **Type**: `true` | `false`
- **Required**: No
- **Vercel**: ✅ | **Azure**: ❌
- **Description**: Enable chat export feature

#### `NEXT_PUBLIC_MAX_FILE_SIZE_MB`
- **Type**: Number
- **Required**: No
- **Default**: `10`
- **Vercel**: ✅ | **Azure**: ❌
- **Description**: Maximum file upload size in MB

#### `NEXT_PUBLIC_CDN_URL`
- **Type**: URL
- **Required**: No
- **Vercel**: ✅ | **Azure**: ❌
- **Description**: CDN URL for static assets

#### `NEXT_PUBLIC_R2_PUBLIC_URL`
- **Type**: URL
- **Required**: No
- **Vercel**: ✅ | **Azure**: ❌
- **Description**: Public R2 bucket URL

---

## Validation

Use the built-in validation scripts:

### Verify Environment Variables

```bash
# Check all environment variables
npm run env:verify

# Strict mode (warnings treated as errors)
npm run env:verify -- --strict
```

### Post-Deployment Verification

```bash
# Test deployed application
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app npm run verify:production

# Verbose output
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app npm run verify:production -- --verbose
```

---

## Security Best Practices

### 1. Secret Management

**DO:**
- Generate cryptographically random secrets
- Use Azure Key Vault or Vercel Environment Variables
- Rotate secrets regularly
- Use different secrets for dev/staging/production

**DON'T:**
- Commit secrets to git
- Use placeholder values in production
- Share secrets in plain text
- Reuse secrets across environments

### 2. Secret Generation

```bash
# Generate AUTH_SECRET
openssl rand -base64 32

# Generate strong password
openssl rand -base64 24
```

### 3. Environment-Specific Configs

| Environment | File | Usage |
|-------------|------|-------|
| **Development** | `.env.local` | Local development (gitignored) |
| **Production** | Vercel Dashboard / Azure App Settings | Deployed environments |
| **Testing** | `.env.test` | CI/CD testing |

### 4. Client-Side Security

**NEVER** expose secrets in `NEXT_PUBLIC_*` variables:
- ❌ API keys
- ❌ Database credentials
- ❌ Auth secrets
- ❌ Payment secrets

**SAFE** to expose:
- ✅ App URLs
- ✅ Public API endpoints
- ✅ Analytics IDs
- ✅ Turnstile site keys

### 5. CORS Configuration

For Azure backend with Vercel frontend:

```bash
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app,https://www.your-domain.com
```

### 6. Production Checklist

Before deploying to production:

- [ ] All secrets are random and unique
- [ ] No development flags enabled (`MOCK_AI`, `DEV_BYPASS_*`)
- [ ] HTTPS enabled for all URLs
- [ ] Database connection pooling configured
- [ ] Redis/Upstash configured for rate limiting
- [ ] Error tracking enabled (Sentry)
- [ ] CORS configured correctly (Azure)
- [ ] Storage provider configured (R2 or Azure Blob)
- [ ] Email provider configured (SMTP or Resend)
- [ ] Run `npm run env:verify -- --strict`

---

## Quick Reference

### Minimal Production Setup (Vercel Only)

```bash
# Core
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
APP_URL=https://your-app.vercel.app

# Database
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require&connection_limit=10

# Auth
AUTH_SECRET=<generated-32-char-secret>

# Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=<your-token>

# AI (choose at least one)
OPENAI_API_KEY=sk-...
```

### Full Production Setup (Vercel + Azure)

Add to Vercel + Azure:
```bash
# Storage (R2)
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<access-key>
R2_SECRET_ACCESS_KEY=<secret-key>
R2_BUCKET_NAME=my-saas-uploads
R2_PUBLIC_URL=https://uploads.yourdomain.com

# Email (Resend)
RESEND_API_KEY=re_...

# Payment
PAYOS_CLIENT_ID=<client-id>
PAYOS_API_KEY=<api-key>
PAYOS_CHECKSUM_KEY=<checksum-key>

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...

# Cloudflare
CLOUDFLARE_TURNSTILE_SECRET=<secret-key>
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=<site-key>
```

Add to Azure only:
```bash
# CORS
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app

# Azure Monitoring
AZURE_APP_INSIGHTS_KEY=<insights-key>
```

---

## Related Documentation

- [Vercel Deployment Guide](../scripts/deploy-vercel.md)
- [Azure Deployment Guide](../scripts/deploy-azure.md)
- [Production Environment Template](../.env.production.example)

---

**Last Updated**: October 2025
**Version**: 1.1.0
