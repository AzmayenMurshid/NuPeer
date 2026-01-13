"""
Academic Analytics endpoints
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import Dict, List
from collections import defaultdict
from app.core.database import get_db
from app.models.course import Course
from app.models.user import User
from app.api.v1.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()


class GPATrendPoint(BaseModel):
    period: str  # e.g., "Fall 2023" or "2023"
    gpa: float
    credits: float
    course_count: int


class GradeDistribution(BaseModel):
    grade: str
    count: int
    percentage: float


class CourseDistribution(BaseModel):
    category: str  # e.g., "CS", "MATH", "100-level", "200-level", etc.
    count: int
    percentage: float


class PointsTrendPoint(BaseModel):
    period: str  # e.g., "Fall 2023" or "2023"
    points: float  # Total GPA points earned
    attempted_credits: float  # Total attempted credits
    earned_credits: float  # Total earned credits
    course_count: int  # Number of courses


class AcademicAnalytics(BaseModel):
    overall_gpa: float
    total_credits: float
    total_courses: int
    gpa_trend: List[GPATrendPoint]
    grade_distribution: List[GradeDistribution]
    credits_by_semester: List[GPATrendPoint]
    course_distribution_by_department: List[CourseDistribution]
    points_trend: List[PointsTrendPoint]  # Replaces course_distribution_by_level


def earns_credit(grade: str, grade_score: float = None) -> bool:
    """
    Determine if a grade earns credit (C- or above)
    Credits are only earned for grades C- (1.7) or above
    """
    if grade_score is not None:
        # C- has a grade_score of 1.7, so anything >= 1.7 earns credit
        return float(grade_score) >= 1.7
    
    if not grade:
        return False
    
    # Check letter grades
    grade_upper = str(grade).strip().upper()
    
    # Grades that earn credit: A+, A, A-, B+, B, B-, C+, C, C-
    credit_grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-']
    
    # Check if it's a numeric grade
    try:
        grade_num = float(grade_upper)
        return grade_num >= 1.7  # C- or above
    except ValueError:
        pass
    
    # Check if it's a letter grade that earns credit
    return grade_upper in credit_grades


def calculate_gpa(courses: List[Course]) -> float:
    """Calculate GPA from courses with grade_score (only courses that earn credit)"""
    total_points = 0
    total_credits = 0
    
    for course in courses:
        if course.grade_score is not None and course.credit_hours is not None:
            # Only count credits for courses with C- or above
            if earns_credit(course.grade, course.grade_score):
                total_points += float(course.grade_score) * float(course.credit_hours)
                total_credits += float(course.credit_hours)
    
    if total_credits == 0:
        return 0.0
    
    return round(total_points / total_credits, 2)


@router.get("/academic-trends", response_model=AcademicAnalytics)
async def get_academic_trends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get academic trends and analytics for the current user"""
    # Get all courses for the user (including those without grade_score for grade distribution)
    all_courses = db.query(Course).filter(
        Course.user_id == current_user.id
    ).order_by(Course.year, Course.semester).all()
    
    # Get courses with grade_score for GPA calculations
    courses_with_gpa = [c for c in all_courses if c.grade_score is not None]
    
    if not all_courses:
        return AcademicAnalytics(
            overall_gpa=0.0,
            total_credits=0.0,
            total_courses=0,
            gpa_trend=[],
            grade_distribution=[],
            credits_by_semester=[],
            course_distribution_by_department=[],
            points_trend=[]
        )
    
    # Calculate overall GPA (only from courses with grade_score that earn credit)
    overall_gpa = calculate_gpa(courses_with_gpa) if courses_with_gpa else 0.0
    
    # Calculate total credits (only from courses with C- or above)
    total_credits = sum(
        float(c.credit_hours) 
        for c in all_courses 
        if c.credit_hours and earns_credit(c.grade, c.grade_score)
    )
    total_courses = len(all_courses)
    
    # Group by semester/year for GPA trend (only courses with grade_score that earn credit)
    semester_data = defaultdict(lambda: {"points": 0, "credits": 0, "count": 0})
    
    for course in courses_with_gpa:
        if course.grade_score is not None and course.credit_hours is not None:
            # Only count credits for courses with C- or above
            if earns_credit(course.grade, course.grade_score):
                period = f"{course.semester or 'Unknown'} {course.year or 'Unknown'}"
                semester_data[period]["points"] += float(course.grade_score) * float(course.credit_hours)
                semester_data[period]["credits"] += float(course.credit_hours)
                semester_data[period]["count"] += 1
    
    # Build GPA trend - sort chronologically by year and semester
    def sort_period_key(item: tuple) -> tuple:
        """Sort key for (period, data) tuples - sorts by period chronologically"""
        period_str, _ = item  # Unpack the tuple to get just the period string
        # Semester order: Spring (0), Summer (1), Fall (2), Winter (3) - academic year order
        semester_order = {'Spring': 0, 'Summer': 1, 'Fall': 2, 'Winter': 3, 'Unknown': 99}
        
        # Parse period string (e.g., "Fall 2024" or "Spring 2025")
        parts = period_str.split()
        if len(parts) >= 2:
            semester = parts[0]
            try:
                year = int(parts[1])
                semester_priority = semester_order.get(semester, 99)
                return (year, semester_priority)
            except (ValueError, IndexError):
                pass
        
        # Fallback for malformed periods
        return (0, 99)
    
    gpa_trend = []
    for period, data in sorted(semester_data.items(), key=sort_period_key):
        gpa = round(data["points"] / data["credits"], 2) if data["credits"] > 0 else 0.0
        gpa_trend.append(GPATrendPoint(
            period=period,
            gpa=gpa,
            credits=round(data["credits"], 1),
            course_count=data["count"]
        ))
    
    # Grade distribution - use ALL courses with grades (not just those with grade_score)
    grade_counts = defaultdict(int)
    for course in all_courses:
        if course.grade:
            # Normalize grade - handle letter grades (A, A-, B+, etc.) and numeric grades
            grade_str = str(course.grade).strip().upper()
            
            # If it's a numeric grade, convert to letter
            try:
                grade_num = float(grade_str)
                if grade_num >= 3.7:
                    grade_letter = "A"
                elif grade_num >= 3.0:
                    grade_letter = "B"
                elif grade_num >= 2.0:
                    grade_letter = "C"
                elif grade_num >= 1.0:
                    grade_letter = "D"
                else:
                    grade_letter = "F"
            except ValueError:
                # It's a letter grade - take first character
                grade_letter = grade_str[0] if grade_str else "Unknown"
            
            # Only count valid letter grades
            if grade_letter in ["A", "B", "C", "D", "F"]:
                grade_counts[grade_letter] += 1
    
    total_graded = sum(grade_counts.values())
    grade_distribution = []
    for grade in ["A", "B", "C", "D", "F"]:
        count = grade_counts.get(grade, 0)
        percentage = round((count / total_graded * 100), 1) if total_graded > 0 else 0.0
        grade_distribution.append(GradeDistribution(
            grade=grade,
            count=count,
            percentage=percentage
        ))
    
    # Credits by semester (same as GPA trend but just credits)
    credits_by_semester = [
        GPATrendPoint(
            period=point.period,
            gpa=0.0,  # Not used for credits chart
            credits=point.credits,
            course_count=point.course_count
        )
        for point in gpa_trend
    ]
    
    # Course distribution by department (use all courses)
    dept_counts = defaultdict(int)
    for course in all_courses:
        if course.course_code:
            # Extract department (e.g., "CS 101" -> "CS")
            parts = course.course_code.split()
            if parts:
                dept = parts[0].upper()
                dept_counts[dept] += 1
    
    total_courses_for_dist = len([c for c in all_courses if c.course_code])
    course_distribution_by_department = []
    for dept, count in sorted(dept_counts.items(), key=lambda x: x[1], reverse=True):
        percentage = round((count / total_courses_for_dist * 100), 1) if total_courses_for_dist > 0 else 0.0
        course_distribution_by_department.append(CourseDistribution(
            category=dept,
            count=count,
            percentage=percentage
        ))
    
    # Points trend by semester - tracks total points, attempted credits, and earned credits over time
    points_semester_data = defaultdict(lambda: {"points": 0, "attempted_credits": 0, "earned_credits": 0, "count": 0})
    
    for course in all_courses:
        if course.semester and course.year:
            period = f"{course.semester} {course.year}"
            
            # Get points from database (stored from transcript) or calculate if not available
            if course.points is not None:
                points = float(course.points)
            elif course.grade_score is not None and course.credit_hours is not None:
                # Fallback: calculate points if not stored
                points = float(course.grade_score) * float(course.credit_hours)
            else:
                points = 0.0
            
            points_semester_data[period]["points"] += points
            
            # Get attempted credits (use credit_hours as attempted credits)
            attempted = float(course.credit_hours) if course.credit_hours else 0.0
            points_semester_data[period]["attempted_credits"] += attempted
            
            # Get earned credits (only if grade earns credit)
            if earns_credit(course.grade, course.grade_score) and course.credit_hours:
                earned = float(course.credit_hours)
                points_semester_data[period]["earned_credits"] += earned
            
            points_semester_data[period]["count"] += 1
    
    # Build points trend - sort by academic calendar order (Fall, Spring, Summer)
    def sort_period_key_for_points(item: tuple) -> tuple:
        """Sort key for (period, data) tuples - sorts by academic year order: Fall, Spring, Summer"""
        period_str, _ = item
        # Academic calendar order: Fall starts the year, then Spring, then Summer
        semester_order = {'Fall': 0, 'Spring': 1, 'Summer': 2, 'Winter': 3, 'Unknown': 99}
        parts = period_str.split()
        if len(parts) >= 2:
            semester = parts[0]
            try:
                year = int(parts[1])
                semester_priority = semester_order.get(semester, 99)
                # For academic year: Fall 2023 starts academic year 2023-2024
                # Spring 2024 and Summer 2024 are part of the same academic year
                # So we use the year of Fall as the academic year base
                if semester == 'Spring' or semester == 'Summer':
                    # Spring and Summer belong to the academic year that started in the previous Fall
                    academic_year = year - 1
                else:
                    # Fall starts the academic year
                    academic_year = year
                return (academic_year, semester_priority)
            except (ValueError, IndexError):
                pass
        return (0, 99)
    
    points_trend = []
    for period, data in sorted(points_semester_data.items(), key=sort_period_key_for_points):
        points_trend.append(PointsTrendPoint(
            period=period,
            points=round(data["points"], 2),
            attempted_credits=round(data["attempted_credits"], 1),
            earned_credits=round(data["earned_credits"], 1),
            course_count=data["count"]
        ))
    
    return AcademicAnalytics(
        overall_gpa=overall_gpa,
        total_credits=round(total_credits, 1),
        total_courses=total_courses,
        gpa_trend=gpa_trend,
        grade_distribution=grade_distribution,
        credits_by_semester=credits_by_semester,
        course_distribution_by_department=course_distribution_by_department,
        points_trend=points_trend
    )

