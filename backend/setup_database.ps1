# Database Setup Script
# Ensures all database tables are created

Write-Host "=== Database Setup ===" -ForegroundColor Cyan
Write-Host ""

# Activate virtual environment
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & .\venv\Scripts\Activate.ps1
} else {
    Write-Host "ERROR: Virtual environment not found!" -ForegroundColor Red
    Write-Host "Run: python -m venv venv" -ForegroundColor Yellow
    exit 1
}

# Check database connection
Write-Host "Checking database connection..." -ForegroundColor Yellow
$connectionCheck = python -c "from app.core.database import engine; engine.connect(); print('OK')" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Cannot connect to database!" -ForegroundColor Red
    Write-Host $connectionCheck
    Write-Host ""
    Write-Host "Make sure PostgreSQL is running:" -ForegroundColor Yellow
    Write-Host "  docker ps --filter 'name=nupeer-postgres'" -ForegroundColor White
    exit 1
}
Write-Host "Database connection OK" -ForegroundColor Green

# Check if versions directory exists
if (!(Test-Path "alembic\versions")) {
    Write-Host "Creating alembic versions directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "alembic\versions" -Force | Out-Null
}

# Check current migration state
Write-Host "Checking migration state..." -ForegroundColor Yellow
$current = alembic current 2>&1
if ($LASTEXITCODE -ne 0 -or $current -match "empty") {
    Write-Host "No migrations found. Creating initial migration..." -ForegroundColor Yellow
    alembic revision --autogenerate -m "Initial migration" 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to create migration!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Migration created successfully" -ForegroundColor Green
}

# Apply migrations
Write-Host "Applying migrations..." -ForegroundColor Yellow
alembic upgrade head 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to apply migrations!" -ForegroundColor Red
    exit 1
}
Write-Host "Migrations applied successfully" -ForegroundColor Green

# Verify tables exist
Write-Host "Verifying database tables..." -ForegroundColor Yellow
python check_tables.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Database tables verification failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Database Setup Complete ===" -ForegroundColor Green
Write-Host "You can now start the backend server." -ForegroundColor Cyan

