# SaaS Chat Application - Monorepo

AI-powered SaaS Chat Application with microservices backend, Next.js frontend, and cost-optimized AI infrastructure.

> **Latest Updates (Nov 2025):**
> - 🚀 **47% Cost Reduction** - Reduced monthly infrastructure costs from $350 to $185
> - 🧪 **200+ Tests** - Comprehensive test suite (unit, integration, E2E, performance)
> - 🏗️ **Shared Services Architecture** - Eliminated 90% code duplication
> - 🔒 **Zero Production Vulnerabilities** - All critical security issues resolved
> - ⚡ **Performance Benchmarks** - Sub-200ms response times with load testing

## 📁 Project Structure

```
my-saas-chat/
├── backend/              # Backend Microservices
│   ├── api-gateway/      # API Gateway (port 4000)
│   ├── services/         # Microservices
│   │   ├── auth-service/       # Authentication (port 3001)
│   │   ├── chat-service/       # Chat & AI (port 3003)
│   │   ├── billing-service/    # Billing (port 3004)
│   │   ├── analytics-service/  # Analytics (port 3005)
│   │   ├── orchestrator-service/ # AI Orchestration (port 3006)
│   │   └── email-worker/       # Email worker
│   ├── shared/           # Shared libraries & services ⭐ NEW
│   │   ├── services/     # Shared AI services (LLM, embeddings, Cloudflare)
│   │   ├── config/       # Shared configuration & validation
│   │   ├── events/       # Event publisher/types
│   │   └── tracing/      # Jaeger tracing utilities
│   ├── tests/            # Integration & performance tests ⭐ NEW
│   │   ├── integration/  # Multi-service integration tests
│   │   └── performance/  # Load testing & benchmarks
│   ├── infrastructure/   # Infrastructure code
│   ├── k8s/              # Kubernetes manifests
│   └── README.md         # Backend documentation
│
├── frontend/             # Next.js Frontend
│   ├── src/              # Source code
│   ├── tests/            # E2E & integration tests ⭐ NEW
│   │   └── e2e/          # 183 Playwright E2E tests
│   └── README.md         # Frontend documentation
│
├── docs/                 # Documentation
│   ├── TESTING_GUIDE.md         # Complete testing guide ⭐ NEW
│   ├── SHARED_SERVICES.md       # Shared services docs ⭐ NEW
│   ├── ARCHITECTURE.md          # System architecture ⭐ NEW
│   ├── CLOUDFLARE_INTEGRATION.md # Cost optimization guide ⭐ NEW
│   ├── OPTIMIZATION_SUMMARY.md   # All optimization work ⭐ NEW
│   ├── CONFIGURATION.md         # Configuration reference
│   ├── backend/          # Backend docs
│   ├── frontend/         # Frontend docs
│   ├── api/              # API documentation
│   └── deployment/       # Deployment guides
│
├── package.json          # Monorepo workspace config
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ & npm 9+
- Docker & Docker Compose
- Git

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
# Setup backend environment
cd backend
cp .env.template .env
# Edit .env with your values

# Sync .env to all services
./sync-all-env.sh
```

### 4. Start Infrastructure
```bash
# Start Docker services (PostgreSQL, Redis, RabbitMQ, etc.)
npm run docker:up
```

### 5. Start Development
```bash
# From root directory

# Start backend only
npm run dev:backend

# Start frontend only (when ready)
# npm run dev:frontend

# Start both (when frontend is ready)
# npm run dev
```

## 📚 Documentation

### Getting Started
- [GETTING_STARTED.md](./docs/GETTING_STARTED.md) - Complete setup guide
- [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) - Common issues and solutions

### For Backend Development
See [backend/README.md](./backend/README.md) for:
- Architecture overview
- Service setup & configuration
- API documentation
- Development guidelines
- Testing & deployment

### For Frontend Development
See [docs/frontend/README.md](./docs/frontend/README.md) for:
- Pages roadmap
- Project structure
- Component library
- API integration
- Styling guidelines

### Full Documentation
Visit [docs/](./docs/) folder for:
- [Backend Roadmap](./docs/BACKEND_ROADMAP.md)
- [Frontend Pages Roadmap](./docs/frontend/PAGES_ROADMAP.md)
- [API Documentation](./docs/api/)
- [System Architecture](./docs/system-architecture.md)
- [Deployment Guides](./docs/deployment/)

## 🛠 Development Scripts

