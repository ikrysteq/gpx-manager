# gpx-manager

Your private GPX files explorer and manager.

One Docker container: Spring Boot (Java 25, Maven) in `backend/` serves the Vite + React + TypeScript frontend in
`frontend/` over HTTPS on port 8443. The app's own data (SQLite, migrated by Flyway at startup) lives in a Docker
named volume; the Library (your folder of GPX Files) is bind-mounted from the host.

## Run it

1. Generate a trusted certificate for this Mac's `<mac-name>.local` name (needs `brew install mkcert`):

   ```sh
   scripts/generate-cert.sh
   ```

   It writes `certs/cert.pem` and `certs/key.pem` (git-ignored) and prints how to trust the mkcert root CA on a phone.

2. Point the app at your Library:

   ```sh
   cp .env.example .env   # then set LIBRARY_PATH to the absolute path of your GPX folder
   ```

3. Start it:

   ```sh
   docker compose up --build
   ```

   Open `https://<mac-name>.local:8443` on the Mac or on a phone on the same network.

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
