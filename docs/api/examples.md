# API Examples

This document provides working examples for all major API endpoints in multiple programming languages.

**Base URL**: `https://api.yourdomain.com/api`

**Authentication**: Most endpoints require a Bearer token from the `/auth/signin` endpoint.

---

## Table of Contents

- [Authentication](#authentication)
- [Chat](#chat)
- [Billing](#billing)
- [Analytics](#analytics)

---

## Authentication

### Sign Up

Create a new user account.

#### cURL
```bash
curl -X POST https://api.yourdomain.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

#### JavaScript (fetch)
```javascript
const response = await fetch('https://api.yourdomain.com/api/auth/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!'
  }),
  credentials: 'include' // Include cookies
});

const data = await response.json();
console.log('User created:', data.user);
```

#### JavaScript (axios)
```javascript
import axios from 'axios';

const response = await axios.post(
  'https://api.yourdomain.com/api/auth/signup',
  {
    email: 'user@example.com',
    password: 'SecurePass123!'
  },
  {
    withCredentials: true // Include cookies
  }
);

console.log('User created:', response.data.user);
```

#### Python
```python
import requests
import json

response = requests.post(
    'https://api.yourdomain.com/api/auth/signup',
    headers={
        'Content-Type': 'application/json'
    },
    json={
        'email': 'user@example.com',
        'password': 'SecurePass123!'
    }
)

data = response.json()
print('User created:', data['user'])
```

#### Python (async)
```python
import aiohttp
import asyncio

async def signup():
    async with aiohttp.ClientSession() as session:
        response = await session.post(
            'https://api.yourdomain.com/api/auth/signup',
            json={
                'email': 'user@example.com',
                'password': 'SecurePass123!'
            }
        )
        data = await response.json()
        print('User created:', data['user'])

asyncio.run(signup())
```

#### Go
```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

func main() {
    payload := map[string]string{
        "email":    "user@example.com",
        "password": "SecurePass123!",
    }

    jsonData, _ := json.Marshal(payload)

    resp, err := http.Post(
        "https://api.yourdomain.com/api/auth/signup",
        "application/json",
        bytes.NewBuffer(jsonData),
    )

    if err != nil {
        panic(err)
    }

    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)

    var result map[string]interface{}
    json.Unmarshal(body, &result)
    fmt.Println("User created:", result["user"])
}
```

#### Node.js
```javascript
import http from 'http';

const data = JSON.stringify({
  email: 'user@example.com',
  password: 'SecurePass123!'
});

const options = {
  hostname: 'api.yourdomain.com',
  port: 443,
  path: '/api/auth/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    const data = JSON.parse(body);
    console.log('User created:', data.user);
  });
});

req.write(data);
req.end();
```

---

### Sign In

Authenticate and receive session token.

#### cURL
```bash
curl -X POST https://api.yourdomain.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

#### JavaScript (fetch)
```javascript
const response = await fetch('https://api.yourdomain.com/api/auth/signin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!'
  }),
  credentials: 'include'
});

const data = await response.json();
console.log('Logged in:', data.user);
// Session cookie is automatically stored
```

#### Python
```python
import requests

session = requests.Session()

response = session.post(
    'https://api.yourdomain.com/api/auth/signin',
    json={
        'email': 'user@example.com',
        'password': 'SecurePass123!'
    }
)

data = response.json()
print('Logged in:', data['user'])
# Cookies are automatically stored in session
```

---

### Get Current User

Retrieve authenticated user's profile.

#### cURL
```bash
curl -X GET https://api.yourdomain.com/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -b cookies.txt
```

#### JavaScript (fetch)
```javascript
const response = await fetch('https://api.yourdomain.com/api/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  credentials: 'include'
});

const data = await response.json();
console.log('Current user:', data.user);
```

#### Python
```python
import requests

response = requests.get(
    'https://api.yourdomain.com/api/auth/me',
    headers={
        'Authorization': f'Bearer {token}'
    }
)

data = response.json()
print('Current user:', data['user'])
```

---

## Chat

### Send Message

Send a message to AI and get response.

#### cURL
```bash
curl -X POST https://api.yourdomain.com/api/chat/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "content": "Explain quantum computing",
    "model": "gpt-4",
    "conversationId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

#### JavaScript (fetch)
```javascript
async function sendMessage(content, model = 'gpt-4', conversationId = null) {
  const payload = {
    content: content,
    model: model
  };

  if (conversationId) {
    payload.conversationId = conversationId;
  }

  const response = await fetch('https://api.yourdomain.com/api/chat/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload),
    credentials: 'include'
  });

  const data = await response.json();
  return data.data;
}

