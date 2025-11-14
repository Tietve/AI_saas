# Backend - SaaS Chat Application

Backend microservices cho SaaS Chat Application.

## 🏗 Architecture

Microservices architecture với:
- **API Gateway** (port 4000) - Reverse proxy và routing
- **Auth Service** (port 3001) - Authentication & authorization
- **Chat Service** (port 3002) - Chat & messaging
- **Billing Service** (port 3003) - Subscription & payments
- **Analytics Service** (port 3004) - Analytics & metrics

## 📁 Structure

```
backend/
├── api-gateway/           # API Gateway
├── services/              # Microservices
│   ├── auth-service/
│   ├── chat-service/
│   ├── billing-service/
│   ├── analytics-service/
│   └── email-worker/
├── shared/                # Shared libraries
├── infrastructure/        # Infrastructure code
├── k8s/                   # Kubernetes manifests
├── scripts/               # Utility scripts
├── tests/                 # Integration tests
├── docker-compose.yml     # Docker Compose config
└── package.json           # Backend workspace
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL, Redis, RabbitMQ (via Docker)

### Setup

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Start infrastructure services:**
```bash
docker-compose up -d
```

3. **Setup environment variables:**
```bash
# Copy .env.template to .env and fill in values
cp .env.template .env

# Sync .env to all services
./sync-all-env.sh
```

4. **Generate Prisma clients:**
```bash
cd services/auth-service && npx prisma generate
cd services/chat-service && npx prisma generate
cd services/billing-service && npx prisma generate
```

5. **Start services:**

**Option A: Start all (recommended for development):**
```bash
npm run dev
```

**Option B: Start individually:**
```bash
# Terminal 1 - API Gateway
cd api-gateway && npm run dev

# Terminal 2 - Auth Service
cd services/auth-service && npm run dev

# Terminal 3 - Chat Service
cd services/chat-service && npm run dev

# Terminal 4 - Billing Service
cd services/billing-service && npm run dev

# Terminal 5 - Analytics Service
cd services/analytics-service && npm run dev
```

## 📊 Services Status

Access health checks:
- API Gateway: http://localhost:4000/health
- Auth Service: http://localhost:3001/health
- Chat Service: http://localhost:3002/health
- Billing Service: http://localhost:3003/health
- Analytics Service: http://localhost:3004/health

## 📚 Documentation

See `/docs` folder in root for detailed documentation:
- [API Documentation](../docs/api/)
- [Architecture](../docs/architecture/)
- [Database Schema](../docs/database/)
- [Deployment Guide](../docs/deployment/)

## 🛠 Development

### Available Scripts

```bash
npm run dev          # Start all services in development mode
npm run build        # Build all services
npm run test         # Run tests
npm run lint         # Lint code
npm run type-check   # TypeScript type checking
```

### Environment Variables

Each service requires its own `.env` file. Use `sync-all-env.sh` to sync from root `.env`:

```bash
./sync-all-env.sh
```

## 🐳 Docker

### Start Infrastructure
```bash
docker-compose up -d
```

### Stop Infrastructure
```bash
docker-compose down
```

### Check Container Status
```bash
docker-compose ps
```

## 🧪 Testing

Run integration tests:
```bash
node test-full-integration.js
```

Verify infrastructure:
```bash
node verify-infrastructure.js
```

## 📦 Deployment

### Development
Services run on localhost with default ports.

### Production
See [Deployment Guide](../docs/deployment/DEPLOYMENT_GUIDE.md) for:
- Azure deployment
- Kubernetes deployment
- Docker Compose production setup

## 🔧 Troubleshooting

### Common Issues

**Connection Refused (ERR_CONNECTION_REFUSED):**
```bash
# Ensure API Gateway is running on port 4000
curl http://localhost:4000/health

# If not running, start it
cd api-gateway && npm run dev

# Ensure auth-service is running on port 3001
curl http://localhost:3001/health

# If not running, start it
cd services/auth-service && npm run dev
```

**Port conflicts:**
```bash
# Check which ports are in use
netstat -ano | findstr ":4000"
netstat -ano | findstr ":3001"

# Kill process if needed (Windows)
taskkill /F /PID <PID>
```

**Database connection issues:**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View logs
docker logs ms-postgres

# Restart if needed
docker-compose restart postgres
```

**RabbitMQ issues:**
```bash
# Check RabbitMQ
docker ps | grep rabbitmq

# Access management UI
# http://localhost:15672 (admin/admin)
```

### More Help

See [docs/TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md) for comprehensive troubleshooting guide including:
- Connection errors
- JWT token issues
- Prisma migration problems
- CORS errors
- Performance issues

## 📝 Notes

- This backend is part of a monorepo structure
- Frontend is located at `../frontend/`
- Shared documentation is at `../docs/`

## 🔗 Links

- [Main README](../README.md)
- [Frontend README](../frontend/README.md)
- [Documentation](../docs/)

---

**For detailed backend architecture and roadmap, see: [docs/BACKEND_ROADMAP.md](../docs/BACKEND_ROADMAP.md)**
