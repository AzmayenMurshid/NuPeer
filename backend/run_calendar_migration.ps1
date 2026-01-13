# Script to run calendar events migration
# This creates the calendar_events and event_participants tables

Write-Host "=== Running Calendar Events Migration ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the backend directory
if (-not (Test-Path "alembic")) {
    Write-Host "ERROR: Must run this script from the backend directory!" -ForegroundColor Red
    Write-Host "Please run: cd backend" -ForegroundColor Yellow
    exit 1
}

# Activate virtual environment if it exists
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & .\venv\Scripts\Activate.ps1
} else {
    Write-Host "WARNING: Virtual environment not found. Make sure dependencies are installed." -ForegroundColor Yellow
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
    Write-Host "  Or: docker start nupeer-postgres" -ForegroundColor White
    exit 1
}
Write-Host "Database connection OK" -ForegroundColor Green

# Check if calendar_events table already exists
Write-Host "Checking if calendar_events table exists..." -ForegroundColor Yellow
$tableCheck = python -c "from app.core.database import engine; from sqlalchemy import inspect; inspector = inspect(engine); tables = inspector.get_table_names(); print('EXISTS' if 'calendar_events' in tables else 'NOT_EXISTS')" 2>&1

if ($tableCheck -match "EXISTS") {
    Write-Host "Calendar events table already exists. Migration may have already been run." -ForegroundColor Green
    Write-Host "If you're still getting errors, try running: python -m alembic upgrade head" -ForegroundColor Yellow
} else {
    # Run the migration
    Write-Host ""
    Write-Host "Running migration..." -ForegroundColor Yellow
    python -m alembic upgrade head

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=== Migration Complete ===" -ForegroundColor Green
        Write-Host "Calendar events tables have been created successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "ERROR: Migration failed!" -ForegroundColor Red
        Write-Host "Trying to create migration automatically..." -ForegroundColor Yellow
        
        # Try to create a new migration
        python -m alembic revision --autogenerate -m "Add calendar events tables"
        if ($LASTEXITCODE -eq 0) {
            python -m alembic upgrade head
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Migration created and applied successfully!" -ForegroundColor Green
            } else {
                Write-Host "ERROR: Failed to apply auto-generated migration!" -ForegroundColor Red
                Write-Host "Check the error message above for details." -ForegroundColor Yellow
                exit 1
            }
        } else {
            Write-Host "ERROR: Failed to create migration!" -ForegroundColor Red
            Write-Host "Check the error message above for details." -ForegroundColor Yellow
            Write-Host ""
            Write-Host "You may need to manually update the down_revision in:" -ForegroundColor Yellow
            Write-Host "  alembic/versions/create_calendar_events.py" -ForegroundColor White
            exit 1
        }
    }
}

