# Phase 3: Cost Monitoring & Limits

**Phase:** 3 of 3
**Dates:** Week 3 (Nov 27 - Dec 3, 2025)
**Priority:** High
**Status:** Not Started

---

## Context

**Research Reports:**
- [OpenAI Embeddings](./research/researcher-02-openai-embeddings.md) - Pricing and token limits
- [File Storage](./research/researcher-05-file-storage.md) - R2 vs S3 cost comparison

**Prerequisites:**
- Phase 1 completed (infrastructure)
- Phase 2 completed (core features)

---

## Overview

Implement cost controls, rate limiting, and monitoring to ensure the PDF Q&A system stays within budget ($100-500/month) while supporting freemium model.

**Scope:**
- Rate limiting (uploads, queries)
- Token usage tracking and reporting
- Cost alerts and anomaly detection
- Quota enforcement middleware
- Admin dashboard for cost monitoring

**Non-Scope:**
- Frontend UI for user dashboards (separate workstream)
- Payment processing (handled by billing-service)
- Advanced analytics (future phase)

---

## Key Insights from Research

**OpenAI Costs (researcher-02):**
- Embeddings: $0.02/1M tokens (text-embedding-3-small)
- Chat completion: $0.01/1K tokens (GPT-4o-mini) or $0.60/1K (GPT-4)
- Average 100-page PDF: 150K tokens → $0.003 embeddings + $0.15 queries (10x)
- Batch API: 50% savings (use for bulk processing)

**Storage Costs (researcher-05):**
- R2: $0.015/GB/month storage + $0/GB egress (FREE)
- Average 10MB PDF: ~$0.00015/month
- 1000 users × 5 PDFs × 10MB = 50GB → $0.75/month
- Lifecycle policy: Auto-delete after 90 days (reduces costs)

**Projected Costs (1000 users, free tier):**
- Embeddings: 5000 PDFs × $0.003 = $15
- Queries: 50K queries/day × $0.015/query = $750/month (GPT-4o-mini)
- Storage: 50GB × $0.015 = $0.75
- **Total: ~$765/month** (within $500-1000 target)

**Cost Reduction Strategies:**
- Use GPT-4o-mini instead of GPT-4 (60x cheaper)
- Cache frequent queries (Redis)
- Batch embeddings for bulk uploads
- Enforce strict rate limits (50 queries/day)

---

## Requirements

### 1. Free Tier Limits

**Per User Quotas:**
```typescript
const FREE_TIER_LIMITS = {
  maxDocuments: 5,           // Total PDFs uploaded
  maxFileSize: 10 * 1024 * 1024,  // 10MB per PDF
  maxUploadsPerDay: 5,       // Uploads per 24 hours
  maxQueriesPerDay: 50,      // Queries per 24 hours
  maxTokensPerQuery: 5000,   // Max tokens per RAG response
};
```

**Quota Checks:**
- Upload: Check document count + daily upload count + file size
- Query: Check daily query count + token estimate
- Return 429 with quota details if exceeded

### 2. Rate Limiting Middleware

**Implementation:**
```typescript
// src/middleware/rate-limiter.ts
import { RateLimiterRedis } from 'rate-limiter-flexible';
import redis from '../config/redis';

const uploadLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'upload_limit',
  points: 5,        // 5 uploads
  duration: 86400,  // Per 24 hours
});

const queryLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'query_limit',
  points: 50,       // 50 queries
  duration: 86400,  // Per 24 hours
});

export async function rateLimitUpload(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await uploadLimiter.consume(req.userId);
    next();
  } catch (error) {
    return res.status(429).json({
      error: 'Daily upload limit exceeded (5 uploads per day)',
      resetAt: new Date(Date.now() + error.msBeforeNext).toISOString(),
    });
  }
}

export async function rateLimitQuery(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await queryLimiter.consume(req.userId);
    next();
  } catch (error) {
    return res.status(429).json({
      error: 'Daily query limit exceeded (50 queries per day)',
      resetAt: new Date(Date.now() + error.msBeforeNext).toISOString(),
    });
  }
}
```

### 3. Token Usage Tracking

