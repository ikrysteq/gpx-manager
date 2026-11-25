# gpx-manager

Your private GPX files explorer and manager.

One Docker container: Spring Boot (Java 25, Maven) in `backend/` serves the Vite + React + TypeScript frontend in
`frontend/` over HTTPS on port 8443. The app's own data (SQLite, migrated by Flyway at startup) lives in a Docker
named volume; the Library (your folder of GPX Files) is bind-mounted from the host.

## Run it

1. Get a trusted certificate for this Mac's Tailscale name (needs Tailscale with MagicDNS and HTTPS Certificates
   enabled; see `docs/adr/0002-https-from-a-tailscale-certificate.md`):

   ```sh
   scripts/generate-cert.sh
   ```

   It writes `certs/cert.pem` and `certs/key.pem` (git-ignored). The certificate lasts about 90 days: rerun the
   script and `docker compose restart` to renew it.

2. Point the app at your Library:

   ```sh
   cp .env.example .env   # then set LIBRARY_PATH to the absolute path of your GPX folder
   ```

3. Start it:

   ```sh
   docker compose up --build
   ```

   Open `https://<mac>.<tailnet>.ts.net:8443` from any device with Tailscale connected.

## Develop

Backend on plain HTTP `:8080` (needs JDK 25; data goes to `backend/data/`):

```sh
cd backend && mvn spring-boot:run
```

Frontend in Vite dev mode, proxying `/api` to the backend:

```sh
npm --prefix frontend install
npm --prefix frontend run dev        # http://localhost:5173
```

Checks:

```sh
cd backend && mvn test               # backend integration tests
npm --prefix frontend run typecheck
```
