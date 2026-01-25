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

# CORS middleware - must be added before routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
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



