# UPSC Smart MCQ Builder & Practice Portal

Personal web application for creating, managing, practicing, and analyzing UPSC Prelims MCQs.

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **Backend:** Node.js, Express.js
- **Database:** SQLite (`server/data/upsc.db`)

## Quick Start

### 1. Install dependencies

```bash
cd UPSC
npm install
npm run install:all
```

### 2. Start development servers

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

### 3. Login

| Field    | Value     |
|----------|-----------|
| Username | `admin`   |
| Password | `admin123`|

Change the password under **Settings** after first login.

## Project Structure

```
UPSC/
├── client/          # React frontend
│   └── src/
│       ├── pages/   # All app screens
│       ├── components/
│       └── services/api.ts
├── server/          # Express API
│   ├── data/        # SQLite database & backups
│   └── src/
│       ├── routes/
│       ├── services/  # Smart option generator
│       └── db/
└── README.md
```

## Features

- Section & topic management (13 default UPSC sections)
- Manual & smart question builder (auto distractors from answer pool)
- Bulk question upload
- Quiz module with timer, palette, flag-for-review
- Results & answer review
- Analytics by section/topic
- Bookmarks & revision modes
- Export (JSON, CSV, Excel) & database backup

## Production

Set environment variables in `server/.env`:

- `SESSION_SECRET` — strong random string
- `ADMIN_USERNAME` / `ADMIN_PASSWORD`
- `CLIENT_URL` — your frontend URL
- `NODE_ENV=production`

Build everything: `npm run build` (client + server)

Start production API + static UI: `npm run start` (from repo root, with `NODE_ENV=production`)

**Railway:** step-by-step guide in [RAILWAY.md](./RAILWAY.md).
