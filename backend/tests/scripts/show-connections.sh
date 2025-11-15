#!/bin/bash

echo "🔗 Test Infrastructure Connection Details"
echo "=========================================="
echo ""

echo "📊 PostgreSQL Test Database"
echo "  Host:     localhost"
echo "  Port:     5433"
echo "  Database: test_db"
echo "  User:     test_user"
echo "  Password: test_password"
echo "  URL:      postgresql://test_user:test_password@localhost:5433/test_db"
echo ""

echo "🔴 Redis Test Cache"
echo "  Host: localhost"
echo "  Port: 6380"
echo "  URL:  redis://localhost:6380"
echo ""

echo "📦 MinIO Test Storage (S3-compatible)"
echo "  API Endpoint:     http://localhost:9002"
echo "  Console URL:      http://localhost:9003"
echo "  Access Key:       minioadmin"
echo "  Secret Key:       minioadmin"
echo "  Default Bucket:   test-documents"
echo ""

echo "🔧 Quick Test Commands"
echo "======================"
echo ""

echo "PostgreSQL:"
echo "  psql postgresql://test_user:test_password@localhost:5433/test_db"
echo ""

echo "Redis:"
echo "  redis-cli -p 6380"
echo ""

echo "MinIO:"
echo "  Open http://localhost:9003 in browser"
echo "  Login with: minioadmin / minioadmin"
echo ""
