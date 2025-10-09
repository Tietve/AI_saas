# Azure App Service Deployment Guide

## 📋 Quick Setup Checklist

### Prerequisites
- [x] Azure subscription
- [x] GitHub repository
- [x] Next.js app with Prisma
- [x] PostgreSQL database (Neon)

### Required Files
- [x] `.github/workflows/azure-webapp.yml` - GitHub Actions workflow
- [x] `package.json` - With `start` script
- [x] `next.config.js` - Next.js configuration
- [x] `prisma/schema.prisma` - Database schema

---

## 🚀 Initial Setup

### 1. Create Azure App Service

```bash
# Login to Azure
az login

# Create resource group (if not exists)
az group create \
  --name firbox-rg \
  --location southeastasia

# Create App Service Plan (Linux)
az appservice plan create \
  --name firbox-plan \
  --resource-group firbox-rg \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --name firbox-api \
  --resource-group firbox-rg \
  --plan firbox-plan \
  --runtime "NODE:20-lts"
```

### 2. Download Publish Profile

**Option A: Azure Portal**
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to: App Services → firbox-api
3. Click "Download publish profile"
4. Save as `firbox-api.PublishSettings`

**Option B: Azure CLI**
```bash
az webapp deployment list-publishing-profiles \
  --name firbox-api \
  --resource-group firbox-rg \
  --xml > firbox-api.PublishSettings
```

### 3. Configure GitHub Secrets

Go to GitHub repository → Settings → Secrets and variables → Actions → New repository secret

**Add these secrets:**

| Secret Name | Value | Source |
|------------|-------|--------|
| `AZURE_PUBLISH_PROFILE` | Full content of `.PublishSettings` file | Downloaded from Azure |
| `DATABASE_URL` | PostgreSQL connection string | Neon dashboard |

**Example DATABASE_URL:**
```
postgresql://user:password@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

### 4. Configure Azure App Settings

Set environment variables in Azure Portal:

**Portal Path:** App Services → firbox-api → Configuration → Application Settings

**Required Variables:**

```bash
# Core
NODE_ENV=production
WEBSITE_NODE_DEFAULT_VERSION=20-lts

# Database
DATABASE_URL=postgresql://user:password@host/db?sslmode=require

# Authentication
AUTH_SECRET=your_64_char_secret
NEXTAUTH_URL=https://firbox-api.azurewebsites.net

# Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# AI
OPENAI_API_KEY=sk-proj-...
AI_PROVIDER=openai
AI_MODEL=gpt-4o-mini

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@firbox.net
SMTP_PASS=your_password
```

**OR use Azure CLI:**

```bash
az webapp config appsettings set \
  --name firbox-api \
  --resource-group firbox-rg \
  --settings \
    NODE_ENV=production \
    DATABASE_URL="postgresql://..." \
    AUTH_SECRET="..." \
    OPENAI_API_KEY="sk-proj-..."
```

### 5. Configure Startup Command

**Portal:** App Services → firbox-api → Configuration → General Settings → Startup Command

```bash
npm start
```

**Verify `package.json` has:**
```json
{
  "scripts": {
    "start": "next start -p $PORT"
  }
}
```

Azure automatically sets `$PORT` environment variable (usually 8080).

---

## 🔄 Deployment Workflow

### How It Works

1. **Trigger:** Push to `main` branch
2. **Build:**
   - Checkout code
   - Setup Node.js 20
   - Install dependencies
   - Generate Prisma Client
   - Build Next.js app
3. **Package:**
   - Create deployment directory
   - Copy built files + dependencies
   - Create ZIP archive
4. **Deploy:**
   - Upload to Azure
   - Azure extracts and starts app
5. **Verify:**
   - Health check endpoint

### Manual Deployment

**Option 1: GitHub Actions (Manual Trigger)**
1. Go to GitHub → Actions
2. Select "Deploy Azure Web App (firbox-api)"
3. Click "Run workflow"
4. Select branch → Run

**Option 2: Azure CLI (Direct Deploy)**
```bash
# Build locally
npm run build

# Create deployment package
zip -r deployment.zip .next package.json package-lock.json next.config.js prisma node_modules

# Deploy
az webapp deployment source config-zip \
  --name firbox-api \
  --resource-group firbox-rg \
  --src deployment.zip
```

**Option 3: VS Code Azure Extension**
1. Install "Azure App Service" extension
2. Right-click on `firbox-api`
3. Select "Deploy to Web App"

---

## 🗄️ Database Migrations

**IMPORTANT:** GitHub Actions workflow does NOT run migrations automatically.

### When to Migrate

- Adding/modifying database tables
- Changing column types
- Adding constraints/indexes

### Migration Methods

**Method 1: Azure SSH (Recommended)**
```bash
# SSH into Azure App Service
az webapp ssh --name firbox-api --resource-group firbox-rg

# Navigate to app directory
cd site/wwwroot

# Run migrations
npx prisma migrate deploy

# Exit
exit
```

**Method 2: Local with Production Database**
```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://user:password@host/db?sslmode=require"

# Run migrations
npx prisma migrate deploy

# Verify
npx prisma studio
```

**Method 3: Separate GitHub Action (Advanced)**

Create `.github/workflows/migrate.yml`:
```yaml
name: Run Database Migrations

on:
  workflow_dispatch:  # Manual trigger only

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
      - run: npm ci
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

**Usage:**
1. Go to Actions → Run Database Migrations
2. Click "Run workflow"
3. Monitor logs

---

## ✅ Verification

### 1. Check Deployment Status

**GitHub Actions:**
- Go to GitHub → Actions
- Check workflow run status
- Review logs if failed

