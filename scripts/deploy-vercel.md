# Vercel Deployment Guide

Complete step-by-step guide for deploying the AI SaaS Chat application to Vercel.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Environment Variables Configuration](#environment-variables-configuration)
- [Domain Configuration](#domain-configuration)
- [Deployment Process](#deployment-process)
- [Post-Deployment Verification](#post-deployment-verification)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Prerequisites

### Required Accounts

- [ ] **Vercel Account** - https://vercel.com/signup
- [ ] **GitHub Account** - https://github.com
- [ ] **Neon Database** - https://neon.tech (PostgreSQL)
- [ ] **Upstash Redis** - https://console.upstash.com
- [ ] **At least one AI Provider**:
  - OpenAI - https://platform.openai.com
  - Anthropic - https://console.anthropic.com
  - Google AI - https://makersuite.google.com

### Optional Services

- [ ] **Cloudflare R2** - For file storage (recommended)
- [ ] **Resend** - For email (modern alternative to SMTP)
- [ ] **PayOS** - For payment processing
- [ ] **Sentry** - For error tracking
- [ ] **Cloudflare Turnstile** - For CAPTCHA

### Local Requirements

```bash
# Install Vercel CLI
npm install -g vercel

# Verify installation
vercel --version
```

---

## Initial Setup

### Step 1: Prepare Your Repository

```bash
# Ensure your code is committed
git status
git add .
git commit -m "Prepare for Vercel deployment"

# Push to GitHub
git push origin main
```

### Step 2: Connect to Vercel

**Option A: Using Vercel Dashboard (Recommended for first deployment)**

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install`

**Option B: Using Vercel CLI**

```bash
# Login to Vercel
vercel login

# Link project
vercel link

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No (for first deployment)
# - Project name? my-saas-chat (or your preferred name)
```

---

## Environment Variables Configuration

### Step 1: Generate Secrets

```bash
# Generate AUTH_SECRET (required)
openssl rand -base64 32
# Save this output - you'll need it multiple times!
```

### Step 2: Add Environment Variables via Dashboard

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

#### Core Configuration

```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
APP_URL=https://your-app.vercel.app
LOG_LEVEL=info
```

**Note**: Replace `your-app.vercel.app` with your actual Vercel domain (you'll get this after first deployment).

#### Database (Neon PostgreSQL)

```
DATABASE_URL=postgresql://user:password@host.neon.tech:5432/dbname?sslmode=require&connection_limit=10&pool_timeout=20&connect_timeout=10
```

**How to get DATABASE_URL:**
1. Go to https://console.neon.tech
2. Create a new project or select existing
3. Go to **Dashboard** → **Connection Details**
4. Copy **Connection string** with pooling enabled
5. Ensure parameters include:
   - `sslmode=require`
   - `connection_limit=10`
   - `pool_timeout=20`

#### Authentication

```
AUTH_SECRET=<paste-generated-secret-here>
AUTH_COOKIE_NAME=session
```

#### Redis/Upstash (Required for production)

```
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=<your-token>
```

**How to get Redis credentials:**
1. Go to https://console.upstash.com
2. Create a new Redis database (free tier available)
3. Select **REST API** tab
4. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

#### AI Providers (At least one required)

**OpenAI (Recommended):**
```
OPENAI_API_KEY=sk-proj-...
AI_PROVIDER=openai
AI_MODEL=gpt-4o-mini
AI_TIMEOUT_MS=45000
```

**Optional additional providers:**
```
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
GROQ_API_KEY=gsk_...
XAI_API_KEY=xai-...
```

#### Storage (Cloudflare R2 - Recommended)

```
R2_ACCOUNT_ID=<your-cloudflare-account-id>
R2_ACCESS_KEY_ID=<your-access-key>
R2_SECRET_ACCESS_KEY=<your-secret-key>
R2_BUCKET_NAME=my-saas-uploads
R2_PUBLIC_URL=https://uploads.yourdomain.com
```

**How to setup Cloudflare R2:**
1. Go to https://dash.cloudflare.com
2. Navigate to **R2** → **Create bucket**
3. Create a bucket (e.g., `my-saas-uploads`)
4. Go to **R2** → **Manage R2 API Tokens**
5. Create API token with read/write permissions
6. Copy Account ID, Access Key ID, and Secret Access Key

#### Email (Choose one option)

**Option 1: Resend (Recommended):**
```
RESEND_API_KEY=re_...
REQUIRE_EMAIL_VERIFICATION=false
```

**Option 2: SMTP:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=<your-app-password>
SMTP_FROM="Your App <noreply@yourdomain.com>"
REQUIRE_EMAIL_VERIFICATION=false
```

#### Payment (PayOS - Optional)

```
PAYOS_CLIENT_ID=<your-client-id>
PAYOS_API_KEY=<your-api-key>
PAYOS_CHECKSUM_KEY=<your-checksum-key>
PAYOS_WEBHOOK_SECRET=<your-webhook-secret>
```

#### Monitoring (Sentry - Optional but recommended)

```
SENTRY_DSN=https://...@o123456.ingest.sentry.io/123456
NEXT_PUBLIC_SENTRY_DSN=https://...@o123456.ingest.sentry.io/123456
SENTRY_AUTH_TOKEN=<your-auth-token>
```

#### Cloudflare Turnstile (Optional CAPTCHA)

```
CLOUDFLARE_TURNSTILE_SECRET=<your-secret-key>
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=<your-site-key>
```

#### Feature Flags (Client-side)

```
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_CHAT_EXPORT=true
NEXT_PUBLIC_MAX_FILE_SIZE_MB=10
```

### Step 3: Set Environment Scope

For each variable, set the appropriate scope:
- ✅ **Production** - Always checked
- ⚠️ **Preview** - Optional (useful for testing)
- ❌ **Development** - Usually unchecked (use `.env.local` instead)

### Step 4: Verify Variables via CLI (Alternative Method)

```bash
# Set variables via CLI
vercel env add NEXT_PUBLIC_APP_URL production
# Enter value when prompted

# Or import from file
vercel env pull .env.vercel.local
# Edit the file and push back:
vercel env push .env.vercel.local production
```

---

## Domain Configuration

### Step 1: Configure Vercel Domain

**Using default Vercel domain:**
1. Your app will be available at: `https://your-project.vercel.app`
2. Update environment variables:
   ```
   NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
   APP_URL=https://your-project.vercel.app
   ```

**Using custom domain:**

1. Go to **Settings** → **Domains**
2. Click **Add**
3. Enter your domain: `yourdomain.com`
4. Follow DNS configuration instructions:

   **For Cloudflare DNS:**
   ```
   Type: CNAME
   Name: @
   Target: cname.vercel-dns.com
   Proxy: DNS Only (click cloud icon to disable)
   ```

   **For other DNS providers:**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

5. Update environment variables:
   ```
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   APP_URL=https://yourdomain.com
   ```

### Step 2: Configure SSL

Vercel automatically provisions SSL certificates via Let's Encrypt.
- Certificate auto-renews
- HTTPS enabled by default
- HTTP automatically redirects to HTTPS

---

## Deployment Process

### Method 1: Deploy via Dashboard (Recommended for first deployment)

1. Ensure all environment variables are set
2. Click **Deploy** in Vercel Dashboard
3. Vercel will:
   - Install dependencies
   - Run build
   - Deploy to production
4. Monitor build logs in real-time

### Method 2: Deploy via CLI

```bash
# Deploy to production
vercel --prod

# Follow prompts and confirm settings

# Monitor deployment
vercel logs --follow
```

### Method 3: Automatic Deployment (GitHub Integration)

Once connected:
- **Push to `main`** → Auto-deploys to production
- **Push to other branches** → Creates preview deployment
- **Pull requests** → Creates preview deployment with unique URL

Configure in **Settings** → **Git**:
```
Production Branch: main
Preview Branches: All branches
Ignored Build Step: Custom (optional)
```

---

## Post-Deployment Verification

### Step 1: Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (first deployment only)
npx prisma migrate deploy

# Seed database if needed
npx prisma db seed
```

### Step 2: Verify Environment Variables

```bash
# Check environment in deployment
vercel env ls

# Verify specific variable
vercel env pull .env.vercel.production
cat .env.vercel.production | grep NEXT_PUBLIC_APP_URL
```

### Step 3: Automated Verification

```bash
# Run post-deploy verification script
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app npm run verify:production

# With verbose output
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app npm run verify:production -- --verbose
```

### Step 4: Manual Testing Checklist

- [ ] **Homepage loads** - Visit your domain
- [ ] **Signup works** - Create test account
- [ ] **Login works** - Sign in with test account
- [ ] **Chat works** - Send a test message
- [ ] **AI responds** - Verify AI model responds correctly
- [ ] **File upload** (if enabled) - Upload a test file
- [ ] **Payment flow** (if enabled) - Test upgrade flow
- [ ] **Email delivery** (if enabled) - Check verification emails

### Step 5: Monitor Logs

```bash
# View production logs
vercel logs --follow

# Filter by function
vercel logs --follow --output lambda

# View specific deployment
vercel logs <deployment-url>
```

---

## Troubleshooting

### Build Failures

**Error: `AUTH_SECRET must be at least 32 characters`**

Solution:
```bash
# Generate new secret
openssl rand -base64 32

# Add to Vercel environment variables
vercel env add AUTH_SECRET production
```

**Error: `DATABASE_URL is required`**

Solution:
1. Check environment variable is set in Vercel Dashboard
2. Ensure variable scope includes "Production"
3. Redeploy

**Error: `Module not found`**

Solution:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Commit and redeploy
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### Runtime Errors

**Error: `Cannot connect to database`**

Solutions:
1. Verify `DATABASE_URL` in Vercel environment variables
2. Check Neon database is running
3. Verify connection pooling parameters
4. Check database IP allowlist (Neon allows all by default)

**Error: `Redis connection failed`**

Solutions:
1. Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
2. Check Upstash dashboard for database status
3. Verify REST API is enabled (not Redis protocol)

**Error: `AI provider API key invalid`**

Solutions:
1. Regenerate API key from provider dashboard
2. Update environment variable in Vercel
3. Redeploy

### Performance Issues

**Slow cold starts:**

Solutions:
1. Upgrade to Vercel Pro (faster edge network)
2. Use Edge Runtime for API routes:
   ```ts
   export const runtime = 'edge'
   ```
3. Implement proper caching strategies

**Database connection pool exhausted:**

Solutions:
1. Increase connection limit in `DATABASE_URL`:
   ```
   ?connection_limit=20
   ```
2. Use connection pooling (Neon Serverless)
3. Monitor connection usage in Neon dashboard

---

## Best Practices

### 1. Environment Management

```bash
# Keep local .env.local for development
cp .env.production.example .env.local
# Edit .env.local with development values

# Never commit .env.local or .env.production
# They're already in .gitignore
```

### 2. Deployment Strategy

**Use preview deployments for testing:**
```bash
# Create feature branch
git checkout -b feature/new-feature

# Push to create preview deployment
git push origin feature/new-feature

# Get preview URL from Vercel
# Test thoroughly before merging to main
```

**Protect production branch:**
1. Go to **Settings** → **Git** → **Protected Branches**
2. Enable protection for `main`
3. Require pull request reviews

### 3. Secrets Rotation

```bash
# Rotate AUTH_SECRET every 90 days
openssl rand -base64 32

# Update in Vercel
vercel env rm AUTH_SECRET production
vercel env add AUTH_SECRET production

# Redeploy
vercel --prod
```

### 4. Monitoring

**Set up Vercel Analytics:**
1. Go to **Analytics** tab in Vercel Dashboard
2. Enable Web Analytics
3. Add to your app:
   ```tsx
   // app/layout.tsx
   import { Analytics } from '@vercel/analytics/react'

   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <Analytics />
         </body>
       </html>
     )
   }
   ```

**Configure alerts:**
1. Go to **Settings** → **Notifications**
2. Enable:
   - Deployment failures
   - Error rate spikes
   - Performance degradation

### 5. Cost Optimization

**Monitor usage:**
1. Go to **Usage** tab
2. Check:
   - Bandwidth consumption
   - Function invocations
   - Build minutes

**Optimize costs:**
- Use Edge Functions for static content
- Implement caching headers
- Optimize images with `next/image`
- Use ISR (Incremental Static Regeneration)

---

## Quick Reference Commands

```bash
# Deploy to production
vercel --prod

# View logs
vercel logs --follow

# List environment variables
vercel env ls

# Add environment variable
vercel env add VARIABLE_NAME production

# Remove environment variable
vercel env rm VARIABLE_NAME production

# Pull environment variables to local file
vercel env pull .env.vercel.local

# Alias deployment to domain
vercel alias <deployment-url> yourdomain.com

# Rollback to previous deployment
vercel rollback <deployment-url>

# Inspect deployment
vercel inspect <deployment-url>
```

---

## Related Documentation

- [Environment Variables Reference](../docs/ENVIRONMENT_VARS.md)
- [Azure Deployment Guide](./deploy-azure.md)
- [Production Environment Template](../.env.production.example)
- [Vercel Official Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

---

## Support

**Issues:**
- GitHub Issues: [Create Issue](https://github.com/your-repo/issues)
- Vercel Support: https://vercel.com/support
- Community Discord: [Your Discord Link]

**Documentation:**
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs

---

**Last Updated**: October 2025
**Version**: 1.0.0
