# Railway Database Migration - Automatic Execution

## ✅ Yes, Migrations Run Automatically!

**The backend automatically runs database migrations on every Railway deployment.**

---

## How It Works

### Automatic Migration on Startup

The FastAPI application has a `startup_event()` function in `backend/app/main.py` that:

1. **Runs BEFORE the server starts**
2. **Automatically executes** `alembic upgrade head`
3. **Applies all pending migrations** to the Railway database
4. **Logs the results** in Railway logs

### Code Location

```python
# backend/app/main.py (lines 133-180)

@app.on_event("startup")
async def startup_event():
    """Log startup information - storage and database are checked, migrations are run"""
    logger.info("=== Application Startup ===")
    
    # Run database migrations first (before checking connection)
    try:
        from alembic.config import Config
        from alembic import command
        
        # Configure Alembic with DATABASE_URL from Railway
        alembic_cfg = Config("alembic.ini")
        alembic_cfg.set_main_option("sqlalchemy.url", database_url)
        
        # Run migrations automatically
        logger.info("Running database migrations...")
        command.upgrade(alembic_cfg, "head")
        logger.info("✓ Database migrations: Applied")
    except Exception as e:
        logger.error("Migration failed - check logs")
```

---

## What This Means

### ✅ Automatic Migration
- **Every deployment** triggers migrations
- **No manual steps** required
- **All new migrations** are applied automatically
- **Safe** - Alembic tracks which migrations have been applied

### ✅ Your Grade Column Migration
When you deploy the updated code with the new migration file (`increase_grade_column_length.py`), it will:

1. **Automatically run** on next deployment
2. **Change** `grade` column from `VARCHAR(10)` to `VARCHAR(20)`
3. **Log success** in Railway deployment logs
4. **Allow** "IN PROGRESS" courses to be saved

---

## Verification

### Check Migration Status in Railway Logs

After deployment, check Railway logs for:

```
=== Application Startup ===
Running database migrations...
INFO  [alembic.runtime.migration] Running upgrade ... -> increase_grade_column_length, increase grade column length
✓ Database migrations: Applied
✓ Database: Connected
=== Application Startup Complete ===
```

### Manual Verification (if needed)

If you want to verify migrations ran:

```bash
# Connect to Railway database
railway connect

# Check migration history
railway run python -m alembic current
railway run python -m alembic history

# Check column type
railway run psql -c "SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'grade';"
```

---

## Migration Flow

```
1. Code Push to GitHub
   ↓
2. Railway Detects Changes
   ↓
3. Railway Builds New Container
   ↓
4. Railway Starts Container
   ↓
5. FastAPI startup_event() Runs
   ↓
6. Alembic upgrade head Executes
   ↓
7. All Pending Migrations Applied
   ↓
8. Server Starts Successfully
```

---

## Important Notes

### ✅ Safe to Deploy
- Migrations are **idempotent** (safe to run multiple times)
- Alembic tracks applied migrations in `alembic_version` table
- Won't re-apply already-applied migrations

### ⚠️ Migration Failures
If a migration fails:
- **Server will still start** (migration errors are caught)
- **Check Railway logs** for error details
- **Database operations may fail** until migration is fixed
- **Fix the migration** and redeploy

### 🔄 Rollback
If you need to rollback:
```bash
railway run python -m alembic downgrade -1
```

---

## Current Migration Status

Your new migration (`increase_grade_column_length.py`) will:

1. ✅ **Automatically run** on next Railway deployment
2. ✅ **Update** `grade` column to `VARCHAR(20)`
3. ✅ **Fix** the "IN PROGRESS" course saving issue
4. ✅ **Log** success in Railway deployment logs

**No manual intervention needed!** Just deploy the code.

---

## Troubleshooting

### Migration Not Running?

1. **Check Railway Logs:**
   - Look for "Running database migrations..." message
   - Check for any error messages

2. **Verify Migration File:**
   - Ensure `increase_grade_column_length.py` is in `backend/alembic/versions/`
   - Check `down_revision` is set correctly

3. **Check DATABASE_URL:**
   - Ensure `DATABASE_URL` is set in Railway environment variables
   - Should point to your Railway PostgreSQL service

4. **Manual Run (if needed):**
   ```bash
   railway run python -m alembic upgrade head
   ```

---

## Summary

✅ **Migrations run automatically on Railway deployment**  
✅ **No manual steps required**  
✅ **Your grade column migration will apply automatically**  
✅ **Check Railway logs to verify**  

Just commit and push your code - Railway handles the rest!

