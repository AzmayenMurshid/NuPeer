# Simple script to start the NuPeer backend server

Write-Host "=== Starting NuPeer Backend ===" -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment exists
if (-not (Test-Path "venv\Scripts\Activate.ps1")) {
    Write-Host "Virtual environment not found. Creating..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    & .\venv\Scripts\Activate.ps1
    pip install -q -r requirements.txt
}

# Activate virtual environment
Write-Host "[1/3] Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Check database connection
Write-Host "[2/3] Checking database connection..." -ForegroundColor Yellow
$dbCheck = python -c "from app.core.database import engine; engine.connect(); print('OK')" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Database connection failed!" -ForegroundColor Red
    Write-Host "Make sure PostgreSQL is running:" -ForegroundColor Yellow
    Write-Host "  - Docker: docker start nupeer-postgres" -ForegroundColor White
    Write-Host "  - Or start PostgreSQL service from Services (services.msc)" -ForegroundColor White
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit
    }
} else {
    Write-Host "Database connection OK!" -ForegroundColor Green
}

# Start server
Write-Host "[3/3] Starting FastAPI server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "=== Backend Server Starting ===" -ForegroundColor Green
Write-Host ""
Write-Host "Server URLs:" -ForegroundColor Cyan
Write-Host "  - API: http://localhost:8000" -ForegroundColor White
Write-Host "  - API Docs: http://localhost:8000/api/docs" -ForegroundColor White
Write-Host "  - Health: http://localhost:8000/health" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
