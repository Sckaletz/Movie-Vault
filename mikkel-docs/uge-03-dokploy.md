# Uge 3 — Dokploy, sikkerhed & container-hardening

Fortsættelse af [uge 2](./uge-02-docker.md). Sidste uge kørte hele stacken (frontend + backend + db) med Docker Compose bag reverse proxy. I denne uge satte jeg **Dokploy** op som deploy-platform med **CD direkte fra GitHub**, strammede **sikkerheden** (security headers + scan på Mozilla Observatory) og **hardenede containerne** (non-root, dropped capabilities, memory/CPU-limits).

Siden kører fortsat på **varovejcontemporary.com** (Cloudflare, "Flexible").

## Hvad jeg lavede

**Dokploy + CD fra GitHub**

- Sat **Dokploy** op på serveren (Traefik foran, på Hetzner). Dokploy bygger og kører Compose-stacken i stedet for at jeg manuelt `docker compose up` over SSH.
- **Continuous Deployment:** koblet Dokploy til min `mikkel-master`-branch på GitHub. Push til branchen → Dokploy puller, bygger images og redeployer automatisk. Ingen manuel deploy mere.
- **Vigtigt om Traefik-routing:** domænet skal eksplicit kobles på `frontend:80` under Dokploy → Domains, ellers svarer Traefik **404 på alt**. (Traefik ruter kun trafik til services den kender en regel for.)

**Øget sikkerhed (security headers + Observatory)**

- Tilføjet et sæt **security headers** i `frontend/nginx.conf`:
  - `Content-Security-Policy` — `default-src 'self'`, kun egne scripts/styles/connect, billeder over `https:`. Den vigtigste mod XSS.
  - `Strict-Transport-Security` (HSTS) — `max-age=31536000; includeSubDomains; preload`, tvinger HTTPS.
  - `X-Frame-Options: SAMEORIGIN` (clickjacking), `X-Content-Type-Options: nosniff` (MIME-sniffing), `Referrer-Policy`, `Permissions-Policy` (slår geolocation/mic/camera fra).
- **Gotcha:** en `location`-blok i nginx **arver ikke** server-level `add_header`. Da jeg har `add_header` inde i `location /` og `location /api/`, måtte alle headers **gentages** i hver blok — ellers forsvinder de på de stier.
- Tilføjet `Cache-Control: no-store` på `/api/` og `no-cache` på SPA-shellen (`index.html`), så bruger-specifikt indhold ikke caches.
- Scannet siden på **[Mozilla Observatory](https://developer.mozilla.org/en-US/observatory)** for at verificere headerne og kigge efter sårbarheder, og rettet til efter scoren.

**Container-hardening (`docker-compose.yml` + Dockerfiles)**

- **Non-root:** backend kører nu som den indbyggede `node`-bruger (UID 1000) i stedet for root (`USER node` i `backend/Dockerfile`, efter `chown -R node:node /app` så tsx stadig kan skrive sin cache).
- **`no-new-privileges:true`** på alle tre services — en proces kan ikke eskalere rettigheder (fx via setuid-binaries).
- **`cap_drop: ALL`** på backend — alle Linux-capabilities droppet, så containeren kun har det absolut nødvendige.
- **Ressource-limits** på alle services: `mem_limit` (frontend 128m, backend/db 512m), `cpus` og `pids_limit` — beskytter mod runaway-processer / fork-bombs og at én container spiser hele serveren.
- **Netværks-isolation:** to netværk — `edge` (frontend + backend, det Traefik når) og `backend` med `internal: true` (backend + db). Db'en ligger **kun** på det interne netværk → ikke nåelig udefra, kun fra backend.
- Skiftet til `expose` i stedet for `ports` (services snakker over Compose-netværket; intet bindes på host'ens porte undtagen det Traefik selv styrer).
- `postgres:16-alpine` + healthcheck (`pg_isready`); backend venter på `service_healthy` før den starter. `init: true` på backend for ordentlig signal-håndtering (PID 1 / zombie-reaping).

**Logging**

- Kigget ind i logging og bruger indtil videre **Dokploy's indbyggede logging** til at se containernes output (stdout/stderr) direkte i Dokploy-UI'et — nok til at fejlsøge deploys og se om en service kører.
- **Endnu ikke sat notifications op** — jeg får ikke besked hvis en deploy fejler eller en container ryger ned; jeg skal selv ind og kigge i loggen.

**Health checks (kendt bad practice lige nu)**

- Mine health checks tjekker pt. kun om **tjenesten er startet** (fx at containeren kører / db'en svarer på `pg_isready`) — ikke om appen **rent faktisk virker**.
- Det er **bad practice**: en container kan sagtens være "oppe" mens API'et returnerer fejl. Et rigtigt health check burde ramme et reelt endpoint (fx `GET /api/health` der laver en let DB-query og returnerer 200), så jeg ved at hele kæden frontend → backend → db fungerer — ikke bare at processen lever.

## Læring

- **Dokploy + CD = git push deployer.** Hele kæden (pull → build → run) er automatiseret; jeg rører ikke serveren manuelt længere. Bygger fra mikkel-master branch.
- **nginx `add_header` arves ikke ned i `location`** — har en location sin egen `add_header`, ryger alle server-level headers på den sti. Derfor gentager jeg dem i hver blok.
- **CSP er den vigtigste header** mod XSS
- **Observatory er en hurtig feedback-loop** for at se om headerne sidder rigtigt og finde lavthængende sårbarheder.
- **Hardening i lag:** non-root + `no-new-privileges` + `cap_drop` + limits + intern db. Hvert lag gør mindre skade muligt hvis ét bliver brudt — defense in depth.
- **Db på `internal`-netværk** er stærkere end at binde til `127.0.0.1`: containeren har ingen rute ud overhovedet, ikke bare en lukket host-port.

## Plan for resten af ugen

- Læser mere ind i **container-sikkerhed** for at forstå hardeningen bedre — non-root brugere, capabilities, `no-new-privileges`, ressource-limits og netværks-isolation, og hvorfor de hører sammen (defense in depth).
- **Forbereder videofremlæggelse** om serveropsætningen. Det jeg skal gennemgå:
  - **Hetzner-server** som vært for projektet.
  - **SSH-nøgler i stedet for password:** et nøglepar med privat nøgle (på min maskine) + offentlig nøgle (på serveren). Ingen password = ingen brute-force.
  - **Egen bruger med sudo** i stedet for at logge ind som root.
  - **Lukket for root-login og password-login** i SSH — kun nøgle-baseret login til min egen bruger.
  - **Fælde:** Hetzner's cloud-init-fil kan overstyre indstillingerne, så ændringer ikke slår igennem som forventet.
  - **UFW-firewall:** kun de nødvendige porte åbne + `allow OpenSSH`.
  - **Fail2ban:** blokerer IP'er efter gentagne mislykkede login-forsøg.
  - **Cloudflare** som reverse proxy: skjuler serverens IP, DDoS-beskyttelse og SSL — endnu et lag i defense in depth.


