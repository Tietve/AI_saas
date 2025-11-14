#!/bin/bash
# ==========================================
# Cleanup Script for Vercel Deployment
# ==========================================
# Purpose: Remove unnecessary files before deploying to Vercel
# This reduces project size from 2GB+ to < 500MB
# ==========================================

set -e  # Exit on error

echo "🧹 Starting cleanup for Vercel deployment..."
echo ""

# ==========================================
# 1. Remove Build Artifacts
# ==========================================
echo "📦 Removing build artifacts..."
rm -rf .next
rm -rf out
rm -rf build
rm -rf dist
rm -rf .vercel
rm -rf *.tsbuildinfo
echo "✅ Build artifacts removed"
echo ""

# ==========================================
# 2. Remove Node Modules Cache
# ==========================================
echo "🗑️  Removing node_modules cache..."
rm -rf node_modules/.cache
echo "✅ Cache removed"
echo ""

# ==========================================
# 3. Remove Test Files
# ==========================================
echo "🧪 Removing test files..."
rm -rf coverage
rm -rf .nyc_output
rm -rf __tests__
rm -f test-*.js test-*.html test-*.pdf test-*.txt
rm -f *.report.html
echo "✅ Test files removed"
echo ""

# ==========================================
# 4. Remove Storybook
# ==========================================
echo "📚 Removing Storybook files..."
rm -rf storybook-static
rm -f *storybook.log
echo "✅ Storybook files removed"
echo ""

# ==========================================
# 5. Remove Logs
# ==========================================
echo "📝 Removing log files..."
rm -f *.log
rm -f npm-debug.log*
rm -f yarn-debug.log*
rm -f yarn-error.log*
rm -f .pnpm-debug.log*
echo "✅ Log files removed"
echo ""

# ==========================================
# 6. Remove Backups
# ==========================================
echo "💾 Removing backup files..."
rm -rf *_backup
rm -rf src_clean
rm -f *.backup *.bak *.tmp *.temp
echo "✅ Backup files removed"
echo ""

# ==========================================
# 7. Remove Uploads (optional - uncomment if needed)
# ==========================================
# echo "📁 Removing uploaded files..."
# rm -rf public/uploads/*
# touch public/uploads/.gitkeep
# echo "✅ Uploads removed"
# echo ""

# ==========================================
# Check Final Size
# ==========================================
echo "📊 Checking project size..."
echo ""
echo "Current directory size (excluding node_modules):"
du -sh --exclude=node_modules . 2>/dev/null || echo "Cannot calculate size (Windows?)"
echo ""

echo "✨ Cleanup completed!"
echo ""
echo "📝 Next steps:"
echo "1. Run: npm run build (to test if build works)"
echo "2. Run: vercel --prod (to deploy)"
echo ""
