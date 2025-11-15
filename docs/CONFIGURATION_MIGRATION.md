# Configuration Migration Guide

**Migrate from old to new standardized configuration naming**

Last Updated: 2025-11-15

---

## Overview

This guide helps you migrate from the old configuration system to the new **standardized configuration** with Zod validation.

### What Changed?

1. **Standardized naming conventions** - All variables now use consistent prefixes
2. **Zod validation** - Runtime type-safety and validation
3. **Shared configuration schemas** - Reusable across services
4. **Better error messages** - Clear validation errors on startup
5. **Production security checks** - Automatic secret strength validation

---

## Variable Name Changes

### Database Configuration

| Old Name | New Name | Notes |
|----------|----------|-------|
| `POSTGRES_USER` | Use `DATABASE_URL` | Full connection string |
| `POSTGRES_PASSWORD` | Use `DATABASE_URL` | Full connection string |
| `POSTGRES_DB` | Use `DATABASE_URL` | Full connection string |
| `POSTGRES_HOST` | Use `DATABASE_URL` | Full connection string |
| `POSTGRES_PORT` | Use `DATABASE_URL` | Full connection string |
| `MONGO_INITDB_ROOT_USERNAME` | Use `MONGODB_URL` | Full connection string |
| `MONGO_INITDB_ROOT_PASSWORD` | Use `MONGODB_URL` | Full connection string |
| `MONGODB_HOST` | Use `MONGODB_URL` | Full connection string |
| `MONGODB_PORT` | Use `MONGODB_URL` | Full connection string |
| `CLICKHOUSE_DB` | `CLICKHOUSE_DATABASE` | More descriptive |

**Old format:**
```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=mydb
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

**New format:**
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/mydb
```

### AI Provider Configuration

| Old Name | New Name | Notes |
|----------|----------|-------|
| `GEMINI_API_KEY` | `GOOGLE_AI_API_KEY` | Consistent with Google services |
| `EMBEDDING_MODEL` | `OPENAI_EMBEDDING_MODEL` | Scoped to OpenAI |
| `SUMMARIZER_MODEL` | Keep as is | Service-specific |
| `UPGRADER_MODEL` | Keep as is | Service-specific |
| `MAIN_LLM_MODEL` | `OPENAI_MODEL` | More specific |

**Old format:**
```bash
GEMINI_API_KEY=...
EMBEDDING_MODEL=text-embedding-3-small
MAIN_LLM_MODEL=gpt-4
```

**New format:**
```bash
GOOGLE_AI_API_KEY=...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_MODEL=gpt-4
```

### Vector Database Configuration

| Old Name | New Name | Notes |
|----------|----------|-------|
| `PINECONE_ENV` | `PINECONE_ENVIRONMENT` | More descriptive |
| N/A | **DEPRECATED: Pinecone removed** | Using pgvector now |

**Note:** Orchestrator service now uses **pgvector** (PostgreSQL extension) instead of Pinecone for cost optimization ($70/month savings).

**Migration:**
- Remove all `PINECONE_*` variables from orchestrator-service
- Ensure PostgreSQL has pgvector extension: `CREATE EXTENSION IF NOT EXISTS vector;`
- No configuration changes needed - vectors stored in PostgreSQL

### Redis Configuration

| Old Name | New Name | Notes |
|----------|----------|-------|
| `REDIS_HOST` | Use `REDIS_URL` | Full connection string |
| `REDIS_PORT` | Use `REDIS_URL` | Full connection string |

**Old format:**
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
```

**New format:**
```bash
REDIS_URL=redis://localhost:6379
```

### Monitoring Configuration

| Old Name | New Name | Notes |
|----------|----------|-------|
| No changes | No changes | Already standardized |

---

## Service-by-Service Migration

### Auth Service

**Required actions:**
1. ✅ Change `DATABASE_URL` format (if using old POSTGRES_* variables)
2. ✅ Change `REDIS_URL` format (if using old REDIS_HOST/PORT)
3. ✅ Ensure secrets are minimum 32 characters in production
4. ⚠️ Test authentication flows after migration

**Old `.env`:**
```bash
PORT=3001
POSTGRES_USER=postgres
POSTGRES_PASSWORD=mypassword
POSTGRES_DB=auth_db
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
REDIS_HOST=localhost
REDIS_PORT=6379
AUTH_SECRET=short
```

**New `.env`:**
```bash
PORT=3001
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/auth_db
REDIS_URL=redis://localhost:6379
AUTH_SECRET=generated-strong-secret-minimum-32-characters-here
```

### Chat Service

**Required actions:**
1. ✅ Rename `GEMINI_API_KEY` to `GOOGLE_AI_API_KEY`
2. ✅ Change database and Redis URLs
3. ✅ Update model configuration names
4. ⚠️ Test AI chat functionality

**Old `.env`:**
```bash
PORT=3002
DATABASE_URL=postgres://...  # Old format
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
EMBEDDING_MODEL=text-embedding-3-small
```

**New `.env`:**
```bash
PORT=3002
DATABASE_URL=postgresql://...  # New format
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=AIza...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

