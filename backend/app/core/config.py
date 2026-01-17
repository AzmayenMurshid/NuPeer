"""
Application Configuration
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Union
import json


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
    
    # CORS - Parse from JSON string or comma-separated string
    # Use Union to allow both string and list, then parse in validator
    CORS_ORIGINS: Union[str, List[str]] = ["http://localhost:3000", "http://localhost:3001"]
    
    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """Parse CORS_ORIGINS from environment variable - supports JSON array or comma-separated"""
        if isinstance(v, list):
            return [str(origin).strip() for origin in v if origin]
        
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return ["http://localhost:3000", "http://localhost:3001"]
            
            # Try to parse as JSON first (e.g., '["https://example.com"]')
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return [str(origin).strip() for origin in parsed if origin]
            except (json.JSONDecodeError, TypeError, ValueError):
                pass
            
            # If not JSON, try comma-separated (e.g., 'https://example.com,https://other.com')
            if ',' in v:
                origins = [origin.strip() for origin in v.split(',') if origin.strip()]
                if origins:
                    return origins
            
            # Single value
            return [v]
        
        # Default fallback
        return ["http://localhost:3000", "http://localhost:3001"]
    
    @field_validator('CORS_ORIGINS', mode='after')
    @classmethod
    def ensure_cors_list(cls, v: Union[str, List[str]]) -> List[str]:
        """Ensure CORS_ORIGINS is always a list"""
        if isinstance(v, list):
            return v
        return [str(v)]
    
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

