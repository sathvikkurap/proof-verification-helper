#!/bin/sh
set -e

# Wait for database to be ready (if using external DB)
if [ -n "$DATABASE_URL" ]; then
    echo "Waiting for database to be ready..."
    # Add database readiness check here if needed
fi

# Check if Ollama is available (optional dependency)
if [ "$OLLAMA_ENABLED" = "true" ] && [ -n "$OLLAMA_HOST" ]; then
    echo "Checking Ollama availability..."
    if curl -f -s "$OLLAMA_HOST/api/tags" > /dev/null 2>&1; then
        echo "✅ Ollama is available at $OLLAMA_HOST"
    else
        echo "⚠️  Ollama not available at $OLLAMA_HOST - AI features will be limited"
    fi
fi

# Run database migrations if they exist
if [ -f "migrate.js" ]; then
    echo "Running database migrations..."
    node migrate.js
fi

# Start the application
echo "🚀 Starting Proof Verification Helper..."
exec "$@"
