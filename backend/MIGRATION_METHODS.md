# Database Migration Methods - Multiple Ways to Apply Changes

This guide shows different ways to apply the grade column migration (`VARCHAR(10)` → `VARCHAR(20)`).

---

## Method 1: Alembic Migration (Recommended)

**Best for:** Production, version control, team collaboration

### Run Migration:
```powershell
cd backend
alembic upgrade head
```

### Check Migration Status:
```powershell
alembic current
alembic history
```

### Rollback (if needed):
```powershell
alembic downgrade -1
```

---

## Method 2: Direct SQL via psql (Command Line)

**Best for:** Quick fixes, local development

### Connect to Local Database:
```powershell
# If using Docker
docker exec -it nupeer-postgres psql -U nupeer -d nupeer

# Or if PostgreSQL is installed locally
psql -h localhost -p 5433 -U nupeer -d nupeer
```

### Run SQL:
```sql
ALTER TABLE courses ALTER COLUMN grade TYPE VARCHAR(20);
```

### Exit:
```sql
\q
```

---

## Method 3: Python Script with SQLAlchemy

**Best for:** Automated scripts, programmatic migrations

Create a file `backend/run_migration_script.py`:

```python
from app.core.database import engine
from sqlalchemy import text

def migrate_grade_column():
    """Migrate grade column from VARCHAR(10) to VARCHAR(20)"""
    with engine.connect() as connection:
        try:
            connection.execute(text("ALTER TABLE courses ALTER COLUMN grade TYPE VARCHAR(20)"))
            connection.commit()
            print("✅ Migration successful: grade column updated to VARCHAR(20)")
        except Exception as e:
            connection.rollback()
            print(f"❌ Migration failed: {e}")
            raise

if __name__ == "__main__":
    migrate_grade_column()
```

### Run:
```powershell
cd backend
python run_migration_script.py
```

---

## Method 4: Database GUI Tools

### Option A: pgAdmin

1. **Download:** https://www.pgadmin.org/download/
2. **Connect:**
   - Host: `localhost`
   - Port: `5433`
   - Database: `nupeer`
   - Username: `nupeer`
   - Password: `nupeer`
3. **Run SQL:**
   - Right-click on `nupeer` database → "Query Tool"
   - Paste: `ALTER TABLE courses ALTER COLUMN grade TYPE VARCHAR(20);`
   - Click "Execute" (F5)

### Option B: DBeaver

1. **Download:** https://dbeaver.io/download/
2. **Connect:**
   - New Database Connection → PostgreSQL
   - Host: `localhost`, Port: `5433`
   - Database: `nupeer`
   - Username: `nupeer`, Password: `nupeer`
3. **Run SQL:**
   - Right-click database → "SQL Editor" → "New SQL Script"
   - Paste SQL and execute

### Option C: TablePlus

1. **Download:** https://tableplus.com/
2. **Connect:** Create PostgreSQL connection with same credentials
3. **Run SQL:** Use SQL editor to execute the ALTER TABLE command

---

## Method 5: Docker Exec (If Using Docker)

**Best for:** When database is in Docker container

```powershell
# Execute SQL directly in container
docker exec -i nupeer-postgres psql -U nupeer -d nupeer -c "ALTER TABLE courses ALTER COLUMN grade TYPE VARCHAR(20);"
```

Or connect interactively:
```powershell
docker exec -it nupeer-postgres psql -U nupeer -d nupeer
# Then run: ALTER TABLE courses ALTER COLUMN grade TYPE VARCHAR(20);
```

---

## Method 6: Railway CLI (If Using Railway)

**Best for:** Production Railway deployments

```powershell
# Connect to Railway database
railway connect

# Run SQL
railway run psql -c "ALTER TABLE courses ALTER COLUMN grade TYPE VARCHAR(20);"
```

Or use Railway's web console:
1. Go to Railway dashboard
2. Select your database service
3. Open "Data" tab
4. Run SQL query

---

## Method 7: SQL File Execution

**Best for:** Batch operations, reusable scripts

### Using psql:
```powershell
# From file
psql -h localhost -p 5433 -U nupeer -d nupeer -f backend/fix_grade_column.sql

# Or with Docker
docker exec -i nupeer-postgres psql -U nupeer -d nupeer < backend/fix_grade_column.sql
```

### Using Python:
```python
from app.core.database import engine
from sqlalchemy import text

def run_sql_file(file_path):
    with open(file_path, 'r') as f:
        sql = f.read()
    
    with engine.connect() as connection:
        connection.execute(text(sql))
        connection.commit()
        print("✅ SQL file executed successfully")

run_sql_file('backend/fix_grade_column.sql')
```

---

## Method 8: FastAPI Endpoint (For Remote Execution)

**Best for:** Remote database access, API-based migrations

Create `backend/app/api/v1/admin.py`:

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User

router = APIRouter()

@router.post("/admin/migrate-grade-column")
async def migrate_grade_column(
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Admin endpoint to migrate grade column"""
    # Add admin check here if needed
    try:
        db.execute(text("ALTER TABLE courses ALTER COLUMN grade TYPE VARCHAR(20)"))
        db.commit()
        return {"status": "success", "message": "Grade column migrated to VARCHAR(20)"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
```

Then call: `POST /api/v1/admin/migrate-grade-column`

---

## Verification

After running any method, verify the change:

```sql
-- Check column type
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'courses' AND column_name = 'grade';

-- Should show: grade | character varying | 20
```

Or using Python:
```python
from app.core.database import engine
from sqlalchemy import inspect

inspector = inspect(engine)
columns = inspector.get_columns('courses')
grade_col = next(c for c in columns if c['name'] == 'grade')
print(f"Grade column type: {grade_col['type']}")  # Should show VARCHAR(20)
```

---

## Quick Reference

| Method | Speed | Safety | Best For |
|--------|-------|--------|----------|
| Alembic | Medium | ⭐⭐⭐⭐⭐ | Production, Teams |
| Direct SQL (psql) | Fast | ⭐⭐⭐⭐ | Quick fixes |
| Python Script | Medium | ⭐⭐⭐⭐ | Automation |
| GUI Tools | Slow | ⭐⭐⭐⭐⭐ | Visual learners |
| Docker Exec | Fast | ⭐⭐⭐⭐ | Docker setups |
| Railway CLI | Medium | ⭐⭐⭐⭐ | Railway deployments |
| SQL File | Fast | ⭐⭐⭐⭐ | Batch operations |

---

## Recommended Approach

1. **Local Development:** Use Method 2 (psql) or Method 3 (Python script)
2. **Production:** Use Method 1 (Alembic) for proper versioning
3. **Quick Fixes:** Use Method 2 (Direct SQL) or Method 5 (Docker exec)
4. **Visual:** Use Method 4 (GUI tools) if you prefer visual interfaces

---

## Troubleshooting

### "Permission denied"
- Ensure you're using the correct database user
- Check database connection credentials

### "Column does not exist"
- Verify table name: `courses` (not `course`)
- Check you're connected to the right database

### "Relation already exists"
- Column might already be VARCHAR(20)
- Check current column type first

### "Connection refused"
- Ensure PostgreSQL is running
- Check port (5433 for local Docker setup)
- Verify Docker container is started: `docker ps`

