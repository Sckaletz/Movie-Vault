FROM node:20-alpine
WORKDIR /app


COPY package*.json ./
RUN npm install
COPY . .
# Run as the built-in non-root "node" user (UID 1000) instead of root.
# chown /app so the process can still write its tsx cache etc.
RUN chown -R node:node /app
EXPOSE 5001
USER node
CMD ["node", "--import", "tsx", "./src/index.ts"]
