# Script to start PostgreSQL with Docker and then start the backend

Write-Host "=== Starting NuPeer with Docker ===" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
$dockerCheck = docker --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker is not installed!" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Write-Host "See INSTALL_DOCKER.md for detailed instructions." -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/4] Checking if PostgreSQL container exists..." -ForegroundColor Yellow
$containerExists = docker ps -a --filter "name=nupeer-postgres" --format "{{.Names}}" 2>&1

if ($containerExists -eq "nupeer-postgres") {
    Write-Host "Container exists. Checking if it's running..." -ForegroundColor Yellow
    $isRunning = docker ps --filter "name=nupeer-postgres" --format "{{.Names}}" 2>&1
    
    if ($isRunning -eq "nupeer-postgres") {
        Write-Host "PostgreSQL is already running!" -ForegroundColor Green
    } else {
        Write-Host "Starting existing container..." -ForegroundColor Yellow
        docker start nupeer-postgres
        Start-Sleep -Seconds 3
    }
} else {
    Write-Host "[2/4] Creating and starting PostgreSQL container..." -ForegroundColor Yellow
    docker run -d --name nupeer-postgres `
        -e POSTGRES_USER=nupeer `
        -e POSTGRES_PASSWORD=nupeer `
        -e POSTGRES_DB=nupeer `
        -p 5432:5432 `
        postgres:15
    
    Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

Write-Host "[3/4] Activating Python virtual environment..." -ForegroundColor Yellow
if (Test-Path "venv\Scripts\Activate.ps1") {
    & .\venv\Scripts\Activate.ps1
} else {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    & .\venv\Scripts\Activate.ps1
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
}

Write-Host "[4/4] Initializing database..." -ForegroundColor Yellow
alembic upgrade head 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating initial migration..." -ForegroundColor Yellow
    alembic revision --autogenerate -m "Initial migration" 2>&1 | Out-Null
    alembic upgrade head 2>&1 | Out-Null
}

Write-Host ""
Write-Host "=== Starting Backend Server ===" -ForegroundColor Green
Write-Host ""
Write-Host "Server will be available at:" -ForegroundColor Cyan
Write-Host "  - API: http://localhost:8000" -ForegroundColor White
Write-Host "  - Docs: http://localhost:8000/api/docs" -ForegroundColor White
Write-Host "  - Health: http://localhost:8000/health" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

