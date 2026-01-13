# Fix Calendar Event Database Connection Error

## Problem
When trying to create a calendar event, you see the error: **"database disconnected"** or **"Database connection error"**.

This guide will help you diagnose and fix the issue step by step.

---

## Quick Diagnosis

The error typically occurs due to one of these reasons:
1. **PostgreSQL container is not running**
2. **Database tables don't exist** (migration not run)
3. **Backend can't connect to database** (wrong connection string)
4. **Docker Desktop is not running**

---

## Step-by-Step Fix

### Step 1: Check if Docker Desktop is Running

1. **Open Docker Desktop** application
2. Wait until you see "Docker Desktop is running" in the system tray
3. If Docker Desktop is not installed:
   - Download from: https://www.docker.com/products/docker-desktop/
   - Install and restart your computer

**Verify Docker is running:**
```powershell
docker --version
```

You should see something like: `Docker version 24.x.x`

---

### Step 2: Check if PostgreSQL Container Exists and is Running

**Check container status:**
```powershell
docker ps -a --filter "name=nupeer-postgres"
```

**If the container doesn't exist:**
- Go to Step 3 (Create Container)

**If the container exists but is stopped:**
- Go to Step 4 (Start Container)

**If the container is running:**
- Go to Step 5 (Verify Connection)

---

### Step 3: Create PostgreSQL Container (If Needed)

If the container doesn't exist, create it:

```powershell
docker run -d --name nupeer-postgres `
    -e POSTGRES_USER=nupeer `
    -e POSTGRES_PASSWORD=nupeer `
    -e POSTGRES_DB=nupeer `
    -p 5433:5432 `
    postgres:15
```

**Wait 10-15 seconds** for PostgreSQL to initialize.

**Verify it's running:**
```powershell
docker ps --filter "name=nupeer-postgres"
```

You should see the container with status "Up".

---

### Step 4: Start Existing Container (If Stopped)

If the container exists but is stopped:

```powershell
docker start nupeer-postgres
```

**Wait 5 seconds**, then verify:
```powershell
docker ps --filter "name=nupeer-postgres"
```

---

### Step 5: Verify Database Connection

**Test the connection from your backend:**

1. Open PowerShell
2. Navigate to the backend directory:
```powershell
cd C:\NuPeer\backend
```

3. Activate virtual environment:
```powershell
.\venv\Scripts\Activate.ps1
```

4. Test database connection:
```powershell
python -c "from app.core.database import engine; engine.connect(); print('Connection OK!')"
```

**Expected output:** `Connection OK!`

**If you get an error:**
- Check the error message
- Verify Docker container is running: `docker ps --filter "name=nupeer-postgres"`
- Check container logs: `docker logs nupeer-postgres`

---

### Step 6: Check if Calendar Tables Exist

**Check if the calendar tables are created:**

```powershell
cd C:\NuPeer\backend
.\venv\Scripts\Activate.ps1
python -c "from app.core.database import engine; from sqlalchemy import inspect; inspector = inspect(engine); tables = inspector.get_table_names(); print('calendar_events' in tables)"
```

**Expected output:** `True`

**If output is `False`:** Go to Step 7 (Run Migration)

---

### Step 7: Run Database Migration

If the calendar tables don't exist, you need to run the migration:

```powershell
cd C:\NuPeer\backend
.\venv\Scripts\Activate.ps1
python -m alembic upgrade head
```

**Expected output:**
```
INFO  [alembic.runtime.migration] Running upgrade ... -> ..., create_calendar_events
```

**Verify tables were created:**
```powershell
python -c "from app.core.database import engine; from sqlalchemy import inspect; inspector = inspect(engine); tables = inspector.get_table_names(); print('calendar_events' in tables and 'event_participants' in tables)"
```

**Expected output:** `True`

---

### Step 8: Verify Backend Configuration

**Check your backend `.env` file** (if it exists):

1. Navigate to: `C:\NuPeer\backend\.env`
2. Check if `DATABASE_URL` is set correctly:
```env
DATABASE_URL=postgresql://nupeer:nupeer@localhost:5433/nupeer
```

**If `.env` doesn't exist:**
- The backend uses the default connection string from `config.py`
- Default: `postgresql://nupeer:nupeer@localhost:5433/nupeer`
- This should work if PostgreSQL is running on port 5433

