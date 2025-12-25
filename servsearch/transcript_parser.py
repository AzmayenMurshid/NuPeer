#!/usr/bin/env python3
"""
Transcript Parser Tool
A standalone CLI tool to parse transcript PDFs and extract course information
Uses the NuPeer backend PDF processor
"""
import sys
import argparse
from typing import List, Dict
from pathlib import Path

# Add backend directory to path to import the PDF processor
# Resolve to absolute paths to ensure correct path resolution
script_dir = Path(__file__).parent.resolve()
project_root = script_dir.parent.resolve()
backend_path = project_root / 'backend'

if not backend_path.exists():
    print("ERROR: Backend directory not found. Make sure you're running this from the servsearch folder.")
    print(f"Expected backend at: {backend_path}")
    sys.exit(1)

# Add backend to Python path so 'app' module can be imported
backend_path_str = str(backend_path)
if backend_path_str not in sys.path:
    sys.path.insert(0, backend_path_str)

try:
    # Import the PDF processor from NuPeer backend
    # Note: This uses the exact same parser as the backend application
    # Type checker may show an error here, but it works at runtime due to sys.path manipulation above
    from app.services.pdf_processor import pdf_processor  # type: ignore[import-untyped]
except ImportError as e:
    print(f"ERROR: Could not import PDF processor: {e}")
    print(f"\nPython path includes: {sys.path[:3]}")  # Show first 3 paths
    print(f"Backend path: {backend_path}")
    print(f"Backend path exists: {backend_path.exists()}")
    print(f"App directory exists: {(backend_path / 'app').exists()}")
    print("\nTroubleshooting:")
    print("1. Make sure you're running this from the servsearch folder")
    print("2. Ensure the backend directory exists at: ../backend")
    print("3. Install backend dependencies:")
    print("   cd backend && pip install -r requirements.txt")
    print("\nIf the error mentions 'Course' or 'app.models', the Course model")
    print("import is unused and can be ignored - this is a known issue.")
    sys.exit(1)


