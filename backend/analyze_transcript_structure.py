"""
Script to analyze transcript PDF structure and identify patterns
"""
import pdfplumber
import re
from pathlib import Path

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract all text from PDF"""
    with pdfplumber.open(pdf_path) as pdf:
        text = ""
        for page in pdf.pages:
            text += page.extract_text() or ""
            text += "\n"
    return text

def analyze_transcript_structure(pdf_path: str):
    """Analyze transcript structure and identify patterns"""
    print("=" * 80)
    print("TRANSCRIPT STRUCTURE ANALYSIS")
    print("=" * 80)
    print(f"\nReading PDF: {pdf_path}\n")
    
    # Extract text
    text = extract_text_from_pdf(pdf_path)
    
    # Split into lines for analysis
    lines = text.split('\n')
    
    print(f"Total lines extracted: {len(lines)}\n")
    print("=" * 80)
    print("1. COURSE STRUCTURE ANALYSIS")
    print("=" * 80)
    
    # Look for course patterns
    course_patterns = [
        r'([A-Z]{2,4})\s+(\d{3,4})\s+(.+?)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+([A-F][+-]?)\s*(\d+\.?\d*)?',  # Subject, Catalog, Title, Credits
        r'([A-Z]{2,4})\s+(\d{3,4})\s+(.+?)\s+(\d+\.?\d*)\s+([A-F][+-]?)',  # Without points
    ]
    
    course_examples = []
    for i, line in enumerate(lines):
        for pattern in course_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                course_examples.append((i, line.strip(), match.groups()))
                if len(course_examples) >= 5:  # Get first 5 examples
                    break
        if len(course_examples) >= 5:
            break
    
    print("\nSample Course Lines Found:")
    for line_num, line, groups in course_examples:
        print(f"\nLine {line_num}: {line}")
        print(f"  Groups: {groups}")
    
    print("\n" + "=" * 80)
    print("2. TERM GPA KEYWORDS")
    print("=" * 80)
    
    # Look for Term GPA keywords
    term_gpa_patterns = [
        r'term\s+gpa',
        r'semester\s+gpa',
        r'term\s+grade',
        r'gpa\s+for\s+term',
    ]
    
    term_gpa_lines = []
    for i, line in enumerate(lines):
        line_lower = line.lower()
        for pattern in term_gpa_patterns:
            if re.search(pattern, line_lower):
                term_gpa_lines.append((i, line.strip()))
                break
    
    print(f"\nFound {len(term_gpa_lines)} lines with Term GPA keywords:")
    for line_num, line in term_gpa_lines[:10]:  # Show first 10
        print(f"  Line {line_num}: {line}")
    
    print("\n" + "=" * 80)
    print("3. TERM TOTALS KEYWORDS")
    print("=" * 80)
    
    # Look for Term Totals keywords
    term_totals_patterns = [
        r'term\s+totals',
        r'semester\s+totals',
        r'totals\s+for\s+term',
        r'term\s+summary',
    ]
    
    term_totals_lines = []
    for i, line in enumerate(lines):
        line_lower = line.lower()
        for pattern in term_totals_patterns:
            if re.search(pattern, line_lower):
                term_totals_lines.append((i, line.strip()))
                break
    
    print(f"\nFound {len(term_totals_lines)} lines with Term Totals keywords:")
    for line_num, line in term_totals_lines[:10]:
        print(f"  Line {line_num}: {line}")
    
    print("\n" + "=" * 80)
    print("4. ATTEMPTED/EARNED KEYWORDS")
    print("=" * 80)
    
    # Look for Attempted/Earned keywords
    attempted_earned_patterns = [
        r'attempted',
        r'earned',
        r'credit\s+hours',
        r'credits',
    ]
    
    attempted_earned_lines = []
    for i, line in enumerate(lines):
        line_lower = line.lower()
        for pattern in attempted_earned_patterns:
            if re.search(pattern, line_lower):
                attempted_earned_lines.append((i, line.strip()))
                break
    
    print(f"\nFound {len(attempted_earned_lines)} lines with Attempted/Earned keywords:")
    for line_num, line in attempted_earned_lines[:15]:  # Show first 15
        print(f"  Line {line_num}: {line}")
    
    print("\n" + "=" * 80)
    print("5. TRANSFER/TEST CREDITS (AP, IB, etc.)")
    print("=" * 80)
    
    # Look for transfer/test credit patterns
    transfer_patterns = [
        r'\bAP\b',
        r'\bIB\b',
        r'transfer',
        r'test\s+credit',
        r'advanced\s+placement',
        r'credit\s+by\s+exam',
        r'exam\s+credit',
    ]
    
    transfer_lines = []
    for i, line in enumerate(lines):
        line_lower = line.lower()
        for pattern in transfer_patterns:
            if re.search(pattern, line_lower, re.IGNORECASE):
                transfer_lines.append((i, line.strip()))
                break
    
    print(f"\nFound {len(transfer_lines)} lines with Transfer/Test credit keywords:")
    for line_num, line in transfer_lines[:10]:
        print(f"  Line {line_num}: {line}")
    
    print("\n" + "=" * 80)
    print("6. IN PROGRESS / ACTIVE TERM COURSES")
    print("=" * 80)
    
    # Look for "In Progress" or active term indicators
    in_progress_patterns = [
        r'in\s+progress',
        r'ip\b',
        r'current',
        r'enrolled',
        r'active',
        r'ongoing',
    ]
    
    in_progress_lines = []
    for i, line in enumerate(lines):
        line_lower = line.lower()
        for pattern in in_progress_patterns:
            if re.search(pattern, line_lower):
                in_progress_lines.append((i, line.strip()))
                break
    
    print(f"\nFound {len(in_progress_lines)} lines with In Progress keywords:")
    for line_num, line in in_progress_lines[:10]:
        print(f"  Line {line_num}: {line}")
    
    print("\n" + "=" * 80)
    print("7. GPA SUMMARY BLOCKS")
    print("=" * 80)
    
    # Look for GPA summary blocks (usually at end of term)
    # These often contain: Term GPA, Attempted, Earned, Points, etc.
    gpa_summary_indicators = []
    for i, line in enumerate(lines):
        line_lower = line.lower()
        # Check if line contains multiple GPA-related terms
        gpa_terms = ['gpa', 'attempted', 'earned', 'points', 'credits', 'quality', 'hours']
        term_count = sum(1 for term in gpa_terms if term in line_lower)
        if term_count >= 2:  # Multiple GPA-related terms suggest a summary block
            gpa_summary_indicators.append((i, line.strip(), term_count))
    
    print(f"\nFound {len(gpa_summary_indicators)} potential GPA summary lines:")
    for line_num, line, count in gpa_summary_indicators[:15]:
        print(f"  Line {line_num} ({count} terms): {line}")
    
    print("\n" + "=" * 80)
    print("8. SEMESTER/TERM HEADERS")
    print("=" * 80)
    
    # Look for semester/term headers
    semester_patterns = [
        r'^(fall|spring|summer|winter|fa|sp|su|wi)\s+(\d{4})',
        r'term\s+\d+',
        r'semester\s+\d+',
    ]
    
    semester_headers = []
    for i, line in enumerate(lines):
        line_stripped = line.strip()
        for pattern in semester_patterns:
            if re.match(pattern, line_stripped, re.IGNORECASE):
                semester_headers.append((i, line_stripped))
                break
    
    print(f"\nFound {len(semester_headers)} semester/term headers:")
    for line_num, line in semester_headers[:10]:
        print(f"  Line {line_num}: {line}")
    
    print("\n" + "=" * 80)
    print("9. FULL TEXT PREVIEW (First 100 lines)")
    print("=" * 80)
    print("\n".join(f"{i:4d}: {line}" for i, line in enumerate(lines[:100])))
    
    print("\n" + "=" * 80)
    print("ANALYSIS COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    pdf_path = r"C:\Users\azmay\OneDrive\Downloads\SSR_TSRPT (4).pdf"
    
    if not Path(pdf_path).exists():
        print(f"ERROR: File not found: {pdf_path}")
        exit(1)
    
    analyze_transcript_structure(pdf_path)

