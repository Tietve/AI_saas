# Test Infrastructure Scripts

Helper scripts for managing the isolated test environment.

## Available Scripts

### Core Infrastructure Scripts

#### `start-test-infra.sh`
Starts all test infrastructure services (PostgreSQL, Redis, MinIO).

```bash
./scripts/start-test-infra.sh
```

**What it does:**
- Starts Docker Compose services
- Waits for all services to be healthy
- Shows connection details

#### `stop-test-infra.sh`
Stops all test infrastructure services (keeps data).

```bash
./scripts/stop-test-infra.sh
```

**What it does:**
- Stops all containers
- Preserves volumes (data persists)

#### `cleanup-test-infra.sh`
Completely removes all test infrastructure including data.

```bash
./scripts/cleanup-test-infra.sh
```

**What it does:**
- Stops all containers
- Removes all volumes (data is deleted)
- Cleans up dangling volumes

### Helper Scripts

#### `verify-setup.sh`
Verifies that all required files and configurations are in place.

```bash
./scripts/verify-setup.sh
```

**What it checks:**
- Required files exist
- Scripts are executable
- Docker is installed
- Provides next steps

#### `validate-config.sh`
Validates the Docker Compose configuration syntax and checks for port conflicts.

```bash
./scripts/validate-config.sh
```

**What it checks:**
- Docker Compose YAML syntax
- Port availability
- Configuration validity

#### `show-connections.sh`
Displays connection information for all test services.

```bash
./scripts/show-connections.sh
```

**What it shows:**
- PostgreSQL connection details
- Redis connection details
- MinIO connection details
- Quick test commands

## Usage from package.json

```bash
# Core infrastructure management
npm run test:infra:start    # Start all services
npm run test:infra:stop     # Stop services (keep data)
npm run test:infra:cleanup  # Stop and remove all data
npm run test:infra:status   # Show service status

# Helper commands
npm run test:infra:verify   # Verify setup is complete
npm run test:infra:validate # Validate Docker config
npm run test:infra:info     # Show connection details

# Run tests
npm run test:integration    # Run integration tests
```

## Services

| Service | Port | Credentials |
|---------|------|-------------|
| PostgreSQL | 5433 | test_user / test_password |
| Redis | 6380 | (no password) |
| MinIO | 9002, 9003 | minioadmin / minioadmin |

## Notes

- All services use different ports than production to avoid conflicts
- Data persists between runs unless you use `cleanup-test-infra.sh`
- Services have health checks to ensure they're ready before tests run
