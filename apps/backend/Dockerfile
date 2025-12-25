# Backend Dockerfile for AutoFetch
# Multi-stage build for optimized production image

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/i18n/package.json ./packages/i18n/
COPY packages/typescript-config/package.json ./packages/typescript-config/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter backend...

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules

# Copy source code
COPY apps/backend ./apps/backend
COPY packages ./packages
COPY turbo.json package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Generate Prisma Client
WORKDIR /app/apps/backend
RUN pnpm prisma:generate

# Build the application
WORKDIR /app
RUN pnpm --filter backend build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

# Install Playwright dependencies and timezone data
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    tzdata

# Set Playwright to use system chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Configure timezone (default, can be overridden by docker-compose)
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

# Copy package files for reference
COPY --from=builder --chown=appuser:nodejs /app/package.json ./
COPY --from=builder --chown=appuser:nodejs /app/pnpm-workspace.yaml ./

# Copy production node_modules from builder (already filtered)
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder --chown=appuser:nodejs /app/apps/backend/package.json ./apps/backend/

# Copy built application (including compiled seed)
COPY --from=builder --chown=appuser:nodejs /app/apps/backend/dist/src ./apps/backend/dist/src
COPY --from=builder --chown=appuser:nodejs /app/apps/backend/dist/prisma ./apps/backend/dist/prisma
COPY --from=builder --chown=appuser:nodejs /app/apps/backend/generated/prisma ./apps/backend/dist/generated/prisma
COPY --from=builder --chown=appuser:nodejs /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder --chown=appuser:nodejs /app/apps/backend/prisma.config.ts ./apps/backend/

# Copy entrypoint script
COPY --chown=appuser:nodejs apps/backend/docker-entrypoint.sh /app/apps/backend/
RUN chmod +x /app/apps/backend/docker-entrypoint.sh

# Create logs and data directories
RUN mkdir -p /app/apps/backend/logs /app/data && chown -R appuser:nodejs /app/apps/backend/logs /app/data

# Switch to non-root user
USER appuser

WORKDIR /app/apps/backend

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application with entrypoint script
ENTRYPOINT ["/app/apps/backend/docker-entrypoint.sh"]
