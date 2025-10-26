# 🤖 HƯỚNG DẪN CHO CLAUDE - AUTO QUALITY GUARD

**Last Updated**: 2025-10-26
**Purpose**: Đảm bảo code luôn sạch và backend chạy tốt nhất

---

## 📖 DÀNH CHO CLAUDE - ĐỌC FILE NÀY KHI BẮT ĐẦU SESSION

Khi bạn (Claude) bắt đầu làm việc với project này, hãy làm theo các bước sau:

---

## ✅ KHI NÀO CHẠY AUTO QUALITY GUARD

### 1. Sau khi code xong một tính năng mới
```bash
node automation/auto-quality-guard.js
```

### 2. Sau khi fix bug
```bash
node automation/auto-quality-guard.js --service auth-service
```

### 3. Trước khi commit code
```bash
node automation/auto-quality-guard.js
```

### 4. Continuous monitoring (chạy liên tục)
```bash
node automation/auto-quality-guard.js --continuous
```

---

## 🎯 AUTO QUALITY GUARD LÀM GÌ?

### Bước 1: Kiểm tra TypeScript
- ✅ Chạy `tsc --noEmit`
- ✅ Phát hiện type errors
- ✅ Tự động fix nếu có thể

### Bước 2: Kiểm tra Lint
- ✅ Chạy `eslint`
- ✅ Tự động fix với `eslint --fix`

### Bước 3: Chạy Unit Tests
- ✅ Chạy `npm test`
- ✅ Kiểm tra coverage
- ✅ Phát hiện test failures

### Bước 4: Build Service
- ✅ Chạy `npm run build`
- ✅ Đảm bảo compile thành công

### Bước 5: Start Service
- ✅ Start service nếu chưa chạy
- ✅ Verify service started

### Bước 6: Health Check
- ✅ Gọi `/health` endpoint
- ✅ Verify service healthy

### Bước 7: API Tests
- ✅ Test tất cả API endpoints
- ✅ Verify responses
- ✅ Check status codes

### Bước 8: Integration Tests
- ✅ Test service interactions
- ✅ Test database operations

### Bước 9: Load Test
- ✅ 100 concurrent requests
- ✅ Check success rate >95%

---

## 🔧 WORKFLOW TỰ ĐỘNG

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTO QUALITY LOOP                         │
└─────────────────────────────────────────────────────────────┘

1. Run Tests
   ↓
2. Tests PASS? → ✅ Done!
   ↓ NO
3. Analyze Errors
   ↓
4. Generate Fixes
   ↓
5. Apply Fixes
   ↓
6. Retry (max 3 attempts)
   ↓
7. Report Results
```

---

## 💡 AUTO-FIX CAPABILITIES

Hệ thống tự động fix:

### ✅ TypeScript Errors
- Missing imports → Auto-add imports
- Type mismatches → Suggest fixes

### ✅ Lint Errors
- Formatting → Auto-fix with prettier
- Code style → Auto-fix with eslint --fix

### ✅ Simple Bugs
- Undefined variables → Add declarations
- Missing dependencies → Install packages

### ⚠️ Complex Bugs
- Logic errors → Report for manual fix
- API failures → Analyze and suggest

---

## 📊 OUTPUT

### Console Output
```
═══════════════════════════════════════════════════════════════
🤖 AUTO QUALITY GUARD - Starting...
═══════════════════════════════════════════════════════════════

ℹ Running: Type Check...
✅ Type Check passed

ℹ Running: Lint Check...
✅ Lint Check passed

ℹ Running: Unit Tests...
✅ Unit Tests passed

ℹ Running: Build Service...
✅ Build Service passed

ℹ Running: Health Check...
✅ Health Check passed

ℹ Running: API Tests...
✅ API Tests passed

✅ Quality Guard completed successfully!
```

### Report File: `QUALITY_REPORT.json`
```json
{
  "timestamp": "2025-10-26T...",
  "services": ["auth-service", "chat-service", "billing-service"],
  "issues": [],
  "fixes": [],
  "summary": {
    "totalIssues": 0,
    "fixedIssues": 0,
    "remainingIssues": 0
  }
}
```

---

## 🚨 KHI CÓ LỖI

### Nếu Auto-Fix không được
1. ✅ Đọc error message trong console
2. ✅ Đọc `QUALITY_REPORT.json`
3. ✅ Fix manually
4. ✅ Run lại: `node automation/auto-quality-guard.js`

### Nếu Service không start
```bash
# Check port conflicts
netstat -ano | findstr :3001

