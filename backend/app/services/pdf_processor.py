"""
PDF Processing Service
"""
import pdfplumber
import re
from io import BytesIO
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
        'F': 0.0,
        'S': None,  # Satisfactory (for transfer/test credits) - no GPA impact
        'W': None,  # Withdrawn - no GPA impact
    }
    
    def extract_text(self, pdf_content: bytes) -> str:
        """Extract text from PDF"""
        # pdfplumber.open() requires a file-like object, not raw bytes
        # Wrap bytes in BytesIO to provide seek() method
        pdf_file = BytesIO(pdf_content)
        with pdfplumber.open(pdf_file) as pdf:
            text = ""
            for page in pdf.pages:
                text += page.extract_text() or ""
        return text
    
    def _normalize_semester(self, semester: str) -> Optional[str]:
        """
        Normalize semester codes to full names
        Handles various formats: FA -> Fall, SP -> Spring, SU -> Summer, etc.
        Also handles full names and variations for future/past semesters
        """
        if not semester:
            return None
        
        semester_upper = semester.strip().upper()
        
        # Map common semester codes and variations
        semester_map = {
            # Fall variations
            'FA': 'Fall',
            'FALL': 'Fall',
            'F': 'Fall',
            # Spring variations
            'SP': 'Spring',
            'SPRING': 'Spring',
            'SPR': 'Spring',
            # Summer variations
            'SU': 'Summer',
            'SUM': 'Summer',
            'SUMMER': 'Summer',
            'SM': 'Summer',
            # Winter variations
            'WI': 'Winter',
            'WINTER': 'Winter',
            'WIN': 'Winter',
            'W': 'Winter',
            # Other possible variations
            'AU': 'Fall',  # Autumn
            'AUTUMN': 'Fall',
            'SP1': 'Spring',  # Spring 1
            'SP2': 'Spring',  # Spring 2
            'SU1': 'Summer',  # Summer 1
            'SU2': 'Summer',  # Summer 2
        }
        
        # Check if it's a known code
        if semester_upper in semester_map:
            return semester_map[semester_upper]
        
        # Check if it starts with a known prefix (for variations like "SPRING2024" or "FALL2024")
        for code, full_name in semester_map.items():
            if semester_upper.startswith(code):
                return full_name
        
        # If it contains a known semester name, extract and normalize
        for code, full_name in semester_map.items():
            if code in semester_upper:
                return full_name
        
        # If it's already a properly capitalized full name, return as-is
        if semester_upper in ['FALL', 'SPRING', 'SUMMER', 'WINTER']:
            return semester_map[semester_upper]
        
        # For unknown formats, try to intelligently guess or return capitalized version
        # This handles edge cases and future semester formats
        if len(semester_upper) <= 10:  # Reasonable length for semester names
            # Capitalize first letter, lowercase rest
            return semester.strip().capitalize()
        
        # Return as-is if too long or unrecognized
        return semester.strip()
    
    def parse_courses(self, text: str) -> List[Dict]:
        """
        Parse course information from transcript text
        Transcript structure:
        Semester (on its own line, e.g., "FA 2024" or "Fall 2024")
        Course information
        Course information
        Course information
        
        Semester (on its own line)
        Course information
        Course information
        ...
        """
        courses = []
        
        # Split text into lines to process sequentially
        lines = text.split('\n')
        
        # Current semester tracking
        current_semester = None
        current_year = None
        
        # Pattern for semester headers: Flexible pattern to match any semester format
        # Matches: "FA 2024", "SP 2025", "SU 2025", "Fall 2024", "Spring 2025", "Winter 2023", etc.
        # Also handles variations like "FA2024", "Fall2024", "SP 2025", etc.
        # The pattern captures: (semester code/name) followed by (4-digit year)
        # Semester can be 2-10 characters (covers FA, SP, SU, Fall, Spring, Summer, Winter, and variations)
        # We look for lines that are primarily just the semester header (not mixed with other text)
        semester_header_pattern = r'^\s*([A-Za-z]{2,10})\s*(\d{4})\s*$'
        
        # Course patterns (semester NOT included in course line - it comes from header)
        # Based on actual transcript structure: SUBJECT CATALOG_NUM Title Attempted Earned Grade Points
        # Example: "COSC 1336 Computer Science & Program 3.000 3.000 A- 11.010"
        
        # Pattern 1: Standard course format with proper spacing
        # Matches: Subject (2-4 letters), Catalog (3-4 digits), Title (variable), Attempted, Earned, Grade, Points
        # Grade can be: Letter grade (A-F with +/-), "S" (Satisfactory), "W" (Withdrawn), or "In Progress"
        # The title is matched greedily until we see the credit pattern (d+.d{3})
        pattern1 = r'^([A-Z]{2,4})\s+(\d{3,4})\s+(.+?)\s+(\d+\.\d{3})\s+(\d+\.\d{3})\s+([A-F][+-]?|S|W|In\s+Progress)\s+(\d+\.\d{3})$'
        
        # Pattern 2: Same as pattern1 but more flexible with decimal places
        pattern2 = r'^([A-Z]{2,4})\s+(\d{3,4})\s+(.+?)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+([A-F][+-]?|S|W|In\s+Progress)\s+(\d+\.\d+)$'
        
        # Pattern 3: Handle courses without points (for transfer credits that might not have points)
        pattern3 = r'^([A-Z]{2,4})\s+(\d{3,4})\s+(.+?)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+([A-F][+-]?|S|W)$'
        
        # Process lines sequentially to track semester headers
        seen_courses = set()
        seen_semester_headers = set()  # Track which semester headers we've already processed
        
        # Track transfer/test credits section
        in_transfer_section = False
        transfer_term = None
        transfer_year = None
        
        for line in lines:
            # Strip the line for processing
            line_stripped = line.strip()
            
            # Skip empty lines
            if not line_stripped:
                continue
            
            # Detect transfer/test credits section
            if re.search(r'Test\s+Credits|Transfer\s+Credits', line_stripped, re.IGNORECASE):
                in_transfer_section = True
                # Transfer credits are typically assigned to the first term
                # We'll use the first semester we encounter
                continue
            
            # Detect "Transferred to Term" lines to get the term for transfer credits
            transfer_match = re.search(r'Transferred\s+to\s+Term\s+([A-Z]{2,4})\s+(\d{4})', line_stripped, re.IGNORECASE)
            if transfer_match:
                transfer_semester_code = transfer_match.group(1).strip()
                transfer_year_str = transfer_match.group(2).strip()
                try:
                    transfer_year = int(transfer_year_str)
                    transfer_term = self._normalize_semester(transfer_semester_code)
                    if transfer_term and 1900 <= transfer_year <= 2100:
                        in_transfer_section = True
                except ValueError:
                    pass
                continue
            
            # Detect end of transfer section (when we hit "Beginning of Undergraduate Record" or a semester header)
            if in_transfer_section and (re.search(r'Beginning\s+of\s+Undergraduate', line_stripped, re.IGNORECASE) or 
                                       re.match(semester_header_pattern, line_stripped, re.IGNORECASE)):
                in_transfer_section = False
            
            # Handle transfer credit course lines (format: "COURSE_CODE Course Name Credits Grade")
            # These appear after "Transferred to Term" lines
            # Example: "ENGL 1301 First Year Writing I 3.000 S"
            if in_transfer_section and transfer_term and transfer_year:
                transfer_course_match = re.match(r'^([A-Z]{2,4})\s+(\d{3,4})\s+(.+?)\s+(\d+\.\d+)\s+(S|W)$', line_stripped, re.IGNORECASE)
                if transfer_course_match:
                    subject = transfer_course_match.group(1).strip().upper()
                    catalog_num = transfer_course_match.group(2).strip()
                    course_code = f"{subject} {catalog_num}"
                    course_name = transfer_course_match.group(3).strip()
                    credits = float(transfer_course_match.group(4))
                    grade = transfer_course_match.group(5).upper()
                    
                    # Use transfer term/year
                    semester = transfer_term
                    year = transfer_year
                    
                    # Skip if we've already seen this course
                    course_key = (course_code, semester, year, 'transfer')
                    if course_key in seen_courses:
                        continue
                    seen_courses.add(course_key)
                    
                    courses.append({
                        'course_code': course_code,
                        'course_name': course_name,
                        'grade': grade,
                        'grade_score': None,  # Transfer credits don't affect GPA
                        'credit_hours': credits,
                        'semester': semester,
                        'year': year,
                        'attempted_credits': credits,
                        'points': 0.0  # Transfer credits don't contribute to GPA points
                    })
                    continue
            
            # Check if this line is a semester header (should be primarily just semester + year)
            # Use ^ and $ anchors to ensure the line is primarily just the semester header
            semester_match = re.match(semester_header_pattern, line_stripped, re.IGNORECASE)
            if semester_match:
                semester_code = semester_match.group(1).strip()
                year_str = semester_match.group(2).strip()
                
                # Validate that the year is reasonable (1900-2100)
                try:
                    year = int(year_str)
                    if 1900 <= year <= 2100:
                        # Normalize the semester code
                        normalized_semester = self._normalize_semester(semester_code)
                        
                        # Only treat as semester header if normalization succeeded or returned a reasonable value
                        # This helps avoid false positives (e.g., course codes that happen to match the pattern)
                        if normalized_semester and len(normalized_semester) <= 20:  # Reasonable semester name length
                            # Create a unique key for this semester/year combination
                            semester_key = (normalized_semester, year)
                            
                            # Only process and log if we haven't seen this semester header before
                            if semester_key not in seen_semester_headers:
                                seen_semester_headers.add(semester_key)
                                current_semester = normalized_semester
                                current_year = year
                                print(f"Found semester header: {current_semester} {current_year}")
                            else:
                                # Update current semester/year even if we've seen it before
                                # (in case the header appears again later in the transcript)
                                current_semester = normalized_semester
                                current_year = year
                            continue  # Skip processing this line as a course
                except ValueError:
                    pass  # Not a valid year, continue processing as regular line
            
            # Skip header lines that contain column labels
            if re.search(r'Course\s+Description|Attempted\s+Earned', line_stripped, re.IGNORECASE):
                continue
            
            # Skip Term GPA/Totals summary lines (we'll extract these separately if needed)
            if re.search(r'Term\s+GPA|Term\s+Totals', line_stripped, re.IGNORECASE):
                continue
            
            # Try to match course patterns in this line
            for pattern in [pattern1, pattern2, pattern3]:
                match = re.match(pattern, line_stripped, re.IGNORECASE)
                if match:
                    try:
                        # Extract subject and catalog number separately
                        subject = match.group(1).strip().upper()
                        catalog_num = match.group(2).strip()
                        course_code = f"{subject} {catalog_num}"
                        
                        # Skip if we've already seen this exact match
                        match_str = match.group(0)
                        if match_str in seen_courses:
                            continue
                        seen_courses.add(match_str)
                        
                        # Extract course name (group 3)
                        course_name = match.group(3).strip() if match.group(3) else None
                        
                        # Clean up course name - remove trailing numbers/spaces that might be misparsed
                        if course_name:
                            # Remove trailing numeric patterns that might be credits
                            course_name = re.sub(r'\s+\d+\.\d+\s*$', '', course_name).strip()
                        
                        # Limit course name to reasonable length
                        if course_name and len(course_name) > 250:
                            # Try to find a better boundary
                            for delimiter in [' - ', ' | ', '\n', '\t', '  ']:
                                if delimiter in course_name:
                                    course_name = course_name.split(delimiter)[0]
                                    break
                            # If still too long, truncate at word boundary
                            if course_name and len(course_name) > 250:
                                truncated = course_name[:250]
                                last_space = truncated.rfind(' ')
                                if last_space > 200:
                                    course_name = course_name[:last_space]
                                else:
                                    course_name = truncated
                        
                        # Extract attempted credits (group 4)
                        attempted_credits = None
                        if match.group(4) and match.group(4).replace('.', '').isdigit():
                            attempted_credits = float(match.group(4))
                        
                        # Extract earned credits (group 5)
                        earned_credits = None
                        if match.group(5) and match.group(5).replace('.', '').isdigit():
                            earned_credits = float(match.group(5))
                        
                        # Extract grade (group 6) - can be letter grade, S, W, or "In Progress"
                        grade_raw = match.group(6).strip() if match.group(6) else None
                        if not grade_raw:
                            continue
                        
                        # Normalize "In Progress" - handle both "In Progress" and variations
                        grade_normalized = grade_raw.replace('  ', ' ').strip()  # Normalize multiple spaces
                        if grade_normalized.upper() == "IN PROGRESS":
                            grade = "IN PROGRESS"
                        else:
                            grade = grade_normalized.upper()
                        
                        # Handle "In Progress" courses
                        is_in_progress = grade == "IN PROGRESS"
                        if is_in_progress:
                            # In Progress courses have 0.000 earned credits and 0.000 points
                            earned_credits = 0.0
                            points = 0.0
                            grade_score = None  # No grade score for in-progress courses
                        else:
                            # Extract points (group 7) - GPA points (may not exist for transfer credits)
                            points = None
                            if len(match.groups()) >= 7 and match.group(7):
                                if match.group(7).replace('.', '').isdigit():
                                    points = float(match.group(7))
                            
                            # Calculate grade_score
                            if points is not None and attempted_credits is not None and attempted_credits > 0:
                                grade_score = round(points / attempted_credits, 2)
                            elif grade in ['S', 'W']:
                                # Satisfactory/Withdrawn - no GPA impact
                                grade_score = None
                                points = 0.0 if points is None else points
                            else:
                                # Fallback to grade mapping
                                grade_score = self._grade_to_score(grade)
                                # Calculate points if we have grade_score
                                if grade_score is not None and attempted_credits is not None:
                                    points = round(grade_score * attempted_credits, 3)
                                else:
                                    points = 0.0
                        
                        # Use current semester/year from header (set earlier in the loop)
                        semester = current_semester
                        year = current_year
                        
                        # Validate required fields
                        if not course_code:
                            continue
                        if not course_name:
                            continue
                        if attempted_credits is None:
                            continue
                        if earned_credits is None:
                            continue
                        if not grade:
                            continue
                        
                        # For completed courses (not In Progress), we need points or a valid grade
                        if not is_in_progress and grade not in ['S', 'W']:
                            if points is None and grade_score is None:
                                continue
                        
                        # Only add if all required fields are present
                        courses.append({
                            'course_code': course_code,
                            'course_name': course_name,
                            'grade': grade,
                            'grade_score': grade_score,
                            'credit_hours': earned_credits,  # Use earned credits as credit hours
                            'semester': semester,
                            'year': year,
                            'attempted_credits': attempted_credits,  # Store attempted credits separately
                            'points': points if points is not None else 0.0  # Store points separately
                        })
                        
                        # Break after first successful match
                        break
                    except (ValueError, AttributeError, IndexError) as e:
                        # Skip malformed matches
                        continue
        
        # Remove duplicates based on course_code, semester, and year
        unique_courses = {}
        for course in courses:
            key = (course['course_code'], course.get('semester'), course.get('year'))
            if key not in unique_courses:
                unique_courses[key] = course
            else:
                # Keep the one with more information
                existing = unique_courses[key]
                if not existing.get('course_name') and course.get('course_name'):
                    unique_courses[key] = course
        
        # Organize courses by semester and year, then by course code
        # Sort by: year (descending), semester (Fall > Spring > Summer > Winter), course_code
        semester_order = {'Fall': 0, 'Spring': 1, 'Summer': 2, 'Winter': 3}
        
        def sort_key(course):
            year = course.get('year') or 0
            semester = course.get('semester') or ''
            semester_priority = semester_order.get(semester, 99)  # Unknown semesters go last
            course_code = course.get('course_code') or ''
            return (-year, semester_priority, course_code)  # Negative year for descending order
        
        sorted_courses = sorted(unique_courses.values(), key=sort_key)
        
        return sorted_courses
    
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
