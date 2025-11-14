# Getting Started Guide

Complete step-by-step guide to set up the AI SaaS platform for local development.

**Version**: 1.0.0
**Updated**: 2025-11-14
**Estimated Setup Time**: 30 minutes

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Requirements](#system-requirements)
3. [Project Setup](#project-setup)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Running Services](#running-services)
7. [Verification](#verification)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have the following installed:

### Required Tools

- **Node.js**: v20.0 or higher ([Download](https://nodejs.org/))
- **npm**: v9.0 or higher (comes with Node.js)
- **Docker & Docker Compose**: Latest version ([Download](https://www.docker.com/products/docker-desktop))
- **Git**: Latest version ([Download](https://git-scm.com/))

### Optional Tools (Recommended)

- **Visual Studio Code**: With extensions:
  - REST Client (for API testing)
  - Thunder Client (alternative API client)
  - SQL Tools (for database viewing)
  - Prettier (code formatting)
  - ESLint (code linting)

- **Postman**: For API testing ([Download](https://www.postman.com/))
- **pgAdmin**: For database management ([Download](https://www.pgadmin.org/))

### Verify Installation

```bash
# Check Node.js version
node --version
# Expected: v20.x.x

# Check npm version
npm --version
# Expected: 9.x.x

# Check Docker
docker --version
# Expected: Docker version 20.x.x

# Check Docker Compose
docker-compose --version
# Expected: Docker Compose version 2.x.x

# Check Git
git --version
# Expected: git version 2.x.x
```

---

## System Requirements

### Minimum Specifications

- **CPU**: 2 cores
- **RAM**: 4 GB
- **Disk**: 10 GB free space
- **OS**: macOS, Linux, or Windows 10/11 with WSL2

### Recommended Specifications

- **CPU**: 4+ cores
- **RAM**: 8+ GB
- **Disk**: 20 GB free space
- **OS**: macOS 12+, Ubuntu 20.04+, or Windows 11 with WSL2

### Network Requirements

- Stable internet connection (for downloading dependencies)
- API access to OpenAI (for chat testing)
- API access to Stripe (for billing testing)

---

## Project Setup

### Step 1: Clone Repository

```bash
# Clone the project
git clone https://github.com/yourusername/ai-saas.git
cd ai-saas

# Verify you're on the main branch
git status
# Should show: On branch main
```

### Step 2: Install Dependencies

```bash
# Install project dependencies
npm install

# This installs all dependencies for:
# - API Gateway
# - Auth Service
# - Chat Service
# - Billing Service
# - Analytics Service
# - Frontend
# - Test suite
```

**Expected Time**: 2-5 minutes (depends on internet speed)

### Step 3: Verify Installation

```bash
# Check that node_modules is created
ls node_modules | head -5

# List installed packages
npm list --depth=0
```

---

## Environment Configuration

### Step 1: Create .env File

```bash
# Copy example environment file
cp .env.example .env

# Edit with your editor
nano .env
# or
code .env
```

### Step 2: Configure Environment Variables

Edit `.env` with the following configuration:

```bash
# ==========================================
# API GATEWAY CONFIGURATION
# ==========================================
API_GATEWAY_PORT=4000
NODE_ENV=development

# Service URLs (for Docker Compose)
AUTH_SERVICE_URL=http://auth-service:3001
CHAT_SERVICE_URL=http://chat-service:3002
BILLING_SERVICE_URL=http://billing-service:3003
ANALYTICS_SERVICE_URL=http://analytics-service:3004

# ==========================================
# DATABASE CONFIGURATION
# ==========================================

# PostgreSQL (Using Neon for cloud or local postgres)
DATABASE_URL="postgresql://user:password@localhost:5432/ai_saas_dev"
# Format: postgresql://[user]:[password]@[host]:[port]/[database]

# Create database locally (after postgres is running):
# createdb ai_saas_dev

# ==========================================
# REDIS CONFIGURATION
# ==========================================
REDIS_URL="redis://localhost:6379"
# For Upstash: redis://:password@host:port

# ==========================================
# RABBITMQ CONFIGURATION
# ==========================================
RABBITMQ_URL="amqp://guest:guest@localhost:5672"
# Default guest credentials for local development

# ==========================================
# JWT CONFIGURATION
# ==========================================
JWT_SECRET="your-super-secret-jwt-key-min-32-chars-12345"
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ==========================================
# OPENAI CONFIGURATION
# ==========================================
OPENAI_API_KEY="sk-your-openai-api-key-here"
# Get from: https://platform.openai.com/account/api-keys

# Default models
OPENAI_MODEL_CHAT="gpt-4"
OPENAI_MODEL_FAST="gpt-3.5-turbo"

# ==========================================
# STRIPE CONFIGURATION
# ==========================================
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"

# Get from: https://dashboard.stripe.com/apikeys
# Use TEST keys for development

# ==========================================
# EMAIL CONFIGURATION
# ==========================================
EMAIL_SERVICE="smtp"
SMTP_HOST="localhost"
SMTP_PORT=1025
SMTP_USER="test@example.com"
SMTP_PASSWORD=""
SMTP_FROM_EMAIL="noreply@yourdomain.com"
SMTP_FROM_NAME="AI SaaS Platform"

# For development, use MailHog (see Troubleshooting)

# ==========================================
# LOGGING & MONITORING
# ==========================================
LOG_LEVEL="debug"
ENABLE_REQUEST_LOGGING=true

# ==========================================
# SENTRY CONFIGURATION (Optional)
# ==========================================
SENTRY_DSN="https://your-sentry-key@sentry.io/project-id"
SENTRY_ENVIRONMENT="development"

# ==========================================
# JAEGER TRACING (Optional)
# ==========================================
JAEGER_AGENT_HOST="localhost"
JAEGER_AGENT_PORT=6831
JAEGER_SAMPLER_TYPE="const"
JAEGER_SAMPLER_PARAM=1
```

### Step 3: Validate Configuration

```bash
# Check that .env file is created
cat .env

# Verify all required variables are set
npm run env:verify
```

---

## Database Setup

### Option A: Docker Compose (Recommended for Development)

```bash
# Start PostgreSQL and Redis containers
docker-compose up -d postgres redis rabbitmq

# Verify services are running
docker-compose ps
# Should show postgres, redis, and rabbitmq running
```

### Option B: Manual PostgreSQL Setup

```bash
# macOS with Homebrew
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database
createdb ai_saas_dev

# Verify connection
psql -U postgres -d ai_saas_dev -c "SELECT version();"
```

### Step 4: Run Migrations

```bash
# From root directory
npm run db:setup

# This will:
# 1. Generate Prisma client
# 2. Run all migrations
# 3. Seed sample data
```

### Step 5: Verify Database

```bash
# Open Prisma Studio
npm run db:studio

# This opens http://localhost:5555 where you can browse the database
# Verify tables are created and sample data exists
```

---

## Running Services

### Option A: All Services (Docker Compose)

```bash
# Start all services
docker-compose up

# Services will be available at:
# - API Gateway: http://localhost:4000
# - Auth Service: http://localhost:3001
# - Chat Service: http://localhost:3002
# - Billing Service: http://localhost:3003
# - Analytics Service: http://localhost:3004
# - Frontend: http://localhost:5173
# - pgAdmin: http://localhost:5050
# - MailHog: http://localhost:8025
```

### Option B: Run Services Individually (Development)

This is better for debugging individual services.

**Terminal 1 - API Gateway**:
```bash
cd api-gateway
npm install
npm run dev
# Available at http://localhost:4000
```

**Terminal 2 - Auth Service**:
```bash
cd services/auth-service
npm install
npm run dev
# Available at http://localhost:3001
```

**Terminal 3 - Chat Service**:
```bash
cd services/chat-service
npm install
npm run dev
# Available at http://localhost:3002
```

**Terminal 4 - Billing Service**:
```bash
cd services/billing-service
npm install
npm run dev
# Available at http://localhost:3003
```

**Terminal 5 - Analytics Service**:
```bash
cd services/analytics-service
npm install
npm run dev
# Available at http://localhost:3004
```

**Terminal 6 - Frontend**:
```bash
cd frontend
npm install
npm run dev
# Available at http://localhost:5173
```

**Terminal 7 - Email Worker**:
```bash
cd services/email-worker
npm install
npm run dev
```

---

## Verification

### Step 1: Check API Gateway Health

```bash
# Using curl
curl http://localhost:4000/health

# Expected response:
# {"status":"ok","services":{"auth":"ok","chat":"ok","billing":"ok"}}
```

### Step 2: Test Authentication

```bash
# Sign up
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'

# Expected response includes user object
```

### Step 3: Test Chat Service

```bash
# Get your token from signup response, then:
curl -X GET http://localhost:4000/api/chat/conversations \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return empty array (no conversations yet)
```

### Step 4: Visit Frontend

Open http://localhost:5173 in your browser

- Should see login page
- Sign up with your test credentials
- Should be able to send messages

### Step 5: Run Tests

```bash
# Run all tests
npm run test

# Run specific service tests
npm run test:auth
npm run test:chat
npm run test:billing

# Run with coverage
npm run test:coverage
```

---

## Common Issues

### Port Already in Use

```bash
# Find process using port
lsof -i :4000  # Replace 4000 with your port

# Kill the process
kill -9 <PID>

# Or change port in .env
API_GATEWAY_PORT=4001
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check connection string in .env
# Format: postgresql://user:password@host:port/database

# Test connection
psql -U user -d ai_saas_dev -c "SELECT 1"
```

### Redis Connection Failed

```bash
# Check Redis is running
docker-compose ps redis

# Test connection
redis-cli ping
# Should return: PONG
```

### OpenAI API Errors

```bash
# Verify API key
echo $OPENAI_API_KEY

# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Yarn vs npm

This project uses npm. If you installed with yarn:

```bash
# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall with npm
npm install
```

---

## Next Steps

1. **Read API Documentation**: `docs/api/openapi.yaml`
2. **Explore Architecture**: `docs/architecture/SYSTEM_ARCHITECTURE.md`
3. **Learn Database Schema**: `docs/architecture/DATABASE_SCHEMA.md`
4. **Follow Contributing Guide**: `docs/guides/CONTRIBUTING.md`
5. **Write Code!**

---

## Development Workflow

### Creating a Feature

```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make changes
# 3. Run tests
npm run test

# 4. Run linter
npm run lint

# 5. Commit changes
git add .
git commit -m "feat: describe your feature"

# 6. Push to remote
git push origin feature/your-feature

# 7. Create Pull Request
# - Go to GitHub
# - Open PR
# - Get code review
# - Merge to main
```

### Before Pushing

```bash
# 1. Run all checks
npm run type-check
npm run lint
npm run test

# 2. Build for production
npm run build

# 3. Test build
npm start
```

---

## Resources

- **Node.js Docs**: https://nodejs.org/docs/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Express.js Guide**: https://expressjs.com/
- **PostgreSQL Manual**: https://www.postgresql.org/docs/
- **OpenAI API Docs**: https://platform.openai.com/docs/api-reference
- **Stripe API Docs**: https://stripe.com/docs/api

---

## Getting Help

1. **Check Troubleshooting**: See section above
2. **Read Docs**: Check `docs/` directory
3. **Search Issues**: Look at GitHub Issues
4. **Ask Team**: Contact development team
5. **Stack Overflow**: Search for "node.js", "express", etc.

---

## Tips for Success

1. **Use .env.example**: Keep it updated when adding new env vars
2. **Run tests regularly**: Don't skip testing
3. **Update documentation**: Keep docs in sync with code
4. **Use meaningful git commits**: Help future developers understand changes
5. **Write clean code**: Follow the style guide
6. **Ask for help**: Better than being stuck!

