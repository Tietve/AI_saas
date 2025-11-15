#!/bin/bash

###############################################################################
# E2E Test Infrastructure Startup Script (Container-Friendly, No Sudo)
#
# This script starts backend services for E2E tests.
# Note: PostgreSQL and Redis should be started separately or use Docker.
#
# Usage: ./start-test-infrastructure-no-sudo.sh
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="/home/user/AI_saas"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   E2E Test Infrastructure Startup${NC}"
echo -e "${BLUE}   (Container-Friendly Version)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

###############################################################################
# Step 1: Check PostgreSQL and Redis
###############################################################################
echo -e "${YELLOW}[1/4] Checking database services...${NC}"

# Check PostgreSQL
if pg_isready -q 2>/dev/null; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
else
    echo -e "${RED}✗ PostgreSQL is NOT running${NC}"
    echo -e "${YELLOW}  → Please start PostgreSQL manually or use Docker:${NC}"
    echo "     docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16"
    POSTGRES_MISSING=true
fi

# Check Redis
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis is running${NC}"
else
    echo -e "${RED}✗ Redis is NOT running${NC}"
    echo -e "${YELLOW}  → Please start Redis manually or use Docker:${NC}"
    echo "     docker run -d -p 6379:6379 redis:7-alpine"
    REDIS_MISSING=true
fi

if [ "$POSTGRES_MISSING" = true ] || [ "$REDIS_MISSING" = true ]; then
    echo ""
    echo -e "${YELLOW}Would you like to continue without database services? (tests will fail)${NC}"
    echo -e "${YELLOW}Press Ctrl+C to cancel, or Enter to continue...${NC}"
    read
fi

###############################################################################
# Step 2: Setup backend services
###############################################################################
echo -e "${YELLOW}[2/4] Preparing backend services...${NC}"

prepare_service() {
    local service_name=$1
    local service_path="$PROJECT_ROOT/backend/services/$service_name"

    echo "  → Preparing $service_name..."
    cd "$service_path"

    # Check if .env exists
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            echo "    → Creating .env from .env.example"
            cp .env.example .env
        else
            echo -e "${YELLOW}    → No .env or .env.example found${NC}"
        fi
    fi

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "    → Installing dependencies..."
        npm install > /dev/null 2>&1 || echo -e "${YELLOW}    → npm install may have failed${NC}"
    fi

    echo -e "${GREEN}    ✓ $service_name prepared${NC}"
}

prepare_service "auth-service"
prepare_service "chat-service"
prepare_service "billing-service"

###############################################################################
# Step 3: Start backend services
###############################################################################
echo -e "${YELLOW}[3/4] Starting backend services...${NC}"

# Kill any existing service processes
pkill -f "auth-service" 2>/dev/null || true
pkill -f "chat-service" 2>/dev/null || true
pkill -f "billing-service" 2>/dev/null || true
sleep 2

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
    nohup npm run dev > "/tmp/$service_name.log" 2>&1 &
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
    echo -e "${YELLOW}    → Tail log: tail -f /tmp/$service_name.log${NC}"
    return 1
}

# Start all required backend services
start_service "auth-service" 3001 || true
start_service "chat-service" 3003 || true
start_service "billing-service" 3004 || true

echo -e "${GREEN}✓ Backend service startup attempted${NC}"

###############################################################################
# Step 4: Verify services
###############################################################################
echo -e "${YELLOW}[4/4] Verifying services...${NC}"

verify_service() {
    local service_name=$1
    local port=$2
    local endpoint=$3

    echo "  → Checking $service_name..."

    if lsof -i :$port > /dev/null 2>&1; then
        echo -e "${GREEN}    ✓ $service_name is listening on port $port${NC}"

        # Try HTTP health check if endpoint provided
        if [ ! -z "$endpoint" ]; then
            if curl -s -f "http://localhost:$port$endpoint" > /dev/null 2>&1; then
                echo -e "${GREEN}    ✓ $service_name health check passed${NC}"
            else
                echo -e "${YELLOW}    → $service_name is running but health check failed${NC}"
            fi
        fi
        return 0
    else
        echo -e "${RED}    ✗ $service_name is NOT running${NC}"
        return 1
    fi
}

# Verify all services
SERVICES_OK=true

verify_service "PostgreSQL" 5432 "" || SERVICES_OK=false
verify_service "Redis" 6379 "" || SERVICES_OK=false
verify_service "Auth Service" 3001 "/health" || SERVICES_OK=false
verify_service "Chat Service" 3003 "/health" || SERVICES_OK=false
verify_service "Billing Service" 3004 "/health" || SERVICES_OK=false

echo ""
echo -e "${BLUE}========================================${NC}"
if [ "$SERVICES_OK" = true ]; then
    echo -e "${GREEN}✓ All services are ready!${NC}"
else
    echo -e "${YELLOW}⚠ Some services failed to start${NC}"
    echo -e "${YELLOW}  Check logs in /tmp/*.log${NC}"
fi
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
echo -e "${YELLOW}Service Logs:${NC}"
echo "  - tail -f /tmp/auth-service.log"
echo "  - tail -f /tmp/chat-service.log"
echo "  - tail -f /tmp/billing-service.log"
echo ""
echo -e "${YELLOW}Stop services:${NC}"
echo "  - pkill -f auth-service"
echo "  - pkill -f chat-service"
echo "  - pkill -f billing-service"
echo ""