### Billing Service

**Required actions:**
1. ✅ Minimal changes (already mostly standardized)
2. ✅ Verify Stripe keys are correct

**No major changes needed.**

### Analytics Service

**Required actions:**
1. ✅ Rename `CLICKHOUSE_DB` to `CLICKHOUSE_DATABASE`
2. ⚠️ Test analytics data ingestion

**Old `.env`:**
```bash
CLICKHOUSE_DB=analytics_db
```

**New `.env`:**
```bash
CLICKHOUSE_DATABASE=analytics_db
```

### Orchestrator Service

**Required actions:**
1. ✅ **REMOVE all Pinecone configuration** (using pgvector now)
2. ✅ Rename AI model variables
3. ✅ Ensure PostgreSQL has pgvector extension installed
4. ⚠️ Test RAG and prompt upgrading features

**Old `.env`:**
```bash
DATABASE_URL=postgresql://...
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX_NAME=prompt-upgrader
EMBEDDING_MODEL=text-embedding-3-small
MAIN_LLM_MODEL=gpt-4
```

**New `.env`:**
```bash
DATABASE_URL=postgresql://...
# Pinecone removed - using pgvector instead!
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_MODEL=gpt-4
```

**Install pgvector:**
```sql
-- Run in PostgreSQL
CREATE EXTENSION IF NOT EXISTS vector;
```

### Email Worker

**Required actions:**
1. ✅ Minimal changes needed
2. ⚠️ Test email sending

**No major changes needed.**

---

## Migration Steps

### Step 1: Backup Current Configuration

```bash
# Backup all .env files
cp .env .env.backup
cd backend/services
for service in */; do
  if [ -f "$service/.env" ]; then
    cp "$service/.env" "$service/.env.backup"
  fi
done
```

### Step 2: Update Root Configuration

```bash
# Copy new template
cp .env.example .env.new

# Manually transfer values from .env.backup to .env.new
# Use the mapping table above for renamed variables

# Verify the new file
cat .env.new
```

### Step 3: Update Service Configurations

For each service:

```bash
cd backend/services/auth-service
cp .env.example .env.new
# Transfer values from .env.backup using mapping table
# Verify
cat .env.new
```

### Step 4: Validate Configuration

```bash
# Start each service and check for validation errors
cd backend/services/auth-service
npm run dev
# Should see: ✅ Configuration validation successful
```

If you see validation errors:
```
❌ CONFIGURATION VALIDATION FAILED
1. OPENAI_API_KEY
   Error: Required
   Code: invalid_type
```

Fix the errors and restart.

### Step 5: Test Each Service

After migration, test:

**Auth Service:**
- [ ] User registration
- [ ] User login
- [ ] JWT token generation
- [ ] OAuth flows (if configured)

**Chat Service:**
- [ ] AI chat functionality
- [ ] Document upload (if implemented)
- [ ] Different AI providers (if configured)

**Billing Service:**
- [ ] Stripe checkout
- [ ] Webhook handling
- [ ] Quota enforcement

**Analytics Service:**
- [ ] Event ingestion
- [ ] Data queries

**Orchestrator Service:**
- [ ] Prompt upgrading
- [ ] RAG functionality
- [ ] Semantic search

**Email Worker:**
- [ ] Email sending
- [ ] Queue processing

### Step 6: Replace Old Files

Only after successful testing:

```bash
# Root
mv .env.new .env

# Services
cd backend/services/auth-service
mv .env.new .env
# Repeat for other services
```

### Step 7: Clean Up

