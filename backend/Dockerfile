# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies (tsx is used to run the TypeScript sources directly)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

ENV NODE_ENV=production

EXPOSE 5000

# Run the TypeScript entrypoint directly with tsx
CMD ["node", "--import", "tsx", "./src/index.ts"]
