"""
Recommendation endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, and_, func, case, cast
from sqlalchemy.dialects.postgresql import NUMERIC
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
    helper_phone_number: Optional[str] = None
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
    helper_phone_number: Optional[str] = None
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
    helper_phone_number: Optional[str] = None
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


class MajorMatchBrotherResponse(BaseModel):
    helper_id: str
    helper_name: str
    helper_email: Optional[str] = None
    helper_phone_number: Optional[str] = None
    major: Optional[str] = None
    graduation_year: Optional[int] = None
    pledge_class: Optional[str] = None
    total_courses: int
    average_grade_score: float
    total_credits: float
    year_in_college: Optional[str] = None  # Freshman, Sophomore, Junior, Senior
    
    @field_validator('helper_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        """Convert UUID to string if needed"""
        if v is not None:
            return str(v)
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
                    'helper_phone_number': getattr(helper, 'phone_number', None),
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


@router.get("/by-major", response_model=List[MajorMatchBrotherResponse])
async def get_recommendations_by_major(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get recommended brothers based on major match
    Returns users with the same major as the current user, sorted by academic performance
    Optimized with single query using SQL aggregations
    """
    # Check if current user has a major
    if not current_user.major:
        return []
    
    # SQL expression to determine if a grade earns credit (C- or above, grade_score >= 1.7)
    earns_credit_expr = case(
        (
            Course.grade_score.isnot(None),
            cast(Course.grade_score, NUMERIC) >= 1.7
        ),
        else_=False
    )
    
    # Calculate total credits (only from courses that earn credit)
    total_credits_expr = func.coalesce(
        func.sum(
            case(
                (earns_credit_expr, cast(Course.credit_hours, NUMERIC)),
                else_=0
            )
        ),
        0
    )
    
    # Calculate average grade score (only from courses with grade_score)
    avg_grade_expr = func.coalesce(
        func.avg(cast(Course.grade_score, NUMERIC)),
        0.0
    )
    
    # Count total courses
    total_courses_expr = func.count(Course.id)
    
    # Single optimized query with JOIN and aggregations
    # This replaces N+1 queries with one efficient query
    # Use subquery to calculate year_in_college based on total_credits
    subquery = db.query(
        User.id,
        User.first_name,
        User.last_name,
        User.email,
        User.phone_number,
        User.major,
        User.graduation_year,
        User.pledge_class,
        total_courses_expr.label('total_courses'),
        cast(avg_grade_expr, NUMERIC(5, 2)).label('average_grade_score'),
        cast(total_credits_expr, NUMERIC(10, 1)).label('total_credits')
    ).outerjoin(
        Course, Course.user_id == User.id
    ).filter(
        and_(
            User.id != current_user.id,
            User.major.isnot(None),
            func.lower(func.trim(User.major)) == func.lower(func.trim(current_user.major))
        )
    ).group_by(
        User.id,
        User.first_name,
        User.last_name,
        User.email,
        User.phone_number,
        User.major,
        User.graduation_year,
        User.pledge_class
    ).subquery()
    
    # Main query with year_in_college calculation
    results = db.query(
        subquery.c.id,
        subquery.c.first_name,
        subquery.c.last_name,
        subquery.c.email,
        subquery.c.phone_number,
        subquery.c.major,
        subquery.c.graduation_year,
        subquery.c.pledge_class,
        subquery.c.total_courses,
        subquery.c.average_grade_score,
        subquery.c.total_credits,
        case(
            (subquery.c.total_credits < 30, "Freshman"),
            (subquery.c.total_credits < 60, "Sophomore"),
            (subquery.c.total_credits < 90, "Junior"),
            else_="Senior"
        ).label('year_in_college')
    ).order_by(
        subquery.c.total_courses == 0,  # Users with courses first
        desc(subquery.c.average_grade_score),  # Then by GPA descending
        desc(subquery.c.total_courses)  # Then by course count descending
    ).limit(limit).all()
    
    # Convert results to response format
    brothers_list = []
    for row in results:
        brothers_list.append({
            'helper_id': str(row.id),
            'helper_name': f"{row.first_name} {row.last_name}",
            'helper_email': row.email,
            'helper_phone_number': row.phone_number,
            'major': row.major,
            'graduation_year': row.graduation_year,
            'pledge_class': row.pledge_class,
            'total_courses': int(row.total_courses) if row.total_courses else 0,
            'average_grade_score': float(row.average_grade_score) if row.average_grade_score else 0.0,
            'total_credits': float(row.total_credits) if row.total_credits else 0.0,
            'year_in_college': row.year_in_college if row.year_in_college else "Freshman"
        })
    
    # Convert to Pydantic models
    return [
        MajorMatchBrotherResponse(**brother)
        for brother in brothers_list
    ]