**Azure Portal:**
- App Services → firbox-api → Deployment Center
- Check deployment history

### 2. Test Endpoints

```bash
# Health check
curl https://firbox-api.azurewebsites.net/api/health

# Expected response:
# {"status":"healthy","timestamp":"...","checks":{...}}

# Test API
curl https://firbox-api.azurewebsites.net/api/test
```

### 3. Monitor Logs

**Azure Portal:**
- App Services → firbox-api → Log stream

**Azure CLI:**
```bash
# Live logs
az webapp log tail \
  --name firbox-api \
  --resource-group firbox-rg

# Download logs
az webapp log download \
  --name firbox-api \
  --resource-group firbox-rg \
  --log-file logs.zip
```

---

## 🐛 Troubleshooting

### Issue: App doesn't start after deployment

**Symptoms:**
- 502 Bad Gateway
- Application Error

**Solutions:**
1. Check startup command:
   ```bash
   # Should be: npm start
   az webapp config show --name firbox-api --resource-group firbox-rg --query "appCommandLine"
   ```

2. Check Node version:
   ```bash
   az webapp config show --name firbox-api --resource-group firbox-rg --query "linuxFxVersion"
   # Should be: NODE|20-lts
   ```

3. Check logs:
   ```bash
   az webapp log tail --name firbox-api --resource-group firbox-rg
   ```

### Issue: "Cannot find module '@prisma/client'"

**Cause:** Prisma Client not generated or not included in deployment

**Solutions:**
1. Verify GitHub Actions workflow has `prisma generate` step
2. Check deployment package includes `node_modules/@prisma`
3. Manually regenerate:
   ```bash
   az webapp ssh --name firbox-api --resource-group firbox-rg
   cd site/wwwroot
   npx prisma generate
   ```

### Issue: Database connection errors

**Symptoms:**
- "P1001: Can't reach database server"
- "Connection timeout"

**Solutions:**
1. Verify DATABASE_URL in Azure:
   ```bash
   az webapp config appsettings list --name firbox-api --resource-group firbox-rg | grep DATABASE_URL
   ```

2. Check Neon database firewall (should allow all IPs or Azure IPs)

3. Test connection from Azure:
   ```bash
   az webapp ssh --name firbox-api --resource-group firbox-rg
   # Install psql: apt-get update && apt-get install postgresql-client
   psql $DATABASE_URL
   ```

### Issue: Out of memory

**Symptoms:**
- App crashes randomly
- "JavaScript heap out of memory"

**Solutions:**
1. Upgrade App Service Plan:
   ```bash
   az appservice plan update \
     --name firbox-plan \
     --resource-group firbox-rg \
     --sku B2  # or P1V2 for production
   ```

2. Add Node.js memory flag:
   - Startup Command: `NODE_OPTIONS="--max-old-space-size=2048" npm start`

### Issue: Slow builds

**Solutions:**
1. GitHub Actions cache is already enabled
2. Use `npm ci` instead of `npm install` (already used)
3. Exclude dev dependencies in deployment (already done)
4. Consider self-hosted runner for faster builds

---

## 📊 Monitoring & Performance

### Application Insights (Recommended)

**Enable:**
```bash
# Create Application Insights
az monitor app-insights component create \
  --app firbox-api-insights \
  --resource-group firbox-rg \
  --location southeastasia \
  --application-type web

# Link to App Service
az webapp config appsettings set \
  --name firbox-api \
  --resource-group firbox-rg \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY="<key>"
```

**View Metrics:**
- Azure Portal → Application Insights → firbox-api-insights
- Live Metrics, Performance, Failures, Users

### Custom Metrics

Add to `src/lib/logger.ts`:
```typescript
import * as appInsights from 'applicationinsights'

if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
  appInsights.setup().start()
}

export function trackMetric(name: string, value: number) {
  appInsights.defaultClient?.trackMetric({ name, value })
}
```

### Scaling

**Auto-scale rules:**
```bash
az monitor autoscale create \
  --name firbox-autoscale \
  --resource-group firbox-rg \
  --resource firbox-api \
  --resource-type Microsoft.Web/serverfarms \
  --min-count 1 \
  --max-count 3 \
  --count 1

# Scale out when CPU > 70%
az monitor autoscale rule create \
  --autoscale-name firbox-autoscale \
  --resource-group firbox-rg \
  --condition "Percentage CPU > 70 avg 5m" \
  --scale out 1
```

---

## 🔒 Security Best Practices

### 1. Enable HTTPS Only
```bash
az webapp update \
  --name firbox-api \
  --resource-group firbox-rg \
  --https-only true
```

### 2. Managed Identity (for Azure resources)
```bash
az webapp identity assign \
  --name firbox-api \
  --resource-group firbox-rg
```

### 3. Key Vault Integration
```bash
# Create Key Vault
az keyvault create \
  --name firbox-vault \
  --resource-group firbox-rg

# Store secrets
az keyvault secret set \
  --vault-name firbox-vault \
  --name "DatabaseUrl" \
  --value "postgresql://..."

# Reference in App Settings
az webapp config appsettings set \
  --name firbox-api \
  --resource-group firbox-rg \
  --settings DATABASE_URL="@Microsoft.KeyVault(SecretUri=https://firbox-vault.vault.azure.net/secrets/DatabaseUrl/)"
```

---

## 📚 Additional Resources

- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Azure Deployment](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-azure-functions)
- [GitHub Actions for Azure](https://docs.microsoft.com/azure/developer/github/github-actions)

---

**Last Updated:** 2025-10-10
**Status:** Production Ready
