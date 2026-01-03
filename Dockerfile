# Multi-stage build for production deployment
FROM node:20-alpine AS client-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./
RUN npm ci --only=production

# Copy client source
COPY client/ ./

# Build React app
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install server dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy server code
COPY server/ ./server/

# Copy built client from builder stage
COPY --from=client-builder /app/client/build ./client/build

# Create logs directory
RUN mkdir -p /app/logs

# Expose port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run the app
CMD ["node", "server/index.js"]
