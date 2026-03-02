"""
Tagged Member Model - Tracks team members tagged when points are awarded
"""
from sqlalchemy import Column, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class TaggedMember(Base):
    """Tagged Member - Links team members to points history entries"""
    __tablename__ = "tagged_members"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    points_history_id = Column(UUID(as_uuid=True), ForeignKey("points_history.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    points_history = relationship("PointsHistory", backref="tagged_members")
    user = relationship("User", backref="tagged_points")

