"""
Calendar Event endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func
from pydantic import BaseModel, field_validator
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
from app.core.database import get_db
from app.models.calendar_event import CalendarEvent, EventParticipant, EventType
from app.models.user import User
from app.models.course import Course
from app.api.v1.auth import get_current_user
from app.services.points_service import award_points
from app.models.points import PointType

router = APIRouter()


class CalendarEventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_type: EventType
    course_code: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    is_online: bool = False
    max_participants: Optional[str] = None
    invite_user_ids: Optional[List[UUID]] = None  # List of user IDs to invite


class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    course_code: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    is_online: Optional[bool] = None
    max_participants: Optional[str] = None
    status: Optional[str] = None
    invite_user_ids: Optional[List[UUID]] = None  # List of user IDs to invite


class EventParticipantResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    status: str
    
    @field_validator('id', 'user_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if v is not None:
            return str(v)
        return v
    
    class Config:
        from_attributes = True


class CalendarEventResponse(BaseModel):
    id: str
    organizer_id: str
    organizer_name: str
    title: str
    description: Optional[str] = None
    event_type: str
    course_code: Optional[str] = None
    start_time: str
    end_time: str
    location: Optional[str] = None
    is_online: bool
    max_participants: Optional[str] = None
    status: str
    created_at: str
    updated_at: Optional[str] = None
    participants: List[EventParticipantResponse] = []
    
    @field_validator('id', 'organizer_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if v is not None:
            return str(v)
        return v
    
    @field_validator('start_time', 'end_time', 'created_at', 'updated_at', mode='before')
    @classmethod
    def convert_datetime_to_str(cls, v):
        if isinstance(v, datetime):
            return v.isoformat()
        return v
    
    class Config:
        from_attributes = True


@router.post("", response_model=CalendarEventResponse, status_code=status.HTTP_201_CREATED)
async def create_calendar_event(
    event_data: CalendarEventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new calendar event"""
    try:
        # Validate end_time is after start_time
        if event_data.end_time <= event_data.start_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End time must be after start time"
            )
        
        # Create the event
        event = CalendarEvent(
            organizer_id=current_user.id,
            title=event_data.title,
            description=event_data.description,
            event_type=event_data.event_type,
            course_code=event_data.course_code.upper() if event_data.course_code else None,
            start_time=event_data.start_time,
            end_time=event_data.end_time,
            location=event_data.location,
            is_online=event_data.is_online,
            max_participants=event_data.max_participants,
            status="scheduled"
        )
        
        db.add(event)
        db.commit()
        db.refresh(event)
        
        # Add organizer as a participant
        participant = EventParticipant(
            event_id=event.id,
            user_id=current_user.id,
            status="accepted"
        )
        db.add(participant)
        
        # Add invitations for specified users
        if event_data.invite_user_ids:
            for user_id in event_data.invite_user_ids:
                # Skip if trying to invite self
                if user_id == current_user.id:
                    continue
                
                # Check if user exists
                invited_user = db.query(User).filter(User.id == user_id).first()
                if not invited_user:
                    continue
                
                # Check if already a participant
                existing = db.query(EventParticipant).filter(
                    and_(
                        EventParticipant.event_id == event.id,
                        EventParticipant.user_id == user_id
                    )
                ).first()
                
                if not existing:
                    invite = EventParticipant(
                        event_id=event.id,
                        user_id=user_id,
                        status="pending"
                    )
                    db.add(invite)
        
        db.commit()
        
        # Award points for creating calendar event
        try:
            award_points(
                db=db,
                user_id=current_user.id,
                point_type=PointType.CALENDAR_EVENT_CREATED,
                description=f"Created calendar event: {event.title}",
                related_entity_id=event.id,
                related_entity_type="calendar_event"
            )
        except Exception as e:
            print(f"Error awarding points: {e}")
        
        # Load relationships for response
        db.refresh(event)
        event = db.query(CalendarEvent).options(
            joinedload(CalendarEvent.organizer),
            joinedload(CalendarEvent.participants).joinedload(EventParticipant.user)
        ).filter(CalendarEvent.id == event.id).first()
        
        return _format_event_response(event)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        import logging
        logger = logging.getLogger(__name__)
        error_details = traceback.format_exc()
        logger.error(f"Calendar event creation error: {error_details}")
        
        # Check if it's a database connection error
        error_str = str(e).lower()
        if 'connection' in error_str or 'could not connect' in error_str or 'timeout' in error_str:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection error. Please check if the database is running and try again."
            )
        
        # Check if it's a table doesn't exist error
        if 'does not exist' in error_str or 'relation' in error_str or 'table' in error_str:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "Calendar events table not found. Please run the database migration:\n"
                    "cd backend\n"
                    "python -m alembic upgrade head\n"
                )
            )
        
        # Check for foreign key constraint errors
        if 'foreign key' in error_str or 'constraint' in error_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid data provided. Please check all fields and try again."
            )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create calendar event: {str(e)}"
        )


