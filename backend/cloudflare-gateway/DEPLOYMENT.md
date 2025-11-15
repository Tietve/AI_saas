# Cloudflare Workers Gateway - Deployment Guide

> **Quick Deploy:** Production-ready in 15 minutes

---

## 🚀 Prerequisites

- [x] Cloudflare account (free tier OK)
- [x] Wrangler CLI installed (`npm install -g wrangler`)
- [x] Backend services running (auth, chat, billing)
- [x] Domain (optional, can use workers.dev subdomain)

---

## ⚡ Quick Start (15 minutes)

### 1. Install Dependencies (2 min)

```bash
cd backend/cloudflare-gateway
npm install
```

### 2. Cloudflare Login (1 min)

```bash
wrangler login
wrangler whoami  # Verify
```

### 3. Create Resources (5 min)

```bash
# KV namespace (caching, rate limiting)
wrangler kv:namespace create KV
wrangler kv:namespace create KV --preview

# D1 database (analytics)
wrangler d1 create my-saas-chat-db

# Vectorize index (RAG)
wrangler vectorize create document-vectors --dimensions=768 --metric=cosine
```

**Copy the output IDs to `wrangler.toml`!**

### 4. Update Configuration (3 min)

Edit `wrangler.toml`:

```toml
account_id = "your_account_id_here"  # From Cloudflare dashboard

[[kv_namespaces]]
binding = "KV"
id = "your_kv_id_here"
preview_id = "your_preview_kv_id_here"

[[d1_databases]]
binding = "DB"
database_name = "my-saas-chat-db"
database_id = "your_d1_id_here"

[[vectorize]]
binding = "VECTORIZE"
index_name = "document-vectors"

# Production backend URLs
[env.production]
vars = {
  ENVIRONMENT = "production",
  AUTH_SERVICE_URL = "https://auth.yourdomain.com",
  CHAT_SERVICE_URL = "https://chat.yourdomain.com",
  BILLING_SERVICE_URL = "https://billing.yourdomain.com"
}
```

### 5. Set Secrets (2 min)

```bash
# JWT secret (MUST match backend!)
wrangler secret put JWT_SECRET
# Enter your backend JWT secret

# OpenAI API key (for complex queries)
wrangler secret put OPENAI_API_KEY
# Enter: sk-...

# Stripe webhook secret
wrangler secret put STRIPE_WEBHOOK_SECRET
# Enter: whsec_...
```

### 6. Run Migrations (1 min)

```bash
# Apply D1 database schema
wrangler d1 migrations apply my-saas-chat-db --remote
```

### 7. Deploy! (1 min)

```bash
# Deploy to production
wrangler deploy --env production
```

**Output:**
```
Published my-saas-chat-gateway
  https://my-saas-chat-gateway.your-subdomain.workers.dev
```

**Done!** 🎉

---

## 🧪 Testing

### Test Health Endpoint

```bash
curl https://my-saas-chat-gateway.your-subdomain.workers.dev/health
```

**Expected:**
```json
{
  "status": "healthy",
  "edge": "SFO",
  "environment": "production"
}
```

### Test Auth (with backend token)

```bash
# Get token from backend login
TOKEN="your_jwt_token_here"

curl https://my-saas-chat-gateway.your-subdomain.workers.dev/api/auth/verify \
  -H "Authorization: Bearer $TOKEN"
```

### Test FREE Embeddings

```bash
curl -X POST https://my-saas-chat-gateway.your-subdomain.workers.dev/api/ai/embeddings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, world!"}'
```

**Expected:**
```json
{
  "embedding": [0.123, -0.456, ...],
  "cost": 0,
  "provider": "cloudflare"
}
```

### Test RAG

```bash
# Upload document
curl -X POST https://your-gateway.workers.dev/api/rag/upload \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Cloudflare Workers is a serverless platform...",
    "filename": "cloudflare-intro.txt"
  }'

# Query document
curl -X POST https://your-gateway.workers.dev/api/rag/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is Cloudflare Workers?"
  }'
```

---

## 🌐 Custom Domain Setup

### 1. Add Site to Cloudflare

1. Dashboard → Add site
2. Enter your domain: `yourdomain.com`
3. Follow DNS setup

### 2. Configure Route

Add to `wrangler.toml`:

```toml
[[routes]]
pattern = "api.yourdomain.com/*"
zone_name = "yourdomain.com"
```

### 3. Deploy

```bash
wrangler deploy --env production
```

Your gateway is now at: `https://api.yourdomain.com`

---

## 📊 Monitoring

### View Logs (Real-time)

```bash
wrangler tail --env production
```

### Cloudflare Analytics

1. Dashboard → Workers & Pages
2. Select `my-saas-chat-gateway`
3. View metrics:
   - Requests
   - Errors
   - CPU time
   - Success rate

### D1 Database Queries

```bash
# Check usage
wrangler d1 execute my-saas-chat-db --remote --command="
  SELECT service, COUNT(*) as count, SUM(cost) as total_cost
  FROM usage_tracking
  WHERE date(timestamp) = date('now')
  GROUP BY service
"
```

