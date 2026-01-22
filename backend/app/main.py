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

# Ensure CORS_ORIGINS is a list
cors_origins_list = settings.CORS_ORIGINS
if isinstance(cors_origins_list, str):
    cors_origins_list = [cors_origins_list]
elif not isinstance(cors_origins_list, list):
    cors_origins_list = ["http://localhost:3000", "http://localhost:3001"]

# Always include localhost origins for local development
# This allows localhost to work even if CORS_ORIGINS only has production URLs
localhost_origins = ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"]
for origin in localhost_origins:
    if origin not in cors_origins_list:
        cors_origins_list.append(origin)

# Log CORS origins for debugging
logger.info(f"CORS Origins configured: {cors_origins_list}")
logger.info(f"CORS Origins type: {type(cors_origins_list)}")

# CORS middleware - must be added before routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
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
    """Log startup information - storage is optional"""
    from app.core.storage import storage_service
    if storage_service.s3_client:
        logger.info("Storage service: Available")
    else:
        logger.info("Storage service: Not available (S3 credentials not configured or invalid)")
        logger.info("Application will continue - file uploads will fail until S3 is configured")


@app.get("/")
async def root():
    return {"message": "NuPeer API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/debug/cors")
async def debug_cors():
    """Debug endpoint to check CORS configuration"""
    return {
        "cors_origins_raw": settings.CORS_ORIGINS,
        "cors_origins_type": str(type(settings.CORS_ORIGINS)),
        "cors_origins_list": cors_origins_list,
        "cors_configured": True
    }

