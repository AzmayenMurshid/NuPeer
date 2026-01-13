"""
Mentorship Program API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import date
import uuid
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.alumni_profile import AlumniProfile
from app.models.experience import Experience
from app.models.resume import Resume
from app.models.mentorship_request import MentorshipRequest, RequestStatus
from app.core.storage import storage_service
from app.core.config import settings
from app.services.points_service import award_points
from app.models.points import PointsHistory, PointType

router = APIRouter()


# Pydantic models
class AlumniProfileCreate(BaseModel):
    bio: str  # Required
    chapter: str  # Required
    current_position: str  # Required
    company: str  # Required
    industry: str  # Required
    location: str  # Required
    linkedin_url: Optional[str] = None
    website_url: Optional[str] = None
    is_mentor: bool = False
    is_mentee: bool = False
    mentor_capacity: int = 5


class AlumniProfileUpdate(BaseModel):
    bio: Optional[str] = None
    chapter: Optional[str] = None  # Optional in update, but validated in endpoint
    current_position: Optional[str] = None
    company: Optional[str] = None
    industry: Optional[str] = None  # Optional in update, but validated in endpoint
    location: Optional[str] = None  # Optional in update, but validated in endpoint
    linkedin_url: Optional[str] = None
    website_url: Optional[str] = None
    is_mentor: Optional[bool] = None
    is_mentee: Optional[bool] = None
    mentor_capacity: Optional[int] = None


class AlumniProfileResponse(BaseModel):
    id: str
    user_id: str
    bio: Optional[str]
    chapter: Optional[str]
    current_position: Optional[str]
    company: Optional[str]
    industry: Optional[str]
    location: Optional[str]
    linkedin_url: Optional[str]
    website_url: Optional[str]
    is_mentor: bool
    is_mentee: bool
    mentor_capacity: int
    created_at: str
    updated_at: Optional[str]
    
    class Config:
        from_attributes = True


class ExperienceCreate(BaseModel):
    type: str  # 'work', 'education', 'volunteer', 'project'
    title: str
    company: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool = False


class ExperienceUpdate(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = None


class ExperienceResponse(BaseModel):
    id: str
    alumni_profile_id: str
    type: str
    title: str
    company: Optional[str]
    location: Optional[str]
    description: Optional[str]
    start_date: Optional[date]
    end_date: Optional[date]
    is_current: bool
    created_at: str
    updated_at: Optional[str]
    
    class Config:
        from_attributes = True


class ResumeResponse(BaseModel):
    id: str
    alumni_profile_id: str
    file_name: str
    file_size: Optional[int]
    upload_date: str
    is_primary: bool
    
    class Config:
        from_attributes = True


class MentorshipRequestCreate(BaseModel):
    mentor_id: str
    message: Optional[str] = None


class MentorshipRequestResponse(BaseModel):
    id: str
    mentor_id: str
    mentee_id: str
    message: Optional[str]
    status: str
    created_at: str
    updated_at: Optional[str]
    responded_at: Optional[str]
    
    class Config:
        from_attributes = True


class MentorSearchResponse(BaseModel):
    alumni_profile: AlumniProfileResponse
    user: dict  # Basic user info
    experiences: List[ExperienceResponse]
    resume_count: int
    match_score: Optional[float] = None


# Helper function to get or create alumni profile
def get_or_create_alumni_profile(user: User, db: Session) -> AlumniProfile:
    """Get existing alumni profile or create a new one"""
    profile = db.query(AlumniProfile).filter(AlumniProfile.user_id == user.id).first()
    if not profile:
        profile = AlumniProfile(user_id=user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


# Alumni Profile endpoints
@router.post("/profile", response_model=AlumniProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_alumni_profile(
    profile_data: AlumniProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update alumni profile"""
    if not current_user.is_alumni:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only alumni can create alumni profiles"
        )
    
    profile = get_or_create_alumni_profile(current_user, db)
    
    # Update profile fields
    for field, value in profile_data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/profile", response_model=AlumniProfileResponse)
async def get_alumni_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's alumni profile"""
    if not current_user.is_alumni:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only alumni can access alumni profiles"
        )
    
    profile = db.query(AlumniProfile).filter(AlumniProfile.user_id == current_user.id).first()
    if not profile:
        # Create empty profile
        profile = get_or_create_alumni_profile(current_user, db)
    
    return profile


