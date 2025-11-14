# Troubleshooting Guide

**Last Updated:** 2025-11-12

Comprehensive troubleshooting guide for common issues in the My-SaaS-Chat application.

---

## Quick Diagnostics

### Check All Services Health

```bash
# API Gateway (port 4000)
curl http://localhost:4000/health

# Auth Service (port 3001)
curl http://localhost:3001/health

# Chat Service (port 3002)
curl http://localhost:3002/health

# Billing Service (port 3003)
curl http://localhost:3003/health

# Analytics Service (port 3004)
curl http://localhost:3004/health
```

### Check Infrastructure Status

```bash
# PostgreSQL
docker ps | grep postgres

# Redis
docker ps | grep redis

# RabbitMQ
docker ps | grep rabbitmq
```

---

## Common Issues

### 1. Connection Refused Errors (ERR_CONNECTION_REFUSED)

**Symptom:** Frontend cannot connect to backend API

**Root Causes:**
1. API Gateway not running
2. Service not running on expected port
3. Incorrect API URL in frontend

**Solution:**

```bash
# Check if API Gateway is running
curl http://localhost:4000/health

# If not running, start it
cd backend/api-gateway
npm run dev

# Check if auth-service is running
curl http://localhost:3001/health

# If not running, start it
cd backend/services/auth-service
npm run dev

# Verify frontend is using correct API URL
# Check frontend/.env:
# NEXT_PUBLIC_API_URL=http://localhost:4000
```

**Verification:**
- API Gateway responds on port 4000
- All service health checks pass
- Frontend can call API endpoints successfully

---

### 2. Port Already in Use

**Symptom:** Service fails to start with "Port already in use" error

**Solution (Windows):**

```bash
# Find process using the port
netstat -ano | findstr ":4000"

# Kill the process (replace PID with actual process ID)
taskkill /F /PID <PID>

# Alternative: Kill all node processes
taskkill /F /IM node.exe
```

**Solution (Linux/Mac):**

```bash
# Find process using the port
lsof -i :4000

# Kill the process
kill -9 <PID>
```

---

### 3. Database Connection Failed

**Symptom:** Services fail with database connection errors

**Diagnostics:**

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
docker exec -it ms-postgres psql -U postgres -d saas_chat

# Check DATABASE_URL in .env
cat backend/services/auth-service/.env | grep DATABASE_URL
```

**Solutions:**

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Verify connection string format
# Should be: postgresql://user:pass@localhost:5432/database

# Run migrations
cd backend/services/auth-service
npx prisma migrate dev

# Regenerate Prisma client
npx prisma generate
```

---

### 4. Redis Connection Timeout

**Symptom:** Services fail with Redis timeout errors

**Diagnostics:**

```bash
# Check Redis is running
docker ps | grep redis

# Test connection
docker exec -it ms-redis redis-cli PING
```

**Solutions:**

```bash
# Start Redis
docker-compose up -d redis

# Check Redis URL in .env
cat backend/.env | grep REDIS_URL

# Verify format: redis://localhost:6379
```

---

### 5. JWT Token Errors

**Symptom:** Authentication fails with token validation errors

**Common Causes:**
- Token expired
- Invalid JWT_SECRET
- Mismatched secrets between services

**Solutions:**

```bash
# Verify JWT_SECRET is set and consistent
cat backend/.env | grep JWT_SECRET

# Regenerate JWT_SECRET if needed
openssl rand -hex 32

# Update .env file
# Then sync to all services
cd backend
./sync-all-env.sh

# Restart all services
npm run dev
```

---

### 6. Prisma Migration Failed

**Symptom:** Database migration errors

**Solutions:**

```bash
# Reset database (WARNING: Deletes all data)
cd backend/services/auth-service
npx prisma migrate reset

# Alternative: Force push schema
npx prisma db push --force-reset

# Regenerate client
npx prisma generate

# Apply migrations
npx prisma migrate dev
```

---

