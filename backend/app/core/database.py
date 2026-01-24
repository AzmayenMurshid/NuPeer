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
    pool_pre_ping=True,  # Verify connections before using them (prevents stale connections)
    pool_size=10,
    max_overflow=20,
    pool_recycle=3600,  # Recycle connections after 1 hour to prevent stale connections
    pool_reset_on_return='commit',  # Reset connections on return to pool
    echo=False,  # Set to True for SQL query logging (useful for debugging)
    connect_args={
        "connect_timeout": 10,
        # Server-side keepalive settings (if supported by database)
        # These are passed as PostgreSQL connection parameters
    }
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
    """Dependency for getting database session with automatic reconnection"""
    import time
    db = None
    max_retries = 3
    
    # Try to create and test connection with retries
    for retry_count in range(max_retries):
        try:
            db = SessionLocal()
            # Test the connection with a simple query
            try:
                db.execute(text("SELECT 1"))
                break  # Connection is good, exit retry loop
            except (OperationalError, DisconnectionError) as e:
                # Connection test failed, close and retry
                if db:
                    try:
                        db.close()
                    except:
                        pass
                    db = None
                
                if retry_count == max_retries - 1:
                    # Last retry failed
                    raise _handle_database_error(e)
                
                # Wait before retrying (exponential backoff)
                time.sleep(0.5 * (retry_count + 1))
                continue  # Retry connection
                
        except (OperationalError, DisconnectionError) as e:
            # Connection error during session creation
            if db:
                try:
                    db.close()
                except:
                    pass
                db = None
            
            if retry_count == max_retries - 1:
                raise _handle_database_error(e)
            
            # Wait before retrying
            time.sleep(0.5 * (retry_count + 1))
            continue
    
    # If we get here, db should be valid
    if not db:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to establish database connection after retries"
        )
    
    # Yield the session and handle errors
    try:
        yield db
    except (OperationalError, DisconnectionError) as e:
        # Connection error during use
        if db:
            try:
                db.rollback()
                db.close()
            except:
                pass
        raise _handle_database_error(e)
    except Exception as e:
        # Other errors during use
        if db:
            try:
                db.rollback()
            except:
                pass
        # Check if it's a psycopg2 error wrapped in the exception
        if PSYCOPG2_AVAILABLE:
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
        # Always close the session when done
        if db:
            try:
                db.close()
            except:
                pass

