"""
PDF Processing Service
"""
import pdfplumber
import re
from typing import List, Dict, Optional
from app.models.course import Course


class PDFProcessor:
    """Extract course information from transcript PDFs"""
    
    # Grade mapping to numeric scores
    GRADE_MAP = {
        'A+': 4.0, 'A': 4.0, 'A-': 3.7,
        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
        'D+': 1.3, 'D': 1.0, 'D-': 0.7,
        'F': 0.0
    }
    
    def extract_text(self, pdf_content: bytes) -> str:
        """Extract text from PDF"""
        with pdfplumber.open(pdf_content) as pdf:
            text = ""
            for page in pdf.pages:
                text += page.extract_text() or ""
        return text
    
    def parse_courses(self, text: str) -> List[Dict]:
        """
        Parse course information from transcript text
        This is a simplified parser - may need customization based on transcript format
        """
        courses = []
        
        # Common patterns for course extraction
        # Pattern: Course Code, Course Name, Grade, Credits, Semester
        # Example: "CS 101    Introduction to Computer Science    A    3.0    Fall 2023"
        
        # Try to find course blocks
        # This regex looks for patterns like "CS 101" or "MATH 201"
        course_pattern = r'([A-Z]{2,4}\s+\d{3,4})\s+(.+?)\s+([A-F][+-]?|\d+\.\d+)\s+(\d+\.\d+)?\s*([A-Za-z]+\s+\d{4})?'
        
        matches = re.finditer(course_pattern, text, re.MULTILINE)
        
        for match in matches:
            course_code = match.group(1).strip()
            course_name = match.group(2).strip() if match.group(2) else None
            grade = match.group(3).strip()
            credit_hours = float(match.group(4)) if match.group(4) else None
            semester_year = match.group(5).strip() if match.group(5) else None
            
            # Parse semester and year
            semester = None
            year = None
            if semester_year:
                parts = semester_year.split()
                if len(parts) >= 2:
                    semester = parts[0]
                    year = int(parts[1])
            
            # Convert grade to numeric score
            grade_score = self._grade_to_score(grade)
            
            courses.append({
                'course_code': course_code,
                'course_name': course_name,
                'grade': grade,
                'grade_score': grade_score,
                'credit_hours': credit_hours,
                'semester': semester,
                'year': year
            })
        
        return courses
    
    def _grade_to_score(self, grade: str) -> Optional[float]:
        """Convert letter grade to numeric score"""
        grade_upper = grade.upper().strip()
        
        # Check if it's already a numeric grade
        try:
            return float(grade_upper)
        except ValueError:
            pass
        
        # Map letter grades
        return self.GRADE_MAP.get(grade_upper)
    
    def process_transcript(self, pdf_content: bytes) -> List[Dict]:
        """Main processing function"""
        text = self.extract_text(pdf_content)
        courses = self.parse_courses(text)
        return courses


pdf_processor = PDFProcessor()