**Database Model:**
```prisma
model TokenUsage {
  id              String    @id @default(cuid())
  userId          String
  documentId      String?
  operation       TokenOperation
  tokensUsed      Int
  cost            Float     // In USD
  model           String    // "text-embedding-3-small" or "gpt-4o-mini"
  createdAt       DateTime  @default(now())

  @@index([userId, createdAt])
  @@index([createdAt])
  @@map("token_usage")
}

enum TokenOperation {
  EMBEDDING_GENERATION
  QUERY_RESPONSE
}
```

**Tracking Function:**
```typescript
async function trackTokenUsage(
  userId: string,
  operation: TokenOperation,
  tokensUsed: number,
  model: string,
  documentId?: string
) {
  const costPerToken = {
    'text-embedding-3-small': 0.02 / 1_000_000,  // $0.02 per 1M tokens
    'gpt-4o-mini': 0.01 / 1_000,                 // $0.01 per 1K tokens
    'gpt-4': 0.60 / 1_000,                       // $0.60 per 1K tokens
  };

  const cost = tokensUsed * (costPerToken[model] || 0);

  await prisma.tokenUsage.create({
    data: {
      userId,
      documentId,
      operation,
      tokensUsed,
      cost,
      model,
    },
  });

  // Publish event for analytics
  await eventPublisher.publish({
    type: 'token.usage',
    userId,
    metadata: { operation, tokensUsed, cost, model },
  });
}
```

### 4. Cost Alerts

**Alert Thresholds:**
```typescript
const COST_ALERTS = {
  dailyBudget: 20,      // $20/day
  monthlyBudget: 500,   // $500/month
  warningThreshold: 0.8, // Alert at 80% budget
};
```

**Alert Function:**
```typescript
async function checkCostAlerts() {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Daily cost
  const dailyCost = await prisma.tokenUsage.aggregate({
    where: { createdAt: { gte: startOfDay } },
    _sum: { cost: true },
  });

  // Monthly cost
  const monthlyCost = await prisma.tokenUsage.aggregate({
    where: { createdAt: { gte: startOfMonth } },
    _sum: { cost: true },
  });

  // Send alerts
  if (dailyCost._sum.cost > COST_ALERTS.dailyBudget * COST_ALERTS.warningThreshold) {
    await sendAlert('daily', dailyCost._sum.cost, COST_ALERTS.dailyBudget);
  }

  if (monthlyCost._sum.cost > COST_ALERTS.monthlyBudget * COST_ALERTS.warningThreshold) {
    await sendAlert('monthly', monthlyCost._sum.cost, COST_ALERTS.monthlyBudget);
  }
}

// Run every hour
cron.schedule('0 * * * *', checkCostAlerts);
```

### 5. Quota Enforcement Middleware

**Implementation:**
```typescript
// src/middleware/quota.ts
export async function enforceDocumentQuota(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.userId;

  // Check total document count
  const documentCount = await prisma.document.count({
    where: { userId, deletedAt: null },
  });

  if (documentCount >= FREE_TIER_LIMITS.maxDocuments) {
    return res.status(429).json({
      error: 'Document quota exceeded (max 5 documents)',
      current: documentCount,
      limit: FREE_TIER_LIMITS.maxDocuments,
    });
  }

  next();
}

export async function enforceTokenQuota(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.userId;
  const estimatedTokens = 5000;  // Conservative estimate for query

  // Check daily token usage
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));

  const dailyUsage = await prisma.tokenUsage.aggregate({
    where: {
      userId,
      createdAt: { gte: startOfDay },
      operation: TokenOperation.QUERY_RESPONSE,
    },
    _sum: { tokensUsed: true },
  });

  const totalTokens = (dailyUsage._sum.tokensUsed || 0) + estimatedTokens;

  if (totalTokens > FREE_TIER_LIMITS.maxQueriesPerDay * 1000) {
    return res.status(429).json({
      error: 'Daily token quota exceeded',
      used: dailyUsage._sum.tokensUsed,
      limit: FREE_TIER_LIMITS.maxQueriesPerDay * 1000,
    });
  }

  next();
}
```

### 6. Admin Dashboard Endpoints

