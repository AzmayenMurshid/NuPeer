"""
Admin API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from typing import Optional, List
import uuid
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.points import PointsHistory, PointType
from app.services.points_service import award_points

router = APIRouter()

# Admin access is now controlled by password only (no email check required)
def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to get current user (password protection handled on frontend)"""
    return current_user


# Pydantic models
class UpdatePointsRequest(BaseModel):
    user_id: str
    points: int
    description: Optional[str] = "Admin adjustment"
    point_type: Optional[str] = None


class UserSearchResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    points: int
    pledge_class: Optional[str]
    graduation_year: Optional[int]


@router.get("/users/search")
async def search_users(
    query: str,
    limit: int = 20,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Search for users by first name, last name, or email (username)"""
    search_term = f"%{query}%"
    users = (
        db.query(User)
        .filter(
            or_(
                User.first_name.ilike(search_term),
                User.last_name.ilike(search_term),
                User.email.ilike(search_term)  # Email serves as username
            )
        )
        .limit(limit)
        .all()
    )
    
    return [
        UserSearchResponse(
            id=str(user.id),
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            points=user.points or 0,
            pledge_class=user.pledge_class,
            graduation_year=user.graduation_year
        )
        for user in users
    ]


@router.post("/points/update")
async def update_user_points(
    request: UpdatePointsRequest,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update a user's points (admin only)"""
    try:
        user_id = uuid.UUID(request.user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Get target user
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Determine point type - use DAILY_LOGIN as placeholder for admin adjustments
    point_type = PointType.DAILY_LOGIN
    if request.point_type:
        try:
            point_type = PointType(request.point_type)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid point type: {request.point_type}"
            )
    
    # Get current points before update
    current_points = target_user.points or 0
    
    # Use award_points service function for proper point incrementation
    # Pass points=None to use custom point value, and no tagged_member_ids to avoid team point logic
    try:
        points_entry = award_points(
            db=db,
            user_id=user_id,
            point_type=point_type,
            description=request.description or f"Admin adjustment by {admin_user.email}",
            related_user_id=admin_user.id,
            related_entity_type="admin_adjustment",
            points=request.points,  # Custom point value
            tagged_member_ids=None  # No tagged members for admin adjustments
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    # Refresh to get updated points
    db.refresh(target_user)
    new_total = target_user.points or 0
    
    return {
        "success": True,
        "user_id": str(target_user.id),
        "user_name": f"{target_user.first_name} {target_user.last_name}",
        "previous_points": current_points,
        "points_added": request.points,
        "new_total": new_total,
        "history_entry_id": str(points_entry.id)
    }


@router.get("/check")
async def check_admin_status(
    current_user: User = Depends(get_current_user)
):
    """Check admin status (password-only protection, always returns true if authenticated)"""
    return {
        "is_admin": True,  # Password protection handled on frontend
        "email": current_user.email
    }

