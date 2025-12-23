"""
Recommendation Model
"""
from sqlalchemy import Column, String, Numeric, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    help_request_id = Column(UUID(as_uuid=True), ForeignKey("help_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    helper_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    grade_score = Column(Numeric(3, 2))  # Normalized grade (0.0-4.0)
    rank = Column(Integer)  # Ranking position
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    help_request = relationship("HelpRequest", back_populates="recommendations")
    helper = relationship("User", foreign_keys=[helper_id])
    course = relationship("Course")

