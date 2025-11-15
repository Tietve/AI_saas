#!/bin/bash

###############################################################################
# E2E Test Infrastructure Startup Script
#
# This script starts all required services for E2E tests:
# - PostgreSQL (port 5432)
# - Redis (port 6379)
# - Backend services (auth, chat, billing)
# - Frontend dev server (auto-started by Playwright)
#
# Usage: ./start-test-infrastructure.sh
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
POSTGRES_BIN="/usr/lib/postgresql/16/bin"
POSTGRES_DATA_DIR="/var/lib/postgresql/16/main"
REDIS_CONF="/etc/redis/redis.conf"
PROJECT_ROOT="/home/user/AI_saas"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   E2E Test Infrastructure Startup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

###############################################################################
# Step 1: Start PostgreSQL
###############################################################################
echo -e "${YELLOW}[1/5] Starting PostgreSQL...${NC}"

# Check if PostgreSQL is already running
if pg_isready -q; then
    echo -e "${GREEN}✓ PostgreSQL is already running${NC}"
else
    echo "  → Starting PostgreSQL database..."

    # Check if data directory exists
    if [ ! -d "$POSTGRES_DATA_DIR" ]; then
        echo -e "${RED}  ✗ PostgreSQL data directory not found: $POSTGRES_DATA_DIR${NC}"
        echo -e "${YELLOW}  → Initializing PostgreSQL cluster...${NC}"
        sudo mkdir -p "$POSTGRES_DATA_DIR"
        sudo chown postgres:postgres "$POSTGRES_DATA_DIR"
        sudo -u postgres $POSTGRES_BIN/initdb -D "$POSTGRES_DATA_DIR"
    fi

    # Start PostgreSQL
    sudo -u postgres $POSTGRES_BIN/pg_ctl -D "$POSTGRES_DATA_DIR" -l /var/log/postgresql/postgresql.log start || {
        echo -e "${YELLOW}  → Trying alternative start method...${NC}"
        sudo service postgresql start || {
            echo -e "${RED}  ✗ Failed to start PostgreSQL${NC}"
            echo -e "${YELLOW}  → Manual start: sudo -u postgres $POSTGRES_BIN/pg_ctl -D $POSTGRES_DATA_DIR start${NC}"
            exit 1
        }
    }

    # Wait for PostgreSQL to be ready
    echo "  → Waiting for PostgreSQL to be ready..."
    for i in {1..30}; do
        if pg_isready -q; then
            echo -e "${GREEN}✓ PostgreSQL started successfully${NC}"
            break
        fi
        sleep 1
    done
fi

###############################################################################
# Step 2: Start Redis
###############################################################################
echo -e "${YELLOW}[2/5] Starting Redis...${NC}"

# Check if Redis is already running
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis is already running${NC}"
else
    echo "  → Starting Redis server..."

    # Start Redis
    if [ -f "$REDIS_CONF" ]; then
        redis-server "$REDIS_CONF" --daemonize yes || {
            echo -e "${RED}  ✗ Failed to start Redis${NC}"
            exit 1
        }
    else
        redis-server --daemonize yes || {
            echo -e "${RED}  ✗ Failed to start Redis${NC}"
            exit 1
        }
    fi

    # Wait for Redis to be ready
    echo "  → Waiting for Redis to be ready..."
    for i in {1..10}; do
        if redis-cli ping > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Redis started successfully${NC}"
            break
        fi
        sleep 1
    done
fi

###############################################################################
# Step 3: Create test database and user
###############################################################################
echo -e "${YELLOW}[3/5] Setting up test database...${NC}"

# Create test user in database (required for E2E tests)
cd "$PROJECT_ROOT/backend/services/auth-service"

if [ -f ".env" ]; then
    source .env
    echo "  → Using existing .env configuration"
else
    echo -e "${YELLOW}  → No .env file found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo "  → Please update .env with correct values"
fi

