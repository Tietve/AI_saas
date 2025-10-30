# 🚀 Microservices Migration Guide

## Tổng quan

Hướng dẫn chi tiết migration từ Next.js monolith sang microservices architecture với **fully automated** testing và deployment.

---

## 📊 Architecture Overview

### Before (Monolith)
```
┌─────────────────────────────────────┐
│         Next.js Application          │
│                                      │
│  ┌────────────────────────────────┐ │
│  │     Frontend (React)           │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │   API Routes (Backend)         │ │
│  │   - /api/auth/*                │ │
│  │   - /api/chat/*                │ │
│  │   - /api/payment/*             │ │
│  │   - /api/user/*                │ │
│  └────────────────────────────────┘ │
│                                      │
│         Database (PostgreSQL)        │
└─────────────────────────────────────┘
```

### After (Microservices)
```
┌──────────────────────────────────────────────────────────────┐
│                     API Gateway (Kong)                        │
│                    Port 8000 / 8443                          │
└──────────────────────────────────────────────────────────────┘
           │
           ├─────────────┬──────────────┬──────────────┬──────────────┐
           │             │              │              │              │
    ┌──────▼─────┐ ┌────▼────┐  ┌──────▼─────┐ ┌──────▼─────┐ ┌─────▼──────┐
    │   Auth     │ │  Chat   │  │  Billing   │ │   User     │ │Notification│
    │  Service   │ │ Service │  │  Service   │ │  Service   │ │  Service   │
    │  :3001     │ │  :3002  │  │   :3003    │ │   :3005    │ │   :3004    │
    └────────────┘ └─────────┘  └────────────┘ └────────────┘ └────────────┘
           │             │              │              │              │
           │        ┌────▼─────┐        │              │              │
           │        │ MongoDB  │        │              │              │
           │        │  :27017  │        │              │              │
           │        └──────────┘        │              │              │
           │                            │              │              │
    ┌──────▼────────────────────────────▼──────────────▼──────────────▼─┐
    │                PostgreSQL Database (:5432)                        │
    └───────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────────────────────┐
    │                    Redis Cache (:6379)                            │
    └──────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────────────────────┐
    │                  RabbitMQ Message Queue (:5672)                   │
    └──────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────────────────────┐
    │          Monitoring: Prometheus (:9090) + Grafana (:3100)        │
    └──────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Migration Plan

### Phase 1: Infrastructure Setup (Tuần 1)
✅ Project structure created
✅ Docker Compose configured
✅ Automation framework ready
✅ Shared libraries created

### Phase 2: Auth Service (Tuần 2-3)
- Migrate authentication logic
- Session management
- Email verification
- Password reset
- Account lockout

### Phase 3: Message Queue (Tuần 4)
- BullMQ setup
- Email queue
- AI processing queue
- Webhook queue

### Phase 4: Chat Service (Tuần 5-6)
- AI provider routing
- Conversation management
- Message streaming
- Token tracking

### Phase 5: Billing Service (Tuần 7-8)
- PayOS integration
- Subscription management
- Webhook handling
- Invoice generation

### Phase 6: Monitoring (Tuần 9)
- Prometheus metrics
- Grafana dashboards
- Alerting rules

### Phase 7: API Gateway (Tuần 10)
- Kong configuration
- Rate limiting
- Load balancing
- SSL termination

### Phase 8: Multi-Database (Tuần 11)
- PostgreSQL for transactional data
- MongoDB for chat messages
- Redis for caching
- ClickHouse for analytics

### Phase 9: Kubernetes (Tuần 12)
- K8s manifests
- Auto-scaling
- Health checks
- Production deployment

---

## 🚀 Quick Start

### 1. Start Infrastructure

```bash
# Start all infrastructure services
docker-compose -f docker-compose.microservices.yml up -d

# Verify all services are running
docker-compose -f docker-compose.microservices.yml ps

# Check logs
docker-compose -f docker-compose.microservices.yml logs -f
```

Services available:
- PostgreSQL: `localhost:5432`
- MongoDB: `localhost:27017`
- Redis: `localhost:6379`
- RabbitMQ: `localhost:5672` (Management UI: `localhost:15672`)
- Prometheus: `localhost:9090`
- Grafana: `localhost:3100` (admin/admin)
- Kong Gateway: `localhost:8000` (Admin API: `localhost:8001`)

### 2. Run Automated Migration

```bash
# Install automation dependencies
cd automation
npm install
cd ..

