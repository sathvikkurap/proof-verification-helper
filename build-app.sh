#!/bin/bash

# Build script for Proof Verification Helper standalone application

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     Building Proof Verification Helper Standalone App       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Setup Ollama automatically
echo "Setting up Ollama for AI-powered suggestions..."
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    if command -v ./setup-ollama.bat &> /dev/null; then
        ./setup-ollama.bat
    else
        echo "⚠️  Ollama setup script not found. AI suggestions will use fallback mode."
    fi
else
    # macOS/Linux
    if [ -f "./setup-ollama.sh" ]; then
        chmod +x ./setup-ollama.sh
        ./setup-ollama.sh
    else
        echo "⚠️  Ollama setup script not found. AI suggestions will use fallback mode."
    fi
fi

# Check if Electron is installed
if ! command -v electron &> /dev/null; then
    echo "Installing Electron..."
    cd electron && npm install
    cd ..
fi

# Build backend
echo "Building backend..."
cd backend
npm run build
cd ..

# Build frontend
echo "Building frontend..."
cd frontend
npm run build
cd ..

# Build Electron app
echo "Building Electron application..."
cd electron
npm run build

echo ""
echo "✅ Build complete! Check electron/dist/ for the application."
echo ""
echo "🎉 Your Proof Verification Helper now includes automatic AI setup!"
echo "The app will use Ollama for enhanced proof suggestions when available."
echo ""

