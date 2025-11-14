# 🗂️ CODEBASE INDEX - Smart Navigation

> **Mục đích:** Index chi tiết TOÀN BỘ codebase để Claude tìm file nhanh như RAG
> **Tự động:** File này nên được regenerate khi có thay đổi lớn
> **Cập nhật:** 2025-11-06

---

## 📋 SERVICES OVERVIEW

```
my-saas-chat/backend/services/
├── auth-service          Port 3001 - Authentication & User Management
├── chat-service          Port 3003 - Chat & AI Integration
├── billing-service       Port 3004 - Stripe Billing & Subscriptions
├── analytics-service     Port 3005 - Analytics & Reporting
└── email-worker          Background - Email Queue Processing
```

---

## 🎯 AUTH-SERVICE (Port 3001)

### Controllers
| File | Purpose | Key Functions |
|------|---------|---------------|
| `auth.controller.ts` | Auth operations | register(), login(), logout(), refreshToken() |
| `workspace.controller.ts` | Workspace CRUD | createWorkspace(), getWorkspace(), updateWorkspace() |
| `preferences.controller.ts` | User preferences | getPreferences(), updatePreferences() |

### Services
| File | Purpose | Key Functions |
|------|---------|---------------|
| `auth.service.ts` | Auth business logic | validateCredentials(), generateTokens() |
| `workspace.service.ts` | Workspace logic | - |
| `preferences.service.ts` | Preferences logic | - |
| `queue.service.ts` | Queue management | - |

### Routes
| File | Base Path | Handles |
|------|-----------|---------|
| `auth.routes.ts` | `/api/auth` | Login, register, logout, refresh |
| `workspace.routes.ts` | `/api/workspaces` | Workspace CRUD |
| `preferences.routes.ts` | `/api/preferences` | User preferences |
| `debug.routes.ts` | `/debug` | Debug endpoints |

### Middleware
| File | Purpose |
|------|---------|
| `auth.middleware.ts` | JWT verification, protect routes |

### Database
| File | Contains |
|------|----------|
| `prisma/schema.prisma` | User, Workspace, Preferences models |

### Key Locations
- **Config:** `src/config/`
- **Types:** `src/types/`
- **Utils:** `src/utils/`
- **Tests:** `src/__tests__/`

---

## 💬 CHAT-SERVICE (Port 3003)

### Controllers
| File | Purpose | Key Functions |
|------|---------|---------------|
| `chat.controller.ts` | Chat operations | createChat(), getChats(), sendMessage(), streamChat() |

### Services
| File | Purpose | Key Functions |
|------|---------|---------------|
| `chat.service.ts` | Chat business logic | handleChat(), saveMessage() |
| `openai.service.ts` | OpenAI integration | callOpenAI(), streamResponse() |
| `billing-client.service.ts` | Billing integration | trackUsage(), checkQuota() |

### Routes
| File | Base Path | Handles |
|------|-----------|---------|
| `chat.routes.ts` | `/api/chats` | Chat CRUD, messaging |

### Database
| File | Contains |
|------|----------|
| `prisma/schema.prisma` | Chat, Message, Conversation models |

### Key Features
- **Real-time:** Socket.io integration
- **AI:** OpenAI GPT integration
- **Streaming:** Server-sent events for streaming responses

---

## 💳 BILLING-SERVICE (Port 3004)

### Controllers
| File | Purpose | Key Functions |
|------|---------|---------------|
| `billing.controller.ts` | Billing operations | createSubscription(), cancelSubscription(), webhook() |

### Services
| File | Purpose | Key Functions |
|------|---------|---------------|
| `billing.service.ts` | Billing logic | handleSubscription() |
| `stripe.service.ts` | Stripe integration | createCustomer(), createCheckout() |

### Routes
| File | Base Path | Handles |
|------|-----------|---------|
| `billing.routes.ts` | `/api/billing` | Subscriptions, webhooks |

### Database
| File | Contains |
|------|----------|
| `prisma/schema.prisma` | Subscription, Payment models |

