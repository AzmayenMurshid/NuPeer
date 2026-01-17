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
        print(f"WARNING: Invalid PORT value '{port}', using default 8000")
        port = 8000
    
    print(f"=== Starting NuPeer Backend on port {port} ===")
    
    # Import uvicorn and run
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        workers=1
    )

if __name__ == "__main__":
    main()

