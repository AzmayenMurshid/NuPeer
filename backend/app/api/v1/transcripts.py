"""
Transcript endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import datetime, timedelta
from uuid import UUID
from app.core.database import get_db
from app.core.storage import storage_service
from app.core.config import settings
from app.models.transcript import Transcript
from app.models.user import User
from app.api.v1.auth import get_current_user
from app.tasks.process_transcript import process_transcript_task, _process_transcript_internal
from sqlalchemy import func

router = APIRouter()


class TranscriptResponse(BaseModel):
    id: str
    file_name: str
    file_size: Optional[int] = None
    upload_date: str
    processing_status: str
    processed_at: Optional[str] = None
    error_message: Optional[str] = None
    
    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        """Convert UUID to string if needed"""
        if v is not None:
            return str(v)
        return v
    
    @field_validator('upload_date', 'processed_at', mode='before')
    @classmethod
    def convert_datetime_to_str(cls, v):
        """Convert datetime to ISO format string if needed"""
        if v is None:
            return None
        if isinstance(v, datetime):
            return v.isoformat()
        return v
    
    @field_validator('error_message', mode='before')
    @classmethod
    def convert_none_to_str(cls, v):
        """Handle None values for error_message"""
        if v is None:
            return None
        return str(v) if not isinstance(v, str) else v
    
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
    
    # Delete previous transcripts for this user (overwrite with latest)
    existing_transcripts = db.query(Transcript).filter(
        Transcript.user_id == current_user.id
    ).all()
    
    if existing_transcripts:
        print(f"Deleting {len(existing_transcripts)} previous transcript(s) for user {current_user.id}")
        for old_transcript in existing_transcripts:
            try:
                # Delete from storage
                storage_service.delete_file(old_transcript.file_path)
            except Exception as storage_error:
                # Log but don't fail if storage deletion fails
                print(f"Warning: Could not delete old transcript file from storage: {storage_error}")
            
            # Delete from database (cascade will delete associated courses)
            db.delete(old_transcript)
        
        db.commit()
        print("Previous transcripts deleted successfully")
    
    # Upload to object storage
    try:
        file_path = storage_service.upload_file(
            content,
            str(current_user.id),
            file.filename
        )
    except ConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )
    except Exception as e:
        # Log the full error for debugging
        import traceback
        error_details = traceback.format_exc()
        print(f"Upload error: {error_details}")
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
    
    # Process transcript (try Celery first, fallback to synchronous)
    # Check if Redis is available before trying Celery
    celery_available = False
    try:
        # Quick check if Redis is available
        import redis as redis_client
        redis_url = settings.REDIS_URL
        # Parse Redis URL (format: redis://localhost:6379/0)
        if redis_url.startswith('redis://'):
            redis_url = redis_url.replace('redis://', '')
        host_port = redis_url.split('/')[0]
        if ':' in host_port:
            host, port = host_port.split(':')
            port = int(port)
        else:
            host = host_port
            port = 6379
        
        # Try to connect to Redis
        r = redis_client.Redis(host=host, port=port, socket_connect_timeout=1)
        r.ping()
        r.close()
        
        # Redis is available, try Celery
        try:
            process_transcript_task.delay(str(transcript.id), str(current_user.id))
            celery_available = True
            print(f"Transcript processing queued successfully (Celery)")
        except Exception as celery_error:
            print(f"Warning: Could not queue Celery task: {celery_error}")
            celery_available = False
    except Exception as redis_error:
        # Redis is not available, skip Celery
        print(f"Redis not available ({redis_error}), processing synchronously...")
        celery_available = False
    
    # Always process synchronously if Celery is not available
    # This ensures transcripts are processed even when Redis/Celery is down
    if not celery_available:
        try:
            # Call the internal processing function directly (synchronous execution)
            print(f"Processing transcript {transcript.id} synchronously...")
            result = _process_transcript_internal(str(transcript.id), str(current_user.id))
            print(f"Transcript processed synchronously: {result.get('status', 'unknown')}")
            # Refresh transcript to get updated status from the processing function
            db.refresh(transcript)
        except Exception as sync_error:
            # If synchronous processing also fails, log but don't fail the upload
            import traceback
            error_trace = traceback.format_exc()
            print(f"Error: Synchronous processing also failed: {sync_error}")
            print(f"Traceback: {error_trace}")
            # Update transcript status to failed
            transcript.processing_status = "failed"
            transcript.error_message = f"Synchronous processing failed: {str(sync_error)}"
            db.commit()
            db.refresh(transcript)
            print("Transcript uploaded but processing failed. Use manual processing endpoint to retry.")
    
    return transcript


def _cleanup_stale_transcripts(db: Session, user_id: UUID):
    """
    Mark transcripts as failed if they've been pending/processing for too long
    """
    now = datetime.now()
    pending_timeout = timedelta(minutes=settings.TRANSCRIPT_PENDING_TIMEOUT_MINUTES)
    processing_timeout = timedelta(minutes=settings.TRANSCRIPT_PROCESSING_TIMEOUT_MINUTES)
    
    # Find stale pending transcripts
    stale_pending = db.query(Transcript).filter(
        Transcript.user_id == user_id,
        Transcript.processing_status == "pending",
        Transcript.upload_date < now - pending_timeout
    ).all()
    
    for transcript in stale_pending:
        transcript.processing_status = "failed"
        transcript.error_message = f"Transcript processing timed out after {settings.TRANSCRIPT_PENDING_TIMEOUT_MINUTES} minutes in pending status"
        transcript.processed_at = db.query(func.now()).scalar()
        print(f"Marked stale pending transcript {transcript.id} as failed (pending for too long)")
    
    # Find stale processing transcripts
    stale_processing = db.query(Transcript).filter(
        Transcript.user_id == user_id,
        Transcript.processing_status == "processing"
    ).all()
    
    for transcript in stale_processing:
        # Check if processed_at exists and use it, otherwise use upload_date
        start_time = transcript.processed_at if transcript.processed_at else transcript.upload_date
        if start_time < now - processing_timeout:
            transcript.processing_status = "failed"
            transcript.error_message = f"Transcript processing timed out after {settings.TRANSCRIPT_PROCESSING_TIMEOUT_MINUTES} minutes in processing status"
            transcript.processed_at = db.query(func.now()).scalar()
            print(f"Marked stale processing transcript {transcript.id} as failed (processing for too long)")
    
    if stale_pending or stale_processing:
        db.commit()


@router.get("", response_model=List[TranscriptResponse])
async def list_transcripts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List user's transcripts"""
    # Clean up stale pending/processing transcripts before listing
    _cleanup_stale_transcripts(db, current_user.id)
    
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
    # Clean up stale transcripts for this user first
    _cleanup_stale_transcripts(db, current_user.id)
    
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


