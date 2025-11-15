# Phase 4: Cloudflare Workers AI Migration

**Date:** 2025-11-15
**Phase:** 4 of 5
**Description:** Full migration from OpenAI to Cloudflare Workers AI with hybrid fallback architecture
**Priority:** CRITICAL
**Status:** READY
**Estimated Duration:** 5 days

---

## Context Links

- **Main Plan:** [plan.md](./plan.md)
- **Research:**
  - [researcher-01-autorag.md](./research/researcher-01-autorag.md) - AutoRAG analysis
  - [researcher-02-workers-ai.md](./research/researcher-02-workers-ai.md) - Workers AI integration
- **Previous Phase:** [phase-03-consolidation.md](./phase-03-consolidation.md)

---

## Overview

Migrate chat-service from OpenAI-exclusive to Cloudflare Workers AI primary with OpenAI fallback.

**Cost Impact:** $350/mo → $185/mo (47% savings at 1K users)
**Quality Strategy:** Hybrid architecture ensures no degradation
**Rollout:** Phased A/B testing (10% → 50% → 100%)

---

## Key Insights

**From Research:**
- Cloudflare Llama 3.1 8B: 60% cheaper than GPT-3.5
- OpenAI-compatible API (drop-in replacement)
- Free tier: 10K neurons/day (perfect for testing)
- Embeddings: bge-m3 model (multi-lingual, free tier)
- AutoRAG: 6x more expensive than custom RAG (NOT recommended at scale)

**Migration Strategy:**
1. **Chat completions:** Llama 3.1 8B (free tier) → OpenAI fallback
2. **Embeddings:** bge-m3 (Cloudflare) → OpenAI fallback
3. **Document Q&A:** Custom RAG (pgvector) NOT AutoRAG (cost)
4. **Paid tier:** Option to use GPT-4 (premium upgrade)

**Cost Comparison (1,000 users):**
| Provider | Chat | Embeddings | Total |
|----------|------|------------|-------|
| OpenAI only | $250 | $100 | $350 |
| Cloudflare only | $100 | $50 | $150 |
| Hybrid (recommended) | $135 | $50 | $185 |

---

## Requirements

**Must Implement:**
1. Cloudflare AI client in chat-service
2. AI Gateway service (hybrid provider)
3. Cost monitoring (per provider)
4. A/B testing infrastructure
5. Fallback logic (automatic + graceful)
6. Budget alerts ($100, $300, $500)

**Must Preserve:**
1. API compatibility (no breaking changes)
2. Response quality (≥95% similarity to OpenAI)
3. User experience (no added latency)
4. Existing OpenAI integration (fallback)

**Must Monitor:**
1. Cost per user per provider
2. Quality metrics (user satisfaction)
3. Latency (p50, p95, p99)
4. Error rates
5. Fallback frequency

---

## Architecture

### Current (OpenAI Only)

```
User Request
    ↓
chat-service
    ↓
OpenAI API (GPT-3.5/4)
    ↓
Response
```

**Cost:** $0.005/chat (GPT-3.5) = $250/mo for 50K chats

### Target (Hybrid with Cloudflare Primary)

```
User Request
    ↓
chat-service
    ↓
AI Gateway
    ├── Free Tier → Cloudflare (Llama 3.1 8B)
    │   └── On Error → OpenAI (GPT-3.5)
    │
    └── Paid Tier → Cloudflare (primary)
        ├── On Error → OpenAI (GPT-3.5)
        └── Premium Upgrade → OpenAI (GPT-4)
    ↓
Cost Monitor → Track per provider
    ↓
Response
```

**Cost:** $0.002/chat (Cloudflare) = $100/mo + $35/mo (fallback) = $135/mo

**Savings:** $215/mo (61%) at 1K users, $1,725/mo at 10K users

---

## Related Code Files

### New Files to Create

**Core Services:**
- `backend/services/chat-service/src/services/cloudflare-ai.service.ts` (PRIMARY)
- `backend/services/chat-service/src/services/ai-gateway.service.ts` (ORCHESTRATOR)
- `backend/services/chat-service/src/services/cost-monitor.service.ts` (TRACKING)
- `backend/services/chat-service/src/services/ab-test.service.ts` (A/B TESTING)

**Database:**
- `backend/services/chat-service/prisma/migrations/xxx_add_cost_tracking.sql`
- Schema: TokenUsage model (add provider field)

**Config:**
- `backend/services/chat-service/.env.example` (add Cloudflare vars)

### Files to Modify