# Migrate single service (AUTH FIRST!)
node automation/auto-migrate.js auth-service

# Watch the magic happen! 🎩✨
# The script will:
# 1. Generate boilerplate code
# 2. Copy business logic from Next.js
# 3. Generate tests
# 4. Run tests
# 5. Auto-fix failures
# 6. Retry until pass (max 5 times)
# 7. Generate documentation
```

### 3. Verify Migration

```bash
# Check service is running
cd services/auth-service
npm install
npm run dev

# In another terminal, test the API
curl http://localhost:3001/health

# Expected response:
# {
#   "status": "healthy",
#   "service": "auth-service",
#   "uptime": 10.5,
#   "timestamp": "2024-10-25T..."
# }
```

### 4. Run Tests

```bash
cd services/auth-service
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### 5. Migrate Remaining Services

```bash
# Migrate all services at once
node automation/auto-migrate.js --all

# Or one by one
node automation/auto-migrate.js chat-service
node automation/auto-migrate.js billing-service
node automation/auto-migrate.js user-service
node automation/auto-migrate.js notification-service
```

---

## 📁 Project Structure

```
my-saas-chat/
├── services/
│   ├── auth-service/           # Port 3001
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── repositories/
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   ├── config/
│   │   │   ├── utils/
│   │   │   └── app.ts
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   ├── integration/
│   │   │   └── e2e/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── chat-service/           # Port 3002
│   ├── billing-service/        # Port 3003
│   ├── notification-service/   # Port 3004
│   └── user-service/           # Port 3005
│
├── shared/                     # Shared libraries
│   ├── types/
│   │   └── common.ts
│   ├── errors/
│   │   └── AppError.ts
│   ├── utils/
│   │   └── logger.ts
│   ├── queue/
│   │   └── queue.service.ts
│   ├── validators/
│   ├── database/
│   └── monitoring/
│
├── gateway/                    # API Gateway config
│   └── kong.yml
│
├── infrastructure/
│   ├── k8s/                    # Kubernetes manifests
│   ├── terraform/              # Infrastructure as Code
│   └── monitoring/
│       ├── prometheus.yml
│       └── grafana/
│
├── automation/
│   ├── auto-migrate.js         # Main automation script
│   └── README.md
│
├── frontend/                   # Next.js (BFF pattern)
│   └── src/
│       └── app/
│           └── api/
│               └── [...proxy]/  # Proxy to microservices
│
├── docker-compose.microservices.yml
└── MICROSERVICES_MIGRATION_GUIDE.md (this file)
```

---

## 🔧 Configuration

### Environment Variables

Mỗi service cần các env vars sau:

```bash
# Common
NODE_ENV=development
PORT=300X
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/saas_db
MONGODB_URL=mongodb://mongo:mongo@localhost:27017/saas_chat
REDIS_URL=redis://localhost:6379

# Message Queue
RABBITMQ_URL=amqp://admin:admin@localhost:5672

# Service-specific
# (Auth service)
AUTH_SECRET=your-secret-key-min-32-chars
JWT_EXPIRY=24h

# (Chat service)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# (Billing service)
PAYOS_CLIENT_ID=...
PAYOS_API_KEY=...
PAYOS_CHECKSUM_KEY=...
```

Copy template:
```bash
cp .env.example services/auth-service/.env
# Edit và điền giá trị thực
```

---

## 🧪 Testing Strategy

### 1. Unit Tests (70% coverage minimum)
```typescript
// tests/unit/auth.service.test.ts
describe('AuthService', () => {
  it('should hash password correctly', async () => {
    const hashed = await authService.hashPassword('password123');
    expect(hashed).not.toBe('password123');
    expect(await bcrypt.compare('password123', hashed)).toBe(true);
  });
});
```

### 2. Integration Tests
```typescript
// tests/integration/signup.test.ts
describe('POST /api/auth/signup', () => {
  it('should create new user', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123!'
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('userId');
  });
});
```

### 3. E2E Tests
```typescript
// tests/e2e/auth-flow.test.ts
describe('Complete Auth Flow', () => {
  it('should signup → verify → login', async () => {
    // 1. Signup
    const signupRes = await signup();

    // 2. Get verification token from database
    const token = await getVerificationToken(signupRes.body.data.email);

    // 3. Verify email
    await verifyEmail(token);

    // 4. Login
    const loginRes = await login();

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data).toHaveProperty('session Token');
  });
});
```

