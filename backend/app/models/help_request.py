"""
Help Request Model
"""
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class HelpRequest(Base):
    __tablename__ = "help_requests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requester_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_code = Column(String(20), nullable=False, index=True)
    course_name = Column(String(255))
    status = Column(String(50), default="active")  # active, fulfilled, cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    requester = relationship("User", backref="help_requests")
    recommendations = relationship("Recommendation", back_populates="help_request", cascade="all, delete-orphan")

