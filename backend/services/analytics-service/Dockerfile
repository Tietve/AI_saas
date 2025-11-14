# =============================================================================
# ANALYTICS SERVICE - PRODUCTION-READY DOCKERFILE
# Multi-stage build for optimized image size and security
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
    adduser --system --uid 1001 analyticsservice

# Copy package files and install production dependencies
COPY package*.json ./

RUN npm install --omit=dev && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder --chown=analyticsservice:nodejs /app/dist ./dist

# Set environment variables
ENV NODE_ENV=production \
    PORT=3004

# Switch to non-root user
USER analyticsservice

# Expose port
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3004/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]
