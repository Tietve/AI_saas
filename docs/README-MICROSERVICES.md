# 🎯 AI Chat SaaS Platform - Microservices Edition

> **Migration từ Next.js Monolith → Production-Ready Microservices**

## 🌟 Tổng quan

Đây là phiên bản microservices của AI Chat SaaS Platform, được thiết kế để:

✅ **Scale horizontally** - Mỗi service có thể scale độc lập
✅ **Fault isolation** - Lỗi ở một service không ảnh hưởng service khác
✅ **Tech flexibility** - Mỗi service có thể dùng tech stack khác nhau
✅ **Team autonomy** - Teams có thể phát triển song song
✅ **Deployment independence** - Deploy từng service riêng lẻ

---

## 📊 Architecture

### System Overview

```
                         ┌─────────────────────┐
                         │   Load Balancer     │
                         │     (Nginx/ALB)     │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │   API Gateway       │
                         │   (Kong :8000)      │
                         └──────────┬──────────┘
                                    │
        ┌───────────┬───────────┬───┴────┬───────────┬───────────┐
        │           │           │        │           │           │
   ┌────▼────┐ ┌───▼────┐ ┌───▼───┐ ┌──▼────┐ ┌───▼──────┐    │
   │  Auth   │ │  Chat  │ │Billing│ │ User  │ │  Notif   │    │
   │ :3001   │ │ :3002  │ │ :3003 │ │ :3005 │ │  :3004   │    │
   └────┬────┘ └───┬────┘ └───┬───┘ └──┬────┘ └───┬──────┘    │
        │          │          │        │           │           │
        │     ┌────▼──────┐   │        │           │           │
        │     │  MongoDB  │   │        │           │           │
        │     └───────────┘   │        │           │           │
        │                     │        │           │           │
   ┌────▼─────────────────────▼────────▼───────────▼───────────▼─┐
   │              PostgreSQL (Primary + Replicas)                 │
   └──────────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────────┐
   │           Redis (Cache + Session Store + Queue)              │
   └──────────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────────┐
   │        RabbitMQ (Message Queue for async processing)         │
   └──────────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────────┐
   │         Prometheus + Grafana (Monitoring & Alerting)         │
   └──────────────────────────────────────────────────────────────┘
```

### Services Breakdown

| Service | Port | Database | Purpose | Dependencies |
|---------|------|----------|---------|--------------|
| **Auth Service** | 3001 | PostgreSQL | Authentication, sessions, user management | Redis, Email |
| **Chat Service** | 3002 | MongoDB | AI chat, conversations, message streaming | Redis, AI providers, Queue |
| **Billing Service** | 3003 | PostgreSQL | Payments, subscriptions, invoices | PostgreSQL, Queue |
| **Notification Service** | 3004 | PostgreSQL | Email, push notifications | Queue, SMTP |
| **User Service** | 3005 | PostgreSQL | User profiles, settings, usage tracking | PostgreSQL, Redis |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.0.0
- **Docker** >= 24.0.0
- **Docker Compose** >= 2.20.0
- **npm** >= 10.0.0

### 1. Start Infrastructure

```bash
# Khởi động tất cả infrastructure services (PostgreSQL, MongoDB, Redis, RabbitMQ, Kong, Prometheus, Grafana)
npm run dev:infra

# Hoặc
docker-compose -f docker-compose.microservices.yml up -d

# Verify services đang chạy
npm run ps:infra
```

**Infrastructure URLs:**

- 🗄️ **PostgreSQL**: `localhost:5432` (user: postgres, pass: postgres)
- 🍃 **MongoDB**: `localhost:27017` (user: mongo, pass: mongo)
- 🔴 **Redis**: `localhost:6379`
- 🐰 **RabbitMQ UI**: http://localhost:15672 (admin/admin)
- 🦍 **Kong Admin**: http://localhost:8001
- 🦍 **Kong Gateway**: http://localhost:8000
- 📊 **Prometheus**: http://localhost:9090
- 📈 **Grafana**: http://localhost:3100 (admin/admin)

### 2. Auto-Migrate Services

**FULLY AUTOMATED** - Script tự động viết code, test, fix, retry!

```bash
# Install automation dependencies
cd automation
npm install chalk
cd ..

# Migrate Auth Service (RECOMMENDED FIRST)
npm run migrate:auth

# Watch console output:
# 🤖 Starting automated migration for auth-service...
# 📁 Setting up service directory...
# ✓ Directory structure created
# 📝 Generating boilerplate code...
# ✓ Boilerplate code generated
# 📋 Copying business logic from Next.js...
# ✓ Copied 8 route files
# 🧪 Generating test suites...
# ✓ Test suites generated
# 🔄 Starting auto-test loop...
# 📊 Attempt 1/5
# Installing dependencies...
# Building service...
# Running tests...
# ✅ All tests passed!
# 🔗 Running integration tests...
# 📚 Generating documentation...
# ✓ Documentation generated
# ✅ auth-service migration completed successfully!
```

