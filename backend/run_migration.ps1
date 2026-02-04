# Script to start PostgreSQL and run database migration

Write-Host "=== Database Migration Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is available
$dockerCheck = docker --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker is not installed or not running!" -ForegroundColor Red
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "1. Install Docker Desktop from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Write-Host "2. Start Docker Desktop and wait for it to fully start" -ForegroundColor Yellow
    Write-Host "3. Run this script again" -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/3] Checking PostgreSQL container..." -ForegroundColor Yellow

# Check if container exists
$containerExists = docker ps -a --filter "name=nupeer-postgres" --format "{{.Names}}" 2>&1

if ($containerExists -eq "nupeer-postgres") {
    Write-Host "Container exists. Checking if it's running..." -ForegroundColor Yellow
    $isRunning = docker ps --filter "name=nupeer-postgres" --format "{{.Names}}" 2>&1
    
    if ($isRunning -eq "nupeer-postgres") {
        Write-Host "PostgreSQL is already running!" -ForegroundColor Green
    } else {
        Write-Host "Starting PostgreSQL container..." -ForegroundColor Yellow
        docker start nupeer-postgres
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: Failed to start container!" -ForegroundColor Red
            exit 1
        }
        Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
} else {
    Write-Host "Creating PostgreSQL container..." -ForegroundColor Yellow
    docker run -d --name nupeer-postgres `
        -e POSTGRES_USER=nupeer `
        -e POSTGRES_PASSWORD=nupeer `
        -e POSTGRES_DB=nupeer `
        -p 5433:5432 `
        postgres:15
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to create container!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Waiting for PostgreSQL to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

Write-Host "[2/3] Verifying database connection..." -ForegroundColor Yellow
$connectionTest = docker exec nupeer-postgres psql -U nupeer -d nupeer -c "SELECT 1;" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Database connection test failed, but continuing..." -ForegroundColor Yellow
    Write-Host "Waiting a bit longer..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

Write-Host "[3/3] Running database migration..." -ForegroundColor Yellow

# Check if we're in the backend directory
$backendPath = Join-Path $PSScriptRoot "backend"
if (Test-Path $backendPath) {
    Set-Location $backendPath
}

# Activate virtual environment if it exists
$venvPath = Join-Path $PSScriptRoot "venv"
if (-not (Test-Path $venvPath)) {
    $venvPath = Join-Path (Split-Path $PSScriptRoot -Parent) "venv"
}

if (Test-Path $venvPath) {
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    $activateScript = Join-Path $venvPath "Scripts\Activate.ps1"
    if (Test-Path $activateScript) {
        & $activateScript
    }
}

# Try to run alembic
$alembicCmd = "alembic upgrade head"
Write-Host "Running: $alembicCmd" -ForegroundColor Gray
Invoke-Expression $alembicCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== Migration Complete ===" -ForegroundColor Green
    Write-Host "The pdf_content column has been added to the transcripts table." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "ERROR: Migration failed!" -ForegroundColor Red
    Write-Host "Trying alternative method..." -ForegroundColor Yellow
    
    # Try with python -m alembic
    $pythonCmd = "python -m alembic upgrade head"
    Write-Host "Running: $pythonCmd" -ForegroundColor Gray
    Invoke-Expression $pythonCmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=== Migration Complete ===" -ForegroundColor Green
        Write-Host "The pdf_content column has been added to the transcripts table." -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "ERROR: Migration failed!" -ForegroundColor Red
        Write-Host "Please ensure:" -ForegroundColor Yellow
        Write-Host "1. Virtual environment is activated" -ForegroundColor Yellow
        Write-Host "2. Alembic is installed: pip install alembic" -ForegroundColor Yellow
        Write-Host "3. You're in the backend directory" -ForegroundColor Yellow
        exit 1
    }
}