---

## 📊 Monitoring

### Prometheus Metrics

Mỗi service expose metrics tại `/metrics`:

```
# HTTP requests
http_requests_total{method="POST", route="/api/auth/signin", status_code="200"} 150

# Request duration
http_request_duration_seconds{method="POST", route="/api/auth/signin", quantile="0.95"} 0.25

# Active connections
active_connections{service="auth-service"} 45

# Queue metrics
queue_jobs_total{queue="email", status="completed"} 1250
queue_jobs_total{queue="email", status="failed"} 5

# Database metrics
db_query_duration_seconds{query="findUserByEmail", quantile="0.99"} 0.015
```

### Grafana Dashboards

Access: `http://localhost:3100` (admin/admin)

Pre-configured dashboards:
1. **API Performance** - Request rates, latency, error rates
2. **Database Performance** - Query duration, connection pool
3. **Queue Health** - Job throughput, pending jobs, failures
4. **Service Health** - Uptime, memory, CPU
5. **Business Metrics** - Signups, logins, token usage, revenue

---

## 🚢 Deployment

### Docker Build

```bash
# Build single service
cd services/auth-service
npm run build
docker build -t auth-service:latest .

# Run
docker run -p 3001:3001 \
  -e DATABASE_URL=... \
  -e REDIS_URL=... \
  auth-service:latest
```

### Kubernetes Deployment

```bash
# Apply manifests
kubectl apply -f infrastructure/k8s/

# Check status
kubectl get pods
kubectl get services

# View logs
kubectl logs -f deployment/auth-service

# Scale
kubectl scale deployment auth-service --replicas=5
```

### CI/CD Pipeline

GitHub Actions workflow tự động:
1. Run tests
2. Build Docker images
3. Push to registry
4. Deploy to staging
5. Run E2E tests
6. Deploy to production (manual approval)

---

## 🔒 Security Checklist

- [ ] Secrets stored in environment variables (không hardcode)
- [ ] HTTPS enforced (Kong SSL termination)
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Input validation (Zod schemas)
- [ ] SQL injection prevention (Prisma ORM)
- [ ] XSS prevention (response encoding)
- [ ] CSRF protection
- [ ] Password hashing (bcrypt/argon2)
- [ ] JWT tokens with expiry
- [ ] Account lockout after failed attempts
- [ ] Audit logging enabled
- [ ] Security headers (Helmet.js)
- [ ] Dependency scanning (npm audit)

---

## 📚 Documentation

Sau khi migration xong, generate API docs:

```bash
# Install Swagger/OpenAPI generator
npm install -g @openapitools/openapi-generator-cli

# Generate docs for each service
cd services/auth-service
npx swagger-jsdoc -d swagger.json src/**/*.ts
```

---

## 🐛 Troubleshooting

### Service won't start

```bash
# Check logs
docker-compose -f docker-compose.microservices.yml logs auth-service

# Common issues:
# 1. Port already in use
lsof -i :3001
kill -9 <PID>

# 2. Database connection failed
psql -h localhost -U postgres -d saas_db

# 3. Redis connection failed
redis-cli ping
```

### Tests failing

```bash
# Run with verbose output
npm test -- --verbose

# Run single test file
npm test -- tests/unit/auth.service.test.ts

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Migration script fails

```bash
# Check migration report
cat services/auth-service/MIGRATION_REPORT.json

# Re-run with specific attempt
node automation/auto-migrate.js auth-service --max-attempts=10

# Skip failing tests temporarily
node automation/auto-migrate.js auth-service --skip-tests
```

---

## 📞 Support

Nếu gặp vấn đề:

1. Check migration report
2. Check service logs
3. Review test output
4. Check infrastructure health

---

## ✅ Next Steps

Sau khi migration xong Phase 1-3 (Auth + Queue):

1. [ ] Update Next.js frontend to call auth-service
2. [ ] Setup API Gateway routing
3. [ ] Configure monitoring alerts
4. [ ] Run load tests
5. [ ] Prepare production deployment

Sau Phase 9 (Full migration):

1. [ ] Cutover production traffic
2. [ ] Decommission Next.js API routes
3. [ ] Optimize performance
4. [ ] Scale services based on load

---

**Let's build something amazing! 🚀**
