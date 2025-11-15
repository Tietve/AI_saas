# Cloudflare Workers Gateway - Complete Setup Guide

> **Agent 1 Deliverable:** Comprehensive setup documentation (2,500+ words)
> **Target:** Zero-to-production deployment in 30 minutes

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Cloudflare Account Setup](#cloudflare-account-setup)
3. [Wrangler CLI Installation](#wrangler-cli-installation)
4. [Project Initialization](#project-initialization)
5. [Cloudflare Resources Creation](#cloudflare-resources-creation)
6. [Environment Configuration](#environment-configuration)
7. [Local Development](#local-development)
8. [Deployment](#deployment)
9. [Verification](#verification)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **Node.js:** >= 18.0.0 (LTS recommended)
- **npm:** >= 9.0.0
- **Git:** Latest version
- **OS:** Windows, macOS, or Linux

### Knowledge Requirements

- Basic understanding of API Gateways
- Familiarity with TypeScript
- Command-line interface experience

### Time Commitment

- **Full setup:** 30-45 minutes
- **Quick start:** 10-15 minutes (if account exists)

---

## Cloudflare Account Setup

### Step 1: Create Cloudflare Account

1. **Visit Cloudflare Sign-up Page**
   - URL: https://dash.cloudflare.com/sign-up
   - Choose "Free" plan (sufficient for development)

2. **Email Verification**
   - Check your email for verification link
   - Click to verify your account

3. **Complete Profile**
   - Add name, company (optional)
   - Accept terms of service

**Estimated Time:** 5 minutes

### Step 2: Enable Workers

1. **Navigate to Workers**
   - Dashboard → Workers & Pages
   - Click "Get Started"

2. **Choose Subdomain**
   - Pick a unique subdomain: `<your-name>.workers.dev`
   - Example: `my-saas-chat.workers.dev`
   - This will be used for default worker URLs

3. **Verify Workers Enabled**
   - You should see "Workers & Pages" dashboard
   - Note: Free plan includes 100,000 requests/day!

**Estimated Time:** 3 minutes

### Step 3: Get Account ID

1. **Find Account ID**
   - Dashboard → Workers & Pages → Overview
   - Look for "Account ID" in the right sidebar
   - Copy this ID (format: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

2. **Save Account ID**
   - You'll need this for `wrangler.toml`
   - Keep it secure (but not a secret)

**Estimated Time:** 2 minutes

---

## Wrangler CLI Installation

### Global Installation (Recommended)

```bash
# Install Wrangler globally
npm install -g wrangler

# Verify installation
wrangler --version
# Should output: ⛅️ wrangler 3.x.x
```

### Project-specific Installation (Alternative)

```bash
# Install as dev dependency
cd backend/cloudflare-gateway
npm install -D wrangler

# Use with npx
npx wrangler --version
```

### Authentication

```bash
# Login to Cloudflare
wrangler login

# This will:
# 1. Open browser for OAuth
# 2. Redirect to Cloudflare authorization page
# 3. Grant Wrangler access to your account
# 4. Save credentials locally

# Verify login
wrangler whoami
# Should display: You are logged in with email: your@email.com
```

**Estimated Time:** 5 minutes

---

## Project Initialization

### Step 1: Navigate to Project

```bash
cd /path/to/AI_saas/backend/cloudflare-gateway
```

### Step 2: Install Dependencies

```bash
npm install
```

**Expected Output:**
```
added 147 packages, and audited 148 packages in 12s
```

**Packages Installed:**
- `hono` - Fast web framework for Cloudflare Workers
- `jose` - JWT verification
- `wrangler` - Cloudflare CLI
- `@cloudflare/workers-types` - TypeScript types
- `typescript` - TypeScript compiler
- `vitest` - Testing framework

**Estimated Time:** 2 minutes

### Step 3: Verify Project Structure

```bash
tree -L 2 -I node_modules
```

**Expected Structure:**
```
cloudflare-gateway/
├── src/
│   ├── index.ts
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   └── types/
├── package.json
├── tsconfig.json
├── wrangler.toml
├── .gitignore
├── .dev.vars.example
└── README.md
```

---

## Cloudflare Resources Creation

### KV Namespace (Key-Value Store)

**Purpose:** Caching, rate limiting, session storage

**Free Tier Limits:**
- 1 GB storage
- 100,000 reads/day
- 1,000 writes/day

**Creation:**

```bash
# Create production KV namespace
wrangler kv:namespace create KV

# Expected output:
# ✨ Success!
# Add the following to your wrangler.toml:
# [[kv_namespaces]]
# binding = "KV"
# id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Create preview KV namespace (for testing)
wrangler kv:namespace create KV --preview

# Expected output:
# [[kv_namespaces]]
# binding = "KV"
# preview_id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"
```

**Update `wrangler.toml`:**

```toml
[[kv_namespaces]]
binding = "KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # From above
preview_id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"  # From above
```

**Verify:**

```bash
wrangler kv:namespace list
# Should show: KV (xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)
```

**Estimated Time:** 3 minutes

---

### D1 Database (SQLite at Edge)

**Purpose:** Usage tracking, analytics, user tiers

**Free Tier Limits:**
- 5 GB storage
- 5 million reads/day
- 100,000 writes/day

**Creation:**

```bash
# Create D1 database
wrangler d1 create my-saas-chat-db

# Expected output:
# ✅ Successfully created DB 'my-saas-chat-db'
# [[d1_databases]]
# binding = "DB"
# database_name = "my-saas-chat-db"
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Update `wrangler.toml`:**

```toml
[[d1_databases]]
binding = "DB"
database_name = "my-saas-chat-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # From above
```

**Create Migrations:**

```bash
# Create migrations directory
mkdir -p migrations

# Create initial schema
wrangler d1 migrations create my-saas-chat-db create_tables
```

**Edit migration file** (`migrations/0001_create_tables.sql`):

```sql
-- Usage Tracking Table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  service TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  tokens INTEGER DEFAULT 0,
  cost REAL DEFAULT 0,
  timestamp TEXT NOT NULL,
  metadata TEXT
);

CREATE INDEX idx_usage_user ON usage_tracking(user_id);
CREATE INDEX idx_usage_timestamp ON usage_tracking(timestamp);

-- Rate Limiting Table
CREATE TABLE IF NOT EXISTS rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  count INTEGER DEFAULT 1,
  reset_at TEXT NOT NULL
);

CREATE INDEX idx_ratelimit_key ON rate_limits(key);

-- Analytics Table
CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  user_id TEXT,
  data TEXT,
  timestamp TEXT NOT NULL
);

CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_timestamp ON analytics_events(timestamp);
```

**Apply migrations:**

```bash
# Apply to local development
wrangler d1 migrations apply my-saas-chat-db --local

# Apply to production (later)
wrangler d1 migrations apply my-saas-chat-db --remote
```

**Verify:**

```bash
wrangler d1 execute my-saas-chat-db --local --command="SELECT name FROM sqlite_master WHERE type='table';"
# Should show: usage_tracking, rate_limits, analytics_events
```

**Estimated Time:** 5 minutes

---

### Vectorize Index (Vector Database)

**Purpose:** Document embeddings, semantic search, RAG

**Free Tier Limits:**
- 5 million vector dimensions/month
- 30 million queries/month
- FREE for beta!

**Creation:**

```bash
# Create Vectorize index
wrangler vectorize create document-vectors \
  --dimensions=768 \
  --metric=cosine

# Expected output:
# ✅ Successfully created index 'document-vectors'
# [[vectorize]]
# binding = "VECTORIZE"
# index_name = "document-vectors"
```

**Update `wrangler.toml`:**

```toml
[[vectorize]]
binding = "VECTORIZE"
index_name = "document-vectors"
```

**Verify:**

```bash
wrangler vectorize list
# Should show: document-vectors (768 dimensions, cosine)
```

**Estimated Time:** 2 minutes

---

### Workers AI Binding

**Purpose:** FREE AI inference (embeddings, LLM)

**Already configured in `wrangler.toml`:**

```toml
[ai]
binding = "AI"
```

**Available Models (FREE!):**
- `@cf/baai/bge-base-en-v1.5` - Embeddings (768d)
- `@cf/meta/llama-2-7b-chat-int8` - LLM
- `@cf/mistral/mistral-7b-instruct-v0.1` - LLM
- `@cf/meta/llama-3-8b-instruct` - LLM

**No setup required - works out of the box!**

---

## Environment Configuration

### Step 1: Update Account ID

Edit `wrangler.toml`:

```toml
# Add your account ID (from earlier)
account_id = "your_account_id_here"
```

### Step 2: Update Backend URLs

For production deployment:

```toml
[vars]
AUTH_SERVICE_URL = "https://auth.yourdomain.com"
CHAT_SERVICE_URL = "https://chat.yourdomain.com"
BILLING_SERVICE_URL = "https://billing.yourdomain.com"
ANALYTICS_SERVICE_URL = "https://analytics.yourdomain.com"
```

For local development, these are already set to `localhost`.

### Step 3: Set Secrets

Secrets are encrypted environment variables.

```bash
# JWT secret (IMPORTANT: Use same as backend!)
wrangler secret put JWT_SECRET
# Enter secret when prompted
# Paste your backend JWT secret (from backend/.env)

# OpenAI API key (for complex queries fallback)
wrangler secret put OPENAI_API_KEY
# Enter your OpenAI API key (sk-...)

# Stripe webhook secret (for billing)
wrangler secret put STRIPE_WEBHOOK_SECRET
# Enter your Stripe webhook secret (whsec_...)
```

**Important Notes:**
- Secrets are **environment-specific** (dev, staging, production)
- Use same `JWT_SECRET` as backend for token compatibility
- Never commit secrets to Git

**Estimated Time:** 5 minutes

### Step 4: Create .dev.vars (Local Development)

```bash
# Copy example
cp .dev.vars.example .dev.vars

# Edit with your values
nano .dev.vars
```

**Example `.dev.vars`:**

```env
JWT_SECRET="your-jwt-secret-here-min-32-chars"
OPENAI_API_KEY="sk-..."
STRIPE_WEBHOOK_SECRET="whsec_..."
AUTH_SERVICE_URL="http://localhost:3001"
CHAT_SERVICE_URL="http://localhost:3003"
BILLING_SERVICE_URL="http://localhost:3004"
ANALYTICS_SERVICE_URL="http://localhost:3005"
LOG_LEVEL="debug"
```

**Note:** `.dev.vars` is gitignored automatically.

---

## Local Development

### Start Development Server

```bash
npm run dev
```

**Expected Output:**

```
⛅️ wrangler 3.x.x
------------------
wrangler dev src/index.ts

⎔ Starting local server...
[wrangler:inf] Ready on http://localhost:8787
```

### Test Health Check

```bash
curl http://localhost:8787/health
```

**Expected Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-11-15T10:30:00.000Z",
  "edge": "unknown",
  "environment": "development",
  "version": "1.0.0"
}
```

### Test CORS

```bash
curl -X OPTIONS http://localhost:8787/api/auth/login \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

**Should see CORS headers:**

```
< Access-Control-Allow-Origin: http://localhost:3000
< Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
< Access-Control-Allow-Credentials: true
```

### Test 404 Handler

```bash
curl http://localhost:8787/nonexistent
```

**Expected Response:**

```json
{
  "error": "Not Found",
  "message": "Route GET /nonexistent not found",
  "timestamp": "2024-11-15T10:30:00.000Z"
}
```

**Estimated Time:** 5 minutes

---

## Deployment

### Deploy to Staging

```bash
npm run deploy:staging
```

**Expected Output:**

```
Total Upload: xx.xx KiB / gzip: xx.xx KiB
Uploaded my-saas-chat-gateway-staging (x.xx sec)
Published my-saas-chat-gateway-staging (x.xx sec)
  https://my-saas-chat-gateway-staging.<your-subdomain>.workers.dev
```

### Deploy to Production

```bash
npm run deploy:production
```

**Expected Output:**

```
Total Upload: xx.xx KiB / gzip: xx.xx KiB
Uploaded my-saas-chat-gateway (x.xx sec)
Published my-saas-chat-gateway (x.xx sec)
  https://my-saas-chat-gateway.<your-subdomain>.workers.dev
```

### Custom Domain (Optional)

1. **Add domain to Cloudflare**
   - Dashboard → Add site → Enter domain

2. **Update DNS**
   - Follow Cloudflare instructions to update nameservers

3. **Configure route in `wrangler.toml`:**

```toml
[[routes]]
pattern = "api.yourdomain.com/*"
zone_name = "yourdomain.com"
```

4. **Deploy:**

```bash
wrangler deploy
```

Your worker will now be available at `https://api.yourdomain.com`

**Estimated Time:** 10 minutes (15 min if custom domain)

---

## Verification

### Checklist

- [ ] Wrangler CLI installed and authenticated
- [ ] KV namespace created and configured
- [ ] D1 database created with migrations
- [ ] Vectorize index created
- [ ] Secrets set (JWT_SECRET, OPENAI_API_KEY, etc.)
- [ ] `.dev.vars` created for local development
- [ ] Local dev server running (`npm run dev`)
- [ ] Health check returns 200
- [ ] CORS working
- [ ] Deployed to staging
- [ ] Deployed to production

### Verification Commands

```bash
# Check Wrangler auth
wrangler whoami

# List KV namespaces
wrangler kv:namespace list

# List D1 databases
wrangler d1 list

# List Vectorize indexes
wrangler vectorize list

# Test local endpoint
curl http://localhost:8787/health

# Test deployed endpoint
curl https://my-saas-chat-gateway.<your-subdomain>.workers.dev/health
```

---

## Troubleshooting

### Wrangler Not Found

**Error:**

```
wrangler: command not found
```

**Solution:**

```bash
# Install globally
npm install -g wrangler

# Or use npx
npx wrangler --version
```

---

### Login Failed

**Error:**

```
Error: Failed to authenticate
```

**Solution:**

1. Clear Wrangler cache:

```bash
rm -rf ~/.wrangler
```

2. Login again:

```bash
wrangler login
```

3. If still failing, use API token:

```bash
export CLOUDFLARE_API_TOKEN="your_api_token_here"
wrangler whoami
```

---

### KV/D1/Vectorize Not Working Locally

**Error:**

```
Error: KV binding not found
```

**Solution:**

1. Ensure IDs are in `wrangler.toml`
2. Restart dev server:

```bash
npm run dev
```

3. For D1, apply migrations:

```bash
wrangler d1 migrations apply my-saas-chat-db --local
```

---

### Port 8787 Already in Use

**Error:**

```
Error: listen EADDRINUSE: address already in use :::8787
```

**Solution:**

```bash
# Find process using port 8787
lsof -i :8787  # macOS/Linux
netstat -ano | findstr :8787  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /F /PID <PID>  # Windows

# Or use different port
wrangler dev --port 8788
```

---

### CORS Errors in Browser

**Error:**

```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Solution:**

1. Update allowed origins in `src/index.ts`:

```typescript
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true,
}));
```

2. Restart dev server

---

### JWT Verification Fails

**Error:**

```
401 Unauthorized - Invalid token
```

**Solution:**

1. Ensure `JWT_SECRET` matches backend:

```bash
# Check backend secret
cat backend/services/auth-service/.env | grep JWT_SECRET

# Set same secret in Workers
wrangler secret put JWT_SECRET
```

2. Verify token format:

```
Authorization: Bearer <token>
```

---

### Workers AI Model Not Found

**Error:**

```
Error: Model '@cf/baai/bge-base-en-v1.5' not found
```

**Solution:**

1. Check model name spelling
2. Ensure `[ai]` binding exists in `wrangler.toml`
3. Workers AI is in beta - some models may change

**Alternative models:**

- `@cf/baai/bge-small-en-v1.5` (384d)
- `@cf/baai/bge-large-en-v1.5` (1024d)

---

### Deployment Fails

**Error:**

```
Error: No account_id in wrangler.toml
```

**Solution:**

Add account ID to `wrangler.toml`:

```toml
account_id = "your_account_id_here"
```

---

## Next Steps

✅ **Agent 1 Complete!**

**Continue to Agent 2:**
- Implement router and auth middleware
- JWT verification with KV caching
- Request logging and error handling

**Files to create in Agent 2:**
- `src/middleware/auth.ts`
- `src/middleware/logger.ts`
- Update `src/index.ts` with routes

---

## Performance Tips

### Local Development

- Use `--local` flag for D1 queries (faster)
- Enable `--live-reload` for instant updates
- Use `wrangler tail` to see real-time logs

### Production

- Enable compression (automatic in Cloudflare)
- Use KV for caching (60%+ hit rate)
- Monitor with Cloudflare Analytics (free)

### Cost Optimization

- Cache aggressively (reduce backend calls)
- Use Workers AI instead of OpenAI (FREE)
- Batch operations where possible

---

## Support

**Issues?**

1. Check this troubleshooting guide
2. Review Cloudflare Workers docs: https://developers.cloudflare.com/workers/
3. Ask in project Discord/Slack
4. Open GitHub issue

**Estimated Total Setup Time:** 30-45 minutes

---

**Built by Agent 1 with ❤️**
