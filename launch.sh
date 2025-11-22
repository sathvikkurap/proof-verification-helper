#!/bin/bash

# One-click launcher for Proof Verification Helper
# This script automatically sets up everything and starts the application

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              Proof Verification Helper Launcher             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "🚀 Starting Proof Verification Helper with AI support..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the proof-verification-helper directory"
    exit 1
fi

# Install all dependencies and setup Ollama
echo "📦 Installing dependencies and setting up AI..."
npm run install:all

if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  Some setup steps failed, but continuing anyway..."
    echo "The app will work with basic AI suggestions."
    echo ""
fi

# Start the application
echo "🎯 Starting the application..."
npm run dev

echo ""
echo "✅ Application started! Open http://localhost:3000 in your browser."
echo ""
echo "💡 Pro tip: The app automatically uses AI for proof suggestions when available!"