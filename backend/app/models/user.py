"""
User Model
"""
from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    pledge_class = Column(String(50))
    graduation_year = Column(Integer)
    major = Column(String(100), nullable=True)  # User's major field
    phone_number = Column(String(20), nullable=True)  # User's phone number
    hashed_password = Column(String(255), nullable=False)
    is_alumni = Column(Boolean, default=False)  # Flag to identify alumni users
    mentor_id = Column(UUID(as_uuid=True), ForeignKey("alumni_profiles.id", ondelete="SET NULL"), nullable=True)  # Active mentor
    mentee_id = Column(UUID(as_uuid=True), ForeignKey("alumni_profiles.id", ondelete="SET NULL"), nullable=True)  # Active mentee
    points = Column(Integer, default=0, nullable=False)  # Total points earned
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    alumni_profile = relationship("AlumniProfile", foreign_keys="AlumniProfile.user_id", back_populates="user", uselist=False)

