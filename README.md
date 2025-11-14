# SaaS Chat Application - Monorepo

AI-powered SaaS Chat Application với microservices backend và Next.js frontend.

## 📁 Project Structure

```
my-saas-chat/
├── backend/              # Backend Microservices
│   ├── api-gateway/      # API Gateway (port 4000)
│   ├── services/         # Microservices
│   │   ├── auth-service/       # Authentication (port 3001)
│   │   ├── chat-service/       # Chat & AI (port 3002)
│   │   ├── billing-service/    # Billing (port 3003)
│   │   ├── analytics-service/  # Analytics (port 3004)
│   │   └── email-worker/       # Email worker
│   ├── shared/           # Shared libraries
│   ├── infrastructure/   # Infrastructure code
│   ├── k8s/              # Kubernetes manifests
│   └── README.md         # Backend documentation
│
├── frontend/             # Next.js Frontend (Coming soon)
│   └── README.md         # Frontend documentation
│
├── docs/                 # Documentation
│   ├── backend/          # Backend docs
│   ├── frontend/         # Frontend docs
│   ├── api/              # API documentation
│   ├── architecture/     # System architecture
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
- **Runtime:** Node.js 18+ với TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL (Neon) với Prisma ORM
- **Cache:** Redis, Upstash Redis
- **Message Queue:** RabbitMQ
- **AI:** OpenAI GPT-4, Google Gemini, Anthropic Claude
- **Payment:** Stripe
- **Monitoring:** Sentry, Jaeger
- **Analytics:** ClickHouse

### Frontend (Coming Soon)
- **Framework:** Next.js 14+ (App Router)
- **UI:** React 18+, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **State:** Zustand, TanStack Query
- **Forms:** React Hook Form, Zod

### Infrastructure
- **Containers:** Docker, Docker Compose
- **Orchestration:** Kubernetes
- **Deployment:** Azure, Vercel, Railway

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

## 🔗 Links

- **Backend README:** [backend/README.md](./backend/README.md)
- **Frontend Roadmap:** [docs/frontend/PAGES_ROADMAP.md](./docs/frontend/PAGES_ROADMAP.md)
- **API Docs:** [docs/api/](./docs/api/)
- **Architecture:** [docs/architecture/](./docs/architecture/)

## 🆘 Support

For issues, questions, or contributions:
1. Check [Documentation](./docs/)
2. Search existing Issues
3. Create a new issue if needed

---

**Built with ❤️ using Node.js, TypeScript, React, and Next.js**

**Last Updated:** 2025-11-01
