# Azure App Service Deployment Guide

Complete step-by-step guide for deploying the AI SaaS Chat application to Azure App Service.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Environment Variables Configuration](#environment-variables-configuration)
- [Deployment Methods](#deployment-methods)
- [Post-Deployment Configuration](#post-deployment-configuration)
- [Monitoring & Diagnostics](#monitoring--diagnostics)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Overview

### Architecture

This guide covers deploying the Next.js application to Azure App Service with:
- **Frontend**: Vercel (recommended) OR Azure App Service
- **Backend API**: Azure App Service (this guide)
- **Database**: Neon PostgreSQL (shared)
- **Cache**: Upstash Redis (shared)
- **Storage**: Azure Blob Storage OR Cloudflare R2

### Why Azure App Service?

- Dedicated backend for heavy AI workloads
- Better control over server configuration
- Integrated with Azure services
- Auto-scaling capabilities
- Built-in monitoring with Application Insights

---

## Prerequisites

### Required Accounts

- [ ] **Azure Account** - https://portal.azure.com
- [ ] **GitHub Account** - https://github.com (for CI/CD)
- [ ] **Neon Database** - https://neon.tech (PostgreSQL)
- [ ] **Upstash Redis** - https://console.upstash.com
- [ ] **At least one AI Provider** (OpenAI, Anthropic, etc.)

### Required Tools

```bash
# Install Azure CLI
# macOS
brew install azure-cli

# Windows
winget install Microsoft.AzureCLI

# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Verify installation
az --version

# Login to Azure
az login
```

### Optional Tools

```bash
# Install GitHub CLI (for repository integration)
brew install gh  # macOS
winget install GitHub.cli  # Windows

# Install Node.js LTS
nvm install --lts
```

---

## Initial Setup

### Step 1: Create Resource Group

```bash
# Set variables
RESOURCE_GROUP="my-saas-rg"
LOCATION="eastus"  # or your preferred region

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION
```

### Step 2: Create App Service Plan

```bash
# Set variables
APP_SERVICE_PLAN="my-saas-plan"
SKU="B1"  # Basic tier (upgrade to S1/P1V2 for production)

# Create App Service Plan (Linux)
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --is-linux \
  --sku $SKU

# For production, use:
# --sku P1V2  # Premium V2 (recommended)
# --sku S1    # Standard (minimum for production)
```

### Step 3: Create Web App

```bash
# Set variables
APP_NAME="my-saas-api"  # Must be globally unique
RUNTIME="NODE|20-lts"   # Node.js 20 LTS

# Create Web App
az webapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --runtime $RUNTIME

# Your app will be available at:
# https://$APP_NAME.azurewebsites.net
```

### Step 4: Configure Deployment Source

**Option A: GitHub Actions (Recommended)**

```bash
# Enable GitHub deployment
az webapp deployment source config \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --repo-url https://github.com/your-username/your-repo \
  --branch main \
  --git-token <your-github-token>
```

**Option B: Local Git**

```bash
# Configure local git deployment
az webapp deployment source config-local-git \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# Get git URL
az webapp deployment source show \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query url \
  --output tsv

# Add Azure remote
git remote add azure <git-url>

# Deploy
git push azure main
```

---

## Environment Variables Configuration

### Method 1: Using Azure CLI (Recommended)

```bash
# Set App Service name
APP_NAME="my-saas-api"
RESOURCE_GROUP="my-saas-rg"

# Core Configuration
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV=production \
    APP_URL=https://$APP_NAME.azurewebsites.net \
    LOG_LEVEL=info

# Database (Neon PostgreSQL)
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    DATABASE_URL='postgresql://user:pass@host.neon.tech:5432/db?sslmode=require&connection_limit=10&pool_timeout=20'

# Authentication & Security
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    AUTH_SECRET='<generated-32-char-secret>' \
    AUTH_COOKIE_NAME=session

# CORS (Important for Azure!)
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    CORS_ALLOWED_ORIGINS='https://your-frontend.vercel.app,https://yourdomain.com'

# Redis/Upstash
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    UPSTASH_REDIS_REST_URL='https://your-redis.upstash.io' \
    UPSTASH_REDIS_REST_TOKEN='<your-token>'

# AI Providers
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    OPENAI_API_KEY='sk-proj-...' \
    AI_PROVIDER=openai \
    AI_MODEL=gpt-4o-mini \
    AI_TIMEOUT_MS=45000

# Azure Blob Storage (if using)
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    AZURE_STORAGE_ACCOUNT_NAME='<your-storage-account>' \
    AZURE_STORAGE_ACCOUNT_KEY='<your-account-key>' \
    AZURE_BLOB_CONTAINER_NAME=uploads

# OR Cloudflare R2 (if using)
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    R2_ACCOUNT_ID='<cloudflare-account-id>' \
    R2_ACCESS_KEY_ID='<access-key>' \
    R2_SECRET_ACCESS_KEY='<secret-key>' \
    R2_BUCKET_NAME='my-saas-uploads'

# Email (Resend - recommended)
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    RESEND_API_KEY='re_...' \
    REQUIRE_EMAIL_VERIFICATION=false

# Payment (PayOS)
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    PAYOS_CLIENT_ID='<client-id>' \
    PAYOS_API_KEY='<api-key>' \
    PAYOS_CHECKSUM_KEY='<checksum-key>'

# Azure Application Insights
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    AZURE_APP_INSIGHTS_KEY='<insights-key>'

# Monitoring (Sentry)
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    SENTRY_DSN='https://...@sentry.io/...' \
    SENTRY_AUTH_TOKEN='<auth-token>'
```

### Method 2: Using Azure Portal

1. Go to **Azure Portal** → **App Services**
2. Select your app
3. Go to **Configuration** → **Application settings**
4. Click **New application setting**
5. Add each variable:
   - Name: `VARIABLE_NAME`
   - Value: `variable_value`
   - Deployment slot setting: (leave unchecked)
6. Click **Save**

### Method 3: Using Configuration File

Create `azure-appsettings.json`:

```json
[
  {
    "name": "NODE_ENV",
    "value": "production",
    "slotSetting": false
  },
  {
    "name": "APP_URL",
    "value": "https://my-saas-api.azurewebsites.net",
    "slotSetting": false
  },
  {
    "name": "AUTH_SECRET",
    "value": "<your-secret>",
    "slotSetting": false
  }
]
```

Apply configuration:

```bash
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings @azure-appsettings.json
```

---

## Deployment Methods

### Method 1: GitHub Actions (Recommended)

Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure App Service

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build

      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'my-saas-api'
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: .
```

**Get Publish Profile:**

```bash
# Download publish profile
az webapp deployment list-publishing-profiles \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --xml > publish-profile.xml

# Add to GitHub Secrets:
# Settings → Secrets → Actions → New repository secret
# Name: AZURE_WEBAPP_PUBLISH_PROFILE
# Value: <paste-publish-profile-xml>
```

### Method 2: Azure CLI Direct Deploy

```bash
# Build application locally
npm run build

# Create deployment package
zip -r deploy.zip .next package.json package-lock.json node_modules

# Deploy
az webapp deployment source config-zip \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --src deploy.zip
```

### Method 3: Docker Container (Advanced)

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

Deploy container:

```bash
# Create container registry
az acr create \
  --name mysaasregistry \
  --resource-group $RESOURCE_GROUP \
  --sku Basic \
  --admin-enabled true

# Build and push image
az acr build \
  --registry mysaasregistry \
  --image my-saas-api:latest \
  --file Dockerfile .

# Update web app to use container
az webapp config container set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --docker-custom-image-name mysaasregistry.azurecr.io/my-saas-api:latest \
  --docker-registry-server-url https://mysaasregistry.azurecr.io
```

---

## Post-Deployment Configuration

### Step 1: Configure Custom Domain

```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --hostname api.yourdomain.com

# Get SSL certificate (App Service Managed)
az webapp config ssl bind \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --certificate-thumbprint auto \
  --ssl-type SNI
```

**DNS Configuration (Cloudflare):**

```
Type: CNAME
Name: api
Target: my-saas-api.azurewebsites.net
Proxy: DNS Only (disable cloud)
```

### Step 2: Enable Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app my-saas-insights \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP \
  --application-type web

# Get instrumentation key
INSIGHTS_KEY=$(az monitor app-insights component show \
  --app my-saas-insights \
  --resource-group $RESOURCE_GROUP \
  --query instrumentationKey \
  --output tsv)

# Configure app to use Insights
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=$INSIGHTS_KEY" \
    AZURE_APP_INSIGHTS_KEY=$INSIGHTS_KEY
```

### Step 3: Configure Auto-Scaling

```bash
# Enable auto-scale
az monitor autoscale create \
  --resource-group $RESOURCE_GROUP \
  --resource $APP_NAME \
  --resource-type Microsoft.Web/serverfarms \
  --name autoscale-rule \
  --min-count 1 \
  --max-count 5 \
  --count 2

# Add scale-out rule (CPU > 70%)
az monitor autoscale rule create \
  --resource-group $RESOURCE_GROUP \
  --autoscale-name autoscale-rule \
  --condition "Percentage CPU > 70 avg 5m" \
  --scale out 1

# Add scale-in rule (CPU < 30%)
az monitor autoscale rule create \
  --resource-group $RESOURCE_GROUP \
  --autoscale-name autoscale-rule \
  --condition "Percentage CPU < 30 avg 5m" \
  --scale in 1
```

### Step 4: Configure Health Check

```bash
# Set health check path
az webapp config set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --health-check-path "/api/health"
```

### Step 5: Configure CORS (Important!)

```bash
# Allow Vercel frontend
az webapp cors add \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --allowed-origins https://your-app.vercel.app https://yourdomain.com

# Allow credentials
az webapp cors set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --credentials true
```

---

## Monitoring & Diagnostics

### Enable Logging

```bash
# Enable application logging
az webapp log config \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --application-logging filesystem \
  --level information

# Enable detailed error messages
az webapp log config \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --detailed-error-messages true \
  --failed-request-tracing true
```

### View Logs

```bash
# Stream logs in real-time
az webapp log tail \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# Download logs
az webapp log download \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --log-file logs.zip
```

### Application Insights Queries

```bash
# Query recent exceptions
az monitor app-insights query \
  --app my-saas-insights \
  --analytics-query "exceptions | where timestamp > ago(1h) | order by timestamp desc"

# Query performance
az monitor app-insights query \
  --app my-saas-insights \
  --analytics-query "requests | summarize avg(duration) by bin(timestamp, 5m)"
```

---

## Troubleshooting

### Build Failures

**Error: `npm ERR! code ELIFECYCLE`**

Solution:
```bash
# Check Node version
az webapp config show \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "linuxFxVersion"

# Set correct Node version
az webapp config set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --linux-fx-version "NODE|20-lts"
```

**Error: `Cannot find module '@prisma/client'`**

Solution:
```bash
# Ensure postinstall script runs
# Add to package.json:
"scripts": {
  "postinstall": "prisma generate"
}

# Redeploy
```

### Runtime Errors

**Error: `Application Error`**

Solution:
```bash
# Check application logs
az webapp log tail \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# Verify environment variables
az webapp config appsettings list \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "[].{name:name, value:value}"
```

**Error: `CORS policy blocked`**

Solution:
```bash
# Verify CORS settings
az webapp cors show \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# Update allowed origins
az webapp cors add \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --allowed-origins https://your-frontend.vercel.app

# Also update environment variable
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    CORS_ALLOWED_ORIGINS='https://your-frontend.vercel.app'
```

### Performance Issues

**High memory usage:**

Solution:
```bash
# Scale up to higher tier
az appservice plan update \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --sku P1V2

# Or enable auto-scale (see configuration above)
```

**Slow cold starts:**

Solution:
```bash
# Enable Always On (requires Basic tier or higher)
az webapp config set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --always-on true
```

---

## Best Practices

### 1. Security

```bash
# Enable HTTPS only
az webapp update \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --https-only true

# Set minimum TLS version
az webapp config set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --min-tls-version 1.2

# Enable managed identity
az webapp identity assign \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP
```

### 2. Use Deployment Slots

```bash
# Create staging slot
az webapp deployment slot create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --slot staging

# Deploy to staging
az webapp deployment source config \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --slot staging \
  --repo-url https://github.com/your-repo \
  --branch develop

# Swap staging to production
az webapp deployment slot swap \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --slot staging \
  --target-slot production
```

### 3. Backup Configuration

```bash
# Create storage account for backups
az storage account create \
  --name mysaasbackups \
  --resource-group $RESOURCE_GROUP \
  --sku Standard_LRS

# Enable backups
az webapp config backup create \
  --resource-group $RESOURCE_GROUP \
  --webapp-name $APP_NAME \
  --backup-name daily-backup \
  --storage-account-url <storage-sas-url> \
  --frequency 1d \
  --retain-one true
```

### 4. Cost Optimization

```bash
# Monitor costs
az consumption usage list \
  --start-date 2025-10-01 \
  --end-date 2025-10-31

# Set up budget alerts
az consumption budget create \
  --amount 100 \
  --category cost \
  --name monthly-budget \
  --time-grain monthly \
  --start-date 2025-10-01 \
  --end-date 2026-10-01
```

---

## Quick Reference Commands

```bash
# Restart app
az webapp restart \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# Stop app
az webapp stop \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# Start app
az webapp start \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# View configuration
az webapp config show \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# List environment variables
az webapp config appsettings list \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# Delete app (careful!)
az webapp delete \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP
```

---

## Related Documentation

- [Environment Variables Reference](../docs/ENVIRONMENT_VARS.md)
- [Vercel Deployment Guide](./deploy-vercel.md)
- [Production Environment Template](../.env.production.example)
- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [Azure CLI Reference](https://docs.microsoft.com/cli/azure/)

---

**Last Updated**: October 2025
**Version**: 1.0.0