### Root Level Commands
```bash
# Development
npm run dev:backend         # Start backend services
npm run dev:frontend        # Start frontend (when ready)
npm run dev                 # Start both

# Build
npm run build:backend       # Build backend
npm run build:frontend      # Build frontend
npm run build               # Build both

# Test
npm run test:backend        # Test backend
npm run test:frontend       # Test frontend
npm run test                # Test both

# Docker
npm run docker:up           # Start infrastructure
npm run docker:down         # Stop infrastructure
npm run docker:ps           # Check container status

# Utilities
npm run clean               # Clean node_modules
```

### Important Port Information
- **API Gateway:** Port 4000 (changed from 3000 to avoid conflict with frontend)
- **Frontend:** Port 3000 (Next.js default)
- **Backend Services:** Ports 3001-3004

## 🏗 Technology Stack

### Backend
- **Runtime:** Node.js 18+ with TypeScript
- **Framework:** Express.js (services), Fastify (API Gateway)
- **Database:** PostgreSQL with Prisma ORM
  - **Vector Search:** pgvector extension (replaced Pinecone, saving $70/month)
- **Cache:** Redis, Upstash Redis
- **Message Queue:** RabbitMQ
- **AI Providers:** ⭐ Multi-provider architecture
  - **OpenAI:** GPT-4o, GPT-3.5-turbo, text-embedding-3-small
  - **Cloudflare Workers AI:** Llama-2, BGE embeddings (cost-optimized)
  - **Anthropic:** Claude 3 support
  - **Auto-selection:** Intelligent provider routing based on complexity
- **Payment:** Stripe
- **Monitoring:** Sentry (error tracking), Jaeger (distributed tracing)
- **Analytics:** ClickHouse

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **UI:** React 18+, TypeScript, Material-UI (MUI)
- **Styling:** Tailwind CSS, shadcn/ui, MUI theming
- **State:** Zustand, TanStack Query
- **Forms:** React Hook Form, Zod
- **Testing:** Playwright (183 E2E tests), Jest, React Testing Library

### Infrastructure
- **Containers:** Docker, Docker Compose
- **Orchestration:** Kubernetes
- **Deployment:** Azure, Vercel, Railway
- **Storage:** AWS S3 / Cloudflare R2
- **CDN:** Cloudflare

### Shared Services (Cost Optimization Layer) ⭐ NEW
- **`llm.service.ts`** - Multi-provider LLM service (OpenAI, Cloudflare, Anthropic)
- **`embedding.service.ts`** - Unified embedding service with caching
- **`cloudflare-ai.service.ts`** - Cloudflare Workers AI integration
- **Cost savings:** 30-95% depending on workload (see [CLOUDFLARE_INTEGRATION.md](docs/CLOUDFLARE_INTEGRATION.md))

## 📦 Deployment

### Backend Deployment
Backend can be deployed to:
- **Azure App Service** - See [docs/deployment/](./docs/deployment/)
- **Kubernetes** - See [backend/k8s/](./backend/k8s/)
- **Docker Compose** - See [backend/docker-compose.yml](./backend/docker-compose.yml)

**Important:** Backend has its own deployment configuration. See [backend/README.md](./backend/README.md)

### Frontend Deployment (Coming Soon)
Frontend will be deployed to:
- **Vercel** - Recommended for Next.js
  - Root Directory: `frontend`
  - Build Command: `npm run build`
  - Environment Variables: `NEXT_PUBLIC_API_URL=https://your-backend-api.com`
- **Netlify** - Alternative option

**Important:** Frontend and backend deploy **separately** to different platforms.

## 🎯 Current Status

### ✅ Completed
- [x] Backend microservices architecture
- [x] Authentication service với JWT
- [x] Chat service với AI integration
- [x] Billing service với Stripe
- [x] Analytics service với ClickHouse
- [x] API Gateway với rate limiting
- [x] Event-driven architecture với RabbitMQ
- [x] Monitoring với Sentry & Jaeger
- [x] Docker Compose setup
- [x] Kubernetes manifests
- [x] Comprehensive documentation
- [x] Monorepo structure

### 🔄 In Progress
- [ ] Frontend development
  - [x] Planning & documentation
  - [ ] Setup Next.js project
  - [ ] Authentication pages
  - [ ] Chat interface
  - [ ] Billing pages

### 📅 Upcoming
- [ ] Email service implementation
- [ ] Advanced analytics dashboard
- [ ] Team collaboration features
- [ ] Mobile app (React Native)

## 👥 Contributing

1. Clone the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 📊 Cost Optimization Summary

Our recent optimization efforts have reduced monthly costs by **47%** ($350 → $185/month):

