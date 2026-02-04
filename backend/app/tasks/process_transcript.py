"""
Celery task for processing transcripts
"""
from celery import Celery
from sqlalchemy import func
from datetime import datetime, timedelta
from app.core.config import settings
from app.core.database import SessionLocal
from app.services.pdf_processor import pdf_processor
from app.models.transcript import Transcript
from app.models.course import Course
import uuid
from typing import Optional

celery_app = Celery(
    "nupeer",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

# Configure Celery to use pickle serializer for binary data (PDF content)
celery_app.conf.update(
    task_serializer='pickle',
    accept_content=['pickle', 'json'],
    result_serializer='pickle',
    result_accept_content=['pickle', 'json']
)


def _process_transcript_internal(transcript_id: str, user_id: str, pdf_content: Optional[bytes] = None):
    """
    Internal function to process transcript PDF
    This can be called directly or via Celery task
    
    Args:
        transcript_id: UUID of the transcript record
        user_id: UUID of the user
        pdf_content: PDF file content as bytes (optional, will be read from database if not provided)
    """
    db = SessionLocal()
    try:
        # Get transcript
        transcript = db.query(Transcript).filter(Transcript.id == uuid.UUID(transcript_id)).first()
        if not transcript:
            return {"status": "error", "message": "Transcript not found"}
        
        # Get PDF content from database if not provided
        if pdf_content is None:
            if transcript.pdf_content is None:
                transcript.processing_status = "failed"
                transcript.error_message = "PDF content not found in database"
                db.commit()
                return {"status": "error", "message": "PDF content not found in database"}
            pdf_content = bytes(transcript.pdf_content)  # Convert BYTEA to bytes
        
        # Validate PDF content
        if not pdf_content or len(pdf_content) == 0:
            transcript.processing_status = "failed"
            transcript.error_message = "PDF content is empty"
            db.commit()
            return {"status": "error", "message": "PDF content is empty"}
        
        # Check if transcript has been pending for too long
        if transcript.processing_status == "pending":
            now = datetime.now(transcript.upload_date.tzinfo) if transcript.upload_date.tzinfo else datetime.now()
            time_since_upload = now - transcript.upload_date
            timeout_minutes = settings.TRANSCRIPT_PENDING_TIMEOUT_MINUTES
            if time_since_upload > timedelta(minutes=timeout_minutes):
                transcript.processing_status = "failed"
                transcript.error_message = f"Transcript processing timed out after {timeout_minutes} minutes in pending status"
                transcript.processed_at = db.query(func.now()).scalar()
                db.commit()
                return {"status": "error", "message": "Transcript processing timed out"}
        
        # Check if transcript has been processing for too long
        if transcript.processing_status == "processing":
            # If there's no processed_at, use upload_date as fallback
            start_time = transcript.processed_at if transcript.processed_at else transcript.upload_date
            now = datetime.now(start_time.tzinfo) if start_time.tzinfo else datetime.now()
            time_since_start = now - start_time
            timeout_minutes = settings.TRANSCRIPT_PROCESSING_TIMEOUT_MINUTES
            if time_since_start > timedelta(minutes=timeout_minutes):
                transcript.processing_status = "failed"
                transcript.error_message = f"Transcript processing timed out after {timeout_minutes} minutes in processing status"
                transcript.processed_at = db.query(func.now()).scalar()
                db.commit()
                return {"status": "error", "message": "Transcript processing timed out"}
        
        # Update status to processing
        transcript.processing_status = "processing"
        db.commit()
        
        # Process PDF
        try:
            courses_data = pdf_processor.process_transcript(pdf_content)
            
            if not courses_data:
                transcript.processing_status = "failed"
                transcript.error_message = "No courses found in transcript"
                db.commit()
                return {"status": "error", "message": "No courses found in transcript"}
            
            # Save courses to database
            courses_saved = 0
            courses_skipped = 0
            errors = []
            
            print(f"Processing {len(courses_data)} courses extracted from transcript...")
            
            for course_data in courses_data:
                try:
                    # Validate ALL required fields: course_code, course_name, attempted_credits, earned_credits, grade, points
                    course_code = course_data.get('course_code')
                    course_name = course_data.get('course_name')
                    attempted_credits = course_data.get('attempted_credits')
                    earned_credits = course_data.get('credit_hours')  # credit_hours is set to earned_credits in parser
                    grade = course_data.get('grade')
                    points = course_data.get('points')
                    
                    # Skip if any required field is missing
                    if not course_code:
                        errors.append(f"Course missing course_code, skipping")
                        courses_skipped += 1
                        continue
                    
                    if not course_name:
                        errors.append(f"Course {course_code} missing course_name (description), skipping")
                        courses_skipped += 1
                        continue
                    
                    if attempted_credits is None:
                        errors.append(f"Course {course_code} missing attempted_credits, skipping")
                        courses_skipped += 1
                        continue
                    
                    if earned_credits is None:
                        errors.append(f"Course {course_code} missing earned_credits, skipping")
                        courses_skipped += 1
                        continue
                    
                    if not grade or not grade[0].isalpha():
                        errors.append(f"Course {course_code} missing valid letter grade, skipping")
                        courses_skipped += 1
                        continue
                    
                    if points is None:
                        errors.append(f"Course {course_code} missing points, skipping")
                        courses_skipped += 1
                        continue
                    
                    # Check if course already exists (handle duplicates and update current courses)
                    # First, try exact match (course_code, semester, year)
                    existing_course = db.query(Course).filter(
                        Course.user_id == uuid.UUID(user_id),
                        Course.course_code == course_code,
                        Course.semester == course_data.get('semester'),
                        Course.year == course_data.get('year')
                    ).first()
                    
                    # If no exact match, try to find a "current" course (transcript_id is None) with matching course_code
                    # This handles cases where semester/year might not match exactly
                    # However, we should NOT automatically update manually-added courses to avoid overwriting user data
                    # Instead, we'll create a new course entry for the transcript version
                    if not existing_course:
                        existing_current_course = db.query(Course).filter(
                            Course.user_id == uuid.UUID(user_id),
                            Course.course_code == course_code,
                            Course.transcript_id.is_(None)  # Only match "current" courses
                        ).first()
                        if existing_current_course:
                            # Found a manually-added course with the same code
                            # Don't overwrite it - create a separate entry for the transcript version
                            # This preserves the user's manually entered data
                            print(f"Found manually-added course {course_code}, creating separate transcript entry to preserve user data")
                            # Continue to create new course below
                    
                    if existing_course:
                        # If existing course has a transcript_id, it's a duplicate from another transcript - skip it
                        if existing_course.transcript_id is not None:
                            print(f"Skipping duplicate course: {course_code} (semester: {course_data.get('semester')}, year: {course_data.get('year')})")
                            courses_skipped += 1
                            continue
                        # If existing course has no transcript_id, it's a manually-added "current" course
                        # We should NOT overwrite it - instead, create a new entry for the transcript version
                        # This preserves the user's manually entered semester/year data
                        print(f"Found manually-added course {course_code}, creating separate transcript entry to preserve user data")
                        # Continue to create new course below
                    
                    # Create new course
                    # Truncate course_name if excessively long (though Text column has no hard limit)
                    # We still truncate very long names to prevent issues and improve data quality
                    if course_name and len(course_name) > 500:
                        # Truncate at word boundary if possible
                        truncated = course_name[:497]
                        last_space = truncated.rfind(' ')
                        if last_space > 400:  # Only use if we found a reasonable break point
                            course_name = course_name[:last_space] + '...'
                        else:
                            course_name = truncated + '...'
                    
                    # Ensure grade_score is calculated (needed for analytics)
                    grade_score = course_data.get('grade_score')
                    if grade_score is None and grade:
                        # Fallback: calculate from grade using PDF processor's grade mapping
                        from app.services.pdf_processor import pdf_processor
                        grade_score = pdf_processor._grade_to_score(grade)
                    
                    # Create Course object with all extracted data
                    course = Course(
                        user_id=uuid.UUID(user_id),
                        transcript_id=transcript.id,
                        course_code=course_code,
                        course_name=course_name,
                        grade=grade,
                        grade_score=grade_score,  # Always set (calculated if missing)
                        credit_hours=earned_credits,  # Use earned_credits as credit_hours
                        points=points,  # Store points from transcript
                        semester=course_data.get('semester'),
                        year=course_data.get('year')
                    )
                    db.add(course)
                    courses_saved += 1
                    
                    # Log successful course addition
                    print(f"Added course: {course_code} - {course_name or 'No name'} | Grade: {grade} | Credits: {course_data.get('credit_hours')} | Semester: {course_data.get('semester')} | Year: {course_data.get('year')}")
                    
                except Exception as course_error:
                    error_msg = f"Error saving course {course_data.get('course_code', 'unknown')}: {str(course_error)}"
                    errors.append(error_msg)
                    print(f"ERROR: {error_msg}")
                    continue
            
            # Commit all courses at once
            try:
                db.commit()
                print(f"Successfully committed {courses_saved} courses to database")
            except Exception as commit_error:
                db.rollback()
                transcript.processing_status = "failed"
                transcript.error_message = f"Database error: {str(commit_error)}"
                db.commit()
                print(f"ERROR: Failed to commit courses to database: {str(commit_error)}")
                return {"status": "error", "message": f"Failed to save courses: {str(commit_error)}"}
            
            # Update transcript status
            transcript.processing_status = "completed"
            transcript.processed_at = db.query(func.now()).scalar()
            if errors:
                transcript.error_message = f"Some courses had errors: {'; '.join(errors)}"
            db.commit()
            
            # Log summary with detailed information
            print(f"\n=== Transcript Processing Summary ===")
            print(f"Transcript ID: {transcript_id}")
            print(f"User ID: {user_id}")
            print(f"Total courses found in PDF: {len(courses_data)}")
            print(f"Courses saved to database: {courses_saved}")
            print(f"Courses skipped (duplicates): {courses_skipped}")
            if courses_saved > 0:
                print(f"✅ Successfully parsed and saved {courses_saved} courses to PostgreSQL")
                print(f"   Courses are now available for analytics")
            if errors:
                print(f"⚠️  Errors encountered: {len(errors)}")
                for error in errors[:5]:  # Show first 5 errors
                    print(f"  - {error}")
                if len(errors) > 5:
                    print(f"  ... and {len(errors) - 5} more errors")
            print(f"=====================================\n")
            
            return {
                "status": "success",
                "transcript_id": transcript_id,
                "courses_found": len(courses_data),
                "courses_saved": courses_saved,
                "courses_skipped": courses_skipped,
                "errors": errors if errors else None
            }
        
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            transcript.processing_status = "failed"
            transcript.error_message = f"{str(e)}\n{error_trace}"
            db.commit()
            return {"status": "error", "message": str(e)}
    
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@celery_app.task(name="process_transcript")
def process_transcript_task(transcript_id: str, user_id: str):
    """
    Celery task wrapper for processing transcript PDF
    PDF content is read from the database
    
    Args:
        transcript_id: UUID of the transcript record
        user_id: UUID of the user
    """
    return _process_transcript_internal(transcript_id, user_id)

