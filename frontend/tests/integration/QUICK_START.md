# Integration Tests - Quick Start Guide

## 1. Start Backend Services

```bash
# Terminal 1 - Start infrastructure
cd backend
npm run docker:up

# Terminal 2 - Start API Gateway
cd backend/api-gateway
npm run dev

# Terminal 3 - Start Auth Service
cd backend/services/auth-service
npm run dev

# Terminal 4 - Start Chat Service
cd backend/services/chat-service
npm run dev

# Terminal 5 - Start Billing Service
cd backend/services/billing-service
npm run dev

# Or use the all-in-one command (if available)
cd backend
npm run dev:all
```

## 2. Verify Services Running

```bash
# Quick health check
curl http://localhost:4000/health      # API Gateway
curl http://localhost:3001/health      # Auth Service
curl http://localhost:3003/health      # Chat Service
curl http://localhost:3004/health      # Billing Service
```

## 3. Run Integration Tests

```bash
# From frontend directory
cd frontend

# Run all integration tests
npx playwright test tests/integration/

# Or run specific test files
npx playwright test tests/integration/services-health.spec.ts
npx playwright test tests/integration/auth-api.spec.ts
npx playwright test tests/integration/chat-api.spec.ts
npx playwright test tests/integration/billing-api.spec.ts
```

## Expected Output

### All Services Running ✅
```
🏥 Testing all microservices health...
✅ API Gateway is healthy
✅ Auth Service is healthy
✅ Chat Service is healthy
✅ Billing Service is healthy
✅ Analytics Service is healthy
📊 Summary: 5/5 services healthy
✨ All systems operational!
```

### Some Services Down ⚠️
```
🏥 Testing all microservices health...
✅ API Gateway is healthy
✅ Auth Service is healthy
⚠️  Chat Service not available
💡 Check if chat-service is running on port 3003
```

## Test Commands Reference

```bash
# Health checks only (fastest)
npx playwright test services-health.spec.ts

# Auth API tests
npx playwright test auth-api.spec.ts

# Chat API tests
npx playwright test chat-api.spec.ts

# Billing API tests
npx playwright test billing-api.spec.ts

# Run with UI (interactive)
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed

# Debug specific test
npx playwright test auth-api.spec.ts --debug

# Generate HTML report
npx playwright test && npx playwright show-report
```

## Troubleshooting

### Services Won't Start
```bash
# Check if ports already in use (Windows)
netstat -ano | findstr :4000
netstat -ano | findstr :3001
netstat -ano | findstr :3003

# Kill processes using ports
taskkill /F /PID <pid>
```

### Database Connection Issues
```bash
# Restart PostgreSQL
docker-compose restart postgres

# Check PostgreSQL logs
docker-compose logs postgres
```

### Tests Timing Out
```bash
# Increase timeout in playwright.config.ts
# Or set environment variable
export PLAYWRIGHT_TIMEOUT=60000
```

## Quick Validation Checklist

Before running tests:
- [ ] PostgreSQL running (docker ps)
- [ ] Redis running (docker ps)
- [ ] API Gateway running (port 4000)
- [ ] Auth Service running (port 3001)
- [ ] Chat Service running (port 3003)
- [ ] Billing Service running (port 3004)

## First Time Setup

```bash
# 1. Install dependencies
cd frontend
npm install

# 2. Install Playwright browsers
npx playwright install

# 3. Start backend
cd ../backend
npm run docker:up
npm run dev:all

# 4. Run tests
cd ../frontend
npm run test:integration
```

## Common Issues

### "Cannot connect to API Gateway"
- Check if API Gateway is running on port 4000
- Run: `curl http://localhost:4000/health`

### "Auth token unavailable"
- Auth service might be down
- Tests will skip automatically, not fail

### "Service not available"
- Check specific service is running
- Check service logs for errors
- Restart service if needed

### "CORS headers not found"
- Configure CORS in API Gateway
- Add `Access-Control-Allow-Origin` header

## Success Metrics

Your tests are working correctly when you see:
- ✅ All services respond to health checks
- ✅ Auth tests pass (login, signup, token validation)
- ✅ Chat tests pass (send message, get conversations)
- ✅ Billing tests pass (get plans, subscription)
- ✅ Response times < 500ms
- ✅ No unexpected errors in logs

## Next Steps

After successful test run:
1. Review test output for any warnings
2. Check response times (should be <500ms)
3. Verify CORS configuration
4. Add tests for new endpoints
5. Integrate into CI/CD pipeline

---

**Need Help?**
- Check README.md for detailed documentation
- Review individual test files for examples
- Check service logs for specific errors
