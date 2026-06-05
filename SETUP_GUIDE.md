# PostgreSQL Migration Complete ✅

## What Changed

Your UPSC MCQ app has been successfully migrated from **SQLite** to **PostgreSQL**. This ensures your data persists across Railway deployments.

### Files Modified:

- ✅ `server/package.json` - Replaced `better-sqlite3` with `pg`
- ✅ `server/src/db/connection.ts` - New PostgreSQL pool connection
- ✅ `server/src/db/init.ts` - PostgreSQL schema (SERIAL, CURRENT_TIMESTAMP)
- ✅ `server/src/index.ts` - Async database initialization
- ✅ `server/src/services/questions.ts` - Async service methods
- ✅ `server/src/services/answerPool.ts` - Async service methods
- ✅ All route files (auth, questions, sections, topics, bookmarks, quiz, revision, settings, analytics) - Async handlers, parameterized queries

## Quick Start

### 1. Install Dependencies Locally

```bash
cd server
npm install
npm run build
```

### 2. Create `.env` File

Copy `.env.example` and update with your database credentials:

```bash
cp .env.example .env
```

For **local development**:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/upsc
NODE_ENV=development
PORT=3001
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

For **Railway**:

- Get `DATABASE_URL` from Railway PostgreSQL addon
- Paste it into Railway environment variables

### 3. Local Testing (Optional)

If you have PostgreSQL installed locally:

```bash
npm run build
npm start
```

### 4. Deploy to Railway

1. Commit and push changes:

```bash
git add .
git commit -m "Migrate from SQLite to PostgreSQL"
git push origin main
```

2. In Railway dashboard:
   - Add a PostgreSQL service
   - Copy `DATABASE_URL`
   - Add to environment variables
   - Deploy will auto-trigger

3. Check logs for:

```
Database initialized with default sections
UPSC MCQ API running on http://localhost:3001
```

## Database Connection String (Railway)

Railway will provide something like:

```
postgresql://username:password@dpg-xxxxx.railway.app:5432/upsc_db_xxxxx
```

Add this as `DATABASE_URL` in Railway variables.

## Key Differences from SQLite

| Feature                 | SQLite                              | PostgreSQL               |
| ----------------------- | ----------------------------------- | ------------------------ |
| Placeholders            | `?`                                 | `$1`, `$2`, etc.         |
| Timestamps              | `datetime('now')`                   | `CURRENT_TIMESTAMP`      |
| Auto-increment          | `INTEGER PRIMARY KEY AUTOINCREMENT` | `SERIAL`                 |
| Case-insensitive search | `LIKE`                              | `ILIKE`                  |
| Duplicate handling      | `INSERT OR IGNORE`                  | `ON CONFLICT DO NOTHING` |

## Troubleshooting

### "relation does not exist"

Database hasn't been initialized. Check server logs for SQL errors.

### "connect ECONNREFUSED"

DATABASE_URL is wrong or PostgreSQL addon isn't running on Railway.

### Data Loss?

You were using SQLite in `/data` which doesn't persist. Now using PostgreSQL which does persist across deploys.

## Next Steps

1. ✅ Deploy to Railway
2. ✅ Verify connection in logs
3. ✅ Add your first question to confirm it persists
4. ✅ Push changes again - data should remain!

---

**Questions?** Check:

- `POSTGRESQL_MIGRATION.md` - Technical migration details
- `RAILWAY_DEPLOYMENT.md` - Railway setup steps
