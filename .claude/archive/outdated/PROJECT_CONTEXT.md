# 📋 MY-SAAS-CHAT PROJECT CONTEXT

> **Mục đích:** File này giúp Claude hiểu nhanh project mà không cần đọc toàn bộ codebase
> **Cập nhật lần cuối:** 2025-11-06

---

## 🏗️ KIẾN TRÚC TỔNG QUAN

### Tech Stack
- **Backend:** Node.js + TypeScript + Express
- **Database:** PostgreSQL (Prisma ORM)
- **Cache:** Redis
- **Auth:** JWT + Refresh Tokens
- **Real-time:** Socket.io
- **Deployment:** Docker + Kubernetes

### Structure
```
my-saas-chat/
├── backend/
│   ├── services/
│   │   ├── auth-service/      # Authentication & Authorization
│   │   ├── user-service/      # User management
│   │   ├── chat-service/      # Chat & messaging
│   │   └── notification-service/
│   └── shared/                # Shared utilities
├── api-gateway/               # API Gateway (routing)
└── frontend/                  # React/Next.js
```

---

## 🎯 SERVICES CHI TIẾT

### 1. Auth Service (Port: 3001)
**Chức năng:**
- User registration & login
- JWT token generation
- Refresh token rotation
- Password reset

**Files quan trọng:**
- `backend/services/auth-service/src/controllers/auth.controller.ts`
- `backend/services/auth-service/src/services/auth.service.ts`
- `backend/services/auth-service/src/middleware/auth.middleware.ts`

**Endpoints:**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

**Known Issues:**
- [ ] Cần thêm rate limiting
- [ ] Email verification chưa hoàn thiện

---

### 2. User Service (Port: 3002)
**Chức năng:**
- User profile management
- User search
- User relationships (friends, blocks)

**Files quan trọng:**
- `backend/services/user-service/src/controllers/user.controller.ts`
- `backend/services/user-service/src/services/user.service.ts`

**Endpoints:**
- `GET /api/users/me`
- `PUT /api/users/profile`
- `GET /api/users/:id`

---

### 3. Chat Service (Port: 3003)
**Chức năng:**
- Real-time messaging (Socket.io)
- Chat room management
- Message history
- File uploads

**Files quan trọng:**
- `backend/services/chat-service/src/controllers/chat.controller.ts`
- `backend/services/chat-service/src/sockets/chat.socket.ts`

**Endpoints:**
- `POST /api/chats` - Create chat
- `GET /api/chats/:id/messages` - Get messages
- `POST /api/messages` - Send message

**Socket Events:**
- `message:send`
- `message:receive`
- `typing:start`
- `typing:stop`

---

### 4. API Gateway (Port: 3000)
**Chức năng:**
- Route requests to services
- Load balancing
- Request validation
- Rate limiting (TODO)

---

## 🗄️ DATABASE SCHEMA

### User Table
```typescript
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  username  String   @unique
  password  String   // bcrypt hashed
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Chat Table
```typescript
model Chat {
  id          String   @id @default(uuid())
  type        String   // 'direct' | 'group'
  participants User[]
  messages    Message[]
  createdAt   DateTime @default(now())
}
```

### Message Table
```typescript
model Message {
  id        String   @id @default(uuid())
  chatId    String
  senderId  String
  content   String
  createdAt DateTime @default(now())
}
```

---

## 🔐 AUTHENTICATION FLOW

1. User login → Auth Service generates JWT + Refresh Token
2. JWT stored in memory (short-lived: 15min)
3. Refresh Token stored in HTTP-only cookie (long-lived: 7 days)
4. All requests include JWT in Authorization header
5. API Gateway validates JWT before routing
6. Expired JWT → Use refresh token to get new JWT

---

## 🚀 COMMON TASKS

### Start Development
```bash
cd backend
npm run dev:all  # Start all services
```

### Run Tests
```bash
npm test
```

### Database Migration
```bash
npx prisma migrate dev
```

### Check Running Services
```bash
docker ps
```

---

## ⚠️ KNOWN ISSUES & TODO

### High Priority
- [ ] Add rate limiting to API Gateway
- [ ] Implement proper error handling across all services
- [ ] Add request validation middleware
- [ ] Setup proper logging (Winston)

### Medium Priority
- [ ] Add integration tests
- [ ] Setup CI/CD pipeline
- [ ] Add API documentation (Swagger)
- [ ] Implement caching with Redis

### Low Priority
- [ ] Add performance monitoring
- [ ] Setup Sentry for error tracking

---

## 🔧 ENVIRONMENT VARIABLES

### Required for all services:
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
```

### Service-specific:
```env
# Auth Service
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...

# Chat Service
SOCKET_IO_PORT=3003
```

---

## 📝 CODING CONVENTIONS

### File Naming
- Controllers: `*.controller.ts`
- Services: `*.service.ts`
- Middleware: `*.middleware.ts`
- Types: `*.types.ts`

### Error Handling
```typescript
// Use custom error classes
throw new BadRequestError('Invalid input');
throw new UnauthorizedError('Invalid token');
```

### API Response Format
```typescript
// Success
{ success: true, data: {...} }

// Error
{ success: false, error: { message: '...', code: 'ERR_CODE' } }
```

---

## 🎓 TIPS FOR CLAUDE

### When debugging:
1. Check service logs first
2. Verify database connection
3. Check Redis connection
4. Verify JWT token validity
5. Check CORS settings

### When adding features:
1. Update this context file
2. Add tests
3. Update API documentation
4. Check impact on other services

### Quick file locations:
- Main configs: `backend/services/*/src/config/`
- Environment: `backend/services/*/.env`
- Database models: `backend/services/*/prisma/schema.prisma`

---

## 📚 USEFUL COMMANDS

```bash
# Find where a function is used
grep -r "functionName" backend/

# Check database
npx prisma studio

# View logs
docker logs <container-id>

# Kill stuck processes on Windows
taskkill /F /PID <pid>
```

---

**💡 Lưu ý cho Claude:**
- Khi được yêu cầu làm việc với project này, hãy đọc file này TRƯỚC
- File này được cập nhật thường xuyên, luôn check version mới nhất
- Nếu có thông tin nào không rõ, hãy hỏi user thay vì đoán
