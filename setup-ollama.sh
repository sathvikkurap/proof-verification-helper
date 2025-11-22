#!/bin/bash

# Automatic Ollama Setup Script for Proof Verification Helper
# This script automatically installs and configures Ollama with the recommended model

set -e  # Exit on any error

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║            Setting up Ollama for AI-Powered Proofs          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

OS=$(detect_os)
echo "Detected OS: $OS"

# Check if Ollama is already installed and running
check_ollama() {
    if command -v ollama &> /dev/null; then
        echo "✓ Ollama is already installed"

        # Check if Ollama is running
        if curl -s http://localhost:11434/api/tags &> /dev/null; then
            echo "✓ Ollama is running"
            return 0
        else
            echo "→ Starting Ollama..."
            if [[ "$OS" == "macos" ]]; then
                # Start Ollama in background
                nohup ollama serve > /dev/null 2>&1 &
                sleep 3
            else
                ollama serve &
                sleep 3
            fi
            return 0
        fi
    fi
    return 1
}

# Install Ollama
install_ollama() {
    echo "Installing Ollama..."

    case $OS in
        "macos")
            if command -v brew &> /dev/null; then
                echo "Using Homebrew to install Ollama..."
                brew install ollama
            else
                echo "Homebrew not found. Installing Ollama manually..."
                curl -fsSL https://ollama.ai/install.sh | sh
            fi
            ;;

        "linux")
            echo "Installing Ollama for Linux..."
            curl -fsSL https://ollama.ai/install.sh | sh
            ;;

        "windows")
            echo "Please install Ollama manually from: https://ollama.ai/download"
            echo "Then run this script again."
            exit 1
            ;;

        *)
            echo "Unsupported OS. Please install Ollama manually from: https://ollama.ai/download"
            exit 1
            ;;
    esac
}

# Start Ollama service
start_ollama() {
    echo "Starting Ollama service..."

    case $OS in
        "macos")
            # Start Ollama in background
            nohup ollama serve > /dev/null 2>&1 &
            sleep 5
            ;;

        "linux")
            # Try to start Ollama service
            if command -v systemctl &> /dev/null; then
                sudo systemctl start ollama 2>/dev/null || true
            fi

            # If systemctl didn't work, start manually
            if ! pgrep -f "ollama serve" > /dev/null; then
                nohup ollama serve > /dev/null 2>&1 &
                sleep 5
            fi
            ;;

        "windows")
            echo "Please start Ollama manually by running 'ollama serve' in a terminal"
            ;;
    esac
}

# Wait for Ollama to be ready
wait_for_ollama() {
    echo "Waiting for Ollama to be ready..."
    local attempts=0
    local max_attempts=30

    while [ $attempts -lt $max_attempts ]; do
        if curl -s http://localhost:11434/api/tags &> /dev/null; then
            echo "✓ Ollama is ready!"
            return 0
        fi
        attempts=$((attempts + 1))
        sleep 2
        echo "  Attempt $attempts/$max_attempts..."
    done

    echo "✗ Ollama failed to start within 60 seconds"
    return 1
}

# Install and pull the model
setup_model() {
    local model="llama3.2"

    echo "Setting up AI model: $model"
    echo "This may take a few minutes depending on your internet connection..."

    # Pull the model
    if ollama pull $model; then
        echo "✓ Model '$model' downloaded successfully!"

        # Verify the model works
        echo "Testing model..."
        if ollama list | grep -q $model; then
            echo "✓ Model '$model' is ready for use!"
            return 0
        fi
    fi

    echo "✗ Failed to download or verify model"
    return 1
}

# Create environment file
create_env_file() {
    local env_file="backend/.env"

    if [ ! -f "$env_file" ]; then
        echo "Creating environment configuration..."
        cat > "$env_file" << EOF
PORT=5001
JWT_SECRET=$(openssl rand -hex 32)
NODE_ENV=production
OLLAMA_ENABLED=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
EOF
        echo "✓ Created $env_file"
    else
        echo "✓ Environment file already exists"
    fi
}

# Main setup process
main() {
    echo "Starting automatic Ollama setup..."
    echo ""

    # Check if Ollama is already set up
    if check_ollama; then
        echo "✓ Ollama is already installed and running"
    else
        # Install Ollama
        install_ollama

        # Verify installation
        if ! command -v ollama &> /dev/null; then
            echo "✗ Ollama installation failed"
            exit 1
        fi

        # Start Ollama
        start_ollama

        # Wait for it to be ready
        if ! wait_for_ollama; then
            echo "✗ Ollama failed to start properly"
            exit 1
        fi
    fi

    # Setup model
    if ! setup_model; then
        echo "⚠️  Model setup failed, but Ollama is working. You can manually run:"
        echo "   ollama pull llama3.2"
    fi

    # Create environment file
    create_env_file

    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    Setup Complete!                           ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "🎉 Ollama is now ready to provide AI-powered proof suggestions!"
    echo ""
    echo "The system will automatically use the local LLM for enhanced AI"
    echo "suggestions. If Ollama isn't available, it falls back to the"
    echo "rule-based system."
    echo ""
    echo "You can now run the application normally."
    echo ""
}

# Run main setup
main "$@"
