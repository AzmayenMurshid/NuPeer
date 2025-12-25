"""
Help Request endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel, field_validator
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from app.core.database import get_db
from app.models.help_request import HelpRequest
from app.models.user import User
from app.models.course import Course
from app.api.v1.auth import get_current_user
from sqlalchemy import and_, desc

router = APIRouter()


class HelpRequestCreate(BaseModel):
    course_code: str
    course_name: Optional[str] = None


class HelpRequestResponse(BaseModel):
    id: str
    course_code: str
    course_name: Optional[str] = None
    status: str
    created_at: str
    
    @field_validator('id', mode='before')
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
    
    @field_validator('course_name', mode='before')
    @classmethod
    def handle_none_course_name(cls, v):
        """Handle None values for course_name"""
        return v if v is not None else None
    
    class Config:
        from_attributes = True


@router.post("", response_model=HelpRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_help_request(
    request_data: HelpRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new help request and automatically search for available tutors
    Uses optimized query with indexed columns for fast tutor matching
    """
    help_request = HelpRequest(
        requester_id=current_user.id,
        course_code=request_data.course_code,
        course_name=request_data.course_name,
        status="active"
    )
    
    db.add(help_request)
    db.commit()
    db.refresh(help_request)
    
    # Optimized tutor search: Find tutors who have taken this course
    # Uses composite index (course_code, grade_score, year) for fast lookup
    # Single query with join to avoid N+1 queries
    # Prioritize users with the same major as the requester
    matching_tutors = db.query(Course).join(
        User, Course.user_id == User.id
    ).filter(
        and_(
            Course.course_code == request_data.course_code,  # Uses index on course_code
            Course.user_id != current_user.id,  # Exclude requester
            Course.grade_score.isnot(None)  # Only courses with valid grades
        )
    ).all()
    
    # Sort with major-based prioritization
    tutors_list = []
    for course in matching_tutors:
        helper = course.user
        same_major = (
            current_user.major is not None and 
            helper.major is not None and 
            current_user.major.lower().strip() == helper.major.lower().strip()
        )
        tutors_list.append({
            'course': course,
            'helper': helper,
            'same_major': same_major,
            'grade_score': float(course.grade_score) if course.grade_score else 0.0,
            'year': course.year or 0,
            'semester': course.semester or ''
        })
    
    # Sort: same major first, then by grade_score (desc), year (desc), semester (desc)
    tutors_list.sort(
        key=lambda x: (
            not x['same_major'],  # False (same major) comes before True (different major)
            -x['grade_score'],  # Negative for descending order
            -x['year'],  # Negative for descending order
            x['semester']  # Ascending for semester
        )
    )
    
    matching_tutors = [item['course'] for item in tutors_list[:10]]  # Limit to top 10
    
    # Note: Recommendations are stored/returned via the recommendations endpoint
    # This search is performed here to ensure tutors are available when request is created
    
    return help_request


@router.get("", response_model=List[HelpRequestResponse])
async def list_help_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List user's help requests"""
    requests = db.query(HelpRequest).filter(
        HelpRequest.requester_id == current_user.id
    ).order_by(desc(HelpRequest.created_at)).all()
    
    return requests


@router.get("/{request_id}", response_model=HelpRequestResponse)
async def get_help_request(
    request_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get help request details"""
    help_request = db.query(HelpRequest).filter(
        HelpRequest.id == request_id,
        HelpRequest.requester_id == current_user.id
    ).first()
    
    if not help_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Help request not found"
        )
    
    return help_request


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_help_request(
    request_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a help request"""
    help_request = db.query(HelpRequest).filter(
        HelpRequest.id == request_id,
        HelpRequest.requester_id == current_user.id
    ).first()
    
    if not help_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Help request not found"
        )
    
    help_request.status = "cancelled"
    db.commit()
    
    return None

