"""
Points System Models
"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Enum as SQLEnum, TypeDecorator
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
    DAILY_LOGIN = "daily_login"  # Daily login bonus


class PointTypeEnum(TypeDecorator):
    """TypeDecorator to ensure enum values (not names) are stored in database"""
    impl = SQLEnum(PointType, name='pointtype', native_enum=True)
    cache_ok = True
    
    def process_bind_param(self, value, dialect):
        """Convert enum to its value for database storage"""
        if value is None:
            return None
        if isinstance(value, PointType):
            return value.value  # Return the string value, not the enum name
        if isinstance(value, str):
            # If it's already a string value (like 'help_provided'), return as-is
            # If it's the enum name (like 'HELP_PROVIDED'), convert to value
            try:
                # Try to get enum by value first (case-sensitive)
                enum_instance = PointType(value)
                return enum_instance.value  # Return the value explicitly
            except ValueError:
                # If not a value, try as enum name
                try:
                    return PointType[value].value
                except (KeyError, AttributeError):
                    # If still not found, raise an error rather than returning invalid value
                    raise ValueError(f"Invalid point type: {value}. Must be a valid PointType enum value or name.")
        return value
    
    def process_result_value(self, value, dialect):
        """Convert database value back to enum"""
        if value is None:
            return None
        if isinstance(value, str):
            try:
                return PointType(value)
            except ValueError:
                return value
        return value


class PointsHistory(Base):
    """Track all point transactions"""
    __tablename__ = "points_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    points = Column(Integer, nullable=False)  # Can be positive (earned) or negative (spent)
    point_type = Column(PointTypeEnum(), nullable=False, index=True)
    description = Column(Text, nullable=True)  # Human-readable description
    related_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # User who helped/was helped
    related_entity_id = Column(UUID(as_uuid=True), nullable=True)  # ID of related entity (help_request, mentorship_request, etc.)
    related_entity_type = Column(String(50), nullable=True)  # Type of related entity
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], backref="points_history")
    related_user = relationship("User", foreign_keys=[related_user_id])

