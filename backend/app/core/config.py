"""
Application Configuration
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "NuPeer"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "postgresql://nupeer:nupeer@localhost:5433/nupeer"  # Port 5433 to avoid local PostgreSQL conflict
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    # Object Storage (MinIO/S3)
    S3_ENDPOINT: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET_NAME: str = "nupeer-transcripts"
    S3_USE_SSL: bool = False
    
    # Redis (for Celery)
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # File Upload
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: List[str] = [".pdf"]
    
    # Transcript Processing
    TRANSCRIPT_PROCESSING_TIMEOUT_MINUTES: int = 30  # Timeout for processing (30 minutes)
    TRANSCRIPT_PENDING_TIMEOUT_MINUTES: int = 60  # Timeout for pending status (60 minutes)
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"  # Ignore extra fields from .env file
    )


settings = Settings()

