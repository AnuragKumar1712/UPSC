# Railway Deployment Guide for PostgreSQL

## Prerequisites

- Railway account (https://railway.app)
- Git repo pushed to GitHub
- Project repository connected to Railway

## Step 1: Add PostgreSQL to Railway

1. Go to your Railway project dashboard
2. Click **+ New** → **Database** → **PostgreSQL**
3. Railway will automatically create a PostgreSQL instance
4. Copy the `DATABASE_URL` from the PostgreSQL service variables

## Step 2: Configure Environment Variables

In your Railway project, add these variables:

```
DATABASE_URL=postgresql://...  # Copy from PostgreSQL addon
NODE_ENV=production
PORT=3001
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

To add variables:

1. Go to your project's **Variables** tab
2. Add each key-value pair
3. They'll be available to your app at runtime

## Step 3: Update package.json Scripts

Ensure your server's `package.json` has:

```json
{
  "scripts": {
    "build": "tsc --noCheck",
    "start": "node dist/index.js"
  }
}
```

## Step 4: Verify Build

Build the TypeScript locally to ensure no errors:

```bash
cd server
npm install
npm run build
```

## Step 5: Deploy to Railway

1. Push your code to GitHub:

```bash
git add .
git commit -m "Migrate to PostgreSQL"
git push origin main
```

2. Railway will automatically redeploy
3. Check the **Logs** tab to verify the database connection succeeded

## Verification

Check the logs for successful startup:

```
Executed query SELECT COUNT(*) as c FROM sections
Database already initialized
UPSC MCQ API running on http://localhost:3001
```

## Troubleshooting

### Connection Error

- ❌ `Error: connect ECONNREFUSED`
- ✅ Ensure `DATABASE_URL` is correctly set in Railway variables

### Table Not Found

- ❌ `relation "questions" does not exist`
- ✅ Database initialization failed. Check logs for SQL errors

### Port Already in Use

- ❌ `EADDRINUSE: address already in use :::3001`
- ✅ Change PORT in Railway variables to 3002 or higher

## Data Migration (if needed)

To migrate data from old SQLite database:

1. Export SQLite data as JSON/CSV
2. Write a migration script
3. Run migration before deploying production

For help, refer to `POSTGRESQL_MIGRATION.md` in the project root.