### Key Integrations
- **Stripe:** Payment processing
- **Webhooks:** Stripe webhook handling

---

## 📊 ANALYTICS-SERVICE (Port 3005)

### Controllers
| File | Purpose | Key Functions |
|------|---------|---------------|
| `analytics.controller.ts` | Analytics endpoints | getStats(), getReports() |

### Services
| File | Purpose | Key Functions |
|------|---------|---------------|
| `chat-analytics.service.ts` | Chat metrics | getChatStats(), getUsageMetrics() |
| `user-analytics.service.ts` | User metrics | getUserStats(), getActiveUsers() |
| `revenue-analytics.service.ts` | Revenue metrics | getRevenue(), getMRR() |
| `provider-analytics.service.ts` | Provider metrics | getProviderStats() |

### Routes
| File | Base Path | Handles |
|------|-----------|---------|
| `analytics.routes.ts` | `/api/analytics` | Analytics endpoints |

### Utils
| File | Purpose |
|------|---------|
| `logger.ts` | Logging utility |

---

## 📧 EMAIL-WORKER

### Services
| File | Purpose | Key Functions |
|------|---------|---------------|
| `email.service.ts` | Email sending | sendEmail(), processQueue() |

### Key Features
- **Queue:** Background job processing
- **Templates:** Email templates
- **SMTP:** Email delivery

---

## 🌐 API-GATEWAY (Port 4000)

**Location:** `backend/api-gateway/`

**Main file:** `gateway.js` (Fastify-based API Gateway)

**Actual structure:**
```
backend/api-gateway/
├── gateway.js           # Main gateway server (Fastify)
├── src/
│   ├── config/          # Environment config
│   ├── middleware/      # Logging, rate limiting
│   ├── routes/          # Proxy routes
│   └── tracing/         # Jaeger tracing
├── dist/                # Compiled TypeScript
└── package.json
```

**Features:**
- CORS with credentials
- Rate limiting (100 req/min)
- Security headers (Helmet)
- Request logging (Pino)
- Health check at /health
- Proxies to: auth-service (3001), chat-service (3003), billing-service (3004)

---

## 🔍 QUICK SEARCH PATTERNS

### Tìm Authentication Logic
```
Location: backend/services/auth-service/src/
Files: auth.controller.ts, auth.service.ts, auth.middleware.ts
```

### Tìm Chat/AI Logic
```
Location: backend/services/chat-service/src/
Files: chat.controller.ts, chat.service.ts, openai.service.ts
```

### Tìm Billing/Stripe Logic
```
Location: backend/services/billing-service/src/
Files: billing.controller.ts, billing.service.ts, stripe.service.ts
```

### Tìm Analytics Logic
```
Location: backend/services/analytics-service/src/services/
Files: *-analytics.service.ts
```

### Tìm Database Models
```
Pattern: backend/services/*/prisma/schema.prisma
Services with DB: auth-service, chat-service, billing-service
```

### Tìm Routes
```
Pattern: backend/services/*/src/routes/*.routes.ts
```

### Tìm Controllers
```
Pattern: backend/services/*/src/controllers/*.controller.ts
```

### Tìm Services (Business Logic)
```
Pattern: backend/services/*/src/services/*.service.ts
```

---

## 📚 COMMON TASKS → FILE LOCATIONS

### "Fix login bug"
→ `auth-service/src/controllers/auth.controller.ts`
→ `auth-service/src/services/auth.service.ts`

### "Add new chat feature"
→ `chat-service/src/controllers/chat.controller.ts`
→ `chat-service/src/services/chat.service.ts`

### "Fix OpenAI integration"
→ `chat-service/src/services/openai.service.ts`

### "Update Stripe webhook"
→ `billing-service/src/controllers/billing.controller.ts`
→ Look for webhook() function

### "Add analytics endpoint"
→ `analytics-service/src/controllers/analytics.controller.ts`
→ `analytics-service/src/services/` (choose relevant service)

### "Fix JWT token verification"
→ `auth-service/src/middleware/auth.middleware.ts`