**Existing Services:**
- `backend/services/chat-service/src/services/chat.service.ts` - Use AI Gateway
- `backend/services/chat-service/src/services/openai.service.ts` - Keep as fallback
- `backend/services/chat-service/src/services/embedding.service.ts` - Add Cloudflare embeddings
- `backend/services/chat-service/src/services/rag.service.ts` - Use hybrid embeddings

**Controllers:**
- `backend/services/chat-service/src/controllers/chat.controller.ts` - Add A/B test logic
- `backend/services/chat-service/src/controllers/document.controller.ts` - Use Cloudflare embeddings

**Config:**
- `backend/services/chat-service/package.json` - Add @cloudflare/ai
- `backend/services/chat-service/.env` - Add Cloudflare credentials

---

## Implementation Steps

### Step 1: Setup Cloudflare Account (1 hour)

```bash
# 1. Create Cloudflare account (free tier)
# Visit: https://dash.cloudflare.com/sign-up

# 2. Enable Workers AI
# Dashboard → AI → Enable Workers AI

# 3. Generate API token
# My Profile → API Tokens → Create Token
# Permissions: Workers AI - Read, Workers AI - Edit

# 4. Get Account ID
# Dashboard → Workers & Pages → Account ID (copy)
```

**Add to .env:**
```env
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here
CLOUDFLARE_AI_GATEWAY_URL=https://api.cloudflare.com/client/v4
```

### Step 2: Install Dependencies (30 min)

```bash
cd backend/services/chat-service

# Install Cloudflare AI SDK
npm install @cloudflare/ai @cloudflare/workers-types

# Install testing deps
npm install --save-dev nock  # Mock HTTP requests

# Verify installation
npm list @cloudflare/ai
```

### Step 3: Implement Cloudflare AI Service (3 hours)

**Create:** `src/services/cloudflare-ai.service.ts`

```typescript
import { Ai } from '@cloudflare/ai';
import axios from 'axios';

export class CloudflareAIService {
  private accountId: string;
  private apiToken: string;
  private baseUrl: string;

  constructor() {
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN!;
    this.baseUrl = 'https://api.cloudflare.com/client/v4';
  }

  async chat(messages: Message[], options: ChatOptions = {}): Promise<string> {
    const model = options.model || '@cf/meta/llama-3.1-8b-instruct';

    const response = await axios.post(
      `${this.baseUrl}/accounts/${this.accountId}/ai/run/${model}`,
      {
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 500,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.result.response;
  }

  async embed(text: string): Promise<number[]> {
    const model = '@cf/baai/bge-m3';

    const response = await axios.post(
      `${this.baseUrl}/accounts/${this.accountId}/ai/run/${model}`,
      { text },
      {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.result.data[0].embedding;
  }

  async streamChat(messages: Message[], onChunk: (chunk: string) => void) {
    // Implement SSE streaming
    const model = '@cf/meta/llama-3.1-8b-instruct';

    const response = await axios.post(
      `${this.baseUrl}/accounts/${this.accountId}/ai/run/${model}`,
      { messages, stream: true },
      {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream'
      }
    );

    response.data.on('data', (chunk: Buffer) => {
      onChunk(chunk.toString());
    });
  }
}
```

### Step 4: Implement AI Gateway (Hybrid Provider) (4 hours)

**Create:** `src/services/ai-gateway.service.ts`