### 7. Environment Variables Not Loading

**Symptom:** Services fail with "Missing required environment variable"

**Solutions:**

```bash
# Check .env file exists
ls backend/.env

# Copy from template if missing
cp backend/.env.template backend/.env

# Sync to all services
cd backend
./sync-all-env.sh

# Verify service-specific .env
ls backend/services/auth-service/.env
```

---

### 8. CORS Errors

**Symptom:** Browser blocks requests with CORS error

**Solutions:**

Check API Gateway configuration:
```typescript
// backend/api-gateway/src/config/cors.config.ts
export const corsConfig = {
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
};
```

Update frontend API client:
```typescript
// frontend/src/lib/api-client.ts
axios.defaults.withCredentials = true;
```

---

### 9. API Gateway Routing Issues

**Symptom:** Requests to backend return 404 or route to wrong service

**Diagnostics:**

```bash
# Check API Gateway routes
curl http://localhost:4000/health

# Test specific service routes
curl http://localhost:4000/api/auth/health
curl http://localhost:4000/api/chat/health
```

**Solutions:**

1. Verify API Gateway is running on port 4000
2. Check route configuration in `backend/api-gateway/src/routes/`
3. Ensure service URLs are correct in gateway config
4. Restart API Gateway

---

### 10. TypeScript Errors

**Symptom:** Build fails with TypeScript errors

**Solutions:**

```bash
# Check for type errors
npm run type-check

# Regenerate Prisma client types
cd backend/services/auth-service
npx prisma generate

# Clean and rebuild
npm run clean
npm install
npm run build
```

---

## Service-Specific Issues

### Auth Service

**Issue:** User registration fails

**Check:**
1. Database connection
2. Password hashing (bcrypt installed)
3. JWT_SECRET configured
4. Unique constraints (email, username)

**Logs:**
```bash
cd backend/services/auth-service
npm run dev
# Check console output for errors
```

---

### Chat Service

**Issue:** AI responses not working

**Check:**
1. OPENAI_API_KEY configured
2. OpenAI service initialized
3. Billing service connection (quota checks)
4. Socket.io connection

**Test OpenAI:**
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

---

### Billing Service

**Issue:** Stripe integration fails

**Check:**
1. STRIPE_SECRET_KEY configured
2. STRIPE_WEBHOOK_SECRET configured
3. Webhook endpoint accessible
4. Test mode vs live mode keys

**Test Stripe:**
```bash
curl https://api.stripe.com/v1/customers \
  -u sk_test_your_key:
```

---

## Infrastructure Issues

### Docker Issues

**Issue:** Docker containers not starting

```bash
# Check Docker is running
docker ps

# View container logs
docker logs ms-postgres
docker logs ms-redis
docker logs ms-rabbitmq

# Restart containers
docker-compose restart

# Rebuild containers
docker-compose down
docker-compose up -d --build
```

---

### Disk Space Issues

**Issue:** Services fail due to disk space

```bash
# Check disk usage (Linux/Mac)
df -h

# Check disk usage (Windows)
wmic logicaldisk get size,freespace,caption

# Clean Docker
docker system prune -a

# Clean node_modules
npm run clean
```

---

## Performance Issues

### Slow API Responses

**Diagnostics:**

1. Check database query performance
2. Verify Redis cache is working
3. Monitor service resource usage
4. Check network latency

**Solutions:**

```bash
# Check service health with metrics
curl http://localhost:3001/health/detailed

# Monitor Docker stats
docker stats

# Check PostgreSQL slow queries
docker exec -it ms-postgres psql -U postgres -d saas_chat
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

---

### High Memory Usage

**Solutions:**

```bash
# Check memory usage
docker stats

# Restart services
docker-compose restart

# Increase memory limits in docker-compose.yml
# Add under service definition:
# mem_limit: 512m
```

---

## Development Environment

### Hot Reload Not Working

**Solutions:**

```bash
# Ensure nodemon is installed
npm install -D nodemon