**Migrate remaining services:**

```bash
npm run migrate:chat
npm run migrate:billing
npm run migrate:notification
npm run migrate:user

# Or migrate all at once (takes 1-2 hours)
npm run migrate:all
```

### 3. Run Individual Services

```bash
# Auth Service
cd services/auth-service
npm install
npm run dev

# Test
curl http://localhost:3001/health
# {"status":"healthy","service":"auth-service",...}
```

```bash
# Chat Service
cd services/chat-service
npm install
npm run dev
```

```bash
# All services concurrently
npm install -g concurrently
concurrently \
  "npm run dev:auth" \
  "npm run dev:chat" \
  "npm run dev:billing" \
  "npm run dev:notification" \
  "npm run dev:user"
```

---

## 📁 Project Structure

```
my-saas-chat/
├── services/                          # Microservices
│   ├── auth-service/                  # :3001
│   │   ├── src/
│   │   │   ├── controllers/          # Request handlers
│   │   │   ├── services/             # Business logic
│   │   │   ├── repositories/         # Data access
│   │   │   ├── middleware/           # Express middleware
│   │   │   ├── routes/               # Route definitions
│   │   │   ├── config/               # Configuration
│   │   │   ├── utils/                # Utilities
│   │   │   └── app.ts                # Express app
│   │   ├── tests/                    # Test suites
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── chat-service/                  # :3002
│   ├── billing-service/               # :3003
│   ├── notification-service/          # :3004
│   └── user-service/                  # :3005
│
├── shared/                            # Shared libraries
│   ├── types/                         # TypeScript types
│   │   └── common.ts                 # Common enums, interfaces
│   ├── errors/                        # Error classes
│   │   └── AppError.ts               # Standard errors
│   ├── utils/                         # Utilities
│   │   └── logger.ts                 # Pino logger
│   ├── queue/                         # Message queue
│   │   └── queue.service.ts          # BullMQ wrapper
│   ├── validators/                    # Zod schemas
│   ├── database/                      # DB utilities
│   └── monitoring/                    # Metrics
│
├── gateway/                           # API Gateway
│   ├── kong.yml                      # Kong configuration
│   └── plugins/                      # Custom Kong plugins
│
├── infrastructure/                    # IaC & configs
│   ├── k8s/                          # Kubernetes manifests
│   │   ├── auth-service/
│   │   ├── chat-service/
│   │   └── ...
│   ├── terraform/                    # Terraform configs
│   │   ├── aws/
│   │   ├── azure/
│   │   └── gcp/
│   └── monitoring/
│       ├── prometheus.yml
│       └── grafana/
│           ├── dashboards/
│           └── datasources/
│
├── automation/                        # Migration automation
│   ├── auto-migrate.js               # Main script (MAGIC! ✨)
│   └── README.md
│
├── frontend/                          # Next.js (BFF pattern)
│   └── src/
│       └── app/
│           └── api/
│               └── [...proxy]/       # Proxy to microservices
│
├── docs/                              # Documentation
│   ├── architecture/
│   ├── api/
│   └── deployment/
│
├── docker-compose.microservices.yml   # Infrastructure
├── package-microservices.json         # Workspace config
├── MICROSERVICES_MIGRATION_GUIDE.md   # Detailed guide
└── README-MICROSERVICES.md            # This file
```

---

## 🧪 Testing

### Unit Tests

```bash
cd services/auth-service
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Integration Tests

```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
npm run test:integration
```

### E2E Tests

```bash
# Start all services
docker-compose -f docker-compose.microservices.yml up -d
npm run dev:all

# Run E2E tests
npm run test:e2e
```

### Load Tests

```bash
# Install k6
brew install k6  # macOS
# or
choco install k6  # Windows

# Run load test
k6 run infrastructure/load-tests/auth-flow.js
```

---

## 📊 Monitoring & Observability

### Metrics (Prometheus)

Each service exposes metrics at `/metrics`:

```bash
curl http://localhost:3001/metrics
```

**Key metrics:**
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request latency
- `db_query_duration_seconds` - Database query latency
- `queue_jobs_total` - Queue job counts
- `active_connections` - Active connections

### Dashboards (Grafana)

Access: http://localhost:3100 (admin/admin)

**Pre-configured dashboards:**
1. **API Performance** - Request rates, latency (p50, p95, p99), error rates
2. **Database Performance** - Query duration, connection pool, slow queries
3. **Queue Health** - Job throughput, pending jobs, failures, retry rates
4. **Service Health** - Uptime, memory usage, CPU usage, restart count
5. **Business Metrics** - User signups, active users, token usage, revenue (MRR)

### Alerting

Configured in Prometheus `alert.rules.yml`:

- ⚠️ High error rate (>5% in 5min)
- ⚠️ High latency (p99 >1s)
- ⚠️ Service down
- ⚠️ Database connection pool exhausted
- ⚠️ Queue lag >1000 jobs
- ⚠️ Memory usage >90%

Alerts sent to:
- Slack
- PagerDuty
- Email

---

## 🚢 Deployment

### Docker

```bash
# Build image
cd services/auth-service
docker build -t auth-service:1.0.0 .

