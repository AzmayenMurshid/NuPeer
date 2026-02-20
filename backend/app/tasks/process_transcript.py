"""
Celery task for processing transcripts
"""
from celery import Celery
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta
from app.core.config import settings
from app.core.database import SessionLocal
from app.services.pdf_processor import pdf_processor
from app.models.transcript import Transcript
from app.models.course import Course
import uuid
from typing import Optional

# Try to import psycopg2 errors for better error handling
try:
    from psycopg2.errors import UniqueViolation
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False
    UniqueViolation = None

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
            courses_processed_count = 0  # Counter for courses processed (attempted to save)
            errors = []
            
            print(f"\n[Processor] Starting to process {len(courses_data)} courses extracted from transcript...")
            print(f"[Processor] Course processing will be tracked with increment counters\n")
            
            # OPTIMIZATION: Fetch all existing courses for this user in ONE query instead of per-course queries
            # This reduces database round trips from O(n) to O(1)
            print(f"[Processor] Fetching existing courses for user {user_id}...")
            existing_courses_query = db.query(Course).filter(
                Course.user_id == uuid.UUID(user_id)
            ).all()
            
            # Build in-memory lookup sets for O(1) duplicate checking
            # Key format: (course_code, semester, year)
            existing_courses_set = {
                (course.course_code, course.semester, course.year): course
                for course in existing_courses_query
            }
            
            # Track courses from the same transcript being processed
            same_transcript_courses = {
                (course.course_code, course.semester, course.year)
                for course in existing_courses_query
                if course.transcript_id == transcript.id
            }
            
            print(f"[Processor] Found {len(existing_courses_set)} existing courses. Using in-memory lookup for duplicate detection.")
            
            # Batch commit configuration
            BATCH_SIZE = 50  # Commit every 50 courses instead of every course
            courses_to_insert = []
            
            for course_data in courses_data:
                courses_processed_count += 1
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
                    
                    # OPTIMIZATION: Use in-memory set lookup instead of database query (O(1) vs O(n) database queries)
                    course_key = (course_code, course_data.get('semester'), course_data.get('year'))
                    
                    # Check if course already exists using in-memory lookup
                    existing_course = existing_courses_set.get(course_key)
                    
                    # If exact match exists, skip it (regardless of transcript_id)
                    # The unique constraint prevents duplicates on (user_id, course_code, semester, year)
                    if existing_course:
                        # Check if it's from the same transcript (re-processing the same transcript)
                        if existing_course.transcript_id == transcript.id:
                            print(f"[Processor] Course #{courses_processed_count}/{len(courses_data)} SKIPPED (duplicate from same transcript): {course_code} (semester: {course_data.get('semester')}, year: {course_data.get('year')})")
                        elif existing_course.transcript_id is None:
                            print(f"[Processor] Course #{courses_processed_count}/{len(courses_data)} SKIPPED (matches manually-added course): {course_code} (semester: {course_data.get('semester')}, year: {course_data.get('year')})")
                        else:
                            print(f"[Processor] Course #{courses_processed_count}/{len(courses_data)} SKIPPED (duplicate from another transcript): {course_code} (semester: {course_data.get('semester')}, year: {course_data.get('year')})")
                        courses_skipped += 1
                        continue
                    
                    # Also check if this exact course was already added in this batch (same transcript processing)
                    if course_key in same_transcript_courses:
                        print(f"[Processor] Course #{courses_processed_count}/{len(courses_data)} SKIPPED (already in same transcript): {course_code} (semester: {course_data.get('semester')}, year: {course_data.get('year')})")
                        courses_skipped += 1
                        continue
                    
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
                        # pdf_processor is already imported at the top of the file
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
                    
                    # OPTIMIZATION: Batch courses for bulk insert instead of individual commits
                    courses_to_insert.append(course)
                    same_transcript_courses.add(course_key)  # Track in batch to avoid duplicates
                    
                    # Log course queued for batch insert
                    if courses_processed_count % 10 == 0 or courses_processed_count == len(courses_data):
                        print(f"[Processor] Course #{courses_processed_count}/{len(courses_data)} QUEUED: {course_code} - {course_name or 'No name'} | Grade: {grade} | Credits: {course_data.get('credit_hours')} | Semester: {course_data.get('semester')} | Year: {course_data.get('year')}")
                    
                    # Commit in batches for better performance
                    if len(courses_to_insert) >= BATCH_SIZE:
                        try:
                            db.bulk_save_objects(courses_to_insert)
                            db.commit()
                            batch_saved = len(courses_to_insert)
                            courses_saved += batch_saved
                            print(f"[Processor] Batch commit: {batch_saved} courses saved (total: {courses_saved})")
                            courses_to_insert = []
                        except IntegrityError as batch_error:
                            # If batch fails, fall back to individual inserts for this batch
                            db.rollback()
                            print(f"[Processor] Batch commit failed, processing individually...")
                            for individual_course in courses_to_insert:
                                try:
                                    db.add(individual_course)
                                    db.commit()
                                    courses_saved += 1
                                except IntegrityError as individual_error:
                                    db.rollback()
                                    error_str = str(individual_error.orig) if hasattr(individual_error, 'orig') else str(individual_error)
                                    is_unique_violation = (
                                        'unique' in error_str.lower() or 
                                        'duplicate key' in error_str.lower() or
                                        (PSYCOPG2_AVAILABLE and isinstance(individual_error.orig, UniqueViolation))
                                    )
                                    if is_unique_violation:
                                        courses_skipped += 1
                                    else:
                                        error_msg = f"Integrity error saving course {individual_course.course_code}: {error_str}"
                                        errors.append(error_msg)
                            courses_to_insert = []
                        except Exception as batch_exception:
                            db.rollback()
                            error_msg = f"Error in batch insert: {str(batch_exception)}"
                            errors.append(error_msg)
                            print(f"ERROR: {error_msg}")
                            courses_to_insert = []
                    
                except Exception as course_error:
                    # Rollback any pending changes for this course
                    try:
                        db.rollback()
                    except:
                        pass
                    error_msg = f"Error saving course {course_data.get('course_code', 'unknown')}: {str(course_error)}"
                    errors.append(error_msg)
                    print(f"ERROR: {error_msg}")
                    continue
            
            # Commit any remaining courses in the batch
            if courses_to_insert:
                try:
                    db.bulk_save_objects(courses_to_insert)
                    db.commit()
                    batch_saved = len(courses_to_insert)
                    courses_saved += batch_saved
                    print(f"[Processor] Final batch commit: {batch_saved} courses saved (total: {courses_saved})")
                except IntegrityError as batch_error:
                    # If batch fails, fall back to individual inserts
                    db.rollback()
                    print(f"[Processor] Final batch commit failed, processing individually...")
                    for individual_course in courses_to_insert:
                        try:
                            db.add(individual_course)
                            db.commit()
                            courses_saved += 1
                        except IntegrityError as individual_error:
                            db.rollback()
                            error_str = str(individual_error.orig) if hasattr(individual_error, 'orig') else str(individual_error)
                            is_unique_violation = (
                                'unique' in error_str.lower() or 
                                'duplicate key' in error_str.lower() or
                                (PSYCOPG2_AVAILABLE and isinstance(individual_error.orig, UniqueViolation))
                            )
                            if is_unique_violation:
                                courses_skipped += 1
                            else:
                                error_msg = f"Integrity error saving course {individual_course.course_code}: {error_str}"
                                errors.append(error_msg)
                except Exception as batch_exception:
                    db.rollback()
                    error_msg = f"Error in final batch insert: {str(batch_exception)}"
                    errors.append(error_msg)
                    print(f"ERROR: {error_msg}")
            
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
            print(f"Total courses processed: {courses_processed_count}")
            print(f"Courses saved to database: {courses_saved}")
            print(f"Courses skipped (duplicates): {courses_skipped}")
            
            # Verify count accuracy
            if courses_processed_count != len(courses_data):
                print(f"⚠️  WARNING: Processed count ({courses_processed_count}) doesn't match extracted count ({len(courses_data)})")
            if courses_saved + courses_skipped != courses_processed_count:
                print(f"⚠️  WARNING: Saved ({courses_saved}) + Skipped ({courses_skipped}) != Processed ({courses_processed_count})")
            else:
                print(f"✅ Count verification: {courses_saved} saved + {courses_skipped} skipped = {courses_processed_count} processed")
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

