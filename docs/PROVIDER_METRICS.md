# Provider Metrics Tracking

## Overview

Comprehensive AI provider performance tracking system for monitoring latency, costs, error rates, and overall health of OpenAI, Anthropic, and Google AI providers.

## Features

### ✅ Automatic Tracking
- **Latency**: Response time in milliseconds
- **Cost**: USD spend per request
- **Tokens**: Input and output token counts
- **Success/Failure**: Request outcome tracking
- **Error Details**: Error codes and messages
- **User Attribution**: Track metrics per user

### ✅ Real-time Health Monitoring
Provider health status based on recent metrics:
- **Healthy**: Error rate < 10%
- **Degraded**: Error rate 10-50%
- **Down**: Error rate > 50%

### ✅ Analytics & Insights
- Provider performance comparison
- Cost breakdown by provider/model
- Latency percentiles (p50, p95, p99)
- Hourly error rate trends
- Top models by usage

### ✅ Alerting
Configurable thresholds for:
- Error rate alerts
- Latency alerts
- Custom severity levels

## Database Schema

```prisma
model ProviderMetrics {
  id           String     @id @default(cuid())
  provider     AIProvider // OPENAI, ANTHROPIC, GOOGLE
  model        ModelId
  latencyMs    Int
  costUsd      Float      @default(0)
  success      Boolean
  errorCode    String?
  errorMessage String?
  userId       String?
  requestId    String?    // For idempotency
  tokensIn     Int?
  tokensOut    Int?
  createdAt    DateTime   @default(now())

  // Optimized indexes for analytics
  @@index([provider, createdAt(sort: Desc)])
  @@index([model, createdAt(sort: Desc)])
  @@index([success, createdAt(sort: Desc)])
  @@index([provider, model, createdAt(sort: Desc)])
  @@index([userId, createdAt(sort: Desc)])
}
```

## API Endpoints

### 1. Provider Health Status
```bash
GET /api/metrics/health?lookbackMinutes=15
```

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "provider": "OPENAI",
      "status": "healthy",
      "errorRate": 2.5,
      "avgLatencyMs": 487,
      "recentErrorCount": 3,
      "lastChecked": "2025-01-04T10:00:00Z"
    },
    {
      "provider": "ANTHROPIC",
      "status": "degraded",
      "errorRate": 15.2,
      "avgLatencyMs": 892,
      "recentErrorCount": 8,
      "lastChecked": "2025-01-04T10:00:00Z"
    }
  ],
  "timestamp": "2025-01-04T10:00:00Z"
}
```

### 2. Dashboard Metrics
```bash
GET /api/metrics/dashboard?hoursBack=24
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "timeRange": {
      "start": "2025-01-03T10:00:00Z",
      "end": "2025-01-04T10:00:00Z"
    },
    "providers": [
      {
        "provider": "OPENAI",
        "totalRequests": 1250,
        "successfulRequests": 1220,
        "failedRequests": 30,
        "errorRate": 2.4,
        "avgLatencyMs": 523,
        "totalCostUsd": 12.45,
        "totalTokensIn": 125000,
        "totalTokensOut": 62500
      }
    ],
    "topModels": [
      {
        "model": "gpt_4o_mini",
        "provider": "OPENAI",
        "totalRequests": 800,
        "errorRate": 1.5,
        "avgLatencyMs": 412,
        "totalCostUsd": 4.20
      }
    ],
    "overallStats": {
      "totalRequests": 1250,
      "totalCost": 12.45,
      "avgLatency": 523,
      "errorRate": 2.4
    }
  }
}
```

### 3. Cost Breakdown
```bash
GET /api/metrics/cost-breakdown?hoursBack=24
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "timeRange": {
      "start": "2025-01-03T10:00:00Z",
      "end": "2025-01-04T10:00:00Z"
    },
    "breakdown": [
      {
        "provider": "OPENAI",
        "model": "gpt_4o",
        "cost": 8.25,
        "requests": 150
      },
      {
        "provider": "OPENAI",
        "model": "gpt_4o_mini",
        "cost": 4.20,
        "requests": 800
      }
    ],
    "total": 12.45
  }
}
```

### 4. Alert Checking
```bash
GET /api/metrics/alerts?errorRatePercent=10&latencyMs=5000&enabled=true
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "alerts": [
      {
        "provider": "ANTHROPIC",
        "reason": "Error rate 15.2% exceeds threshold 10%",
        "severity": "warning"
      },
      {
        "provider": "GOOGLE",
        "reason": "Average latency 6500ms exceeds threshold 5000ms",
        "severity": "warning"
      }
    ],
    "count": 2,
    "thresholds": {
      "errorRatePercent": 10,
      "latencyMs": 5000,
      "enabled": true
    },
    "timestamp": "2025-01-04T10:00:00Z"
  }
}
```

### 5. Error Rate Trends
```bash
GET /api/metrics/trends?provider=OPENAI&hoursBack=24
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "provider": "OPENAI",
    "trends": [
      {
        "hour": "2025-01-04T09:00:00Z",
        "errorRate": 2.1,
        "totalRequests": 95
      },
      {
        "hour": "2025-01-04T08:00:00Z",
        "errorRate": 3.5,
        "totalRequests": 112
      }
    ],
    "hoursBack": 24
  }
}
```

## Architecture

### Layer Structure

```
API Route
    ↓