| Optimization | Monthly Savings | Implementation |
|-------------|-----------------|----------------|
| **Pinecone → pgvector** | $70 | Self-hosted vector search in PostgreSQL |
| **Cloudflare Embeddings** | $5-$7 | Free-tier embeddings for non-critical workloads |
| **Smart LLM Routing** | $15-$465 | Auto-select cheapest provider based on complexity |
| **Code Deduplication** | Maintenance | 90% reduction in duplicate code (1437 lines removed) |
| **Total Savings** | **$90-$542/month** | **47-93% cost reduction** |

See [docs/CLOUDFLARE_INTEGRATION.md](docs/CLOUDFLARE_INTEGRATION.md) for detailed cost analysis.

## 🧪 Testing & Quality

### Test Coverage
- **Frontend E2E:** 183 Playwright tests (auth, billing, chat flows)
- **Backend Integration:** 30+ multi-service integration tests
- **Backend Unit:** 100+ unit tests (services, utilities)
- **Performance:** Load testing with k6, Artillery, autocannon
- **Coverage Target:** 70-80% (currently achieved)

### Running Tests
```bash
# Frontend E2E tests
cd frontend && npm run test:e2e

# Backend integration tests
cd backend/tests/integration && npm test

# Performance benchmarks
cd backend && npm run benchmark:all

# All tests
npm run test
```

See [docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md) for comprehensive testing documentation.

## 🏗️ Architecture Highlights

### Microservices
- **auth-service** (3001) - JWT authentication, user management, workspaces
- **chat-service** (3003) - AI chat, document Q&A, RAG with pgvector
- **billing-service** (3004) - Stripe integration, subscriptions, quotas
- **analytics-service** (3005) - Usage analytics, reporting, metrics
- **orchestrator-service** (3006) - AI orchestration, workflow management
- **email-worker** - Background email processing with queues

### Shared Services Layer ⭐ NEW
Centralized AI services eliminate duplication and enable cost optimization:
- **Multi-provider support:** Switch between OpenAI, Cloudflare, Anthropic
- **Auto-provider selection:** Route to cheapest provider based on query complexity
- **Cost tracking:** Built-in cost estimation and monitoring
- **Caching:** 20-40% reduction in API calls through intelligent caching

See [docs/SHARED_SERVICES.md](docs/SHARED_SERVICES.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for details.

## 🔗 Documentation

### Getting Started
- [GETTING_STARTED.md](./docs/GETTING_STARTED.md) - Complete setup guide
- [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) - Common issues and solutions
- [CONFIGURATION.md](./docs/CONFIGURATION.md) - Environment configuration reference

### Architecture & Design
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System architecture with diagrams
- [SHARED_SERVICES.md](./docs/SHARED_SERVICES.md) - Shared services architecture
- [System Architecture](./docs/system-architecture.md) - Detailed architecture overview

### Cost Optimization & Performance
- [CLOUDFLARE_INTEGRATION.md](./docs/CLOUDFLARE_INTEGRATION.md) - Cost optimization guide
- [OPTIMIZATION_SUMMARY.md](./docs/OPTIMIZATION_SUMMARY.md) - All optimization work
- [Performance Benchmarks](./backend/tests/performance/PERFORMANCE_REPORT.md)

### Testing
- [TESTING_GUIDE.md](./docs/TESTING_GUIDE.md) - Complete testing guide
- [E2E Test Report](./frontend/tests/E2E_TEST_REPORT.md) - Frontend E2E tests
- [Integration Test Guide](./backend/tests/integration/INTEGRATION_TEST_GUIDE.md)

### Development
- **Backend:** [backend/README.md](./backend/README.md)
- **Frontend:** [docs/frontend/README.md](./docs/frontend/README.md)
- **API Docs:** [docs/api/](./docs/api/)

### Migration Guides
- [Configuration Migration](./docs/CONFIGURATION_MIGRATION.md) - Environment variable updates
- [Embedding Migration](./backend/services/chat-service/MIGRATION_REPORT.md) - Shared embedding service
- [LLM Migration](./backend/services/chat-service/LLM_MIGRATION_REPORT.md) - Shared LLM service
- [pgvector Migration](./backend/services/orchestrator-service/PGVECTOR_MIGRATION_GUIDE.md) - Pinecone to pgvector

## 🆘 Support

For issues, questions, or contributions:
1. Check [Documentation](./docs/)
2. Search existing Issues
3. Create a new issue if needed

---

**Built with ❤️ using Node.js, TypeScript, React, and Next.js**

**Optimized for cost-efficiency and performance** 🚀

**Last Updated:** 2025-11-15
