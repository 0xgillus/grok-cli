#!/bin/bash

# Build script for grok-cli monorepo

set -e

echo "🏗️  Building Grok CLI..."

# Build packages in dependency order
echo "📦 Building shared package..."
cd packages/shared
npm run build
cd ../..

echo "📦 Building core package..."
cd packages/core
npm run build
cd ../..

echo "📦 Building CLI package..."
cd packages/cli
npm run build
cd ../..

echo "✅ Build complete!"

# Make the CLI executable
chmod +x packages/cli/dist/bin/grok.js

echo "🎉 Grok CLI is ready to use!"
echo ""
echo "To test locally:"
echo "  cd packages/cli && npm start"
echo ""
echo "To install globally:"
echo "  npm link"
