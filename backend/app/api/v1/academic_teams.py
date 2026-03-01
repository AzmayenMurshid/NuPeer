"""
Academic Teams API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func
from pydantic import BaseModel
from typing import Optional, List
import uuid
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.academic_team import AcademicTeam, AcademicTeamMember

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


class AcademicTeamResponse(BaseModel):
    id: str
    team_name: str
    description: Optional[str]
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


@router.get("/teams", response_model=List[AcademicTeamResponse])
async def get_all_teams(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all academic teams - Optimized with joinedload to avoid N+1 queries"""
    # Optimized: Use joinedload to batch load members and users in single query (O(n) instead of O(n*m))
    teams = (
        db.query(AcademicTeam)
        .options(joinedload(AcademicTeam.members).joinedload(AcademicTeamMember.user))
        .order_by(AcademicTeam.team_name)
        .all()
    )
    
    result = []
    for team in teams:
        member_responses = []
        for member in team.members:
            if member.user:
                member_responses.append(TeamMemberResponse(
                    id=str(member.id),
                    user_id=str(member.user_id),
                    first_name=member.user.first_name,
                    last_name=member.user.last_name,
                    email=member.user.email,
                    joined_at=member.joined_at.isoformat() if member.joined_at else ""
                ))
        
        result.append(AcademicTeamResponse(
            id=str(team.id),
            team_name=team.team_name,
            description=team.description,
            member_count=len(member_responses),
            members=member_responses,
            created_at=team.created_at.isoformat() if team.created_at else ""
        ))
    
    return result


@router.post("/teams", response_model=AcademicTeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    request: CreateTeamRequest,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new academic team"""
    # Check if team name already exists
    existing = db.query(AcademicTeam).filter(AcademicTeam.team_name == request.team_name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Team name '{request.team_name}' already exists"
        )
    
    team = AcademicTeam(
        team_name=request.team_name,
        description=request.description
    )
    
    db.add(team)
    db.commit()
    db.refresh(team)
    
    return AcademicTeamResponse(
        id=str(team.id),
        team_name=team.team_name,
        description=team.description,
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
    """Add a member to an academic team"""
    try:
        team_id = uuid.UUID(request.team_id)
        user_id = uuid.UUID(request.user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid team_id or user_id format"
        )
    
    # Check if team exists
    team = db.query(AcademicTeam).filter(AcademicTeam.id == team_id).first()
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
    
    # Check if user is already in a team (users can only be in one team at a time)
    existing_member = db.query(AcademicTeamMember).filter(AcademicTeamMember.user_id == user_id).first()
    if existing_member:
        existing_team = db.query(AcademicTeam).filter(AcademicTeam.id == existing_member.team_id).first()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User is already a member of team '{existing_team.team_name if existing_team else 'Unknown'}'. Users can only be in one team at a time."
        )
    
    # Check if user is already in this team (redundant check, but good for clarity)
    existing_in_team = db.query(AcademicTeamMember).filter(
        and_(
            AcademicTeamMember.team_id == team_id,
            AcademicTeamMember.user_id == user_id
        )
    ).first()
    if existing_in_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this team"
        )
    
    # Add member
    member = AcademicTeamMember(
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
    """Remove a member from an academic team"""
    try:
        member_uuid = uuid.UUID(member_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid member_id format"
        )
    
    member = db.query(AcademicTeamMember).filter(AcademicTeamMember.id == member_uuid).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    team = db.query(AcademicTeam).filter(AcademicTeam.id == member.team_id).first()
    user = db.query(User).filter(User.id == member.user_id).first()
    
    db.delete(member)
    db.commit()
    
    return {
        "success": True,
        "message": f"Removed {user.first_name if user else 'User'} {user.last_name if user else ''} from team {team.team_name if team else 'Unknown'}"
    }


@router.delete("/teams/{team_id}", status_code=status.HTTP_200_OK)
async def delete_team(
    team_id: str,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Delete an academic team (and all its members)"""
    try:
        team_uuid = uuid.UUID(team_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid team_id format"
        )
    
    team = db.query(AcademicTeam).filter(AcademicTeam.id == team_uuid).first()
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

