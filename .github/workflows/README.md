# CI/CD Workflows

This directory contains GitHub Actions workflows for automated testing, building, and deployment.

## Workflows

### 1. Test Suite (`test.yml`)
**Triggers:** Push to main/develop/claude/**, Pull requests
**Purpose:** Run unit and integration tests across all services
**Services:** PostgreSQL, Redis, MinIO
**Runs:**
- Linting for all services
- Unit tests with coverage
- Integration tests
- Uploads coverage to Codecov

**Duration:** ~15-20 minutes

### 2. Build Verification (`build.yml`)
**Triggers:** Push to main/develop/claude/**, Pull requests
**Purpose:** Verify all services build successfully
**Matrix:** Node 18 and 20
**Runs:**
- Build all backend services
- Build frontend
- TypeScript type checking
- Docker image builds
- Bundle size analysis

**Duration:** ~10-15 minutes

### 3. E2E Tests (`e2e.yml`)
**Triggers:** Nightly (2 AM UTC), Manual, Push to main
**Purpose:** End-to-end testing with Playwright
**Runs:**
- Full backend stack startup
- Frontend build and preview
- Playwright E2E tests
- Visual regression tests
- Performance/Lighthouse tests
- Screenshot capture on failures

**Duration:** ~30-45 minutes

### 4. Test Coverage (`coverage.yml`)
**Triggers:** Push, Pull requests
**Purpose:** Generate and upload test coverage reports
**Runs:**
- Auth service tests with coverage
- Chat service tests with coverage
- Frontend tests with coverage
- Combined coverage report

**Duration:** ~15-20 minutes

### 5. Production Deployment (`production.yml`)
**Triggers:** Push to main, Manual
**Purpose:** Deploy to production environment
**Runs:**
- Build and deploy all services
- Database migrations
- Health checks

**Duration:** ~20-30 minutes

### 6. Update Memory (`update-memory.yml`)
**Triggers:** Push to main/develop
**Purpose:** Auto-update codebase documentation
**Runs:**
- Regenerate CODEBASE_INDEX.md
- Update documentation files

**Duration:** ~2-5 minutes

---

## Testing Workflows Locally

### Using `act` (GitHub Actions Local Runner)

#### Installation

**macOS:**
```bash
brew install act
```

**Linux:**
```bash
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
```

**Windows:**
```bash
choco install act-cli
# or
scoop install act
```

#### Basic Usage

**List all workflows:**
```bash
act -l
```

**Run a specific workflow:**
```bash
# Run test workflow
act push -W .github/workflows/test.yml

# Run build workflow
act push -W .github/workflows/build.yml

# Run E2E workflow
act workflow_dispatch -W .github/workflows/e2e.yml
```

**Run with specific event:**
```bash
# Simulate pull request
act pull_request

# Simulate push to main
act push -e .github/workflows/events/push-main.json
```

**Dry run (show what would run):**
```bash
act -n
```

#### Configuration

Create `.actrc` in project root:
```bash
# Use medium-sized runner image
-P ubuntu-latest=catthehacker/ubuntu:act-latest

# Platform mapping
--platform ubuntu-latest=catthehacker/ubuntu:full-latest

# Secrets file
--secret-file .secrets

# Environment variables
--env-file .env.test
```

#### Running with Secrets

Create `.secrets` file (don't commit):
```bash
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
CODECOV_TOKEN=...
```

Run with secrets:
```bash
act --secret-file .secrets
```

#### Limitations

⚠️ **Known limitations:**
- Some GitHub-specific actions may not work
- Docker-in-Docker can be slow
- Service containers may need manual setup
- Matrix builds use more resources

#### Recommended Workflow

**For quick validation:**
```bash
# Just check syntax
act -n

# Run test workflow (fastest)
act push -W .github/workflows/test.yml --job test
```

**For full validation:**
```bash
# Run all workflows locally
act push
```

**For specific job:**
```bash
# Run only build job
act push -W .github/workflows/build.yml --job build
```

---

## Manual Testing

### Local Test Execution

**Run unit tests:**
```bash
# Auth service
cd backend/services/auth-service
npm test

# Chat service
cd backend/services/chat-service
npm test
```

**Run integration tests:**
```bash
cd backend/tests/integration
npm test
```

**Run E2E tests:**
```bash
cd frontend
npx playwright test
```

**Run with coverage:**
```bash
npm run test:coverage
```

### Local Build Verification

**Build all services:**
```bash
cd backend
npm run build:all
```

**Build specific service:**
```bash
cd backend/services/auth-service
npm run build
```

**Type checking:**
```bash
npm run type-check
```

### Docker Testing

**Start all services:**
```bash
docker-compose up -d
```

**View logs:**
```bash
docker-compose logs -f auth-service
docker-compose logs -f chat-service
```

**Run tests in Docker:**
```bash
docker-compose exec auth-service npm test
```

---

## Debugging Workflow Failures

### View Workflow Logs
1. Go to GitHub Actions tab
2. Click on failed workflow run
3. Expand failed job
4. Check step logs

### Common Issues

**Database connection failures:**
- Check service health checks
- Verify port mappings
- Check DATABASE_URL format

**Timeout errors:**
- Increase `timeout-minutes` in workflow
- Check for infinite loops
- Verify service startup

**Test failures:**
- Check environment variables
- Verify test database schema
- Check for race conditions

**Build failures:**
- Clear npm cache: `npm clean-install`
- Check TypeScript errors
- Verify dependencies

### Re-running Workflows

**Re-run failed jobs:**
```bash
gh workflow run test.yml
```

**Re-run specific job:**
```bash
gh run rerun <run-id> --job <job-id>
```

---

## Performance Optimization

### Cache Strategy
- npm dependencies cached by `actions/setup-node@v3`
- Cache key based on `package-lock.json`
- Multi-path cache for monorepo

### Parallelization
- Matrix builds (Node 18, 20)
- Parallel test execution
- Independent workflow jobs

### Optimization Tips
- Use `continue-on-error` for non-critical steps
- Upload artifacts selectively
- Use `--frozen-lockfile` for deterministic installs
- Enable test sharding for large suites

---

## CI/CD Best Practices

### Workflow Design
✅ **DO:**
- Use descriptive job names
- Add timeout limits
- Upload artifacts for debugging
- Use matrix for version testing
- Add summaries for visibility

❌ **DON'T:**
- Run all tests on every commit (use paths filter)
- Upload large artifacts (>100MB)
- Use `continue-on-error` without reason
- Skip linting/type checking

### Security
- Use secrets for sensitive data
- Don't log secrets
- Use `GITHUB_TOKEN` for API calls
- Limit workflow permissions

### Maintenance
- Review failed workflows daily
- Update actions to latest versions
- Clean up old artifacts
- Monitor workflow run times

---

## Monitoring & Alerts

### GitHub Actions Insights
- View workflow run times
- Track success/failure rates
- Monitor artifact storage

### Codecov Integration
- Coverage trends
- PR coverage diff
- Branch coverage

### Slack Notifications (Optional)
Add to workflows:
```yaml
- name: Notify Slack
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [act Documentation](https://github.com/nektos/act)
- [Playwright CI](https://playwright.dev/docs/ci)
- [Codecov GitHub Action](https://github.com/codecov/codecov-action)

---

## Quick Reference

**View all workflows:**
```bash
gh workflow list
```

**Run workflow manually:**
```bash
gh workflow run e2e.yml
```

**View recent runs:**
```bash
gh run list --workflow=test.yml
```

**Download artifacts:**
```bash
gh run download <run-id>
```

**Cancel running workflow:**
```bash
gh run cancel <run-id>
```

---

## Support

For issues with workflows:
1. Check workflow logs
2. Review this documentation
3. Test locally with `act`
4. Open GitHub issue with workflow run link
