"""
Course Model
"""
from sqlalchemy import Column, String, Numeric, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class Course(Base):
    __tablename__ = "courses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    transcript_id = Column(UUID(as_uuid=True), ForeignKey("transcripts.id", ondelete="CASCADE"), nullable=False)
    course_code = Column(String(20), nullable=False, index=True)  # e.g., "CS 101"
    course_name = Column(String(255))
    grade = Column(String(10))  # e.g., "A", "B+", "3.5"
    grade_score = Column(Numeric(3, 2))  # Normalized 0.0-4.0
    credit_hours = Column(Numeric(3, 1))
    semester = Column(String(50))  # e.g., "Fall 2023"
    year = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", backref="courses")
    transcript = relationship("Transcript", back_populates="courses")
    
    # Unique constraint to prevent duplicate entries
    __table_args__ = (
        UniqueConstraint('user_id', 'course_code', 'semester', 'year', name='unique_user_course'),
    )

