"""
Test the updated PDF parser with the actual transcript
"""
import sys
from pathlib import Path

# Add parent directory to path to import the processor
sys.path.insert(0, str(Path(__file__).parent))

from app.services.pdf_processor import pdf_processor

def test_parser():
    pdf_path = r"C:\Users\azmay\OneDrive\Downloads\SSR_TSRPT (4).pdf"
    
    if not Path(pdf_path).exists():
        print(f"ERROR: File not found: {pdf_path}")
        return
    
    print("=" * 80)
    print("TESTING UPDATED PDF PARSER")
    print("=" * 80)
    
    # Read PDF
    with open(pdf_path, 'rb') as f:
        pdf_content = f.read()
    
    # Process transcript
    print("\nProcessing transcript...")
    courses = pdf_processor.process_transcript(pdf_content)
    
    print(f"\n[SUCCESS] Found {len(courses)} courses\n")
    
    # Group by semester
    by_semester = {}
    for course in courses:
        key = f"{course.get('semester', 'Unknown')} {course.get('year', 'Unknown')}"
        if key not in by_semester:
            by_semester[key] = []
        by_semester[key].append(course)
    
    # Print courses by semester
    for semester in sorted(by_semester.keys()):
        print(f"\n{'='*80}")
        print(f"SEMESTER: {semester}")
        print(f"{'='*80}")
        semester_courses = by_semester[semester]
        for course in semester_courses:
            grade = course.get('grade', 'N/A')
            in_progress = grade == 'IN PROGRESS'
            transfer = course.get('grade') in ['S', 'W'] and course.get('points', 0) == 0
            
            status = ""
            if in_progress:
                status = " [IN PROGRESS]"
            elif transfer:
                status = " [TRANSFER]"
            
            print(f"  {course.get('course_code', 'N/A'):12} | "
                  f"{course.get('course_name', 'N/A')[:50]:50} | "
                  f"Grade: {grade:12} | "
                  f"Credits: {course.get('credit_hours', 0):5.3f} | "
                  f"Points: {course.get('points', 0):7.3f}{status}")
    
    # Summary statistics
    print(f"\n{'='*80}")
    print("SUMMARY STATISTICS")
    print(f"{'='*80}")
    
    total_courses = len(courses)
    in_progress_count = sum(1 for c in courses if c.get('grade') == 'IN PROGRESS')
    transfer_count = sum(1 for c in courses if c.get('grade') in ['S', 'W'] and c.get('points', 0) == 0)
    completed_count = total_courses - in_progress_count - transfer_count
    
    print(f"Total Courses: {total_courses}")
    print(f"  - Completed: {completed_count}")
    print(f"  - In Progress: {in_progress_count}")
    print(f"  - Transfer/Test Credits: {transfer_count}")
    
    # Check for specific patterns
    print(f"\n{'='*80}")
    print("PATTERN VERIFICATION")
    print(f"{'='*80}")
    
    # Check for In Progress courses
    in_progress_courses = [c for c in courses if c.get('grade', '').upper() == 'IN PROGRESS']
    if in_progress_courses:
        print(f"\n[SUCCESS] Found {len(in_progress_courses)} 'In Progress' courses:")
        for c in in_progress_courses[:5]:
            print(f"   - {c.get('course_code')}: {c.get('course_name')} (Earned: {c.get('credit_hours', 0)}, Points: {c.get('points', 0)})")
    else:
        print("\n[WARNING] No 'In Progress' courses found")
    
    # Check for Transfer credits
    transfer_courses = [c for c in courses if c.get('grade') in ['S', 'W'] and c.get('points', 0) == 0]
    if transfer_courses:
        print(f"\n[SUCCESS] Found {len(transfer_courses)} Transfer/Test credit courses:")
        for c in transfer_courses[:5]:
            print(f"   - {c.get('course_code')}: {c.get('course_name')} (Grade: {c.get('grade')}, Credits: {c.get('credit_hours', 0)})")
    else:
        print("\n[WARNING] No Transfer/Test credit courses found")
    
    print(f"\n{'='*80}")
    print("TEST COMPLETE")
    print(f"{'='*80}")

if __name__ == "__main__":
    test_parser()

