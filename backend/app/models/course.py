"""
Course Model
"""
from sqlalchemy import Column, String, Text, Numeric, Integer, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class Course(Base):
    __tablename__ = "courses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    transcript_id = Column(UUID(as_uuid=True), ForeignKey("transcripts.id", ondelete="CASCADE"), nullable=True)  # Nullable for manually added courses
    course_code = Column(String(20), nullable=False, index=True)  # e.g., "CS 101"
    course_name = Column(Text)  # Changed from String(255) to Text to handle variable-length course names
    grade = Column(String(20))  # e.g., "A", "B+", "3.5", "IN PROGRESS"
    grade_score = Column(Numeric(3, 2))  # Normalized 0.0-4.0
    credit_hours = Column(Numeric(3, 1))
    points = Column(Numeric(5, 2))  # GPA points (grade_score * credit_hours) from transcript
    semester = Column(String(50))  # e.g., "Fall 2023"
    year = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", backref="courses")
    transcript = relationship("Transcript", back_populates="courses")
    
    # Unique constraint to prevent duplicate entries
    # Composite index for optimized tutor search queries
    # This index speeds up: WHERE course_code = X AND grade_score IS NOT NULL ORDER BY grade_score DESC, year DESC
    __table_args__ = (
        UniqueConstraint('user_id', 'course_code', 'semester', 'year', name='unique_user_course'),
        Index('idx_course_code_grade_year', 'course_code', 'grade_score', 'year'),  # Composite index for tutor search
    )

