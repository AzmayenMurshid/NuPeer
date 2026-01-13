"""
Mentorship Request Model
"""
import enum
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class RequestStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class MentorshipRequest(Base):
    __tablename__ = "mentorship_requests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mentor_id = Column(UUID(as_uuid=True), ForeignKey("alumni_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    mentee_id = Column(UUID(as_uuid=True), ForeignKey("alumni_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    message = Column(Text, nullable=True)  # Message from requester
    status = Column(Enum(RequestStatus), nullable=False, default=RequestStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    responded_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    mentor = relationship("AlumniProfile", foreign_keys=[mentor_id], back_populates="mentorship_requests_received")
    mentee = relationship("AlumniProfile", foreign_keys=[mentee_id], back_populates="mentorship_requests_sent")

