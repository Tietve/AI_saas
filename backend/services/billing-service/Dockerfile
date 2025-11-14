# =============================================================================
# BILLING SERVICE - PRODUCTION-READY DOCKERFILE
# Multi-stage build with Stripe SDK
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:18-alpine AS deps

RUN apk add --no-cache \
    libc6-compat \
    openssl \
    python3 \
    make \
    g++

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:18-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Production
# -----------------------------------------------------------------------------
FROM node:18-alpine AS runner

RUN apk add --no-cache \
    openssl \
    dumb-init

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 billingservice

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --omit=dev && \
    npx prisma generate && \
    npm cache clean --force

COPY --from=builder --chown=billingservice:nodejs /app/dist ./dist
COPY --from=builder --chown=billingservice:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=billingservice:nodejs prisma ./prisma

ENV NODE_ENV=production \
    PORT=3003

USER billingservice

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3003/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/app.js"]
