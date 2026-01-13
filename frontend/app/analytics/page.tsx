'use client'

import { useMemo, useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { useAcademicAnalytics } from '@/lib/hooks/useAnalytics'
import { useCourses } from '@/lib/hooks/useCourses'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import Link from 'next/link'
import { User } from 'lucide-react'
import { projectionPresets } from '@/lib/utils/projections'
import { SummaryCards } from '@/components/analytics/SummaryCards'
import { CreditProgressBar } from '@/components/analytics/CreditProgressBar'
import { PerformanceInsights } from '@/components/analytics/PerformanceInsights'
import { AcademicAnalysis } from '@/components/analytics/AcademicAnalysis'
import { CoursesTable } from '@/components/analytics/CoursesTable'

// Lazy load heavy chart components for better initial load performance
const GPATrendChart = lazy(() => import('@/components/analytics/GPATrendChart').then(m => ({ default: m.GPATrendChart })))
const GradeDistributionChart = lazy(() => import('@/components/analytics/GradeDistributionChart').then(m => ({ default: m.GradeDistributionChart })))
const CourseDistributionChart = lazy(() => import('@/components/analytics/CourseDistributionChart').then(m => ({ default: m.CourseDistributionChart })))
const PointsTrendChart = lazy(() => import('@/components/analytics/PointsTrendChart').then(m => ({ default: m.PointsTrendChart })))
const CreditsBySemesterChart = lazy(() => import('@/components/analytics/CreditsBySemesterChart').then(m => ({ default: m.CreditsBySemesterChart })))

// Loading fallback for lazy-loaded components
const ChartLoader = () => (
  <div className="card p-6 mb-8 animate-pulse">
    <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
  </div>
)

// Demo data commented out - replaced with empty data structure
// No demo data available. Users must upload a transcript to see their academic analytics.
const demoAnalytics = {
  overall_gpa: 0,
  total_credits: 0,
  total_courses: 0,
  gpa_trend: [],
  grade_distribution: [],
  credits_by_semester: [],
  course_distribution_by_department: [],
  points_trend: [],
}

function AnalyticsContent() {
  const { user } = useAuth()
  const { data: analytics, isLoading, error } = useAcademicAnalytics()
  const { data: courses } = useCourses()
  const [timeFilter, setTimeFilter] = useState<string>('all') // Filter state for line graphs
  const [courseSearchQuery, setCourseSearchQuery] = useState<string>('') // Search state for courses table
  const [showProjection, setShowProjection] = useState<boolean>(false) // Projection toggle state
  
  // Debounce search query to reduce re-renders
  const debouncedSearchQuery = useDebounce(courseSearchQuery, 300)

  // Scroll to section when page loads with hash
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      if (hash) {
        // Wait for content to render
        setTimeout(() => {
          const element = document.querySelector(hash)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
      }
    }
  }, [])
  
  // Only show real data - no demo data
  const displayAnalytics = useMemo(() => {
    return analytics || demoAnalytics
  }, [analytics])
  
  
  const hasNoData = !analytics || (analytics?.total_courses ?? 0) === 0
  
  // Filter function for time-based data with gap filling
  // Ensures line continues from x=0 (start of timeframe) even when no data exists
  const filterByTime = useMemo(() => {
    return (data: any[], filter: string, dataType: 'gpa' | 'points' = 'gpa') => {
      if (filter === 'all' || !data || data.length === 0) {
        return data
      }
      
      const currentYear = new Date().getFullYear()
      let startYear: number
      
      // Determine start year based on filter
      switch (filter) {
        case 'last_year':
          startYear = currentYear - 1
          break
        case 'last_2_years':
          startYear = currentYear - 2
          break
        case 'last_3_years':
          startYear = currentYear - 3
          break
        case 'last_5_years':
          startYear = currentYear - 5
          break
        default:
          return data
      }
      
      // Filter data within timeframe
      const filteredData = data.filter((item) => {
        if (!item.period) return false
        
        const yearMatch = item.period.match(/\d{4}/)
        if (!yearMatch) return false
        
        const year = parseInt(yearMatch[0])
        return year >= startYear
      })
      
      // Create map of existing data for quick lookup
      const dataMap = new Map<string, any>()
      filteredData.forEach(item => {
        if (item.period) {
          dataMap.set(item.period, item)
        }
      })
      
      // Generate all periods in timeframe (starting from x=0, which is the first period)
      // Semester order: Spring, Summer, Fall (academic year order)
      const filledData: any[] = []
      const semesterOrder = ['Spring', 'Summer', 'Fall', 'Winter']
      let lastKnownValue: any = null
      
      for (let year = startYear; year <= currentYear; year++) {
        for (const semester of semesterOrder) {
          const period = `${semester} ${year}`
          
          if (dataMap.has(period)) {
            // Use actual data
            const actualData = dataMap.get(period)
            filledData.push(actualData)
            lastKnownValue = actualData
          } else {
            // Fill gap: use previous value if available, otherwise use zero
            if (lastKnownValue) {
              // Continue line from last known value
              filledData.push({
                period,
                gpa: lastKnownValue.gpa || 0,
                credits: lastKnownValue.credits || 0,
                course_count: lastKnownValue.course_count || 0,
                points: lastKnownValue.points || 0,
                attempted_credits: lastKnownValue.attempted_credits || 0,
                earned_credits: lastKnownValue.earned_credits || 0
              })
            } else {
              // No previous data, start at zero (x=0)
              filledData.push({
                period,
                gpa: 0,
                credits: 0,
                course_count: 0,
                points: 0,
                attempted_credits: 0,
                earned_credits: 0
              })
            }
          }
        }
      }
      
      return filledData
    }
  }, [])
  
  // Apply filter to GPA trend
  const filteredGpaTrend = useMemo(() => {
    const filtered = filterByTime(displayAnalytics.gpa_trend || [], timeFilter, 'gpa')
    return showProjection ? projectionPresets.gpa(filtered) : filtered
  }, [displayAnalytics.gpa_trend, timeFilter, filterByTime, showProjection])
  
  // Sort function for academic calendar order: Fall, Spring, Summer
  const sortByAcademicSemesterOrder = (data: any[]) => {
    // Academic calendar order: Fall starts the year, then Spring, then Summer
    const semesterOrder = ['Fall', 'Spring', 'Summer', 'Winter', 'Unknown']
    
    // First, deduplicate by period (keep first occurrence)
    const seen = new Set<string>()
    const deduplicated = data.filter((item) => {
      const period = item.period || ''
      if (seen.has(period)) {
        return false
      }
      seen.add(period)
      return true
    })
    
    // Then sort by academic year and semester order (Fall, Spring, Summer)
    return deduplicated.sort((a, b) => {
      const periodA = a.period || ''
      const periodB = b.period || ''
      
      // Extract year and semester from period string
      const matchA = periodA.match(/(\w+)\s+(\d{4})/)
      const matchB = periodB.match(/(\w+)\s+(\d{4})/)
      
      if (!matchA || !matchB) return 0
      
      const semesterA = matchA[1]
      const semesterB = matchB[1]
      const yearA = parseInt(matchA[2])
      const yearB = parseInt(matchB[2])
      
      // Calculate academic year: Fall starts the academic year
      // Spring and Summer belong to the academic year that started in the previous Fall
      const academicYearA = (semesterA === 'Spring' || semesterA === 'Summer') ? yearA - 1 : yearA
      const academicYearB = (semesterB === 'Spring' || semesterB === 'Summer') ? yearB - 1 : yearB
      
      // First compare by academic year
      if (academicYearA !== academicYearB) {
        return academicYearA - academicYearB
      }
      
      // Then compare by semester order (Fall, Spring, Summer)
      const indexA = semesterOrder.indexOf(semesterA)
      const indexB = semesterOrder.indexOf(semesterB)
      
      // If semester not found in order, put it at the end
      if (indexA === -1 && indexB === -1) return 0
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      
      return indexA - indexB
    })
  }
  
  // Apply filter to points trend
  const filteredPointsTrend = useMemo(() => {
    const filtered = filterByTime(displayAnalytics.points_trend || [], timeFilter, 'points')
    const withProjection = showProjection ? projectionPresets.points(filtered) : filtered
    // Sort and ensure no duplicate periods
    const sorted = sortByAcademicSemesterOrder(withProjection)
    // Final deduplication pass to ensure no repeating labels
    const seen = new Set<string>()
    return sorted.filter((item) => {
      const period = item.period || ''
      if (seen.has(period)) {
        return false
      }
      seen.add(period)
      return true
    })
  }, [displayAnalytics.points_trend, timeFilter, filterByTime, showProjection])
  
  // Only show real courses - no demo courses, with search filtering (using debounced query)
  const displayCourses = useMemo(() => {
    const allCourses = courses || []
    if (!debouncedSearchQuery.trim()) {
      return allCourses
    }
    
    const query = debouncedSearchQuery.toLowerCase().trim()
    return allCourses.filter((course: any) => {
      const courseCode = (course.course_code || '').toLowerCase()
      const courseName = (course.course_name || '').toLowerCase()
      const grade = (course.grade || '').toLowerCase()
      const semester = (course.semester || '').toLowerCase()
      const year = course.year ? course.year.toString() : ''
      
      return (
        courseCode.includes(query) ||
        courseName.includes(query) ||
        grade.includes(query) ||
        semester.includes(query) ||
        year.includes(query)
      )
    })
  }, [courses, debouncedSearchQuery])
  
  // Filter out grades with 0 count
  const filteredGradeDistribution = useMemo(() => {
    return (displayAnalytics.grade_distribution || []).filter(grade => grade.count > 0)
  }, [displayAnalytics.grade_distribution])
  
  
  // Calculate course outliers (courses with C or below grade score)
  const courseOutliers = useMemo(() => {
    if (!displayCourses || displayCourses.length === 0) {
      return []
    }
    
    return displayCourses
      .filter((course: any) => {
        // Check if grade is C or below
        if (!course.grade) return false
        
        const grade = course.grade.toUpperCase().trim()
        
        // Check letter grades: C, C-, D+, D, D-, F
        if (grade.startsWith('C') || grade.startsWith('D') || grade.startsWith('F')) {
          return true
        }
        
        // Check grade_score if available (C- is 1.7, so <= 2.0 is C or below)
        if (course.grade_score !== null && course.grade_score !== undefined) {
          return parseFloat(course.grade_score) <= 2.0
        }
        
        return false
      })
      .sort((a: any, b: any) => {
        // Sort by grade_score (lowest first) or by grade letter
        const scoreA = a.grade_score !== null && a.grade_score !== undefined ? parseFloat(a.grade_score) : 0
        const scoreB = b.grade_score !== null && b.grade_score !== undefined ? parseFloat(b.grade_score) : 0
        return scoreA - scoreB
      })
      .slice(0, 5) // Show top 5 struggling courses
  }, [displayCourses])
  
  // Calculate insights
  const insights = useMemo(() => {
    const gpaTrend = displayAnalytics.gpa_trend || []
    if (gpaTrend.length === 0) {
      return {
        gpaChange: 0,
        avgCreditsPerSemester: 0,
        bestSemester: { gpa: 0, period: 'N/A' },
        worstSemester: { gpa: 0, period: 'N/A' },
        isImproving: false,
        topDepartment: null,
        courseOutliersCount: 0,
        gpaTrendInsights: [],
      }
    }
    
    const gpaChange = gpaTrend.length > 1 
      ? gpaTrend[gpaTrend.length - 1].gpa - gpaTrend[0].gpa 
      : 0
    const avgCreditsPerSemester = displayAnalytics.total_credits / (gpaTrend.length || 1)
    const bestSemester = gpaTrend.reduce((best, current) => 
      current.gpa > best.gpa ? current : best, gpaTrend[0])
    const worstSemester = gpaTrend.reduce((worst, current) => 
      current.gpa < worst.gpa ? current : worst, gpaTrend[0])
    
    // Calculate GPA trend insights
    const gpaTrendInsights: string[] = []
    
    // Overall trend
    if (gpaTrend.length >= 2) {
      const firstGpa = gpaTrend[0].gpa
      const lastGpa = gpaTrend[gpaTrend.length - 1].gpa
      const overallChange = lastGpa - firstGpa
      
      if (overallChange > 0.3) {
        gpaTrendInsights.push(`Strong upward trend: GPA improved by ${overallChange.toFixed(2)} points`)
      } else if (overallChange > 0.1) {
        gpaTrendInsights.push(`Steady improvement: GPA increased by ${overallChange.toFixed(2)} points`)
      } else if (overallChange < -0.3) {
        gpaTrendInsights.push(`Declining trend: GPA decreased by ${Math.abs(overallChange).toFixed(2)} points`)
      } else if (overallChange < -0.1) {
        gpaTrendInsights.push(`Slight decline: GPA decreased by ${Math.abs(overallChange).toFixed(2)} points`)
      } else {
        gpaTrendInsights.push(`Stable performance: GPA remained consistent (${overallChange.toFixed(2)} change)`)
      }
    }
    
    // Recent trend (last 3 semesters)
    if (gpaTrend.length >= 3) {
      const recentTrend = gpaTrend.slice(-3)
      const recentChange = recentTrend[recentTrend.length - 1].gpa - recentTrend[0].gpa
      
      if (recentChange > 0.2) {
        gpaTrendInsights.push(`Recent improvement: Last 3 semesters show ${recentChange.toFixed(2)} point increase`)
      } else if (recentChange < -0.2) {
        gpaTrendInsights.push(`Recent decline: Last 3 semesters show ${Math.abs(recentChange).toFixed(2)} point decrease`)
      }
    }
    
    // Consistency check
    if (gpaTrend.length >= 3) {
      const gpas = gpaTrend.map(point => point.gpa)
      const maxGpa = Math.max(...gpas)
      const minGpa = Math.min(...gpas)
      const variance = maxGpa - minGpa
      
      if (variance < 0.2) {
        gpaTrendInsights.push(`Highly consistent: GPA variance of only ${variance.toFixed(2)} points`)
      } else if (variance > 0.5) {
        gpaTrendInsights.push(`Variable performance: GPA fluctuates by ${variance.toFixed(2)} points`)
      }
    }
    
    // Best vs worst comparison
    if (bestSemester.gpa > 0 && worstSemester.gpa > 0 && bestSemester.period !== worstSemester.period) {
      const gap = bestSemester.gpa - worstSemester.gpa
      if (gap > 0.5) {
        gpaTrendInsights.push(`Significant variation: ${gap.toFixed(2)} point gap between best (${bestSemester.period}) and worst (${worstSemester.period}) semesters`)
      }
    }
    
    return {
      gpaChange,
      avgCreditsPerSemester,
      bestSemester,
      worstSemester,
      isImproving: gpaChange > 0,
      topDepartment: displayAnalytics.course_distribution_by_department?.[0] || null,
      courseOutliersCount: courseOutliers.length,
      gpaTrendInsights,
    }
  }, [displayAnalytics, courseOutliers])
  
  // Calculate courses for best semester
  const bestSemesterCourses = useMemo(() => {
    if (!insights.bestSemester || !displayCourses || displayCourses.length === 0) {
      return []
    }
    
    const bestPeriod = insights.bestSemester.period
    if (!bestPeriod || bestPeriod === 'N/A') {
      return []
    }
    
    // Filter courses from the best semester period
    return displayCourses
      .filter((course: any) => {
        if (!course.semester || !course.year) return false
        const coursePeriod = `${course.semester} ${course.year}`
        return coursePeriod === bestPeriod
      })
      .map((course: any) => course.course_code)
      .filter((code: string) => code) // Remove any null/undefined codes
      .slice(0, 5) // Show up to 5 course codes
  }, [insights.bestSemester, displayCourses])
  
  // Calculate best scoring courses from top department (after insights is defined)
  const topDepartmentBestCourses = useMemo(() => {
    const topDept = insights.topDepartment
    if (!topDept || !displayCourses || displayCourses.length === 0) {
      return []
    }
    
    // Extract department code from top department category (e.g., "CS" from "CS")
    const deptCode = topDept.category
    
    // Filter courses from this department and sort by grade_score (highest first)
    return displayCourses
      .filter((course: any) => {
        if (!course.course_code) return false
        // Extract department from course code (e.g., "CS 101" -> "CS")
        const courseDept = course.course_code.split(' ')[0]
        return courseDept === deptCode
      })
      .filter((course: any) => {
        // Only include courses with valid grades
        return course.grade_score !== null && course.grade_score !== undefined
      })
      .sort((a: any, b: any) => {
        const scoreA = parseFloat(a.grade_score) || 0
        const scoreB = parseFloat(b.grade_score) || 0
        return scoreB - scoreA // Highest first
      })
      .slice(0, 3) // Show top 3 best courses
  }, [insights.topDepartment, displayCourses])

  if (isLoading && !hasNoData) {
    return (
      <main className="min-h-screen spacing-responsive bg-white dark:bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-900 dark:text-white">Loading analytics...</p>
        </div>
      </main>
    )
  }


  return (
    <main className="min-h-screen bg-white dark:bg-black content-with-nav">
      {/* Minimal Header */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/dashboard" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2">
              <span>←</span>
              <span>Back</span>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                href="/profile"
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
              >
                <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.first_name} {user?.last_name}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Academic Analysis</h1>
          <span className="text-sm font-semibold text-primary-500">ΣΝ</span>
        </div>

        <SummaryCards
          hasNoData={hasNoData}
          overallGpa={displayAnalytics.overall_gpa}
          totalCredits={displayAnalytics.total_credits}
          totalCourses={displayAnalytics.total_courses}
          avgCreditsPerSemester={insights.avgCreditsPerSemester}
          departmentCount={displayAnalytics.course_distribution_by_department?.length || 0}
        />

        <CreditProgressBar
          hasNoData={hasNoData}
          totalCredits={displayAnalytics.total_credits}
          avgCreditsPerSemester={insights.avgCreditsPerSemester}
        />

        <PerformanceInsights
          hasNoData={hasNoData}
          insights={insights}
          bestSemesterCourses={bestSemesterCourses}
          topDepartmentBestCourses={topDepartmentBestCourses}
          courseOutliers={courseOutliers}
        />

        <AcademicAnalysis
          hasNoData={hasNoData}
          overallGpa={displayAnalytics.overall_gpa}
          insights={insights}
          filteredGradeDistribution={filteredGradeDistribution}
        />

        <Suspense fallback={<ChartLoader />}>
          <GPATrendChart
            data={filteredGpaTrend}
            showProjection={showProjection}
            timeFilter={timeFilter}
            onTimeFilterChange={setTimeFilter}
            onProjectionToggle={setShowProjection}
          />
        </Suspense>
        
        <Suspense fallback={<ChartLoader />}>
          <GradeDistributionChart
            data={filteredGradeDistribution}
            hasNoData={hasNoData}
          />
        </Suspense>

        <CoursesTable
          courses={displayCourses}
          searchQuery={courseSearchQuery}
          onSearchChange={setCourseSearchQuery}
        />

        {/* Course Distribution - Always show */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <Suspense fallback={<ChartLoader />}>
            <CourseDistributionChart
              data={displayAnalytics.course_distribution_by_department || []}
              hasNoData={hasNoData}
            />
          </Suspense>
          <Suspense fallback={<ChartLoader />}>
            <PointsTrendChart
              data={filteredPointsTrend}
              hasNoData={hasNoData}
              showProjection={showProjection}
              timeFilter={timeFilter}
              onTimeFilterChange={setTimeFilter}
              onProjectionToggle={setShowProjection}
            />
          </Suspense>
        </div>
        
        <Suspense fallback={<ChartLoader />}>
          <CreditsBySemesterChart
            data={displayAnalytics.credits_by_semester || []}
            hasNoData={hasNoData}
          />
        </Suspense>
      </div>
    </main>
  )
}

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <AnalyticsContent />
    </ProtectedRoute>
  )
}

