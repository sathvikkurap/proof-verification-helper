#!/bin/bash

# Simple launcher for Proof Verification Helper
# For non-technical users - just double-click or run this script

echo "🚀 Starting Proof Verification Helper..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

# Navigate to project directory
cd "$(dirname "$0")"

# Check if dependencies are installed
if [ ! -d "node_modules" ] || [ ! -d "frontend/node_modules" ] || [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing dependencies (first time only, this may take a few minutes)..."
    npm run install:all
    echo ""
fi

# Start the application
echo "✅ Starting application..."
echo "🌐 The app will open in your browser at http://localhost:3000"
echo "⏳ Please wait 10-15 seconds for everything to start..."
echo ""

npm run dev