**Cost Summary:**
```typescript
// GET /api/admin/costs/summary
async function getCostSummary(req: Request, res: Response) {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [dailyCost, monthlyCost, totalTokens] = await Promise.all([
    prisma.tokenUsage.aggregate({
      where: { createdAt: { gte: startOfDay } },
      _sum: { cost: true, tokensUsed: true },
    }),
    prisma.tokenUsage.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { cost: true, tokensUsed: true },
    }),
    prisma.tokenUsage.aggregate({
      _sum: { tokensUsed: true },
    }),
  ]);

  return res.json({
    daily: {
      cost: dailyCost._sum.cost,
      tokens: dailyCost._sum.tokensUsed,
    },
    monthly: {
      cost: monthlyCost._sum.cost,
      tokens: monthlyCost._sum.tokensUsed,
    },
    allTime: {
      tokens: totalTokens._sum.tokensUsed,
    },
    budgets: COST_ALERTS,
  });
}
```

**Top Users by Cost:**
```typescript
// GET /api/admin/costs/top-users
async function getTopUsersByCost(req: Request, res: Response) {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const topUsers = await prisma.tokenUsage.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: startOfMonth } },
    _sum: { cost: true, tokensUsed: true },
    orderBy: { _sum: { cost: 'desc' } },
    take: 10,
  });

  return res.json(topUsers);
}
```

### 7. Anomaly Detection

**Detect unusual activity:**
```typescript
async function detectAnomalies() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Average daily cost over last 7 days
  const avgCost = await prisma.tokenUsage.aggregate({
    where: {
      createdAt: {
        gte: new Date(today.setDate(today.getDate() - 7)),
        lt: yesterday,
      },
    },
    _avg: { cost: true },
  });

  // Today's cost
  const todayCost = await prisma.tokenUsage.aggregate({
    where: { createdAt: { gte: new Date(today.setHours(0, 0, 0, 0)) } },
    _sum: { cost: true },
  });

  // Alert if today's cost is 2x average
  if (todayCost._sum.cost > (avgCost._avg.cost || 0) * 2) {
    await sendAlert('anomaly', todayCost._sum.cost, avgCost._avg.cost);
  }
}

cron.schedule('0 */6 * * *', detectAnomalies);  // Every 6 hours
```

---

## Architecture

### Updated Service Structure

```
chat-service/src/
├── middleware/
│   ├── rate-limiter.ts          # Rate limiting (uploads, queries)
│   └── quota.ts                 # Quota enforcement
├── services/
│   ├── token-tracking.service.ts  # Token usage tracking
│   └── cost-alert.service.ts      # Cost monitoring & alerts
├── controllers/
│   └── admin.controller.ts        # Admin dashboard endpoints
└── cron/
    ├── cost-alerts.cron.ts        # Hourly cost checks
    └── anomaly-detection.cron.ts  # Daily anomaly detection
```

---

## Implementation Steps

### Step 1: Install Dependencies
```bash
cd backend/services/chat-service
npm install --save rate-limiter-flexible node-cron
```

### Step 2: Create Rate Limiter Middleware
```typescript
// src/middleware/rate-limiter.ts
// (Implementation shown in Requirements section)
```

### Step 3: Create Quota Middleware
```typescript
// src/middleware/quota.ts
// (Implementation shown in Requirements section)
```

### Step 4: Create Token Tracking Service
```typescript
// src/services/token-tracking.service.ts
export class TokenTrackingService {
  async trackUsage(
    userId: string,
    operation: TokenOperation,
    tokensUsed: number,
    model: string,
    documentId?: string
  ) {
    // Implementation shown in Requirements section
  }

  async getDailyUsage(userId: string) {
    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    return prisma.tokenUsage.aggregate({
      where: { userId, createdAt: { gte: startOfDay } },
      _sum: { tokensUsed: true, cost: true },
    });
  }

  async getMonthlyUsage(userId: string) {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return prisma.tokenUsage.aggregate({
      where: { userId, createdAt: { gte: startOfMonth } },
      _sum: { tokensUsed: true, cost: true },
    });
  }
}
```