# Check nodemon config in package.json
# Should have: "dev": "nodemon src/index.ts"

# Try clearing cache
npm run clean
npm install
npm run dev
```

---

### Git Issues

**Issue:** Cannot commit or push

**Solutions:**

```bash
# Check git status
git status

# Discard local changes
git checkout -- .

# Force push (use with caution)
git push -f origin branch-name

# Reset to remote
git fetch origin
git reset --hard origin/main
```

---

## Testing Issues

### E2E Tests Failing

**Solutions:**

```bash
# Start all services first
npm run dev:backend

# Run tests
cd backend/tests/e2e
npm test

# Check test logs
cat test-results.log
```

---

### Integration Tests Timeout

**Solutions:**

1. Increase test timeout in configuration
2. Check service health before tests
3. Verify test data setup

```typescript
// jest.config.js
module.exports = {
  testTimeout: 30000, // 30 seconds
};
```

---

## Monitoring & Debugging

### Enable Debug Logging

```bash
# Add to .env
DEBUG=true
LOG_LEVEL=debug

# Restart services
npm run dev
```

---

### Check Service Logs

```bash
# View all service logs
npm run dev

# Individual service logs
cd backend/services/auth-service && npm run dev

# Docker logs
docker-compose logs -f
docker-compose logs -f auth-service
```

---

## Production Issues

### Service Crashes

**Diagnostics:**

```bash
# Check service status
docker-compose ps

# View crash logs
docker-compose logs --tail=100 service-name

# Check system resources
docker stats
```

**Solutions:**

1. Restart crashed service
2. Check for resource limits
3. Review error logs
4. Scale horizontally if needed

---

### Database Performance

**Solutions:**

```bash
# Check connection pool
# In service code, verify pool settings

# Add indexes for slow queries
# In Prisma schema:
@@index([field_name])

# Run ANALYZE
docker exec -it ms-postgres psql -U postgres -c "ANALYZE;"
```

---

## Quick Reference Commands

### Service Management

```bash
# Start all services
npm run dev

# Start individual service
cd backend/services/auth-service && npm run dev

# Stop all services
Ctrl+C (in terminal)

# Restart infrastructure
docker-compose restart
```

### Health Checks

```bash
# Check all services
curl http://localhost:4000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
```

### Database Operations

```bash
# Connect to PostgreSQL
docker exec -it ms-postgres psql -U postgres -d saas_chat

# Run migrations
cd backend/services/auth-service
npx prisma migrate dev

# Reset database
npx prisma migrate reset
```

### Cache Operations

```bash
# Connect to Redis
docker exec -it ms-redis redis-cli

# Clear cache
FLUSHALL
```

---

## Getting Help

### Documentation

- [README.md](../README.md) - Project overview
- [Backend README](../backend/README.md) - Backend setup
- [CODEBASE_INDEX.md](../.claude/CODEBASE_INDEX.md) - Code navigation
- [Deployment Guide](./deployment/README.md) - Production deployment

### Common Solutions Summary

| Issue | Quick Fix |
|-------|-----------|
| Connection refused | Check if services are running on correct ports |
| Port in use | Kill process or use different port |
| Database connection | Verify PostgreSQL is running and DATABASE_URL is correct |
| Redis timeout | Check if Redis is running |
| JWT errors | Verify JWT_SECRET is set and consistent |
| CORS errors | Check API Gateway CORS configuration |
| TypeScript errors | Regenerate Prisma client, run type-check |

### Emergency Checklist

When everything is broken:

1. [ ] Stop all services (Ctrl+C)
2. [ ] Check if Docker containers are running
3. [ ] Restart Docker containers
4. [ ] Verify .env files exist
5. [ ] Start API Gateway (port 4000)
6. [ ] Start Auth Service (port 3001)
7. [ ] Test health endpoints
8. [ ] Check logs for errors

---

**Last Updated:** 2025-11-12
**Maintained By:** Development Team