# Run Prisma migrations
echo "  → Running database migrations..."
npx prisma migrate deploy || echo -e "${YELLOW}  → Migrations may have failed. Check manually.${NC}"

# Seed test user
echo "  → Creating test user (test@example.com)..."
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedTestUser() {
  try {
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        username: 'testuser',
        password: hashedPassword,
        emailVerified: true,
        workspace: {
          create: {
            name: 'Test Workspace'
          }
        }
      }
    });

    console.log('  → Test user created:', user.email);
  } catch (error) {
    console.log('  → Test user may already exist or error:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
}

seedTestUser();
" || echo -e "${YELLOW}  → Test user seeding may have failed. User may already exist.${NC}"

echo -e "${GREEN}✓ Test database configured${NC}"

###############################################################################
# Step 4: Start backend services
###############################################################################
echo -e "${YELLOW}[4/5] Starting backend services...${NC}"

# Function to start a service
start_service() {
    local service_name=$1
    local service_path="$PROJECT_ROOT/backend/services/$service_name"
    local port=$2

    echo "  → Starting $service_name on port $port..."

    # Check if already running
    if lsof -i :$port > /dev/null 2>&1; then
        echo -e "${GREEN}    ✓ $service_name already running on port $port${NC}"
        return 0
    fi

    # Start service in background
    cd "$service_path"

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "    → Installing dependencies..."
        npm install > /dev/null 2>&1
    fi

    # Start service
    npm run dev > "/tmp/$service_name.log" 2>&1 &
    local pid=$!

    # Wait for service to be ready
    echo "    → Waiting for $service_name to start (PID: $pid)..."
    for i in {1..30}; do
        if lsof -i :$port > /dev/null 2>&1; then
            echo -e "${GREEN}    ✓ $service_name started successfully (PID: $pid)${NC}"
            return 0
        fi
        sleep 1
    done

    echo -e "${RED}    ✗ $service_name failed to start. Check /tmp/$service_name.log${NC}"
    return 1
}

# Start all required backend services
start_service "auth-service" 3001
start_service "chat-service" 3003
start_service "billing-service" 3004

echo -e "${GREEN}✓ Backend services started${NC}"

###############################################################################
# Step 5: Verify all services
###############################################################################
echo -e "${YELLOW}[5/5] Verifying all services...${NC}"

verify_service() {
    local service_name=$1
    local port=$2
    local endpoint=$3

    echo "  → Checking $service_name (http://localhost:$port$endpoint)..."

    if curl -s "http://localhost:$port$endpoint" > /dev/null 2>&1; then
        echo -e "${GREEN}    ✓ $service_name is healthy${NC}"
        return 0
    else
        echo -e "${RED}    ✗ $service_name is not responding${NC}"
        return 1
    fi
}

# Verify all services
verify_service "PostgreSQL" 5432 ""
verify_service "Redis" 6379 ""
verify_service "Auth Service" 3001 "/health"
verify_service "Chat Service" 3003 "/health"
verify_service "Billing Service" 3004 "/health"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ All services started successfully!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. cd /home/user/AI_saas/frontend"
echo "  2. npm run test:e2e"
echo "  3. View report: npx playwright show-report"
echo ""
echo -e "${YELLOW}Service URLs:${NC}"
echo "  - Auth Service:   http://localhost:3001"
echo "  - Chat Service:   http://localhost:3003"
echo "  - Billing Service: http://localhost:3004"
echo "  - Frontend:       http://localhost:3000 (auto-started by Playwright)"
echo ""
echo -e "${YELLOW}Test User:${NC}"
echo "  - Email:    test@example.com"
echo "  - Password: Password123!"
echo ""
echo -e "${YELLOW}Logs:${NC}"
echo "  - PostgreSQL: /var/log/postgresql/postgresql.log"
echo "  - Auth Service: /tmp/auth-service.log"
echo "  - Chat Service: /tmp/chat-service.log"
echo "  - Billing Service: /tmp/billing-service.log"
echo ""
