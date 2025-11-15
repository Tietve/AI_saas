#!/bin/bash

set -e

echo "🚀 Starting test infrastructure..."

# Navigate to tests directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Start Docker Compose services
echo "📦 Starting Docker containers..."
docker-compose -f docker-compose.test.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
timeout=60
elapsed=0

while [ $elapsed -lt $timeout ]; do
  postgres_healthy=$(docker inspect --format='{{.State.Health.Status}}' postgres-test 2>/dev/null || echo "starting")
  redis_healthy=$(docker inspect --format='{{.State.Health.Status}}' redis-test 2>/dev/null || echo "starting")

  if [ "$postgres_healthy" = "healthy" ] && [ "$redis_healthy" = "healthy" ]; then
    echo "✅ All services are healthy!"
    break
  fi

  echo "⏳ Still waiting... ($elapsed/$timeout seconds)"
  sleep 2
  elapsed=$((elapsed + 2))
done

if [ $elapsed -ge $timeout ]; then
  echo "❌ Timeout waiting for services to be healthy"
  docker-compose -f docker-compose.test.yml ps
  exit 1
fi

# Show service status
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.test.yml ps

echo ""
echo "✅ Test infrastructure is ready!"
echo ""
echo "📝 Connection details:"
echo "  PostgreSQL: postgresql://test_user:test_password@localhost:5433/test_db"
echo "  Redis:      redis://localhost:6380"
echo "  MinIO:      http://localhost:9002 (Console: http://localhost:9003)"
echo ""