@router.get("/mentor-info/{profile_id}")
async def get_mentor_info(
    profile_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get mentor information by profile ID"""
    try:
        profile_uuid = uuid.UUID(profile_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid profile ID")
    
    profile = db.query(AlumniProfile).filter(AlumniProfile.id == profile_uuid).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    mentor_user = db.query(User).filter(User.id == profile.user_id).first()
    if not mentor_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "profile": profile,
        "user": {
            "id": str(mentor_user.id),
            "first_name": mentor_user.first_name,
            "last_name": mentor_user.last_name,
            "email": mentor_user.email,
            "phone_number": mentor_user.phone_number,
        }
    }


@router.put("/profile", response_model=AlumniProfileResponse)
async def update_alumni_profile(
    profile_data: AlumniProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update alumni profile"""
    if not current_user.is_alumni:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only alumni can update alumni profiles"
        )
    
    profile = get_or_create_alumni_profile(current_user, db)
    
    # Update only provided fields
    update_data = profile_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    # Validate required fields after update
    if not profile.bio or not profile.bio.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bio is required"
        )
    if not profile.chapter or not profile.chapter.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chapter is required"
        )
    if not profile.current_position or not profile.current_position.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current position is required"
        )
    if not profile.company or not profile.company.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company is required"
        )
    if not profile.industry or not profile.industry.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Industry is required"
        )
    if not profile.location or not profile.location.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Location is required"
        )
    
    # Check if profile was just completed (award points only once)
    profile_was_incomplete = not (profile.bio and profile.chapter and profile.current_position and 
                                  profile.company and profile.industry and profile.location)
    profile_is_complete = (profile.bio and profile.bio.strip() and 
                          profile.chapter and profile.chapter.strip() and
                          profile.current_position and profile.current_position.strip() and
                          profile.company and profile.company.strip() and
                          profile.industry and profile.industry.strip() and
                          profile.location and profile.location.strip())
    
    # Check if user already got points for profile completion
    existing_points = db.query(PointsHistory).filter(
        PointsHistory.user_id == current_user.id,
        PointsHistory.point_type == PointType.PROFILE_COMPLETED
    ).first()
    
    if profile_is_complete and profile_was_incomplete and not existing_points:
        try:
            award_points(
                db=db,
                user_id=current_user.id,
                point_type=PointType.PROFILE_COMPLETED,
                description="Completed alumni profile",
                related_entity_id=profile.id,
                related_entity_type="alumni_profile"
            )
        except Exception as e:
            print(f"Error awarding points: {e}")
    
    db.commit()
    db.refresh(profile)
    return profile


# Experience endpoints
@router.post("/experiences", response_model=ExperienceResponse, status_code=status.HTTP_201_CREATED)
async def create_experience(
    experience_data: ExperienceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new experience"""
    if not current_user.is_alumni:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only alumni can create experiences"
        )
    
    profile = get_or_create_alumni_profile(current_user, db)
    
    experience = Experience(
        alumni_profile_id=profile.id,
        **experience_data.model_dump()
    )
    
    db.add(experience)
    db.commit()
    db.refresh(experience)
    
    # Award points for adding experience
    try:
        award_points(
            db=db,
            user_id=current_user.id,
            point_type=PointType.EXPERIENCE_ADDED,
            description=f"Added {experience.type} experience: {experience.title}",
            related_entity_id=experience.id,
            related_entity_type="experience"
        )
    except Exception as e:
        print(f"Error awarding points: {e}")
    
    return experience


@router.get("/experiences", response_model=List[ExperienceResponse])
async def list_experiences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all experiences for current user"""
    if not current_user.is_alumni:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only alumni can access experiences"
        )
    
    profile = get_or_create_alumni_profile(current_user, db)
    experiences = db.query(Experience).filter(Experience.alumni_profile_id == profile.id).all()
    return experiences


