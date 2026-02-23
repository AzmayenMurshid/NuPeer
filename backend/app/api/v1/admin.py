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

# Admin emails - can be moved to environment variables or database
ADMIN_EMAILS = [
    "admin@nupeer.com",
    "admin@sigmanu.com",
    # Add more admin emails as needed
]


def is_admin(user: User) -> bool:
    """Check if user is an admin"""
    return user.email.lower() in [email.lower() for email in ADMIN_EMAILS]


def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to ensure user is an admin"""
    if not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
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
    
    # Calculate the difference
    current_points = target_user.points or 0
    new_total = current_points + request.points
    
    # Create points history entry
    points_entry = PointsHistory(
        user_id=user_id,
        points=request.points,
        point_type=point_type,
        description=request.description or f"Admin adjustment by {admin_user.email}",
        related_user_id=admin_user.id,
        related_entity_type="admin_adjustment"
    )
    
    # Update user's total points
    target_user.points = new_total
    
    db.add(points_entry)
    db.commit()
    db.refresh(points_entry)
    db.refresh(target_user)
    
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
    """Check if current user is an admin"""
    return {
        "is_admin": is_admin(current_user),
        "email": current_user.email
    }