// Usage
const result = await sendMessage('Explain quantum computing', 'gpt-4');
console.log('Response:', result.content);
console.log('Tokens used:', result.tokenCount);
```

#### JavaScript (axios)
```javascript
import axios from 'axios';

const client = axios.create({
  baseURL: 'https://api.yourdomain.com/api',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  withCredentials: true
});

const response = await client.post('/chat/chat', {
  content: 'Explain quantum computing',
  model: 'gpt-4'
});

console.log('Response:', response.data.data);
```

#### Python
```python
import requests

def send_message(token, content, model='gpt-4', conversation_id=None):
    payload = {
        'content': content,
        'model': model
    }

    if conversation_id:
        payload['conversationId'] = conversation_id

    response = requests.post(
        'https://api.yourdomain.com/api/chat/chat',
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        },
        json=payload
    )

    return response.json()['data']

# Usage
result = send_message(token, 'Explain quantum computing', 'gpt-4')
print('Response:', result['content'])
print('Tokens used:', result['tokenCount'])
```

#### Python (async)
```python
import aiohttp

async def send_message(token, content, model='gpt-4'):
    async with aiohttp.ClientSession() as session:
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

        payload = {
            'content': content,
            'model': model
        }

        async with session.post(
            'https://api.yourdomain.com/api/chat/chat',
            headers=headers,
            json=payload
        ) as resp:
            data = await resp.json()
            return data['data']
```

---

### Get Conversations

List all user conversations.

#### cURL
```bash
curl -X GET "https://api.yourdomain.com/api/chat/conversations?limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### JavaScript
```javascript
async function getConversations(token, limit = 50, offset = 0) {
  const response = await fetch(
    `https://api.yourdomain.com/api/chat/conversations?limit=${limit}&offset=${offset}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    }
  );

  return response.json();
}

// Usage
const { data, total } = await getConversations(token);
console.log(`Found ${total} conversations`);
```

#### Python
```python
def get_conversations(token, limit=50, offset=0):
    response = requests.get(
        'https://api.yourdomain.com/api/chat/conversations',
        headers={'Authorization': f'Bearer {token}'},
        params={'limit': limit, 'offset': offset}
    )
    return response.json()
```

---

### Get Token Usage

Get current month's token usage.

#### cURL
```bash
curl -X GET https://api.yourdomain.com/api/chat/usage \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### JavaScript
```javascript
async function getUsage(token) {
  const response = await fetch('https://api.yourdomain.com/api/chat/usage', {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include'
  });

  const { data } = await response.json();
  return data;
}

// Usage
const usage = await getUsage(token);
console.log(`Used ${usage.monthlyUsed} of ${usage.monthlyQuota} tokens`);
console.log(`${usage.percentageUsed}% used`);
```

---

## Billing

### Get Available Plans

List all subscription plans.

#### cURL
```bash
curl -X GET https://api.yourdomain.com/api/billing/plans
```

#### JavaScript
```javascript
async function getPlans() {
  const response = await fetch('https://api.yourdomain.com/api/billing/plans');
  const { data } = await response.json();
  return data;
}

// Usage
const plans = await getPlans();
plans.forEach(plan => {
  console.log(`${plan.name}: $${plan.price}/${plan.interval}`);
});
```

---

### Create Subscription

Subscribe to a paid plan.

#### cURL
```bash
curl -X POST https://api.yourdomain.com/api/billing/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "planTier": "PRO",
    "paymentMethodId": "pm_1234567890"
  }'
```

#### JavaScript
```javascript
async function subscribe(token, planTier, paymentMethodId) {
  const response = await fetch('https://api.yourdomain.com/api/billing/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      planTier: planTier,
      paymentMethodId: paymentMethodId
    }),
    credentials: 'include'
  });

  return response.json();
}

// Usage
const result = await subscribe(token, 'PRO', 'pm_1234567890');
console.log('Subscription created:', result.data);
```

#### Python
```python
def subscribe(token, plan_tier, payment_method_id):
    response = requests.post(
        'https://api.yourdomain.com/api/billing/subscribe',
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        },
        json={
            'planTier': plan_tier,
            'paymentMethodId': payment_method_id
        }
    )
    return response.json()['data']
```

---

### Get Subscription

Retrieve current subscription details.

#### cURL
```bash
curl -X GET https://api.yourdomain.com/api/billing/subscription \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### JavaScript
```javascript
async function getSubscription(token) {
  const response = await fetch('https://api.yourdomain.com/api/billing/subscription', {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include'
  });

  return response.json();
}
```

---

### Cancel Subscription

Cancel active subscription.

#### cURL
```bash
curl -X POST https://api.yourdomain.com/api/billing/cancel \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### JavaScript
```javascript
async function cancelSubscription(token) {
  const response = await fetch('https://api.yourdomain.com/api/billing/cancel', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include'
  });

  return response.json();
}
```

