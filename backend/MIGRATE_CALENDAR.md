# Calendar Events Migration Guide

## Quick Fix for Database Connection Error

If you're getting a "Database connection error" or "table does not exist" error when trying to save calendar events, you need to run the database migration.

## Option 1: Using the Migration Script (Easiest)

```powershell
cd backend
.\run_calendar_migration.ps1
```

## Option 2: Manual Migration

```powershell
cd backend

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Run migration
python -m alembic upgrade head
```

## Option 3: If Migration Fails

If you get an error about the migration revision, you may need to create a new migration:

```powershell
cd backend
.\venv\Scripts\Activate.ps1

# Check current migration state
python -m alembic current

# Create a new migration for calendar events
python -m alembic revision --autogenerate -m "Add calendar events"

# Apply the migration
python -m alembic upgrade head
```

## Verify Migration Worked

After running the migration, you should see:
- `calendar_events` table created
- `event_participants` table created
- `eventtype` enum type created

You can verify by checking the database or trying to create a calendar event again.

## Troubleshooting

### "relation calendar_events does not exist"
- The migration hasn't been run yet
- Run the migration using one of the options above

### "enum type eventtype already exists"
- The enum was created but tables weren't
- The migration script handles this automatically
- Or manually run: `python -m alembic upgrade head`

### "down_revision mismatch"
- Update the `down_revision` in `alembic/versions/create_calendar_events.py` to match your latest migration
- Or use `alembic revision --autogenerate` to create a new migration

