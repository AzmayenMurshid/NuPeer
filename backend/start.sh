#!/bin/bash
# Railway startup script - ensures backend starts correctly

echo "=== Starting NuPeer Backend ==="

# Check if PORT is set (Railway provides this)
if [ -z "$PORT" ]; then
    echo "WARNING: PORT not set, using default 8000"
    export PORT=8000
fi

# Run database migrations (optional - uncomment if you want auto-migrations)
# python -m alembic upgrade head || echo "Migration skipped or failed"

# Start the server
echo "Starting uvicorn on port $PORT..."
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1

