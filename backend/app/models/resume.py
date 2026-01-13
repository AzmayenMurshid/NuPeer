"""
Resume Model
"""
from sqlalchemy import Column, String, BigInteger, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alumni_profile_id = Column(UUID(as_uuid=True), ForeignKey("alumni_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    file_path = Column(String(500), nullable=False)  # Path in object storage
    file_name = Column(String(255), nullable=False)
    file_size = Column(BigInteger)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    is_primary = Column(Boolean, default=True)  # Primary resume for matching
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    alumni_profile = relationship("AlumniProfile", back_populates="resumes")