@router.get("", response_model=List[CalendarEventResponse])
async def list_calendar_events(
    start_date: Optional[datetime] = Query(None, description="Filter events from this date"),
    end_date: Optional[datetime] = Query(None, description="Filter events until this date"),
    event_type: Optional[EventType] = Query(None, description="Filter by event type"),
    course_code: Optional[str] = Query(None, description="Filter by course code"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List calendar events with optional filters"""
    query = db.query(CalendarEvent).options(
        joinedload(CalendarEvent.organizer),
        joinedload(CalendarEvent.participants).joinedload(EventParticipant.user)
    )
    
    # Filter by date range
    if start_date:
        query = query.filter(CalendarEvent.start_time >= start_date)
    if end_date:
        query = query.filter(CalendarEvent.end_time <= end_date)
    
    # Filter by event type
    if event_type:
        query = query.filter(CalendarEvent.event_type == event_type)
    
    # Filter by course code
    if course_code:
        query = query.filter(CalendarEvent.course_code == course_code.upper())
    
    # Get events where user is organizer or participant
    query = query.filter(
        or_(
            CalendarEvent.organizer_id == current_user.id,
            CalendarEvent.id.in_(
                db.query(EventParticipant.event_id).filter(
                    EventParticipant.user_id == current_user.id
                )
            )
        )
    )
    
    events = query.order_by(desc(CalendarEvent.start_time)).all()
    
    return [_format_event_response(event) for event in events]


@router.get("/{event_id}", response_model=CalendarEventResponse)
async def get_calendar_event(
    event_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific calendar event"""
    event = db.query(CalendarEvent).options(
        joinedload(CalendarEvent.organizer),
        joinedload(CalendarEvent.participants).joinedload(EventParticipant.user)
    ).filter(CalendarEvent.id == event_id).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calendar event not found"
        )
    
    # Check if user has access (organizer or participant)
    is_organizer = event.organizer_id == current_user.id
    is_participant = any(p.user_id == current_user.id for p in event.participants)
    
    if not (is_organizer or is_participant):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this event"
        )
    
    return _format_event_response(event)


@router.put("/{event_id}", response_model=CalendarEventResponse)
async def update_calendar_event(
    event_id: UUID,
    event_data: CalendarEventUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a calendar event (only organizer can update)"""
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calendar event not found"
        )
    
    if event.organizer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the organizer can update this event"
        )
    
    try:
        # Update fields
        if event_data.title is not None:
            event.title = event_data.title
        if event_data.description is not None:
            event.description = event_data.description
        if event_data.course_code is not None:
            event.course_code = event_data.course_code.upper() if event_data.course_code else None
        if event_data.start_time is not None:
            event.start_time = event_data.start_time
        if event_data.end_time is not None:
            event.end_time = event_data.end_time
        if event_data.location is not None:
            event.location = event_data.location
        if event_data.is_online is not None:
            event.is_online = event_data.is_online
        if event_data.max_participants is not None:
            event.max_participants = event_data.max_participants
        if event_data.status is not None:
            event.status = event_data.status
        
        # Validate end_time is after start_time
        if event.end_time <= event.start_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End time must be after start time"
            )
        
        # Add new invitations if provided
        if event_data.invite_user_ids is not None:
            for user_id in event_data.invite_user_ids:
                # Skip if trying to invite self
                if user_id == current_user.id:
                    continue
                
                # Check if user exists
                invited_user = db.query(User).filter(User.id == user_id).first()
                if not invited_user:
                    continue
                
                # Check if already a participant
                existing = db.query(EventParticipant).filter(
                    and_(
                        EventParticipant.event_id == event.id,
                        EventParticipant.user_id == user_id
                    )
                ).first()
                
                if not existing:
                    invite = EventParticipant(
                        event_id=event.id,
                        user_id=user_id,
                        status="pending"
                    )
                    db.add(invite)
        
        db.commit()
        db.refresh(event)
        
        # Reload with relationships
        event = db.query(CalendarEvent).options(
            joinedload(CalendarEvent.organizer),
            joinedload(CalendarEvent.participants).joinedload(EventParticipant.user)
        ).filter(CalendarEvent.id == event.id).first()
        
        return _format_event_response(event)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update calendar event: {str(e)}"
        )


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_calendar_event(
    event_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a calendar event (only organizer can delete)"""
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calendar event not found"
        )
    
    if event.organizer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the organizer can delete this event"
        )
    
    try:
        db.delete(event)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete calendar event: {str(e)}"
        )


