"""
NuPeer - Main FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
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

# Ensure CORS_ORIGINS is a list (settings.CORS_ORIGINS should already be a list from config.py)
cors_origins_list = settings.CORS_ORIGINS
if isinstance(cors_origins_list, str):
    # If it's still a string, parse it
    import json
    try:
        cors_origins_list = json.loads(cors_origins_list) if cors_origins_list.startswith('[') else cors_origins_list.split(',')
    except:
        cors_origins_list = [cors_origins_list]
elif not isinstance(cors_origins_list, list):
    cors_origins_list = ["http://localhost:3000", "http://localhost:3001"]

# Always include localhost origins for local development
# This allows localhost to work even if CORS_ORIGINS only has production URLs
localhost_origins = ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"]
for origin in localhost_origins:
    if origin not in cors_origins_list:
        cors_origins_list.append(origin)

# Ensure all origins are strings, remove trailing slashes, and remove duplicates
# Trailing slashes can cause CORS mismatches (e.g., https://example.com/ vs https://example.com)
cors_origins_list = list(dict.fromkeys([
    str(origin).strip().rstrip('/')  # Remove trailing slashes
    for origin in cors_origins_list 
    if origin
]))

# Log CORS origins for debugging
logger.info(f"CORS Origins configured: {cors_origins_list}")
logger.info(f"CORS Origins count: {len(cors_origins_list)}")

# CORS middleware - must be added before routers
# max_age=3600 caches preflight responses for 1 hour
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
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

