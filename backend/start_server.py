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
    
    # Try to import and test the app before starting
    try:
        print("Importing app...")
        from app.main import app
        print("App imported successfully")
    except Exception as e:
        print(f"ERROR: Failed to import app: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    # Import uvicorn and run
    # Note: uvicorn is installed via requirements.txt
    # IDE may show import error if not installed locally, but it will work on Railway
    try:
        import uvicorn  # type: ignore
        print(f"Starting uvicorn server...")
        print(f"Server will run until stopped. Press CTRL+C to stop.")
        # Use run() which blocks and keeps the process alive
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=port,
            workers=1,
            log_level="info",
            access_log=True
        )
    except KeyboardInterrupt:
        print("\nShutting down server...")
        sys.exit(0)
    except Exception as e:
        print(f"ERROR: Failed to start server: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()

