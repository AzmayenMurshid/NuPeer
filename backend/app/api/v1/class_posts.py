"""
Class Posts endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from pydantic import BaseModel, field_validator, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from app.core.database import get_db
from app.models.class_post import ClassPost
from app.models.user import User
from app.api.v1.auth import get_current_user

router = APIRouter()


class ClassPostCreate(BaseModel):
    course_code: Optional[str] = None
    course_name: Optional[str] = None
    class_format: str = Field(..., description="Class format: 'in_person' or 'online'")
    professor_name: str = Field(..., min_length=1, max_length=255)
    professor_rating: Decimal = Field(..., ge=0, le=5, description="Professor rating from 0 to 5 stars")
    exam_format: str = Field(..., description="Exam format: 'in_person' or 'online'")
    lockdown_browser_required: Optional[bool] = Field(None, description="Required only if exam_format is 'online'")
    description: Optional[str] = None
    
    @field_validator('class_format')
    @classmethod
    def validate_class_format(cls, v):
        """Validate class format"""
        if v.lower() not in ['in_person', 'online']:
            raise ValueError("class_format must be 'in_person' or 'online'")
        return v.lower()
    
    @field_validator('exam_format')
    @classmethod
    def validate_exam_format(cls, v):
        """Validate exam format"""
        if v.lower() not in ['in_person', 'online']:
            raise ValueError("exam_format must be 'in_person' or 'online'")
        return v.lower()
    
    @field_validator('lockdown_browser_required')
    @classmethod
    def validate_lockdown_browser(cls, v, info):
        """Validate lockdown browser requirement"""
        exam_format = info.data.get('exam_format', '').lower() if info.data else ''
        if exam_format == 'online' and v is None:
            # Allow None, but warn that it should be set for online exams
            pass
        elif exam_format == 'in_person' and v is not None:
            # Lockdown browser doesn't make sense for in-person exams
            raise ValueError("lockdown_browser_required should be None for in-person exams")
        return v


class ClassPostResponse(BaseModel):
    id: str
    user_id: str
    course_code: Optional[str] = None
    course_name: Optional[str] = None
    class_format: str
    professor_name: str
    professor_rating: float
    exam_format: str
    lockdown_browser_required: Optional[bool] = None
    description: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None
    
    @field_validator('id', 'user_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        """Convert UUID to string if needed"""
        if v is not None:
            return str(v)
        return v
    
    @field_validator('professor_rating', mode='before')
    @classmethod
    def convert_decimal_to_float(cls, v):
        """Convert Decimal to float"""
        if isinstance(v, Decimal):
            return float(v)
        return v
    
    @field_validator('created_at', 'updated_at', mode='before')
    @classmethod
    def convert_datetime_to_str(cls, v):
        """Convert datetime to ISO format string"""
        if isinstance(v, datetime):
            return v.isoformat()
        return v
    
    class Config:
        from_attributes = True


@router.post("", response_model=ClassPostResponse, status_code=status.HTTP_201_CREATED)
async def create_class_post(
    post_data: ClassPostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new class post with class details, professor information, and exam format
    """
    try:
        # Normalize course_code to uppercase if provided
        course_code = post_data.course_code.upper() if post_data.course_code else None
        
        # Create the class post
        class_post = ClassPost(
            user_id=current_user.id,
            course_code=course_code,
            course_name=post_data.course_name,
            class_format=post_data.class_format,
            professor_name=post_data.professor_name,
            professor_rating=post_data.professor_rating,
            exam_format=post_data.exam_format,
            lockdown_browser_required=post_data.lockdown_browser_required,
            description=post_data.description
        )
        
        db.add(class_post)
        db.commit()
        db.refresh(class_post)
        
        return class_post
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create class post: {str(e)}"
        )


@router.get("", response_model=List[ClassPostResponse])
async def list_class_posts(
    course_code: Optional[str] = Query(None, description="Filter by course code (partial match)"),
    professor_name: Optional[str] = Query(None, description="Filter by professor name (partial match)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all class posts, optionally filtered by course_code or professor_name.
    Both filters support partial matching (case-insensitive).
    """
    query = db.query(ClassPost)
    
    # Apply filters if provided (both support partial matching)
    if course_code:
        # Case-insensitive partial match for course code
        query = query.filter(ClassPost.course_code.ilike(f"%{course_code.upper()}%"))
    if professor_name:
        # Case-insensitive partial match for professor name
        query = query.filter(ClassPost.professor_name.ilike(f"%{professor_name}%"))
    
    # Order by most recent first
    posts = query.order_by(desc(ClassPost.created_at)).all()
    
    return posts


@router.get("/search", response_model=List[ClassPostResponse])
async def search_class_posts(
    q: str = Query(..., description="Search query - searches professor names and course codes"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search class posts by professor name or course code.
    The search query will match against both professor names and course codes (case-insensitive, partial match).
    """
    search_term = f"%{q}%"
    
    # Search in both professor_name and course_code fields
    posts = db.query(ClassPost).filter(
        or_(
            ClassPost.professor_name.ilike(search_term),
            ClassPost.course_code.ilike(search_term)
        )
    ).order_by(desc(ClassPost.created_at)).all()
    
    return posts


@router.get("/{post_id}", response_model=ClassPostResponse)
async def get_class_post(
    post_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific class post by ID
    """
    class_post = db.query(ClassPost).filter(ClassPost.id == post_id).first()
    
    if not class_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class post not found"
        )
    
    return class_post


@router.get("/user/me", response_model=List[ClassPostResponse])
async def get_my_class_posts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all class posts created by the current user
    """
    posts = db.query(ClassPost).filter(
        ClassPost.user_id == current_user.id
    ).order_by(desc(ClassPost.created_at)).all()
    
    return posts


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class_post(
    post_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a class post (only the creator can delete their own post)
    """
    class_post = db.query(ClassPost).filter(
        ClassPost.id == post_id,
        ClassPost.user_id == current_user.id
    ).first()
    
    if not class_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class post not found or you don't have permission to delete it"
        )
    
    try:
        db.delete(class_post)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete class post: {str(e)}"
        )
    
    return None

