# API Examples - Orchestrator Service

## Base URL

```
http://localhost:3006
```

---

## 1. Upgrade Prompt (Full Pipeline)

**Endpoint:** `POST /api/upgrade`

### Request Body

```json
{
  "userPrompt": "Help me write a blog post",
  "conversationHistory": [
    {
      "role": "user",
      "content": "I'm working on a tech blog"
    },
    {
      "role": "assistant",
      "content": "That's great! What topics are you interested in?"
    }
  ],
  "userId": "user_123",
  "conversationId": "conv_456",
  "options": {
    "enableSummarization": true,
    "enableRAG": true,
    "enablePIIRedaction": true,
    "ragTopK": 5,
    "ragMinScore": 0.7
  }
}
```

### Response

```json
{
  "success": true,
  "data": {
    "upgradedPrompt": "ROLE: You are a professional tech blog writer...\n\nTASK: Create a compelling blog post...\n\nCONTEXT: User is working on a tech blog...\n\nCONSTRAINTS: ...\n\nFORMAT: ...",
    "originalPrompt": "Help me write a blog post",
    "summary": "User is working on a tech blog and interested in various topics.",
    "ragDocuments": [
      {
        "id": "doc_1",
        "content": "Best practices for tech blogging...",
        "score": 0.89,
        "metadata": {}
      }
    ],
    "piiRedacted": false,
    "metrics": {
      "totalLatencyMs": 1250,
      "summaryLatencyMs": 450,
      "ragLatencyMs": 350,
      "upgradeLatencyMs": 420,
      "totalTokensUsed": 850,
      "summaryTokens": 250,
      "ragTokens": 100,
      "upgradeTokens": 500
    },
    "confidence": 0.92,
    "reasoning": "Added structure and context from conversation history and knowledge base",
    "missingQuestions": []
  }
}
```

---

## 2. Simple Upgrade (Minimal Options)

```bash
curl -X POST http://localhost:3006/api/upgrade \
  -H "Content-Type: application/json" \
  -d '{
    "userPrompt": "Explain quantum computing"
  }'
```

---

## 3. With PII Redaction

```bash
curl -X POST http://localhost:3006/api/upgrade \
  -H "Content-Type: application/json" \
  -d '{
    "userPrompt": "Send invoice to john@example.com and call me at 555-1234",
    "options": {
      "enablePIIRedaction": true
    }
  }'
```

### Response (PII will be redacted and restored)

```json
{
  "success": true,
  "data": {
    "upgradedPrompt": "ROLE: Professional assistant\nTASK: Send invoice to john@example.com and call at 555-1234",
    "originalPrompt": "Send invoice to john@example.com and call me at 555-1234",
    "piiRedacted": true,
    "confidence": 0.85,
    "reasoning": "Structured task with contact information",
    "missingQuestions": ["Who should the invoice be addressed to?"]
  }
}
```

---

## 4. Health Checks

### Basic Health

```bash
curl http://localhost:3006/health
```

### Database Health

```bash
curl http://localhost:3006/health/db
```

### All Services

```bash
curl http://localhost:3006/health/all
```

---

## 5. Error Responses

### Invalid Request

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PROMPT",
    "message": "userPrompt is required and must be a string"
  }
}
```

### Server Error

```json
{
  "success": false,
  "error": {
    "code": "ORCHESTRATION_FAILED",
    "message": "Failed to connect to OpenAI API"
  }
}
```

---

## 6. Integration Example (Node.js)

```javascript
const axios = require('axios');

async function upgradePrompt(userPrompt, conversationHistory = []) {
  try {
    const response = await axios.post('http://localhost:3006/api/upgrade', {
      userPrompt,
      conversationHistory,
      options: {
        enableSummarization: true,
        enableRAG: true,
        enablePIIRedaction: true,
      },
    });

    const { upgradedPrompt, confidence, metrics } = response.data.data;

    console.log('Upgraded Prompt:', upgradedPrompt);
    console.log('Confidence:', confidence);
    console.log('Total Latency:', metrics.totalLatencyMs, 'ms');
    console.log('Tokens Used:', metrics.totalTokensUsed);

    return upgradedPrompt;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
upgradePrompt('Help me code a website', [
  { role: 'user', content: 'I want to build an e-commerce site' },
  { role: 'assistant', content: 'Great! What platform do you prefer?' },
]);
```

---

## 7. Stats Endpoint

```bash
curl http://localhost:3006/api/stats
```

### Response

```json
{
  "success": true,
  "data": {
    "message": "Stats endpoint - coming soon in Phase 6"
  }
}
```

---

## Notes

- All timestamps are in milliseconds
- Confidence scores range from 0.0 to 1.0
- RAG scores range from 0.0 to 1.0 (cosine similarity)
- Token counts are approximate for batch operations
- PII redaction is automatic but can be disabled via options
