"""
Transcript endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.core.storage import storage_service
from app.core.config import settings
from app.models.transcript import Transcript
from app.models.user import User
from app.api.v1.auth import get_current_user
from app.tasks.process_transcript import process_transcript_task

router = APIRouter()


class TranscriptResponse(BaseModel):
    id: str
    file_name: str
    file_size: int = None
    upload_date: str
    processing_status: str
    processed_at: str = None
    error_message: str = None
    
    class Config:
        from_attributes = True


@router.post("/upload", response_model=TranscriptResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_transcript(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a transcript PDF"""
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed"
        )
    
    # Read file content
    content = await file.read()
    file_size = len(content)
    
    # Validate file size
    if file_size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum of {settings.MAX_UPLOAD_SIZE / 1024 / 1024}MB"
        )
    
    # Upload to object storage
    try:
        file_path = storage_service.upload_file(
            content,
            str(current_user.id),
            file.filename
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )
    
    # Create transcript record
    transcript = Transcript(
        user_id=current_user.id,
        file_path=file_path,
        file_name=file.filename,
        file_size=file_size,
        processing_status="pending"
    )
    
    db.add(transcript)
    db.commit()
    db.refresh(transcript)
    
    # Queue processing task
    process_transcript_task.delay(str(transcript.id), str(current_user.id))
    
    return transcript


@router.get("", response_model=List[TranscriptResponse])
async def list_transcripts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List user's transcripts"""
    transcripts = db.query(Transcript).filter(
        Transcript.user_id == current_user.id
    ).order_by(desc(Transcript.upload_date)).all()
    
    return transcripts


@router.get("/{transcript_id}", response_model=TranscriptResponse)
async def get_transcript(
    transcript_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get transcript details"""
    transcript = db.query(Transcript).filter(
        Transcript.id == transcript_id,
        Transcript.user_id == current_user.id
    ).first()
    
    if not transcript:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcript not found"
        )
    
    return transcript


@router.get("/{transcript_id}/status", response_model=TranscriptResponse)
async def get_transcript_status(
    transcript_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get transcript processing status"""
    return await get_transcript(transcript_id, current_user, db)


@router.delete("/{transcript_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transcript(
    transcript_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a transcript"""
    transcript = db.query(Transcript).filter(
        Transcript.id == transcript_id,
        Transcript.user_id == current_user.id
    ).first()
    
    if not transcript:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcript not found"
        )
    
    # Delete from storage
    storage_service.delete_file(transcript.file_path)
    
    # Delete from database (cascade will delete courses)
    db.delete(transcript)
    db.commit()
    
    return None

