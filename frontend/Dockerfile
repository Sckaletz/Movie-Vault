# frontend/Dockerfile

# --------------------------------------------------
# Stage 1: Byg React/Vite applikationen
# --------------------------------------------------
FROM node:20-alpine AS build

# Arbejdsmappe inde i containeren
WORKDIR /app

# Build-variabler som Vite bruger under npm run build.
# Disse bliver indlejret i den færdige frontend ved build-tid.
ARG VITE_API_URL=/api
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Gør ARG-værdier tilgængelige som miljøvariabler under build-processen
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Kopiér package.json og package-lock.json først.
# Dette udnytter Docker cache, så dependencies ikke geninstalleres
# hver gang applikationskoden ændres.
COPY package*.json ./

# Installer Node-afhængigheder
RUN npm install

# Kopiér resten af frontend-koden ind i containeren
COPY . .

# Byg den færdige statiske Vite-applikation til /app/dist
RUN npm run build


# --------------------------------------------------
# Stage 2: Servér den færdige frontend med Nginx
# --------------------------------------------------
FROM nginx:alpine

# Indlæs egen Nginx-konfiguration.
# Bruges typisk til SPA-routing (React Router)
# samt reverse proxy til backend API.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Kopiér de byggede filer fra build-stage til Nginx webroden
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx lytter på port 80
EXPOSE 80

# Start Nginx i foreground, så containeren forbliver kørende
CMD ["nginx", "-g", "daemon off;"]
