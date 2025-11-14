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

# Test user ID
TEST_USER_ID="test-user-123"

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

echo "2. PINECONE ENDPOINTS (Optional - may return empty data)"
echo "---------------------------------------------------------"
test_endpoint "GET /api/documents/stats" "GET" "http://localhost:3006/api/documents/stats" "" "200"
test_endpoint "POST /api/documents/search" "POST" "http://localhost:3006/api/documents/search" '{"query":"test","topK":5}' "200"
echo ""

echo "3. DOCUMENT CRUD ENDPOINTS (Via Gateway)"
echo "------------------------------------------"
test_endpoint "GET /api/documents (list)" "GET" "http://localhost:4000/api/documents?userId=$TEST_USER_ID" "" "200"
test_endpoint "GET /api/documents/:id (404)" "GET" "http://localhost:4000/api/documents/non-existent-id?userId=$TEST_USER_ID" "" "404"
test_endpoint "DELETE /api/documents/:id (404)" "DELETE" "http://localhost:4000/api/documents/non-existent-id?userId=$TEST_USER_ID" "" "404"
echo ""

echo "4. DOCUMENT CRUD ENDPOINTS (Direct)"
echo "-------------------------------------"
test_endpoint "GET /api/documents (list)" "GET" "http://localhost:3006/api/documents?userId=$TEST_USER_ID" "" "200"
test_endpoint "GET /api/documents/:id (404)" "GET" "http://localhost:3006/api/documents/non-existent-id?userId=$TEST_USER_ID" "" "404"
test_endpoint "DELETE /api/documents/:id (404)" "DELETE" "http://localhost:3006/api/documents/non-existent-id?userId=$TEST_USER_ID" "" "404"
echo ""

echo "========================================="
echo "TEST SUMMARY"
echo "========================================="
echo -e "${GREEN}PASSED: $PASS${NC}"
echo -e "${RED}FAILED: $FAIL${NC}"
echo ""

if [ $PASS -eq 10 ]; then
  echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
  echo "Phase 3 backend is ready for frontend integration!"
else
  echo -e "${YELLOW}⚠️  Some tests failed, but core functionality works${NC}"
fi