```typescript
import { CloudflareAIService } from './cloudflare-ai.service';
import { OpenAIService } from './openai.service';
import { CostMonitorService } from './cost-monitor.service';
import { ABTestService } from './ab-test.service';

export class AIGatewayService {
  private cloudflare: CloudflareAIService;
  private openai: OpenAIService;
  private costMonitor: CostMonitorService;
  private abTest: ABTestService;

  constructor() {
    this.cloudflare = new CloudflareAIService();
    this.openai = new OpenAIService();
    this.costMonitor = new CostMonitorService();
    this.abTest = new ABTestService();
  }

  async chat(messages: Message[], userId: string, isPremium: boolean): Promise<ChatResponse> {
    const startTime = Date.now();

    // A/B test: Route percentage to Cloudflare
    const useCloudflare = isPremium
      ? true  // Paid users: always try Cloudflare first
      : await this.abTest.shouldUseCloudflare(userId); // Free: A/B test

    if (!useCloudflare) {
      return await this.chatWithOpenAI(messages, userId, startTime);
    }

    // Try Cloudflare first
    try {
      const response = await this.cloudflare.chat(messages);
      const latency = Date.now() - startTime;

      await this.costMonitor.track({
        userId,
        provider: 'cloudflare',
        operation: 'chat',
        tokensUsed: this.estimateTokens(response),
        latency,
        cost: this.calculateCost('cloudflare', response)
      });

      return { content: response, provider: 'cloudflare', latency };
    } catch (error) {
      console.warn('Cloudflare failed, falling back to OpenAI:', error);

      await this.costMonitor.trackFallback(userId, 'cloudflare', 'openai');

      return await this.chatWithOpenAI(messages, userId, startTime, true);
    }
  }

  private async chatWithOpenAI(
    messages: Message[],
    userId: string,
    startTime: number,
    isFallback = false
  ): Promise<ChatResponse> {
    const response = await this.openai.chat(messages);
    const latency = Date.now() - startTime;

    await this.costMonitor.track({
      userId,
      provider: 'openai',
      operation: 'chat',
      tokensUsed: response.usage.total_tokens,
      latency,
      cost: this.calculateCost('openai', response),
      isFallback
    });

    return { content: response.choices[0].message.content, provider: 'openai', latency };
  }

  async embed(text: string, userId: string): Promise<number[]> {
    try {
      const embedding = await this.cloudflare.embed(text);
      await this.costMonitor.track({
        userId,
        provider: 'cloudflare',
        operation: 'embed',
        tokensUsed: text.length / 4, // Estimate
        cost: this.calculateEmbedCost('cloudflare', text)
      });
      return embedding;
    } catch (error) {
      console.warn('Cloudflare embed failed, using OpenAI:', error);
      const embedding = await this.openai.embed(text);
      await this.costMonitor.track({
        userId,
        provider: 'openai',
        operation: 'embed',
        tokensUsed: text.length / 4,
        cost: this.calculateEmbedCost('openai', text),
        isFallback: true
      });
      return embedding;
    }
  }

  private calculateCost(provider: string, response: any): number {
    // Cloudflare: $0.011 per 1K neurons (avg ~75 neurons per request)
    // OpenAI: $0.50 per M input tokens, $1.50 per M output tokens
    if (provider === 'cloudflare') {
      return 75 * 0.011 / 1000; // ~$0.0008 per chat
    } else {
      const inputCost = (response.usage.prompt_tokens / 1_000_000) * 0.50;
      const outputCost = (response.usage.completion_tokens / 1_000_000) * 1.50;
      return inputCost + outputCost;
    }
  }
}
```

### Step 5: Implement Cost Monitoring (3 hours)

**Create:** `src/services/cost-monitor.service.ts`

```typescript
import { PrismaClient } from '@prisma/client';

export class CostMonitorService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async track(usage: UsageRecord) {
    await this.prisma.tokenUsage.create({
      data: {
        userId: usage.userId,
        provider: usage.provider,
        operation: usage.operation,
        tokensUsed: usage.tokensUsed,
        cost: usage.cost,
        latency: usage.latency,
        isFallback: usage.isFallback || false,
        timestamp: new Date()
      }
    });

    // Check budget limits
    await this.checkBudgetLimits(usage.userId);
  }

  async trackFallback(userId: string, from: string, to: string) {
    await this.prisma.fallbackLog.create({
      data: { userId, fromProvider: from, toProvider: to, timestamp: new Date() }
    });
  }

  async getDailyCost(date: Date = new Date()): Promise<number> {
    const usage = await this.prisma.tokenUsage.aggregate({
      where: {
        timestamp: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999))
        }
      },
      _sum: { cost: true }
    });

    return usage._sum.cost || 0;
  }

  async checkBudgetLimits(userId: string) {
    const dailyCost = await this.getDailyCost();

    if (dailyCost > 500) {
      // CRITICAL: Send alert, throttle requests
      await this.sendAlert('CRITICAL', `Daily cost exceeded $500: $${dailyCost}`);
      throw new Error('Budget limit exceeded');
    } else if (dailyCost > 300) {
      await this.sendAlert('WARNING', `Daily cost: $${dailyCost}`);
    }
  }

  private async sendAlert(level: string, message: string) {
    // Send email/Slack notification
    console.error(`[COST ALERT ${level}] ${message}`);
  }
}
```

### Step 6: Implement A/B Testing (2 hours)

**Create:** `src/services/ab-test.service.ts`

