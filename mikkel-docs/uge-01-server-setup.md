# Uge 1 — Serveropsætning

Dokumentation af processen med at sætte en server op til projektet, fra indkøb af hardware til en kørende webserver bag Cloudflare med HTTPS. Skrevet løbende som logbog over hvad der er lavet, hvad jeg har lært, og hvad der stadig mangler.

## Formål

Få et solidt server-fundament klar (server, DNS, SSL, Docker, database, webserver) **før** gruppens rigtige frontend/backend skal deployes — så jeg ved at infrastrukturen virker, og enhver senere fejl ligger i koden, ikke i serveren.

## Hvad jeg har lavet

**Server og hærdning**
- Klonet gruppens GitHub-projekt ned lokalt.
- Købt og opsat en Ubuntu-server hos Hetzner.
- Hærdet serveren: oprettet egen bruger, sat SSH-nøgle op, og lukket for password-login (kun nøglebaseret adgang).

**Domæne og Cloudflare**
- Købt domæne (`varovejcontemporary.com`) hos Simply.
- Oprettet Cloudflare-profil og flyttet domænets DNS til Cloudflare.
- Oprettet A-record der peger på serveren, med proxy slået til (orange sky).
- Aktiveret SSL via Cloudflare — **pt. kun Flexible**

**Docker og services**
- Installeret Docker (officiel pakke) på serveren, verificeret med `hello-world`.
- Kørt PostgreSQL (`postgres:16-alpine`) i container, bundet til `127.0.0.1:5432` (kun nåelig fra serveren selv — ikke eksponeret mod internettet).
- Kørt Nginx (`nginx:alpine`) i container på port 80, der serverer en statisk `index.html`.

## Nuværende arkitektur

```
Browser ──HTTPS──> Cloudflare ──HTTP(80)──> Nginx-container (statisk side)

På serveren:
  nginx     0.0.0.0:80      (offentlig — webserver)
  postgres  127.0.0.1:5432  (kun internt — database, lukket udadtil)
```

Databasen og webserveren kører som to separate containere. Databasen er bevidst ikke eksponeret; kun et fremtidigt API skal kunne nå den.

## Refleksion over læring

- **Containere frem for direkte install** holder hosten ren, isoleret og reproducerbar — nemt at rive ned igen uden at efterlade spor.
- **Port-binding er sikkerhed:** `127.0.0.1:5432` lukker databasen for omverdenen, `5432:5432` eksponerer den. Docker kan omgå UFW, så loopback er mere robust end firewall-regler.
- **Cloudflare terminerer SSL,** så jeg slipper for Certbot. Forstår nu forskellen på Flexible og Full (strict).
- **Adskil infrastruktur fra kode:** ved at teste med en placeholder ved jeg at fundamentet virker, før gruppens kode lægges på.

## Lokal udvikling (Mac) — note om port

På macOS optager AirPlay Receiver port 5000 som standard, så backend kunne ikke køre der lokalt. Løst ved at flytte API'et til port 5001 i stedet (i stedet for at slå AirPlay fra under System Settings → General → AirDrop & Handoff).

To `.env`-filer skal stemme overens på portnummeret:
- **Backend** (`.env`): `PORT=5001`
- **Frontend** (`.env`): `VITE_API_URL=http://localhost:5001/api`

Ændrer man backendens `PORT`, skal frontendens `VITE_API_URL` rettes tilsvarende — ellers kan frontend ikke nå API'et. Begge `.env`-filer ligger i `.gitignore` og må ikke committes.

## TODO / reminders til mig selv

- [ ] **Full (strict) SSL mangler.** Kører pt. kun Flexible (browser→Cloudflare krypteret, men Cloudflare→server er HTTP). For at få kryptering hele vejen skal jeg: oprette et **Cloudflare Origin Certificate**, lægge cert + nøgle på serveren, tilføje en `listen 443 ssl`-blok i Nginx-configen, mappe port 443 i compose, og **derefter** skifte Cloudflare til Full (strict). Rækkefølgen er vigtig — serveren skal kunne svare på 443 før jeg skifter, ellers 525-fejl.
- [ ] **Kun test-container lige nu.** Nginx serverer en statisk `index.html` som placeholder. Skal erstattes af gruppens rigtige frontend (React build i `dist/`, serveret af Nginx
- [ ] **Stop test-containeren før rigtigt deploy.** Port 80 kan kun bruges af én container ad gangen.
- [ ] **Hold origin-IP skjult.** Server-IP'en må ikke i offentlige repos — det ville lade folk omgå Cloudflare-proxy og ramme serveren direkte.
- [ ] **CI/CD til senere.** Når der er rigtig kode at bygge/teste, sæt en pipeline op (GitHub Actions → SSH-deploy, eller pull-baseret). Giver først mening med et projekt der faktisk skal bygges.

## Status

Fundamentet kører: server hærdet, domæne med HTTPS (Flexible), Docker, database og webserver oppe. Klar til at lægge gruppens rigtige frontend og backend ovenpå i næste uge efter mere dybdegående dockerundervisning.
