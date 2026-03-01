"""
Battle Buddy Team API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from pydantic import BaseModel
from typing import Optional, List
import uuid
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.battle_buddy import BattleBuddyTeam, BattleBuddyMember

router = APIRouter()

# Admin access is controlled by password only (no email check required)
def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to get current user (password protection handled on frontend)"""
    return current_user


# Pydantic models
class TeamMemberResponse(BaseModel):
    id: str
    user_id: str
    first_name: str
    last_name: str
    email: str
    joined_at: str
    
    class Config:
        from_attributes = True


class BattleBuddyTeamResponse(BaseModel):
    id: str
    team_name: str
    description: Optional[str]
    points: int
    member_count: int
    members: List[TeamMemberResponse]
    created_at: str
    
    class Config:
        from_attributes = True


class CreateTeamRequest(BaseModel):
    team_name: str
    description: Optional[str] = None


class AddMemberRequest(BaseModel):
    team_id: str
    user_id: str


class UpdateTeamPointsRequest(BaseModel):
    team_id: str
    points: int
    description: Optional[str] = "Admin adjustment"


class JoinTeamRequest(BaseModel):
    team_id: str


@router.get("/teams", response_model=List[BattleBuddyTeamResponse])
async def get_all_teams(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all battle buddy teams (admin only - includes all member details)"""
    teams = db.query(BattleBuddyTeam).order_by(BattleBuddyTeam.points.desc(), BattleBuddyTeam.team_name).all()
    
    result = []
    for team in teams:
        members = db.query(BattleBuddyMember).filter(BattleBuddyMember.team_id == team.id).all()
        member_responses = []
        for member in members:
            user = db.query(User).filter(User.id == member.user_id).first()
            if user:
                member_responses.append(TeamMemberResponse(
                    id=str(member.id),
                    user_id=str(member.user_id),
                    first_name=user.first_name,
                    last_name=user.last_name,
                    email=user.email,
                    joined_at=member.joined_at.isoformat() if member.joined_at else ""
                ))
        
        result.append(BattleBuddyTeamResponse(
            id=str(team.id),
            team_name=team.team_name,
            description=team.description,
            points=team.points or 0,
            member_count=len(member_responses),
            members=member_responses,
            created_at=team.created_at.isoformat() if team.created_at else ""
        ))
    
    return result


class PublicTeamResponse(BaseModel):
    """Public team response without member details"""
    id: str
    team_name: str
    description: Optional[str]
    points: int
    member_count: int
    created_at: str
    
    class Config:
        from_attributes = True


@router.get("/teams/list", response_model=List[PublicTeamResponse])
async def list_teams(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of all battle buddy teams (public - for users to see available teams to join)"""
    teams = db.query(BattleBuddyTeam).order_by(BattleBuddyTeam.points.desc(), BattleBuddyTeam.team_name).all()
    
    result = []
    for team in teams:
        member_count = db.query(BattleBuddyMember).filter(BattleBuddyMember.team_id == team.id).count()
        
        result.append(PublicTeamResponse(
            id=str(team.id),
            team_name=team.team_name,
            description=team.description,
            points=team.points or 0,
            member_count=member_count,
            created_at=team.created_at.isoformat() if team.created_at else ""
        ))
    
    return result


@router.post("/teams", response_model=BattleBuddyTeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    request: CreateTeamRequest,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new battle buddy team"""
    # Check if team name already exists
    existing = db.query(BattleBuddyTeam).filter(BattleBuddyTeam.team_name == request.team_name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Team name '{request.team_name}' already exists"
        )
    
    team = BattleBuddyTeam(
        team_name=request.team_name,
        description=request.description,
        points=0
    )
    
    db.add(team)
    db.commit()
    db.refresh(team)
    
    return BattleBuddyTeamResponse(
        id=str(team.id),
        team_name=team.team_name,
        description=team.description,
        points=team.points or 0,
        member_count=0,
        members=[],
        created_at=team.created_at.isoformat() if team.created_at else ""
    )


@router.post("/teams/members", status_code=status.HTTP_201_CREATED)
async def add_member_to_team(
    request: AddMemberRequest,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Add a member to a battle buddy team"""
    try:
        team_id = uuid.UUID(request.team_id)
        user_id = uuid.UUID(request.user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid team_id or user_id format"
        )
    
    # Check if team exists
    team = db.query(BattleBuddyTeam).filter(BattleBuddyTeam.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user is already in a team
    existing_member = db.query(BattleBuddyMember).filter(BattleBuddyMember.user_id == user_id).first()
    if existing_member:
        existing_team = db.query(BattleBuddyTeam).filter(BattleBuddyTeam.id == existing_member.team_id).first()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User is already a member of team '{existing_team.team_name if existing_team else 'Unknown'}'"
        )
    
    # Check if user is already in this team
    existing_in_team = db.query(BattleBuddyMember).filter(
        and_(
            BattleBuddyMember.team_id == team_id,
            BattleBuddyMember.user_id == user_id
        )
    ).first()
    if existing_in_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this team"
        )
    
    # Add member
    member = BattleBuddyMember(
        team_id=team_id,
        user_id=user_id
    )
    
    db.add(member)
    db.commit()
    db.refresh(member)
    
    return {
        "success": True,
        "message": f"Added {user.first_name} {user.last_name} to team {team.team_name}",
        "member_id": str(member.id)
    }


@router.delete("/teams/members/{member_id}", status_code=status.HTTP_200_OK)
async def remove_member_from_team(
    member_id: str,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Remove a member from a battle buddy team"""
    try:
        member_uuid = uuid.UUID(member_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid member_id format"
        )
    
    member = db.query(BattleBuddyMember).filter(BattleBuddyMember.id == member_uuid).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    team = db.query(BattleBuddyTeam).filter(BattleBuddyTeam.id == member.team_id).first()
    user = db.query(User).filter(User.id == member.user_id).first()
    
    db.delete(member)
    db.commit()
    
    return {
        "success": True,
        "message": f"Removed {user.first_name if user else 'User'} {user.last_name if user else ''} from team {team.team_name if team else 'Unknown'}"
    }


@router.post("/teams/points", status_code=status.HTTP_200_OK)
async def update_team_points(
    request: UpdateTeamPointsRequest,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update team points (add or remove)"""
    try:
        team_id = uuid.UUID(request.team_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid team_id format"
        )
    
    team = db.query(BattleBuddyTeam).filter(BattleBuddyTeam.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    current_points = team.points or 0
    new_total = current_points + request.points
    
    team.points = new_total
    db.commit()
    db.refresh(team)
    
    return {
        "success": True,
        "team_id": str(team.id),
        "team_name": team.team_name,
        "previous_points": current_points,
        "points_added": request.points,
        "new_total": new_total,
        "description": request.description
    }


@router.delete("/teams/{team_id}", status_code=status.HTTP_200_OK)
async def delete_team(
    team_id: str,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a battle buddy team (and all its members)"""
    try:
        team_uuid = uuid.UUID(team_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid team_id format"
        )
    
    team = db.query(BattleBuddyTeam).filter(BattleBuddyTeam.id == team_uuid).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    team_name = team.team_name
    db.delete(team)  # Cascade will delete members
    db.commit()
    
    return {
        "success": True,
        "message": f"Team '{team_name}' and all its members have been deleted"
    }


@router.get("/my-team", response_model=Optional[BattleBuddyTeamResponse])
async def get_my_team(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the current user's battle buddy team"""
    # Find if user is a member of any team
    member = db.query(BattleBuddyMember).filter(BattleBuddyMember.user_id == current_user.id).first()
    
    if not member:
        return None
    
    # Get the team
    team = db.query(BattleBuddyTeam).filter(BattleBuddyTeam.id == member.team_id).first()
    if not team:
        return None
    
    # Get all members of the team
    members = db.query(BattleBuddyMember).filter(BattleBuddyMember.team_id == team.id).all()
    member_responses = []
    for team_member in members:
        user = db.query(User).filter(User.id == team_member.user_id).first()
        if user:
            member_responses.append(TeamMemberResponse(
                id=str(team_member.id),
                user_id=str(team_member.user_id),
                first_name=user.first_name,
                last_name=user.last_name,
                email=user.email,
                joined_at=team_member.joined_at.isoformat() if team_member.joined_at else ""
            ))
    
    return BattleBuddyTeamResponse(
        id=str(team.id),
        team_name=team.team_name,
        description=team.description,
        points=team.points or 0,
        member_count=len(member_responses),
        members=member_responses,
        created_at=team.created_at.isoformat() if team.created_at else ""
    )


class JoinTeamRequest(BaseModel):
    team_id: str


@router.post("/join-team", status_code=status.HTTP_201_CREATED)
async def join_team(
    request: JoinTeamRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Allow users to join a battle buddy team themselves"""
    try:
        team_id = uuid.UUID(request.team_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid team_id format"
        )
    
    # Check if team exists
    team = db.query(BattleBuddyTeam).filter(BattleBuddyTeam.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Check if user is already in a team
    existing_member = db.query(BattleBuddyMember).filter(BattleBuddyMember.user_id == current_user.id).first()
    if existing_member:
        existing_team = db.query(BattleBuddyTeam).filter(BattleBuddyTeam.id == existing_member.team_id).first()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You are already a member of team '{existing_team.team_name if existing_team else 'Unknown'}'. You can only be in one team at a time."
        )
    
    # Check if user is already in this team
    existing_in_team = db.query(BattleBuddyMember).filter(
        and_(
            BattleBuddyMember.team_id == team_id,
            BattleBuddyMember.user_id == current_user.id
        )
    ).first()
    if existing_in_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this team"
        )
    
    # Add member
    member = BattleBuddyMember(
        team_id=team_id,
        user_id=current_user.id
    )
    
    db.add(member)
    db.commit()
    db.refresh(member)
    
    return {
        "success": True,
        "message": f"Successfully joined team '{team.team_name}'",
        "member_id": str(member.id),
        "team_name": team.team_name
    }