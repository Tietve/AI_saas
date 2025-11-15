#!/bin/bash

set -e

echo "🗑️  Cleaning up test infrastructure..."

# Navigate to tests directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Stop and remove everything including volumes
echo "📦 Stopping containers and removing volumes..."
docker-compose -f docker-compose.test.yml down -v

# Remove any dangling volumes
echo "🧹 Cleaning up dangling volumes..."
docker volume prune -f

echo ""
echo "✅ Test infrastructure cleaned up!"
echo "   - All containers stopped and removed"
echo "   - All volumes removed"
echo "   - Dangling volumes pruned"
echo ""
