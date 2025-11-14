# Integration Tests - File Index

Quick reference to all files in this directory.

## 📋 Quick Links

| File | Purpose | Read This First? |
|------|---------|------------------|
| **QUICK_START.md** | Start here! Quick setup guide | ⭐ YES |
| **README.md** | Comprehensive documentation | After quick start |
| **TEST_SUMMARY.md** | Statistics and overview | For metrics/reporting |
| **INDEX.md** | This file - navigation guide | You're here! |

## 🧪 Test Files

| File | Tests | Endpoints | Purpose |
|------|-------|-----------|---------|
| **auth-api.spec.ts** | 9 | 6 | Auth Service API tests |
| **chat-api.spec.ts** | 10 | 7 | Chat Service API tests |
| **billing-api.spec.ts** | 10 | 7 | Billing Service API tests |
| **services-health.spec.ts** | 14 | 5 | Health checks for all services |
| **backend-health.spec.ts** | 3 | 4 | Basic health tests (existing) |

## 🚀 Run Scripts

| File | Platform | Usage |
|------|----------|-------|
| **run-tests.sh** | Linux/Mac | `./run-tests.sh [option]` |
| **run-tests.bat** | Windows | `run-tests.bat [option]` |

### Script Options
```bash
all      # Run all tests (default)
auth     # Auth API tests only
chat     # Chat API tests only
billing  # Billing API tests only
health   # Health checks only
ui       # Run with Playwright UI
headed   # Run in headed mode (see browser)
```

## 🎯 What You Need

### First Time Setup
1. Read **QUICK_START.md**
2. Start backend services
3. Run tests: `./run-tests.sh all`
4. Check **README.md** for details

### Quick Test Run
1. `npm run docker:up` (start infrastructure)
2. `npm run dev:all` (start services)
3. `./run-tests.sh all` (run tests)

### CI/CD Integration
1. Read **README.md** → "CI/CD Integration" section
2. Copy example workflow
3. Configure in `.github/workflows/`

### Troubleshooting
1. Check **QUICK_START.md** → "Troubleshooting" section
2. Check **README.md** → "Troubleshooting" section
3. Review test output logs

## 📊 Statistics (from TEST_SUMMARY.md)

- **Test Files:** 5 spec files
- **Test Cases:** 46+ tests
- **API Endpoints:** 26+ endpoints
- **Services:** 5 microservices
- **Coverage:** Auth, Chat, Billing, Analytics, API Gateway

## 🔍 Find Specific Info

| What You Need | Where to Find It |
|---------------|------------------|
| How to run tests | QUICK_START.md |
| Test documentation | README.md |
| Statistics and metrics | TEST_SUMMARY.md |
| Specific API endpoint tests | auth-api.spec.ts, chat-api.spec.ts, billing-api.spec.ts |
| Service health checks | services-health.spec.ts |
| Quick commands | This file (INDEX.md) |

## 📝 Quick Commands Cheat Sheet

```bash
# Start backend
npm run docker:up
npm run dev:all

# Run tests
./run-tests.sh all          # All tests
./run-tests.sh health       # Health checks only
./run-tests.sh auth         # Auth tests only
./run-tests.sh ui           # With UI

# View report
npx playwright show-report

# Debug
npx playwright test --debug
```

## 🎨 File Structure

```
frontend/tests/integration/
├── 📘 Documentation
│   ├── INDEX.md          ← You are here
│   ├── QUICK_START.md    ← Start here!
│   ├── README.md         ← Full documentation
│   └── TEST_SUMMARY.md   ← Statistics
│
├── 🧪 Test Files
│   ├── auth-api.spec.ts
│   ├── chat-api.spec.ts
│   ├── billing-api.spec.ts
│   ├── services-health.spec.ts
│   └── backend-health.spec.ts
│
└── 🚀 Run Scripts
    ├── run-tests.sh      ← Linux/Mac
    └── run-tests.bat     ← Windows
```

## 🎯 Common Tasks

### I want to...

**Run all tests quickly**
→ `./run-tests.sh all`

**Check if services are running**
→ `./run-tests.sh health`

**Test a specific API**
→ `./run-tests.sh auth` (or chat, billing)

**Debug a failing test**
→ `npx playwright test auth-api.spec.ts --debug`

**See tests in UI**
→ `./run-tests.sh ui`

**Understand test coverage**
→ Read `TEST_SUMMARY.md`

**Learn how to run tests**
→ Read `QUICK_START.md`

**Get detailed documentation**
→ Read `README.md`

**Add new tests**
→ Edit relevant `*.spec.ts` file

**Integrate with CI/CD**
→ See `README.md` → CI/CD Integration

## 📞 Need Help?

1. **Quick questions** → QUICK_START.md
2. **Detailed info** → README.md
3. **Statistics** → TEST_SUMMARY.md
4. **Test examples** → Any .spec.ts file
5. **Still stuck?** → Check service logs

## 🏆 Key Achievements

✅ 46+ comprehensive test cases
✅ 26+ API endpoints tested
✅ 5 microservices covered
✅ Security, performance, and error testing
✅ Production-ready test suite
✅ Detailed documentation
✅ Easy-to-use run scripts

---

**Last Updated:** 2025-11-06
**Total Files:** 10 (5 tests + 3 docs + 2 scripts)
**Total Tests:** 46+ test cases
**Ready to Use:** ✅ YES!
