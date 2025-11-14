# Database Schema

Complete documentation of the PostgreSQL database schema for the AI SaaS Chat Platform.

**Database**: PostgreSQL (Neon)
**Version**: 1.0.0
**Last Updated**: 2025-11-14

---

## Table of Contents

1. [Overview](#overview)
2. [Entity-Relationship Diagram](#entity-relationship-diagram)
3. [Core Tables](#core-tables)
4. [Indexes](#indexes)
5. [Constraints](#constraints)
6. [Sample Queries](#sample-queries)

---

## Overview

The database is designed with the following principles:

- **Normalization**: 3NF (Third Normal Form)
- **Performance**: Strategic indexes on frequently queried columns
- **Audit Trail**: Created/updated timestamps on all tables
- **Data Integrity**: Foreign key constraints
- **Scalability**: Partitioning strategy for large tables

### Database Structure

```
User Management
  └── Users
  └── Sessions
  └── EmailVerifications
  └── PasswordResets

Chat System
  └── Conversations
  └── Messages
  └── TokenUsage
  └── AIProviders

Billing System
  └── Subscriptions
  └── Plans
  └── Payments
  └── Invoices
  └── UsageTracking

Analytics
  └── UserEvents
  └── ChatAnalytics
  └── RevenueAnalytics
```

---

## Entity-Relationship Diagram

```
┌─────────────────────┐
│      Users          │
├─────────────────────┤
│ id (PK)             │
│ email (UK)          │
│ password            │
│ name                │
│ planTier            │
│ emailVerified       │
│ isActive            │
│ createdAt           │
│ updatedAt           │
└─────────┬───────────┘
          │
          ├─────────────────────────────────────┐
          │                                     │
          ▼                                     ▼
┌──────────────────────────┐      ┌────────────────────────┐
│   Conversations          │      │   Subscriptions        │
├──────────────────────────┤      ├────────────────────────┤
│ id (PK)                  │      │ id (PK)                │
│ userId (FK)              │      │ userId (FK)            │
│ title                    │      │ stripeSubscriptionId   │
│ model                    │      │ planId (FK)            │
│ messageCount             │      │ status                 │
│ tokenCount               │      │ currentPeriodStart     │
│ createdAt                │      │ currentPeriodEnd       │
│ updatedAt                │      │ cancellationDate       │
└──────────┬───────────────┘      │ createdAt              │
           │                      │ updatedAt              │
           ▼                      └────────┬───────────────┘
┌──────────────────────────┐               │
│     Messages             │               ▼
├──────────────────────────┤      ┌────────────────────────┐
│ id (PK)                  │      │      Plans             │
│ conversationId (FK)      │      ├────────────────────────┤
│ role                     │      │ id (PK)                │
│ content                  │      │ name                   │
│ tokenCount               │      │ price                  │
│ model                    │      │ interval               │
│ createdAt                │      │ monthlyTokenQuota      │
└──────────┬───────────────┘      │ features               │
           │                      │ createdAt              │
           ▼                      │ updatedAt              │
┌──────────────────────────┐      └────────────────────────┘
│    TokenUsage            │
├──────────────────────────┤
│ id (PK)                  │
│ userId (FK)              │
│ conversationId (FK)      │
│ messageId (FK)           │
│ model                    │
│ promptTokens             │
│ completionTokens         │
│ totalTokens              │
│ costUsd                  │
│ createdAt                │
└──────────────────────────┘

┌──────────────────────────┐
│     Payments             │
├──────────────────────────┤
│ id (PK)                  │
│ userId (FK)              │
│ subscriptionId (FK)      │
│ stripePaymentId          │
│ amount                   │
│ currency                 │
│ status                   │
│ createdAt                │
│ updatedAt                │
└──────────────────────────┘
```

---

## Core Tables

### 1. Users

**Purpose**: Store user account information

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,

  -- Subscription & Plan Information
  planTier VARCHAR(50) NOT NULL DEFAULT 'FREE',
  -- Options: FREE, PLUS, PRO

  -- Account Status
  emailVerified BOOLEAN DEFAULT FALSE,
  emailVerifiedAt TIMESTAMP,
  isActive BOOLEAN DEFAULT TRUE,

  -- Usage Tracking (for convenience, also tracked separately)
  monthlyTokenUsed INTEGER DEFAULT 0,
  monthlyTokenReset DATE DEFAULT CURRENT_DATE,

  -- Metadata
  lastLoginAt TIMESTAMP,
  loginCount INTEGER DEFAULT 0,

  -- Audit
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_planTier ON users(planTier);
CREATE INDEX idx_users_isActive ON users(isActive);
CREATE INDEX idx_users_createdAt ON users(createdAt DESC);
```

**Constraints**:
- Email must be unique (UK)
- planTier must be one of: FREE, PLUS, PRO
- emailVerified can only be TRUE if emailVerifiedAt is set

---

### 2. Sessions

**Purpose**: Track user sessions and authentication

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  token VARCHAR(512) NOT NULL UNIQUE,
  -- JWT token

  userAgent VARCHAR(500),
  ipAddress INET,

  -- Session Lifecycle
  isActive BOOLEAN DEFAULT TRUE,
  expiresAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lastActivityAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_sessions_userId ON sessions(userId);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expiresAt ON sessions(expiresAt);
```

---

### 3. EmailVerifications

**Purpose**: Track email verification process

```sql
CREATE TABLE emailVerifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,

  isVerified BOOLEAN DEFAULT FALSE,
  verifiedAt TIMESTAMP,
  expiresAt TIMESTAMP NOT NULL,

  -- Tracking
  attemptCount INTEGER DEFAULT 0,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_email_verifications_userId ON emailVerifications(userId);
CREATE INDEX idx_email_verifications_token ON emailVerifications(token);
CREATE INDEX idx_email_verifications_expiresAt ON emailVerifications(expiresAt);
```

---

### 4. PasswordResets

**Purpose**: Manage password reset tokens

```sql
CREATE TABLE passwordResets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  token VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,

  isUsed BOOLEAN DEFAULT FALSE,
  usedAt TIMESTAMP,
  expiresAt TIMESTAMP NOT NULL,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_password_resets_userId ON passwordResets(userId);
CREATE INDEX idx_password_resets_token ON passwordResets(token);
```

---

### 5. Conversations

**Purpose**: Store chat conversations

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  title VARCHAR(500) NOT NULL,
  description TEXT,

  -- Model & Configuration
  model VARCHAR(100) NOT NULL,
  -- Options: gpt-4, gpt-4o, gpt-3.5-turbo, claude-3-opus, claude-3-sonnet

  systemPrompt TEXT,
  -- Custom system prompt if any

  -- Statistics (denormalized for performance)
  messageCount INTEGER DEFAULT 0,
  tokenCount INTEGER DEFAULT 0,

  -- Status
  isArchived BOOLEAN DEFAULT FALSE,
  archivedAt TIMESTAMP,

  -- Metadata
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_conversations_userId ON conversations(userId);
CREATE INDEX idx_conversations_model ON conversations(model);
CREATE INDEX idx_conversations_createdAt ON conversations(createdAt DESC);
CREATE INDEX idx_conversations_isArchived ON conversations(isArchived);
```

---

### 6. Messages

**Purpose**: Store individual chat messages

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversationId UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- Message Metadata
  role VARCHAR(50) NOT NULL,
  -- Values: 'user' (human) or 'assistant' (AI)

  content TEXT NOT NULL,

  -- Token Information
  tokenCount INTEGER NOT NULL DEFAULT 0,
  promptTokens INTEGER,
  completionTokens INTEGER,

  -- AI Configuration
  model VARCHAR(100),

  -- Content Metadata
  language VARCHAR(10),
  -- Detected language code (en, es, fr, etc.)

  -- Deletion
  isDeleted BOOLEAN DEFAULT FALSE,
  deletedAt TIMESTAMP,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_messages_conversationId ON messages(conversationId);
CREATE INDEX idx_messages_role ON messages(role);
CREATE INDEX idx_messages_createdAt ON messages(createdAt DESC);
CREATE INDEX idx_messages_model ON messages(model);
```

---

### 7. TokenUsage

**Purpose**: Track token usage for billing and analytics

```sql
CREATE TABLE tokenUsage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversationId UUID REFERENCES conversations(id) ON DELETE SET NULL,
  messageId UUID REFERENCES messages(id) ON DELETE SET NULL,

  -- Provider & Model Information
  provider VARCHAR(100) NOT NULL,
  -- Values: openai, anthropic, google

  model VARCHAR(100) NOT NULL,

  -- Token Counts
  promptTokens INTEGER NOT NULL,
  completionTokens INTEGER NOT NULL,
  totalTokens INTEGER NOT NULL,

  -- Cost Information
  costUsd DECIMAL(10, 6) NOT NULL,
  -- Decimal(10,6) allows up to $9,999.999999

  -- Billing Period
  billingMonth DATE NOT NULL,
  -- First day of the month for easy aggregation

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_tokenUsage_userId ON tokenUsage(userId);
CREATE INDEX idx_tokenUsage_userId_billingMonth ON tokenUsage(userId, billingMonth);
CREATE INDEX idx_tokenUsage_conversationId ON tokenUsage(conversationId);
CREATE INDEX idx_tokenUsage_model ON tokenUsage(model);
CREATE INDEX idx_tokenUsage_createdAt ON tokenUsage(createdAt DESC);
```

---

### 8. Plans

**Purpose**: Define subscription plans

```sql
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name VARCHAR(100) NOT NULL UNIQUE,
  -- Values: Free, Plus, Pro

  stripePriceId VARCHAR(255),
  -- Stripe Price ID for webhook handling

  -- Pricing
  monthlyPrice DECIMAL(10, 2) NOT NULL,
  yearlyPrice DECIMAL(10, 2),

  -- Quotas
  monthlyTokenQuota INTEGER NOT NULL,
  maxConversations INTEGER,
  maxMessagesPerConversation INTEGER,

  -- Features (JSON array of feature names)
  features JSON DEFAULT '[]',

  -- Status
  isActive BOOLEAN DEFAULT TRUE,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_plans_name ON plans(name);
CREATE INDEX idx_plans_isActive ON plans(isActive);
```

---

### 9. Subscriptions

**Purpose**: Track user subscriptions

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  planId UUID NOT NULL REFERENCES plans(id),

  -- Stripe Information
  stripeSubscriptionId VARCHAR(255) NOT NULL UNIQUE,
  stripeCustomerId VARCHAR(255) NOT NULL,

  -- Subscription Status
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  -- Values: active, canceled, past_due, unpaid, paused

  -- Billing Cycle
  currentPeriodStart TIMESTAMP NOT NULL,
  currentPeriodEnd TIMESTAMP NOT NULL,

  -- Cancellation
  cancellationDate TIMESTAMP,
  cancellationReason VARCHAR(255),
  cancelAtPeriodEnd BOOLEAN DEFAULT FALSE,

  -- Trial
  trialEndsAt TIMESTAMP,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_subscriptions_userId ON subscriptions(userId);
CREATE INDEX idx_subscriptions_planId ON subscriptions(planId);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_currentPeriodEnd ON subscriptions(currentPeriodEnd);
```

---

### 10. Payments

**Purpose**: Track payment transactions

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscriptionId UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- Stripe Information
  stripePaymentIntentId VARCHAR(255) NOT NULL UNIQUE,
  stripeInvoiceId VARCHAR(255),

  -- Payment Details
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  -- Status
  status VARCHAR(50) NOT NULL,
  -- Values: succeeded, failed, pending, refunded

  description TEXT,

  -- Metadata
  metadata JSON,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_payments_userId ON payments(userId);
CREATE INDEX idx_payments_subscriptionId ON payments(subscriptionId);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_createdAt ON payments(createdAt DESC);
```

---

### 11. Invoices

**Purpose**: Store invoice records for accounting

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscriptionId UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- Invoice Details
  invoiceNumber VARCHAR(50) NOT NULL UNIQUE,
  stripeInvoiceId VARCHAR(255) NOT NULL UNIQUE,

  -- Amounts
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  -- Values: draft, open, paid, void, uncollectible

  dueDate DATE,
  paidAt TIMESTAMP,

  -- PDF
  pdfUrl VARCHAR(500),

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_invoices_userId ON invoices(userId);
CREATE INDEX idx_invoices_status ON invoices(status);
```

---

### 12. UsageTracking

**Purpose**: Track monthly usage for quota enforcement

```sql
CREATE TABLE usageTracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Current Month
  billingMonth DATE NOT NULL,
  -- First day of current billing month

  -- Usage Counts
  tokensUsed INTEGER DEFAULT 0,
  messagesCount INTEGER DEFAULT 0,
  conversationsCount INTEGER DEFAULT 0,

  -- Quota (cached from plan)
  monthlyQuota INTEGER NOT NULL,

  -- Cost
  costThisMonth DECIMAL(10, 6) DEFAULT 0,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_usageTracking_userId ON usageTracking(userId);
CREATE INDEX idx_usageTracking_billingMonth ON usageTracking(billingMonth);
```

---

### 13. AIProviders

**Purpose**: Configure AI provider pricing and limits

```sql
CREATE TABLE aiProviders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name VARCHAR(100) NOT NULL UNIQUE,
  -- Values: openai, anthropic, google

  -- Pricing (per 1K tokens)
  inputTokenCostPer1k DECIMAL(10, 8) NOT NULL,
  outputTokenCostPer1k DECIMAL(10, 8) NOT NULL,

  -- Rate Limits
  requestsPerMinute INTEGER,
  requestsPerDay INTEGER,

  -- Models
  supportedModels JSON NOT NULL DEFAULT '[]',

  -- Status
  isActive BOOLEAN DEFAULT TRUE,
  isAvailable BOOLEAN DEFAULT TRUE,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_aiProviders_name ON aiProviders(name);
CREATE INDEX idx_aiProviders_isActive ON aiProviders(isActive);
```

---

## Indexes

### Performance-Critical Indexes

```sql
-- User-based queries
CREATE INDEX idx_tokenUsage_userId_model ON tokenUsage(userId, model);
CREATE INDEX idx_messages_conversationId_createdAt ON messages(conversationId, createdAt DESC);
CREATE INDEX idx_conversations_userId_createdAt ON conversations(userId, createdAt DESC);

-- Subscription/Billing queries
CREATE INDEX idx_subscriptions_userId_status ON subscriptions(userId, status);
CREATE INDEX idx_payments_userId_createdAt ON payments(userId, createdAt DESC);

-- Time-based queries
CREATE INDEX idx_tokenUsage_billingMonth ON tokenUsage(billingMonth);
CREATE INDEX idx_messages_createdAt ON messages(createdAt DESC);

-- Analytics queries
CREATE INDEX idx_tokenUsage_userId_billingMonth_model ON tokenUsage(userId, billingMonth, model);
CREATE INDEX idx_conversations_userId_model_createdAt ON conversations(userId, model, createdAt DESC);
```

---

## Constraints

### Foreign Key Constraints

```sql
-- All foreign keys use ON DELETE CASCADE for cleanup
-- Exception: ON DELETE SET NULL for optional relationships
ALTER TABLE sessions
  ADD CONSTRAINT fk_sessions_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE conversations
  ADD CONSTRAINT fk_conversations_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE messages
  ADD CONSTRAINT fk_messages_conversationId FOREIGN KEY (conversationId)
    REFERENCES conversations(id) ON DELETE CASCADE;

ALTER TABLE subscriptions
  ADD CONSTRAINT fk_subscriptions_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE tokenUsage
  ADD CONSTRAINT fk_tokenUsage_conversationId FOREIGN KEY (conversationId)
    REFERENCES conversations(id) ON DELETE SET NULL;
```

### Check Constraints

```sql
ALTER TABLE users
  ADD CONSTRAINT check_planTier CHECK (planTier IN ('FREE', 'PLUS', 'PRO'));

ALTER TABLE messages
  ADD CONSTRAINT check_role CHECK (role IN ('user', 'assistant'));

ALTER TABLE payments
  ADD CONSTRAINT check_status CHECK (status IN ('succeeded', 'failed', 'pending', 'refunded'));

ALTER TABLE subscriptions
  ADD CONSTRAINT check_subscription_status CHECK
    (status IN ('active', 'canceled', 'past_due', 'unpaid', 'paused'));

ALTER TABLE tokenUsage
  ADD CONSTRAINT check_providers CHECK (provider IN ('openai', 'anthropic', 'google'));
```

---

## Sample Queries

### User Analytics

**Get user signup trends**:
```sql
SELECT DATE_TRUNC('day', createdAt) as signup_date, COUNT(*) as new_users
FROM users
WHERE createdAt >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', createdAt)
ORDER BY signup_date DESC;
```

**Get users by plan**:
```sql
SELECT planTier, COUNT(*) as count
FROM users
WHERE isActive = TRUE
GROUP BY planTier;
```

---

### Token Usage Analytics

**Get monthly token usage by user**:
```sql
SELECT
  userId,
  SUM(totalTokens) as total_tokens,
  SUM(costUsd) as total_cost
FROM tokenUsage
WHERE billingMonth = DATE_TRUNC('month', CURRENT_DATE)::date
GROUP BY userId
ORDER BY total_tokens DESC;
```

**Get token usage by model**:
```sql
SELECT
  model,
  COUNT(*) as usage_count,
  SUM(totalTokens) as total_tokens,
  AVG(totalTokens) as avg_tokens
FROM tokenUsage
WHERE billingMonth = DATE_TRUNC('month', CURRENT_DATE)::date
GROUP BY model
ORDER BY total_tokens DESC;
```

---

### Subscription Analytics

**Get active subscriptions by plan**:
```sql
SELECT
  p.name,
  COUNT(s.id) as subscription_count,
  COUNT(DISTINCT s.userId) as user_count
FROM subscriptions s
JOIN plans p ON s.planId = p.id
WHERE s.status = 'active'
GROUP BY p.name;
```

**Get monthly recurring revenue**:
```sql
SELECT
  SUM(p.monthlyPrice) as mrr
FROM subscriptions s
JOIN plans p ON s.planId = p.id
WHERE s.status = 'active'
  AND s.currentPeriodStart <= CURRENT_DATE
  AND s.currentPeriodEnd > CURRENT_DATE;
```

---

### Conversation Analytics

**Get most active users**:
```sql
SELECT
  userId,
  COUNT(DISTINCT id) as conversation_count,
  SUM(tokenCount) as total_tokens
FROM conversations
WHERE createdAt >= NOW() - INTERVAL '30 days'
GROUP BY userId
ORDER BY total_tokens DESC
LIMIT 10;
```

**Get average conversation length**:
```sql
SELECT
  AVG(messageCount) as avg_messages,
  AVG(tokenCount) as avg_tokens
FROM conversations
WHERE createdAt >= NOW() - INTERVAL '30 days';
```

---

### Billing Queries

**Get overdue invoices**:
```sql
SELECT
  id,
  invoiceNumber,
  userId,
  total,
  dueDate
FROM invoices
WHERE status IN ('open', 'unpaid')
  AND dueDate < CURRENT_DATE
ORDER BY dueDate ASC;
```

**Calculate customer lifetime value**:
```sql
SELECT
  p.amount,
  COUNT(p.id) as payment_count,
  SUM(p.amount) as total_spent,
  u.createdAt as signup_date
FROM payments p
JOIN users u ON p.userId = u.id
WHERE p.status = 'succeeded'
GROUP BY p.userId, p.amount, u.createdAt;
```

---

## Migration Strategy

### New Table Creation
1. Create table with all fields
2. Add indexes
3. Add constraints
4. Populate sample data
5. Deploy

### Schema Updates
1. Add column with default value
2. Add constraint (non-blocking)
3. Update application code
4. Remove old column (after rollout period)

### Zero-Downtime Deployments

```sql
-- Add new column with NOT NULL DEFAULT
ALTER TABLE users ADD COLUMN new_field VARCHAR(255) DEFAULT 'value';

-- Create index concurrently (doesn't lock table)
CREATE INDEX CONCURRENTLY idx_new_field ON users(new_field);

-- Update old column (in chunks)
UPDATE users SET new_field = old_field WHERE id < 10000;

-- Drop old column only after full deployment
ALTER TABLE users DROP COLUMN old_field;
```

---

## Backup & Recovery

### Daily Backup Schedule
- Full backup: 2:00 AM UTC
- Incremental: Every 6 hours
- Retention: 30 days

### Recovery Procedure
1. Identify recovery point
2. Restore from backup
3. Validate data integrity
4. Test application connectivity
5. Switch to restored database

---

## Performance Optimization Tips

1. **Query Planning**
   - Use EXPLAIN ANALYZE for slow queries
   - Check index usage with pg_stat_user_indexes

2. **Connection Pooling**
   - Use PgBouncer for connection pooling
   - Set pool size based on workload

3. **Partitioning**
   - Partition tokenUsage by year
   - Partition messages by conversation

4. **Monitoring**
   - Track slow queries
   - Monitor index bloat
   - Watch connection count

---

## References

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Neon Documentation: https://neon.tech/docs/
- System Architecture: `docs/architecture/SYSTEM_ARCHITECTURE.md`
- API Documentation: `docs/api/openapi.yaml`