@router.put("/experiences/{experience_id}", response_model=ExperienceResponse)
async def update_experience(
    experience_id: str,
    experience_data: ExperienceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an experience"""
    if not current_user.is_alumni:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only alumni can update experiences"
        )
    
    profile = get_or_create_alumni_profile(current_user, db)
    
    try:
        exp_uuid = uuid.UUID(experience_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid experience ID")
    
    experience = db.query(Experience).filter(
        Experience.id == exp_uuid,
        Experience.alumni_profile_id == profile.id
    ).first()
    
    if not experience:
        raise HTTPException(status_code=404, detail="Experience not found")
    
    for field, value in experience_data.model_dump(exclude_unset=True).items():
        setattr(experience, field, value)
    
    db.commit()
    db.refresh(experience)
    return experience


@router.delete("/experiences/{experience_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_experience(
    experience_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an experience"""
    if not current_user.is_alumni:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only alumni can delete experiences"
        )
    
    profile = get_or_create_alumni_profile(current_user, db)
    
    try:
        exp_uuid = uuid.UUID(experience_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid experience ID")
    
    experience = db.query(Experience).filter(
        Experience.id == exp_uuid,
        Experience.alumni_profile_id == profile.id
    ).first()
    
    if not experience:
        raise HTTPException(status_code=404, detail="Experience not found")
    
    db.delete(experience)
    db.commit()
    return None


# Resume endpoints
@router.post("/resumes", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a resume"""
    if not current_user.is_alumni:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only alumni can upload resumes"
        )
    
    # Validate file type
    if not file.filename.endswith(('.pdf', '.doc', '.docx')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF, DOC, and DOCX files are allowed"
        )
    
    # Read file content
    content = await file.read()
    file_size = len(content)
    
    # Validate file size (10MB max)
    max_size = 10 * 1024 * 1024
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum of 10MB"
        )
    
    profile = get_or_create_alumni_profile(current_user, db)
    
    # Upload to storage
    try:
        file_path = storage_service.upload_file(
            content,
            f"alumni/{str(current_user.id)}",
            file.filename
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )
    
    # Set all other resumes as non-primary
    db.query(Resume).filter(Resume.alumni_profile_id == profile.id).update({"is_primary": False})
    
    # Create resume record
    resume = Resume(
        alumni_profile_id=profile.id,
        file_path=file_path,
        file_name=file.filename,
        file_size=file_size,
        is_primary=True
    )
    
    db.add(resume)
    db.commit()
    db.refresh(resume)
    
    # Award points for uploading resume
    try:
        award_points(
            db=db,
            user_id=current_user.id,
            point_type=PointType.RESUME_UPLOADED,
            description=f"Uploaded resume: {file.filename}",
            related_entity_id=resume.id,
            related_entity_type="resume"
        )
    except Exception as e:
        print(f"Error awarding points: {e}")
    
    return resume


@router.get("/resumes", response_model=List[ResumeResponse])
async def list_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all resumes for current user"""
    if not current_user.is_alumni:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only alumni can access resumes"
        )
    
    profile = get_or_create_alumni_profile(current_user, db)
    resumes = db.query(Resume).filter(Resume.alumni_profile_id == profile.id).all()
    return resumes


# Matching and search endpoints
@router.get("/search/mentors", response_model=List[MentorSearchResponse])
async def search_mentors(
    industry: Optional[str] = None,
    major: Optional[str] = None,
    location: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search for mentors based on criteria"""
    # Build query
    query = db.query(AlumniProfile).filter(AlumniProfile.is_mentor == True)
    
    if industry:
        query = query.filter(func.lower(AlumniProfile.industry) == func.lower(industry))
    if location:
        query = query.filter(func.lower(AlumniProfile.location).contains(func.lower(location)))
    
    # Filter out current user's profile
    if current_user.is_alumni:
        current_profile = db.query(AlumniProfile).filter(AlumniProfile.user_id == current_user.id).first()
        if current_profile:
            query = query.filter(AlumniProfile.id != current_profile.id)
    
    profiles = query.all()
    
    results = []
    for profile in profiles:
        user = db.query(User).filter(User.id == profile.user_id).first()
        experiences = db.query(Experience).filter(Experience.alumni_profile_id == profile.id).all()
        resume_count = db.query(Resume).filter(Resume.alumni_profile_id == profile.id).count()
        
        # Calculate match score based on major similarity
        match_score = None
        if major and user.major:
            if major.lower() == user.major.lower():
                match_score = 1.0
            elif major.lower() in user.major.lower() or user.major.lower() in major.lower():
                match_score = 0.7
        
        results.append({
            "alumni_profile": profile,
            "user": {
                "id": str(user.id),
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "major": user.major,
                "graduation_year": user.graduation_year
            },
            "experiences": experiences,
            "resume_count": resume_count,
            "match_score": match_score
        })
    
    # Sort by match score if available
    results.sort(key=lambda x: x["match_score"] if x["match_score"] else 0, reverse=True)
    
    return results


@router.get("/search/mentees", response_model=List[MentorSearchResponse])
async def search_mentees(
    industry: Optional[str] = None,
    major: Optional[str] = None,
    location: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search for mentees (for mentors)"""
    if not current_user.is_alumni:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only alumni can search for mentees"
        )
    
    profile = get_or_create_alumni_profile(current_user, db)
    if not profile.is_mentor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only mentors can search for mentees"
        )
    
    # Build query
    query = db.query(AlumniProfile).filter(AlumniProfile.is_mentee == True)
    
    if industry:
        query = query.filter(func.lower(AlumniProfile.industry) == func.lower(industry))
    if location:
        query = query.filter(func.lower(AlumniProfile.location).contains(func.lower(location)))
    
    # Filter out current user's profile
    query = query.filter(AlumniProfile.id != profile.id)
    
    profiles = query.all()
    
    results = []
    for prof in profiles:
        user = db.query(User).filter(User.id == prof.user_id).first()
        experiences = db.query(Experience).filter(Experience.alumni_profile_id == prof.id).all()
        resume_count = db.query(Resume).filter(Resume.alumni_profile_id == prof.id).count()
        
        # Calculate match score
        match_score = None
        if profile.industry and prof.industry:
            if profile.industry.lower() == prof.industry.lower():
                match_score = 1.0
            else:
                match_score = 0.5
        
        results.append({
            "alumni_profile": prof,
            "user": {
                "id": str(user.id),
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "major": user.major,
                "graduation_year": user.graduation_year
            },
            "experiences": experiences,
            "resume_count": resume_count,
            "match_score": match_score
        })
    
    results.sort(key=lambda x: x["match_score"] if x["match_score"] else 0, reverse=True)
    
    return results


