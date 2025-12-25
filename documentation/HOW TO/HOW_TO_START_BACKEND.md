# How to Start the Backend Server

## Quick Start (Easiest Method)

### Option 1: Use the Startup Script

```powershell
cd backend
.\start_backend.ps1
```

This script will:
- Activate the virtual environment
- Check database connection
- Start the server

### Option 2: Manual Start

#### Step 1: Navigate to Backend Directory
```powershell
cd C:\NuPeer\backend
```

#### Step 2: Activate Virtual Environment
```powershell
.\venv\Scripts\Activate.ps1
```

You should see `(venv)` in your prompt.

#### Step 3: Start the Server
```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Verify It's Running

1. **Check the terminal output** - You should see:
   ```
   INFO:     Uvicorn running on http://0.0.0.0:8000
   INFO:     Application startup complete.
   ```

2. **Open in browser:**
   - Health check: http://localhost:8000/health
   - Should show: `{"status": "healthy"}`
   
3. **API Documentation:**
   - http://localhost:8000/api/docs
   - Should show Swagger UI

## Troubleshooting

### "No module named 'app'"
- Make sure you're in the `backend` directory
- Make sure virtual environment is activated

### "Connection refused" (Database error)
- **If using Docker:**
  ```powershell
  docker start nupeer-postgres
  ```
  
- **If using local PostgreSQL:**
  ```powershell
  Start-Service postgresql-x64-15
  ```
  (Service name may vary - check with `Get-Service -Name postgresql*`)

### Port 8000 already in use
```powershell
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

### Virtual environment not found
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## What Should Happen

When the server starts successfully, you'll see:
```
INFO:     Will watch for changes in these directories: ['C:\\NuPeer\\backend']
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using WatchFiles
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## Keep It Running

- **Keep the terminal window open** - The server runs in this window
- **Don't close the terminal** - Closing it will stop the server
- **Press Ctrl+C** to stop the server when done

## Next Steps

Once the backend is running:
1. Start the frontend in a **new terminal**:
   ```powershell
   cd C:\NuPeer\frontend
   npm run dev
   ```

2. Open http://localhost:3000 in your browser

3. Try registering a new account!

