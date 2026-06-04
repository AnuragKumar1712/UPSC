# Railway Deployment TODO

## Plan summary

1. Create Railway blueprint for full-stack deployment (server + client).
2. Ensure backend can persist SQLite DB across deploys.
3. Set required env vars for backend: SESSION_SECRET, CLIENT_URL, ADMIN_USERNAME, ADMIN_PASSWORD, NODE_ENV.
4. Configure Railway build/start commands for both services.
5. Configure client to call backend: set VITE_API_URL (or adjust client code if needed).
6. Validate locally (build + start) and then verify on Railway.

## Steps

- [ ] Inspect how client determines API base URL / proxy behavior in production.
- [ ] Prepare Railway service #1: server (Node/Express) with build + start.
- [ ] Prepare Railway service #2: client (Vite static hosting) or combine via server.
- [ ] Configure persistent volume for `server/data/` so `upsc.db` survives redeploys.
- [ ] Set backend env vars: SESSION_SECRET, CLIENT_URL, NODE_ENV, ADMIN_USERNAME, ADMIN_PASSWORD.
- [ ] Set any client env vars required for API URL.
- [ ] Optional: run seed on first deploy if DB is empty.
- [ ] Smoke test endpoints: `/api/health`, login flow, one question fetch.
