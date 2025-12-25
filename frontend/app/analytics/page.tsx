'use client'

import { useMemo, useState } from 'react'
import { useAcademicAnalytics } from '@/lib/hooks/useAnalytics'
import { useCourses } from '@/lib/hooks/useCourses'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import Link from 'next/link'
import { Search, User } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280']

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

// Demo courses data commented out - replaced with empty array
const demoCourses: any[] = []

function AnalyticsContent() {
  const { user } = useAuth()
  const { data: analytics, isLoading, error } = useAcademicAnalytics()
  const { data: courses } = useCourses()
  const [timeFilter, setTimeFilter] = useState<string>('all') // Filter state for line graphs
  const [courseSearchQuery, setCourseSearchQuery] = useState<string>('') // Search state for courses table
  
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
    return filterByTime(displayAnalytics.gpa_trend || [], timeFilter, 'gpa')
  }, [displayAnalytics.gpa_trend, timeFilter, filterByTime])
  
  // Apply filter to points trend
  const filteredPointsTrend = useMemo(() => {
    return filterByTime(displayAnalytics.points_trend || [], timeFilter, 'points')
  }, [displayAnalytics.points_trend, timeFilter, filterByTime])
  
  // Only show real courses - no demo courses, with search filtering
  const displayCourses = useMemo(() => {
    const allCourses = courses || []
    if (!courseSearchQuery.trim()) {
      return allCourses
    }
    
    const query = courseSearchQuery.toLowerCase().trim()
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
  }, [courses, courseSearchQuery])
  
  // Filter out grades with 0 count
  const filteredGradeDistribution = useMemo(() => {
    return (displayAnalytics.grade_distribution || []).filter(grade => grade.count > 0)
  }, [displayAnalytics.grade_distribution])
  
  // Get grade color for table
  const getGradeColor = (grade: string | null) => {
    if (!grade) return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50'
    if (grade.startsWith('A')) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
    if (grade.startsWith('B')) return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
    if (grade.startsWith('C')) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
    return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50'
  }
  
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
      <main className="min-h-screen p-8 bg-white dark:bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-900 dark:text-white">Loading analytics...</p>
        </div>
      </main>
    )
  }


  return (
    <main className="min-h-screen p-8 bg-white dark:bg-[#1a1a1a]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
            ← Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/profile"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              {user?.first_name} {user?.last_name}
            </Link>
            <Link
              href="/profile"
              className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center"
              title="Profile"
            >
              <User className="w-5 h-5" />
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Detailed Academic Analysis</h1>
            <span className="text-xl font-semibold text-primary-600 dark:text-primary-400">ΣΝ</span>
          </div>
        </div>

        {/* Summary Cards - Always show */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {hasNoData ? (
            <>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 shadow-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Overall GPA</p>
                <p className="text-4xl font-bold text-gray-400 dark:text-gray-500">-</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">No data available</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 shadow-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Credits</p>
                <p className="text-4xl font-bold text-gray-400 dark:text-gray-500">-</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">No data available</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 shadow-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Courses</p>
                <p className="text-4xl font-bold text-gray-400 dark:text-gray-500">-</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">No data available</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-[#d97706] dark:bg-gray-800 rounded-lg p-6 shadow-xl">
                <p className="text-sm text-primary-100 dark:text-gray-400 mb-2">Overall GPA</p>
                <p className="text-4xl font-bold text-white dark:text-white">{displayAnalytics.overall_gpa.toFixed(2)}</p>
                <p className="text-xs text-primary-200 dark:text-gray-500 mt-2">
                  {displayAnalytics.overall_gpa >= 3.5 ? 'Excellent' : displayAnalytics.overall_gpa >= 3.0 ? 'Good' : 'Needs Improvement'}
                </p>
              </div>
              <div className="bg-[#d97706] dark:bg-gray-800 rounded-lg p-6 shadow-xl">
                <p className="text-sm text-primary-100 dark:text-gray-400 mb-2">Total Credits</p>
                <p className="text-4xl font-bold text-white dark:text-white">{displayAnalytics.total_credits}</p>
                <p className="text-xs text-primary-200 dark:text-gray-500 mt-2">
                  Avg: {insights.avgCreditsPerSemester.toFixed(1)} per semester
                </p>
              </div>
              <div className="bg-[#d97706] dark:bg-gray-800 rounded-lg p-6 shadow-xl">
                <p className="text-sm text-primary-100 dark:text-gray-400 mb-2">Total Courses</p>
                <p className="text-4xl font-bold text-white dark:text-white">{displayAnalytics.total_courses}</p>
                <p className="text-xs text-primary-200 dark:text-gray-500 mt-2">
                  {displayAnalytics.course_distribution_by_department?.length || 0} departments
                </p>
              </div>
            </>
          )}
        </div>

        {/* Credit Progress Bar - Always show */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-xl">
          {hasNoData ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No degree progress data available</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Upload your transcript to track your progress towards graduation</p>
            </div>
          ) : (
            <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Degree Progress</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Progress towards undergraduate degree (120 credits required)
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {((displayAnalytics.total_credits / 120) * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {displayAnalytics.total_credits} / 120 credits
              </p>
            </div>
          </div>
          
          <div className="relative w-full h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#d97706] to-[#f59e0b] dark:from-primary-600 dark:to-primary-500 rounded-full transition-all duration-500 ease-out shadow-lg flex items-center justify-end pr-2"
              style={{ width: `${Math.min((displayAnalytics.total_credits / 120) * 100, 100)}%` }}
            >
              {displayAnalytics.total_credits >= 10 && (
                <span className="text-xs font-bold text-white">
                  {displayAnalytics.total_credits} credits
                </span>
              )}
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
            <div className="text-center">
              <p className="font-semibold text-gray-700 dark:text-gray-300">Freshman</p>
              <p className="text-gray-500 dark:text-gray-400">0-30</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700 dark:text-gray-300">Sophomore</p>
              <p className="text-gray-500 dark:text-gray-400">31-60</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700 dark:text-gray-300">Junior</p>
              <p className="text-gray-500 dark:text-gray-400">61-90</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700 dark:text-gray-300">Senior</p>
              <p className="text-gray-500 dark:text-gray-400">91-120</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Remaining Credits:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {Math.max(0, 120 - displayAnalytics.total_credits).toFixed(1)} credits
              </span>
            </div>
            {displayAnalytics.total_credits < 120 && (
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Estimated Semesters Remaining:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {Math.ceil((120 - displayAnalytics.total_credits) / insights.avgCreditsPerSemester)} semesters
                </span>
              </div>
            )}
            {displayAnalytics.total_credits >= 120 && (
              <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/30 rounded text-center">
                <span className="text-green-800 dark:text-green-300 font-semibold">
                  🎓 Congratulations! You've completed the credit requirement for graduation!
                </span>
              </div>
            )}
          </div>
            </>
          )}
        </div>

        {/* Performance Insights - Always show */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-xl">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Performance Insights</h2>
          {hasNoData ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No performance insights available</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Upload your transcript to see GPA trends and performance metrics</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">GPA Trend</p>
              <p className={`text-2xl font-bold ${insights.isImproving ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {insights.isImproving ? '↑' : '↓'} {Math.abs(insights.gpaChange).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {insights.isImproving ? 'Improving' : 'Declining'} over time
              </p>
              {insights.gpaTrendInsights && insights.gpaTrendInsights.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Insights:</p>
                  <div className="space-y-1">
                    {insights.gpaTrendInsights.slice(0, 2).map((insight: string, index: number) => (
                      <p key={index} className="text-xs text-gray-600 dark:text-gray-400">
                        • {insight}
                      </p>
                    ))}
                    {insights.gpaTrendInsights.length > 2 && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                        +{insights.gpaTrendInsights.length - 2} more
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Best Semester</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{insights.bestSemester.period}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                GPA: {insights.bestSemester.gpa.toFixed(2)}
              </p>
              {bestSemesterCourses.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Courses:</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {bestSemesterCourses.join(', ')}
                    {bestSemesterCourses.length >= 5 && '...'}
                  </p>
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Top Department</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {insights.topDepartment?.category || 'N/A'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {insights.topDepartment?.count || 0} courses ({insights.topDepartment?.percentage.toFixed(1) || 0}%)
              </p>
              {topDepartmentBestCourses.length > 0 && (
                <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Best Courses:</p>
                  <div className="space-y-1">
                    {topDepartmentBestCourses.map((course: any, index: number) => (
                      <p key={index} className="text-xs text-blue-600 dark:text-blue-400">
                        • {course.course_code}: {course.grade || 'N/A'} 
                        {course.grade_score && ` (${parseFloat(course.grade_score).toFixed(1)})`}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 mb-1 font-semibold">Course Outliers</p>
              {courseOutliers.length > 0 ? (
                <>
                  <p className="text-xl font-bold text-red-900 dark:text-red-300">
                    {courseOutliers.length} {courseOutliers.length === 1 ? 'Course' : 'Courses'}
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                    Struggling (C or below)
                  </p>
                  <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-700 space-y-1">
                    {courseOutliers.slice(0, 3).map((course: any, index: number) => (
                      <p key={index} className="text-xs text-red-600 dark:text-red-400">
                        • {course.course_code}: {course.grade || 'N/A'}
                      </p>
                    ))}
                    {courseOutliers.length > 3 && (
                      <p className="text-xs text-red-600 dark:text-red-400 italic">
                        +{courseOutliers.length - 3} more
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold text-green-900 dark:text-green-300">
                    None
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                    All courses above C grade
                  </p>
                </>
              )}
            </div>
          </div>
          )}
        </div>

        {/* Detailed Analysis Section - Always show */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-xl">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Academic Analysis</h2>
          {hasNoData ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No academic analysis available</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Upload your transcript to see detailed academic insights and recommendations</p>
            </div>
          ) : (
            <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Strengths</h3>
              <ul className="list-disc list-inside text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>Strong performance in {insights.topDepartment?.category || 'core'} courses ({insights.topDepartment?.percentage.toFixed(1) || 0}% of coursework)</li>
                <li>{filteredGradeDistribution.find(g => g.grade === 'A')?.percentage.toFixed(1) || 0}% of courses completed with an A grade</li>
                <li>Consistent credit load averaging {insights.avgCreditsPerSemester.toFixed(1)} credits per semester</li>
                {insights.isImproving && <li>Positive GPA trend showing continuous improvement</li>}
              </ul>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">Areas for Improvement</h3>
              <ul className="list-disc list-inside text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                {displayAnalytics.overall_gpa < 3.5 && <li>Overall GPA below 3.5 - focus on maintaining higher grades</li>}
                {filteredGradeDistribution.find(g => g.grade === 'C') && (
                  <li>{filteredGradeDistribution.find(g => g.grade === 'C')?.percentage.toFixed(1) || 0}% of courses with C grades - consider additional study support</li>
                )}
                {insights.worstSemester.gpa < insights.bestSemester.gpa && (
                  <li>Performance varied between semesters - identify factors affecting {insights.worstSemester.period}</li>
                )}
              </ul>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
              <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2">Recommendations</h3>
              <ul className="list-disc list-inside text-sm text-green-800 dark:text-green-200 space-y-1">
                <li>Continue focusing on {insights.topDepartment?.category || 'your strongest'} department courses</li>
                <li>Maintain current credit load for optimal performance</li>
                <li>Consider seeking help from brothers who excelled in challenging courses</li>
                <li>Build on the momentum from {insights.bestSemester.period} semester</li>
              </ul>
            </div>
          </div>
          )}
        </div>

        {/* GPA Trend Over Time - Always show */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">GPA Trend Over Time</h2>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
            >
              <option value="all">All Time</option>
              <option value="last_year">Last Year</option>
              <option value="last_2_years">Last 2 Years</option>
              <option value="last_3_years">Last 3 Years</option>
              <option value="last_5_years">Last 5 Years</option>
            </select>
          </div>
          {filteredGpaTrend.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No GPA trend data available</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Upload your transcript to see your GPA progression over time</p>
            </div>
          ) : (
            <div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={filteredGpaTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis 
                  dataKey="period" 
                  stroke="#6b7280"
                  className="dark:text-gray-400"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  domain={[0, 4.0]}
                  stroke="#6b7280"
                  className="dark:text-gray-400"
                  tick={{ fill: 'currentColor' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="gpa" 
                  stroke="#f59e0b" 
                  strokeWidth={3}
                  name="GPA"
                  dot={{ fill: '#f59e0b', r: 5 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Grade Distribution Bar Chart - Always show */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-xl">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Grade Distribution</h2>
          {hasNoData || filteredGradeDistribution.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No grade distribution data available</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Upload your transcript to see your grade distribution</p>
            </div>
          ) : (
            <div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredGradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis 
                  dataKey="grade" 
                  stroke="#6b7280"
                  className="dark:text-gray-400"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  className="dark:text-gray-400"
                  tick={{ fill: 'currentColor' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill="#f59e0b" name="Number of Courses" />
              </BarChart>
            </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Courses Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">All Courses</h2>
          </div>
          
          {/* Search Input */}
          {displayCourses && displayCourses.length > 0 && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search courses by code, name, grade, semester, or year..."
                  value={courseSearchQuery}
                  onChange={(e) => setCourseSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                />
              </div>
            </div>
          )}
          
          {displayCourses && displayCourses.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-[#d97706] dark:bg-gray-700 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white dark:text-white border-b border-primary-300 dark:border-gray-600">
                        Course Code
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white dark:text-white border-b border-primary-300 dark:border-gray-600">
                        Course Name
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-white dark:text-white border-b border-primary-300 dark:border-gray-600">
                        Grade
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-white dark:text-white border-b border-primary-300 dark:border-gray-600">
                        Credits
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-white dark:text-white border-b border-primary-300 dark:border-gray-600">
                        Semester
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-white dark:text-white border-b border-primary-300 dark:border-gray-600">
                        Year
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800">
                    {displayCourses.map((course, index) => (
                      <tr 
                        key={course.id || index}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {course.course_code}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {course.course_name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {course.grade ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(course.grade)}`}>
                              {course.grade}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                          {course.credit_hours ? course.credit_hours.toFixed(1) : '-'}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                          {course.semester || '-'}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                          {course.year || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
                {courseSearchQuery ? (
                  <span>
                    Showing {displayCourses.length} of {courses?.length || 0} course{courses?.length !== 1 ? 's' : ''}
                  </span>
                ) : (
                  <span>
                    Total: {displayCourses.length} course{displayCourses.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Courses Found</p>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Upload your transcript to see your courses and grades.</p>
              <Link
                href="/upload"
                className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl font-medium"
              >
                Upload Transcript
              </Link>
            </div>
          )}
        </div>

        {/* Course Distribution - Always show */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {hasNoData || !displayAnalytics.course_distribution_by_department || displayAnalytics.course_distribution_by_department.length === 0 ? (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Courses by Department</h2>
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 mb-2">No department data available</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Upload your transcript to see course distribution</p>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Courses by Level</h2>
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 mb-2">No level data available</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Upload your transcript to see course distribution</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
                <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Courses by Department</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={displayAnalytics.course_distribution_by_department}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="category" 
                    stroke="#6b7280"
                    className="dark:text-gray-400"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    className="dark:text-gray-400"
                    tick={{ fill: 'currentColor' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#8b5cf6" name="Number of Courses" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Points Trend Over Time</h2>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
                >
                  <option value="all">All Time</option>
                  <option value="last_year">Last Year</option>
                  <option value="last_2_years">Last 2 Years</option>
                  <option value="last_3_years">Last 3 Years</option>
                  <option value="last_5_years">Last 5 Years</option>
                </select>
              </div>
              {hasNoData || !filteredPointsTrend || filteredPointsTrend.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 mb-2">No points trend data available</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Upload your transcript to see your points progression over time</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={filteredPointsTrend} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <XAxis 
                      dataKey="period" 
                      stroke="#6b7280"
                      className="dark:text-gray-400"
                      tick={{ fill: 'currentColor' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="#6b7280"
                      className="dark:text-gray-400"
                      tick={{ fill: 'currentColor' }}
                      label={{ value: 'Points', angle: -90, position: 'insideLeft' }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="#6b7280"
                      className="dark:text-gray-400"
                      tick={{ fill: 'currentColor' }}
                      label={{ value: 'Credits', angle: 90, position: 'insideRight' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ paddingTop: '20px', paddingBottom: '5px' }}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="points" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      name="Total Points"
                      dot={{ fill: '#10b981', r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="attempted_credits" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Attempted Credits"
                      dot={{ fill: '#3b82f6', r: 4 }}
                      strokeDasharray="5 5"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="earned_credits" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      name="Earned Credits"
                      dot={{ fill: '#f59e0b', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            </>
          )}
        </div>

        {/* Credits by Semester - Always show */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-xl">
          {hasNoData || displayAnalytics.credits_by_semester.length === 0 ? (
            <div>
              <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Credits by Semester</h2>
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No semester credit data available</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Upload your transcript to see your credit progression by semester</p>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Credits Earned Over Time</h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={displayAnalytics.credits_by_semester}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="period" 
                    stroke="#6b7280"
                    className="dark:text-gray-400"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    className="dark:text-gray-400"
                    tick={{ fill: 'currentColor' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="credits" fill="#3b82f6" name="Credits" />
                  <Legend 
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ paddingTop: '20px', paddingBottom: '5px' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
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

