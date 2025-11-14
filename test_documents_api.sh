#!/bin/bash

echo "========================================="
echo "Phase 3: Documents Feature API Tests"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASS=0
FAIL=0

test_endpoint() {
  local name=$1
  local method=$2
  local url=$3
  local data=$4
  local expected_code=$5
  
  echo -n "Testing: $name ... "
  
  if [ -z "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X $method "$url" 2>&1)
  else
    response=$(curl -s -w "\n%{http_code}" -X $method -H "Content-Type: application/json" -d "$data" "$url" 2>&1)
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" = "$expected_code" ]; then
    echo -e "${GREEN}PASS${NC} (HTTP $http_code)"
    ((PASS++))
  else
    echo -e "${RED}FAIL${NC} (Expected HTTP $expected_code, got $http_code)"
    echo "  Response: $body"
    ((FAIL++))
  fi
}

echo "1. HEALTH CHECKS"
echo "----------------"
test_endpoint "API Gateway Health" "GET" "http://localhost:4000/health" "" "200"
test_endpoint "Orchestrator Health" "GET" "http://localhost:3006/health" "" "200"
echo ""

echo "2. DOCUMENT ENDPOINTS (Direct to Orchestrator)"
echo "------------------------------------------------"
test_endpoint "GET /api/documents/stats" "GET" "http://localhost:3006/api/documents/stats" "" "200"
test_endpoint "POST /api/documents/search" "POST" "http://localhost:3006/api/documents/search" '{"query":"test","topK":5}' "200"
test_endpoint "POST /api/documents/fetch (empty)" "POST" "http://localhost:3006/api/documents/fetch" '{"ids":[]}' "200"
echo ""

echo "3. DOCUMENT ENDPOINTS (Via API Gateway)"
echo "-----------------------------------------"
test_endpoint "GET /api/documents/stats" "GET" "http://localhost:4000/api/documents/stats" "" "200"
test_endpoint "POST /api/documents/search" "POST" "http://localhost:4000/api/documents/search" '{"query":"test","topK":5}' "200"
echo ""

echo "4. EXPECTED FAILING ENDPOINTS (Frontend expects these)"
echo "--------------------------------------------------------"
test_endpoint "GET /api/documents (list)" "GET" "http://localhost:3006/api/documents" "" "200"
test_endpoint "GET /api/documents/:id" "GET" "http://localhost:3006/api/documents/test-id" "" "200"
test_endpoint "DELETE /api/documents/:id" "DELETE" "http://localhost:3006/api/documents/test-id" "" "200"
echo ""

echo "========================================="
echo "TEST SUMMARY"
echo "========================================="
echo -e "${GREEN}PASSED: $PASS${NC}"
echo -e "${RED}FAILED: $FAIL${NC}"
echo ""
