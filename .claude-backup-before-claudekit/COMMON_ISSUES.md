# 🐛 COMMON ISSUES & SOLUTIONS

## Issue #1: Database Connection Failed
**Error:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solutions:**
1. Check if PostgreSQL is running: `docker ps`
2. Check DATABASE_URL in .env
3. Restart database: `docker-compose restart postgres`

---

## Issue #2: JWT Token Invalid
**Error:** `401 Unauthorized: Invalid token`

**Solutions:**
1. Check if JWT_SECRET matches across services
2. Verify token hasn't expired (check expiry time)
3. Ensure Authorization header format: `Bearer <token>`

---

## Issue #3: Port Already in Use
**Error:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions Windows:**
```bash
# Find process
netstat -ano | findstr :3000

# Kill process
taskkill /F /PID <pid>
```

**Solutions Linux/Mac:**
```bash
# Find and kill
lsof -ti:3000 | xargs kill -9
```

---

## Issue #4: Redis Connection Timeout
**Error:** `Error: Redis connection timeout`

**Solutions:**
1. Start Redis: `docker-compose up redis`
2. Check REDIS_URL in .env
3. Verify Redis is accessible: `redis-cli ping`

---

## Issue #5: Prisma Migration Failed
**Error:** `Error: Migration failed to apply`

**Solutions:**
1. Reset database: `npx prisma migrate reset`
2. Generate client: `npx prisma generate`
3. Push schema: `npx prisma db push`

---

**💡 Usage:**
```
"Đọc .claude/COMMON_ISSUES.md và giải quyết lỗi tôi đang gặp"
```