```typescript
export class ABTestService {
  private cloudflareRollout: number;

  constructor() {
    // Start with 10%, gradually increase to 100%
    this.cloudflareRollout = parseFloat(process.env.CLOUDFLARE_ROLLOUT || '0.1');
  }

  async shouldUseCloudflare(userId: string): Promise<boolean> {
    // Consistent hashing: same user always gets same experience
    const hash = this.hashUserId(userId);
    return hash < this.cloudflareRollout;
  }

  private hashUserId(userId: string): number {
    // Simple hash function (0-1 range)
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash % 100) / 100;
  }

  setRollout(percentage: number) {
    this.cloudflareRollout = percentage;
  }
}
```

### Step 7: Update Database Schema (1 hour)

**Modify:** `prisma/schema.prisma`

```prisma
model TokenUsage {
  id          String   @id @default(uuid())
  userId      String
  provider    String   // 'cloudflare' or 'openai'
  operation   String   // 'chat' or 'embed'
  tokensUsed  Int
  cost        Float
  latency     Int?     // milliseconds
  isFallback  Boolean  @default(false)
  timestamp   DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId, timestamp])
  @@index([provider, timestamp])
}

model FallbackLog {
  id           String   @id @default(uuid())
  userId       String
  fromProvider String
  toProvider   String
  timestamp    DateTime @default(now())

  @@index([timestamp])
}
```

**Run migration:**
```bash
npx prisma migrate dev --name add_cost_tracking
npx prisma generate
```

### Step 8: Update Chat Service (2 hours)

**Modify:** `src/services/chat.service.ts`

```typescript
import { AIGatewayService } from './ai-gateway.service';

export class ChatService {
  private aiGateway: AIGatewayService;

  constructor() {
    this.aiGateway = new AIGatewayService();
  }

  async sendMessage(chatId: string, content: string, userId: string): Promise<Message> {
    const chat = await this.getChat(chatId);
    const isPremium = await this.checkPremiumStatus(userId);

    // Get conversation history
    const messages = await this.getConversationHistory(chatId);
    messages.push({ role: 'user', content });

    // Use AI Gateway (hybrid provider)
    const response = await this.aiGateway.chat(messages, userId, isPremium);

    // Save messages
    await this.saveMessage(chatId, 'user', content);
    await this.saveMessage(chatId, 'assistant', response.content);

    return {
      role: 'assistant',
      content: response.content,
      provider: response.provider,
      latency: response.latency
    };
  }
}
```

### Step 9: Testing (8 hours)

**Unit Tests:**
```typescript
// tests/unit/cloudflare-ai.service.test.ts
describe('CloudflareAIService', () => {
  it('should call Cloudflare API', async () => {
    const service = new CloudflareAIService();
    const response = await service.chat([{ role: 'user', content: 'Hello' }]);
    expect(response).toBeTruthy();
  });

  it('should handle API errors', async () => {
    // Mock axios to throw error
    await expect(service.chat([])).rejects.toThrow();
  });
});

// tests/unit/ai-gateway.service.test.ts
describe('AIGatewayService', () => {
  it('should use Cloudflare for free tier', async () => {
    const gateway = new AIGatewayService();
    const response = await gateway.chat(messages, 'user123', false);
    expect(response.provider).toBe('cloudflare');
  });

  it('should fallback to OpenAI on error', async () => {
    // Mock Cloudflare to fail
    const response = await gateway.chat(messages, 'user123', false);
    expect(response.provider).toBe('openai');
  });
});

// tests/unit/cost-monitor.service.test.ts
describe('CostMonitorService', () => {
  it('should track usage', async () => {
    const monitor = new CostMonitorService();
    await monitor.track({ userId: '123', provider: 'cloudflare', cost: 0.001 });
    const dailyCost = await monitor.getDailyCost();
    expect(dailyCost).toBeGreaterThan(0);
  });

  it('should alert on budget exceeded', async () => {
    // Test budget limits
  });
});
```

**Integration Tests:**
```bash
# Test full flow: user → AI Gateway → Cloudflare → response
npm run test:integration -- chat-flow.test.ts
```

**Manual Testing Checklist:**
- [ ] Free user gets Cloudflare response
- [ ] Paid user can use both providers
- [ ] Fallback works when Cloudflare fails
- [ ] Cost tracking records all requests
- [ ] Budget alerts trigger at thresholds
- [ ] A/B test distributes correctly

### Step 10: Gradual Rollout (Ongoing)

**Week 1: 10% Traffic**
```env
CLOUDFLARE_ROLLOUT=0.1
```
- Monitor quality, latency, errors
- Compare Cloudflare vs OpenAI responses
- User satisfaction surveys

**Week 2: 50% Traffic**
```env
CLOUDFLARE_ROLLOUT=0.5
```
- Verify cost savings materializing
- Check fallback rate (<5%)
- Performance stable

