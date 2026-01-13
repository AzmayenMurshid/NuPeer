"""
Database Configuration
"""
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError, DisconnectionError
from fastapi import HTTPException, status
from app.core.config import settings

# Try to import psycopg2 errors for more specific error handling
try:
    import psycopg2
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False

# Force IPv4 connection by using 127.0.0.1 instead of localhost if needed
database_url = settings.DATABASE_URL
if "localhost" in database_url:
    database_url = database_url.replace("localhost", "127.0.0.1")

engine = create_engine(
    database_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    connect_args={"connect_timeout": 10}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def _handle_database_error(e: Exception) -> HTTPException:
    """Handle database connection errors and return appropriate HTTPException"""
    error_msg = str(e)
    error_lower = error_msg.lower()
    
    # Check for connection-related errors
    connection_errors = [
        "connection refused",
        "could not connect",
        "connection to server",
        "failed: connection",
        "is the server running",
        "timeout expired",
        "network is unreachable"
    ]
    
    is_connection_error = any(err in error_lower for err in connection_errors)
    
    if is_connection_error:
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Database connection failed. Please ensure:\n"
                "1. Docker Desktop is running\n"
                "2. PostgreSQL container is started: docker start nupeer-postgres\n"
                "   Or use: docker-compose up -d postgres\n"
                f"Error details: {error_msg}"
            )
        )
    else:
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database error: {error_msg}"
        )


def get_db():
    """Dependency for getting database session"""
    db = None
    try:
        db = SessionLocal()
        try:
            yield db
        except (OperationalError, DisconnectionError) as e:
            if db:
                try:
                    db.rollback()
                except:
                    pass
            raise _handle_database_error(e)
        except Exception as e:
            if db:
                try:
                    db.rollback()
                except:
                    pass
            # Check if it's a psycopg2 error wrapped in the exception
            if PSYCOPG2_AVAILABLE:
                # Check if the original exception is a psycopg2 error
                original_error = getattr(e, 'orig', None)
                if original_error and isinstance(original_error, Exception):
                    if "OperationalError" in str(type(original_error)) or "connection" in str(original_error).lower():
                        raise _handle_database_error(original_error)
            
            if isinstance(e, HTTPException):
                raise
            
            # Check if it's a connection-related error even if not OperationalError
            error_str = str(e).lower()
            if any(err in error_str for err in ["connection", "refused", "could not connect", "timeout"]):
                raise _handle_database_error(e)
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}"
            )
        finally:
            if db:
                try:
                    db.close()
                except:
                    pass
    except (OperationalError, DisconnectionError) as e:
        # Connection error during session creation
        raise _handle_database_error(e)
    except Exception as e:
        # Check for psycopg2 errors during session creation
        if PSYCOPG2_AVAILABLE:
            original_error = getattr(e, 'orig', None)
            if original_error and isinstance(original_error, Exception):
                if "OperationalError" in str(type(original_error)) or "connection" in str(original_error).lower():
                    raise _handle_database_error(original_error)
        
        error_str = str(e).lower()
        if any(err in error_str for err in ["connection", "refused", "could not connect", "timeout"]):
            raise _handle_database_error(e)
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connection error: {str(e)}"
        )

