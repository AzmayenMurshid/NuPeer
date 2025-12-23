# Script to help set up PostgreSQL database for NuPeer

Write-Host "=== NuPeer PostgreSQL Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is installed
Write-Host "[1/4] Checking if PostgreSQL is installed..." -ForegroundColor Yellow
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue

if (-not $psqlPath) {
    Write-Host "PostgreSQL command line tools not found in PATH." -ForegroundColor Red
    Write-Host "Please install PostgreSQL from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "Or add PostgreSQL bin directory to your PATH." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Default PostgreSQL path: C:\Program Files\PostgreSQL\15\bin" -ForegroundColor Cyan
    exit 1
}

Write-Host "PostgreSQL found!" -ForegroundColor Green

# Check if PostgreSQL service is running
Write-Host "[2/4] Checking if PostgreSQL service is running..." -ForegroundColor Yellow
$pgService = Get-Service -Name postgresql* -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'Running' }

if (-not $pgService) {
    Write-Host "PostgreSQL service is not running!" -ForegroundColor Red
    Write-Host "Attempting to start PostgreSQL service..." -ForegroundColor Yellow
    
    $services = Get-Service -Name postgresql* -ErrorAction SilentlyContinue
    if ($services) {
        $service = $services[0]
        Start-Service -Name $service.Name
        Start-Sleep -Seconds 3
        
        if ((Get-Service -Name $service.Name).Status -eq 'Running') {
            Write-Host "PostgreSQL service started!" -ForegroundColor Green
        } else {
            Write-Host "Failed to start PostgreSQL service." -ForegroundColor Red
            Write-Host "Please start it manually from Services (services.msc)" -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host "PostgreSQL service not found. Please install PostgreSQL first." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "PostgreSQL service is running!" -ForegroundColor Green
}

# Test connection
Write-Host "[3/4] Testing database connection..." -ForegroundColor Yellow
Write-Host "You will be prompted for the PostgreSQL password." -ForegroundColor Cyan
Write-Host "Default user is 'postgres'. Enter the password you set during installation." -ForegroundColor Cyan
Write-Host ""

$testConnection = psql -U postgres -c "SELECT version();" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Connection successful!" -ForegroundColor Green
} else {
    Write-Host "Connection failed. Please check your password." -ForegroundColor Red
    Write-Host "You can manually create the database using pgAdmin or psql." -ForegroundColor Yellow
    exit 1
}

# Create database
Write-Host "[4/4] Creating database 'nupeer'..." -ForegroundColor Yellow
Write-Host "If database already exists, this will show an error (which is OK)." -ForegroundColor Cyan
Write-Host ""

$createDb = psql -U postgres -c "CREATE DATABASE nupeer;" 2>&1
if ($LASTEXITCODE -eq 0 -or $createDb -match "already exists") {
    Write-Host "Database 'nupeer' is ready!" -ForegroundColor Green
} else {
    Write-Host "Error creating database. You may need to create it manually." -ForegroundColor Yellow
    Write-Host "Run: psql -U postgres" -ForegroundColor Cyan
    Write-Host "Then: CREATE DATABASE nupeer;" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Make sure backend/.env has correct DATABASE_URL" -ForegroundColor White
Write-Host "2. Run: cd backend" -ForegroundColor White
Write-Host "3. Run: .\venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "4. Run: alembic upgrade head" -ForegroundColor White
Write-Host "5. Run: uvicorn app.main:app --reload" -ForegroundColor White
Write-Host ""

