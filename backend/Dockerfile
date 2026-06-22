# backend/Dockerfile

# Brug Node.js 20 på Alpine Linux for et lille og effektivt image
FROM node:20-alpine

# Arbejdsmappe inde i containeren
WORKDIR /app

# --------------------------------------------------
# Installer projektets dependencies
# --------------------------------------------------

# Kopiér package.json og package-lock.json først.
# Dette giver bedre Docker caching, så npm install kun køres igen,
# hvis afhængighederne ændres.
COPY package*.json ./

# Installer alle nødvendige npm-pakker
# (inklusive tsx, som bruges til at køre TypeScript direkte)
RUN npm install

# --------------------------------------------------
# Kopiér applikationens kildekode
# --------------------------------------------------

# Kopiér alle projektfiler til containeren
COPY . .

# Sæt miljøet til produktion.
# Mange biblioteker bruger denne variabel til at aktivere
# produktionsoptimeringer og deaktivere debug-funktioner.
ENV NODE_ENV=production

# Dokumentér at backenden lytter på port 5000
EXPOSE 5000

# Start applikationen direkte fra TypeScript-kildekoden via tsx.
# Node loader tsx, som transpilerer TypeScript ved kørsel.
CMD ["node", "--import", "tsx", "./src/index.ts"]