**Week 3: 100% Traffic**
```env
CLOUDFLARE_ROLLOUT=1.0
```
- All free tier on Cloudflare
- Paid tier: Cloudflare primary, OpenAI fallback/premium

---

## Todo List

- [ ] Create Cloudflare account
- [ ] Enable Workers AI
- [ ] Generate API token
- [ ] Get Account ID
- [ ] Add credentials to .env
- [ ] Install @cloudflare/ai package
- [ ] Implement CloudflareAIService
- [ ] Implement AIGatewayService
- [ ] Implement CostMonitorService
- [ ] Implement ABTestService
- [ ] Update Prisma schema (TokenUsage, FallbackLog)
- [ ] Run Prisma migration
- [ ] Update ChatService to use AIGateway
- [ ] Update EmbeddingService to use Cloudflare
- [ ] Write unit tests (CloudflareAI, AIGateway, CostMonitor)
- [ ] Write integration tests (full chat flow)
- [ ] Manual test: Free user → Cloudflare
- [ ] Manual test: Paid user → Cloudflare with fallback
- [ ] Manual test: Force error → OpenAI fallback
- [ ] Set CLOUDFLARE_ROLLOUT=0.1 (10%)
- [ ] Deploy to staging
- [ ] Monitor for 1 week
- [ ] Increase to 50% if metrics good
- [ ] Monitor for 1 week
- [ ] Increase to 100%
- [ ] Update CLAUDE.md with new architecture

---

## Success Criteria

**Phase Complete When:**
- [ ] Cloudflare integration working (chat + embeddings)
- [ ] Hybrid fallback logic working
- [ ] Cost monitoring tracking both providers
- [ ] A/B testing infrastructure deployed
- [ ] 100% traffic migrated (gradual rollout)
- [ ] Cost reduced by ≥40% ($350 → <$210/mo)
- [ ] Quality maintained (≥95% user satisfaction)
- [ ] P95 latency <200ms

**Specific Metrics:**
- Monthly cost: <$210 (target: $185)
- Fallback rate: <5%
- User satisfaction: ≥95%
- p95 latency: <200ms
- Error rate: <0.5%

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Quality degradation | HIGH | MEDIUM | Hybrid architecture, A/B test, user feedback |
| Cost overruns | HIGH | LOW | Hard limits, budget alerts, monitoring dashboard |
| Cloudflare outage | MEDIUM | LOW | Automatic OpenAI fallback, 99.9% uptime SLA |
| Migration bugs | MEDIUM | MEDIUM | Phased rollout, comprehensive testing |
| User complaints | MEDIUM | LOW | Premium option for GPT-4, fallback to OpenAI |

---

## Security Considerations

**API Keys:**
- Cloudflare token in .env (NOT code)
- Separate dev/staging/prod tokens
- Rotate quarterly

**Rate Limiting:**
- Same limits as OpenAI (100 req/day free tier)
- Cloudflare has built-in rate limiting

**Data Privacy:**
- Same as OpenAI (data sent to third-party)
- Review Cloudflare privacy policy
- Update user terms if needed

---

## Next Steps

**After Migration Complete:**
→ Proceed to Phase 5 (Mega-Prompt Creation)
→ Monitor cost savings weekly
→ Optimize prompts for Llama 3.1 (if quality gaps)
→ Consider AutoRAG for v2 (if budget allows)

**Ongoing Monitoring:**
- Daily cost reports
- Weekly quality metrics
- Monthly user satisfaction surveys
- Quarterly provider comparison

---

## Unresolved Questions

1. AutoRAG vs custom RAG decision?
   - **Current:** Custom RAG (pgvector) for cost
   - **Future:** Revisit AutoRAG if costs drop or quality improves

2. When to offer GPT-4 to paid users?
   - **Immediate:** Make available as premium upgrade
   - **Price:** +$10/mo for GPT-4 access

3. Fallback threshold?
   - **Target:** <5% fallback rate
   - **Action:** If >10%, investigate Cloudflare issues

4. Embedding model quality?
   - **Test:** Compare bge-m3 vs OpenAI embeddings
   - **Measure:** RAG retrieval accuracy

---

## References

- Cloudflare AI: https://developers.cloudflare.com/workers-ai/
- Llama 3.1 docs: https://ai.meta.com/llama/
- Research: [researcher-02-workers-ai.md](./research/researcher-02-workers-ai.md)
- Cost analysis: [researcher-01-autorag.md](./research/researcher-01-autorag.md)
