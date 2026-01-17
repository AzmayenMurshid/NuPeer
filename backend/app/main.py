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

# Log CORS origins for debugging
logger.info(f"CORS Origins configured: {settings.CORS_ORIGINS}")

# CORS middleware - must be added before routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
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


@app.get("/")
async def root():
    return {"message": "NuPeer API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

