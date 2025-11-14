#!/bin/bash
# ==========================================
# Vercel Deployment Script
# ==========================================
# Purpose: Clean, verify, and deploy to Vercel
# ==========================================

set -e  # Exit on error

echo "🚀 Starting Vercel deployment process..."
echo ""

# ==========================================
# 1. Check if Vercel CLI is installed
# ==========================================
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found!"
    echo "📦 Installing Vercel CLI globally..."
    npm install -g vercel
    echo "✅ Vercel CLI installed"
    echo ""
fi

# ==========================================
# 2. Run Cleanup
# ==========================================
echo "🧹 Running cleanup script..."
bash scripts/cleanup-for-deploy.sh
echo ""

# ==========================================
# 3. Verify Environment Variables
# ==========================================
echo "🔍 Verifying environment variables..."
if [ -f ".env.vercel" ]; then
    echo "✅ .env.vercel found"
    echo "⚠️  REMEMBER: You need to manually set these in Vercel Dashboard!"
    echo "   → https://vercel.com/dashboard → Project → Settings → Environment Variables"
else
    echo "⚠️  .env.vercel not found"
    echo "   Create .env.vercel with your environment variables"
fi
echo ""

# ==========================================
# 4. Type Check (Optional - Skip if errors)
# ==========================================
echo "🔍 Running type check..."
npm run type-check || {
    echo "⚠️  Type check failed, but continuing (ignoreBuildErrors: true)"
}
echo ""

# ==========================================
# 5. Test Build Locally
# ==========================================
echo "🏗️  Testing build locally..."
echo "This ensures build will succeed on Vercel..."
npm run build || {
    echo "❌ Build failed! Fix errors before deploying."
    exit 1
}
echo "✅ Build successful"
echo ""

# ==========================================
# 6. Prompt for Production Deploy
# ==========================================
echo "📋 Deployment Summary:"
echo "   - Project: my-saas-chat"
echo "   - Target: Vercel Production"
echo "   - Domain: https://firbox.net (if configured)"
echo ""
read -p "🤔 Deploy to production? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying to Vercel Production..."
    vercel --prod
    echo ""
    echo "✅ Deployment completed!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Check deployment: vercel ls"
    echo "2. View logs: vercel logs <deployment-url>"
    echo "3. Test your app: https://firbox.net"
    echo ""
else
    echo "❌ Deployment cancelled"
    echo ""
    echo "💡 To deploy later, run:"
    echo "   vercel --prod"
    echo ""
fi
