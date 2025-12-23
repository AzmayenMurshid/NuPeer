# Script to help configure backend for cloud PostgreSQL

Write-Host "=== NuPeer Cloud Database Setup ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will help you configure the backend to use a cloud PostgreSQL database." -ForegroundColor Yellow
Write-Host ""

# Check if .env exists
$envPath = ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
    if (-not (Test-Path $envPath)) {
        Write-Host "Creating new .env file..." -ForegroundColor Yellow
        @"
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
CORS_ORIGINS=["http://localhost:3000","http://localhost:3001"]

# Object Storage (MinIO/S3)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_NAME=nupeer-transcripts
S3_USE_SSL=False

# Redis (for Celery)
REDIS_URL=redis://localhost:6379/0

# File Upload
MAX_UPLOAD_SIZE=10485760
ALLOWED_EXTENSIONS=[".pdf"]
"@ | Out-File -FilePath $envPath -Encoding UTF8
    }
}

Write-Host "Current DATABASE_URL in .env:" -ForegroundColor Cyan
$currentDb = Select-String -Path $envPath -Pattern "^DATABASE_URL=" | ForEach-Object { $_.Line }
if ($currentDb) {
    Write-Host $currentDb -ForegroundColor White
} else {
    Write-Host "Not set" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Cloud Database Providers ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Supabase (Free: 500 MB) - https://supabase.com/" -ForegroundColor Green
Write-Host "2. Neon (Free: 0.5 GB) - https://neon.tech/" -ForegroundColor Green
Write-Host "3. Railway (Free: $5 credit) - https://railway.app/" -ForegroundColor Green
Write-Host "4. Render (Free tier) - https://render.com/" -ForegroundColor Green
Write-Host "5. Custom connection string" -ForegroundColor Yellow
Write-Host ""

$choice = Read-Host "Enter your choice (1-5)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "=== Supabase Setup ===" -ForegroundColor Cyan
        Write-Host "1. Go to https://supabase.com/ and create a project" -ForegroundColor White
        Write-Host "2. Go to Project Settings → Database" -ForegroundColor White
        Write-Host "3. Copy the connection string (URI format)" -ForegroundColor White
        Write-Host ""
        $connectionString = Read-Host "Paste your Supabase connection string"
    }
    "2" {
        Write-Host ""
        Write-Host "=== Neon Setup ===" -ForegroundColor Cyan
        Write-Host "1. Go to https://neon.tech/ and create a project" -ForegroundColor White
        Write-Host "2. Go to Dashboard → Connection Details" -ForegroundColor White
        Write-Host "3. Copy the connection string" -ForegroundColor White
        Write-Host ""
        $connectionString = Read-Host "Paste your Neon connection string"
    }
    "3" {
        Write-Host ""
        Write-Host "=== Railway Setup ===" -ForegroundColor Cyan
        Write-Host "1. Go to https://railway.app/ and create a project" -ForegroundColor White
        Write-Host "2. Add PostgreSQL service" -ForegroundColor White
        Write-Host "3. Copy the connection string from Variables" -ForegroundColor White
        Write-Host ""
        $connectionString = Read-Host "Paste your Railway connection string"
    }
    "4" {
        Write-Host ""
        Write-Host "=== Render Setup ===" -ForegroundColor Cyan
        Write-Host "1. Go to https://render.com/ and create a PostgreSQL database" -ForegroundColor White
        Write-Host "2. Copy the Internal Database URL or External Database URL" -ForegroundColor White
        Write-Host ""
        $connectionString = Read-Host "Paste your Render connection string"
    }
    "5" {
        Write-Host ""
        Write-Host "=== Custom Connection String ===" -ForegroundColor Cyan
        Write-Host "Format: postgresql://user:password@host:port/database" -ForegroundColor White
        Write-Host "For SSL: postgresql://user:password@host:port/database?sslmode=require" -ForegroundColor White
        Write-Host ""
        $connectionString = Read-Host "Enter your connection string"
    }
    default {
        Write-Host "Invalid choice. Exiting." -ForegroundColor Red
        exit
    }
}

if ($connectionString) {
    # Update .env file
    Write-Host ""
    Write-Host "Updating .env file..." -ForegroundColor Yellow
    
    $envContent = Get-Content $envPath
    $updated = $false
    
    for ($i = 0; $i -lt $envContent.Length; $i++) {
        if ($envContent[$i] -match "^DATABASE_URL=") {
            $envContent[$i] = "DATABASE_URL=$connectionString"
            $updated = $true
            break
        }
    }
    
    if (-not $updated) {
        # Add if not found
        $envContent += "DATABASE_URL=$connectionString"
    }
    
    $envContent | Out-File -FilePath $envPath -Encoding UTF8
    
    Write-Host "DATABASE_URL updated in .env file!" -ForegroundColor Green
    Write-Host ""
    
    # Test connection
    Write-Host "Testing database connection..." -ForegroundColor Yellow
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    
    if (Test-Path "venv\Scripts\Activate.ps1") {
        & .\venv\Scripts\Activate.ps1
        
        $testResult = python -c "from app.core.database import engine; engine.connect(); print('Connection successful!')" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Database connection successful!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Next steps:" -ForegroundColor Cyan
            Write-Host "1. Run: alembic upgrade head" -ForegroundColor White
            Write-Host "2. Run: uvicorn app.main:app --reload" -ForegroundColor White
        } else {
            Write-Host "Connection failed. Please check your connection string." -ForegroundColor Red
            Write-Host "Error: $testResult" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Virtual environment not found. Please create it first." -ForegroundColor Red
    }
} else {
    Write-Host "No connection string provided. Exiting." -ForegroundColor Red
}