@router.post("/{transcript_id}/process", status_code=status.HTTP_202_ACCEPTED)
async def process_transcript_manual(
    transcript_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually trigger transcript processing (useful if Celery is not running)"""
    transcript = db.query(Transcript).filter(
        Transcript.id == transcript_id,
        Transcript.user_id == current_user.id
    ).first()
    
    if not transcript:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcript not found"
        )
    
    # Try Celery first
    try:
        process_transcript_task.delay(str(transcript.id), str(current_user.id))
        return {"message": "Processing queued successfully", "transcript_id": str(transcript_id)}
    except Exception as celery_error:
        # If Celery fails, process synchronously (call the internal function directly)
        print(f"Warning: Could not queue Celery task: {celery_error}")
        print("Falling back to synchronous processing...")
        try:
            result = _process_transcript_internal(str(transcript.id), str(current_user.id))
            # Refresh transcript to get updated status
            db.refresh(transcript)
            return result
        except Exception as sync_error:
            import traceback
            error_trace = traceback.format_exc()
            print(f"Error: Synchronous processing failed: {sync_error}")
            print(f"Traceback: {error_trace}")
            # Update transcript status to failed
            transcript.processing_status = "failed"
            transcript.error_message = f"Synchronous processing failed: {str(sync_error)}\n{error_trace}"
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to process transcript: {str(sync_error)}"
            )


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

