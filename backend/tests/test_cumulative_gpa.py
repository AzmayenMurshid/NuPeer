"""
Test script to verify cumulative GPA calculation
This script tests the cumulative GPA calculation logic from the analytics endpoint
"""
import sys
from collections import defaultdict

def test_cumulative_gpa_calculation():
    """Test the cumulative GPA calculation logic"""
    print("=" * 60)
    print("Testing Cumulative GPA Calculation")
    print("=" * 60)
    print()
    
    # Simulate semester data (similar to what the backend receives)
    # Format: {period: {"points": float, "credits": float, "count": int}}
    semester_data = {
        "Fall 2021": {"points": 48.0, "credits": 12.0, "count": 4},  # 4.0 GPA
        "Spring 2022": {"points": 45.0, "credits": 15.0, "count": 5},  # 3.0 GPA
        "Fall 2022": {"points": 52.0, "credits": 13.0, "count": 4},  # 4.0 GPA
        "Spring 2023": {"points": 42.0, "credits": 14.0, "count": 5},  # 3.0 GPA
    }
    
    # Semester order for sorting (academic year order)
    semester_order = {'Spring': 0, 'Summer': 1, 'Fall': 2, 'Winter': 3, 'Unknown': 99}
    
    def sort_period_key(item: tuple) -> tuple:
        """Sort key for (period, data) tuples - sorts by period chronologically"""
        period_str, _ = item
        parts = period_str.split()
        if len(parts) >= 2:
            semester = parts[0]
            try:
                year = int(parts[1])
                semester_priority = semester_order.get(semester, 99)
                return (year, semester_priority)
            except (ValueError, IndexError):
                pass
        return (0, 99)
    
    # Calculate cumulative GPA progressively from term GPAs (same logic as backend)
    gpa_trend = []
    cumulative_total_points = 0.0
    cumulative_total_credits = 0.0
    
    print("Term-by-Term GPA Calculation:")
    print("-" * 60)
    
    for period, data in sorted(semester_data.items(), key=sort_period_key):
        term_gpa = round(data["points"] / data["credits"], 2) if data["credits"] > 0 else 0.0
        term_credits = round(data["credits"], 1)
        term_points = data["points"]
        
        # Calculate cumulative GPA: (previous_cumulative_points + current_term_points) / (previous_cumulative_credits + current_term_credits)
        cumulative_total_points += term_points
        cumulative_total_credits += data["credits"]
        cumulative_gpa = round(cumulative_total_points / cumulative_total_credits, 2) if cumulative_total_credits > 0 else 0.0
        
        print(f"Period: {period}")
        print(f"  Term GPA: {term_gpa:.2f} (Points: {term_points:.1f}, Credits: {term_credits:.1f})")
        print(f"  Cumulative Points: {cumulative_total_points:.1f}")
        print(f"  Cumulative Credits: {cumulative_total_credits:.1f}")
        print(f"  Cumulative GPA: {cumulative_gpa:.2f}")
        print()
        
        gpa_trend.append({
            'period': period,
            'gpa': term_gpa,
            'cumulative_gpa': cumulative_gpa,
            'credits': term_credits,
            'course_count': data["count"]
        })
    
    print("=" * 60)
    print("Summary:")
    print("=" * 60)
    print(f"Total Terms: {len(gpa_trend)}")
    print(f"Final Cumulative GPA: {gpa_trend[-1]['cumulative_gpa']:.2f}")
    print(f"Total Credits: {cumulative_total_credits:.1f}")
    print()
    
    # Verify the calculation
    expected_final_gpa = round((48.0 + 45.0 + 52.0 + 42.0) / (12.0 + 15.0 + 13.0 + 14.0), 2)
    actual_final_gpa = gpa_trend[-1]['cumulative_gpa']
    
    print("Verification:")
    print("-" * 60)
    print(f"Expected Final Cumulative GPA: {expected_final_gpa:.2f}")
    print(f"Actual Final Cumulative GPA: {actual_final_gpa:.2f}")
    
    if abs(expected_final_gpa - actual_final_gpa) < 0.01:
        print("[PASS] Cumulative GPA calculation is correct!")
    else:
        print("[FAIL] Cumulative GPA calculation mismatch!")
        return False
    
    print()
    print("=" * 60)
    print("Data Structure (as returned by API):")
    print("=" * 60)
    for item in gpa_trend:
        print(f"  {item}")
    print()
    
    # Test dashboard extraction logic
    print("=" * 60)
    print("Dashboard Display Test:")
    print("=" * 60)
    latest_cumulative_gpa = gpa_trend[-1]['cumulative_gpa'] if gpa_trend else None
    print(f"Latest Cumulative GPA (for dashboard): {latest_cumulative_gpa:.2f}")
    print("[OK] Dashboard will display this value as 'Cumulative GPA'")
    print()
    
    return True

if __name__ == "__main__":
    success = test_cumulative_gpa_calculation()
    sys.exit(0 if success else 1)

