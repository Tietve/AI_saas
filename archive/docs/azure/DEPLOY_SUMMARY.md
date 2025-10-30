# 🚀 Vercel Deployment - Quick Summary

## ✅ Patches Applied

### 1. ✅ package.json - Added postinstall script
**File:** `package.json:6`
```json
"postinstall": "prisma generate"
```
**Why:** Vercel needs to generate Prisma Client after npm install.

### 2. ✅ next.config.js - Disabled standalone output
**File:** `next.config.js:12-14`
```js
// VERCEL: Disabled standalone output (only for Docker)
// output: 'standalone',
```
**Why:** Vercel has its own build system, standalone mode causes conflicts.

### 3. ✅ vercel.json - Created Vercel config
**File:** `vercel.json` (NEW)
```json
{
  "buildCommand": "prisma generate && next build",
  "regions": ["sin1"],
  "functions": { ... }
}
```
**Why:** Explicit build command and function configs for optimal performance.

### 4. ✅ Health route - Added runtime config
**File:** `src/app/api/health/route.ts:67-68`
```ts
export const runtime = 'nodejs'
```
**Why:** Prisma requires Node.js runtime, not Edge runtime.

---

## ⚠️ TODO: Add Runtime Config to Remaining Routes

**Problem:** 30 API routes use Prisma, but only 7 have `runtime = 'nodejs'` config.

**Solution:** Run the auto-fix script:

```bash
node scripts/add-runtime-to-routes.js
```

This will automatically add `export const runtime = 'nodejs'` to all routes that:
- Import Prisma (`@/lib/prisma`)
- Don't have runtime config yet

**Affected routes (23 files):**
- `/api/messages/feedback`
- `/api/test-feedback`
- `/api/user/update`
- `/api/user/usage`
- `/api/usage/check`
- `/api/auth/verify-email`
- `/api/projects/*`
- `/api/payment/create`
- `/api/conversations/*`
- `/api/chat/*` (multiple endpoints)
- `/api/auth/resend-verification`
- `/api/auth/reset`
- `/api/auth/signin`
- `/api/auth/signup`
- `/api/billing/refund`
- `/api/webhook/payos`

---

## 📋 ENV Variables Checklist

Verify these are set in **Vercel Dashboard → Project → Settings → Environment Variables:**

### 🔴 CRITICAL (Must have):
```bash
DATABASE_URL="postgresql://..."
AUTH_SECRET="..." # >= 32 chars
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="AST_..."
NEXT_PUBLIC_APP_URL="https://firbox.net"
APP_URL="https://firbox.net"
OPENAI_API_KEY="sk-proj-..."
NODE_ENV="production"
```

### 🟡 IMPORTANT (Should have):
```bash
SENTRY_DSN="https://..."
NEXT_PUBLIC_SENTRY_DSN="https://..."
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="noreply@firbox.net"
SMTP_PASS="..."
SMTP_FROM="FirBox <noreply@firbox.net>"
```

### 🟢 OPTIONAL:
```bash
ANTHROPIC_API_KEY="..."
GOOGLE_API_KEY="..."
PAYOS_CLIENT_ID="..."
```

---

## ⚙️ Vercel Settings

### Node.js Version:
**Settings → General → Node.js Version:** `20.x` (recommended)

### Build Settings:
**Settings → Build & Output Settings:**
- Framework Preset: `Next.js`
- Build Command: (default - will use vercel.json)
- Output Directory: (default - `.next`)

### Function Settings:
**Settings → Functions:**
- Region: `Singapore (sin1)`
- Max Duration: `30s` (general), `60s` (chat endpoint)

---

## 🚀 Deployment Steps

### 1. Apply remaining runtime configs:
```bash
node scripts/add-runtime-to-routes.js
```

### 2. Commit and push:
```bash
git add .
git commit -m "fix(vercel): Add runtime configs and optimize deployment"
git push origin main
```

### 3. Deploy to Vercel:
Vercel will auto-deploy on push, or manually trigger:
- Go to Vercel Dashboard
- Click "Redeploy" on latest deployment

### 4. Verify deployment:
```bash
# Test health endpoint
curl https://firbox.net/api/health

# Expected response:
{
  "status": "healthy",
  "checks": {
    "database": { "status": "pass" },
    "cache": { "status": "pass" },
    ...
  }
}
```

### 5. Check logs:
- Vercel Dashboard → Deployments → Click deployment
- Check Build Logs for errors
- Check Function Logs for runtime errors

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot find module '@prisma/client'"
**Cause:** Prisma Client not generated
**Fix:** Verify `postinstall` script in package.json

### Issue: "Edge Runtime + Prisma error"
**Cause:** Route missing `runtime = 'nodejs'`
**Fix:** Run `node scripts/add-runtime-to-routes.js`

### Issue: "Database connection failed"
**Cause:** DATABASE_URL not set or wrong
**Fix:** Check Vercel env vars, verify connection string

### Issue: "Redis connection failed"
**Cause:** UPSTASH_REDIS_REST_URL or TOKEN wrong
**Fix:** Check Vercel env vars, test with curl

### Issue: "Module not found in middleware"
**Cause:** Middleware imports heavy Node.js modules
**Fix:** Middleware already has `runtime = 'nodejs'` at line 9

---

## 📊 Files Changed

- ✅ `package.json` - Added postinstall
- ✅ `next.config.js` - Disabled standalone
- ✅ `vercel.json` - Created config (NEW)
- ✅ `src/app/api/health/route.ts` - Added runtime
- ⏳ `src/app/api/**/route.ts` - 23 files need runtime (run script)
- ✅ `scripts/add-runtime-to-routes.js` - Auto-fix script (NEW)
- ✅ `VERCEL_DEPLOY_FIXES.md` - Detailed guide (NEW)
- ✅ `DEPLOY_SUMMARY.md` - This file (NEW)

---

## 🎯 Next Steps

1. **Run the runtime config script:**
   ```bash
   node scripts/add-runtime-to-routes.js
   ```

2. **Review changes:**
   ```bash
   git status
   git diff
   ```

3. **Commit and deploy:**
   ```bash
   git add .
   git commit -m "fix(vercel): Add runtime configs to all Prisma routes"
   git push origin main
   ```

4. **Monitor deployment:**
   - Watch build logs in Vercel Dashboard
   - Test endpoints after deployment
   - Check Function Logs for errors

5. **If build fails:**
   - Copy full build logs
   - Share with DevOps team
   - Check VERCEL_DEPLOY_FIXES.md for detailed troubleshooting

---

## 📞 Need Help?

**If deployment still fails after applying all fixes:**

1. Collect these artefacts:
   - ✅ Full Vercel Build Logs
   - ✅ Runtime Error Logs (from Functions tab)
   - ✅ List of ENV vars set in Vercel (hide sensitive values)
   - ✅ Screenshot of error message

2. Share for analysis:
   - Post in team Slack/Discord
   - Or open GitHub issue with artefacts

3. Test locally first:
   ```bash
   # Load production env
   cp .env.production .env.local

   # Build and test
   npm run build
   npm start

   # Test endpoints
   curl http://localhost:3000/api/health
   ```

---

**Created:** 2025-10-09
**Status:** Ready for deployment
**Next Action:** Run runtime config script → Commit → Deploy