class TranscriptParser:
    """CLI interface for transcript parsing"""
    
    def parse_file(self, file_path: str) -> List[Dict]:
        """Parse a transcript PDF file using NuPeer's PDF processor"""
        path = Path(file_path)
        
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        if not path.suffix.lower() == '.pdf':
            raise ValueError(f"File must be a PDF: {file_path}")
        
        print(f"Reading PDF file: {file_path}")
        with open(path, 'rb') as f:
            pdf_content = f.read()
        
        print(f"File size: {len(pdf_content) / 1024:.2f} KB")
        print("Extracting text from PDF...")
        
        # Use the NuPeer PDF processor
        courses = pdf_processor.process_transcript(pdf_content)
        
        return courses
    
    def print_courses(self, courses: List[Dict], output_format: str = 'table'):
        """Print courses in a readable format"""
        if not courses:
            print("\n❌ No courses found in transcript")
            return
        
        print(f"\n✅ Found {len(courses)} courses\n")
        
        if output_format == 'table':
            self._print_table(courses)
        elif output_format == 'json':
            self._print_json(courses)
        elif output_format == 'summary':
            self._print_summary(courses)
        else:
            self._print_table(courses)
    
    def _print_table(self, courses: List[Dict]):
        """Print courses in a table format"""
        # Calculate column widths
        max_code = max(len(c.get('course_code', '') or 'N/A') for c in courses)
        max_name = max(len(c.get('course_name', '') or 'N/A') for c in courses) if any(c.get('course_name') for c in courses) else 0
        max_grade = max(len(c.get('grade', '') or 'N/A') for c in courses)
        
        # Header
        header = f"{'Course Code':<{max(max_code, 12)}}  {'Grade':<{max(max_grade, 6)}}  {'Credits':<8}  {'Semester':<12}  {'Year':<6}"
        if max_name > 0:
            header = f"{'Course Code':<{max(max_code, 12)}}  {'Course Name':<{min(max_name, 50)}}  {'Grade':<{max(max_grade, 6)}}  {'Credits':<8}  {'Semester':<12}  {'Year':<6}"
        
        print("=" * len(header))
        print(header)
        print("=" * len(header))
        
        # Sort courses by year, semester, then course code
        sorted_courses = sorted(courses, key=lambda c: (
            c.get('year') or 0,
            c.get('semester') or '',
            c.get('course_code') or ''
        ))
        
        for course in sorted_courses:
            code = course.get('course_code', 'N/A')
            name = (course.get('course_name', '') or 'N/A')[:50] if max_name > 0 else None
            grade = course.get('grade', 'N/A')
            credits = f"{course.get('credit_hours', 0):.1f}" if course.get('credit_hours') else 'N/A'
            semester = course.get('semester', 'N/A') or 'N/A'
            year = str(course.get('year', 'N/A')) if course.get('year') else 'N/A'
            grade_score = course.get('grade_score')
            
            if name:
                row = f"{code:<{max(max_code, 12)}}  {name:<{min(max_name, 50)}}  {grade:<{max(max_grade, 6)}}  {credits:<8}  {semester:<12}  {year:<6}"
            else:
                row = f"{code:<{max(max_code, 12)}}  {grade:<{max(max_grade, 6)}}  {credits:<8}  {semester:<12}  {year:<6}"
            
            if grade_score is not None:
                row += f"  (GPA: {grade_score:.2f})"
            
            print(row)
        
        print("=" * len(header))
    
    def _print_json(self, courses: List[Dict]):
        """Print courses in JSON format"""
        import json
        print(json.dumps(courses, indent=2))
    
    def _print_summary(self, courses: List[Dict]):
        """Print a summary of courses"""
        total_credits = sum(c.get('credit_hours', 0) or 0 for c in courses)
        courses_with_gpa = [c for c in courses if c.get('grade_score') is not None]
        
        if courses_with_gpa:
            total_points = sum((c.get('grade_score', 0) or 0) * (c.get('credit_hours', 0) or 0) for c in courses_with_gpa)
            total_gpa_credits = sum(c.get('credit_hours', 0) or 0 for c in courses_with_gpa)
            gpa = total_points / total_gpa_credits if total_gpa_credits > 0 else 0.0
        else:
            gpa = 0.0
        
        # Grade distribution
        grade_counts = {}
        for course in courses:
            grade = course.get('grade', 'Unknown')
            grade_letter = grade[0] if grade and grade[0].isalpha() else 'Other'
            grade_counts[grade_letter] = grade_counts.get(grade_letter, 0) + 1
        
        print(f"\n📊 Summary:")
        print(f"   Total Courses: {len(courses)}")
        print(f"   Total Credits: {total_credits:.1f}")
        if courses_with_gpa:
            print(f"   GPA: {gpa:.2f} (based on {len(courses_with_gpa)} graded courses)")
        print(f"\n📈 Grade Distribution:")
        for grade in ['A', 'B', 'C', 'D', 'F']:
            count = grade_counts.get(grade, 0)
            if count > 0:
                percentage = (count / len(courses)) * 100
                print(f"   {grade}: {count} courses ({percentage:.1f}%)")


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description='Parse transcript PDFs and extract course information',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s transcript.pdf
  %(prog)s transcript.pdf --format json
  %(prog)s transcript.pdf --format summary
  %(prog)s transcript.pdf --output courses.txt
        """
    )
    
    parser.add_argument(
        'file',
        help='Path to the transcript PDF file'
    )
    
    parser.add_argument(
        '--format', '-f',
        choices=['table', 'json', 'summary'],
        default='table',
        help='Output format (default: table)'
    )
    
    parser.add_argument(
        '--output', '-o',
        help='Output file path (optional, prints to stdout if not specified)'
    )
    
    args = parser.parse_args()
    
    try:
        parser_tool = TranscriptParser()
        courses = parser_tool.parse_file(args.file)
        
        if args.output:
            # Redirect output to file
            with open(args.output, 'w', encoding='utf-8') as f:
                import sys
                original_stdout = sys.stdout
                sys.stdout = f
                try:
                    parser_tool.print_courses(courses, args.format)
                finally:
                    sys.stdout = original_stdout
            print(f"\n✅ Results saved to: {args.output}")
        else:
            parser_tool.print_courses(courses, args.format)
        
        return 0
    
    except FileNotFoundError as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        return 1
    except ValueError as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"❌ Unexpected error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())

