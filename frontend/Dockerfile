FROM node:20-alpine

WORKDIR /app

# Install deps based on package manifest first for cache efficiency.
COPY package.json package-lock.json* ./
RUN npm config set fetch-retries 10 \
    && npm config set fetch-retry-factor 2 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 300000 \
    && npm config set fetch-timeout 1200000 \
    && npm ci --no-audit --no-fund

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
