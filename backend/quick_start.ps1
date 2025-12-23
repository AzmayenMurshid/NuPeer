# Quick Start Script for NuPeer Backend
# This will set up everything and start the backend

Write-Host "=== NuPeer Backend Quick Start ===" -ForegroundColor Cyan
Write-Host ""

# Check if we should use Docker or local PostgreSQL
Write-Host "Choose your setup:" -ForegroundColor Yellow
Write-Host "1. Use Docker for PostgreSQL (recommended)" -ForegroundColor Green
Write-Host "2. Use local PostgreSQL installation" -ForegroundColor Green
Write-Host ""
$choice = Read-Host "Enter choice (1 or 2)"

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "[1/5] Starting PostgreSQL with Docker..." -ForegroundColor Yellow
    
    # Check if container exists
    $containerExists = docker ps -a --filter "name=nupeer-postgres" --format "{{.Names}}" 2>&1
    
    if ($containerExists -eq "nupeer-postgres") {
        Write-Host "Container exists. Starting..." -ForegroundColor Yellow
        docker start nupeer-postgres 2>&1 | Out-Null
    } else {
        Write-Host "Creating PostgreSQL container..." -ForegroundColor Yellow
        docker run -d --name nupeer-postgres `
            -e POSTGRES_USER=nupeer `
            -e POSTGRES_PASSWORD=nupeer `
            -e POSTGRES_DB=nupeer `
            -p 5432:5432 `
            postgres:15 2>&1 | Out-Null
    }
    
    Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    Write-Host "PostgreSQL is running!" -ForegroundColor Green
    
    $dbUrl = "postgresql://nupeer:nupeer@localhost:5432/nupeer"
} else {
    Write-Host ""
    Write-Host "[1/5] Checking local PostgreSQL..." -ForegroundColor Yellow
    
    # Check if PostgreSQL service is running
    $pgService = Get-Service -Name postgresql* -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'Running' }
    
    if (-not $pgService) {
        Write-Host "Starting PostgreSQL service..." -ForegroundColor Yellow
        $services = Get-Service -Name postgresql* -ErrorAction SilentlyContinue
        if ($services) {
            Start-Service -Name $services[0].Name
            Start-Sleep -Seconds 3
        } else {
            Write-Host "PostgreSQL service not found. Please make sure PostgreSQL is installed." -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host "PostgreSQL is running!" -ForegroundColor Green
    
    # Create database if it doesn't exist
    Write-Host "Creating database if it doesn't exist..." -ForegroundColor Yellow
    $env:PGPASSWORD = "nupeer"
    psql -U postgres -c "CREATE DATABASE nupeer;" 2>&1 | Out-Null
    # Ignore error if database already exists
    
    $dbUrl = "postgresql://postgres:nupeer@localhost:5432/nupeer"
}

# Activate virtual environment
Write-Host "[2/5] Setting up Python environment..." -ForegroundColor Yellow
if (Test-Path "venv\Scripts\Activate.ps1") {
    & .\venv\Scripts\Activate.ps1
} else {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    & .\venv\Scripts\Activate.ps1
    Write-Host "Installing dependencies (this may take a few minutes)..." -ForegroundColor Yellow
    pip install -q -r requirements.txt
}

# Create/Update .env file
Write-Host "[3/5] Configuring environment..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    @"
DATABASE_URL=$dbUrl
SECRET_KEY=your-secret-key-change-in-production-use-openssl-rand-hex-32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=["http://localhost:3000","http://localhost:3001"]
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_NAME=nupeer-transcripts
S3_USE_SSL=False
REDIS_URL=redis://localhost:6379/0
MAX_UPLOAD_SIZE=10485760
ALLOWED_EXTENSIONS=[".pdf"]
"@ | Out-File -FilePath ".env" -Encoding UTF8
} else {
    # Update DATABASE_URL if it's the default
    $envContent = Get-Content ".env"
    $updated = $false
    for ($i = 0; $i -lt $envContent.Length; $i++) {
        if ($envContent[$i] -match "^DATABASE_URL=" -and $envContent[$i] -match "localhost:5432/nupeer") {
            $envContent[$i] = "DATABASE_URL=$dbUrl"
            $updated = $true
        }
    }
    if ($updated) {
        $envContent | Out-File -FilePath ".env" -Encoding UTF8
    }
}

# Initialize database
Write-Host "[4/5] Initializing database..." -ForegroundColor Yellow
alembic upgrade head 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating initial migration..." -ForegroundColor Yellow
    alembic revision --autogenerate -m "Initial migration" 2>&1 | Out-Null
    alembic upgrade head 2>&1 | Out-Null
}
Write-Host "Database initialized!" -ForegroundColor Green

# Start server
Write-Host "[5/5] Starting backend server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "=== Backend is starting ===" -ForegroundColor Green
Write-Host ""
Write-Host "Server will be available at:" -ForegroundColor Cyan
Write-Host "  - API: http://localhost:8000" -ForegroundColor White
Write-Host "  - API Docs: http://localhost:8000/api/docs" -ForegroundColor White
Write-Host "  - Health Check: http://localhost:8000/health" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

