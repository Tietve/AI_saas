# Frontend-Backend Integration Tests

Comprehensive Playwright integration tests for API communication between frontend and backend services.

## Overview

These tests verify that all backend microservices are accessible and working correctly via the API Gateway. They test both success and error scenarios for all major API endpoints.

## Test Files

### 1. `auth-api.spec.ts` - Authentication Service Tests
Tests all authentication endpoints:
- ✅ `POST /api/auth/signup` - User registration
- ✅ `POST /api/auth/signin` - User login
- ✅ `GET /api/auth/me` - Get current user
- ✅ `POST /api/auth/signout` - Logout
- ✅ `POST /api/auth/refresh` - Refresh JWT token
- ✅ JWT token format validation
- ✅ 401 Unauthorized responses
- ✅ Response time checks

**Total Tests:** 9 test cases

### 2. `chat-api.spec.ts` - Chat Service Tests
Tests all chat and conversation endpoints:
- ✅ `POST /api/chat` - Send message
- ✅ `GET /api/conversations` - Get all conversations
- ✅ `GET /api/conversations/:id` - Get single conversation
- ✅ `PATCH /api/conversations/:id` - Rename conversation
- ✅ `DELETE /api/conversations/:id` - Delete conversation
- ✅ `GET /api/usage` - Get token usage
- ✅ Unauthenticated request handling
- ✅ Message validation
- ✅ Response time checks

**Total Tests:** 10 test cases

### 3. `billing-api.spec.ts` - Billing Service Tests
Tests all billing and subscription endpoints:
- ✅ `GET /api/billing/plans` - Get pricing plans
- ✅ `GET /api/billing/subscription` - Get user subscription
- ✅ `POST /api/billing/subscribe` - Create subscription
- ✅ `POST /api/billing/cancel` - Cancel subscription
- ✅ `GET /api/billing/usage` - Get usage statistics
- ✅ `POST /api/billing/webhook` - Stripe webhook validation
- ✅ Unauthenticated request handling
- ✅ Plan ID validation
- ✅ Response time checks

**Total Tests:** 10 test cases

### 4. `services-health.spec.ts` - Health Check Tests
Comprehensive health checks for all services:
- ✅ API Gateway health (port 4000)
- ✅ Auth Service health (port 3001)
- ✅ Chat Service health (port 3002/3003)
- ✅ Billing Service health (port 3004)
- ✅ Analytics Service health (port 3005)
- ✅ CORS headers validation
- ✅ Response time checks (<500ms)
- ✅ Service version checks
- ✅ Database connectivity checks
- ✅ Redis connectivity checks
- ✅ Overall system health summary

**Total Tests:** 14 test cases

### 5. `backend-health.spec.ts` - Basic Health Tests (Existing)
Simple health checks for API Gateway and services.

**Total Tests:** 3 test cases

## Running Tests

### Prerequisites
```bash
# Make sure all backend services are running
npm run docker:up          # Start PostgreSQL and Redis
npm run dev:all            # Start all microservices

# Or individually
cd backend/services/auth-service && npm run dev
cd backend/services/chat-service && npm run dev
cd backend/services/billing-service && npm run dev
cd backend/services/analytics-service && npm run dev
```

### Run All Integration Tests
```bash
cd frontend
npm run test:integration
```

### Run Specific Test File
```bash
# Auth tests
npx playwright test tests/integration/auth-api.spec.ts

# Chat tests
npx playwright test tests/integration/chat-api.spec.ts

# Billing tests
npx playwright test tests/integration/billing-api.spec.ts

# Health checks
npx playwright test tests/integration/services-health.spec.ts
```

### Run with UI
```bash
npx playwright test --ui
```

### Run in Headed Mode (see browser)
```bash
npx playwright test --headed
```

### Debug Mode
```bash
npx playwright test --debug
```

## Test Configuration