### Cost Tracking

```bash
# Daily cost summary
wrangler d1 execute my-saas-chat-db --remote --command="
  SELECT * FROM cost_summary
  WHERE date >= date('now', '-7 days')
  ORDER BY date DESC
"
```

---

## 🔧 Troubleshooting

### Workers AI Not Working

**Error:** `Model not found`

**Solution:**
- Verify `[ai]` binding in `wrangler.toml`
- Workers AI is in beta, some regions may have delays
- Try different model: `AI_MODELS.LLAMA_3_8B`

### Vectorize Errors

**Error:** `Index not found`

**Solution:**
```bash
# Re-create index
wrangler vectorize create document-vectors --dimensions=768 --metric=cosine

# Verify
wrangler vectorize list
```

### KV Rate Limiting Not Working

**Error:** Requests not rate limited

**Solution:**
- Check KV namespace binding
- Verify `wrangler.toml` has correct IDs
- Clear KV cache:

```bash
wrangler kv:key delete --binding=KV "rl:*"
```

### CORS Errors

**Error:** `Access-Control-Allow-Origin`

**Solution:**

Update `src/index.ts`:

```typescript
app.use('*', cors({
  origin: ['https://yourdomain.com', 'https://app.yourdomain.com'],
  credentials: true,
}));
```

Redeploy:

```bash
wrangler deploy --env production
```

---

## 🚀 Gradual Rollout Strategy

### Phase 1: Testing (10% traffic)

1. **Deploy to staging:**

```bash
wrangler deploy --env staging
```

2. **Configure 10% traffic split:**

In Cloudflare Dashboard:
- Workers & Pages → my-saas-chat-gateway → Routes
- Add route with 10% traffic weight

3. **Monitor for 24 hours**
- Check error rates
- Verify cost tracking
- Test all endpoints

### Phase 2: Expansion (50% traffic)

If no issues:
- Increase to 50% traffic
- Monitor for 48 hours
- Compare costs with baseline

### Phase 3: Full Rollout (100% traffic)

If metrics look good:
- Switch to 100% Workers gateway
- Decommission old gateway
- **Celebrate $160/month savings!** 🎉

---

## 📈 Performance Optimization

### Enable Caching

Already configured! But to customize:

```typescript
// In routes, adjust cache TTL
await setCachedResponse(c, cacheKey, data, CACHE_TTL.VERY_LONG);
```

### Tune Rate Limits

Edit `src/middleware/rate-limit.ts`:

```typescript
export const RATE_LIMITS = {
  'ai/chat': {
    maxRequests: 200,  // Increase if needed
    windowMs: 3600000,
  },
};
```

### Optimize Complexity Analyzer

Edit `src/routes/ai.ts`:

```typescript
function analyzeComplexity(messages: Message[]) {
  // Tune heuristics based on production data
  const threshold = 750;  // Adjust
  // ...
}
```

---

## 🔒 Security Checklist

- [ ] JWT_SECRET matches backend
- [ ] CORS origins limited to your domains
- [ ] Rate limiting enabled
- [ ] User tier limits enforced
- [ ] Secrets never in `wrangler.toml`
- [ ] `.dev.vars` in `.gitignore`

---

## 💰 Cost Monitoring Alerts

### Set Budget Alerts

Dashboard → Billing → Budget Alerts:

1. **$50/month** - Warning (unlikely with free tier!)
2. **$100/month** - Critical (investigate immediately)

### Email on High Usage

```bash
# Script to check daily costs
wrangler d1 execute my-saas-chat-db --remote --command="
  SELECT SUM(total_cost) as today_cost
  FROM cost_summary
  WHERE date = date('now')
" | mail -s "Daily Gateway Cost" admin@yourdomain.com
```

---

## 🎯 Success Criteria

After deployment, verify:

✅ **Cost Reduction**
- Check actual costs after 1 week
- Target: <$10/month for 1M requests

✅ **Performance**
- Check latency: `wrangler tail` (should be <50ms)
- Global distribution: test from different regions

✅ **Free Tier Usage**
- Query D1 analytics
- Target: 70%+ requests use Workers AI

✅ **Uptime**
- Cloudflare analytics
- Target: 100% (Workers auto-scale)

---

## 📞 Support

**Issues?**

1. Check [Troubleshooting](#troubleshooting)
2. Review Cloudflare docs: https://developers.cloudflare.com/workers/
3. Contact: [support@yourdomain.com]

**Feature Requests:**

Open GitHub issue: https://github.com/Tietve/AI_saas/issues

---

## 🎉 Deployment Complete!

Your Cloudflare Workers Gateway is now live and saving you **$160/month**!

**Next Steps:**
1. Monitor costs for 1 week
2. Tune complexity analyzer based on real data
3. Scale to 100% traffic
4. Enjoy the savings! 💰

---

**Deployed:** 2025-11-15
**Phase:** 2 Complete
**Status:** 🚀 PRODUCTION
