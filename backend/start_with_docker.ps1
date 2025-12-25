# Script to start PostgreSQL and MinIO with Docker and then start the backend

# Ensure we're in the backend directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath
Write-Host "Working directory: $(Get-Location)" -ForegroundColor Gray

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

Write-Host "[1/5] Checking if PostgreSQL container exists..." -ForegroundColor Yellow
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
    Write-Host "Creating and starting PostgreSQL container..." -ForegroundColor Yellow
    docker run -d --name nupeer-postgres `
        -e POSTGRES_USER=nupeer `
        -e POSTGRES_PASSWORD=nupeer `
        -e POSTGRES_DB=nupeer `
        -p 5432:5432 `
        postgres:15
    
    Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

Write-Host "[2/5] Checking if MinIO container exists..." -ForegroundColor Yellow
$minioContainerExists = docker ps -a --filter "name=nupeer-minio" --format "{{.Names}}" 2>&1

if ($minioContainerExists -eq "nupeer-minio") {
    Write-Host "Container exists. Checking if it's running..." -ForegroundColor Yellow
    $minioIsRunning = docker ps --filter "name=nupeer-minio" --format "{{.Names}}" 2>&1
    
    if ($minioIsRunning -eq "nupeer-minio") {
        Write-Host "MinIO is already running!" -ForegroundColor Green
    } else {
        Write-Host "Starting existing container..." -ForegroundColor Yellow
        docker start nupeer-minio
        Start-Sleep -Seconds 3
    }
} else {
    Write-Host "Creating and starting MinIO container..." -ForegroundColor Yellow
    docker run -d --name nupeer-minio `
        -p 9000:9000 `
        -p 9001:9001 `
        -e "MINIO_ROOT_USER=minioadmin" `
        -e "MINIO_ROOT_PASSWORD=minioadmin" `
        minio/minio server /data --console-address ":9001"
    
    Write-Host "Waiting for MinIO to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    Write-Host "MinIO Console available at: http://localhost:9001" -ForegroundColor Cyan
    Write-Host "  Username: minioadmin" -ForegroundColor White
    Write-Host "  Password: minioadmin" -ForegroundColor White
}

Write-Host "[3/5] Setting up Python virtual environment..." -ForegroundColor Yellow
if (Test-Path "venv\Scripts\Activate.ps1") {
    & .\venv\Scripts\Activate.ps1
} else {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    & .\venv\Scripts\Activate.ps1
}

# Verify virtual environment is activated
if (-not $env:VIRTUAL_ENV) {
    Write-Host "WARNING: Virtual environment may not be activated properly. Activating again..." -ForegroundColor Yellow
    & .\venv\Scripts\Activate.ps1
}

# Always check and install dependencies to ensure uvicorn is available
Write-Host "Checking dependencies..." -ForegroundColor Yellow
$pythonPath = (Get-Command python).Source
Write-Host "Using Python: $pythonPath" -ForegroundColor Gray
$uvicornCheck = python -c "import uvicorn" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Dependencies not found. Installing from requirements.txt..." -ForegroundColor Yellow
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "Dependencies are installed!" -ForegroundColor Green
}

Write-Host "[4/5] Initializing database..." -ForegroundColor Yellow
# Check if alembic is installed
$alembicCheck = python -c "import alembic" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Alembic not found. Installing dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
}

# Use python -m alembic to ensure it runs from the virtual environment
python -m alembic upgrade head 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating initial migration..." -ForegroundColor Yellow
    python -m alembic revision --autogenerate -m "Initial migration" 2>&1 | Out-Null
    python -m alembic upgrade head 2>&1 | Out-Null
}

Write-Host "[5/5] Starting backend server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "=== Starting Backend Server ===" -ForegroundColor Green
Write-Host ""
Write-Host "Server will be available at:" -ForegroundColor Cyan
Write-Host "  - API: http://localhost:8000" -ForegroundColor White
Write-Host "  - Docs: http://localhost:8000/api/docs" -ForegroundColor White
Write-Host "  - Health: http://localhost:8000/health" -ForegroundColor White
Write-Host ""
Write-Host "Services running:" -ForegroundColor Cyan
Write-Host "  - PostgreSQL: localhost:5432" -ForegroundColor White
Write-Host "  - MinIO API: http://localhost:9000" -ForegroundColor White
Write-Host "  - MinIO Console: http://localhost:9001" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Use python -m uvicorn to ensure it runs from the virtual environment
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

