#!/usr/bin/env python
"""
Railway startup script - handles PORT environment variable correctly
"""
import os
import sys

def main():
    # Get PORT from environment (Railway provides this)
    port = os.environ.get('PORT', '8000')
    
    try:
        port = int(port)
    except ValueError:
        print(f"WARNING: Invalid PORT value '{port}', using default 8000", file=sys.stderr)
        port = 8000
    
    print(f"=== Starting NuPeer Backend on port {port} ===")
    print(f"PORT environment variable: {os.environ.get('PORT', 'NOT SET')}")
    
    # Check critical environment variables
    print("\n=== Checking Environment Variables ===")
    database_url = os.environ.get('DATABASE_URL', 'NOT SET')
    secret_key = os.environ.get('SECRET_KEY', 'NOT SET')
    
    if database_url == 'NOT SET':
        print("⚠️  WARNING: DATABASE_URL is not set!", file=sys.stderr)
        print("   The application may fail to start or database operations will fail.", file=sys.stderr)
    else:
        # Show first 30 chars and last 10 chars for security
        db_preview = database_url[:30] + "..." + database_url[-10:] if len(database_url) > 40 else database_url[:40]
        print(f"✓ DATABASE_URL: {db_preview}")
    
    if secret_key == 'NOT SET' or secret_key == 'your-secret-key-change-in-production':
        print("⚠️  WARNING: SECRET_KEY is not set or using default value!", file=sys.stderr)
        print("   JWT tokens will not be secure. Set SECRET_KEY in Railway.", file=sys.stderr)
    else:
        print("✓ SECRET_KEY: Set (hidden for security)")
    
    print("")
    
    # Try to import and test the app before starting
    try:
        print("=== Importing Application ===")
        from app.main import app
        print("✓ App imported successfully")
    except ImportError as e:
        print(f"❌ ERROR: Failed to import app - Missing module: {e}", file=sys.stderr)
        print("   Check requirements.txt and ensure all dependencies are installed.", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
    except Exception as e:
        print(f"❌ ERROR: Failed to import app: {e}", file=sys.stderr)
        print("   This could be due to:", file=sys.stderr)
        print("   - Missing environment variables", file=sys.stderr)
        print("   - Database connection error", file=sys.stderr)
        print("   - Code syntax error", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    # Import uvicorn and run
    # Note: uvicorn is installed via requirements.txt
    # IDE may show import error if not installed locally, but it will work on Railway
    try:
        import uvicorn  # type: ignore
        print("\n=== Starting Uvicorn Server ===")
        print(f"Server will run on http://0.0.0.0:{port}")
        print(f"Server will run until stopped. Press CTRL+C to stop.")
        print("")
        # Use run() which blocks and keeps the process alive
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",  # Must be 0.0.0.0, not 127.0.0.1, for Railway
            port=port,
            workers=1,
            log_level="info",
            access_log=True
        )
    except KeyboardInterrupt:
        print("\n=== Shutting down server... ===")
        sys.exit(0)
    except ImportError as e:
        print(f"❌ ERROR: Failed to import uvicorn: {e}", file=sys.stderr)
        print("   Ensure uvicorn is in requirements.txt", file=sys.stderr)
        print("   Run: pip install uvicorn[standard]", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ ERROR: Failed to start server: {e}", file=sys.stderr)
        print("   This could be due to:", file=sys.stderr)
        print("   - Port already in use", file=sys.stderr)
        print("   - Invalid host/port configuration", file=sys.stderr)
        print("   - Application startup error", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()