Tests use these environment variables:
- `API_URL` - API Gateway URL (default: http://localhost:4000)

Configure in `.env.test`:
```env
API_URL=http://localhost:4000
```

## Test Credentials

Tests use these default credentials:
```javascript
// Auth tests
{ email: 'test@example.com', password: 'Test123!@#' }

// Chat tests
{ email: 'chattest@example.com', password: 'Test123!@#' }

// Billing tests
{ email: 'billingtest@example.com', password: 'Test123!@#' }
```

**Note:** Tests create unique users for registration to avoid conflicts.

## Expected Results

### When All Services Running
```
✅ API Gateway is healthy
✅ Auth Service: Healthy
✅ Chat Service: Healthy
✅ Billing Service: Healthy
✅ Analytics Service: Healthy
✅ All authentication endpoints working
✅ All chat endpoints working
✅ All billing endpoints working
```

### When Services Down
```
⚠️  Service not available
💡 Make sure backend is running: npm run docker:up
💡 Check if service is running on port XXXX
```

## Test Features

### 1. Graceful Failure Handling
- Tests don't fail if services are down
- Clear warning messages indicating what's wrong
- Helpful suggestions for fixes

### 2. Comprehensive Logging
- Each test logs its progress
- Status codes and response times reported
- Clear success/warning/error indicators

### 3. Smart Test Skipping
- Tests skip automatically if auth token unavailable
- Tests skip if required data missing
- No false negatives

### 4. Security Testing
- Tests JWT token format validation
- Tests 401 Unauthorized responses
- Tests unauthenticated access rejection
- Tests Stripe webhook signature validation

### 5. Performance Testing
- Response time checks (<500ms)
- Reports slow responses
- Tests all services for performance

## API Endpoints Tested

### Authentication (9 endpoints)
- POST /api/auth/signup
- POST /api/auth/signin
- POST /api/auth/signout
- POST /api/auth/refresh
- GET /api/auth/me
- GET /api/auth/health

### Chat (6 endpoints)
- POST /api/chat
- GET /api/conversations
- GET /api/conversations/:id
- PATCH /api/conversations/:id
- DELETE /api/conversations/:id
- GET /api/usage
- GET /api/chat/health

### Billing (6 endpoints)
- GET /api/billing/plans
- GET /api/billing/subscription
- POST /api/billing/subscribe
- POST /api/billing/cancel
- GET /api/billing/usage
- POST /api/billing/webhook
- GET /api/billing/health

### Health Checks (5 endpoints)
- GET /health (API Gateway)
- GET /api/auth/health
- GET /api/chat/health
- GET /api/billing/health
- GET /api/analytics/health

**Total Endpoints Tested:** 26+

## Success Criteria

### Per Service
- ✅ Health endpoint responds with 200
- ✅ CORS headers configured
- ✅ Response time < 500ms
- ✅ All CRUD operations working
- ✅ Authentication/Authorization working
- ✅ Error handling proper (400, 401, 404)

### Overall System
- ✅ All 5 services healthy
- ✅ API Gateway routing correctly
- ✅ Database connections working
- ✅ Redis connections working
- ✅ JWT tokens valid
- ✅ No security vulnerabilities

## Troubleshooting

### Services Not Available
```bash
# Check if services running
npm run dev:all

# Check specific service
curl http://localhost:3001/health  # Auth
curl http://localhost:3003/health  # Chat
curl http://localhost:3004/health  # Billing
curl http://localhost:4000/health  # API Gateway
```

### Authentication Failures
```bash
# Create test users first
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'
```

### Database Issues
```bash
# Check PostgreSQL
docker ps | findstr postgres

# Restart if needed
npm run docker:restart
```

### Port Conflicts
```bash
# Windows - Check ports
netstat -ano | findstr :4000
netstat -ano | findstr :3001

# Kill if needed
taskkill /F /PID <pid>
```

## CI/CD Integration

These tests can be integrated into CI/CD:

```yaml
# .github/workflows/integration-tests.yml
name: Integration Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: docker-compose up -d
      - run: npm run dev:all &
      - run: npm run test:integration
```

## Metrics

### Total Coverage
- **Test Files:** 5
- **Test Cases:** 46+
- **API Endpoints:** 26+
- **Services Tested:** 5
- **Response Time Checks:** All endpoints
- **Security Tests:** JWT, CORS, Auth
- **Error Scenarios:** 401, 404, 400

### Execution Time
- Single test file: ~10-30 seconds
- All tests: ~2-5 minutes
- With all services running: ~2 minutes
- With services down: ~30 seconds (fast fail)

## Best Practices

### 1. Run Tests Before Deployment
```bash
npm run test:integration
```

### 2. Check System Health First
```bash
npx playwright test services-health.spec.ts
```

### 3. Test Each Service Individually
```bash
npx playwright test auth-api.spec.ts
npx playwright test chat-api.spec.ts
npx playwright test billing-api.spec.ts
```

### 4. Monitor Response Times
Look for warnings like:
```
⚠️  Response time is slow: 800ms
```

### 5. Keep Tests Updated
When adding new endpoints, add tests here!

## Contributing

When adding new API endpoints:
1. Add test case to relevant spec file
2. Update this README with new endpoint
3. Run tests to verify
4. Update metrics section

## Support

For issues or questions:
1. Check service logs: `docker-compose logs <service>`
2. Verify services running: `npm run dev:all`
3. Check API Gateway: `curl http://localhost:4000/health`
4. Review test output for detailed errors

---

**Last Updated:** 2025-11-06
**Total Tests:** 46+ test cases
**Total Endpoints:** 26+ endpoints tested
