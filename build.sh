#!/bin/bash

echo "🚀 Azure Build Script Starting..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --omit=dev --legacy-peer-deps || npm install --omit=dev --legacy-peer-deps

# Generate Prisma Client
echo "🗄️ Generating Prisma Client..."
npx prisma generate

# The app is already built in .next folder
echo "✅ Build completed (using pre-built .next folder)"
echo "🎯 Ready to start with: npm start"