#!/bin/bash

# Billing E2E Tests Runner
# Quick commands to run billing tests

echo "======================================"
echo "  Billing E2E Tests Runner"
echo "======================================"
echo ""

# Check if playwright is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js"
    exit 1
fi

# Show menu
echo "Select test suite to run:"
echo ""
echo "  1) All billing tests"
echo "  2) Pricing page tests only"
echo "  3) Subscription page tests only"
echo "  4) Usage statistics tests only"
echo "  5) Run in UI mode (interactive)"
echo "  6) Run with headed browser"
echo "  7) Run in debug mode"
echo "  8) Generate HTML report"
echo ""
echo "  0) Exit"
echo ""

read -p "Enter your choice [0-8]: " choice

case $choice in
    1)
        echo ""
        echo "Running all billing tests..."
        npx playwright test tests/e2e/billing
        ;;
    2)
        echo ""
        echo "Running pricing page tests..."
        npx playwright test tests/e2e/billing/pricing-page.spec.ts
        ;;
    3)
        echo ""
        echo "Running subscription page tests..."
        npx playwright test tests/e2e/billing/subscription.spec.ts
        ;;
    4)
        echo ""
        echo "Running usage statistics tests..."
        npx playwright test tests/e2e/billing/usage-stats.spec.ts
        ;;
    5)
        echo ""
        echo "Opening Playwright UI mode..."
        npx playwright test tests/e2e/billing --ui
        ;;
    6)
        echo ""
        echo "Running tests with headed browser..."
        npx playwright test tests/e2e/billing --headed
        ;;
    7)
        echo ""
        echo "Running tests in debug mode..."
        npx playwright test tests/e2e/billing --debug
        ;;
    8)
        echo ""
        echo "Generating HTML report..."
        npx playwright show-report
        ;;
    0)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please try again."
        exit 1
        ;;
esac

echo ""
echo "✅ Done!"
