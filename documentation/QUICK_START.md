# Quick Start Guide - Getting Backend Running

## Option 1: Using Docker Compose (Recommended - Easiest)

This will start all services (PostgreSQL, Redis, MinIO, Backend API) in one command:

```bash
# From the project root (C:\NuPeer)
docker-compose up -d
```

This will:
- Start PostgreSQL database on port 5432
- Start Redis on port 6379
- Start MinIO (object storage) on ports 9000, 9001
- Start Backend API on port 8000
- Start Celery worker for PDF processing

**Check if it's running:**
```bash
docker-compose ps
```

**View logs:**
```bash
docker-compose logs backend
```

**Stop everything:**
```bash
docker-compose down
```

## Option 2: Manual Setup (Without Docker)

### Step 1: Start PostgreSQL, Redis, and MinIO

You can use Docker just for the services:
```bash
docker-compose up -d postgres redis minio
```

Or install them separately on your system.

### Step 2: Set up Python Environment

```bash
cd backend
python -m venv venv

# On Windows PowerShell:
.\venv\Scripts\Activate.ps1

# On Windows CMD:
venv\Scripts\activate.bat

# On Mac/Linux:
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Set up Environment Variables

Create a `.env` file in the `backend` directory:
```env
DATABASE_URL=postgresql://nupeer:nupeer@localhost:5432/nupeer
REDIS_URL=redis://localhost:6379/0
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_NAME=nupeer-transcripts
SECRET_KEY=your-secret-key-change-in-production
CORS_ORIGINS=["http://localhost:3000","http://localhost:3001"]
```

### Step 5: Initialize Database

```bash
# Create initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

### Step 6: Start Backend Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 7: Start Celery Worker (in a separate terminal)

```bash
cd backend
# Make sure venv is activated
celery -A app.tasks.process_transcript worker --loglevel=info
```

## Verify Backend is Running

Open your browser and go to:
- **API Docs**: http://localhost:8000/api/docs
- **Health Check**: http://localhost:8000/health

You should see:
```json
{"status": "healthy"}
```

## Troubleshooting

### Port 8000 already in use
```bash
# Find what's using port 8000 (Windows)
netstat -ano | findstr :8000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Database connection error
- Make sure PostgreSQL is running
- Check DATABASE_URL in .env matches your PostgreSQL setup
- Verify database `nupeer` exists

### CORS errors
- Make sure `CORS_ORIGINS` includes `http://localhost:3000`
- Restart the backend after changing CORS settings

## Next Steps

Once the backend is running:
1. Start the frontend: `cd frontend && npm run dev`
2. Open http://localhost:3000
3. Try registering a new account

