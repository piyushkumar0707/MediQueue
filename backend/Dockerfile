FROM node:22-alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install full dependency set; current backend runtime depends on packages
# resolved only when dev dependencies are included.
RUN npm ci

# Copy source code
COPY src/ ./src/

# Expose port
EXPOSE 5000

# Set NODE_ENV (can be overridden by docker-compose)
ENV NODE_ENV=production

# Start server
CMD ["node", "src/server.js"]
