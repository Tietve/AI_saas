# Getting Started with My-SaaS-Chat

**Last Updated:** 2025-11-12

Complete guide to set up and run the My-SaaS-Chat application for development.

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ and npm 9+
- **Docker** and **Docker Compose**
- **Git**
- **Code Editor** (VS Code recommended)

---

## Quick Start (5 Minutes)

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd my-saas-chat
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies (when ready)
# cd frontend && npm install
```

### 3. Setup Environment

```bash
# Copy environment template
cd backend
cp .env.template .env

# Edit .env with your values (use any text editor)
# Required: DATABASE_URL, REDIS_URL, JWT_SECRET

# Sync .env to all services
./sync-all-env.sh
```

### 4. Start Infrastructure

```bash
# Start PostgreSQL, Redis, RabbitMQ
docker-compose up -d

# Verify containers are running
docker-compose ps
```

### 5. Start Services

```bash
# Terminal 1 - API Gateway (port 4000)
cd api-gateway
npm run dev

# Terminal 2 - Auth Service (port 3001)
cd services/auth-service
npm run dev

# Terminal 3 - Chat Service (port 3002)
cd services/chat-service
npm run dev
```

### 6. Verify Setup

```bash
# Check health endpoints
curl http://localhost:4000/health  # API Gateway
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # Chat Service
```

**Success!** You should see `{"status": "ok"}` for all endpoints.

---

## Detailed Setup

### Step 1: System Requirements

#### Hardware

- **Minimum:** 8GB RAM, 2 CPU cores, 20GB disk space
- **Recommended:** 16GB RAM, 4 CPU cores, 50GB disk space

#### Software

```bash
# Check Node.js version (should be 18+)
node --version

# Check npm version (should be 9+)
npm --version

# Check Docker version
docker --version
docker-compose --version

# Check Git version
git --version
```

If any are missing, install them:

- **Node.js:** https://nodejs.org/ (LTS version)
- **Docker:** https://www.docker.com/products/docker-desktop
- **Git:** https://git-scm.com/downloads

---

### Step 2: Project Structure Overview

```
my-saas-chat/
├── backend/              # Backend services
│   ├── api-gateway/      # API Gateway (port 4000)
│   ├── services/         # Microservices
│   │   ├── auth-service/       # Port 3001
│   │   ├── chat-service/       # Port 3002
│   │   ├── billing-service/    # Port 3003
│   │   └── analytics-service/  # Port 3004
│   ├── shared/           # Shared code
│   └── docker-compose.yml
│
├── frontend/             # Next.js frontend (port 3000)
├── docs/                 # Documentation
└── .claude/              # AI assistant config
```

---

### Step 3: Environment Configuration

#### Generate Secrets

```bash
# Generate JWT secret
openssl rand -hex 32

# Generate session secret
openssl rand -hex 32

# Generate encryption key
openssl rand -hex 32
```

#### Configure .env

Edit `backend/.env`:

```bash
# Required Variables
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/saas_chat

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=<your-generated-secret>
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# API Gateway
API_GATEWAY_PORT=4000

# Services
AUTH_SERVICE_URL=http://localhost:3001
CHAT_SERVICE_URL=http://localhost:3002
BILLING_SERVICE_URL=http://localhost:3003
ANALYTICS_SERVICE_URL=http://localhost:3004
```

#### Sync Environment

```bash
cd backend
./sync-all-env.sh
```

This copies `.env` to all service directories.

---

### Step 4: Database Setup

#### Start PostgreSQL

```bash
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
docker exec -it ms-postgres pg_isready -U postgres
```

#### Run Migrations

```bash
# Auth Service
cd services/auth-service
npx prisma migrate dev
npx prisma generate

# Chat Service
cd ../chat-service
npx prisma migrate dev
npx prisma generate

# Billing Service
cd ../billing-service
npx prisma migrate dev
npx prisma generate
```

#### Seed Database (Optional)

```bash
cd services/auth-service
npm run db:seed
```

---

### Step 5: Start Services

#### Option A: Start All at Once

```bash
cd backend
npm run dev
```

This starts all services in a single terminal (using concurrently).

#### Option B: Start Individually (Recommended for Debugging)

Open multiple terminals:

**Terminal 1 - API Gateway:**
```bash
cd backend/api-gateway
npm run dev
```

**Terminal 2 - Auth Service:**
```bash
cd backend/services/auth-service
npm run dev
```

**Terminal 3 - Chat Service:**
```bash
cd backend/services/chat-service
npm run dev
```

**Terminal 4 - Billing Service (Optional):**
```bash
cd backend/services/billing-service
npm run dev
```

**Terminal 5 - Analytics Service (Optional):**
```bash
cd backend/services/analytics-service
npm run dev
```

---

### Step 6: Verify Installation

#### Health Checks

```bash
# API Gateway
curl http://localhost:4000/health

# Auth Service
curl http://localhost:3001/health

# Chat Service
curl http://localhost:3002/health

# Billing Service
curl http://localhost:3003/health

# Analytics Service
curl http://localhost:3004/health
```

Expected response for each:
```json
{
  "status": "ok",
  "timestamp": "2025-11-12T10:00:00.000Z"
}
```

#### Test Registration

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "username": "testuser"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "..."
  }
}
```

#### Test Login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!"
  }'
```

---

## Development Workflow

### Starting Work

```bash
# 1. Start Docker infrastructure
cd backend
docker-compose up -d

# 2. Start API Gateway
cd api-gateway
npm run dev

