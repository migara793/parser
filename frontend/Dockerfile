FROM node:20-alpine

WORKDIR /app

# Install deps based on package manifest first for cache efficiency.
COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
