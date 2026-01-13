"""
Points System Models
"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.core.database import Base


class PointType(str, enum.Enum):
    """Types of activities that earn points"""
    HELP_PROVIDED = "help_provided"  # Helping someone with a course
    MENTORSHIP_ACCEPTED = "mentorship_accepted"  # Accepting a mentorship request
    MENTORSHIP_COMPLETED = "mentorship_completed"  # Completing a mentorship
    STUDY_GROUP_CREATED = "study_group_created"  # Creating a study group
    STUDY_GROUP_JOINED = "study_group_joined"  # Joining a study group
    PROFILE_COMPLETED = "profile_completed"  # Completing profile
    RESUME_UPLOADED = "resume_uploaded"  # Uploading resume
    EXPERIENCE_ADDED = "experience_added"  # Adding experience
    CALENDAR_EVENT_CREATED = "calendar_event_created"  # Creating calendar event
    CALENDAR_EVENT_JOINED = "calendar_event_joined"  # Joining calendar event
    DAILY_LOGIN = "daily_login"  # Daily login bonus


class PointsHistory(Base):
    """Track all point transactions"""
    __tablename__ = "points_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    points = Column(Integer, nullable=False)  # Can be positive (earned) or negative (spent)
    point_type = Column(SQLEnum(PointType), nullable=False, index=True)
    description = Column(Text, nullable=True)  # Human-readable description
    related_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # User who helped/was helped
    related_entity_id = Column(UUID(as_uuid=True), nullable=True)  # ID of related entity (help_request, mentorship_request, etc.)
    related_entity_type = Column(String(50), nullable=True)  # Type of related entity
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], backref="points_history")
    related_user = relationship("User", foreign_keys=[related_user_id])