# 3. Start required services
cd services/auth-service
npm run dev
```

### Making Changes

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make code changes

# 3. Test changes
npm test

# 4. Commit changes
git add .
git commit -m "feat: add my feature"

# 5. Push changes
git push origin feature/my-feature
```

### Stopping Work

```bash
# Stop services (Ctrl+C in each terminal)

# Stop Docker containers
docker-compose down
```

---

## Common Tasks

### Run Tests

```bash
# Unit tests
npm test

# Integration tests
cd backend/tests/e2e
npm test

# Specific service tests
cd backend/services/auth-service
npm test
```

### Generate Prisma Client

```bash
cd backend/services/auth-service
npx prisma generate
```

### Run Database Migrations

```bash
cd backend/services/auth-service
npx prisma migrate dev --name migration_name
```

### Reset Database

```bash
cd backend/services/auth-service
npx prisma migrate reset
```

### View Logs

```bash
# Docker logs
docker-compose logs -f

# Specific container
docker-compose logs -f postgres
```

### Access Database

```bash
# PostgreSQL
docker exec -it ms-postgres psql -U postgres -d saas_chat

# Redis
docker exec -it ms-redis redis-cli

# RabbitMQ UI
# Open browser: http://localhost:15672
# Login: admin/admin
```

---

## Troubleshooting

### Services Won't Start

**Check ports are free:**
```bash
# Windows
netstat -ano | findstr ":4000"
netstat -ano | findstr ":3001"

# Linux/Mac
lsof -i :4000
lsof -i :3001
```

**Kill processes if needed:**
```bash
# Windows
taskkill /F /PID <PID>

# Linux/Mac
kill -9 <PID>
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check connection string in .env
cat backend/services/auth-service/.env | grep DATABASE_URL
```

### API Gateway Not Working

```bash
# Verify API Gateway is running on port 4000
curl http://localhost:4000/health

# If not running, start it
cd backend/api-gateway
npm run dev

# Check logs for errors
```

### More Issues

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for comprehensive troubleshooting guide.

---

## Next Steps

### Configure External Services

#### OpenAI (for Chat Service)

1. Get API key from https://platform.openai.com/api-keys
2. Add to `.env`:
   ```bash
   OPENAI_API_KEY=sk-...
   ```
3. Restart chat service

#### Stripe (for Billing Service)

1. Get API keys from https://dashboard.stripe.com/test/apikeys
2. Add to `.env`:
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
3. Setup webhook (see billing service docs)
4. Restart billing service

#### Email (for Notifications)

1. Configure SMTP settings in `.env`:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   ```
2. Restart email worker

---

## Development Tools

### Recommended VS Code Extensions

- **Prisma** - Prisma schema support
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Docker** - Docker management
- **Thunder Client** - API testing

### API Testing

Use Thunder Client, Postman, or curl to test APIs:

**Import collection:**
- File: `backend/tests/postman/collection.json`

**Example requests:**
- Register: `POST /api/auth/register`
- Login: `POST /api/auth/login`
- Create Chat: `POST /api/chats`
- Send Message: `POST /api/chats/:id/messages`

---

## Learning Resources

### Project Documentation

- [README.md](../README.md) - Project overview
- [Backend README](../backend/README.md) - Backend details
- [CODEBASE_INDEX.md](../.claude/CODEBASE_INDEX.md) - Code navigation
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Problem solving

### Architecture Docs

- [System Architecture](./system-architecture.md)
- [Code Standards](./code-standards.md)
- [Project Overview](./project-overview-pdr.md)

### External Resources

- [Node.js Docs](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/guide/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

## FAQ

### Q: Which services are required to run?

**A:** Minimum setup:
- API Gateway (port 4000)
- Auth Service (port 3001)
- PostgreSQL (Docker)
- Redis (Docker)

Optional services:
- Chat Service (for AI chat)
- Billing Service (for subscriptions)
- Analytics Service (for metrics)

### Q: How do I add a new service?

**A:**
1. Copy existing service as template
2. Update `package.json` and ports
3. Add routes to API Gateway
4. Update `docker-compose.yml` if needed
5. Document in README

### Q: How do I debug a service?

**A:**
1. Add `debugger;` statements
2. Use VS Code debugger configuration
3. Check logs: `npm run dev`
4. Use Chrome DevTools: `node --inspect`

### Q: How do I update dependencies?

**A:**
```bash
# Check outdated packages
npm outdated

# Update all packages
npm update

# Update specific package
npm install package-name@latest
```

---

## Success Checklist

Before considering setup complete:

- [ ] All prerequisites installed (Node.js, Docker, Git)
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Docker containers running
- [ ] Database migrations completed
- [ ] API Gateway running (port 4000)
- [ ] Auth Service running (port 3001)
- [ ] All health checks passing
- [ ] Test user can register and login

---

## Getting Help

### Check Documentation First

1. This guide (GETTING_STARTED.md)
2. [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
3. [README.md](../README.md)
4. [Backend README](../backend/README.md)

### Still Stuck?

1. Check service logs for errors
2. Verify environment variables
3. Restart services
4. Create GitHub issue with:
   - Error message
   - Steps to reproduce
   - Environment details

---

**Congratulations!** You're ready to develop on My-SaaS-Chat.

**Next:** Start building features or explore the codebase with [CODEBASE_INDEX.md](../.claude/CODEBASE_INDEX.md).

---

**Last Updated:** 2025-11-12
**Maintained By:** Development Team
