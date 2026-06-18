FROM node:20-alpine
WORKDIR /app

# 1. Copy package files first
COPY package*.json ./

# 2. Install dependencies
RUN npm install

# 3. Copy the rest of the code
COPY . .

# 4. Run the app
CMD ["node", "--import", "tsx", "./src/index.ts"]