### Step 5: Create Cost Alert Service
```typescript
// src/services/cost-alert.service.ts
export class CostAlertService {
  async checkAlerts() {
    // Implementation shown in Requirements section
  }

  async detectAnomalies() {
    // Implementation shown in Requirements section
  }

  private async sendAlert(type: string, current: number, limit: number) {
    logger.warn(`Cost alert: ${type} - $${current} / $${limit}`);
    // TODO: Send email/Slack notification
  }
}
```

### Step 6: Create Admin Controller
```typescript
// src/controllers/admin.controller.ts
export class AdminController {
  async getCostSummary(req: Request, res: Response) {
    // Implementation shown in Requirements section
  }

  async getTopUsers(req: Request, res: Response) {
    // Implementation shown in Requirements section
  }

  async getUserUsage(req: Request, res: Response) {
    const { userId } = req.params;
    const [daily, monthly] = await Promise.all([
      tokenTrackingService.getDailyUsage(userId),
      tokenTrackingService.getMonthlyUsage(userId),
    ]);
    return res.json({ daily, monthly });
  }
}
```

### Step 7: Create Cron Jobs
```typescript
// src/cron/cost-alerts.cron.ts
import cron from 'node-cron';
import { costAlertService } from '../services/cost-alert.service';

// Run every hour
cron.schedule('0 * * * *', async () => {
  await costAlertService.checkAlerts();
});

// Run every 6 hours for anomaly detection
cron.schedule('0 */6 * * *', async () => {
  await costAlertService.detectAnomalies();
});
```

### Step 8: Update Document Routes
```typescript
// src/routes/document.routes.ts
import { rateLimitUpload, rateLimitQuery } from '../middleware/rate-limiter';
import { enforceDocumentQuota, enforceTokenQuota } from '../middleware/quota';

router.post(
  '/documents',
  authenticateToken,
  rateLimitUpload,
  enforceDocumentQuota,
  controller.uploadDocument
);

router.post(
  '/documents/:id/query',
  authenticateToken,
  rateLimitQuery,
  enforceTokenQuota,
  controller.queryDocument
);
```

### Step 9: Update Document Service
```typescript
// src/services/document.service.ts
import { tokenTrackingService } from './token-tracking.service';

async uploadDocument(userId: string, file: Buffer, title: string) {
  // ... existing code ...

  // Track embedding tokens
  const totalTokens = chunks.reduce((sum, c) => sum + c.tokens, 0);
  await tokenTrackingService.trackUsage(
    userId,
    TokenOperation.EMBEDDING_GENERATION,
    totalTokens,
    'text-embedding-3-small',
    document.id
  );

  // ... rest of code ...
}

async queryDocument(documentId: string, userId: string, query: string) {
  // ... existing code ...

  // Track query tokens
  await tokenTrackingService.trackUsage(
    userId,
    TokenOperation.QUERY_RESPONSE,
    tokensUsed,
    'gpt-4o-mini',
    documentId
  );

  // ... rest of code ...
}
```

### Step 10: Create Admin Routes
```typescript
// src/routes/admin.routes.ts
import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';

const router = Router();
const controller = new AdminController();

// Admin authentication middleware (check if user is admin)
router.get('/costs/summary', authenticateAdmin, controller.getCostSummary);
router.get('/costs/top-users', authenticateAdmin, controller.getTopUsers);
router.get('/costs/users/:userId', authenticateAdmin, controller.getUserUsage);

export default router;
```

---

## Todo List

**Rate Limiting:**
- [ ] Install rate-limiter-flexible package
- [ ] Create rate-limiter.ts middleware
- [ ] Configure Redis for rate limiter storage
- [ ] Test upload rate limit (5/day)
- [ ] Test query rate limit (50/day)
- [ ] Add rate limit headers (X-RateLimit-Remaining, etc.)

**Quota Enforcement:**
- [ ] Create quota.ts middleware
- [ ] Implement document count check
- [ ] Implement daily upload check
- [ ] Implement daily query check
- [ ] Add quota details to error responses
- [ ] Test quota enforcement with mock users

**Token Tracking:**
- [ ] Add TokenUsage model to Prisma schema
- [ ] Run migration for token_usage table
- [ ] Create token-tracking.service.ts
- [ ] Integrate tracking in uploadDocument()
- [ ] Integrate tracking in queryDocument()
- [ ] Test tracking with sample operations

