"""
Experience Model - Work and Education Experiences
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Date, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class Experience(Base):
    __tablename__ = "experiences"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alumni_profile_id = Column(UUID(as_uuid=True), ForeignKey("alumni_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # 'work', 'education', 'volunteer', 'project'
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=True)  # Company or institution name
    location = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    is_current = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    alumni_profile = relationship("AlumniProfile", back_populates="experiences")