# Run
docker run -d \
  -p 3001:3001 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  auth-service:1.0.0

# Push to registry
docker tag auth-service:1.0.0 myregistry.azurecr.io/auth-service:1.0.0
docker push myregistry.azurecr.io/auth-service:1.0.0
```

### Kubernetes

```bash
# Apply all manifests
kubectl apply -f infrastructure/k8s/

# Check deployment
kubectl get pods
kubectl get services
kubectl get ingress

# View logs
kubectl logs -f deployment/auth-service

# Scale
kubectl scale deployment auth-service --replicas=5

# Rollout update
kubectl set image deployment/auth-service auth-service=auth-service:1.1.0
kubectl rollout status deployment/auth-service
```

### CI/CD (GitHub Actions)

Workflow tự động:

```yaml
# .github/workflows/deploy.yml
1. Lint & Type Check
2. Run Tests (unit + integration)
3. Build Docker images
4. Push to container registry
5. Deploy to Staging
6. Run E2E tests on staging
7. Deploy to Production (manual approval required)
8. Run smoke tests
9. Notify team (Slack)
```

---

## 🔒 Security

### Implemented

- ✅ HTTPS/TLS encryption
- ✅ API Gateway rate limiting
- ✅ JWT authentication with expiry
- ✅ CSRF protection
- ✅ XSS prevention
- ✅ SQL injection prevention (Prisma ORM)
- ✅ Password hashing (bcrypt)
- ✅ Account lockout after failed logins
- ✅ Input validation (Zod)
- ✅ Security headers (Helmet.js)
- ✅ CORS configuration
- ✅ Secrets management (env vars)

### Recommended

- 🔲 WAF (Web Application Firewall)
- 🔲 DDoS protection (Cloudflare)
- 🔲 Secrets rotation (HashiCorp Vault)
- 🔲 Penetration testing
- 🔲 Security audits
- 🔲 SIEM integration
- 🔲 2FA/MFA for admin accounts

---

## 📚 Documentation

### API Documentation

Auto-generated OpenAPI/Swagger docs:

```bash
# Generate API docs
cd services/auth-service
npm run docs:generate

# Start docs server
npm run docs:serve
# Open http://localhost:4000
```

### Architecture Diagrams

- System Architecture: `docs/architecture/system.md`
- Data Flow: `docs/architecture/data-flow.md`
- Deployment: `docs/deployment/overview.md`

---

## 🐛 Troubleshooting

### Services won't start

```bash
# Check Docker logs
docker-compose -f docker-compose.microservices.yml logs

# Check specific service
docker-compose -f docker-compose.microservices.yml logs auth-service

# Restart services
docker-compose -f docker-compose.microservices.yml restart
```

### Database connection issues

```bash
# Test PostgreSQL connection
psql -h localhost -U postgres -d saas_db

# Test MongoDB connection
mongosh mongodb://mongo:mongo@localhost:27017

# Test Redis connection
redis-cli ping
```

### Migration script failures

```bash
# Check migration report
cat services/auth-service/MIGRATION_REPORT.json

# Re-run with more attempts
node automation/auto-migrate.js auth-service --max-attempts=10

# View detailed logs
DEBUG=* node automation/auto-migrate.js auth-service
```

---

## 📖 Learning Resources

### Microservices

- [Building Microservices](https://www.oreilly.com/library/view/building-microservices-2nd/9781492034018/) - Sam Newman
- [Microservices Patterns](https://microservices.io/patterns/index.html) - Chris Richardson

### Message Queues

- [BullMQ Documentation](https://docs.bullmq.io/)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)

### API Gateway

- [Kong Gateway Docs](https://docs.konghq.com/)
- [API Gateway Pattern](https://microservices.io/patterns/apigateway.html)

### Monitoring

- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [Grafana Tutorials](https://grafana.com/tutorials/)

---

## 🤝 Contributing

### Development Workflow

1. Create feature branch: `git checkout -b feature/new-service`
2. Make changes
3. Run tests: `npm test`
4. Run linter: `npm run lint`
5. Commit: `git commit -m "feat: add new service"`
6. Push: `git push origin feature/new-service`
7. Create Pull Request

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: fix bug
docs: update documentation
style: format code
refactor: refactor code
test: add tests
chore: update dependencies
```

---

## 📞 Support

- 📧 Email: support@example.com
- 💬 Slack: #microservices-support
- 📖 Wiki: https://wiki.example.com
- 🐛 Issues: https://github.com/yourorg/repo/issues

---

## 📝 License

MIT License - See LICENSE file

---

## 🎉 Acknowledgments

- **Next.js Team** - Amazing framework
- **Prisma Team** - Best ORM
- **Kong Team** - Powerful API Gateway
- **Bull Team** - Reliable message queue
- **Pino Team** - Fast logger

---

**Happy Coding! 🚀**

*Built with ❤️ by Your Team*