# Mentorship request endpoints
@router.post("/requests", response_model=MentorshipRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_mentorship_request(
    request_data: MentorshipRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a mentorship request"""
    if not current_user.is_alumni:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only alumni can create mentorship requests"
        )
    
    mentee_profile = get_or_create_alumni_profile(current_user, db)
    
    try:
        mentor_uuid = uuid.UUID(request_data.mentor_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid mentor ID")
    
    mentor_profile = db.query(AlumniProfile).filter(AlumniProfile.id == mentor_uuid).first()
    if not mentor_profile:
        raise HTTPException(status_code=404, detail="Mentor profile not found")
    
    if not mentor_profile.is_mentor:
        raise HTTPException(status_code=400, detail="Selected user is not a mentor")
    
    # Check if request already exists
    existing = db.query(MentorshipRequest).filter(
        MentorshipRequest.mentor_id == mentor_uuid,
        MentorshipRequest.mentee_id == mentee_profile.id,
        MentorshipRequest.status == RequestStatus.PENDING
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Mentorship request already exists")
    
    request = MentorshipRequest(
        mentor_id=mentor_uuid,
        mentee_id=mentee_profile.id,
        message=request_data.message
    )
    
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


@router.get("/requests", response_model=List[MentorshipRequestResponse])
async def list_mentorship_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List mentorship requests (sent and received)"""
    if not current_user.is_alumni:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only alumni can access mentorship requests"
        )
    
    profile = get_or_create_alumni_profile(current_user, db)
    
    requests = db.query(MentorshipRequest).filter(
        or_(
            MentorshipRequest.mentor_id == profile.id,
            MentorshipRequest.mentee_id == profile.id
        )
    ).all()
    
    return requests


@router.put("/requests/{request_id}/accept", response_model=MentorshipRequestResponse)
async def accept_mentorship_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accept a mentorship request"""
    if not current_user.is_alumni:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only alumni can accept mentorship requests"
        )
    
    profile = get_or_create_alumni_profile(current_user, db)
    
    try:
        req_uuid = uuid.UUID(request_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid request ID")
    
    request = db.query(MentorshipRequest).filter(
        MentorshipRequest.id == req_uuid,
        MentorshipRequest.mentor_id == profile.id,  # Only mentor can accept
        MentorshipRequest.status == RequestStatus.PENDING
    ).first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Request not found or already processed")
    
    # Update request status
    from datetime import datetime
    request.status = RequestStatus.ACCEPTED
    request.responded_at = datetime.utcnow()
    
    # Update user's mentor/mentee relationships
    mentee_user = db.query(User).filter(User.id == request.mentee.user_id).first()
    mentor_user = db.query(User).filter(User.id == profile.user_id).first()
    
    if mentee_user:
        mentee_user.mentor_id = profile.id
    if mentor_user:
        mentor_user.mentee_id = request.mentee.id
    
    # Award points to mentor for accepting mentorship
    try:
        award_points(
            db=db,
            user_id=mentor_user.id,
            point_type=PointType.MENTORSHIP_ACCEPTED,
            description=f"Accepted mentorship request from {mentee_user.first_name} {mentee_user.last_name}",
            related_user_id=mentee_user.id,
            related_entity_id=request.id,
            related_entity_type="mentorship_request"
        )
    except Exception as e:
        # Log error but don't fail the request
        print(f"Error awarding points: {e}")
    
    db.commit()
    db.refresh(request)
    return request


@router.put("/requests/{request_id}/reject", response_model=MentorshipRequestResponse)
async def reject_mentorship_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reject a mentorship request"""
    if not current_user.is_alumni:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only alumni can reject mentorship requests"
        )
    
    profile = get_or_create_alumni_profile(current_user, db)
    
    try:
        req_uuid = uuid.UUID(request_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid request ID")
    
    request = db.query(MentorshipRequest).filter(
        MentorshipRequest.id == req_uuid,
        MentorshipRequest.mentor_id == profile.id,  # Only mentor can reject
        MentorshipRequest.status == RequestStatus.PENDING
    ).first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Request not found or already processed")
    
    from datetime import datetime
    request.status = RequestStatus.REJECTED
    request.responded_at = datetime.utcnow()
    
    db.commit()
    db.refresh(request)
    return request

