# System Architecture

Complete technical documentation of the AI SaaS Chat Platform architecture.

**Last Updated**: 2025-11-14
**Status**: Production Ready
**Version**: 1.0.0

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Microservices](#microservices)
4. [Technology Stack](#technology-stack)
5. [Data Flow](#data-flow)
6. [Deployment Architecture](#deployment-architecture)
7. [Scaling Strategy](#scaling-strategy)

---

## Overview

The AI SaaS Chat Platform is a modern, cloud-native microservices architecture designed for:

- **Scalability**: Horizontal scaling across multiple instances
- **Reliability**: Redundancy and failover capabilities
- **Security**: End-to-end encryption and auth at every layer
- **Performance**: Optimized response times with caching
- **Observability**: Complete monitoring and tracing

### Key Principles

1. **Service Independence**: Each service is independently deployable
2. **Async Communication**: Services communicate via message queues
3. **Fault Tolerance**: Circuit breakers and retry mechanisms
4. **Data Isolation**: Each service has its own database
5. **API-First**: REST APIs for all inter-service communication

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Browser/Web │  │   Mobile App │  │ Desktop CLI  │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │ HTTPS
                             ▼
                    ┌────────────────┐
                    │   CDN/CloudFront│
                    │ (Static Assets) │
                    └────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  API Gateway   │
                    │  (Load Balancer)│
                    │  Rate Limiting │
                    │  JWT Validation│
                    └────────┬───────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
    ┌─────────┐         ┌─────────┐         ┌──────────┐
    │  Auth   │         │  Chat   │         │ Billing  │
    │ Service │         │ Service │         │ Service  │
    │(Port 3001)│       │(Port 3002)│       │(Port 3003)│
    └────┬────┘         └────┬────┘         └────┬─────┘
         │                   │                   │
    ┌────┴───────┬───────────┼────────────┬─────┴────┐
    │            │           │            │          │
    ▼            ▼           ▼            ▼          ▼
┌──────────────────────────────────────────────────────────────┐
│                   Shared Infrastructure                       │
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐  │
│  │  PostgreSQL     │  │  Redis Cache    │  │ RabbitMQ   │  │
│  │  (Neon)         │  │  (Upstash)      │  │ (Message   │  │
│  │                 │  │                 │  │  Queue)    │  │
│  │  • Auth DB      │  │  • Session      │  │            │  │
│  │  • Chat DB      │  │  • Cache        │  │  • Email   │  │
│  │  • Billing DB   │  │  • Rate Limits  │  │    Jobs    │  │
│  │  • Analytics DB │  │  • Quotas       │  │  • Events  │  │
│  └─────────────────┘  └─────────────────┘  └────────────┘  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
    │                    │
    ▼                    ▼
┌──────────────────────────────────────────────────────────┐
│           Analytics Service (Port 3004)                   │
│                                                           │
│  • User Analytics       • Revenue Metrics                │
│  • Chat Analytics       • Provider Metrics               │
│  • ClickHouse Database  • Real-time Dashboards          │
└──────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────┐
│           External Services & APIs                        │
│                                                           │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────┐ │
│  │ OpenAI API     │  │ Stripe API     │  │ Email      │ │
│  │ (GPT-4, etc)   │  │ (Payments)     │  │ Service    │ │
│  │                │  │                │  │ (AWS SES)  │ │
│  └────────────────┘  └────────────────┘  └────────────┘ │
│                                                           │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────┐ │
│  │ Jaeger         │  │ Sentry         │  │ CloudWatch │ │
│  │ (Tracing)      │  │ (Error Track)  │  │ (Metrics)  │ │
│  └────────────────┘  └────────────────┘  └────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## Microservices

### 1. Auth Service (Port 3001)

**Purpose**: User authentication and session management

**Responsibilities**:
- User registration and email verification
- Login/logout and session management
- Password reset and account recovery
- JWT token generation and validation
- Rate limiting for auth endpoints

**Key Endpoints**:
```
POST   /api/auth/signup
POST   /api/auth/signin
POST   /api/auth/signout
GET    /api/auth/me
POST   /api/auth/verify-email
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/resend-verification
```

**Database Schema**:
- Users table (email, password, plan_tier, etc.)
- Sessions table (user_id, token, expires_at)
- EmailVerifications table (user_id, token, verified_at)
- PasswordResets table (user_id, token, expires_at)

**Dependencies**:
- PostgreSQL (Neon)
- Redis (session storage and rate limits)
- Email service (email verification)

**Rate Limiting**:
- Signup: 5 per hour
- Signin: 10 per 15 minutes
- Password reset: 3 per hour

---

### 2. Chat Service (Port 3002)

**Purpose**: Conversation management and AI integration

**Responsibilities**:
- Message handling and conversation management
- OpenAI/Claude API integration
- Token counting and usage tracking
- Quota enforcement
- Response caching for identical queries

**Key Endpoints**:
```
POST   /api/chat
GET    /api/conversations
GET    /api/conversations/:id
DELETE /api/conversations/:id
GET    /api/usage
```

**Database Schema**:
- Conversations table
- Messages table (user messages and AI responses)
- TokenUsage table (tracking usage for billing)
- AIProviders table (pricing and limits)

**Key Features**:
- Streaming responses for real-time feedback
- Context window management
- Automatic token counting
- Response caching with TTL
- Provider failover (if primary fails)

**Rate Limiting**:
- Chat messages: 100 per minute
- Conversations list: 60 per minute

---

### 3. Billing Service (Port 3003)

**Purpose**: Subscription and payment management

**Responsibilities**:
- Subscription lifecycle management
- Stripe integration for payments
- Invoice generation
- Usage-based billing
- Quota management per plan

**Key Endpoints**:
```
POST   /api/subscribe
POST   /api/cancel
GET    /api/subscription
GET    /api/usage
GET    /api/payments
GET    /api/plans
```

**Database Schema**:
- Subscriptions table
- Payments table
- Plans table (pricing, quotas)
- UsageTracking table

**Subscription Plans**:
| Plan | Monthly Price | Token Quota | Features |
|------|--------------|-------------|----------|
| Free | $0 | 10,000 | Basic chat |
| Plus | $20 | 100,000 | All models |
| Pro | $50 | 500,000 | Priority support |

**Rate Limiting**:
- No limits on GET endpoints (for authenticated users)
- Subscribe/Cancel: 5 per hour

---

### 4. Analytics Service (Port 3004)

**Purpose**: Business intelligence and metrics

**Responsibilities**:
- User analytics (DAU, WAU, MAU, retention)
- Chat analytics (message counts, model usage)
- Revenue metrics (MRR, LTV, churn)
- Provider performance monitoring
- Real-time dashboard data

**Key Endpoints**:
```
GET /api/analytics/users/count
GET /api/analytics/users/growth
GET /api/analytics/users/active
GET /api/analytics/chat/messages
GET /api/analytics/chat/by-provider
GET /api/analytics/revenue/total
GET /api/analytics/revenue/mrr
GET /api/analytics/providers/usage
GET /api/analytics/providers/performance
```

**Data Storage**:
- ClickHouse (analytical queries)
- PostgreSQL (historical data)
- Redis (cached aggregations)

**Real-time Updates**:
- Event streaming from other services
- RabbitMQ for event distribution
- WebSocket for dashboard updates

---

### 5. Email Worker

**Purpose**: Asynchronous email processing

**Responsibilities**:
- Email verification
- Password reset emails
- Billing notifications
- Feature announcements

**Job Queue**:
- BullMQ (Redis-backed)
- Email templates (Handlebars)
- SMTP/AWS SES integration

**Email Types**:
- Verification emails (signup)
- Password reset emails
- Subscription confirmation
- Invoice emails
- Quota warning alerts

---

## Technology Stack

### Backend
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js (lightweight, stable)
- **Database**: PostgreSQL (Neon) + Redis (Upstash)
- **Message Queue**: RabbitMQ
- **API Documentation**: OpenAPI 3.0 / Swagger

### Frontend
- **Framework**: Next.js 14+ (React)
- **Styling**: Tailwind CSS
- **State Management**: React hooks + Context API
- **UI Components**: Radix UI + custom components
- **Real-time**: WebSocket for live chat

### Infrastructure
- **Container**: Docker
- **Orchestration**: Kubernetes (K8s)
- **Load Balancer**: Ingress controller
- **CDN**: Cloudflare
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Tracing**: Jaeger
- **Error Tracking**: Sentry

### External Services
- **AI APIs**: OpenAI (GPT-4, GPT-4o), Anthropic (Claude)
- **Payments**: Stripe
- **Email**: AWS SES
- **Storage**: Cloudflare R2 (S3-compatible)

---

## Data Flow

### User Registration Flow

```
Client
  │
  ├─► POST /api/auth/signup
  │   {email, password}
  │
  ▼
API Gateway
  │ (rate limit check)
  │
  ▼
Auth Service
  │ 1. Validate input
  │ 2. Check email uniqueness
  │ 3. Hash password (bcrypt)
  │ 4. Create user record
  │
  ├─► PostgreSQL: INSERT user
  │
  │ 5. Generate verification token
  │ 6. Queue email job
  │
  ├─► RabbitMQ: queue email
  │
  ▼
Email Worker
  │ 1. Consume email job
  │ 2. Render template
  │ 3. Send via AWS SES
  │
  └─► User receives email
```

### Chat Message Flow

```
Client
  │
  ├─► POST /api/chat/chat
  │   {conversationId, content, model}
  │
  ▼
API Gateway
  │ (JWT validation, rate limit)
  │
  ▼
Chat Service
  │ 1. Validate user quota
  │   ├─► Redis: check cached quota
  │   ├─► (if miss) PostgreSQL: get quota
  │   ├─► Redis: cache quota
  │
  │ 2. Check cache for similar message
  │   ├─► Redis: lookup by content hash
  │
  │ 3. Create user message record
  │   ├─► PostgreSQL: INSERT message
  │
  │ 4. Call AI provider
  │   ├─► OpenAI API: generate response
  │   └─► Get token count
  │
  │ 5. Save AI response
  │   ├─► PostgreSQL: INSERT response message
  │   ├─► PostgreSQL: INSERT token usage
  │
  │ 6. Cache response
  │   ├─► Redis: cache with TTL
  │
  │ 7. Update quota
  │   ├─► Redis: invalidate quota cache
  │
  │ 8. Queue analytics event
  │   ├─► RabbitMQ: queue analytics event
  │
  ▼
Client
  │ Displays AI response
  └─► Shows token usage
```

### Subscription Flow

```
Client
  │
  ├─► POST /api/billing/subscribe
  │   {planTier, paymentMethodId}
  │
  ▼
API Gateway
  │ (JWT validation)
  │
  ▼
Billing Service
  │ 1. Validate plan
  │ 2. Create Stripe subscription
  │   ├─► Stripe API: create subscription
  │
  │ 3. Create subscription record
  │   ├─► PostgreSQL: INSERT subscription
  │
  │ 4. Update user plan tier
  │   ├─► PostgreSQL: UPDATE user.plan_tier
  │
  │ 5. Update quota in cache
  │   ├─► Redis: set new quota
  │
  │ 6. Queue confirmation email
  │   ├─► RabbitMQ: queue email
  │
  │ 7. Queue analytics event
  │   ├─► RabbitMQ: queue analytics
  │
  ▼
Client & Analytics Service
  │ Subscription confirmed
  └─► Metrics updated
```

---

## Deployment Architecture

### Kubernetes Deployment

```yaml
# Namespace
ai-saas/

# Services
- auth-service (replicas: 3)
- chat-service (replicas: 5)
- billing-service (replicas: 2)
- analytics-service (replicas: 2)
- email-worker (replicas: 2)

# Infrastructure
- PostgreSQL StatefulSet
- Redis StatefulSet
- RabbitMQ StatefulSet
- Prometheus (monitoring)
- Grafana (dashboards)
- Jaeger (tracing)

# Networking
- Ingress controller (routing)
- Service Mesh (Istio - optional)
- Network policies (security)

# Storage
- PersistentVolumes (databases)
- ConfigMaps (configurations)
- Secrets (credentials)
```

### Environment Separation

**Development**
```
- Local Docker Compose
- All services on localhost
- 1 replica per service
- SQLite/in-memory alternatives
```

**Staging**
```
- Kubernetes cluster
- Near-production specs
- 2 replicas per service
- Neon database (staging env)
- Upstash Redis (staging)
```

**Production**
```
- Kubernetes cluster
- Auto-scaling (2-10 replicas)
- Neon database (production env)
- Upstash Redis (production)
- CDN (CloudFlare)
- Multi-region failover
```

---

## Scaling Strategy

### Horizontal Scaling

**Auto-scaling Triggers**:
- CPU > 70% for 2 minutes
- Memory > 80% for 2 minutes
- Request latency > 1000ms

**Service-specific Scaling**:
- Chat Service: 5-20 replicas (CPU-bound)
- Auth Service: 2-5 replicas (I/O-bound)
- Billing Service: 2-4 replicas (I/O-bound)
- Analytics: 2-5 replicas (async)

### Vertical Scaling

**Resource Allocation**:
- Chat Service: 1 CPU, 1GB RAM per replica
- Auth Service: 0.5 CPU, 512MB RAM per replica
- Billing Service: 0.5 CPU, 512MB RAM per replica
- Analytics: 1 CPU, 2GB RAM per replica

### Database Scaling

**PostgreSQL**:
- Read replicas for analytics queries
- Connection pooling (PgBouncer)
- Sharding by user_id (future)

**Redis**:
- Cluster mode for high availability
- Separate instances for cache vs. session
- Automated failover

**RabbitMQ**:
- Cluster deployment
- Queue replication
- Dead letter queues

### Caching Strategy

**Redis Cache Layers**:
1. Session cache (user login states)
2. Quota cache (user monthly quotas)
3. Response cache (AI responses)
4. Analytics cache (aggregated metrics)

**TTL Strategy**:
- Sessions: 24 hours
- Quotas: 1 hour
- Responses: 7 days
- Analytics: 1 hour

---

## Monitoring & Observability

### Metrics Collection

**Prometheus Metrics**:
- Request count and latency (by endpoint)
- Error rates and types
- Database query performance
- Cache hit/miss rates
- Queue depth and processing time

### Logging

**Structured Logging**:
```json
{
  "timestamp": "2025-11-14T10:30:45Z",
  "level": "INFO",
  "service": "chat-service",
  "requestId": "req-123-abc",
  "userId": "user-456-def",
  "message": "AI response generated",
  "duration_ms": 2450,
  "tokens": 150,
  "model": "gpt-4"
}
```

### Tracing

**Distributed Tracing** (Jaeger):
- Request traces across services
- Latency analysis
- Dependency visualization

### Alerting

**Alert Rules**:
- Error rate > 5% (Critical)
- P99 latency > 5s (Warning)
- Service down (Critical)
- Database connection pool exhausted (Critical)

---

## Security Considerations

### Authentication & Authorization

- JWT tokens with 24-hour expiration
- Refresh tokens with 30-day expiration
- Role-based access control (RBAC)
- Service-to-service authentication (mTLS)

### Data Protection

- End-to-end encryption for sensitive data
- Database encryption at rest
- HTTPS for all communications
- Secrets management (HashiCorp Vault)

### Network Security

- VPC isolation
- Network policies
- WAF (Web Application Firewall)
- DDoS protection (CloudFlare)

---

## Disaster Recovery

### Backup Strategy

- Daily automated database backups
- Point-in-time recovery (PITR)
- Multi-region backup replication
- 30-day backup retention

### Failover Procedures

- Automatic service failover (K8s)
- Database failover (multi-master replication)
- Cache failure handling (graceful degradation)
- Health checks every 10 seconds

### RTO/RPO Targets

- RTO (Recovery Time Objective): < 5 minutes
- RPO (Recovery Point Objective): < 1 hour

---

## Future Architecture Improvements

1. **Service Mesh (Istio)**
   - Better traffic management
   - Advanced security policies
   - Automatic circuit breaking

2. **Event Sourcing**
   - Complete audit trail
   - Temporal queries
   - Complex analytics

3. **CQRS Pattern**
   - Separated read/write models
   - Optimized query performance
   - Eventually consistent analytics

4. **GraphQL Gateway**
   - Flexible API queries
   - Reduced over-fetching
   - Better mobile performance

5. **Multi-region Deployment**
   - Global latency reduction
   - Disaster recovery
   - Compliance requirements

---

## References

- **OpenAPI Spec**: `docs/api/openapi.yaml`
- **Database Schema**: `docs/architecture/DATABASE_SCHEMA.md`
- **Data Flows**: `docs/architecture/DATA_FLOWS.md`
- **Kubernetes Setup**: `k8s/README.md`
- **Docker Setup**: `docker-compose.yml`