# Kill process
taskkill /F /PID <pid>

# Retry
node automation/auto-quality-guard.js
```

---

## 🎯 CLAUDE'S WORKFLOW

### Scenario 1: New Feature
```bash
# 1. Code tính năng mới
# ... coding ...

# 2. Run Quality Guard
node automation/auto-quality-guard.js

# 3. Nếu có lỗi → Fix và retry
# 4. Nếu pass → Commit code
git add .
git commit -m "feat: new feature"
```

### Scenario 2: Bug Fix
```bash
# 1. Fix bug
# ... fixing ...

# 2. Run Quality Guard cho service cụ thể
node automation/auto-quality-guard.js --service auth-service

# 3. Verify fix
# 4. Commit
```

### Scenario 3: Continuous Work
```bash
# Start continuous monitoring
node automation/auto-quality-guard.js --continuous

# Nó sẽ chạy mỗi 60 giây
# Press Ctrl+C để stop
```

---

## 📚 BEST PRACTICES

### 1. Luôn chạy trước khi commit
```bash
node automation/auto-quality-guard.js && git commit
```

### 2. Test specific service khi làm việc với 1 service
```bash
node automation/auto-quality-guard.js --service chat-service
```

### 3. Đọc report sau mỗi lần chạy
```bash
cat QUALITY_REPORT.json
```

### 4. Keep services running
- Để services chạy trong background
- Quality Guard sẽ không restart nếu đã running

---

## 🔍 DEBUGGING

### Enable verbose logging
```bash
DEBUG=* node automation/auto-quality-guard.js
```

### Check specific test
```bash
cd services/auth-service
npm test -- --testNamePattern="should work"
```

### Manual health check
```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

---

## 🎓 EXAMPLE SESSION

```bash
# Claude starts new session
$ cat automation/CLAUDE_INSTRUCTIONS.md

# Claude codes new feature
$ # ... write code ...

# Claude runs Quality Guard
$ node automation/auto-quality-guard.js

# Output shows error in type check
❌ Type Check failed (attempt 1/3)
ℹ Analyzing errors and generating fixes...
ℹ Applied 2 fixes, retrying...
✅ Type Check passed

# All tests pass
✅ Quality Guard completed successfully!

# Claude commits
$ git add .
$ git commit -m "feat: add new endpoint"
```

---

## 💡 TIPS FOR CLAUDE

### When to run
- ✅ After writing any code
- ✅ After fixing any bug
- ✅ Before committing
- ✅ When starting a new session (to verify current state)

### What to do if fails
1. Read error messages carefully
2. Check QUALITY_REPORT.json
3. Fix issues manually
4. Run again
5. Repeat until pass

### Continuous improvement
- Quality Guard learns from fixes
- Each run makes the system better
- Code quality improves over time

---

## 📞 QUICK REFERENCE

### Run all services
```bash
node automation/auto-quality-guard.js
```

### Run single service
```bash
node automation/auto-quality-guard.js --service auth-service
```

### Continuous mode
```bash
node automation/auto-quality-guard.js --continuous
```

### Get help
```bash
node automation/auto-quality-guard.js --help
```

### Check report
```bash
cat QUALITY_REPORT.json
```

---

## ✅ CHECKLIST FOR CLAUDE

Before committing code:
- [ ] Run Quality Guard
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No lint errors
- [ ] All services healthy
- [ ] API tests pass
- [ ] Load test >95% success
- [ ] Read QUALITY_REPORT.json
- [ ] Commit with meaningful message

---

**Remember**: Quality Guard là trợ thủ của bạn, không phải thay thế. Luôn review code và understand các fixes được apply.

**Goal**: Code sạch 100%, Backend chạy hoàn hảo 100%, Zero bugs in production! 🎯

---

**Last Updated**: 2025-10-26
**Maintained By**: Automation Team
**For**: Claude AI Assistant
