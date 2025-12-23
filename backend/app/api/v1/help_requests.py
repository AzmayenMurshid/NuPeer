"""
Help Request endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.models.help_request import HelpRequest
from app.models.user import User
from app.api.v1.auth import get_current_user

router = APIRouter()


class HelpRequestCreate(BaseModel):
    course_code: str
    course_name: str = None


class HelpRequestResponse(BaseModel):
    id: str
    course_code: str
    course_name: str = None
    status: str
    created_at: str
    
    class Config:
        from_attributes = True


@router.post("", response_model=HelpRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_help_request(
    request_data: HelpRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new help request"""
    help_request = HelpRequest(
        requester_id=current_user.id,
        course_code=request_data.course_code,
        course_name=request_data.course_name,
        status="active"
    )
    
    db.add(help_request)
    db.commit()
    db.refresh(help_request)
    
    return help_request


@router.get("", response_model=List[HelpRequestResponse])
async def list_help_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List user's help requests"""
    requests = db.query(HelpRequest).filter(
        HelpRequest.requester_id == current_user.id
    ).order_by(desc(HelpRequest.created_at)).all()
    
    return requests


@router.get("/{request_id}", response_model=HelpRequestResponse)
async def get_help_request(
    request_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get help request details"""
    help_request = db.query(HelpRequest).filter(
        HelpRequest.id == request_id,
        HelpRequest.requester_id == current_user.id
    ).first()
    
    if not help_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Help request not found"
        )
    
    return help_request


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_help_request(
    request_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a help request"""
    help_request = db.query(HelpRequest).filter(
        HelpRequest.id == request_id,
        HelpRequest.requester_id == current_user.id
    ).first()
    
    if not help_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Help request not found"
        )
    
    help_request.status = "cancelled"
    db.commit()
    
    return None