@router.post("/{event_id}/participants", response_model=EventParticipantResponse)
async def join_event(
    event_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Join a calendar event as a participant"""
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calendar event not found"
        )
    
    # Check if already a participant
    existing = db.query(EventParticipant).filter(
        and_(
            EventParticipant.event_id == event_id,
            EventParticipant.user_id == current_user.id
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a participant in this event"
        )
    
    try:
        participant = EventParticipant(
            event_id=event_id,
            user_id=current_user.id,
            status="accepted"
        )
        db.add(participant)
        db.commit()
        db.refresh(participant)
        
        # Award points for joining calendar event
        try:
            award_points(
                db=db,
                user_id=current_user.id,
                point_type=PointType.CALENDAR_EVENT_JOINED,
                description=f"Joined calendar event: {event.title}",
                related_entity_id=event.id,
                related_entity_type="calendar_event"
            )
        except Exception as e:
            print(f"Error awarding points: {e}")
        
        # Load user relationship
        participant = db.query(EventParticipant).options(
            joinedload(EventParticipant.user)
        ).filter(EventParticipant.id == participant.id).first()
        
        return EventParticipantResponse(
            id=str(participant.id),
            user_id=str(participant.user_id),
            user_name=f"{participant.user.first_name} {participant.user.last_name}",
            status=participant.status
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to join event: {str(e)}"
        )


@router.delete("/{event_id}/participants/{participant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def leave_event(
    event_id: UUID,
    participant_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Leave a calendar event"""
    participant = db.query(EventParticipant).filter(
        and_(
            EventParticipant.id == participant_id,
            EventParticipant.event_id == event_id,
            EventParticipant.user_id == current_user.id
        )
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant record not found"
        )
    
    try:
        db.delete(participant)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to leave event: {str(e)}"
        )


def _format_event_response(event: CalendarEvent) -> CalendarEventResponse:
    """Helper function to format event response"""
    participants = [
        EventParticipantResponse(
            id=str(p.id),
            user_id=str(p.user_id),
            user_name=f"{p.user.first_name} {p.user.last_name}",
            status=p.status
        )
        for p in event.participants
    ]
    
    return CalendarEventResponse(
        id=str(event.id),
        organizer_id=str(event.organizer_id),
        organizer_name=f"{event.organizer.first_name} {event.organizer.last_name}",
        title=event.title,
        description=event.description,
        event_type=event.event_type.value,
        course_code=event.course_code,
        start_time=event.start_time.isoformat(),
        end_time=event.end_time.isoformat(),
        location=event.location,
        is_online=event.is_online,
        max_participants=event.max_participants,
        status=event.status,
        created_at=event.created_at.isoformat(),
        updated_at=event.updated_at.isoformat() if event.updated_at else None,
        participants=participants
    )


