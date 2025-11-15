#!/bin/bash

###############################################################################
# E2E Test Mock Verification Script
#
# This script verifies that E2E tests are not making real API calls.
# Run this before committing changes to ensure cost-free testing.
#
# Usage: ./verify-mocks.sh
###############################################################################

set -e  # Exit on error

echo "=================================================="
echo "🔍 E2E Test Mock Verification"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

###############################################################################
# Test 1: Verify jest.setup.js exists and has mocks
###############################################################################
echo "Test 1: Checking jest.setup.js exists..."
if [ -f "jest.setup.js" ]; then
    echo -e "${GREEN}✓ jest.setup.js found${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ jest.setup.js not found${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

###############################################################################
# Test 2: Verify OpenAI mock exists
###############################################################################
echo "Test 2: Checking OpenAI mock..."
if grep -q "jest.mock('openai'" jest.setup.js; then
    echo -e "${GREEN}✓ OpenAI mock configured${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ OpenAI mock missing${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

###############################################################################
# Test 3: Verify Stripe mock exists
###############################################################################
echo "Test 3: Checking Stripe mock..."
if grep -q "jest.mock('stripe'" jest.setup.js; then
    echo -e "${GREEN}✓ Stripe mock configured${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ Stripe mock missing${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

###############################################################################
# Test 4: Verify Anthropic mock exists
###############################################################################
echo "Test 4: Checking Anthropic mock..."
if grep -q "jest.mock('@anthropic-ai/sdk'" jest.setup.js; then
    echo -e "${GREEN}✓ Anthropic mock configured${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠ Anthropic mock missing (optional)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

###############################################################################
# Test 5: Verify mock API keys are set
###############################################################################
echo "Test 5: Checking mock environment variables..."
if grep -q "process.env.OPENAI_API_KEY.*=.*'sk-test-mock-key'" jest.setup.js; then
    echo -e "${GREEN}✓ Mock OPENAI_API_KEY set${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ Mock OPENAI_API_KEY not set${NC}"
    FAILED=$((FAILED + 1))
fi

if grep -q "process.env.STRIPE_SECRET_KEY.*=.*'sk_test_mock_key'" jest.setup.js; then
    echo -e "${GREEN}✓ Mock STRIPE_SECRET_KEY set${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ Mock STRIPE_SECRET_KEY not set${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

###############################################################################
# Test 6: Run tests and check for real API calls
###############################################################################
echo "Test 6: Running E2E tests and checking for real API calls..."
echo "   (This may take 30-60 seconds)"
echo ""

# Run tests and capture output
TEST_OUTPUT=$(npm test 2>&1 || true)

# Check for real API URLs in output
if echo "$TEST_OUTPUT" | grep -qi "api\.openai\.com\|api\.stripe\.com\|api\.anthropic\.com"; then
    echo -e "${RED}✗ Real API calls detected in test output!${NC}"
    echo ""
    echo "Found these API calls:"
    echo "$TEST_OUTPUT" | grep -i "api\.openai\.com\|api\.stripe\.com\|api\.anthropic\.com"
    FAILED=$((FAILED + 1))
else
    echo -e "${GREEN}✓ No real API calls detected${NC}"
    PASSED=$((PASSED + 1))
fi
echo ""

###############################################################################
# Test 7: Check for mock responses in output
###############################################################################
echo "Test 7: Checking for mock responses in test output..."
if echo "$TEST_OUTPUT" | grep -q "MOCK"; then
    echo -e "${GREEN}✓ Mock responses found in output${NC}"
    PASSED=$((PASSED + 1))

    # Count mock responses
    MOCK_COUNT=$(echo "$TEST_OUTPUT" | grep -c "MOCK" || echo "0")
    echo "   Found $MOCK_COUNT mock response(s)"
else
    echo -e "${YELLOW}⚠ No mock responses found (tests might be using real services)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

###############################################################################
# Test 8: Check test execution time
###############################################################################
echo "Test 8: Checking test execution time..."
# Extract test duration from output
if echo "$TEST_OUTPUT" | grep -q "Time:"; then
    TEST_TIME=$(echo "$TEST_OUTPUT" | grep "Time:" | tail -1 || echo "Time: unknown")
    echo "   $TEST_TIME"

    # Warn if tests took too long (might indicate network calls)
    if echo "$TEST_OUTPUT" | grep -q "Time:.*[0-9]\{2,\}s"; then
        echo -e "${YELLOW}⚠ Tests took >10s (might indicate network calls)${NC}"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✓ Test execution time reasonable${NC}"
        PASSED=$((PASSED + 1))
    fi
else
    echo -e "${YELLOW}⚠ Could not determine test execution time${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

###############################################################################
# Test 9: Check jest.config.js references setup file
###############################################################################
echo "Test 9: Checking jest.config.js setup..."
if grep -q "setupFilesAfterEnv.*jest.setup.js" jest.config.js; then
    echo -e "${GREEN}✓ jest.config.js correctly references setup file${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ jest.config.js does not reference jest.setup.js${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

###############################################################################
# Test 10: Check for .env files with real API keys
###############################################################################
echo "Test 10: Checking for .env files with real API keys..."
ENV_WARNING=false

if [ -f ".env" ]; then
    if grep -q "OPENAI_API_KEY=sk-[a-zA-Z0-9]" .env 2>/dev/null; then
        echo -e "${YELLOW}⚠ Found real OpenAI API key in .env${NC}"
        echo "   Make sure tests use mock key from jest.setup.js"
        ENV_WARNING=true
    fi

    if grep -q "STRIPE_SECRET_KEY=sk_live" .env 2>/dev/null; then
        echo -e "${YELLOW}⚠ Found LIVE Stripe key in .env${NC}"
        echo "   Make sure tests use mock key from jest.setup.js"
        ENV_WARNING=true
    fi
fi

if [ "$ENV_WARNING" = false ]; then
    echo -e "${GREEN}✓ No real API keys detected in .env${NC}"
    PASSED=$((PASSED + 1))
else
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

###############################################################################
# Summary
###############################################################################
echo "=================================================="
echo "📊 Verification Summary"
echo "=================================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo -e "${GREEN}✓ E2E tests are properly mocked.${NC}"
    echo -e "${GREEN}✓ Estimated cost during testing: \$0${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some checks failed!${NC}"
    echo -e "${RED}✗ Real API calls might be made during testing.${NC}"
    echo ""
    echo "To fix:"
    echo "1. Check jest.setup.js has all required mocks"
    echo "2. Ensure mock API keys are set"
    echo "3. Review MOCKING_GUIDE.md for troubleshooting"
    echo ""
    exit 1
fi
