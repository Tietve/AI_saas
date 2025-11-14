# 🐳 DOCKER SETUP GUIDE

**Last Updated**: 2025-10-26
**Phase**: 8 - Containerization
**Status**: ✅ Complete

---

## 📖 OVERVIEW

This guide explains how to run the entire My-SaaS-Chat microservices stack using Docker and Docker Compose.

**Benefits**:
- ✅ Consistent environment across dev/staging/production
- ✅ One command to start entire stack
- ✅ Isolated services with proper networking
- ✅ Production-ready configuration
- ✅ Fixed Jaeger tracing (UDP networking)
- ✅ Easy scaling and deployment

---

## 🚀 QUICK START

### Prerequisites
- Docker Desktop installed (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+
- 8GB RAM recommended
- 20GB free disk space

### Start All Services
```bash
# 1. Copy environment template
cp .env.docker.example .env

# 2. Edit .env and add required keys
# AUTH_SECRET and OPENAI_API_KEY are mandatory

# 3. Start all services
docker-compose up -d

# 4. Check status
docker-compose ps

# 5. View logs
docker-compose logs -f
```

### Access Services
- **Auth Service**: http://localhost:3001
- **Chat Service**: http://localhost:3002
- **Billing Service**: http://localhost:3003
- **Jaeger UI**: http://localhost:16686
- **API Documentation**: http://localhost:3001/api-docs

---

## 📋 DETAILED SETUP

### Step 1: Environment Configuration

Create `.env` file from template:
```bash
cp .env.docker.example .env
```

**Minimum Required Variables**:
```bash
# Generate strong secret (required)
openssl rand -base64 48

# Add to .env
AUTH_SECRET="<your-generated-secret>"
OPENAI_API_KEY="sk-your-openai-key"
```

**Optional Variables**:
```bash
# Additional AI Providers
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_API_KEY="AIza..."
GROQ_API_KEY="gsk_..."

# Payment Processing
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email Configuration
REQUIRE_EMAIL_VERIFICATION=true
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@your-domain.com"

# Error Tracking
SENTRY_DSN="https://..."
```

### Step 2: Build Images

Build all service images:
```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build auth-service

# Build with no cache (clean build)
docker-compose build --no-cache
```

**Expected Build Times** (first build):
- Auth Service: ~3-5 minutes
- Chat Service: ~4-6 minutes
- Billing Service: ~3-5 minutes

**Subsequent builds** (with cache): 30-60 seconds

### Step 3: Start Services

```bash
# Start all services in background
docker-compose up -d

# Start specific services
docker-compose up -d postgres jaeger auth-service

# Start with logs visible
docker-compose up
```

**Service Startup Order**:
1. PostgreSQL (database)
2. Redis (caching)
3. Jaeger (tracing)
4. Auth Service (depends on postgres)
5. Chat Service (depends on auth)
6. Billing Service (depends on auth)

### Step 4: Verify Health

```bash
# Check all services are running
docker-compose ps

# Should show:
# NAME                  STATUS       PORTS
# saas-postgres         Up (healthy) 5432
# saas-redis            Up (healthy) 6379
# saas-jaeger           Up           16686, 6831, ...
# saas-auth-service     Up (healthy) 3001
# saas-chat-service     Up (healthy) 3002
# saas-billing-service  Up (healthy) 3003
```

**Health Checks**:
```bash
# Auth Service
curl http://localhost:3001/health

# Chat Service
curl http://localhost:3002/health

# Billing Service
curl http://localhost:3003/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

---

## 🛠️ COMMON OPERATIONS

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f auth-service

# Last 100 lines
docker-compose logs --tail=100 auth-service

# Since 10 minutes ago
docker-compose logs --since 10m
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart auth-service

# Force recreate containers
docker-compose up -d --force-recreate
```

### Stop Services
```bash
# Stop all services
docker-compose stop

# Stop specific service
docker-compose stop auth-service

# Stop and remove containers
docker-compose down

# Stop and remove volumes (WARNING: deletes data!)
docker-compose down -v
```

### Execute Commands in Container
```bash
# Open shell in auth-service
docker-compose exec auth-service sh

# Run Prisma migration
docker-compose exec auth-service npx prisma migrate deploy

# View environment variables
docker-compose exec auth-service env
```

### Database Operations
```bash
# Run Prisma migrations
docker-compose exec auth-service npx prisma migrate deploy

# Open Prisma Studio (if installed)
docker-compose exec auth-service npx prisma studio

# Access PostgreSQL directly
docker-compose exec postgres psql -U postgres -d saas_db

# Reset database (WARNING: deletes all data!)
docker-compose down -v
docker-compose up -d
```

---

## 📊 MONITORING & DEBUGGING

### Check Resource Usage
```bash
# Container stats
docker stats

# Specific service stats
docker stats saas-auth-service
```

### View Container Logs
```bash
# Follow logs
docker-compose logs -f auth-service

# Search logs
docker-compose logs auth-service | grep ERROR

# Export logs to file
docker-compose logs auth-service > auth-logs.txt
```

### Jaeger Tracing
1. Open http://localhost:16686
2. Select service (e.g., "auth-service")
3. Click "Find Traces"
4. Explore distributed traces

### Health Check Status
```bash
# Detailed health status
docker inspect saas-auth-service --format='{{json .State.Health}}' | jq

# Check if container is healthy
docker ps --filter "name=saas-auth-service" --format "{{.Status}}"
```

---

## 🔧 TROUBLESHOOTING

### Issue: Container Fails to Start

**Check logs**:
```bash
docker-compose logs auth-service
```

**Common causes**:
- Missing environment variables
- Database not ready
- Port already in use

**Solution**:
```bash
# Verify .env file
cat .env | grep AUTH_SECRET

# Wait for postgres
docker-compose up -d postgres
sleep 10
docker-compose up -d auth-service
```

### Issue: "Port already in use"

**Find process using port**:
```bash
# Windows
netstat -ano | findstr :3001

# Linux/Mac
lsof -i :3001
```

**Solution**:
```bash
# Change port in docker-compose.yml
ports:
  - "3101:3001"  # Changed from 3001:3001
```

### Issue: Database Connection Failed

**Check database status**:
```bash
docker-compose ps postgres

# Should show "Up (healthy)"
```

**Verify connection**:
```bash
docker-compose exec auth-service sh -c "npx prisma db execute --stdin <<< 'SELECT 1'"
```

**Reset database**:
```bash
docker-compose down -v
docker-compose up -d postgres
# Wait for postgres healthy
docker-compose up -d
```

### Issue: Jaeger Tracing Not Working

**Verify Jaeger is running**:
```bash
docker-compose ps jaeger
curl http://localhost:16686
```

**Check service configuration**:
```bash
docker-compose exec auth-service env | grep JAEGER
# Should show:
# JAEGER_AGENT_HOST=jaeger
# JAEGER_AGENT_PORT=6831
```

**Restart with Jaeger**:
```bash
docker-compose restart jaeger auth-service
```

### Issue: Build Fails

**Clear cache and rebuild**:
```bash
docker-compose build --no-cache auth-service
```

**Check Docker resources**:
```bash
# Prune unused images/containers
docker system prune -a

# Free up space
docker volume prune
```

---

## 🏗️ ARCHITECTURE

### Service Dependencies
```
postgres (database)
  ↓
auth-service (authentication)
  ↓
chat-service (AI chat)
  ↓
billing-service (payments)

jaeger (independent - tracing)
redis (independent - caching)
```

### Network Configuration
- **Network Name**: `saas-network`
- **Type**: Bridge network
- **Internal Communication**: Service names (e.g., `postgres`, `auth-service`)
- **External Access**: Mapped ports

### Volume Persistence
- **postgres_data**: PostgreSQL database files
- **redis_data**: Redis persistence (if AOF enabled)

---

## 🔐 SECURITY BEST PRACTICES

### Dockerfile Security
✅ Multi-stage builds (reduced attack surface)
✅ Non-root user (authservice, chatservice, billingservice)
✅ Alpine base images (minimal, secure)
✅ Health checks included
✅ No secrets in images

### Runtime Security
✅ Resource limits configured (CPU, memory)
✅ Restart policies (unless-stopped)
✅ Network isolation (bridge network)
✅ .env file for secrets (not in git)

### Production Checklist
- [ ] Use strong AUTH_SECRET (48+ characters)
- [ ] Set NODE_ENV=production
- [ ] Configure HTTPS/TLS termination (nginx/traefik)
- [ ] Use Docker secrets for sensitive data
- [ ] Set up log rotation
- [ ] Configure backup strategy
- [ ] Monitor resource usage
- [ ] Set up alerts

---

## 📈 PERFORMANCE OPTIMIZATION

### Image Sizes
- **Auth Service**: ~180-200 MB
- **Chat Service**: ~220-250 MB (larger due to AI SDKs)
- **Billing Service**: ~180-200 MB

### Build Optimization
```bash
# Layer caching (copy package.json first)
COPY package*.json ./
RUN npm ci

# Then copy source code
COPY . .
```

### Runtime Optimization
```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
    reservations:
      cpus: '0.5'
      memory: 256M
```

---

## 🚀 PRODUCTION DEPLOYMENT

### Build for Production
```bash
# Build with production settings
docker-compose -f docker-compose.yml build

# Tag images
docker tag saas-auth-service:latest registry.example.com/saas-auth-service:v1.0.0

# Push to registry
docker push registry.example.com/saas-auth-service:v1.0.0
```

### Deploy to Production
```bash
# Pull latest images
docker-compose pull

# Start services
docker-compose up -d

# Run migrations
docker-compose exec auth-service npx prisma migrate deploy

# Verify health
docker-compose ps
```

### Zero-Downtime Deployment
```bash
# Scale up new version
docker-compose up -d --scale auth-service=2

# Health check new version
curl http://localhost:3001/health

# Stop old version
docker stop <old-container-id>
```

---

## 📚 ADDITIONAL RESOURCES

### Docker Commands Reference
- [Docker CLI](https://docs.docker.com/engine/reference/commandline/cli/)
- [Docker Compose CLI](https://docs.docker.com/compose/reference/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)

### Project Documentation
- `docs/START_HERE.md` - Project overview
- `docs/phases/PHASE_8_COMPLETE.md` - Containerization achievements
- `.env.docker.example` - Environment configuration

### Troubleshooting
- Check logs: `docker-compose logs -f`
- Inspect container: `docker inspect <container-name>`
- Access shell: `docker-compose exec <service> sh`

---

## ✅ QUICK REFERENCE

### Start Stack
```bash
docker-compose up -d
```

### Stop Stack
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f
```

### Restart Service
```bash
docker-compose restart auth-service
```

### Run Migrations
```bash
docker-compose exec auth-service npx prisma migrate deploy
```

### Check Health
```bash
curl http://localhost:3001/health
```

---

**Last Updated**: 2025-10-26
**Maintained By**: DevOps Team
**Support**: See `docs/START_HERE.md` for contact info
