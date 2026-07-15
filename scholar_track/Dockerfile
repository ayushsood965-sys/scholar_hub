# syntax=docker/dockerfile:1

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manager files first for better caching
COPY package.json package-lock.json ./

# Install dependencies with npm cache mount
# Using --mount=type=cache to persist npm cache across builds
# Don't cache node_modules as it causes issues with dev/prod dependency switching
RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
    npm ci --prefer-offline --include=dev

# Copy source code
COPY . .

# Expose build-time environment variables for Vite
ARG VITE_API_URL
ARG VITE_SYNC_URL
ARG VITE_GATEWAY_URL

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SYNC_URL=$VITE_SYNC_URL
ENV VITE_GATEWAY_URL=$VITE_GATEWAY_URL

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
HEALTHCHECK --interval=30s --timeout=3s --start-period=2s --retries=3 \
    CMD wget -qO- http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