```bash
# Remove backups (optional)
rm .env.backup
rm backend/services/*/.env.backup
```

---

## Automated Migration Script

We provide a migration script to help with variable renaming:

```bash
# Run migration helper
node scripts/migrate-config.js

# This will:
# 1. Backup current .env files
# 2. Create new .env files with renamed variables
# 3. Validate new configuration
# 4. Report any issues
```

**Note:** The script is semi-automatic. You still need to manually:
- Generate strong secrets
- Set up new API keys
- Test each service

---

## Common Migration Issues

### Issue 1: DATABASE_URL Format

**Error:**
```
Error: Invalid PostgreSQL connection URL
```

**Solution:**
```bash
# Old (wrong)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# New (correct)
DATABASE_URL=postgresql://postgres:password@localhost:5432/mydb?schema=public
```

### Issue 2: Weak Secrets in Production

**Error:**
```
CRITICAL SECURITY ERROR: AUTH_SECRET must be at least 32 characters
```

**Solution:**
```bash
# Generate strong secret
openssl rand -base64 48

# Add to .env
AUTH_SECRET=<generated-value>
```

### Issue 3: Pinecone Variables Still Present

**Warning:**
```
⚠️ PINECONE_API_KEY is set but orchestrator-service now uses pgvector
```

**Solution:**
```bash
# Remove from orchestrator-service .env
# PINECONE_API_KEY=...      # DELETE THIS LINE
# PINECONE_ENVIRONMENT=...  # DELETE THIS LINE
# PINECONE_INDEX_NAME=...   # DELETE THIS LINE

# Install pgvector instead
psql -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Issue 4: Missing Required Variables

**Error:**
```
❌ Missing required environment variable: OPENAI_API_KEY
```

**Solution:**
```bash
# Add to .env
OPENAI_API_KEY=sk-your-api-key-here
```

### Issue 5: Redis Connection String

**Error:**
```
Error: Invalid Redis URL
```

**Solution:**
```bash
# Old (wrong)
REDIS_HOST=localhost
REDIS_PORT=6379

# New (correct)
REDIS_URL=redis://localhost:6379

# With password
REDIS_URL=redis://:password@localhost:6379

# With auth user
REDIS_URL=redis://user:password@localhost:6379
```

---

## Rollback Plan

If migration fails, rollback:

```bash
# Restore from backup
mv .env.backup .env

cd backend/services
for service in */; do
  if [ -f "$service/.env.backup" ]; then
    mv "$service/.env.backup" "$service/.env"
  fi
done

# Restart services
npm run dev:all
```

---

## Validation Checklist

Before considering migration complete:

### Configuration Files
- [ ] All `.env.example` files updated
- [ ] All service `.env` files migrated
- [ ] Root `.env` file migrated
- [ ] No old variable names remain

### Testing
- [ ] All services start without validation errors
- [ ] Auth service: Login/registration works
- [ ] Chat service: AI chat works
- [ ] Billing service: Stripe integration works
- [ ] Analytics service: Events are ingested
- [ ] Orchestrator service: RAG works (with pgvector)
- [ ] Email worker: Emails are sent

### Security
- [ ] All secrets are minimum 32 characters
- [ ] No default/example secrets in production
- [ ] Database credentials are secure
- [ ] API keys are valid

### Documentation
- [ ] Team notified of changes
- [ ] Deployment documentation updated
- [ ] CI/CD environment variables updated

---

## Support

If you encounter issues during migration:

1. **Check validation errors** - Error messages are designed to be helpful
2. **Review this migration guide** - Common issues are documented
3. **Check service logs** - Enable `LOG_LEVEL=debug`
4. **Consult CONFIGURATION.md** - Full variable reference
5. **Open an issue** - Include error messages (sanitize secrets!)

---

## Next Steps

After successful migration:

1. **Update CI/CD** - Ensure deployment pipelines use new variable names
2. **Update documentation** - Any service-specific docs
3. **Train team** - Share this guide with team members
4. **Monitor services** - Watch for any issues in production
5. **Clean up** - Remove old config files and scripts

---

## Reference Links

- **Main Configuration Guide:** `docs/CONFIGURATION.md`
- **Shared Config Schemas:** `backend/shared/config/schema.ts`
- **Validation Utilities:** `backend/shared/config/validator.ts`
- **Example Configurations:** `.env.example` files in each service
