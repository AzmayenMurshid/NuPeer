# Simple backend startup script
# This starts the backend even if database isn't ready (for testing)

Write-Host "=== NuPeer Backend Startup ===" -ForegroundColor Cyan
Write-Host ""

# Activate venv
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "[1/3] Activating virtual environment..." -ForegroundColor Yellow
    & .\venv\Scripts\Activate.ps1
} else {
    Write-Host "[1/3] Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    & .\venv\Scripts\Activate.ps1
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
}

Write-Host "[2/3] Checking database connection..." -ForegroundColor Yellow
$dbCheck = python -c "from app.core.database import engine; engine.connect(); print('OK')" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Database not connected!" -ForegroundColor Red
    Write-Host "The server will start but database operations will fail." -ForegroundColor Yellow
    Write-Host "Make sure PostgreSQL is running on localhost:5432" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        Write-Host "Exiting. Please start PostgreSQL first." -ForegroundColor Red
        exit
    }
} else {
    Write-Host "Database connection OK!" -ForegroundColor Green
}

Write-Host "[3/3] Starting FastAPI server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Server will be available at:" -ForegroundColor Green
Write-Host "  - API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "  - Docs: http://localhost:8000/api/docs" -ForegroundColor Cyan
Write-Host "  - Health: http://localhost:8000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

