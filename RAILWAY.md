# Deploy to Railway

This app runs as **one Railway service**: Express serves the API and the built React app on the same domain (sessions and `/api` work without extra CORS setup).

## Prerequisites

- [Railway account](https://railway.com)
- GitHub repo connected to Railway (recommended), or [Railway CLI](https://docs.railway.com/develop/cli)

## 1. Create the project

1. Open [Railway Dashboard](https://railway.com/dashboard) → **New Project**.
2. **Deploy from GitHub repo** and select this repository (root directory = repo root).
3. Railway reads `railway.toml` and runs:
   - Install: root + `server` + `client` dependencies
   - Build: Vite client → `client/dist`, TypeScript server → `server/dist`
   - Start: `node server/dist/index.js` on `PORT`

## 2. Persistent SQLite volume

Without a volume, the database is wiped on every redeploy.

1. In your service → **Volumes** → **Add Volume**.
2. Mount path: **`/data`** (must match production path in `server/src/db/connection.ts`).
3. Redeploy once after adding the volume.

Optional: copy an existing `server/data/upsc.db` into the volume via Railway shell or a one-off upload if you already have data locally.

## 3. Environment variables

Set these on the **service** (Variables tab):

| Variable | Required | Example / notes |
|----------|----------|-----------------|
| `NODE_ENV` | Yes | `production` |
| `SESSION_SECRET` | Yes | Long random string (e.g. `openssl rand -hex 32`) |
| `ADMIN_USERNAME` | Yes | Your admin login |
| `ADMIN_PASSWORD` | Yes | Strong password (not `admin123`) |
| `CLIENT_URL` | Recommended | `https://<your-service>.up.railway.app` — same as public URL |
| `FORCE_RESET_PASSWORD` | Optional | `true` once to reset admin password to `ADMIN_PASSWORD` |

Railway sets **`PORT`** and often **`RAILWAY_PUBLIC_DOMAIN`** automatically. If you omit `CLIENT_URL`, the server uses `https://${RAILWAY_PUBLIC_DOMAIN}` when that variable is present.

## 4. Public URL

1. Service → **Settings** → **Networking** → **Generate Domain**.
2. Set `CLIENT_URL` to that HTTPS URL (e.g. `https://upsc-mcq-production.up.railway.app`).
3. Redeploy if you changed variables after the first deploy.

## 5. Smoke test

- `GET https://<your-domain>/api/health` → `{"ok":true}`
- Open `https://<your-domain>/` → login page loads
- Log in with `ADMIN_USERNAME` / `ADMIN_PASSWORD`
- Create or open a quiz to confirm DB + API

## 6. CLI deploy (optional)

```bash
npm i -g @railway/cli
railway login
railway init          # link to new or existing project
railway up            # deploy from local directory
railway variables set NODE_ENV=production SESSION_SECRET=... ADMIN_USERNAME=... ADMIN_PASSWORD=...
```

Add the `/data` volume in the dashboard (CLI volume steps vary; dashboard is simplest).

## Local production check

```bash
npm run install:all
npm run build
cd server
set NODE_ENV=production
set SESSION_SECRET=local-test-secret
node dist/index.js
```

Open http://localhost:3001 — API and static UI should both work.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Login fails / session lost | Set `CLIENT_URL` to exact public HTTPS URL; ensure `NODE_ENV=production` and volume mounted at `/data` |
| Empty app after deploy | Check build logs for client build errors; confirm `client/dist` exists in deploy artifact |
| `better-sqlite3` build error | Redeploy; if it persists, add a `nixpacks.toml` with `python3` in `[phases.setup] nixPkgs` |
| Data lost on redeploy | Add volume at mount path `/data` |
