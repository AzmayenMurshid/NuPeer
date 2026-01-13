"""
Course endpoints
"""
from fastapi import APIRouter, Depends, Query, status, HTTPException
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
    transcript_id: Optional[str] = None  # Nullable for manually added courses
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


class CourseCreate(BaseModel):
    course_code: str
    course_name: Optional[str] = None
    credit_hours: Optional[float] = None
    semester: Optional[str] = None
    year: Optional[int] = None
    grade: Optional[str] = None  # Optional for currently taking courses


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: CourseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new course manually (for currently taking courses)"""
    # Get current year if not provided (needed for duplicate check)
    year = course_data.year
    if year is None:
        year = datetime.now().year
    
    # Get current semester if not provided (needed for duplicate check)
    # Simple logic: Jan-Apr=Spring, May-Aug=Summer, Sep-Dec=Fall
    semester = course_data.semester
    if semester is None:
        month = datetime.now().month
        if month in [1, 2, 3, 4]:
            semester = "Spring"
        elif month in [5, 6, 7, 8]:
            semester = "Summer"
        else:
            semester = "Fall"
    
    # Check for duplicate course using the actual values that will be stored
    # This prevents duplicates when optional fields are omitted
    existing = db.query(Course).filter(
        Course.user_id == current_user.id,
        Course.course_code == course_data.course_code,
        Course.semester == semester,
        Course.year == year
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course already exists for this semester and year"
        )
    
    # Create course without transcript_id (manually added)
    course = Course(
        user_id=current_user.id,
        transcript_id=None,  # Manually added courses don't have a transcript
        course_code=course_data.course_code,
        course_name=course_data.course_name,
        grade=course_data.grade,  # None for currently taking courses
        grade_score=None,  # No grade yet for currently taking courses
        credit_hours=course_data.credit_hours,
        points=None,  # No points yet for currently taking courses
        semester=semester,
        year=year
    )
    
    db.add(course)
    db.commit()
    db.refresh(course)
    
    return course


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


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: UUID,
    course_data: CourseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a manually added course (only courses without transcript_id can be updated)"""
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.user_id == current_user.id
    ).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Only allow updating manually added courses (no transcript_id)
    if course.transcript_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update courses from transcripts. Only manually added courses can be updated."
        )
    
    # Get current year if not provided (needed for duplicate check)
    year = course_data.year
    if year is None:
        year = datetime.now().year
    
    # Get current semester if not provided (needed for duplicate check)
    semester = course_data.semester
    if semester is None:
        month = datetime.now().month
        if month in [1, 2, 3, 4]:
            semester = "Spring"
        elif month in [5, 6, 7, 8]:
            semester = "Summer"
        else:
            semester = "Fall"
    
    # Check for duplicate course if course_code, semester, or year changed
    # Use the actual values that will be stored (with defaults applied)
    if (course_data.course_code != course.course_code or 
        semester != course.semester or 
        year != course.year):
        existing = db.query(Course).filter(
            Course.user_id == current_user.id,
            Course.course_code == course_data.course_code,
            Course.semester == semester,
            Course.year == year,
            Course.id != course_id  # Exclude current course
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Course already exists for this semester and year"
            )
    
    # Update course fields
    course.course_code = course_data.course_code
    course.course_name = course_data.course_name
    course.credit_hours = course_data.credit_hours
    course.semester = semester
    course.year = year
    # Note: grade and grade_score remain unchanged when editing (only set when course is completed)
    
    try:
        db.commit()
        db.refresh(course)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update course: {str(e)}"
        )
    
    return course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a manually added course (only courses without transcript_id can be deleted)"""
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.user_id == current_user.id
    ).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Only allow deletion of manually added courses (no transcript_id)
    if course.transcript_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete courses from transcripts. Only manually added courses can be deleted."
        )
    
    try:
        db.delete(course)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete course: {str(e)}"
        )
    
    return None

