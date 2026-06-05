# PostgreSQL Migration Pattern for UPSC MCQ App

## Migration Status

- ✅ connection.ts - PostgreSQL pool connection
- ✅ init.ts - PostgreSQL schema with SERIAL, CURRENT_TIMESTAMP
- ✅ index.ts - Async initialization
- ✅ questions.ts - Service with async/await
- ✅ answerPool.ts - Service with async/await
- ✅ questions.routes.ts - Async route handlers, $1/$2 parameterized queries
- ✅ auth.routes.ts - Async route handlers
- ✅ sections.routes.ts - Async route handlers
- ✅ topics.routes.ts - Async route handlers
- ⏳ bookmarks.routes.ts - PENDING
- ⏳ quiz.routes.ts - PENDING
- ⏳ revision.routes.ts - PENDING
- ⏳ settings.routes.ts - PENDING
- ⏳ analytics.routes.ts - PENDING

## Conversion Rules Applied

### 1. Query Placeholders

- SQLite: `?` placeholders
- PostgreSQL: `$1`, `$2`, `$3`, etc. with sequential numbering

### 2. Async/Await

- All route handlers: `(req, res) =>` → `async (req, res) =>`
- All db calls: `db.prepare(...).run()` → `await db.query(...)`
- All service calls: wrapped in `try/catch` blocks

### 3. Datetime Functions

- SQLite: `datetime('now')` → PostgreSQL: `CURRENT_TIMESTAMP`
- Removed `.pragma()` calls (not needed in PostgreSQL)

### 4. Auto-increment IDs

- SQLite: `INTEGER PRIMARY KEY AUTOINCREMENT` → PostgreSQL: `SERIAL` or `BIGSERIAL`
- PostgreSQL uses `RETURNING *` or `RETURNING id` in INSERT/UPDATE

### 5. String Matching

- SQLite: `LIKE` (case-insensitive)
- PostgreSQL: `ILIKE` (case-insensitive)

### 6. Insert/Ignore

- SQLite: `INSERT OR IGNORE`
- PostgreSQL: `ON CONFLICT (column) DO NOTHING`

## Environment Variables Required

Create a `.env` file in the server root:

```
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=production
PORT=3001
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## Railway Setup

1. Create a PostgreSQL addon in Railway
2. Copy the DATABASE_URL from Railway console
3. Add it to your `.env` file or Railway variables
4. Deploy: `npm run build && npm start`
