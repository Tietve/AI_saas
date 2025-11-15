#!/bin/bash

set -e

echo "🔍 Verifying test infrastructure setup..."
echo ""

# Navigate to tests directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Check if required files exist
echo "📁 Checking required files..."

files=(
  "docker-compose.test.yml"
  ".env.test"
  "scripts/start-test-infra.sh"
  "scripts/stop-test-infra.sh"
  "scripts/cleanup-test-infra.sh"
)

missing_files=()
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (MISSING)"
    missing_files+=("$file")
  fi
done

echo ""

# Check if scripts are executable
echo "🔧 Checking script permissions..."
scripts=(
  "scripts/start-test-infra.sh"
  "scripts/stop-test-infra.sh"
  "scripts/cleanup-test-infra.sh"
)

non_executable=()
for script in "${scripts[@]}"; do
  if [ -x "$script" ]; then
    echo "  ✅ $script is executable"
  else
    echo "  ❌ $script is NOT executable"
    non_executable+=("$script")
  fi
done

echo ""

# Check Docker availability
echo "🐳 Checking Docker..."
if command -v docker &> /dev/null; then
  echo "  ✅ Docker is installed"
  docker --version

  if command -v docker-compose &> /dev/null; then
    echo "  ✅ Docker Compose is installed"
    docker-compose --version
  else
    echo "  ❌ Docker Compose is NOT installed"
  fi
else
  echo "  ❌ Docker is NOT installed"
  echo "  📝 Install Docker from: https://docs.docker.com/get-docker/"
fi

echo ""

# Summary
echo "📊 Summary"
echo "=========="

if [ ${#missing_files[@]} -eq 0 ] && [ ${#non_executable[@]} -eq 0 ]; then
  echo "✅ All files are in place and configured correctly!"
  echo ""
  echo "🚀 Next steps:"
  echo "   1. Ensure Docker is running"
  echo "   2. Run: npm run test:infra:start"
  echo "   3. Run: npm run test:integration"
  echo ""
else
  echo "❌ Setup incomplete. Please fix the following issues:"

  if [ ${#missing_files[@]} -gt 0 ]; then
    echo ""
    echo "Missing files:"
    printf '  - %s\n' "${missing_files[@]}"
  fi

  if [ ${#non_executable[@]} -gt 0 ]; then
    echo ""
    echo "Non-executable scripts (fix with: chmod +x <file>):"
    printf '  - %s\n' "${non_executable[@]}"
  fi

  exit 1
fi
