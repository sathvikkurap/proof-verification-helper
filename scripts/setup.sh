#!/bin/bash
set -e

echo "🚀 Proof Verification Helper - Production Setup"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi

    NODE_VERSION=$(node -v | sed 's/v//')
    if [[ "$(printf '%s\n' "$NODE_VERSION" "18.0.0" | sort -V | head -n1)" = "18.0.0" ]]; then
        print_success "Node.js version: $NODE_VERSION"
    else
        print_error "Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 18+"
        exit 1
    fi

    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    print_success "npm version: $(npm -v)"

    # Check Docker (optional but recommended)
    if command -v docker &> /dev/null; then
        print_success "Docker is available: $(docker --version)"
        DOCKER_AVAILABLE=true
    else
        print_warning "Docker not found. Docker deployment will not be available."
        DOCKER_AVAILABLE=false
    fi

    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose is available: $(docker-compose --version)"
        COMPOSE_AVAILABLE=true
    elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
        print_success "Docker Compose V2 is available"
        COMPOSE_AVAILABLE=true
        USE_COMPOSE_V2=true
    else
        print_warning "Docker Compose not found. Docker deployment will not be available."
        COMPOSE_AVAILABLE=false
    fi
}

# Setup environment
setup_environment() {
    print_status "Setting up environment..."

    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        if [ -f "backend/example.env" ]; then
            cp backend/example.env .env
            print_success "Created .env file from example"
        else
            print_warning "No example.env found, creating basic .env"
            cat > .env << EOL
NODE_ENV=development
PORT=5001
JWT_SECRET=change-this-in-production
OLLAMA_ENABLED=true
OLLAMA_HOST=http://localhost:11434
EOL
        fi
    else
        print_warning ".env file already exists, skipping creation"
    fi

    # Generate secure JWT secret if needed
    if grep -q "change-this-in-production" .env; then
        NEW_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
        sed -i.bak "s/change-this-in-production/$NEW_SECRET/" .env && rm .env.bak
        print_success "Generated secure JWT secret"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."

    # Root dependencies
    if [ -f "package.json" ]; then
        npm install
        print_success "Installed root dependencies"
    fi

    # Backend dependencies
    if [ -d "backend" ] && [ -f "backend/package.json" ]; then
        cd backend
        npm install
        cd ..
        print_success "Installed backend dependencies"
    fi

    # Frontend dependencies
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        cd frontend
        npm install
        cd ..
        print_success "Installed frontend dependencies"
    fi

    # Electron dependencies (if present)
    if [ -d "electron" ] && [ -f "electron/package.json" ]; then
        cd electron
        npm install
        cd ..
        print_success "Installed electron dependencies"
    fi
}

# Setup Ollama
setup_ollama() {
    print_status "Setting up Ollama..."

    if ! command -v ollama &> /dev/null; then
        print_warning "Ollama not found. AI features will be limited."
        print_status "To install Ollama:"
        echo "  macOS: brew install ollama"
        echo "  Linux: curl -fsSL https://ollama.ai/install.sh | sh"
        echo "  Windows: Download from https://ollama.ai/download"
        return
    fi

    print_success "Ollama is installed"

    # Start Ollama service
    if ! pgrep -f "ollama serve" > /dev/null; then
        print_status "Starting Ollama service..."
        nohup ollama serve > ollama.log 2>&1 &
        sleep 2
        print_success "Ollama service started"
    else
        print_success "Ollama service is already running"
    fi

    # Pull required model
    if ollama list | grep -q "llama3.2"; then
        print_success "llama3.2 model is already available"
    else
        print_status "Pulling llama3.2 model (this may take a while)..."
        if ollama pull llama3.2; then
            print_success "llama3.2 model downloaded successfully"
        else
            print_warning "Failed to download llama3.2 model. AI features will be limited."
        fi
    fi
}

# Setup Docker (if available)
setup_docker() {
    if [ "$DOCKER_AVAILABLE" = false ] || [ "$COMPOSE_AVAILABLE" = false ]; then
        print_warning "Docker not available, skipping Docker setup"
        return
    fi

    print_status "Setting up Docker environment..."

    # Check if docker-compose or docker compose
    if [ "$USE_COMPOSE_V2" = true ]; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi

    # Build images
    print_status "Building Docker images..."
    if $COMPOSE_CMD build; then
        print_success "Docker images built successfully"
    else
        print_error "Failed to build Docker images"
        return 1
    fi
}

# Test setup
test_setup() {
    print_status "Testing setup..."

    # Test backend
    if [ -d "backend" ]; then
        cd backend
        if npm test --silent; then
            print_success "Backend tests passed"
        else
            print_warning "Some backend tests failed"
        fi
        cd ..
    fi

    # Test frontend build
    if [ -d "frontend" ]; then
        cd frontend
        if npm run build --silent; then
            print_success "Frontend build successful"
        else
            print_warning "Frontend build failed"
        fi
        cd ..
    fi
}

# Display next steps
display_next_steps() {
    echo ""
    print_success "Setup completed successfully!"
    echo ""
    echo "🎯 Next steps:"
    echo ""

    if [ "$DOCKER_AVAILABLE" = true ] && [ "$COMPOSE_AVAILABLE" = true ]; then
        echo "🐳 Docker deployment:"
        echo "  $COMPOSE_CMD up -d          # Start all services"
        echo "  $COMPOSE_CMD logs -f       # View logs"
        echo "  $COMPOSE_CMD down          # Stop all services"
        echo ""
    fi

    echo "💻 Manual development:"
    echo "  npm run dev                 # Start development servers"
    echo "  npm run test               # Run all tests"
    echo "  npm run build             # Build for production"
    echo ""

    echo "🌐 Access your application:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:5001"
    echo "  API Docs: http://localhost:5001/api-docs"
    echo ""

    echo "🤖 AI Features:"
    if command -v ollama &> /dev/null && pgrep -f "ollama serve" > /dev/null; then
        echo "  ✅ Ollama is running - AI suggestions available"
    else
        echo "  ⚠️  Ollama not running - AI features limited"
        echo "      Run: ollama serve"
    fi
    echo ""

    echo "📚 Documentation:"
    echo "  README: https://github.com/yourusername/proof-verification-helper#readme"
    echo "  API Docs: http://localhost:5001/api-docs"
    echo ""

    echo "🎉 Happy proving!"
}

# Main execution
main() {
    echo "🚀 Starting Proof Verification Helper setup..."
    echo ""

    check_prerequisites
    echo ""

    setup_environment
    echo ""

    install_dependencies
    echo ""

    setup_ollama
    echo ""

    if [ "$DOCKER_AVAILABLE" = true ]; then
        setup_docker
        echo ""
    fi

    test_setup
    echo ""

    display_next_steps
}

# Run main function
main "$@"
