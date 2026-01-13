"""
Alumni Profile Model
"""
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class AlumniProfile(Base):
    __tablename__ = "alumni_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    bio = Column(Text, nullable=True)
    chapter = Column(String(100), nullable=True)  # Chapter name (e.g., "Zeta Chi")
    current_position = Column(String(255), nullable=True)
    company = Column(String(255), nullable=True)
    industry = Column(String(100), nullable=True)
    location = Column(String(255), nullable=True)
    linkedin_url = Column(String(500), nullable=True)
    website_url = Column(String(500), nullable=True)
    is_mentor = Column(Boolean, default=False)
    is_mentee = Column(Boolean, default=False)
    mentor_capacity = Column(Integer, default=5)  # Max number of mentees
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="alumni_profile", uselist=False)
    experiences = relationship("Experience", back_populates="alumni_profile", cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="alumni_profile", cascade="all, delete-orphan")
    mentorship_requests_sent = relationship("MentorshipRequest", foreign_keys="MentorshipRequest.mentee_id", back_populates="mentee")
    mentorship_requests_received = relationship("MentorshipRequest", foreign_keys="MentorshipRequest.mentor_id", back_populates="mentor")

