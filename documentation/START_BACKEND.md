# How to Start the Backend

## Quick Start (3 Steps)

### Step 1: Start PostgreSQL Database

You have two options:

**Option A: Using Docker (Easiest)**
```powershell
# From project root (C:\NuPeer)
docker run -d --name nupeer-postgres -e POSTGRES_USER=nupeer -e POSTGRES_PASSWORD=nupeer -e POSTGRES_DB=nupeer -p 5432:5432 postgres:15
```

**Option B: Install PostgreSQL Locally**
- Download from https://www.postgresql.org/download/windows/
- Install and create database:
  - Username: `nupeer`
  - Password: `nupeer`
  - Database: `nupeer`
  - Port: `5432`

### Step 2: Initialize Database

```powershell
cd backend
.\venv\Scripts\Activate.ps1

# Create database tables
alembic upgrade head
```

If you get "Target database is not up to date", run:
```powershell
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

### Step 3: Start Backend Server

```powershell
# Make sure you're in backend directory with venv activated
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

## Verify It's Working

1. Open browser: http://localhost:8000/health
   - Should show: `{"status": "healthy"}`

2. Open API docs: http://localhost:8000/api/docs
   - Should show Swagger UI with all endpoints

## Troubleshooting

### "Connection refused" error
- PostgreSQL is not running
- Start PostgreSQL (see Step 1)

### "Database does not exist"
- Create the database:
  ```sql
  CREATE DATABASE nupeer;
  ```

### Port 8000 already in use
```powershell
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

### "No module named 'app'"
- Make sure you're in the `backend` directory
- Make sure virtual environment is activated

## Using the Startup Script

I've created a PowerShell script to make this easier:

```powershell
cd backend
.\start_backend.ps1
```

This will:
- Activate virtual environment
- Check/create .env file
- Start the server

