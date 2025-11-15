#!/bin/bash

set -e

echo "🔍 Validating Docker Compose configuration..."
echo ""

# Navigate to tests directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
  echo "⚠️  Docker Compose not found. Skipping validation."
  echo "   (This is OK - validation will happen when Docker is available)"
  exit 0
fi

# Validate docker-compose.test.yml syntax
echo "📋 Validating docker-compose.test.yml syntax..."
if docker-compose -f docker-compose.test.yml config > /dev/null 2>&1; then
  echo "  ✅ Docker Compose configuration is valid"
else
  echo "  ❌ Docker Compose configuration has errors"
  docker-compose -f docker-compose.test.yml config
  exit 1
fi

echo ""

# Check for port conflicts
echo "🔌 Checking for port conflicts..."
ports=(5433 6380 9002 9003)

for port in "${ports[@]}"; do
  if netstat -tuln 2>/dev/null | grep -q ":$port "; then
    echo "  ⚠️  Port $port is already in use"
  elif lsof -i :$port 2>/dev/null | grep -q LISTEN; then
    echo "  ⚠️  Port $port is already in use"
  else
    echo "  ✅ Port $port is available"
  fi
done

echo ""
echo "✅ Configuration validation complete!"