# Response models for invite suggestions
class InviteSuggestionResponse(BaseModel):
    user_id: str
    name: str
    email: Optional[str] = None
    major: Optional[str] = None
    graduation_year: Optional[int] = None
    pledge_class: Optional[str] = None
    reason: str  # e.g., "Tutor for CS 101", "Same major", "Study group member"
    
    @field_validator('user_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if v is not None:
            return str(v)
        return v
    
    class Config:
        from_attributes = True


@router.get("/invite-suggestions/tutors", response_model=List[InviteSuggestionResponse])
async def get_tutor_suggestions(
    course_code: str = Query(..., description="Course code to find tutors for"),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get tutor suggestions for a course"""
    if not course_code:
        return []
    
    # Find tutors who have taken this course
    matching_tutors = db.query(Course).options(
        joinedload(Course.user)
    ).join(
        User, Course.user_id == User.id
    ).filter(
        and_(
            Course.course_code == course_code.upper(),
            Course.user_id != current_user.id,
            Course.grade_score.isnot(None)
        )
    ).order_by(desc(Course.grade_score), desc(Course.year)).limit(limit).all()
    
    suggestions = []
    for course in matching_tutors:
        helper = course.user
        if helper is None:
            continue
        
        same_major = (
            current_user.major is not None and 
            helper.major is not None and 
            current_user.major.lower().strip() == helper.major.lower().strip()
        )
        
        reason = f"Tutor for {course_code}"
        if same_major:
            reason += " (Same major)"
        
        suggestions.append(InviteSuggestionResponse(
            user_id=str(helper.id),
            name=f"{helper.first_name} {helper.last_name}",
            email=helper.email,
            major=helper.major,
            graduation_year=helper.graduation_year,
            pledge_class=helper.pledge_class,
            reason=reason
        ))
    
    return suggestions


@router.get("/invite-suggestions/brothers-major", response_model=List[InviteSuggestionResponse])
async def get_brothers_major_suggestions(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get brothers with the same major"""
    if not current_user.major:
        return []
    
    # Find users with the same major
    brothers = db.query(User).filter(
        and_(
            User.id != current_user.id,
            User.major.isnot(None),
            func.lower(func.trim(User.major)) == func.lower(func.trim(current_user.major))
        )
    ).order_by(User.last_name, User.first_name).limit(limit).all()
    
    suggestions = []
    for brother in brothers:
        suggestions.append(InviteSuggestionResponse(
            user_id=str(brother.id),
            name=f"{brother.first_name} {brother.last_name}",
            email=brother.email,
            major=brother.major,
            graduation_year=brother.graduation_year,
            pledge_class=brother.pledge_class,
            reason=f"Same major: {brother.major}"
        ))
    
    return suggestions


@router.get("/invite-suggestions/study-group", response_model=List[InviteSuggestionResponse])
async def get_study_group_suggestions(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get study group suggestions (users taking same current courses)"""
    # Get current user's current courses (transcript_id is null)
    current_user_courses = db.query(Course).filter(
        and_(
            Course.user_id == current_user.id,
            Course.transcript_id.is_(None)
        )
    ).all()
    
    if not current_user_courses:
        return []
    
    # Get list of course codes
    current_course_codes = [course.course_code for course in current_user_courses if course.course_code]
    
    if not current_course_codes:
        return []
    
    # Find other users taking the same courses
    matching_courses = db.query(Course).options(
        joinedload(Course.user)
    ).join(
        User, Course.user_id == User.id
    ).filter(
        and_(
            Course.course_code.in_(current_course_codes),
            Course.user_id != current_user.id,
            Course.transcript_id.is_(None)
        )
    ).all()
    
    user_courses_map: dict = {}
    
    for course in matching_courses:
        helper = course.user
        if helper is None:
            continue
        
        helper_id = str(helper.id)
        
        if helper_id not in user_courses_map:
            user_courses_map[helper_id] = {
                'user': helper,
                'shared_courses': []
            }
        
        if course.course_code and course.course_code not in user_courses_map[helper_id]['shared_courses']:
            user_courses_map[helper_id]['shared_courses'].append(course.course_code)
    
    # Convert to list and sort by number of shared courses
    brothers_list = []
    for helper_id, data in user_courses_map.items():
        data['total_shared_courses'] = len(data['shared_courses'])
        brothers_list.append(data)
    
    # Sort by number of shared courses (descending)
    brothers_list.sort(key=lambda x: -x['total_shared_courses'])
    brothers_list = brothers_list[:limit]
    
    suggestions = []
    for data in brothers_list:
        helper = data['user']
        shared_courses = data['shared_courses']
        suggestions.append(InviteSuggestionResponse(
            user_id=str(helper.id),
            name=f"{helper.first_name} {helper.last_name}",
            email=helper.email,
            major=helper.major,
            graduation_year=helper.graduation_year,
            pledge_class=helper.pledge_class,
            reason=f"Study group: {', '.join(shared_courses[:3])}" + (f" (+{len(shared_courses) - 3} more)" if len(shared_courses) > 3 else "")
        ))
    
    return suggestions