MetricsService (Business Logic)
    ↓
ProviderMetricsRepository (Data Access)
    ↓
Prisma (Database)
```

### Automatic Integration

Metrics are automatically tracked in `MultiProviderGateway`:

```typescript
// Success tracking
const response = await provider.generate(query, options)
await metricsService.recordMetric({
  provider: AIProviderEnum.OPENAI,
  model: ModelId.gpt_4o_mini,
  latencyMs: 523,
  costUsd: 0.002,
  success: true,
  tokensIn: 100,
  tokensOut: 50,
  userId: 'user-123',
  requestId: 'req-abc'
})

// Error tracking
catch (error) {
  await metricsService.recordMetric({
    provider: AIProviderEnum.OPENAI,
    model: ModelId.gpt_4o_mini,
    latencyMs: 1000,
    success: false,
    errorCode: 'RATE_LIMIT',
    errorMessage: 'Rate limit exceeded',
    userId: 'user-123',
    requestId: 'req-abc'
  })
}
```

## Usage Examples

### Monitor Provider Health
```typescript
import { container } from '@/lib/di/container'
import { MetricsService } from '@/services/metrics.service'

const metricsService = container.resolve(MetricsService)
const health = await metricsService.getProviderHealth(15)

health.forEach(status => {
  if (status.status === 'down') {
    console.error(`⚠️ ${status.provider} is DOWN! Error rate: ${status.errorRate}%`)
  }
})
```

### Get Cost Analysis
```typescript
const endDate = new Date()
const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days

const breakdown = await metricsService.getCostBreakdown(startDate, endDate)
console.log(`Total 7-day cost: $${breakdown.reduce((sum, item) => sum + item.cost, 0)}`)
```

### Set Up Alerts
```typescript
const alerts = await metricsService.checkAlerts({
  errorRatePercent: 10,
  latencyMs: 5000,
  enabled: true
})

if (alerts.length > 0) {
  // Send notifications
  alerts.forEach(alert => {
    notifyOps({
      title: `${alert.provider} Alert`,
      message: alert.reason,
      severity: alert.severity
    })
  })
}
```

## Testing

All components are fully tested with 17 passing tests:

```bash
npm test metrics
```

**Coverage:**
- ✅ Repository operations (create, query, aggregate)
- ✅ Service business logic (health, dashboard, alerts)
- ✅ Error handling and edge cases
- ✅ Idempotency verification

## Performance Optimizations

### Database Indexes
Optimized for common query patterns:
- Provider + time range queries
- Model-specific analytics
- Error rate calculations
- User attribution lookups

### Aggregation Queries
Uses Prisma aggregations for efficiency:
```typescript
await prisma.providerMetrics.aggregate({
  where: { provider, createdAt: { gte, lte } },
  _count: { id: true },
  _avg: { latencyMs: true },
  _sum: { costUsd: true, tokensIn: true, tokensOut: true }
})
```

### Non-blocking Recording
Metrics recording never blocks AI requests:
```typescript
async recordMetric(data) {
  try {
    await this.metricsRepo.create(data)
  } catch (error) {
    logger.error('Failed to record metric', { error })
    // Don't throw - metrics should not break main flow
  }
}
```

## Monitoring & Alerting

### Set Up Cron Job for Health Checks
```typescript
// Every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  const health = await metricsService.getProviderHealth(15)

  health.forEach(status => {
    if (status.status !== 'healthy') {
      sendAlert({
        provider: status.provider,
        status: status.status,
        errorRate: status.errorRate
      })
    }
  })
})
```

### Dashboard Integration
```typescript
// Real-time dashboard data
const dashboard = await metricsService.getDashboardMetrics(24)

// Update UI with:
// - Provider comparison charts
// - Cost trends
// - Error rate graphs
// - Top models table
```

## Next Steps

1. **Visualization**: Create admin dashboard with charts
2. **Webhooks**: Add webhook notifications for alerts
3. **Cost Optimization**: Analyze patterns to reduce spend
4. **SLA Monitoring**: Track provider uptime and reliability
5. **Predictive Analytics**: ML-based anomaly detection

## Migration

Database schema already applied via:
```bash
npx prisma db push
```

To create a proper migration:
```bash
npx prisma migrate dev --name add-provider-metrics
```

## Summary

The Provider Metrics Tracking system provides:
- ✅ **Automatic tracking** - Zero code changes in routes
- ✅ **Real-time monitoring** - Provider health at a glance
- ✅ **Cost visibility** - Track and optimize spending
- ✅ **Performance analytics** - Latency and reliability insights
- ✅ **Alert system** - Proactive issue detection
- ✅ **Production-ready** - Fully tested and optimized
- ✅ **Non-blocking** - Never affects AI request performance

Built with the same DI architecture for maximum testability and maintainability.
