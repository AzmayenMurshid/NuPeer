"""
Points System Models
"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, TypeDecorator
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
    """
    TypeDecorator that stores PointType enum values as strings in the database.
    
    This approach avoids PostgreSQL native enum serialization issues by using
    a simple String column with validation. The enum is still used in Python
    for type safety, but stored as plain strings in the database.
    
    Benefits:
    - No native enum serialization issues
    - Simpler and more reliable
    - Easier to migrate and modify
    - Still provides type safety in Python code
    """
    impl = String(50)  # Use String column instead of native enum
    cache_ok = True
    
    def process_bind_param(self, value, dialect):
        """
        Convert enum to its string value for database storage.
        
        Handles three cases:
        1. PointType enum instance -> extracts .value (e.g., 'help_provided')
        2. String value (already correct) -> validates and returns (e.g., 'help_provided')
        3. String name (enum name) -> converts to value (e.g., 'HELP_PROVIDED' -> 'help_provided')
        
        Args:
            value: PointType enum instance, enum value string, or enum name string
            dialect: SQLAlchemy dialect (unused)
            
        Returns:
            String value (e.g., 'help_provided')
            
        Raises:
            ValueError: If value cannot be converted to a valid enum value
        """
        if value is None:
            return None
        
        # If it's already a PointType enum, extract the value
        if isinstance(value, PointType):
            return value.value
        
        # If it's a string, validate and convert if needed
        if isinstance(value, str):
            # Try to get enum by value first (case-sensitive)
            try:
                enum_instance = PointType(value)
                return enum_instance.value  # Return the validated value
            except ValueError:
                # If not a value, try as enum name
                try:
                    return PointType[value].value
                except (KeyError, AttributeError):
                    raise ValueError(f"Invalid point type: {value}. Must be a valid PointType enum value or name.")
        
        # For any other type, try to convert to string and validate
        try:
            return PointType(str(value)).value
        except (ValueError, KeyError):
            raise ValueError(f"Invalid point type: {value}. Must be a valid PointType enum value or name.")
    
    def process_result_value(self, value, dialect):
        """
        Convert database string value back to PointType enum.
        
        Args:
            value: String value from database (e.g., 'help_provided')
            dialect: SQLAlchemy dialect (unused)
            
        Returns:
            PointType enum instance or None
        """
        if value is None:
            return None
        if isinstance(value, str):
            try:
                return PointType(value)
            except ValueError:
                # If invalid value in database, return as string (shouldn't happen with validation)
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

