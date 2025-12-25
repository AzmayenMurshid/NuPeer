"""
Course endpoints
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, field_validator
from app.core.database import get_db
from app.models.course import Course
from app.models.user import User
from app.api.v1.auth import get_current_user

router = APIRouter()


class CourseResponse(BaseModel):
    id: str
    user_id: str
    transcript_id: str
    course_code: str
    course_name: Optional[str] = None
    grade: Optional[str] = None
    grade_score: Optional[float] = None
    credit_hours: Optional[float] = None
    points: Optional[float] = None  # GPA points from transcript
    semester: Optional[str] = None
    year: Optional[int] = None
    created_at: str
    
    @field_validator('id', 'user_id', 'transcript_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        """Convert UUID to string if needed"""
        if v is not None:
            return str(v)
        return v
    
    @field_validator('created_at', mode='before')
    @classmethod
    def convert_datetime_to_str(cls, v):
        """Convert datetime to ISO format string"""
        if isinstance(v, datetime):
            return v.isoformat()
        return v
    
    class Config:
        from_attributes = True


@router.get("", response_model=List[CourseResponse])
async def list_courses(
    course_code: Optional[str] = Query(None, description="Filter by course code"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List user's courses"""
    query = db.query(Course).filter(Course.user_id == current_user.id)
    
    if course_code:
        query = query.filter(Course.course_code.ilike(f"%{course_code}%"))
    
    courses = query.order_by(Course.year.desc(), Course.semester).all()
    return courses


@router.get("/search", response_model=List[CourseResponse])
async def search_courses(
    q: str = Query(..., description="Search query (course code or name)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search courses by code or name"""
    courses = db.query(Course).filter(
        Course.user_id == current_user.id
    ).filter(
        (Course.course_code.ilike(f"%{q}%")) |
        (Course.course_name.ilike(f"%{q}%"))
    ).all()
    
    return courses

