# Test Infrastructure

Isolated testing environment with Docker Compose for integration and E2E tests.

## Quick Start

```bash
# Start test infrastructure
npm run test:infra:start

# Check status
npm run test:infra:status

# Run integration tests
npm run test:integration

# Stop infrastructure (keeps data)
npm run test:infra:stop

# Cleanup everything (removes data)
npm run test:infra:cleanup
```

## Services

### PostgreSQL Test Database
- **Port:** 5433
- **Database:** test_db
- **User:** test_user
- **Password:** test_password
- **Connection URL:** `postgresql://test_user:test_password@localhost:5433/test_db`

### Redis Test Cache
- **Port:** 6380
- **No authentication**
- **Connection URL:** `redis://localhost:6380`

### MinIO Test Storage
- **API Port:** 9002
- **Console Port:** 9003
- **Access Key:** minioadmin
- **Secret Key:** minioadmin
- **Endpoint:** `http://localhost:9002`

## Directory Structure

```
tests/
├── docker-compose.test.yml    # Test infrastructure services
├── .env.test                  # Test environment variables
├── scripts/
│   ├── start-test-infra.sh   # Start services
│   ├── stop-test-infra.sh    # Stop services (keep data)
│   ├── cleanup-test-infra.sh # Stop and remove all data
│   └── README.md             # Scripts documentation
├── fixtures/                  # Test data fixtures
├── integration/               # Integration tests
├── performance/               # Performance benchmarks
├── e2e/                      # End-to-end tests
└── utils/                    # Test utilities
```

## Environment Variables

All test environment variables are defined in `.env.test`:

```bash
NODE_ENV=test
DATABASE_URL=postgresql://test_user:test_password@localhost:5433/test_db
REDIS_URL=redis://localhost:6380
MINIO_ENDPOINT=localhost
MINIO_PORT=9002
# ... and more
```

## Scripts

### From package.json

```bash
# Infrastructure management
npm run test:infra:start    # Start all test services
npm run test:infra:stop     # Stop test services (keep data)
npm run test:infra:cleanup  # Stop and remove all data
npm run test:infra:status   # Show service status

# Run tests
npm run test                # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report
```

### Direct bash scripts

```bash
# From backend/tests/ directory
./scripts/start-test-infra.sh
./scripts/stop-test-infra.sh
./scripts/cleanup-test-infra.sh
```

## Health Checks

All services have health checks to ensure they're ready before tests run:

- **PostgreSQL:** `pg_isready` every 5 seconds
- **Redis:** `redis-cli ping` every 5 seconds
- **MinIO:** HTTP health endpoint every 5 seconds

The start script waits for all services to be healthy (up to 60 seconds timeout).

## Port Isolation

All test services use different ports than production to allow running both simultaneously:

| Service | Production Port | Test Port |
|---------|----------------|-----------|
| PostgreSQL | 5432 | 5433 |
| Redis | 6379 | 6380 |
| MinIO | 9000, 9001 | 9002, 9003 |

## Data Persistence

### Keeping Data Between Runs
By default, `stop-test-infra.sh` keeps data in Docker volumes:

```bash
npm run test:infra:stop
# Data persists, next start will use same data
```

### Cleaning Up Data
Use cleanup script to remove all data:

```bash
npm run test:infra:cleanup
# All data removed, next start is fresh
```

## Troubleshooting

### Services won't start
```bash
# Check if ports are already in use
netstat -tuln | grep -E "(5433|6380|9002|9003)"

# Kill any processes using test ports
sudo lsof -ti:5433 | xargs kill -9
sudo lsof -ti:6380 | xargs kill -9
```

### Services not healthy
```bash
# Check container logs
cd tests
docker-compose -f docker-compose.test.yml logs postgres-test
docker-compose -f docker-compose.test.yml logs redis-test
docker-compose -f docker-compose.test.yml logs minio-test
```

### Reset everything
```bash
# Nuclear option - remove everything and start fresh
npm run test:infra:cleanup
docker volume prune -f
npm run test:infra:start
```

### Connection refused errors
Make sure services are running and healthy:

```bash
npm run test:infra:status

# Should show "Up" and "healthy" for all services
```

## Integration with Tests

### Using in Jest tests

```typescript
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

// Connect to test database
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

// Connect to test Redis
const redis = new Redis(process.env.REDIS_URL);

beforeAll(async () => {
  // Setup
});

afterAll(async () => {
  await prisma.$disconnect();
  await redis.quit();
});
```

### Using environment variables

```typescript
// Load test environment
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env.test') });
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Start test infrastructure
  run: npm run test:infra:start

- name: Run tests
  run: npm test

- name: Cleanup
  if: always()
  run: npm run test:infra:cleanup
```

### Local Development

```bash
# One-time setup
npm run test:infra:start

# Leave running while developing
# Run tests as needed
npm test

# When done for the day
npm run test:infra:stop
```

## Performance Notes

- Services start in ~10-15 seconds
- Health checks add ~5-10 seconds
- First test run may be slower (Docker image pull)
- Subsequent runs are fast (images cached)

## Best Practices

1. **Always cleanup after CI runs** - Use `test:infra:cleanup`
2. **Use separate databases per test suite** - Create/drop schemas
3. **Reset state between tests** - Truncate tables or use transactions
4. **Don't commit .env.test with real secrets** - Use placeholders
5. **Keep test data small** - Use fixtures and factories
6. **Parallel test execution** - Ensure tests don't conflict

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Jest Documentation](https://jestjs.io/)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