**Cost Alerts:**
- [ ] Create cost-alert.service.ts
- [ ] Implement checkAlerts() function
- [ ] Implement detectAnomalies() function
- [ ] Add email/Slack notification function
- [ ] Create cron jobs (hourly alerts, 6-hour anomalies)
- [ ] Test alerts with mock data

**Admin Dashboard:**
- [ ] Create admin.controller.ts
- [ ] Implement getCostSummary endpoint
- [ ] Implement getTopUsers endpoint
- [ ] Implement getUserUsage endpoint
- [ ] Create admin.routes.ts
- [ ] Add admin authentication middleware
- [ ] Register admin routes in app.ts

**Middleware Integration:**
- [ ] Add rate limiters to document routes
- [ ] Add quota enforcement to document routes
- [ ] Test middleware chain (auth → rate → quota → handler)
- [ ] Add proper error messages for quota/rate limit errors

**Testing:**
- [ ] Test rate limit with burst requests
- [ ] Test quota enforcement (upload 6th document)
- [ ] Test token tracking accuracy
- [ ] Test cost alert triggers
- [ ] Test anomaly detection
- [ ] Load test with 100 concurrent users

**Documentation:**
- [ ] Document rate limits in API docs
- [ ] Document quota limits
- [ ] Add admin endpoints to API docs
- [ ] Create cost monitoring guide
- [ ] Document alert configuration

---

## Success Criteria

**Rate Limiting:**
- [ ] Upload limit enforced (5/day per user)
- [ ] Query limit enforced (50/day per user)
- [ ] Rate limit headers present in responses
- [ ] 429 errors include resetAt timestamp

**Quota Enforcement:**
- [ ] Document count limit works (max 5)
- [ ] File size limit works (max 10MB)
- [ ] Token quota prevents excessive queries
- [ ] Quota errors include current usage + limit

**Token Tracking:**
- [ ] All operations tracked in database
- [ ] Token counts accurate (±5% of actual)
- [ ] Cost calculations correct
- [ ] Analytics events published

**Cost Monitoring:**
- [ ] Daily cost alerts trigger at 80% budget
- [ ] Monthly cost alerts trigger at 80% budget
- [ ] Anomaly detection catches 2x spikes
- [ ] Admin dashboard shows real-time costs

**Performance:**
- [ ] Rate limiting adds <10ms latency
- [ ] Quota checks add <50ms latency
- [ ] Token tracking is non-blocking
- [ ] System stays under $500/month (1000 users)

---

## Risk Assessment

**High Risk:**
- **Cost overrun:** Users exploit rate limits
  - **Mitigation:** Hard limits + IP-based throttling + monitoring
- **Alert fatigue:** Too many false positives
  - **Mitigation:** Tune thresholds (80% for warnings, 95% for critical)

**Medium Risk:**
- **Redis downtime:** Rate limiter fails open
  - **Mitigation:** Fallback to in-memory limiter + monitor Redis health
- **Token tracking lag:** Database write delays
  - **Mitigation:** Async tracking + queue system

**Low Risk:**
- **Admin dashboard performance:** Slow queries
  - **Mitigation:** Add indexes on createdAt + userId, cache results

---

## Security Considerations

**Admin Access:**
- [ ] Admin endpoints require special role (not just authenticated)
- [ ] Log all admin actions (audit trail)
- [ ] Add IP whitelist for admin endpoints

**Data Privacy:**
- [ ] Admin dashboard shows aggregated data only
- [ ] No PII exposed in cost reports
- [ ] Token usage logs anonymized after 90 days

**Rate Limit Bypass:**
- [ ] Validate userId from JWT (not request body)
- [ ] Use Redis TTL for automatic cleanup
- [ ] Monitor for distributed attacks (multiple IPs, same user)

---

**Phase 3 Deliverables:**
1. Rate limiting middleware (uploads, queries)
2. Quota enforcement (documents, tokens)
3. Token usage tracking system
4. Cost alert service with cron jobs
5. Admin dashboard endpoints
6. Anomaly detection system
7. Documentation for cost management

**Project Complete:** All 3 phases delivered, PDF Q&A system operational with cost controls!
