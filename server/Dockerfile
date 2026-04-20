# ------- Build Stage -------
FROM node:20-alpine AS builder

# Metadata labels for better image management
LABEL maintainer="VistraCraft <dev@vistracraft.com>"
LABEL org.opencontainers.image.title="EventKnit Server"
LABEL org.opencontainers.image.description="EventKnit Backend API Server"
LABEL org.opencontainers.image.version="1.0.0"

# Set working directory
WORKDIR /app

# Install dependencies for building native modules and curl for health checks
# Note: build-base includes gcc, g++, make, libc-dev
RUN apk add --no-cache \
  python3 \
  make \
  g++ \
  curl \
  && ln -sf python3 /usr/bin/python

# Copy package files first for better layer caching
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
# Using --ignore-scripts to prevent postinstall from running before source is copied
RUN npm ci --ignore-scripts --no-audit

# Copy Prisma schema for client generation
COPY prisma ./prisma

# Copy scripts needed for Prisma generation
COPY scripts ./scripts

# Copy the rest of the application files (before generating to ensure tsconfig.json is available)
COPY . .

# Generate Prisma Client (works without DATABASE_URL via wrapper script)
RUN npm run prisma:generate

# Compile TypeScript to JavaScript
RUN npm run build

# Remove dev dependencies and clear cache to reduce image size
RUN npm prune --production && \
  rm -rf /tmp/* && \
  rm -rf /var/cache/apk/*

# ---------- Production Stage ----------
FROM node:20-alpine AS production

# Metadata labels
LABEL maintainer="VistraCraft <dev@vistracraft.com>"
LABEL org.opencontainers.image.title="EventKnit Server"
LABEL org.opencontainers.image.description="EventKnit Backend API Server - Production"

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001

WORKDIR /app

# Install only curl for health checks (minimal runtime dependencies)
RUN apk add --no-cache curl && \
  rm -rf /tmp/* && \
  rm -rf /var/cache/apk/*

# Copy package files
COPY --from=builder /app/package*.json ./

# Copy Prisma schema and scripts (needed for postinstall script)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

# Install production dependencies only
# Use --ignore-scripts since Prisma Client is already generated in builder stage
RUN npm ci --only=production --ignore-scripts --no-audit && \
  npm cache clean --force && \
  rm -rf /tmp/* && \
  rm -rf /root/.npm

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy Prisma generated client and schema
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user for security
USER nodejs

# Expose the application's port
EXPOSE 3010

# Health check with better error handling
HEALTHCHECK --interval=30s \
  --timeout=10s \
  --start-period=40s \
  --retries=3 \
  CMD curl -f http://localhost:3010/health || exit 1

# Use exec form for better signal handling
CMD ["node", "dist/src/server.js"]
