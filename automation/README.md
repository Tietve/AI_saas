# Automation Framework

## Overview

Framework tự động hóa hoàn toàn quá trình migration từ Next.js monolith sang microservices architecture.

## Cách hoạt động

```
┌─────────────────────────────────────────────────────────────┐
│  FULLY AUTOMATED MIGRATION LOOP                              │
└─────────────────────────────────────────────────────────────┘

1. Generate Service Code
   ├─ Create directory structure
   ├─ Generate package.json, tsconfig.json
   ├─ Generate Dockerfile
   ├─ Create app.ts with Express setup
   └─ Copy business logic from Next.js API routes

2. Generate Tests
   ├─ Unit tests (Jest)
   ├─ Integration tests (Supertest)
   └─ E2E tests

3. Install Dependencies
   └─ npm install

4. Build Service
   └─ npm run build

5. Run Tests
   └─ npm test

6. If Tests PASS → Success! Generate docs
   If Tests FAIL → Continue to step 7

7. Analyze Failures
   ├─ Categorize errors (type, import, logic, config)
   └─ Identify root causes

8. Generate Fixes
   ├─ Auto-fix import errors
   ├─ Auto-fix type errors
   ├─ Auto-fix config errors
   └─ Generate code patches

9. Apply Fixes
   └─ Modify source files

10. Retry from step 4
    └─ Max 5 attempts

11. If still failing → Report failure and exit
    If success → Generate documentation and report
```

## Usage

### Migrate single service

```bash
node automation/auto-migrate.js auth-service
```

### Migrate all services

```bash
node automation/auto-migrate.js --all
```

### Dry run (không apply fixes)

```bash
node automation/auto-migrate.js auth-service --dry-run
```

## Configuration

Services được định nghĩa trong `auto-migrate.js`:

```javascript
const SERVICES = [
  {
    name: 'auth-service',
    port: 3001,
    sourceDir: 'src/app/api/auth',
    features: ['signup', 'signin', 'verify-email', ...],
    database: 'postgresql',
    dependencies: ['bcryptjs', 'jsonwebtoken', ...]
  },
  // ...
];
```

## Output

Sau khi migration thành công, mỗi service sẽ có:

```
services/auth-service/
├── src/               # Source code
├── tests/             # Test suites
├── dist/              # Compiled code
├── Dockerfile         # Docker image
├── package.json       # Dependencies
├── tsconfig.json      # TypeScript config
├── README.md          # Service documentation
└── MIGRATION_REPORT.json  # Chi tiết migration
```

## Migration Report

File `MIGRATION_REPORT.json` chứa:

```json
{
  "service": "auth-service",
  "status": "success",
  "attempts": 2,
  "testResults": [
    {
      "passed": false,
      "failures": [...]
    },
    {
      "passed": true,
      "failures": []
    }
  ],
  "fixes": [
    {
      "type": "import",
      "description": "Fix missing import: ...",
      "success": true
    }
  ],
  "timestamp": "2024-10-25T..."
}
```

## Testing Strategy

### Level 1: Unit Tests
- Test individual functions
- Mock external dependencies
- Fast execution

### Level 2: Integration Tests
- Test API endpoints
- Test database operations
- Use test database

### Level 3: E2E Tests
- Test complete user flows
- Test service interactions
- Use Docker containers

## Auto-Fix Capabilities

Framework có khả năng tự động sửa:

✅ **Import Errors**
- Missing imports
- Incorrect paths
- Module resolution errors

✅ **Type Errors**
- Type mismatches
- Missing type annotations
- Generic type issues

✅ **Configuration Errors**
- Missing environment variables
- Database connection issues
- Redis connection issues

❌ **Business Logic Errors**
- Requires manual intervention
- Will be flagged in report

## Extending the Framework

### Add new service

Edit `SERVICES` array in `auto-migrate.js`:

```javascript
SERVICES.push({
  name: 'new-service',
  port: 3006,
  sourceDir: 'src/app/api/new',
  features: ['feature1', 'feature2'],
  database: 'mongodb',
  dependencies: ['express', ...]
});
```

### Add new auto-fix

Implement in `AutoMigration` class:

```javascript
async generateFixes(analysis) {
  // ... existing fixes

  // Add new fix type
  for (const error of analysis.customErrors) {
    fixes.push({
      type: 'custom',
      description: `Fix custom error: ${error.message}`,
      action: () => this.fixCustomError(error)
    });
  }

  return fixes;
}

async fixCustomError(error) {
  // Implement fix logic
}
```

## Monitoring

Framework logs mọi bước trong quá trình migration:

- ✅ Green: Success
- ⚠️  Yellow: Warning (non-critical)
- ❌ Red: Error (critical)
- ℹ️  Blue: Info
- 🔧 Gray: Working...

## Performance

Average migration time per service:

- **Simple service** (auth): ~5-10 phút
- **Complex service** (chat): ~15-20 phút
- **Full migration** (all 5 services): ~1-2 giờ

*Thời gian phụ thuộc vào số lần retry và độ phức tạp của business logic.*

## Troubleshooting

### "npm install failed"

```bash
# Xóa node_modules và retry
rm -rf services/*/node_modules
node automation/auto-migrate.js <service>
```

### "Tests timeout"

Tăng timeout trong Jest config:

```javascript
// jest.config.json
{
  "testTimeout": 30000  // 30 seconds
}
```

### "Build fails repeatedly"

Check TypeScript errors:

```bash
cd services/<service>
npx tsc --noEmit
```

## Best Practices

1. **Commit sau mỗi service migration thành công**
   ```bash
   git add services/auth-service
   git commit -m "chore: migrate auth-service to microservice"
   ```

2. **Review migration report** trước khi tiếp tục service tiếp theo

3. **Test manually** sau khi automation hoàn thành

4. **Keep Next.js API routes** cho đến khi verify microservice hoạt động

5. **Update documentation** nếu có thay đổi business logic

## Next Steps

Sau khi migration xong:

1. Setup API Gateway (Kong)
2. Configure service discovery
3. Setup monitoring (Prometheus + Grafana)
4. Deploy to Kubernetes
5. Setup CI/CD pipeline
6. Cutover traffic từ Next.js → microservices

## Support

Nếu gặp vấn đề, check:

1. Migration report (`MIGRATION_REPORT.json`)
2. Service logs
3. Test output
4. Build errors

Hoặc re-run với verbose logging:

```bash
DEBUG=* node automation/auto-migrate.js auth-service
```
