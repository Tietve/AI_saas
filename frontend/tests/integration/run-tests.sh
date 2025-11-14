#!/bin/bash

# Integration Tests Runner Script
# Usage: ./run-tests.sh [option]
# Options: all, auth, chat, billing, health

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Integration Tests Runner${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Check if services are running
echo -e "${YELLOW}Checking services...${NC}"
check_service() {
  local url=$1
  local name=$2
  if curl -s -f -o /dev/null "$url"; then
    echo -e "  ${GREEN}✓${NC} $name is running"
    return 0
  else
    echo -e "  ${RED}✗${NC} $name is not running"
    return 1
  fi
}

services_running=true
check_service "http://localhost:4000/health" "API Gateway" || services_running=false
check_service "http://localhost:3001/health" "Auth Service" || services_running=false
check_service "http://localhost:3003/health" "Chat Service" || services_running=false
check_service "http://localhost:3004/health" "Billing Service" || services_running=false

echo ""

if [ "$services_running" = false ]; then
  echo -e "${RED}⚠️  Some services are not running!${NC}"
  echo -e "${YELLOW}💡 Start services with: npm run docker:up && npm run dev:all${NC}"
  echo ""
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Get test option
option=${1:-all}

echo -e "${BLUE}Running tests...${NC}"
echo ""

case $option in
  "all")
    echo -e "${GREEN}Running all integration tests${NC}"
    npx playwright test tests/integration/
    ;;
  "auth")
    echo -e "${GREEN}Running Auth API tests${NC}"
    npx playwright test tests/integration/auth-api.spec.ts
    ;;
  "chat")
    echo -e "${GREEN}Running Chat API tests${NC}"
    npx playwright test tests/integration/chat-api.spec.ts
    ;;
  "billing")
    echo -e "${GREEN}Running Billing API tests${NC}"
    npx playwright test tests/integration/billing-api.spec.ts
    ;;
  "health")
    echo -e "${GREEN}Running Health Check tests${NC}"
    npx playwright test tests/integration/services-health.spec.ts
    ;;
  "ui")
    echo -e "${GREEN}Running tests with UI${NC}"
    npx playwright test tests/integration/ --ui
    ;;
  "headed")
    echo -e "${GREEN}Running tests in headed mode${NC}"
    npx playwright test tests/integration/ --headed
    ;;
  *)
    echo -e "${RED}Unknown option: $option${NC}"
    echo -e "${YELLOW}Usage: ./run-tests.sh [all|auth|chat|billing|health|ui|headed]${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}✓ Tests completed${NC}"
echo ""
echo -e "${YELLOW}View report: npx playwright show-report${NC}"
