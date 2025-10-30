# 📊 PHASE 10: ANALYTICS SERVICE - DETAILED PLAN

**Status**: 🟡 In Progress
**Start Date**: 2025-10-27
**Estimated Duration**: 3-4 days (8-12 hours)
**Goal**: Build comprehensive analytics system with ClickHouse

---

## 🎯 OBJECTIVES

### Primary Goals
1. ✅ Setup ClickHouse database
2. ✅ Create Analytics Service (Port 3004)
3. ✅ Implement event tracking system
4. ✅ Build analytics APIs
5. ✅ Integrate with existing services

### Secondary Goals
6. ⏳ Create analytics dashboards (API only, UI later)
7. ⏳ Real-time analytics
8. ⏳ Export capabilities

---

## 🏗️ ARCHITECTURE

```
┌─────────────────────────────────────────────────────┐
│                 ANALYTICS SYSTEM                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐    ┌──────────────┐              │
│  │ Auth Service │    │ Chat Service │              │
│  │  (Port 3001) │    │  (Port 3002) │              │
│  └───────┬──────┘    └──────┬───────┘              │
│          │                   │                       │
│          │  Publish Events   │                       │
│          ├───────────────────┤                       │
│          │                   │                       │
│          ▼                   ▼                       │
│  ┌─────────────────────────────────────┐            │
│  │        Message Queue (RabbitMQ)      │            │
│  │     Exchange: analytics.events       │            │
│  └──────────────────┬───────────────────┘            │
│                     │                                │
│                     │  Consume Events                │
│                     ▼                                │
│  ┌─────────────────────────────────────┐            │
│  │      Analytics Service (3004)        │            │
│  │  - Event Processing                  │            │
│  │  - Data Aggregation                  │            │
│  │  - Analytics APIs                    │            │
│  └──────────────────┬───────────────────┘            │
│                     │                                │
│                     │  Write Data                    │
│                     ▼                                │
│  ┌─────────────────────────────────────┐            │
│  │         ClickHouse Database          │            │
│  │  - Events Table                      │            │
│  │  - User Metrics                      │            │
│  │  - Chat Statistics                   │            │
│  │  - Revenue Data                      │            │
│  └─────────────────────────────────────┘            │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 📦 DELIVERABLES

### 1. ClickHouse Setup

**Docker Compose Integration**:
```yaml
clickhouse:
  image: clickhouse/clickhouse-server:latest
  container_name: ms-clickhouse
  ports:
    - "8123:8123"  # HTTP interface
    - "9000:9000"  # Native client
  volumes:
    - clickhouse-data:/var/lib/clickhouse
  environment:
    CLICKHOUSE_DB: analytics_db
    CLICKHOUSE_USER: analytics
    CLICKHOUSE_PASSWORD: ${CLICKHOUSE_PASSWORD}
```

**Schema**:
- `events` - Raw events from all services
- `user_metrics` - Aggregated user statistics
- `chat_statistics` - Chat usage data
- `revenue_data` - Billing & revenue metrics
- `provider_usage` - AI provider usage stats

---

### 2. Analytics Service Structure

```
services/analytics-service/
├── src/
│   ├── app.ts                    # Express app setup
│   ├── server.ts                 # Server startup
│   ├── config/
│   │   └── env.ts                # Environment config
│   ├── database/
│   │   ├── clickhouse.client.ts  # ClickHouse client
│   │   └── schemas/              # Table schemas
│   │       ├── events.sql
│   │       ├── user_metrics.sql
│   │       ├── chat_stats.sql
│   │       └── revenue.sql
│   ├── events/
│   │   ├── consumer.ts           # RabbitMQ consumer
│   │   ├── processor.ts          # Event processing logic
│   │   └── types.ts              # Event type definitions
│   ├── services/
│   │   ├── user-analytics.service.ts
│   │   ├── chat-analytics.service.ts
│   │   ├── revenue-analytics.service.ts
│   │   └── provider-analytics.service.ts
│   ├── controllers/
│   │   └── analytics.controller.ts
│   ├── routes/
│   │   └── analytics.routes.ts
│   └── middleware/
│       └── auth.middleware.ts    # Verify JWT from gateway
├── prisma/
│   └── schema.prisma             # Analytics models (if needed)
├── tests/
├── package.json
├── tsconfig.json
├── Dockerfile
└── .env
```

---

### 3. Event Types

**User Events**:
```typescript
type UserEvent =
  | { type: 'user.signup', data: { userId, email, planTier, timestamp } }
  | { type: 'user.signin', data: { userId, timestamp, ip } }
  | { type: 'user.signout', data: { userId, timestamp } }
  | { type: 'user.plan_upgrade', data: { userId, fromPlan, toPlan, timestamp } }
  | { type: 'user.plan_downgrade', data: { userId, fromPlan, toPlan, timestamp } }
