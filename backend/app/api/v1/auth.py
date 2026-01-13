"""
Authentication endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import timedelta
import uuid
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from app.core.config import settings
from app.core.storage import storage_service
from app.models.user import User
from app.models.transcript import Transcript

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# Bcrypt has a hard limit of 72 bytes for passwords
MAX_PASSWORD_BYTES = 72
MIN_PASSWORD_LENGTH = 6


class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    
    @field_validator('new_password')
    @classmethod
    def validate_password_length(cls, v: str) -> str:
        """Validate password length: minimum 6 characters, maximum 72 bytes"""
        # Check minimum length
        if len(v) < MIN_PASSWORD_LENGTH:
            raise ValueError(
                f"Password must be at least {MIN_PASSWORD_LENGTH} characters long."
            )
        
        # Check maximum bytes (bcrypt limitation)
        password_bytes = v.encode('utf-8')
        if len(password_bytes) > MAX_PASSWORD_BYTES:
            raise ValueError(
                f"Password cannot exceed {MAX_PASSWORD_BYTES} bytes. "
                "Please use a shorter password."
            )
        return v


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    pledge_class: str = None
    graduation_year: int = None
    phone_number: Optional[str] = None
    is_alumni: bool = False
    
    @field_validator('password')
    @classmethod
    def validate_password_length(cls, v: str) -> str:
        """Validate password length: minimum 6 characters, maximum 72 bytes"""
        # Check minimum length
        if len(v) < MIN_PASSWORD_LENGTH:
            raise ValueError(
                f"Password must be at least {MIN_PASSWORD_LENGTH} characters long."
            )
        
        # Check maximum bytes (bcrypt limitation)
        password_bytes = v.encode('utf-8')
        if len(password_bytes) > MAX_PASSWORD_BYTES:
            raise ValueError(
                f"Password cannot exceed {MAX_PASSWORD_BYTES} bytes. "
                "Please use a shorter password."
            )
        return v


class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    pledge_class: Optional[str] = None
    graduation_year: Optional[int] = None
    major: Optional[str] = None
    phone_number: Optional[str] = None
    
    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        """Convert UUID to string if needed"""
        if v is not None:
            return str(v)
        return v
    
    class Config:
        from_attributes = True


class MajorUpdate(BaseModel):
    major: str = None

class PhoneUpdate(BaseModel):
    phone_number: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    # Convert string UUID to UUID object for proper database query
    try:
        user_uuid = uuid.UUID(user_id)
    except (ValueError, TypeError):
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_uuid).first()
    if user is None:
        raise credentials_exception
    
    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user - Optimized for speed"""
    # Optimized case-insensitive email check
    # Normalize email to lowercase for faster comparison
    email_lower = user_data.email.lower().strip()
    # Compare normalized strings directly (emails are stored in lowercase)
    existing_user = db.query(User).filter(
        User.email == email_lower
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user with normalized email (lowercase for consistency and faster lookups)
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=email_lower,  # Store lowercase for faster lookups
        hashed_password=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        pledge_class=user_data.pledge_class,
        graduation_year=user_data.graduation_year,
        phone_number=user_data.phone_number,
        is_alumni=user_data.is_alumni
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login and get access token - Optimized for speed"""
    try:
        # Validate input
        if not form_data.username or not form_data.password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email and password are required",
            )
        
        # Optimized case-insensitive email lookup
        # Normalize email to lowercase for faster comparison
        email_lower = form_data.username.lower().strip()
        # Compare normalized strings directly (emails are stored in lowercase)
        user = db.query(User).filter(User.email == email_lower).first()
        
        # Early return if user not found (before expensive password verification)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify password only if user exists (bcrypt is expensive, so check user first)
        if not verify_password(form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Generate token immediately (minimal processing)
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=access_token_expires
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        # Re-raise HTTP exceptions (like 401, 400)
        raise
    except Exception as e:
        # Log the error for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Login error: {str(e)}", exc_info=True)
        
        # Return a generic error message to avoid leaking internal details
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during login. Please try again later."
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    # Explicitly convert User to UserResponse to ensure proper serialization
    return UserResponse.model_validate(current_user)


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )
    
    # Check if new password is different from current password
    if verify_password(password_data.new_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}


@router.put("/update-major", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def update_major(
    major_data: MajorUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user's major"""
    # Normalize major to title case for consistency
    if major_data.major:
        # Convert to title case (capitalize first letter of each word)
        major_normalized = ' '.join(word.capitalize() for word in major_data.major.strip().split())
        current_user.major = major_normalized
    else:
        current_user.major = None
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.put("/update-phone", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def update_phone(
    phone_data: PhoneUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user's phone number"""
    current_user.phone_number = phone_data.phone_number
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.delete("/delete-account", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user account and all associated data"""
    try:
        # Delete all transcript files from storage before deleting the user
        # (CASCADE will handle database records)
        transcripts = db.query(Transcript).filter(
            Transcript.user_id == current_user.id
        ).all()
        
        for transcript in transcripts:
            # Only try to delete if file_path exists
            if transcript.file_path:
                try:
                    storage_service.delete_file(transcript.file_path)
                except Exception as storage_error:
                    # Log but don't fail if storage deletion fails
                    print(f"Warning: Could not delete transcript file from storage: {storage_error}")
        
        # Delete the user (CASCADE will delete courses, transcripts, help_requests, and recommendations)
        try:
            db.delete(current_user)
            db.commit()
        except Exception as db_error:
            db.rollback()
            print(f"Database error during account deletion: {db_error}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete account from database: {str(db_error)}"
            )
        
        return None
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        db.rollback()
        print(f"Unexpected error during account deletion: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete account: {str(e)}"
        )