### "Update user model"
→ `auth-service/prisma/schema.prisma`

### "Add email template"
→ `email-worker/src/services/email.service.ts`

---

## 🎯 FUNCTION NAME → LOCATION MAP

### Authentication Functions
- `register()` → auth-service/controllers/auth.controller.ts
- `login()` → auth-service/controllers/auth.controller.ts
- `logout()` → auth-service/controllers/auth.controller.ts
- `refreshToken()` → auth-service/controllers/auth.controller.ts
- `verifyToken()` → auth-service/middleware/auth.middleware.ts

### Chat Functions
- `createChat()` → chat-service/controllers/chat.controller.ts
- `sendMessage()` → chat-service/controllers/chat.controller.ts
- `streamChat()` → chat-service/controllers/chat.controller.ts
- `callOpenAI()` → chat-service/services/openai.service.ts

### Billing Functions
- `createSubscription()` → billing-service/controllers/billing.controller.ts
- `cancelSubscription()` → billing-service/controllers/billing.controller.ts
- `webhook()` → billing-service/controllers/billing.controller.ts
- `createCustomer()` → billing-service/services/stripe.service.ts

### Analytics Functions
- `getChatStats()` → analytics-service/services/chat-analytics.service.ts
- `getUserStats()` → analytics-service/services/user-analytics.service.ts
- `getRevenue()` → analytics-service/services/revenue-analytics.service.ts

---

## 🗄️ DATABASE MODELS QUICK REF

### Auth Service Models
- User (id, email, username, password, workspaceId)
- Workspace (id, name, ownerId)
- Preferences (id, userId, theme, language)

### Chat Service Models
- Chat (id, userId, title, createdAt)
- Message (id, chatId, role, content, tokens)
- Conversation (stores chat history)

### Billing Service Models
- Subscription (id, userId, plan, status, stripeId)
- Payment (id, userId, amount, status)

---

## 📝 PORTS & ENDPOINTS REFERENCE

| Service | Port | Base URL | Health Check |
|---------|------|----------|--------------|
| Auth | 3001 | http://localhost:3001/api | /health |
| Chat | 3003 | http://localhost:3003/api | /health |
| Billing | 3004 | http://localhost:3004/api | /health |
| Analytics | 3005 | http://localhost:3005/api | /health |
| Gateway | 4000 | http://localhost:4000/api | /health |

---

## 🔧 USAGE FOR CLAUDE

### Example Queries → File Locations

**User:** "Fix authentication bug"
**Claude:** Check index → Read `auth-service/src/controllers/auth.controller.ts`

**User:** "Add OpenAI streaming"
**Claude:** Check index → Read `chat-service/src/services/openai.service.ts`

**User:** "Update Stripe webhook handler"
**Claude:** Check index → Read `billing-service/src/controllers/billing.controller.ts`, find webhook()

**User:** "Where is user model?"
**Claude:** Check index → `auth-service/prisma/schema.prisma`

---

## 🔄 MAINTENANCE

### Khi nào regenerate index này?
- ✅ Thêm service mới
- ✅ Thêm controller/service mới
- ✅ Refactor lớn (đổi cấu trúc)
- ✅ Rename files quan trọng

### Command để regenerate (tự động):
```bash
# TODO: Create script to auto-generate this index
npm run generate-index
```

---

## 💡 PRO TIPS

1. **Grep trước, Read sau:**
   ```
   Grep("createSubscription") → Find trong billing-service
   Read(billing.controller.ts) → Đọc chi tiết
   ```

2. **Dùng index để skip search:**
   Thay vì Grep toàn codebase, check index này trước!

3. **Pattern matching:**
   - `**/controllers/*.controller.ts` → All controllers
   - `**/services/*.service.ts` → All services
   - `**/prisma/schema.prisma` → All schemas

4. **Function search:**
   Ctrl+F trong file này để tìm function name → biết location ngay!

---

**🎯 Kết luận:** File này giúp Claude navigate codebase nhanh như có RAG! Nhưng phải update manually khi có thay đổi lớn.
