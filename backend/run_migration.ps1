# PowerShell script to run database migration
# Multiple methods available

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database Migration - Grade Column" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Method selection
Write-Host "Select migration method:" -ForegroundColor Yellow
Write-Host "1. Alembic (Recommended)"
Write-Host "2. Python Script (SQLAlchemy)"
Write-Host "3. Direct SQL (psql via Docker)"
Write-Host "4. SQL File Execution"
Write-Host ""

$choice = Read-Host "Enter choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host "`nRunning Alembic migration..." -ForegroundColor Green
        cd backend
        alembic upgrade head
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ Migration completed successfully!" -ForegroundColor Green
        } else {
            Write-Host "`n❌ Migration failed!" -ForegroundColor Red
        }
    }
    "2" {
        Write-Host "`nRunning Python migration script..." -ForegroundColor Green
        cd backend
        python run_migration_script.py
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ Migration completed successfully!" -ForegroundColor Green
        } else {
            Write-Host "`n❌ Migration failed!" -ForegroundColor Red
        }
    }
    "3" {
        Write-Host "`nRunning SQL via Docker..." -ForegroundColor Green
        $sql = "ALTER TABLE courses ALTER COLUMN grade TYPE VARCHAR(20);"
        docker exec -i nupeer-postgres psql -U nupeer -d nupeer -c $sql
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ Migration completed successfully!" -ForegroundColor Green
        } else {
            Write-Host "`n❌ Migration failed! Is Docker running?" -ForegroundColor Red
        }
    }
    "4" {
        Write-Host "`nExecuting SQL file..." -ForegroundColor Green
        Get-Content backend\fix_grade_column.sql | docker exec -i nupeer-postgres psql -U nupeer -d nupeer
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ Migration completed successfully!" -ForegroundColor Green
        } else {
            Write-Host "`n❌ Migration failed! Is Docker running?" -ForegroundColor Red
        }
    }
    default {
        Write-Host "`n❌ Invalid choice!" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