```

**Chat Events**:
```typescript
type ChatEvent =
  | { type: 'chat.message_sent', data: { userId, conversationId, provider, model, tokens, timestamp } }
  | { type: 'chat.conversation_created', data: { userId, conversationId, title, timestamp } }
  | { type: 'chat.conversation_deleted', data: { userId, conversationId, timestamp } }
```

**Billing Events**:
```typescript
type BillingEvent =
  | { type: 'billing.payment_success', data: { userId, amount, currency, planId, timestamp } }
  | { type: 'billing.payment_failed', data: { userId, amount, reason, timestamp } }
  | { type: 'billing.subscription_created', data: { userId, planId, stripeSubscriptionId, timestamp } }
  | { type: 'billing.subscription_cancelled', data: { userId, planId, timestamp } }
```

---

### 4. Analytics APIs

**Endpoints**:

**User Analytics**:
```typescript
GET /api/analytics/users/count              // Total users
GET /api/analytics/users/growth             // User growth over time
GET /api/analytics/users/by-plan            // Users per plan tier
GET /api/analytics/users/active             // Daily/Weekly/Monthly active users
GET /api/analytics/users/retention          // User retention rate
```

**Chat Analytics**:
```typescript
GET /api/analytics/chat/messages            // Total messages sent
GET /api/analytics/chat/conversations       // Total conversations
GET /api/analytics/chat/by-provider         // Usage by AI provider
GET /api/analytics/chat/tokens              // Token usage statistics
GET /api/analytics/chat/average-session     // Average session duration
```

**Revenue Analytics**:
```typescript
GET /api/analytics/revenue/total            // Total revenue
GET /api/analytics/revenue/mrr              // Monthly Recurring Revenue
GET /api/analytics/revenue/arr              // Annual Recurring Revenue
GET /api/analytics/revenue/by-plan          // Revenue per plan tier
GET /api/analytics/revenue/churn-rate       // Churn rate
```

**Provider Analytics**:
```typescript
GET /api/analytics/providers/usage          // Usage by provider (OpenAI, Claude, etc.)
GET /api/analytics/providers/costs          // Cost per provider
GET /api/analytics/providers/popularity     // Most popular models
GET /api/analytics/providers/performance    // Response time by provider
```

**Query Parameters**:
- `startDate` - Start date (ISO 8601)
- `endDate` - End date (ISO 8601)
- `granularity` - hour, day, week, month
- `groupBy` - Group results by field

**Example**:
```bash
GET /api/analytics/users/growth?startDate=2025-01-01&endDate=2025-01-31&granularity=day
```

---

### 5. ClickHouse Tables

**events table** (raw events):
```sql
CREATE TABLE events (
    id UUID DEFAULT generateUUIDv4(),
    event_type String,
    user_id String,
    data String,  -- JSON data
    timestamp DateTime DEFAULT now(),
    date Date DEFAULT toDate(timestamp)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, timestamp, user_id);
```

**user_metrics table** (aggregated):
```sql
CREATE MATERIALIZED VIEW user_metrics
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, plan_tier)
AS SELECT
    toDate(timestamp) AS date,
    plan_tier,
    uniqState(user_id) AS unique_users,
    countState() AS total_signups
FROM events
WHERE event_type = 'user.signup'
GROUP BY date, plan_tier;
```

**chat_statistics table**:
```sql
CREATE MATERIALIZED VIEW chat_statistics
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, provider, model)
AS SELECT
    toDate(timestamp) AS date,
    JSONExtractString(data, 'provider') AS provider,
    JSONExtractString(data, 'model') AS model,
    countState() AS message_count,
    sumState(CAST(JSONExtractString(data, 'tokens'), 'UInt64')) AS total_tokens
FROM events
WHERE event_type = 'chat.message_sent'
GROUP BY date, provider, model;
```

**revenue_data table**:
```sql
CREATE MATERIALIZED VIEW revenue_data
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, currency)
AS SELECT
    toDate(timestamp) AS date,
    JSONExtractString(data, 'currency') AS currency,
    sumState(CAST(JSONExtractString(data, 'amount'), 'Float64')) AS total_revenue,
    countState() AS transaction_count
