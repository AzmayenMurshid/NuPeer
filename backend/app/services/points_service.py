"""
Points Service - Handles awarding and managing points
"""
from sqlalchemy.orm import Session
from app.models.points import PointsHistory, PointType
from app.models.user import User
from typing import Optional
import uuid


# Point values for different activities
POINT_VALUES = {
    PointType.HELP_PROVIDED: 50,
    PointType.MENTORSHIP_ACCEPTED: 100,
    PointType.MENTORSHIP_COMPLETED: 200,
    PointType.STUDY_GROUP_CREATED: 25,
    PointType.STUDY_GROUP_JOINED: 10,
    PointType.PROFILE_COMPLETED: 50,
    PointType.RESUME_UPLOADED: 25,
    PointType.EXPERIENCE_ADDED: 10,
    PointType.CALENDAR_EVENT_CREATED: 15,
    PointType.CALENDAR_EVENT_JOINED: 5,
    PointType.DAILY_LOGIN: 5,
}


def award_points(
    db: Session,
    user_id: uuid.UUID,
    point_type: PointType,
    description: Optional[str] = None,
    related_user_id: Optional[uuid.UUID] = None,
    related_entity_id: Optional[uuid.UUID] = None,
    related_entity_type: Optional[str] = None,
    points: Optional[int] = None
) -> PointsHistory:
    """
    Award points to a user for an activity
    
    Args:
        db: Database session
        user_id: ID of user receiving points
        point_type: Type of activity
        description: Optional description
        related_user_id: Optional ID of related user (e.g., who was helped)
        related_entity_id: Optional ID of related entity
        related_entity_type: Optional type of related entity
        points: Optional custom point value (defaults to POINT_VALUES)
    
    Returns:
        PointsHistory entry
    """
    # Get point value
    point_value = points if points is not None else POINT_VALUES.get(point_type, 0)
    
    if point_value <= 0:
        raise ValueError(f"Invalid point value: {point_value}")
    
    # Get user and update points
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User not found: {user_id}")
    
    # Create points history entry
    points_entry = PointsHistory(
        user_id=user_id,
        points=point_value,
        point_type=point_type,
        description=description,
        related_user_id=related_user_id,
        related_entity_id=related_entity_id,
        related_entity_type=related_entity_type,
    )
    
    # Update user's total points
    user.points = (user.points or 0) + point_value
    
    db.add(points_entry)
    db.commit()
    db.refresh(points_entry)
    
    return points_entry


def get_user_points(db: Session, user_id: uuid.UUID) -> int:
    """Get total points for a user"""
    user = db.query(User).filter(User.id == user_id).first()
    return user.points if user else 0


def get_points_history(
    db: Session,
    user_id: uuid.UUID,
    limit: int = 50,
    offset: int = 0
) -> list[PointsHistory]:
    """Get points history for a user"""
    return (
        db.query(PointsHistory)
        .filter(PointsHistory.user_id == user_id)
        .order_by(PointsHistory.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )

