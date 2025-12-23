"""
Recommendation endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from pydantic import BaseModel
from typing import List
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
    helper_email: str = None
    course_code: str
    grade: str
    grade_score: float
    semester: str = None
    year: int = None
    rank: int


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
    
    # Find all courses matching the requested course code
    # Exclude the requester's own courses
    matching_courses = db.query(Course).join(User).filter(
        and_(
            Course.course_code == help_request.course_code,
            Course.user_id != current_user.id,
            Course.grade_score.isnot(None)  # Only courses with valid grades
        )
    ).order_by(
        desc(Course.grade_score),  # Highest grade first
        desc(Course.year),  # Most recent first
        desc(Course.semester)
    ).limit(limit).all()
    
    # Build recommendations
    recommendations = []
    for rank, course in enumerate(matching_courses, 1):
        helper = course.user
        recommendations.append(RecommendationResponse(
            helper_id=str(helper.id),
            helper_name=f"{helper.first_name} {helper.last_name}",
            helper_email=helper.email,  # In production, check privacy settings
            course_code=course.course_code,
            grade=course.grade,
            grade_score=float(course.grade_score) if course.grade_score else 0.0,
            semester=course.semester,
            year=course.year,
            rank=rank
        ))
    
    return recommendations

