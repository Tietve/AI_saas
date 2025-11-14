# =============================================================================
# ORCHESTRATOR SERVICE - PRODUCTION-READY DOCKERFILE
# Multi-stage build with Prisma support
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# Install all dependencies including dev dependencies for building
# -----------------------------------------------------------------------------
FROM node:18-alpine AS deps

# Install system dependencies for node-gyp and Prisma
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    python3 \
    make \
    g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# -----------------------------------------------------------------------------
# Stage 2: Builder
# Build the TypeScript application
# -----------------------------------------------------------------------------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

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
    adduser --system --uid 1001 orchestratorservice

# Copy package files and install production dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --omit=dev && \
    npx prisma generate && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder --chown=orchestratorservice:nodejs /app/dist ./dist
COPY --from=builder --chown=orchestratorservice:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Copy necessary files
COPY --chown=orchestratorservice:nodejs prisma ./prisma

# Set environment variables
ENV NODE_ENV=production \
    PORT=3006

# Switch to non-root user
USER orchestratorservice

# Expose port
EXPOSE 3006

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3006/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]
