# Free Alerting Setup Guide

## Overview
Get **FREE** real-time alerts via Discord or Telegram webhooks - no paid monitoring service needed!

**Cost**: $0/month (completely free!)

---

## Setup Discord Webhook (Recommended)

### 1. Create Discord Server (if needed)
1. Open Discord → Click "+" → "Create My Own" → "For me and my friends"
2. Name it "Firbox Monitoring"

### 2. Create Webhook
1. Server Settings → Integrations → Webhooks
2. Click "New Webhook"
3. Name: "Firbox Alerts"
4. Select channel: #alerts (create if needed)
5. Click "Copy Webhook URL"

### 3. Add to Environment Variables
```bash
# .env.local or Azure App Settings
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/123456789/abcdefg...
```

### 4. Test Alert
```bash
npm run monitor:health
```

Or via API:
```bash
curl -X GET https://www.firbox.net/api/monitoring/alerts
```

✅ You should see a test message in Discord!

---

## Setup Telegram Bot (Alternative)

### 1. Create Bot
1. Open Telegram → Search for "@BotFather"
2. Send `/newbot`
3. Follow prompts to name your bot
4. Copy the **Bot Token**: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`

### 2. Get Chat ID
1. Search for your bot in Telegram
2. Send `/start` to your bot
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Find `"chat":{"id":123456789}` in the response

### 3. Add to Environment Variables
```bash
# .env.local or Azure App Settings
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

### 4. Test Alert
```bash
npm run monitor:health
```

✅ You should see a test message in Telegram!

---

## Alert Types

### Critical Alerts 🚨
- Database connection failed
- Redis connection failed
- Error rate > 5%
- Account lockout threshold exceeded

### Warning Alerts ⚠️
- Slow API response (>2000ms)
- Slow database query (>100ms)
- Memory usage high (>80%)

### Info Alerts ℹ️
- New user signup
- Successful payment
- System health check passed

### Error Alerts ❌
- Payment processing failed
- Email sending failed
- File upload failed

---

## Automated Health Monitoring

### Setup Cron Job (Every 5 Minutes)
```bash
crontab -e
```

Add this line:
```bash
*/5 * * * * cd /path/to/firbox && npm run monitor:health >> logs/monitor.log 2>&1
```

### Or Use Azure Functions (Recommended for Production)
Create a Timer Trigger Function:
```javascript
// function.json
{
  "bindings": [{
    "name": "myTimer",
    "type": "timerTrigger",
    "direction": "in",
    "schedule": "0 */5 * * * *"
  }]
}

// index.js
const { checkHealth, analyzeAndAlert } = require('./monitor-health')

module.exports = async function (context) {
  const result = await checkHealth()
  await analyzeAndAlert(result)
}
```

**Cost**: FREE (1M executions/month on Azure Functions free tier)

---

## Custom Alerts

### From Your Code
```typescript
import { sendAlert, AlertTemplates } from '@/scripts/free-alerting-webhook'

// Use pre-built templates
await sendAlert(AlertTemplates.newSignup('user@example.com'))
await sendAlert(AlertTemplates.paymentFailed(userId, amount, error))

// Or create custom alerts
await sendAlert({
  title: '🎯 Custom Event',
  message: 'Something important happened!',
  level: 'info', // info | warning | error | critical
  tags: ['custom', 'event'],
  metadata: {
    key1: 'value1',
    key2: 'value2',
  },
})
```

### Via API
```bash
curl -X POST https://www.firbox.net/api/monitoring/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Custom Alert",
    "message": "Test message",
    "level": "info",
    "tags": ["test"],
    "metadata": {"source": "api"}
  }'
```

---

## Alert Examples

### Database Issues
```typescript
import { sendAlert, AlertTemplates } from '@/scripts/free-alerting-webhook'

// Automatic template
await sendAlert(AlertTemplates.databaseDown())

// Custom database alert
await sendAlert({
  title: '⚠️ Database Slow Query',
  message: `Query took ${queryTime}ms to execute`,
  level: 'warning',
  tags: ['database', 'performance'],
  metadata: {
    query: 'SELECT * FROM users WHERE...',
    time: `${queryTime}ms`,
  },
})
```

### Payment Events
```typescript
// Payment failed
await sendAlert(AlertTemplates.paymentFailed(userId, 50000, 'Insufficient funds'))

// Payment succeeded
await sendAlert({
  title: '💰 Payment Received',
  message: `User ${userId} paid ${amount} VND`,
  level: 'info',
  tags: ['payment', 'revenue'],
  metadata: { userId, amount: `${amount} VND`, plan: 'PRO' },
})
```

### User Activity
```typescript
// New signup
await sendAlert(AlertTemplates.newSignup('newuser@example.com'))

// User upgraded plan
await sendAlert({
  title: '🚀 Plan Upgrade',
  message: `User upgraded to ${newPlan}`,
  level: 'info',
  tags: ['signup', 'revenue'],
  metadata: { userId, oldPlan, newPlan },
})
```

---

