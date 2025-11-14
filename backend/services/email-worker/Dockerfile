# =============================================================================
# EMAIL WORKER - PRODUCTION-READY DOCKERFILE
# Multi-stage build for background worker
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# Install all dependencies including dev dependencies for building
# -----------------------------------------------------------------------------
FROM node:18-alpine AS deps

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    python3 \
    make \
    g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# -----------------------------------------------------------------------------
# Stage 2: Builder
# Build the TypeScript application
# -----------------------------------------------------------------------------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Production
# Final production image with only necessary files
# -----------------------------------------------------------------------------
FROM node:18-alpine AS runner

# Install production dependencies only
RUN apk add --no-cache \
    openssl \
    dumb-init \
    curl

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 emailworker

# Copy package files and install production dependencies
COPY package*.json ./

RUN npm install --omit=dev && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder --chown=emailworker:nodejs /app/dist ./dist

# Copy email templates if they exist
COPY --chown=emailworker:nodejs templates ./templates/ 2>/dev/null || true

# Set environment variables
ENV NODE_ENV=production

# Switch to non-root user
USER emailworker

# No port exposed for worker (background process)

# Health check for worker process
HEALTHCHECK --interval=60s --timeout=3s --start-period=30s --retries=3 \
    CMD ps aux | grep -v grep | grep node || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the worker
CMD ["node", "dist/worker.js"]
