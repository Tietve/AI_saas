# Configuration Guide

**Complete reference for environment variables and configuration management**

Last Updated: 2025-11-15

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Naming Conventions](#naming-conventions)
4. [Configuration Categories](#configuration-categories)
5. [Service-Specific Configuration](#service-specific-configuration)
6. [Environment Variables Reference](#environment-variables-reference)
7. [Security Best Practices](#security-best-practices)
8. [Migration Guide](#migration-guide)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The MY-SAAS-CHAT project uses a **standardized configuration system** with:

- **Zod validation** for type-safe runtime configuration
- **Consistent naming conventions** across all services
- **Automatic validation on startup** with helpful error messages
- **Shared configuration schemas** for code reuse
- **Production security checks** for secrets and credentials

### Configuration Architecture

```
backend/
├── shared/
│   └── config/
│       ├── schema.ts      # Zod schemas for all config categories
│       ├── validator.ts   # Validation utilities
│       └── index.ts       # Main exports
├── services/
│   ├── auth-service/
│   │   ├── .env.example   # Service-specific env template
│   │   └── src/config/
│   │       └── env.ts     # Loads & validates config
│   ├── chat-service/
│   │   ├── .env.example
│   │   └── src/config/env.ts
│   └── ...
└── .env.example           # Root environment template
```

---

## Quick Start

### 1. Create Your Environment File

```bash
# Copy root template
cp .env.example .env

# For specific services (optional - they inherit from root)
cd backend/services/auth-service
cp .env.example .env
```

### 2. Fill in Required Values

Edit `.env` and replace placeholder values:

```bash
# REQUIRED: Generate strong secrets
openssl rand -base64 48  # Use output for AUTH_SECRET
openssl rand -base64 48  # Use output for JWT_SECRET
openssl rand -base64 48  # Use output for REFRESH_TOKEN_SECRET

# REQUIRED: Database connections
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
REDIS_URL="redis://localhost:6379"

# REQUIRED: AI Provider API keys
OPENAI_API_KEY="sk-..."
```

### 3. Validate Configuration

Services automatically validate configuration on startup. You'll see:

✅ **Success:**
```
✅ Configuration validation successful
   Service: auth-service
```

❌ **Failure:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ❌ CONFIGURATION VALIDATION FAILED
  Service: auth-service
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The following environment variables are invalid or missing:

1. OPENAI_API_KEY
   Error: Required
   Code: invalid_type
```

---

## Naming Conventions

All environment variables follow **consistent prefixes** for easy identification:

| Prefix | Category | Examples |
|--------|----------|----------|
| `CLOUDFLARE_*` | Cloudflare services | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` |
| `OPENAI_*` | OpenAI API | `OPENAI_API_KEY`, `OPENAI_MODEL` |
| `ANTHROPIC_*` | Anthropic Claude API | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` |
| `GOOGLE_*` | Google AI/OAuth | `GOOGLE_AI_API_KEY`, `GOOGLE_CLIENT_ID` |
| `GROQ_*` | Groq API | `GROQ_API_KEY`, `GROQ_MODEL` |
| `DATABASE_*` | PostgreSQL | `DATABASE_URL`, `DATABASE_POOL_MAX` |
| `MONGODB_*` | MongoDB | `MONGODB_URL`, `MONGODB_DATABASE` |
| `REDIS_*` | Redis | `REDIS_URL`, `REDIS_PASSWORD` |
| `CLICKHOUSE_*` | ClickHouse | `CLICKHOUSE_HOST`, `CLICKHOUSE_PORT` |
| `PINECONE_*` | Pinecone vector DB | `PINECONE_API_KEY`, `PINECONE_INDEX_NAME` |
| `AWS_*` | AWS services | `AWS_ACCESS_KEY_ID`, `AWS_S3_BUCKET` |
| `STRIPE_*` | Stripe payments | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| `RABBITMQ_*` | RabbitMQ | `RABBITMQ_URL`, `RABBITMQ_EXCHANGE` |
| `SMTP_*` | Email/SMTP | `SMTP_HOST`, `SMTP_USER` |
| `SENTRY_*` | Error tracking | `SENTRY_DSN`, `SENTRY_ENVIRONMENT` |
| `JAEGER_*` | Distributed tracing | `JAEGER_AGENT_HOST`, `JAEGER_SAMPLER_TYPE` |
| `PROMETHEUS_*` | Metrics | `PROMETHEUS_ENABLED`, `PROMETHEUS_PORT` |

---

## Configuration Categories

### 1. Base Configuration

**Always required** for all services.

```bash
# Environment
NODE_ENV=development              # development | staging | production | test
DEPLOYMENT_ENV=production         # Optional deployment identifier
LOG_LEVEL=info                    # debug | info | warn | error

# Service port
PORT=3001                          # Service-specific port
```

### 2. Database Configuration

#### PostgreSQL (Primary Database)

```bash
DATABASE_URL="postgresql://user:password@host:5432/dbname"
DATABASE_POOL_MIN=2               # Min connections (default: 2)
DATABASE_POOL_MAX=10              # Max connections (default: 10)
DATABASE_TIMEOUT=30000            # Timeout in ms (default: 30000)
```

#### MongoDB (Analytics & Logs)

```bash
MONGODB_URL="mongodb://user:password@host:27017/admin"
MONGODB_DATABASE="analytics"     # Database name
MONGODB_POOL_SIZE=10             # Connection pool size (default: 10)
```

#### Redis (Cache & Sessions)

```bash
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""                 # Optional password
REDIS_DB=0                        # Database number (default: 0)
REDIS_KEY_PREFIX="saas:"         # Key prefix (default: "saas:")
REDIS_CONNECT_TIMEOUT=10000      # Connect timeout ms (default: 10000)
REDIS_COMMAND_TIMEOUT=5000       # Command timeout ms (default: 5000)
```

#### ClickHouse (Analytics)

```bash
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=""
CLICKHOUSE_DATABASE=default
```

### 3. AI Provider Configuration

#### OpenAI

```bash
OPENAI_API_KEY="sk-..."          # REQUIRED
OPENAI_ORG_ID=""                 # Optional organization ID
OPENAI_MODEL="gpt-4"             # Default model (default: gpt-4)
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"  # Embedding model
OPENAI_MAX_TOKENS=4096           # Max tokens (default: 4096)
OPENAI_TEMPERATURE=0.7           # Temperature 0-2 (default: 0.7)
OPENAI_TIMEOUT=60000             # Timeout in ms (default: 60000)
```

#### Anthropic (Claude)

```bash
ANTHROPIC_API_KEY="sk-ant-..."   # REQUIRED
ANTHROPIC_MODEL="claude-3-5-sonnet-20241022"  # Model name
ANTHROPIC_MAX_TOKENS=4096        # Max tokens (default: 4096)
ANTHROPIC_TIMEOUT=60000          # Timeout in ms (default: 60000)
```

#### Google AI

```bash
GOOGLE_AI_API_KEY="..."          # REQUIRED
GOOGLE_AI_MODEL="gemini-pro"     # Model name (default: gemini-pro)
```

#### Groq

```bash
GROQ_API_KEY="..."               # REQUIRED
GROQ_MODEL="llama2-70b-4096"     # Model name (default: llama2-70b-4096)
```

#### Cloudflare Workers AI

```bash
CLOUDFLARE_ACCOUNT_ID="..."      # REQUIRED
CLOUDFLARE_API_TOKEN="..."       # REQUIRED
CLOUDFLARE_AI_GATEWAY_ID=""      # Optional gateway ID
CLOUDFLARE_AI_MODEL="@cf/meta/llama-2-7b-chat-int8"  # Default model
```

### 4. Vector Database

#### Pinecone

```bash
PINECONE_API_KEY="..."           # REQUIRED
PINECONE_ENVIRONMENT="us-west1-gcp"  # REQUIRED (e.g., us-west1-gcp)
PINECONE_INDEX_NAME="prompt-upgrader"  # REQUIRED
PINECONE_NAMESPACE=""            # Optional namespace
```

### 5. Payment & Billing

#### Stripe

```bash
STRIPE_SECRET_KEY="sk_live_..."  # REQUIRED
STRIPE_PUBLISHABLE_KEY="pk_live_..."  # REQUIRED
STRIPE_WEBHOOK_SECRET="whsec_..."  # REQUIRED
STRIPE_PRICE_ID_FREE="price_..."  # Optional
STRIPE_PRICE_ID_PRO="price_..."   # Optional
STRIPE_PRICE_ID_ENTERPRISE="price_..."  # Optional
```

### 6. Message Queue

#### RabbitMQ

```bash
RABBITMQ_URL="amqp://user:pass@host:5672"  # REQUIRED
RABBITMQ_EXCHANGE="analytics.events"  # Exchange name (default: analytics.events)
RABBITMQ_QUEUE=""                # Queue name (optional)
RABBITMQ_PREFETCH=10             # Prefetch count (default: 10)
RABBITMQ_HEARTBEAT=60            # Heartbeat interval seconds (default: 60)
```

### 7. Email Configuration

#### SMTP

```bash
SMTP_HOST="smtp.gmail.com"       # REQUIRED
SMTP_PORT=587                    # REQUIRED
SMTP_SECURE=false                # Use TLS (default: false)
SMTP_USER="your-email@gmail.com"  # REQUIRED
SMTP_PASSWORD="app-password"     # REQUIRED
SMTP_FROM="noreply@yourdomain.com"  # REQUIRED
SMTP_FROM_NAME="My SaaS Chat"    # Sender name (default: My SaaS Chat)
```

### 8. Authentication & Authorization

#### JWT/Auth

```bash
AUTH_SECRET="..."                # REQUIRED (min 32 chars in production)
JWT_SECRET="..."                 # REQUIRED (min 32 chars in production)
REFRESH_TOKEN_SECRET="..."       # REQUIRED (min 32 chars in production)
JWT_EXPIRY="15m"                 # Access token expiry (default: 15m)
REFRESH_TOKEN_EXPIRY="7d"        # Refresh token expiry (default: 7d)
PASSWORD_RESET_EXPIRY="1h"       # Password reset expiry (default: 1h)
REQUIRE_EMAIL_VERIFICATION=false  # Require email verification (default: false)
MAX_LOGIN_ATTEMPTS=5             # Max login attempts (default: 5)
ACCOUNT_LOCKOUT_DURATION="30m"   # Lockout duration (default: 30m)
```

**Security:** Generate secrets with: `openssl rand -base64 48`

#### Google OAuth

```bash
GOOGLE_CLIENT_ID="..."           # REQUIRED
GOOGLE_CLIENT_SECRET="..."       # REQUIRED
GOOGLE_REDIRECT_URI="https://..."  # Optional
```

#### GitHub OAuth

```bash
GITHUB_CLIENT_ID="..."           # REQUIRED
GITHUB_CLIENT_SECRET="..."       # REQUIRED
GITHUB_REDIRECT_URI="https://..."  # Optional
```

### 9. Monitoring & Observability

#### Sentry (Error Tracking)

```bash
SENTRY_DSN="https://...@sentry.io/..."  # Optional
SENTRY_ENVIRONMENT="development"  # Environment (default: development)
SENTRY_TRACES_SAMPLE_RATE=0.1    # Trace sample rate 0-1 (default: 0.1)
SENTRY_PROFILES_SAMPLE_RATE=0.1  # Profile sample rate 0-1 (default: 0.1)
SENTRY_DEBUG=false               # Debug mode (default: false)
```

#### Jaeger (Distributed Tracing)

```bash
JAEGER_AGENT_HOST="localhost"    # Agent host (default: localhost)
JAEGER_AGENT_PORT=6831           # Agent port (default: 6831)
JAEGER_SAMPLER_TYPE="probabilistic"  # const | probabilistic | ratelimiting | remote
JAEGER_SAMPLER_PARAM=0.1         # Sampler parameter (default: 0.1)
JAEGER_SERVICE_NAME=""           # Optional service name override
```

#### Prometheus (Metrics)

```bash
PROMETHEUS_ENABLED=false         # Enable Prometheus (default: false)
PROMETHEUS_PORT=9090             # Metrics port (default: 9090)
PROMETHEUS_PATH="/metrics"       # Metrics path (default: /metrics)
```

### 10. Cloud Storage

#### AWS S3

```bash
AWS_REGION="us-east-1"           # Region (default: us-east-1)
AWS_ACCESS_KEY_ID="..."          # REQUIRED
AWS_SECRET_ACCESS_KEY="..."      # REQUIRED
AWS_S3_BUCKET=""                 # Optional bucket name
AWS_S3_ENDPOINT=""               # Optional custom endpoint
```

#### Cloudflare R2

```bash
CLOUDFLARE_R2_ACCOUNT_ID="..."   # REQUIRED
CLOUDFLARE_R2_ACCESS_KEY_ID="..."  # REQUIRED
CLOUDFLARE_R2_SECRET_ACCESS_KEY="..."  # REQUIRED
CLOUDFLARE_R2_BUCKET="..."       # REQUIRED
CLOUDFLARE_R2_ENDPOINT=""        # Optional custom endpoint
```

### 11. Rate Limiting & Quotas

#### Rate Limiting

```bash
RATE_LIMIT_WINDOW_MS=900000      # Window in ms (default: 900000 = 15 min)
RATE_LIMIT_MAX_REQUESTS=100      # Max requests per window (default: 100)
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false  # Skip successful (default: false)
```

#### Token Quotas

```bash
FREE_MONTHLY_TOKEN_QUOTA=100000         # Free tier (default: 100000)
PRO_MONTHLY_TOKEN_QUOTA=1000000         # Pro tier (default: 1000000)
ENTERPRISE_MONTHLY_TOKEN_QUOTA=10000000  # Enterprise tier (default: 10000000)
```

#### API Usage Quotas

```bash
# Prompt Upgrades
FREE_MONTHLY_UPGRADE_QUOTA=1000         # Free tier (default: 1000)
PRO_MONTHLY_UPGRADE_QUOTA=10000         # Pro tier (default: 10000)
ENTERPRISE_MONTHLY_UPGRADE_QUOTA=100000  # Enterprise tier (default: 100000)

# Embeddings
FREE_MONTHLY_EMBEDDING_QUOTA=10000         # Free tier (default: 10000)
PRO_MONTHLY_EMBEDDING_QUOTA=100000         # Pro tier (default: 100000)
ENTERPRISE_MONTHLY_EMBEDDING_QUOTA=1000000  # Enterprise tier (default: 1000000)
```

### 12. Caching & Performance

#### Cache TTL

```bash
CACHE_TTL_DEFAULT=3600           # Default TTL in seconds (default: 3600 = 1 hour)
SUMMARY_CACHE_TTL=604800         # Summary TTL (default: 604800 = 7 days)
EMBEDDING_CACHE_TTL=2592000      # Embedding TTL (default: 2592000 = 30 days)
RAG_CACHE_TTL=3600               # RAG TTL (default: 3600 = 1 hour)
```

#### Performance Limits

```bash
MAX_CONTEXT_MESSAGES=10          # Max context messages (default: 10)
MAX_RAG_RESULTS=5                # Top K RAG results (default: 5)
MAX_SUMMARY_LENGTH=500           # Max summary characters (default: 500)
```

### 13. File Upload & Storage

```bash
MAX_FILE_SIZE=10485760           # Max file size in bytes (default: 10MB)
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/gif,application/pdf,text/plain"
UPLOAD_DIR="/app/uploads"        # Upload directory (default: /app/uploads)
```

### 14. Frontend & CORS

```bash
FRONTEND_URL="https://yourdomain.com"  # REQUIRED
FRONTEND_PORT=3000               # Frontend port (default: 3000)
CORS_ORIGIN="https://yourdomain.com,https://www.yourdomain.com"  # REQUIRED
CORS_CREDENTIALS=true            # Allow credentials (default: true)
```

### 15. Security Headers

```bash
HELMET_ENABLED=true              # Enable Helmet.js (default: true)
CSP_ENABLED=true                 # Enable CSP (default: true)
HSTS_MAX_AGE=31536000            # HSTS max age in seconds (default: 1 year)
```

### 16. Feature Flags

```bash
FEATURE_CHAT_ENABLED=true
FEATURE_SUMMARIZER_ENABLED=true
FEATURE_RAG_ENABLED=true
FEATURE_PROMPT_UPGRADER_ENABLED=true
FEATURE_PII_DETECTION_ENABLED=true
FEATURE_ANALYTICS_ENABLED=true
FEATURE_BILLING_ENABLED=true
```

### 17. Maintenance Mode

```bash
MAINTENANCE_MODE=false           # Enable maintenance mode (default: false)
MAINTENANCE_MESSAGE="We are currently performing maintenance. Please try again later."
MAINTENANCE_ALLOWED_IPS="127.0.0.1,::1"  # Allowed IPs (default: localhost)
```

---

## Service-Specific Configuration

### Auth Service (Port 3001)

**Required:**
- `DATABASE_URL` - PostgreSQL
- `REDIS_URL` - Redis for sessions
- `AUTH_SECRET`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET` - Authentication
- `RABBITMQ_URL` - Analytics events

**Optional:**
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - OAuth
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` - OAuth
- `SENTRY_DSN` - Error tracking

**Example `.env`:**
```bash
PORT=3001
NODE_ENV=development
DATABASE_URL="postgresql://..."
REDIS_URL="redis://localhost:6379"
AUTH_SECRET="..."
JWT_SECRET="..."
REFRESH_TOKEN_SECRET="..."
RABBITMQ_URL="amqp://..."
```

### Chat Service (Port 3002)

**Required:**
- `DATABASE_URL` - PostgreSQL
- `OPENAI_API_KEY` - AI chat
- `AUTH_SECRET` - JWT verification
- `FRONTEND_URL` - CORS
- `RABBITMQ_URL` - Analytics events

**Optional:**
- `GEMINI_API_KEY` - Google AI
- `SENTRY_DSN` - Error tracking

**Example `.env`:**
```bash
PORT=3002
NODE_ENV=development
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
AUTH_SECRET="..."
FRONTEND_URL="http://localhost:3000"
RABBITMQ_URL="amqp://..."
```

### Billing Service (Port 3003)

**Required:**
- `DATABASE_URL` - PostgreSQL
- `STRIPE_SECRET_KEY` - Stripe payments
- `STRIPE_PUBLISHABLE_KEY` - Stripe
- `STRIPE_WEBHOOK_SECRET` - Stripe webhooks
- `AUTH_SECRET` - JWT verification
- `RABBITMQ_URL` - Analytics events

**Example `.env`:**
```bash
PORT=3003
NODE_ENV=development
DATABASE_URL="postgresql://..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
AUTH_SECRET="..."
RABBITMQ_URL="amqp://..."
```

### Analytics Service (Port 3004)

**Required:**
- `CLICKHOUSE_HOST`, `CLICKHOUSE_PORT` - ClickHouse database
- `RABBITMQ_URL` - Message queue

**Example `.env`:**
```bash
PORT=3004
NODE_ENV=development
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123
CLICKHOUSE_USER=analytics
CLICKHOUSE_PASSWORD="..."
CLICKHOUSE_DATABASE=analytics_db
RABBITMQ_URL="amqp://..."
```

### Orchestrator Service (Port 3006)

**Required:**
- `DATABASE_URL` - PostgreSQL
- `REDIS_URL` - Redis for caching
- `OPENAI_API_KEY` - AI features
- `PINECONE_API_KEY`, `PINECONE_ENVIRONMENT`, `PINECONE_INDEX_NAME` - Vector DB

**Example `.env`:**
```bash
PORT=3006
NODE_ENV=development
DATABASE_URL="postgresql://..."
REDIS_URL="redis://localhost:6379"
OPENAI_API_KEY="sk-..."
PINECONE_API_KEY="..."
PINECONE_ENVIRONMENT="us-west1-gcp"
PINECONE_INDEX_NAME="prompt-upgrader"
```

---

## Security Best Practices

### 1. Generate Strong Secrets

**Never use example values in production!**

```bash
# Generate strong secrets (minimum 32 characters)
openssl rand -base64 48

# Use different secrets for each environment
# ❌ BAD: Same secret in dev/staging/prod
# ✅ GOOD: Different secrets per environment
```

### 2. Protect Your .env Files

```bash
# Add to .gitignore
.env
.env.local
.env.production
.env.*.local

# ✅ Commit: .env.example
# ❌ Never commit: .env
```

### 3. Use Secret Management in Production

For production, use:
- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Azure Key Vault**
- **GCP Secret Manager**

Don't rely solely on `.env` files in production!

### 4. Validate on Startup

The shared configuration system automatically validates:
- ✅ All required variables are present
- ✅ Values are correctly formatted
- ✅ Secrets are strong enough (production)
- ✅ No default/example values (production)

### 5. Environment-Specific Configuration

```bash
# Development
NODE_ENV=development
LOG_LEVEL=debug
SENTRY_DEBUG=true

# Production
NODE_ENV=production
LOG_LEVEL=info
SENTRY_DEBUG=false
REQUIRE_EMAIL_VERIFICATION=true
```

---

## Migration Guide

### From Old to New Variable Names

If you're migrating from older configuration, update these variables:

| Old Name | New Name | Notes |
|----------|----------|-------|
| `POSTGRES_*` | `DATABASE_URL` | Use full connection URL |
| `MONGO_*` | `MONGODB_URL` | Use full connection URL |
| `PINECONE_ENV` | `PINECONE_ENVIRONMENT` | More descriptive |
| `GEMINI_API_KEY` | `GOOGLE_AI_API_KEY` | Consistent with other Google services |
| `CLICKHOUSE_DB` | `CLICKHOUSE_DATABASE` | Consistent naming |

### Step-by-Step Migration

1. **Backup your current .env**
   ```bash
   cp .env .env.backup
   ```

2. **Copy new template**
   ```bash
   cp .env.example .env.new
   ```

3. **Transfer values**
   - Copy your API keys and secrets from `.env.backup`
   - Update variable names per migration table
   - Generate new secrets where needed

4. **Validate**
   ```bash
   npm run dev  # Service will validate on startup
   ```

5. **Replace old file**
   ```bash
   mv .env.new .env
   ```

---

## Troubleshooting

### Configuration Validation Failed

**Error:**
```
❌ CONFIGURATION VALIDATION FAILED
Missing required environment variable: OPENAI_API_KEY
```

**Solution:**
1. Check `.env` file exists in project root
2. Verify variable is set: `OPENAI_API_KEY="sk-..."`
3. Restart service after changes

### Secret Too Short in Production

**Error:**
```
CRITICAL SECURITY ERROR: AUTH_SECRET must be at least 32 characters
```

**Solution:**
```bash
# Generate strong secret
openssl rand -base64 48

# Add to .env
AUTH_SECRET="generated-value-here"
```

### Database Connection Failed

**Error:**
```
Error: Invalid PostgreSQL connection URL
```

**Solution:**
```bash
# Verify connection string format
DATABASE_URL="postgresql://username:password@hostname:5432/database_name"

# Test connection
psql "postgresql://username:password@hostname:5432/database_name"
```

### Redis Connection Timeout

**Error:**
```
Error: Redis connection timeout
```

**Solution:**
```bash
# Check Redis is running
docker ps | grep redis

# Verify connection string
REDIS_URL="redis://localhost:6379"

# Increase timeout (optional)
REDIS_CONNECT_TIMEOUT=20000
```

### Port Already in Use

**Error:**
```
Error: Port 3001 is already in use
```

**Solution:**
```bash
# Find process using port
lsof -i :3001  # Mac/Linux
netstat -ano | findstr :3001  # Windows

# Kill process or change port
PORT=3011
```

### .env File Not Loaded

**Error:**
```
⚠️ No .env file found
Using environment variables from system/shell
```

**Solution:**
```bash
# Verify .env exists
ls -la .env

# Create from template
cp .env.example .env

# Check file location (should be in project root)
pwd
```

---

## Examples

### Example 1: Auth Service Configuration

```typescript
// backend/services/auth-service/src/config/env.ts
import { z } from 'zod';
import {
  baseConfigSchema,
  postgresConfigSchema,
  redisConfigSchema,
  authConfigSchema,
  rabbitmqConfigSchema,
  sentryConfigSchema,
  validateConfig
} from '@saas/shared/config';

// Compose schemas needed for auth service
const authServiceConfigSchema = baseConfigSchema
  .merge(postgresConfigSchema)
  .merge(redisConfigSchema)
  .merge(authConfigSchema)
  .merge(rabbitmqConfigSchema)
  .merge(sentryConfigSchema.partial()); // Sentry optional

// Validate on startup
export const config = validateConfig(authServiceConfigSchema, {
  serviceName: 'auth-service'
});

export type AuthServiceConfig = typeof config;
```

### Example 2: Chat Service with Optional AI Providers

```typescript
// backend/services/chat-service/src/config/env.ts
import { z } from 'zod';
import {
  baseConfigSchema,
  postgresConfigSchema,
  openaiConfigSchema,
  googleAIConfigSchema,
  authConfigSchema,
  frontendConfigSchema,
  validateConfig
} from '@saas/shared/config';

const chatServiceConfigSchema = baseConfigSchema
  .merge(postgresConfigSchema)
  .merge(openaiConfigSchema)
  .merge(googleAIConfigSchema.partial()) // Google AI optional
  .merge(authConfigSchema.pick({ AUTH_SECRET: true })) // Only need AUTH_SECRET
  .merge(frontendConfigSchema.pick({ FRONTEND_URL: true, CORS_ORIGIN: true }));

export const config = validateConfig(chatServiceConfigSchema, {
  serviceName: 'chat-service'
});
```

### Example 3: Custom Service-Specific Variables

```typescript
// Add custom variables to schema
const myServiceConfigSchema = baseConfigSchema
  .merge(postgresConfigSchema)
  .merge(z.object({
    // Custom variables for this service
    MY_SERVICE_CUSTOM_VAR: z.string().min(1),
    MY_SERVICE_TIMEOUT: z.coerce.number().positive().default(30000),
  }));

export const config = validateConfig(myServiceConfigSchema, {
  serviceName: 'my-service'
});
```

---

## Reference Links

- **Zod Documentation:** https://zod.dev/
- **Environment Variables Best Practices:** https://12factor.net/config
- **Secret Management:** AWS Secrets Manager, HashiCorp Vault
- **OpenSSL Random:** `man openssl-rand`

---

## Support

For configuration issues:
1. Check this documentation
2. Review `.env.example` for correct format
3. Enable debug logging: `LOG_LEVEL=debug`
4. Check service-specific logs on startup

**Need help?** Open an issue with:
- Error message from startup validation
- Sanitized `.env` (remove secrets!)
- Service name and version
