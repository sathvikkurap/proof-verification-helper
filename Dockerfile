# Multi-stage Docker build for Proof Verification Helper
# Stage 1: Build stage
FROM node:18-alpine AS builder

# Install system dependencies for building native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    sqlite-dev

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies for backend
WORKDIR /app/backend
RUN npm ci --only=production

# Build backend if needed (TypeScript compilation)
RUN npm run build || echo "No build script found"

# Stage 2: Frontend build stage
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
COPY frontend/ ./

# Install dependencies and build frontend
RUN npm ci
RUN npm run build

# Stage 3: Production stage
FROM node:18-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    sqlite

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S proofhelper -u 1001

# Set working directory
WORKDIR /app

# Copy backend production files
COPY --from=builder --chown=proofhelper:nodejs /app/backend/package*.json ./
COPY --from=builder --chown=proofhelper:nodejs /app/backend/dist ./dist
COPY --from=builder --chown=proofhelper:nodejs /app/backend/src ./src
COPY --from=builder --chown=proofhelper:nodejs /app/backend/node_modules ./node_modules

# Copy built frontend
COPY --from=frontend-builder --chown=proofhelper:nodejs /app/frontend/dist ./public

# Copy configuration files
COPY --chown=proofhelper:nodejs package*.json ./
COPY --chown=proofhelper:nodejs docker-entrypoint.sh ./
COPY --chown=proofhelper:nodejs .env.example ./.env

# Create necessary directories
RUN mkdir -p logs data && \
    chown -R proofhelper:nodejs logs data

# Switch to non-root user
USER proofhelper

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5001/api/health || exit 1

# Start application with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
