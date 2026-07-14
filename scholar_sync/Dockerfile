# syntax=docker/dockerfile:1

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manager files first for better caching
COPY package.json package-lock.json ./

# Install dependencies with npm cache mount
# Using --mount=type=cache to persist npm cache and node_modules across builds
# --include=dev ensures dev dependencies (like vite) are installed for the build
RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
    --mount=type=cache,id=node-modules,target=/app/node_modules \
    npm ci --prefer-offline --include=dev

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage - static file serving
FROM nginx:alpine AS production

# Copy built assets to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