## Alert Frequency Management

### Prevent Spam (Rate Limiting)
```typescript
import { upstash as redis } from '@/lib/redis'

async function sendAlertWithRateLimit(alert: AlertOptions) {
  const key = `alert:${alert.title}:sent`
  const sent = await redis.get(key)

  if (sent) {
    console.log('Alert already sent recently, skipping...')
    return
  }

  await sendAlert(alert)
  await redis.setex(key, 300, '1') // Don't send same alert for 5 minutes
}
```

### Alert Aggregation
```typescript
// Aggregate similar alerts
const errors: string[] = []

// Collect errors over 1 minute
errors.push(error1, error2, error3)

// Send single aggregated alert
await sendAlert({
  title: `❌ ${errors.length} Errors Detected`,
  message: 'Multiple errors occurred in the last minute',
  level: 'error',
  tags: ['errors', 'aggregated'],
  metadata: {
    count: errors.length,
    errors: errors.slice(0, 5).join(', '), // First 5 errors
  },
})
```

---

## Integration with Existing Code

### Auth Endpoints
```typescript
// src/app/api/auth/signin/route.ts
if (lockStatus.locked) {
  await sendAlert({
    title: '🔒 Account Lockout',
    message: `Account ${email} locked after ${MAX_ATTEMPTS} failed attempts`,
    level: 'warning',
    tags: ['security', 'auth'],
    metadata: { email, attempts: MAX_ATTEMPTS },
  })
}
```

### Payment Processing
```typescript
// src/lib/payment/processor.ts
try {
  const result = await processPayment(...)
  // Success - no alert needed, or send info alert
} catch (error) {
  await sendAlert(AlertTemplates.paymentFailed(userId, amount, error.message))
  throw error
}
```

### Health Check
```typescript
// src/app/api/health/route.ts
if (!dbOk) {
  await sendAlert(AlertTemplates.databaseDown())
}

if (dbResponseTime > 100) {
  await sendAlert(AlertTemplates.slowResponse('/api/health', dbResponseTime))
}
```

---

## Best Practices

### 1. Use Appropriate Alert Levels
- **Critical**: System down, data loss, security breach
- **Error**: Failed operations that need attention
- **Warning**: Performance degradation, approaching limits
- **Info**: Normal events worth tracking (signups, payments)

### 2. Add Context with Metadata
Always include relevant details:
```typescript
metadata: {
  userId: '123',
  endpoint: '/api/payment',
  responseTime: '1500ms',
  errorCode: 'PAYMENT_FAILED',
}
```

### 3. Use Tags for Filtering
```typescript
tags: ['database', 'performance', 'critical']
```

Then filter in Discord/Telegram using search.

### 4. Avoid Alert Fatigue
- Don't alert on expected errors (user typos, etc.)
- Aggregate similar alerts
- Use rate limiting
- Only alert on actionable items

### 5. Test Alerts Regularly
```bash
# Send test alert
npm run monitor:health

# Or manually
curl -X GET https://www.firbox.net/api/monitoring/alerts
```

---

## Troubleshooting

### Discord webhook not working
1. Check webhook URL is correct in .env
2. Verify webhook still exists in Discord (not deleted)
3. Check Discord server permissions
4. Test with curl:
```bash
curl -X POST "https://discord.com/api/webhooks/YOUR_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test message"}'
```

### Telegram bot not sending
1. Verify bot token is correct
2. Make sure you've sent `/start` to the bot
3. Check chat ID is correct (must be a number)
4. Test bot:
```bash
curl "https://api.telegram.org/bot<TOKEN>/getMe"
```

### Alerts not firing
1. Check environment variables are set
2. Verify code is calling sendAlert()
3. Check logs for errors
4. Test manually via API

---

## Monitoring Dashboard (Optional FREE)

Use Discord or Telegram as a simple monitoring dashboard:

1. Create separate channels:
   - #critical (critical alerts only)
   - #errors (error alerts)
   - #warnings (warnings)
   - #info (info alerts)

2. Create multiple webhooks pointing to different channels

3. Route alerts based on level:
```typescript
const webhookUrl = alert.level === 'critical'
  ? process.env.DISCORD_CRITICAL_WEBHOOK
  : process.env.DISCORD_WEBHOOK
```

**Result**: Free monitoring dashboard in Discord/Telegram!

---

## Related Files
- `scripts/free-alerting-webhook.ts` - Alert sending logic
- `scripts/monitor-health.ts` - Automated health monitoring
- `src/app/api/monitoring/alerts/route.ts` - Alert API endpoint
- `.env.local` - Environment variables

---

## Cost Comparison

| Service | Cost/Month | Limitations |
|---------|------------|-------------|
| **Discord/Telegram Webhooks** | **$0** | None for normal use |
| PagerDuty | $21+ per user | 10 services on free tier |
| Datadog | $15+ per host | Limited retention |
| Sentry | $26+ per project | Limited events |
| New Relic | $99+ | Limited users |

**Savings**: $240-1200/year by using free webhooks! 🎉