class GroupStudyBrotherResponse(BaseModel):
    helper_id: str
    helper_name: str
    helper_email: Optional[str] = None
    helper_phone_number: Optional[str] = None
    shared_courses: List[str]  # List of course codes they're both taking
    total_shared_courses: int
    major: Optional[str] = None
    graduation_year: Optional[int] = None
    pledge_class: Optional[str] = None
    year_in_college: Optional[str] = None


@router.get("/group-study", response_model=List[GroupStudyBrotherResponse])
async def get_group_study_recommendations(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get group study recommendations based on users taking the same current courses
    Returns users who are currently taking the same courses (transcript_id is null)
    """
    # Get current user's current courses (transcript_id is null)
    current_user_courses = db.query(Course).filter(
        and_(
            Course.user_id == current_user.id,
            Course.transcript_id.is_(None)
        )
    ).all()
    
    if not current_user_courses:
        return []
    
    # Get list of course codes the current user is taking
    current_course_codes = [course.course_code for course in current_user_courses if course.course_code]
    
    if not current_course_codes:
        return []
    
    # Find other users taking the same courses
    # Query for courses with matching course codes, different user, and transcript_id is null
    matching_courses = db.query(Course).options(
        joinedload(Course.user)
    ).join(
        User, Course.user_id == User.id
    ).filter(
        and_(
            Course.course_code.in_(current_course_codes),
            Course.user_id != current_user.id,
            Course.transcript_id.is_(None)  # Only current courses
        )
    ).all()
    
    # Group by user and count shared courses
    user_courses_map: Dict[str, Dict[str, Any]] = {}
    
    # Helper function to calculate year_in_college from graduation_year
    def calculate_year_in_college(graduation_year: Optional[int]) -> Optional[str]:
        """Calculate year in college from graduation year"""
        if graduation_year is None:
            return None
        from datetime import datetime
        current_year = datetime.now().year
        years_until_graduation = graduation_year - current_year
        if years_until_graduation >= 4:
            return "Freshman"
        elif years_until_graduation >= 3:
            return "Sophomore"
        elif years_until_graduation >= 2:
            return "Junior"
        elif years_until_graduation >= 1:
            return "Senior"
        else:
            return "Graduate"  # Already graduated or graduating this year
    
    for course in matching_courses:
        helper = course.user
        if helper is None:
            continue
        
        helper_id = str(helper.id)
        
        if helper_id not in user_courses_map:
            user_courses_map[helper_id] = {
                'helper_id': helper_id,
                'helper_name': f"{helper.first_name} {helper.last_name}",
                'helper_email': helper.email,
                'helper_phone_number': getattr(helper, 'phone_number', None),
                'shared_courses': [],
                'major': helper.major,
                'graduation_year': helper.graduation_year,
                'pledge_class': helper.pledge_class,
                'year_in_college': calculate_year_in_college(helper.graduation_year)
            }
        
        # Add course code if not already in the list
        if course.course_code and course.course_code not in user_courses_map[helper_id]['shared_courses']:
            user_courses_map[helper_id]['shared_courses'].append(course.course_code)
    
    # Convert to list and add total count, then sort by number of shared courses
    brothers_list = []
    for helper_id, data in user_courses_map.items():
        data['total_shared_courses'] = len(data['shared_courses'])
        brothers_list.append(data)
    
    # Sort by number of shared courses (descending), then by name
    brothers_list.sort(
        key=lambda x: (-x['total_shared_courses'], x['helper_name'])
    )
    
    # Limit results
    brothers_list = brothers_list[:limit]
    
    # Convert to Pydantic models
    return [
        GroupStudyBrotherResponse(**brother) for brother in brothers_list
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
            helper_phone_number=getattr(item['helper'], 'phone_number', None),  # In production, check privacy settings
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
    try:
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
            matching_courses = db.query(Course).options(
                joinedload(Course.user)
            ).join(User).filter(
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
                if helper is None:
                    continue  # Skip if user relationship is not loaded
                
                helper_id = str(helper.id)
                
                if helper_id not in brothers_map:
                    brothers_map[helper_id] = {
                        'helper_id': helper_id,
                        'helper_name': f"{helper.first_name} {helper.last_name}",
                        'helper_email': helper.email,
                        'helper_phone_number': getattr(helper, 'phone_number', None),
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
                helper_phone_number=brother.get('helper_phone_number'),
                courses_helped=courses_helped,
                total_courses=len(courses_helped),
                first_connected=brother['first_connected'].isoformat() if isinstance(brother['first_connected'], datetime) else brother['first_connected'],
                last_connected=brother['last_connected'].isoformat() if isinstance(brother['last_connected'], datetime) else brother['last_connected']
            ))
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get connected brothers: {str(e)}"
        )

