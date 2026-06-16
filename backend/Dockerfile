FROM node:20-alpine
WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm install

# Copy the rest of the source
COPY . .

EXPOSE 5001

# Run the TypeScript entrypoint directly with tsx (same as `npm run dev`).
# NOTE: `npm run build` (tsc) is currently broken, so we don't compile to dist/ yet.
CMD ["node", "--import", "tsx", "./src/index.ts"]
