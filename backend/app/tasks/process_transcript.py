"""
Celery task for processing transcripts
"""
from celery import Celery
from sqlalchemy import func
from app.core.config import settings
from app.core.database import SessionLocal
from app.core.storage import storage_service
from app.services.pdf_processor import pdf_processor
from app.models.transcript import Transcript
from app.models.course import Course
import uuid

celery_app = Celery(
    "nupeer",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)


@celery_app.task(name="process_transcript")
def process_transcript_task(transcript_id: str, user_id: str):
    """
    Background task to process transcript PDF
    """
    db = SessionLocal()
    try:
        # Get transcript
        transcript = db.query(Transcript).filter(Transcript.id == uuid.UUID(transcript_id)).first()
        if not transcript:
            return {"status": "error", "message": "Transcript not found"}
        
        # Update status to processing
        transcript.processing_status = "processing"
        db.commit()
        
        # Download PDF from storage
        pdf_content = storage_service.download_file(transcript.file_path)
        if not pdf_content:
            transcript.processing_status = "failed"
            transcript.error_message = "Failed to download file from storage"
            db.commit()
            return {"status": "error", "message": "Failed to download file"}
        
        # Process PDF
        try:
            courses_data = pdf_processor.process_transcript(pdf_content)
            
            # Save courses to database
            for course_data in courses_data:
                course = Course(
                    user_id=uuid.UUID(user_id),
                    transcript_id=transcript.id,
                    **course_data
                )
                db.add(course)
            
            # Update transcript status
            transcript.processing_status = "completed"
            transcript.processed_at = db.query(func.now()).scalar()
            db.commit()
            
            return {
                "status": "success",
                "transcript_id": transcript_id,
                "courses_count": len(courses_data)
            }
        
        except Exception as e:
            transcript.processing_status = "failed"
            transcript.error_message = str(e)
            db.commit()
            return {"status": "error", "message": str(e)}
    
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

