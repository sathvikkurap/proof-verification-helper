#!/bin/bash

# Build script for Proof Verification Helper standalone application

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     Building Proof Verification Helper Standalone App       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

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

