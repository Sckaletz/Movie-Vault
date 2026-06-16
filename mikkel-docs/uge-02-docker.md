# Uge 2 — Docker (mandag)

Fortsættelse af [uge 1](./uge-01-server-setup.md). Sidste uge stod fundamentet klar; i dag erstattede jeg test-placeholderen med gruppens **rigtige React-frontend** i en egen Docker-container.

## Hvad jeg lavede i dag

- Lavet arbejds-branch `mikkel-master`.
- Skrevet `frontend/Dockerfile` som **multi-stage build**: stage 1 (`node:20-alpine`) bygger React-appen → `dist/`, stage 2 (`nginx:alpine`) serverer den på port 80. Tilføjet `.dockerignore`.
- Deployet på serveren: fjernet gammel test-nginx (frigjorde port 80), bygget image og kørt container:
  ```bash
  docker build -t movie-vault-frontend .
  docker run -d -p 80:80 --name movie-vault-frontend movie-vault-frontend
  ```
- Rettet tre ting der fik Docker-buildet til at fejle (men virkede lokalt — fordi Docker kun kopierer `frontend/` ind i imaget):
  1. `tsconfig.app.json`: `extends` `"../tsconfig.json"` → `"./tsconfig.json"` (rod-filen findes ikke i imaget). *Den afgørende.*
  2. `package.json`: `build` `"tsc && vite build"` → `"vite build"` (`tsc` fejlede på eksisterende config).
  3. Oprettet `frontend/.dockerignore`.

Siden kører på mit eget domæne **varovejcontemporary.com** (Cloudflare, fra uge 1). Alle i gruppen har egen server + eget domæne, så vi hver især lærer at sætte hele kæden op selv.

## Læring

- **Multi-stage build** holder imaget lille (~93 MB): Node bruges kun i byggefasen, kun nginx + `dist/` følger med ud.
- **Build-konteksten er kun `frontend/`** — derfor knækker stier ud af mappen (`../tsconfig.json`).
- **Vite bager env-vars ind ved build-tid** — ændrer man `.env`, skal imaget genbygges.
- **Image ≠ container:** `nginx:alpine` i lazydocker er bare det cachede basis-image, ikke en kørende container.

## Næste skridt

Docker Compose, så backend (og database) kan køre sammen med frontenden.

---

# Tirsdag — Docker Compose + reverse proxy

I dag samlede jeg hele stacken (frontend + backend + database) i én `docker-compose.yml` og fik det op at køre på serveren bag domænet.

## Hvad jeg lavede

- Skrevet `backend/Dockerfile` (+ `.dockerignore`) og en `docker-compose.yml` i roden med tre services: `frontend` (nginx, port 80), `backend` (Express, 5001), `db` (postgres:16).
- Lagt `.env`-filer på serveren.
- Db'en kører, men bruges ikke i koden endnu — bare for at have den klar.
- **Reverse proxy:** frontend kaldte `http://localhost:5000/api` → blokeret (CORS + mixed content, fordi siden er HTTPS). Løst ved at lade frontend-nginx proxye `/api` → `backend:5001` (`frontend/nginx.conf`) og bruge en **relativ** URL `VITE_API_URL=/api`.
- Fejlsøgt "no movies found": backendens TMDB-nøgle var **afkortet** i `.env`, fordi en lang linje knækkede ved copy-paste i terminalen. Fikset ved at kopiere filen op med `scp`.

## Læring

- **`.env`-filer skal manuelt på serveren** (scp). Compose læser dem fra serverens disk, ikke fra skyen.
- **Lange linjer (API-nøgler/tokens) over SSH: brug `scp`, ikke paste** — paste knækker dem, og så fejler ting med kryptiske beskeder.
- **Reverse proxy er best practice** for frontend+backend bag ét domæne: samme origin → ingen CORS, ingen mixed content, ingen hardcoded IP. Frontend laver bare relative `/api`-kald.
- **Mixed content:** en HTTPS-side må ikke kalde `http://` — derfor virker en hardcoded HTTP-IP aldrig.
- **`env_file` læses kun når containeren oprettes** — efter ændring skal man `docker compose up -d --force-recreate <service>`, ikke bare `restart`.
- **Sikkerhed:** bind db (og backend) til `127.0.0.1` så de ikke er åbne mod internettet; kun frontend:80 er public (Cloudflare sender alt videre dertil).
- Cloudflare ("Flexible" SSL) terminerer HTTPS og sender alle stier videre til serveren på port 80.

## Næste skridt

Koble backend til databasen i koden. (Og evt. fikse backendens `tsc`-build, som er brudt — containeren kører TS direkte via tsx indtil videre.)
