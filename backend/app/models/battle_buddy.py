"""
Battle Buddy Team Models
"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, UniqueConstraint
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class BattleBuddyTeam(Base):
    """Battle Buddy Team - Academic competition teams"""
    __tablename__ = "battle_buddy_teams"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    points = Column(Integer, default=0, nullable=False)  # Team points (separate from individual points)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    members = relationship("BattleBuddyMember", back_populates="team", cascade="all, delete-orphan")


class BattleBuddyMember(Base):
    """Battle Buddy Team Members"""
    __tablename__ = "battle_buddy_members"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), ForeignKey("battle_buddy_teams.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    team = relationship("BattleBuddyTeam", back_populates="members")
    user = relationship("User", backref="battle_buddy_teams")
    
    # Unique constraint: a user can only be in one team
    __table_args__ = (
        sa.UniqueConstraint('user_id', name='uq_battle_buddy_members_user_id'),
        {'comment': 'Users can only be members of one battle buddy team at a time'},
    )

