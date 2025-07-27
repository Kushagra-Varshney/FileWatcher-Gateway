# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy TypeScript config
COPY tsconfig.json ./

# Copy source code
COPY src/ ./src/

# Install TypeScript globally and build dependencies for build process
RUN npm install -g typescript && \
    npm install --only=dev && \
    npm run build && \
    npm prune --production

# Set environment variables with defaults
ENV PORT=6970
ENV NODE_ENV=production
ENV KAFKA_BROKERS=localhost:9092
ENV KAFKA_TOPIC=file-changes
ENV KAFKA_CLIENT_ID=nazarts-gateway
ENV MONGODB_URI=mongodb://localhost:27017/nazar-analytics
ENV MONGODB_DB_NAME=nazar-analytics
ENV LOG_LEVEL=info

# Expose the port
EXPOSE $PORT

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Start the application
CMD ["npm", "start"]