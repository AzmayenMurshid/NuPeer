"""
Calendar Event Model
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, Enum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.core.database import Base


class EventType(str, enum.Enum):
    TUTORING = "tutoring"
    GROUP_STUDY = "group_study"


class CalendarEvent(Base):
    __tablename__ = "calendar_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organizer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    event_type = Column(Enum(EventType), nullable=False, default=EventType.GROUP_STUDY)
    course_code = Column(String(20), nullable=True, index=True)  # Optional: link to a course
    start_time = Column(DateTime(timezone=True), nullable=False, index=True)
    end_time = Column(DateTime(timezone=True), nullable=False, index=True)
    location = Column(String(255), nullable=True)  # Physical location or online link
    is_online = Column(Boolean, default=False)
    max_participants = Column(String(10), nullable=True)  # e.g., "10" or "unlimited"
    status = Column(String(50), default="scheduled")  # scheduled, cancelled, completed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    organizer = relationship("User", foreign_keys=[organizer_id], backref="organized_events")
    participants = relationship("EventParticipant", back_populates="event", cascade="all, delete-orphan")


class EventParticipant(Base):
    __tablename__ = "event_participants"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("calendar_events.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="accepted")  # accepted, declined, pending
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    event = relationship("CalendarEvent", back_populates="participants")
    user = relationship("User", foreign_keys=[user_id], backref="event_participations")
    
    # Unique constraint: a user can only participate once per event
    __table_args__ = (
        UniqueConstraint('event_id', 'user_id', name='unique_event_participant'),
    )

