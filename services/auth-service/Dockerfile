# =============================================================================
# AUTH SERVICE - PRODUCTION-READY DOCKERFILE
# Multi-stage build for optimized image size and security
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
RUN npm ci

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
    dumb-init

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 authservice

# Copy package files and install production dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && \
    npx prisma generate && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder --chown=authservice:nodejs /app/dist ./dist
COPY --from=builder --chown=authservice:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Copy necessary files
COPY --chown=authservice:nodejs prisma ./prisma

# Set environment variables
ENV NODE_ENV=production \
    PORT=3001

# Switch to non-root user
USER authservice

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/app.js"]
