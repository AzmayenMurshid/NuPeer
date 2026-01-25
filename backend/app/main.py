"""
NuPeer - Main FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from typing import List
from app.api.v1 import auth, transcripts, courses, help_requests, recommendations, analytics, calendar, mentorship, points
from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="NuPeer API",
    description="Sigma Nu Zeta Chi Class Matching System",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

def normalize_cors_origins(origins: List[str]) -> List[str]:
    """
    Normalize CORS origins by:
    - Converting all to strings
    - Removing trailing slashes
    - Removing duplicates while preserving order
    - Filtering out empty values
    """
    normalized = []
    seen = set()
    
    for origin in origins:
        if not origin:
            continue
        
        # Convert to string and clean
        origin_str = str(origin).strip().rstrip('/')
        
        # Skip empty strings and add to seen set
        if origin_str and origin_str not in seen:
            normalized.append(origin_str)
            seen.add(origin_str)
    
    return normalized


def get_cors_origins() -> List[str]:
    """
    Get and process CORS origins from settings.
    Handles various input formats and ensures localhost is included for development.
    """
    # Get CORS_ORIGINS from settings (should already be a list from config.py validators)
    cors_origins = settings.CORS_ORIGINS
    
    # Handle edge cases where it might still be a string or other type
    if isinstance(cors_origins, str):
        import json
        try:
            # Try parsing as JSON array first
            if cors_origins.strip().startswith('['):
                cors_origins = json.loads(cors_origins)
            # Otherwise, treat as comma-separated string
            elif ',' in cors_origins:
                cors_origins = [origin.strip() for origin in cors_origins.split(',') if origin.strip()]
            else:
                cors_origins = [cors_origins.strip()] if cors_origins.strip() else []
        except (json.JSONDecodeError, ValueError, TypeError) as e:
            logger.warning(f"Failed to parse CORS_ORIGINS as JSON: {e}. Using as single origin.")
            cors_origins = [cors_origins.strip()] if cors_origins.strip() else []
    
    # Ensure it's a list
    if not isinstance(cors_origins, list):
        cors_origins = ["http://localhost:3000", "http://localhost:3001"]
    
    # Normalize origins (remove trailing slashes, duplicates, etc.)
    cors_origins = normalize_cors_origins(cors_origins)
    
    # Always include localhost origins for local development
    # This allows localhost to work even if CORS_ORIGINS only has production URLs
    localhost_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000"
    ]
    
    # Add localhost origins if not already present
    for localhost_origin in localhost_origins:
        if localhost_origin not in cors_origins:
            cors_origins.append(localhost_origin)
    
    return cors_origins


# Process and configure CORS origins
cors_origins_list = get_cors_origins()

# Log CORS configuration for debugging
logger.info(f"CORS Origins configured: {cors_origins_list}")
logger.info(f"CORS Origins count: {len(cors_origins_list)}")

# CORS middleware - must be added before routers
# max_age=3600 caches preflight responses for 1 hour
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins_list,  # List of allowed origins
    allow_credentials=True,  # Allow cookies/auth headers
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all headers to client
    max_age=3600,  # Cache preflight responses for 1 hour
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(transcripts.router, prefix="/api/v1/transcripts", tags=["Transcripts"])
app.include_router(courses.router, prefix="/api/v1/courses", tags=["Courses"])
app.include_router(help_requests.router, prefix="/api/v1/help-requests", tags=["Help Requests"])
app.include_router(recommendations.router, prefix="/api/v1/recommendations", tags=["Recommendations"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(calendar.router, prefix="/api/v1/calendar", tags=["Calendar"])
app.include_router(mentorship.router, prefix="/api/v1/mentorship", tags=["Mentorship"])
app.include_router(points.router, prefix="/api/v1", tags=["Points"])

@app.on_event("startup")
async def startup_event():
    """Log startup information - storage and database are checked"""
    logger.info("=== Application Startup ===")
    
    # Check database connection (non-blocking, just log status)
    try:
        from app.core.database import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("✓ Database: Connected")
    except Exception as e:
        logger.warning(f"⚠ Database: Connection failed - {str(e)}")
        logger.warning("  Application will start, but database operations will fail")
        logger.warning("  Check DATABASE_URL environment variable in Railway")
    
    # Check storage service (optional)
    try:
        from app.core.storage import storage_service
        if storage_service.s3_client:
            logger.info("✓ Storage service: Available")
        else:
            logger.debug("Storage service: Not available (S3 credentials not configured or invalid)")
            logger.debug("Application will continue - file uploads will fail until S3 is configured")
    except Exception as e:
        logger.debug(f"Storage service: Error checking - {str(e)}")
        logger.debug("Application will continue - storage is optional")
    
    logger.info("=== Application Startup Complete ===")


@app.get("/")
async def root():
    return {"message": "NuPeer API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint - checks database connectivity"""
    from app.core.database import engine
    from sqlalchemy import text
    
    try:
        # Test database connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }


@app.get("/debug/cors")
async def debug_cors():
    """Debug endpoint to check CORS configuration"""
    return {
        "cors_origins_raw": settings.CORS_ORIGINS,
        "cors_origins_type": str(type(settings.CORS_ORIGINS)),
        "cors_origins_list": cors_origins_list,
        "cors_configured": True,
        "localhost_included": any("localhost" in origin or "127.0.0.1" in origin for origin in cors_origins_list)
    }

