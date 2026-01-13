"""
Points System API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.points import PointsHistory, PointType
from app.services.points_service import award_points, get_user_points, get_points_history, POINT_VALUES

router = APIRouter()


# Pydantic models
class PointsHistoryResponse(BaseModel):
    id: str
    points: int
    point_type: str
    description: Optional[str]
    related_user_id: Optional[str]
    related_entity_id: Optional[str]
    related_entity_type: Optional[str]
    created_at: str
    
    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    user_id: str
    first_name: str
    last_name: str
    points: int
    rank: int


class PointsSummary(BaseModel):
    total_points: int
    rank: Optional[int]
    recent_activity: List[PointsHistoryResponse]


@router.get("/points", response_model=PointsSummary)
async def get_my_points(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's points and summary"""
    # Get total points
    total_points = get_user_points(db, current_user.id)
    
    # Get rank (users with more points)
    rank = (
        db.query(User)
        .filter(User.points > total_points)
        .count() + 1
    )
    
    # Get recent activity
    recent_history = get_points_history(db, current_user.id, limit=10)
    
    return {
        "total_points": total_points,
        "rank": rank,
        "recent_activity": recent_history,
    }


@router.get("/points/history", response_model=List[PointsHistoryResponse])
async def get_points_history_endpoint(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get points history for current user"""
    history = get_points_history(db, current_user.id, limit=limit, offset=offset)
    return history


@router.get("/points/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get leaderboard of top users by points"""
    top_users = (
        db.query(User)
        .order_by(desc(User.points))
        .limit(limit)
        .all()
    )
    
    leaderboard = []
    for rank, user in enumerate(top_users, start=1):
        leaderboard.append({
            "user_id": str(user.id),
            "first_name": user.first_name,
            "last_name": user.last_name,
            "points": user.points or 0,
            "rank": rank,
        })
    
    return leaderboard


@router.get("/points/values")
async def get_point_values():
    """Get point values for different activities"""
    return {
        point_type.value: POINT_VALUES.get(point_type, 0)
        for point_type in PointType
    }

