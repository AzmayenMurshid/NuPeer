"""
Recommendation endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from pydantic import BaseModel, field_validator
from typing import List, Dict, Any, Optional
from datetime import datetime
from uuid import UUID
from app.core.database import get_db
from app.models.course import Course
from app.models.help_request import HelpRequest
from app.models.user import User
from app.api.v1.auth import get_current_user

router = APIRouter()


class RecommendationResponse(BaseModel):
    helper_id: str
    helper_name: str
    helper_email: Optional[str] = None
    course_code: str
    grade: str
    grade_score: float
    semester: Optional[str] = None
    year: Optional[int] = None
    rank: int
    
    @field_validator('helper_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        """Convert UUID to string if needed"""
        if v is not None:
            return str(v)
        return v


class PreviousTutorResponse(BaseModel):
    helper_id: str
    helper_name: str
    helper_email: Optional[str] = None
    course_code: str
    grade: str
    grade_score: float
    semester: Optional[str] = None
    year: Optional[int] = None
    help_request_id: str
    help_request_date: str
    
    @field_validator('helper_id', 'help_request_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        """Convert UUID to string if needed"""
        if v is not None:
            return str(v)
        return v
    
    @field_validator('help_request_date', mode='before')
    @classmethod
    def convert_datetime_to_str(cls, v):
        """Convert datetime to ISO format string if needed"""
        if v is None:
            return None
        if isinstance(v, datetime):
            return v.isoformat()
        return v


class CourseHelped(BaseModel):
    course_code: str
    grade: str
    grade_score: float
    semester: Optional[str] = None
    year: Optional[int] = None
    help_request_date: str
    
    @field_validator('help_request_date', mode='before')
    @classmethod
    def convert_datetime_to_str(cls, v):
        """Convert datetime to ISO format string if needed"""
        if v is None:
            return None
        if isinstance(v, datetime):
            return v.isoformat()
        return v


class ConnectedBrotherResponse(BaseModel):
    helper_id: str
    helper_name: str
    helper_email: Optional[str] = None
    courses_helped: List[CourseHelped]  # List of courses this brother helped with
    total_courses: int
    first_connected: str  # Date of first connection
    last_connected: str  # Date of last connection
    
    @field_validator('helper_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        """Convert UUID to string if needed"""
        if v is not None:
            return str(v)
        return v
    
    @field_validator('first_connected', 'last_connected', mode='before')
    @classmethod
    def convert_datetime_to_str(cls, v):
        """Convert datetime to ISO format string if needed"""
        if v is None:
            return None
        if isinstance(v, datetime):
            return v.isoformat()
        return v


@router.get("/previous-tutors", response_model=List[PreviousTutorResponse])
async def get_previous_tutors(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all tutors/helpers from previous help requests
    Returns unique tutors with their course information
    """
    # Get all help requests for the current user
    help_requests = db.query(HelpRequest).filter(
        HelpRequest.requester_id == current_user.id
    ).order_by(desc(HelpRequest.created_at)).all()
    
    if not help_requests:
        return []
    
    # Collect all unique tutors from all help requests
    tutors_map = {}  # helper_id -> best recommendation (highest grade)
    
    for help_request in help_requests:
        # Find courses matching this help request's course code
        matching_courses = db.query(Course).join(User).filter(
            and_(
                Course.course_code == help_request.course_code,
                Course.user_id != current_user.id,
                Course.grade_score.isnot(None)
            )
        ).order_by(
            desc(Course.grade_score),
            desc(Course.year),
            desc(Course.semester)
        ).limit(1).all()  # Get top recommendation for this request
        
        for course in matching_courses:
            helper = course.user
            helper_id = str(helper.id)
            
            # Keep the best grade for each tutor
            if helper_id not in tutors_map or course.grade_score > tutors_map[helper_id]['grade_score']:
                tutors_map[helper_id] = {
                    'helper_id': helper_id,
                    'helper_name': f"{helper.first_name} {helper.last_name}",
                    'helper_email': helper.email,
                    'course_code': course.course_code,
                    'grade': course.grade,
                    'grade_score': float(course.grade_score) if course.grade_score else 0.0,
                    'semester': course.semester,
                    'year': course.year,
                    'help_request_id': str(help_request.id),
                    'help_request_date': help_request.created_at.isoformat()
                }
    
    # Convert to list and sort by grade_score (highest first)
    tutors_list = list(tutors_map.values())
    tutors_list.sort(key=lambda x: x['grade_score'], reverse=True)
    
    # Convert to Pydantic models
    return [
        PreviousTutorResponse(**tutor) for tutor in tutors_list
    ]


