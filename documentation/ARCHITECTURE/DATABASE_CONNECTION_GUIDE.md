# Database Connection Guide - Step by Step

## Overview
NuPeer uses **PostgreSQL** database running in a **Docker container** on port **5433**.

---

## Step 1: Check if Docker is Running

Open PowerShell and run:
```powershell
docker --version
```

**If Docker is not installed:**
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Install and restart your computer
3. Start Docker Desktop (wait for it to fully start - you'll see a whale icon in system tray)

**If Docker is installed but not running:**
- Open Docker Desktop application
- Wait until it shows "Docker Desktop is running"

---

## Step 2: Check if PostgreSQL Container Exists

Run this command:
```powershell
docker ps -a --filter "name=nupeer-postgres"
```

**If you see a container:**
- Go to Step 3

**If you don't see a container:**
- Go to Step 4 (Create New Container)

---

## Step 3: Start Existing PostgreSQL Container

If the container exists but is stopped:

```powershell
docker start nupeer-postgres
```

Wait 5 seconds, then verify it's running:
```powershell
docker ps --filter "name=nupeer-postgres"
```

You should see the container with status "Up".

---

## Step 4: Create New PostgreSQL Container (If Needed)

If the container doesn't exist, create it:

```powershell
docker run -d --name nupeer-postgres `
    -e POSTGRES_USER=nupeer `
    -e POSTGRES_PASSWORD=nupeer `
    -e POSTGRES_DB=nupeer `
    -p 5433:5432 `
    postgres:15
```

**Explanation:**
- `--name nupeer-postgres`: Container name
- `-e POSTGRES_USER=nupeer`: Database username
- `-e POSTGRES_PASSWORD=nupeer`: Database password
- `-e POSTGRES_DB=nupeer`: Database name
- `-p 5433:5432`: Maps host port 5433 to container port 5432
- `postgres:15`: PostgreSQL version 15 image

Wait 10 seconds for PostgreSQL to initialize.

---

## Step 5: Verify Database is Running

Check if the container is running:
```powershell
docker ps --filter "name=nupeer-postgres"
```

You should see output like:
```
CONTAINER ID   IMAGE          STATUS         PORTS                    NAMES
abc123def456   postgres:15    Up 2 minutes   0.0.0.0:5433->5432/tcp   nupeer-postgres
```

**If the container is not running:**
- Check logs: `docker logs nupeer-postgres`
- Try starting again: `docker start nupeer-postgres`

---

## Step 6: Test Database Connection

Test the connection from PowerShell:

```powershell
# Navigate to backend directory
cd C:\NuPeer\backend

# Activate virtual environment (if exists)
.\venv\Scripts\Activate.ps1

# Test connection
python -c "from app.core.database import engine; engine.connect(); print('Connection successful!')"
```

**Expected output:**
```
Connection successful!
```

**If you get an error:**
- Make sure the container is running (Step 5)
- Wait a bit longer (PostgreSQL takes time to start)
- Check the error message for specific issues

---

## Step 7: Initialize Database Schema

If this is the first time, create the database tables:

```powershell
# Make sure you're in the backend directory
cd C:\NuPeer\backend

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Run database migrations
alembic upgrade head
```

**Expected output:**
```
INFO  [alembic.runtime.migration] Running upgrade  -> abc123, Initial migration
```

---

## Step 8: Start the Backend Server

Now start the backend:

```powershell
# Make sure you're in the backend directory
cd C:\NuPeer\backend

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Or use the startup script:**
```powershell
cd C:\NuPeer\backend
.\start_backend.ps1
```

The script will automatically check the database connection and show "Database connection OK!" if successful.

---

## Alternative: Use Docker Compose (All Services)

If you want to start **all services** (PostgreSQL, Redis, MinIO, Backend) together:

```powershell
# Navigate to project root
cd C:\NuPeer

# Start all services
docker-compose up -d
```

This will:
- Start PostgreSQL on port 5433
- Start Redis on port 6379
- Start MinIO on ports 9000 and 9001
- Start Backend API on port 8000
- Start Celery worker

**Check status:**
```powershell
docker-compose ps
```

**View logs:**
```powershell
docker-compose logs -f
```

**Stop all services:**
```powershell
docker-compose down
```

---

## Troubleshooting

### Error: "port is already allocated"
**Solution:** Another service is using port 5433. Either:
- Stop the conflicting service
- Or change the port in `docker-compose.yml` and `backend/app/core/config.py`

### Error: "password authentication failed"
**Solution:** The password might have changed. Reset it:
```powershell
docker exec -it nupeer-postgres psql -U nupeer -d nupeer -c "ALTER USER nupeer WITH PASSWORD 'nupeer';"
```

### Error: "connection refused"
**Solution:** 
1. Check if container is running: `docker ps`
2. Check container logs: `docker logs nupeer-postgres`
3. Wait longer (PostgreSQL takes 10-30 seconds to start)

### Error: "database does not exist"
**Solution:** Create the database:
```powershell
docker exec -it nupeer-postgres psql -U nupeer -c "CREATE DATABASE nupeer;"
```

### Container keeps stopping
**Solution:** Check logs for errors:
```powershell
docker logs nupeer-postgres
```

Common issues:
- Port conflict
- Insufficient disk space
- Docker Desktop not running

---

## Quick Reference Commands

```powershell
# Check if container exists
docker ps -a --filter "name=nupeer-postgres"

# Start container
docker start nupeer-postgres

# Stop container
docker stop nupeer-postgres

# Remove container (WARNING: Deletes all data!)
docker rm -f nupeer-postgres

# View container logs
docker logs nupeer-postgres

# Check container status
docker ps --filter "name=nupeer-postgres"

# Test database connection
cd C:\NuPeer\backend
.\venv\Scripts\Activate.ps1
python -c "from app.core.database import engine; engine.connect(); print('OK')"

# Start all services with Docker Compose
cd C:\NuPeer
docker-compose up -d

# Stop all services
docker-compose down
```

---

## Database Connection Details

- **Host:** localhost (or 127.0.0.1)
- **Port:** 5433
- **Database:** nupeer
- **Username:** nupeer
- **Password:** nupeer
- **Connection String:** `postgresql://nupeer:nupeer@localhost:5433/nupeer`

---

## Need More Help?

1. **Check Docker Desktop:** Make sure it's running
2. **Check Container Logs:** `docker logs nupeer-postgres`
3. **Check Backend Logs:** Look at the terminal where backend is running
4. **Verify Port:** Make sure nothing else is using port 5433: `netstat -an | findstr 5433`

