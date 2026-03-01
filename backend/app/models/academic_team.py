"""
Academic Team Models
"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, UniqueConstraint
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class AcademicTeam(Base):
    """Academic Team - Teams for academic competitions and activities"""
    __tablename__ = "academic_teams"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    members = relationship("AcademicTeamMember", back_populates="team", cascade="all, delete-orphan")


class AcademicTeamMember(Base):
    """Academic Team Members"""
    __tablename__ = "academic_team_members"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), ForeignKey("academic_teams.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    team = relationship("AcademicTeam", back_populates="members")
    user = relationship("User", backref="academic_teams")
    
    # Unique constraint: a user can only be in one academic team at a time
    __table_args__ = (
        sa.UniqueConstraint('user_id', name='uq_academic_team_members_user_id'),
        {'comment': 'Users can only be members of one academic team at a time'},
    )

