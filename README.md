# 🤖 AI SaaS Chat Platform

[![Version](https://img.shields.io/badge/version-1.0.0--beta-blue.svg)](https://github.com/your-org/ai-saas-platform/releases)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/your-org/ai-saas-platform/actions)
[![TypeScript](https://img.shields.io/badge/typescript-5.9.2-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/next.js-14.2.18-black.svg)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Production Status**: ✅ Beta Live | **Uptime**: 99.9% | **Response Time (p95)**: <500ms

Nền tảng chat AI đa năng với khả năng tích hợp nhiều AI providers, quản lý người dùng, thanh toán và tổ chức conversations theo dự án.

---

> **🚀 MICROSERVICES MIGRATION IN PROGRESS**
>
> Project đang trong quá trình migration từ Next.js monolith → Microservices architecture.
>
> - 📖 **[Microservices Migration Guide](docs/MICROSERVICES_MIGRATION_GUIDE.md)** - Hướng dẫn chi tiết
> - 📘 **[Quick Start - Microservices](docs/README-MICROSERVICES.md)** - Bắt đầu nhanh
> - ✅ **[Phase 1 Complete](docs/PHASE_1_COMPLETE.md)** - Infrastructure setup done
> - 📁 **[Phase Overview](docs/phases/README.md)** - Tổng quan các phases
>
> **Current Phase**: Phase 2 - Auth Service Migration

---

🎉 **[Release Notes v1.0.0-beta](docs/RELEASE_NOTES_v1.0.0-beta.md)** | 📋 **[Changelog](CHANGELOG.md)**

## ✨ Tính năng chính

### 🧠 Multi-AI Provider Support
- **OpenAI** (GPT-4, GPT-3.5)
- **Anthropic Claude** (Claude 3.5 Sonnet, Claude 3 Opus)
- **Google Gemini** (Gemini Pro, Gemini Ultra)
- Semantic caching & query optimization
- Automatic provider fallback

### 🔐 Authentication & User Management
- Email/password authentication
- Email verification system
- Password reset functionality
- Session management with Redis
- User settings & preferences

### 💳 Subscription & Payment
- 3-tier subscription plans (Free, Pro, Enterprise)
- PayOS payment integration
- Monthly token quota management
- Usage tracking & analytics
- Invoice generation

### 💬 Conversation Management
- Create, rename, delete conversations
- Pin important conversations
- Message history & search
- Context-aware conversations
- Message feedback system

### 📁 Projects/Workspace Organization
- Organize conversations by projects (Claude-style)
- Project metadata (name, description, color, icon)
- Filter conversations by project
- Project-level analytics

### 📤 Export Features
- Export conversations to PDF
- Export to Excel/CSV
- Export to JSON
- Batch export support
- Custom formatting options

### 🚀 Performance & Scaling
- Redis caching layer
- Distributed cache support
- Rate limiting & throttling
- Load balancing
- Auto-scaling capabilities
- Performance monitoring dashboard

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis (Upstash)
- **Authentication**: Custom JWT-based auth
- **Payment**: PayOS
- **AI SDKs**: OpenAI, Anthropic, Google Generative AI
- **File Processing**: pdf-parse, mammoth, xlsx
- **Email**: Nodemailer

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL database
- Redis instance (or Upstash account)
- API keys for AI providers (OpenAI, Anthropic, Google)

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repository-url>
cd my-saas-chat
npm install
```

### 2. Environment Setup

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Cấu hình các biến môi trường:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ai_saas"

# Redis (Upstash)
REDIS_URL="your_upstash_redis_url"
REDIS_TOKEN="your_upstash_token"

# AI Providers
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_API_KEY="..."

# Authentication
JWT_SECRET="your-secret-key-here"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="noreply@yourdomain.com"

# Payment (PayOS)
PAYOS_CLIENT_ID="your-client-id"
PAYOS_API_KEY="your-api-key"
PAYOS_CHECKSUM_KEY="your-checksum-key"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## 📜 Available Scripts

### Development
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # Check TypeScript types
```

### Database
```bash
npm run db:push          # Push schema changes to database
npm run db:migrate       # Create and run migrations
npm run db:migrate:prod  # Run migrations in production
npm run db:seed          # Seed database with initial data
npm run db:reset         # Reset database
npm run db:studio        # Open Prisma Studio
npm run db:generate      # Generate Prisma client
npm run db:setup         # Full setup: generate + migrate + seed
```

### Maintenance
```bash
npm run clean            # Clean .next and cache
npm run clean:all        # Clean everything and reinstall
npm run fix:imports      # Fix import paths
npm run fix:all          # Fix imports and run type check
```

### Testing
```bash
npm run test:auth        # Test authentication
npm run test:db          # Test database connection
npm run test:email       # Test email configuration
```

### Utilities
```bash
npm run mailhog          # Start MailHog for email testing
npm run ngrok            # Expose localhost with ngrok
```

## 📁 Project Structure

```
my-saas-chat/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── api/               # API routes
│   │   ├── auth/              # Auth pages (signin, signup, verify)
│   │   ├── chat/              # Chat interface
│   │   ├── payment/           # Payment pages
│   │   └── pricing/           # Pricing page
│   ├── components/
│   │   ├── chat/              # Chat components (legacy)
│   │   ├── chat-v2/           # Chat v2 components (current)
│   │   └── ui/                # UI components
│   ├── lib/
│   │   ├── ai/                # AI provider management
│   │   ├── ai-providers/      # Individual AI provider implementations
│   │   ├── auth/              # Authentication logic
│   │   ├── billing/           # Billing & quota management
│   │   ├── cache/             # Caching strategies
│   │   ├── monitoring/        # Performance monitoring
│   │   ├── rate-limit/        # Rate limiting
│   │   └── scaling/           # Auto-scaling & load balancing
│   ├── hooks/                 # React hooks
│   └── types/                 # TypeScript types
├── prisma/
│   └── schema.prisma          # Database schema
├── scripts/                   # Utility scripts
├── public/                    # Static assets
├── docs/                      # Documentation
└── .env                       # Environment variables
```

## 📚 Documentation

Comprehensive documentation for developers and operators:

### 📖 User & Developer Guides
- 🎯 **[Release Notes v1.0.0-beta](docs/RELEASE_NOTES_v1.0.0-beta.md)** - What's new in Beta release
- 📋 **[Changelog](CHANGELOG.md)** - Complete change history
- 💬 **[Conversation Management](docs/CONVERSATION_MANAGEMENT.md)** - Chat features guide
- 📁 **[Projects Feature](docs/PROJECTS_FEATURE.md)** - Organize with projects
- 📤 **[Export Feature](docs/EXPORT_FEATURE_QUICK_START.md)** - Export conversations guide

### 🚀 Deployment & Operations
- 🛠️ **[Environment Variables](docs/ENVIRONMENT_VARS.md)** - Complete env var reference
- 🚢 **[Deployment Runbook](docs/DEPLOYMENT_RUNBOOK.md)** - Deploy with CI/CD, Docker, or Kubernetes
- 🗄️ **[Database Operations](docs/DATABASE_OPERATIONS.md)** - Backup, restore, migrations
- ✅ **[Post-Deploy Checklist](docs/POST_DEPLOY_CHECKLIST.md)** - Smoke test procedures
- 🔄 **[Rollback Procedures](docs/ROLLBACK.md)** - Emergency rollback guide
- 🚨 **[War Room Monitoring](docs/BETA_WARROOM_LOG.md)** - 48-hour monitoring template

### 🏗️ Architecture & Development
- 🏛️ **[Architecture Documentation](docs/ARCHITECTURE_REFACTORING.md)** - System architecture
- 🔐 **[Security Guide](docs/SECURITY_GUIDE.md)** - Security best practices
- 📊 **[Performance Optimizations](docs/PERFORMANCE_OPTIMIZATIONS.md)** - Performance tuning
- 👁️ **[Observability Setup](docs/OBSERVABILITY_SETUP.md)** - Monitoring & logging

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/forgot` - Request password reset
- `POST /api/auth/reset` - Reset password

### Chat
- `POST /api/chat/stream` - Stream chat response
- `POST /api/chat/send-with-image` - Send message with image
- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create conversation
- `GET /api/conversations/[id]` - Get conversation
- `PATCH /api/conversations/[id]` - Update conversation
- `DELETE /api/conversations/[id]` - Delete conversation

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Get project
- `PATCH /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Payment
- `POST /api/payment/create` - Create payment
- `POST /api/webhook/payos` - PayOS webhook

### User
- `GET /api/me` - Get current user
- `GET /api/user/usage` - Get usage statistics

## 🚢 Deployment

### Quick Deploy

**Choose your deployment method**:

#### Option A: CI/CD (Recommended for Teams)
```bash
# Setup GitHub Actions workflow
cp .github/workflows/deploy.example.yml .github/workflows/deploy.yml
git add .github/workflows/deploy.yml
git commit -m "Setup CI/CD"
git push origin main
```

#### Option B: Docker Compose (Simple, Single Server)
```bash
# Verify environment
npm run env:verify:strict

# Build and deploy
docker compose -f docker-compose.prod.yml up -d

# Verify deployment
curl https://your-app.com/api/health
```

#### Option C: Kubernetes (Scalable, Enterprise)
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml

# Verify deployment
kubectl get pods -n ai-saas-prod
```

### Pre-Deployment Checklist

```bash
# 1. Verify environment variables
npm run env:verify:strict

# 2. Run type check
npm run type-check

# 3. Build project
npm run build

# 4. Run database migrations (production)
npm run db:migrate:prod

# 5. Deploy (choose your method above)
```

### Post-Deployment Verification

```bash
# Run smoke tests
bash scripts/smoke-test.sh

# Or follow manual checklist
# See: docs/POST_DEPLOY_CHECKLIST.md
```

### Production Environment Variables

See **[Environment Variables Guide](docs/ENVIRONMENT_VARS.md)** for complete reference.

**Critical variables for production**:
- ✅ `NODE_ENV=production`
- ✅ `NEXT_PUBLIC_APP_URL` (your production domain with HTTPS)
- ✅ `DATABASE_URL` (with `connection_limit` and `pool_timeout`)
- ✅ `AUTH_SECRET` (32+ characters, cryptographically random)
- ✅ At least one AI provider key (OpenAI, Anthropic, or Google)
- ✅ `SENTRY_DSN` (for error tracking)
- ✅ `UPSTASH_REDIS_REST_URL` (for caching and rate limiting)

### Deployment Documentation

📚 **Complete guides**:
- 🚢 **[Deployment Runbook](docs/DEPLOYMENT_RUNBOOK.md)** - Step-by-step deployment for all methods
- 🛠️ **[Environment Variables](docs/ENVIRONMENT_VARS.md)** - All env vars explained
- 🗄️ **[Database Operations](docs/DATABASE_OPERATIONS.md)** - Migrations, backups, restore
- ✅ **[Post-Deploy Checklist](docs/POST_DEPLOY_CHECKLIST.md)** - Smoke test procedures
- 🔄 **[Rollback Procedures](docs/ROLLBACK.md)** - Emergency rollback guide

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 🗺️ Roadmap

### ✅ Completed (v1.0.0-beta)

- ✅ Multi-AI provider support (OpenAI, Anthropic, Google, Groq, X.AI)
- ✅ Projects & workspace organization
- ✅ Multi-format export (PDF, Markdown, JSON, CSV)
- ✅ Dark mode & theme system
- ✅ Keyboard shortcuts
- ✅ Security hardening (CSRF, rate limiting, security headers)
- ✅ Performance optimization (sub-500ms p95)
- ✅ Production deployment infrastructure (CI/CD, Docker, Kubernetes)
- ✅ Comprehensive documentation suite

### 🚧 In Progress (v1.1 - Q4 2025)

- 🔄 Team collaboration features
- 🔄 Advanced analytics dashboard
- 🔄 REST API for integrations
- 🔄 Mobile app (React Native)

### 📋 Planned (v1.2+ - Q1 2026)

- 📌 Custom AI model fine-tuning
- 📌 Advanced export templates
- 📌 Voice input/output
- 📌 Real-time collaboration
- 📌 Multi-language interface support
- 📌 Third-party integrations (Slack, Discord, Zapier)
- 📌 Advanced analytics with data export
- 📌 Whitelabel/custom branding options

## 📊 Production Monitoring

### Health & Metrics

```bash
# Health check
curl https://your-app.com/api/health

# System metrics
curl https://your-app.com/api/metrics/system

# Provider metrics
curl https://your-app.com/api/metrics/providers

# Usage metrics (requires auth)
curl https://your-app.com/api/metrics/usage \
  -H "Cookie: session=<your-session-token>"
```

### Monitoring Stack

- **Error Tracking**: Sentry (errors, performance, releases)
- **Logging**: Pino structured JSON logging
- **Metrics**: Custom metrics endpoints
- **Uptime**: Health check endpoints for load balancers
- **Database**: PostgreSQL slow query log + pg_stat_statements

### Alerts

Configure alerts in Sentry:
- Error rate > 5% for 5 minutes
- p95 response time > 1000ms
- New critical errors
- Performance degradation

See **[War Room Monitoring](docs/BETA_WARROOM_LOG.md)** for 48-hour monitoring procedures.

---

## 📧 Support

### Get Help

- 📧 **Email**: support@yourdomain.com
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/your-org/ai-saas-platform/issues)
- 💬 **Discord**: [Join our community](https://discord.gg/your-server)
- 📖 **Documentation**: See [docs/](./docs/) directory

### Response Times

- **FREE tier**: Within 48 hours
- **PREMIUM tier**: Within 24 hours
- **ENTERPRISE tier**: Within 4 hours (SLA)

### Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

Made with ❤️ using Next.js and AI