**If you're using Docker Compose:**
- The connection string should be: `postgresql://nupeer:nupeer@postgres:5432/nupeer`
- (Note: `postgres` is the service name, not `localhost`)

---

### Step 9: Restart Backend Server

After fixing the database connection:

1. **Stop the backend server** (Ctrl+C in the terminal where it's running)
2. **Restart the backend:**
```powershell
cd C:\NuPeer\backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

3. **Wait for the server to start** (you'll see "Application startup complete")

---

### Step 10: Test Calendar Event Creation

1. **Open your browser** and go to: `http://localhost:3000/calendar`
2. **Try to create a calendar event**
3. **Check if it saves successfully**

---

## Using Docker Compose (Alternative Method)

If you prefer using Docker Compose:

### Start all services:
```powershell
cd C:\NuPeer
docker-compose up -d postgres
```

**Wait 10 seconds** for PostgreSQL to be ready.

### Check if it's running:
```powershell
docker-compose ps
```

### Run migrations:
```powershell
cd C:\NuPeer\backend
.\venv\Scripts\Activate.ps1
python -m alembic upgrade head
```

---

## Common Issues and Solutions

### Issue 1: "Connection refused" or "Could not connect to server"

**Solution:**
- Make sure Docker Desktop is running
- Start the PostgreSQL container: `docker start nupeer-postgres`
- Wait 10 seconds after starting
- Verify container is running: `docker ps --filter "name=nupeer-postgres"`

### Issue 2: "Table 'calendar_events' does not exist"

**Solution:**
- Run the migration: `python -m alembic upgrade head`
- Verify tables exist (see Step 6)

### Issue 3: "Port 5433 is already in use"

**Solution:**
- Check what's using the port: `netstat -an | findstr 5433`
- Stop the conflicting service or use a different port
- Update `DATABASE_URL` in `.env` if you change the port

### Issue 4: "Connection timeout"

**Solution:**
- Check if PostgreSQL container is healthy: `docker logs nupeer-postgres`
- Restart the container: `docker restart nupeer-postgres`
- Wait 15 seconds and try again

### Issue 5: Backend can't connect even though container is running

**Solution:**
- Verify the connection string is correct
- Try using `127.0.0.1` instead of `localhost` in `DATABASE_URL`
- Check if you're using the correct port (5433 for local, 5432 for Docker Compose)

---

## Verification Checklist

Before trying to create a calendar event, verify:

- [ ] Docker Desktop is running
- [ ] PostgreSQL container is running (`docker ps --filter "name=nupeer-postgres"`)
- [ ] Database connection test passes (Step 5)
- [ ] Calendar tables exist (Step 6)
- [ ] Migration has been run (Step 7)
- [ ] Backend server is running and shows "Application startup complete"
- [ ] Backend logs show no database connection errors

---

## Quick Fix Script

If you want to automate the fix, you can use the provided PowerShell script:

```powershell
cd C:\NuPeer\backend
.\run_calendar_migration.ps1
```

This script will:
1. Check if Docker is running
2. Check if PostgreSQL container exists and start it if needed
3. Verify database connection
4. Check if tables exist
5. Run migration if needed

---

## Still Having Issues?

If you've followed all steps and still get errors:

1. **Check backend logs:**
   - Look at the terminal where the backend is running
   - Look for error messages related to database connection

2. **Check container logs:**
   ```powershell
   docker logs nupeer-postgres
   ```

3. **Verify database is accessible:**
   ```powershell
   docker exec -it nupeer-postgres psql -U nupeer -d nupeer -c "\dt"
   ```
   This should list all tables including `calendar_events` and `event_participants`

4. **Check network connectivity:**
   ```powershell
   Test-NetConnection -ComputerName localhost -Port 5433
   ```

5. **Restart everything:**
   ```powershell
   docker stop nupeer-postgres
   docker start nupeer-postgres
   # Wait 15 seconds
   # Restart backend server
   ```

---

## Summary

The most common fix is:

1. **Start Docker Desktop**
2. **Start PostgreSQL container:** `docker start nupeer-postgres`
3. **Run migration:** `cd backend && .\venv\Scripts\Activate.ps1 && python -m alembic upgrade head`
4. **Restart backend server**

After these steps, calendar event creation should work!