FROM events
WHERE event_type = 'billing.payment_success'
GROUP BY date, currency;
```

---

## 🔧 IMPLEMENTATION STEPS

### Step 1: Add ClickHouse to Docker Compose (30 mins)

1. Update `docker-compose.microservices.yml`
2. Add ClickHouse service
3. Start ClickHouse
4. Verify connection

---

### Step 2: Create Analytics Service Structure (1 hour)

1. Create service directory
2. Initialize npm project
3. Install dependencies:
   ```bash
   npm install express @clickhouse/client amqplib
   npm install -D typescript @types/node @types/express
   ```
4. Setup TypeScript config
5. Create basic Express app

---

### Step 3: ClickHouse Client & Schema (1.5 hours)

1. Create ClickHouse client
2. Define table schemas (SQL files)
3. Create migration script
4. Run initial migration
5. Test connection

---

### Step 4: Event Consumer (2 hours)

1. Create RabbitMQ consumer
2. Define event types
3. Implement event processor
4. Write events to ClickHouse
5. Error handling & retries

---

### Step 5: Integrate Event Publishing (2 hours)

**Auth Service Events**:
- Publish `user.signup` on registration
- Publish `user.signin` on login
- Publish `user.plan_upgrade` on plan change

**Chat Service Events**:
- Publish `chat.message_sent` after AI response
- Publish `chat.conversation_created`

**Billing Service Events**:
- Publish `billing.payment_success`
- Publish `billing.subscription_created`

---

### Step 6: Analytics APIs (3 hours)

1. User analytics service
2. Chat analytics service
3. Revenue analytics service
4. Provider analytics service
5. Controller & routes
6. API testing

---

### Step 7: Authentication & Authorization (1 hour)

1. JWT verification middleware
2. Admin-only endpoints
3. Rate limiting
4. CORS configuration

---

### Step 8: Testing (1.5 hours)

1. Unit tests for event processing
2. Integration tests for APIs
3. Load testing with mock events
4. Query performance testing

---

### Step 9: Documentation (1 hour)

1. API documentation (Swagger)
2. Event schema documentation
3. Query examples
4. Setup guide

---

### Step 10: Dockerization (30 mins)

1. Create Dockerfile
2. Add to docker-compose
3. Build & test image
4. Verify in container environment

---

## 🧪 TESTING PLAN

### Unit Tests
- Event processor logic
- Analytics calculations
- Query builders

### Integration Tests
- Event flow (publish → consume → store)
- API endpoints
- Query performance

### E2E Tests
- Full analytics pipeline
- Real data ingestion
- Report generation

---

## 📊 METRICS TO TRACK

### Business Metrics
- Total users
- Active users (DAU, WAU, MAU)
- User growth rate
- Revenue (MRR, ARR)
- Churn rate

### Product Metrics
- Chat messages sent
- Conversations created
- Tokens used
- Provider usage distribution

### Technical Metrics
- Event processing latency
- Query performance
- Data ingestion rate
- Storage usage

---

## ⚡ PERFORMANCE CONSIDERATIONS

### ClickHouse Optimization
- Partitioning by month
- Proper ORDER BY keys
- Materialized views for aggregations
- Compression (LZ4)

### Event Processing
- Batch inserts (100-1000 events)
- Async processing
- Queue prefetch limit
- Dead letter queue for failures

### API Performance
- Response caching (Redis)
- Query result caching
- Pagination for large results
- Async query execution

---

## 🔒 SECURITY

### Data Access
- Admin-only endpoints
- JWT authentication
- Rate limiting (100 req/min)

### Data Privacy
- No PII in analytics
- Anonymized user IDs
- GDPR compliance ready

### Data Retention
- Raw events: 90 days
- Aggregated data: 2 years
- Automatic cleanup jobs

---

## 📚 DOCUMENTATION DELIVERABLES

1. **API Documentation** - Swagger/OpenAPI
2. **Event Schema** - TypeScript definitions
3. **Query Examples** - Common analytics queries
4. **Setup Guide** - Installation & configuration
5. **Best Practices** - Event publishing guidelines

---

## ✅ SUCCESS CRITERIA

Phase 10 is complete when:

- [ ] ClickHouse running in Docker Compose
- [ ] Analytics Service operational (Port 3004)
- [ ] Event pipeline working (publish → consume → store)
- [ ] All analytics APIs implemented
- [ ] Events published from Auth, Chat, Billing services
- [ ] Tests passing (unit + integration)
- [ ] API documentation complete
- [ ] Performance acceptable (< 1s query time)
- [ ] Dockerized and deployable

---

## 🎯 NEXT PHASE

**Phase 11: Monitoring & Observability**
- Grafana dashboards using analytics data
- Prometheus alerts
- Real-time monitoring

---

**Generated**: 2025-10-27
**Status**: 🟡 In Progress (0%)
**Estimated Completion**: 3-4 days

Let's build comprehensive analytics! 📊📈