---

## Analytics

### Get User Count

Get total user count by plan tier (Admin only).

#### cURL
```bash
curl -X GET https://api.yourdomain.com/api/analytics/users/count \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### JavaScript
```javascript
async function getUserCount(token) {
  const response = await fetch('https://api.yourdomain.com/api/analytics/users/count', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const { data } = await response.json();
  return data;
}

// Usage
const counts = await getUserCount(adminToken);
console.log(`Free: ${counts.free}, Plus: ${counts.plus}, Pro: ${counts.pro}`);
```

---

### Get Revenue Metrics

Get total revenue and MRR (Admin only).

#### cURL
```bash
curl -X GET https://api.yourdomain.com/api/analytics/revenue/total \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### cURL (MRR)
```bash
curl -X GET https://api.yourdomain.com/api/analytics/revenue/mrr \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### JavaScript
```javascript
async function getRevenueMetrics(token) {
  const [totalResponse, mrrResponse] = await Promise.all([
    fetch('https://api.yourdomain.com/api/analytics/revenue/total', {
      headers: { 'Authorization': `Bearer ${token}` }
    }),
    fetch('https://api.yourdomain.com/api/analytics/revenue/mrr', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
  ]);

  const total = await totalResponse.json();
  const mrr = await mrrResponse.json();

  return {
    totalRevenue: total.data.totalRevenue,
    mrr: mrr.data.mrr,
    mrrGrowth: mrr.data.growth
  };
}
```

---

## Error Handling

All endpoints return consistent error responses:

#### Error Response Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional details if applicable"
    }
  }
}
```

#### Common Error Codes
- `VALIDATION_ERROR` - Request validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_SERVER_ERROR` - Server error

#### Handling Errors in JavaScript
```javascript
async function sendMessage(token, content) {
  try {
    const response = await fetch('https://api.yourdomain.com/api/chat/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`${error.error.code}: ${error.error.message}`);
    }

    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    // Handle error appropriately
  }
}
```

#### Handling Errors in Python
```python
import requests

def send_message(token, content):
    try:
        response = requests.post(
            'https://api.yourdomain.com/api/chat/chat',
            headers={'Authorization': f'Bearer {token}'},
            json={'content': content}
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        error_data = e.response.json()
        print(f"Error: {error_data['error']['code']}")
        print(f"Message: {error_data['error']['message']}")
```

---

## Rate Limiting

All endpoints implement rate limiting. When rate limited, the API returns a 429 status code:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 60 seconds"
  }
}
```

### Rate Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/signup` | 5 | per hour |
| `/auth/signin` | 10 | per 15 minutes |
| `/auth/forgot-password` | 3 | per hour |
| `/chat/chat` | 100 | per minute |
| `/chat/conversations` | 60 | per minute |

#### Respecting Rate Limits in Code

JavaScript (with retry):
```javascript
async function makeRequestWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      console.log(`Rate limited. Retrying in ${retryAfter}s`);
      await new Promise(r => setTimeout(r, retryAfter * 1000));
      continue;
    }

    return response;
  }
  throw new Error('Max retries exceeded');
}
```

---

## Testing Your Integration

### Quick Test Script (Node.js)
```bash
# Set environment variables
export API_URL="https://api.yourdomain.com/api"
export EMAIL="test@example.com"
export PASSWORD="TestPass123!"

# Run test script
node test-api.js
```

```javascript
// test-api.js
const fetch = require('node-fetch');

const API_URL = process.env.API_URL;
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;

async function test() {
  try {
    // 1. Sign up
    console.log('1. Testing signup...');
    let response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD })
    });
    let data = await response.json();
    console.log('✓ Signup successful');

    // 2. Sign in
    console.log('2. Testing signin...');
    response = await fetch(`${API_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD })
    });
    data = await response.json();
    const token = data.user.token;
    console.log('✓ Signin successful');

    // 3. Send chat message
    console.log('3. Testing chat...');
    response = await fetch(`${API_URL}/chat/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        content: 'Hello, how are you?',
        model: 'gpt-4'
      })
    });
    data = await response.json();
    console.log('✓ Chat message sent');

    console.log('\n✓ All tests passed!');
  } catch (error) {
    console.error('✗ Test failed:', error);
  }
}

test();
```

---

## Additional Resources

- **API Reference**: See `openapi.yaml` for complete specification
- **Architecture Guide**: See `docs/architecture/SYSTEM_ARCHITECTURE.md`
- **Getting Started**: See `docs/guides/GETTING_STARTED.md`
- **Troubleshooting**: See `docs/guides/TROUBLESHOOTING.md`
