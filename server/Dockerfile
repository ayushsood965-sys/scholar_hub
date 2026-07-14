# syntax=docker/dockerfile:1

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manager files first for better caching
COPY package.json package-lock.json ./

# Install dependencies with npm cache mount
# Using --mount=type=cache to persist npm cache and node_modules across builds
RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
    --mount=type=cache,id=node-modules,target=/app/node_modules \
    npm ci --prefer-offline --omit=dev

# Copy source code
COPY . .

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application source
COPY --from=builder /app ./

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:5000/api/health || exit 1

# Start the server
CMD ["node", "server.js"]
