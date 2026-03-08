"""
Class Post Model
"""
from sqlalchemy import Column, String, Text, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class ClassPost(Base):
    __tablename__ = "class_posts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_code = Column(String(20), nullable=True, index=True)  # e.g., "CS 101"
    course_name = Column(String(255), nullable=True)  # Optional course name
    class_format = Column(String(20), nullable=False)  # "in_person" or "online"
    professor_name = Column(String(255), nullable=False)
    professor_rating = Column(Numeric(3, 2), nullable=False)  # 0.00 to 5.00
    exam_format = Column(String(20), nullable=False)  # "in_person" or "online"
    lockdown_browser_required = Column(Boolean, nullable=True)  # Only relevant if exam_format is "online"
    description = Column(Text, nullable=True)  # User description of the class
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", backref="class_posts")

