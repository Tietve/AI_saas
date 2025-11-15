#!/bin/bash

echo "==================================="
echo "Document Service Test Setup & Run"
echo "==================================="
echo ""

echo "Step 1: Regenerating Prisma Client..."
cd /home/user/AI_saas/backend/services/chat-service

# Try to generate Prisma client
npx prisma generate 2>&1

if [ $? -ne 0 ]; then
  echo "⚠️  Prisma generation failed. Trying offline mode..."
  PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate
fi

echo ""
echo "Step 2: Running all tests..."
npm test

echo ""
echo "Step 3: Generating coverage report..."
npm test -- --coverage

echo ""
echo "✅ Done! Check coverage/index.html for detailed coverage report."
