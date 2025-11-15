#!/bin/bash

set -e

echo "🛑 Stopping test infrastructure..."

# Navigate to tests directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Stop and remove Docker Compose services
echo "📦 Stopping Docker containers..."
docker-compose -f docker-compose.test.yml down

# Optionally remove volumes (uncomment to clean all data)
# echo "🗑️  Removing volumes..."
# docker-compose -f docker-compose.test.yml down -v

echo ""
echo "✅ Test infrastructure stopped!"
echo ""
echo "💡 Tip: To remove all data, run:"
echo "   docker-compose -f docker-compose.test.yml down -v"
echo ""
