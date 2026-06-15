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
