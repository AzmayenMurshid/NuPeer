"""
Transcript Model
"""
from sqlalchemy import Column, String, BigInteger, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class Transcript(Base):
    __tablename__ = "transcripts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_path = Column(String(500), nullable=True)  # Path in object storage (optional, no longer used)
    file_name = Column(String(255), nullable=False)
    file_size = Column(BigInteger)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    processing_status = Column(String(50), default="pending")  # pending, processing, completed, failed
    processed_at = Column(DateTime(timezone=True))
    error_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", backref="transcripts")
    courses = relationship("Course", back_populates="transcript", cascade="all, delete-orphan")

