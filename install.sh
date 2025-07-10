#!/bin/bash

# Grok CLI Installation Script

set -e

echo "🚀 Installing Grok CLI..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ "$MAJOR_VERSION" -lt "18" ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: v$NODE_VERSION"
    echo "   Please upgrade Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js v$NODE_VERSION detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ npm detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Build the project
echo ""
echo "🏗️  Building Grok CLI..."
npm run build

# Link the CLI globally
echo ""
echo "🔗 Linking CLI globally..."
npm run link:cli

echo ""
echo "🎉 Installation complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Get your xAI API key from: https://console.x.ai/"
echo "   2. Run: grok-cli (or just: grok)"
echo "   3. Follow the setup wizard to configure your API key"
echo ""
echo "💡 You can also set your API key with:"
echo "   export GROK_API_KEY=\"your-key-here\""
echo ""
echo "🆘 Need help? Run: grok-cli --help"
echo ""
