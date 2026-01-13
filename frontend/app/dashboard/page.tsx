'use client'

import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAcademicAnalytics } from '@/lib/hooks/useAnalytics'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useMajorMatchBrothers, useGroupStudyBrothers } from '@/lib/hooks/useHelpRequests'
import { useCourses } from '@/lib/hooks/useCourses'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { CalendarWidget } from '@/components/dashboard/CalendarWidget'
import { CurrentCourses } from '@/components/dashboard/CurrentCourses'
import { GroupStudyRecommendations } from '@/components/dashboard/GroupStudyRecommendations'
import { BrothersInMajor } from '@/components/dashboard/BrothersInMajor'
import { SummaryStats } from '@/components/dashboard/SummaryStats'
import { AcademicTrendsChart } from '@/components/dashboard/AcademicTrendsChart'
import { GradeDistributionBarChart } from '@/components/dashboard/GradeDistributionBarChart'
import { CreditsEarnedChart } from '@/components/dashboard/CreditsEarnedChart'
import { GradeDistributionPieChart } from '@/components/dashboard/GradeDistributionPieChart'
import { CourseDistributionChart } from '@/components/dashboard/CourseDistributionChart'
import { PointsTrendChart } from '@/components/dashboard/PointsTrendChart'

// Force dynamic rendering to avoid SSR issues with theme
export const dynamic = 'force-dynamic'

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

// Demo data for group study recommendations (for testing)
const demoGroupStudyBrothers = [
  {
    helper_id: 'demo-1',
    helper_name: 'John Smith',
    helper_email: 'john.smith@example.com',
    helper_phone_number: '(555) 123-4567',
    shared_courses: ['CS 101', 'MATH 201', 'PHYS 150'],
    total_shared_courses: 3,
    major: 'Computer Science',
    graduation_year: 2025,
    pledge_class: 'Alpha',
    year_in_college: 'Junior',
  },
  {
    helper_id: 'demo-2',
    helper_name: 'Michael Johnson',
    helper_email: 'michael.j@example.com',
    helper_phone_number: '(555) 234-5678',
    shared_courses: ['CS 101', 'MATH 201'],
    total_shared_courses: 2,
    major: 'Computer Science',
    graduation_year: 2026,
    pledge_class: 'Beta',
    year_in_college: 'Sophomore',
  },
  {
    helper_id: 'demo-3',
    helper_name: 'David Williams',
    helper_email: 'david.w@example.com',
    helper_phone_number: null,
    shared_courses: ['PHYS 150', 'CHEM 101'],
    total_shared_courses: 2,
    major: 'Physics',
    graduation_year: 2025,
    pledge_class: 'Alpha',
    year_in_college: 'Junior',
  },
]

function DashboardContent() {
  const { user } = useAuth()
  const { data: analytics } = useAcademicAnalytics()
  const { data: majorMatchBrothers, isLoading: isLoadingMajorMatch, error: majorMatchError } = useMajorMatchBrothers(6)
  const { data: groupStudyBrothers, isLoading: isLoadingGroupStudy, error: groupStudyError } = useGroupStudyBrothers(6)
  const { data: courses } = useCourses()
  
  // Filter to only show manually added courses (current courses)
  const currentCourses = useMemo(() => {
    return courses?.filter(course => !course.transcript_id) || []
  }, [courses])
  
  // Use demo data for testing if no real data is available
  const displayGroupStudyBrothers = useMemo(() => {
    // For testing: use demo data if no real data (always show for testing)
    if (!groupStudyBrothers || groupStudyBrothers.length === 0) {
      return demoGroupStudyBrothers
    }
    return groupStudyBrothers
  }, [groupStudyBrothers])
  
  // Only show real data - no demo data
  const displayAnalytics = useMemo(() => {
    return analytics || demoAnalytics
  }, [analytics])
  
  const hasNoData = !analytics || (analytics?.total_courses ?? 0) === 0
  
  // Filter out grades with 0 count for pie chart
  const filteredGradeDistribution = useMemo(() => {
    return (displayAnalytics.grade_distribution || []).filter(grade => grade.count > 0)
  }, [displayAnalytics.grade_distribution])

  return (
    <main className="min-h-screen bg-white dark:bg-black content-with-nav">
      <DashboardHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <QuickActions />

        <CalendarWidget />

        <CurrentCourses courses={currentCourses} />

        {/* Brothers in Major and Group Study Recommendations - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <BrothersInMajor 
            major={user?.major || ''}
            brothers={majorMatchBrothers}
            isLoading={isLoadingMajorMatch}
            error={majorMatchError}
          />
          <GroupStudyRecommendations
            brothers={displayGroupStudyBrothers}
            isLoading={isLoadingGroupStudy}
            error={groupStudyError}
            userMajor={user?.major}
            currentCourses={currentCourses}
          />
        </div>

        {/* Academic Analytics Section - Always show */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Academic Performance</h2>
            <span className="text-sm font-semibold text-primary-500">ΣΝ</span>
          </div>

          <SummaryStats
            overallGpa={displayAnalytics.overall_gpa}
            totalCredits={displayAnalytics.total_credits}
            totalCourses={displayAnalytics.total_courses}
            departmentCount={displayAnalytics.course_distribution_by_department?.length || 0}
            hasNoData={hasNoData}
          />

          <AcademicTrendsChart 
            data={displayAnalytics.gpa_trend || []}
            hasNoData={hasNoData}
          />

          {/* Grade Distribution and Credits Side by Side - Always show */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            <GradeDistributionBarChart 
              data={filteredGradeDistribution}
              hasNoData={hasNoData}
            />
            <CreditsEarnedChart 
              data={displayAnalytics.credits_by_semester || []}
              hasNoData={hasNoData}
            />
          </div>

          <GradeDistributionPieChart 
            data={filteredGradeDistribution}
            hasNoData={hasNoData}
          />

          {/* Classes Distribution Section - Always show */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            <CourseDistributionChart 
              data={displayAnalytics.course_distribution_by_department || []}
              hasNoData={hasNoData}
            />
            <PointsTrendChart 
              data={displayAnalytics.points_trend || []}
              hasNoData={hasNoData}
            />
          </div>
        </div>
      </div>
    </main>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