@router.get("/{request_id}", response_model=List[RecommendationResponse])
async def get_recommendations(
    request_id: UUID,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get ranked recommendations for a help request
    Rankings are based on grade_score (higher is better)
    """
    # Get help request
    help_request = db.query(HelpRequest).filter(
        HelpRequest.id == request_id,
        HelpRequest.requester_id == current_user.id
    ).first()
    
    if not help_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Help request not found"
        )
    
    # Optimized query: Find tutors who have taken the requested course
    # Uses indexed columns (course_code, user_id) and efficient join to minimize query time
    # Strategy: Single query with eager loading to avoid N+1 queries
    # Filter by course_code first (indexed), exclude requester, then sort and limit
    # Prioritize users with the same major as the requester
    matching_courses = db.query(Course).join(
        User, Course.user_id == User.id
    ).filter(
        and_(
            Course.course_code == help_request.course_code,  # Uses index on course_code
            Course.user_id != current_user.id,
            Course.grade_score.isnot(None)  # Only courses with valid grades
        )
    ).all()
    
    # Build recommendations with major-based prioritization
    # Sort: same major first, then by grade_score, year, semester
    recommendations_list = []
    for course in matching_courses:
        helper = course.user  # Already loaded via join, no additional query
        same_major = (
            current_user.major is not None and 
            helper.major is not None and 
            current_user.major.lower().strip() == helper.major.lower().strip()
        )
        recommendations_list.append({
            'course': course,
            'helper': helper,
            'same_major': same_major,
            'grade_score': float(course.grade_score) if course.grade_score else 0.0,
            'year': course.year or 0,
            'semester': course.semester or ''
        })
    
    # Sort: same major first, then by grade_score (desc), year (desc), semester (desc)
    recommendations_list.sort(
        key=lambda x: (
            not x['same_major'],  # False (same major) comes before True (different major)
            -x['grade_score'],  # Negative for descending order
            -x['year'],  # Negative for descending order
            x['semester']  # Ascending for semester (Fall, Spring, Summer)
        )
    )
    
    # Build response and assign ranks
    recommendations = []
    for rank, item in enumerate(recommendations_list[:limit], 1):
        recommendations.append(RecommendationResponse(
            helper_id=str(item['helper'].id),
            helper_name=f"{item['helper'].first_name} {item['helper'].last_name}",
            helper_email=item['helper'].email,  # In production, check privacy settings
            course_code=item['course'].course_code,
            grade=item['course'].grade,
            grade_score=item['grade_score'],
            semester=item['course'].semester,
            year=item['course'].year,
            rank=rank
        ))
    
    return recommendations


@router.get("/connected-brothers", response_model=List[ConnectedBrotherResponse])
async def get_connected_brothers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all brothers that the user has connected with through help requests
    Returns unique brothers with all courses they've helped with
    """
    # Get all help requests for the current user
    help_requests = db.query(HelpRequest).filter(
        HelpRequest.requester_id == current_user.id
    ).order_by(HelpRequest.created_at).all()
    
    if not help_requests:
        return []
    
    # Collect all unique brothers and their courses
    brothers_map = {}  # helper_id -> {brother info, courses list, dates}
    
    for help_request in help_requests:
        # Find courses matching this help request's course code
        matching_courses = db.query(Course).join(User).filter(
            and_(
                Course.course_code == help_request.course_code,
                Course.user_id != current_user.id,
                Course.grade_score.isnot(None)
            )
        ).order_by(
            desc(Course.grade_score),
            desc(Course.year),
            desc(Course.semester)
        ).limit(10).all()  # Get top 10 recommendations per request
        
        for course in matching_courses:
            helper = course.user
            helper_id = str(helper.id)
            
            if helper_id not in brothers_map:
                brothers_map[helper_id] = {
                    'helper_id': helper_id,
                    'helper_name': f"{helper.first_name} {helper.last_name}",
                    'helper_email': helper.email,
                    'courses': [],
                    'first_connected': help_request.created_at,
                    'last_connected': help_request.created_at
                }
            
            # Add course info if not already added for this course_code
            # Check if we already have this course_code for this brother
            course_exists = any(
                (isinstance(c, dict) and c.get('course_code') == course.course_code) or
                (isinstance(c, CourseHelped) and c.course_code == course.course_code)
                for c in brothers_map[helper_id]['courses']
            )
            
            if not course_exists:
                # Store as dict first, convert to CourseHelped later
                brothers_map[helper_id]['courses'].append({
                    'course_code': course.course_code,
                    'grade': course.grade,
                    'grade_score': float(course.grade_score) if course.grade_score else 0.0,
                    'semester': course.semester,
                    'year': course.year,
                    'help_request_date': help_request.created_at.isoformat()
                })
            
            # Update connection dates
            if help_request.created_at < brothers_map[helper_id]['first_connected']:
                brothers_map[helper_id]['first_connected'] = help_request.created_at
            if help_request.created_at > brothers_map[helper_id]['last_connected']:
                brothers_map[helper_id]['last_connected'] = help_request.created_at
    
    # Convert to list and sort by last_connected (most recent first)
    brothers_list = list(brothers_map.values())
    brothers_list.sort(key=lambda x: x['last_connected'], reverse=True)
    
    # Convert to Pydantic models
    result = []
    for brother in brothers_list:
        # Convert course dicts to CourseHelped objects
        courses_helped = [
            CourseHelped(**course) if isinstance(course, dict) else course
            for course in brother['courses']
        ]
        
        result.append(ConnectedBrotherResponse(
            helper_id=brother['helper_id'],
            helper_name=brother['helper_name'],
            helper_email=brother['helper_email'],
            courses_helped=courses_helped,
            total_courses=len(courses_helped),
            first_connected=brother['first_connected'].isoformat(),
            last_connected=brother['last_connected'].isoformat()
        ))
    
    return result

