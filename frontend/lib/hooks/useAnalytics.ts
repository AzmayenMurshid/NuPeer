import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import { shouldUseDemoData, getDemoDataAsync, getDemoData } from '../demoData'

export interface GPATrendPoint {
  period: string
  gpa: number
  credits: number
  course_count: number
}

export interface GradeDistribution {
  grade: string
  count: number
  percentage: number
}

export interface CourseDistribution {
  category: string
  count: number
  percentage: number
}

export interface PointsTrendPoint {
  period: string
  points: number
  attempted_credits: number
  earned_credits: number
  course_count: number
}

export interface AcademicAnalytics {
  overall_gpa: number
  total_credits: number
  total_courses: number
  gpa_trend: GPATrendPoint[]
  grade_distribution: GradeDistribution[]
  credits_by_semester: GPATrendPoint[]
  course_distribution_by_department: CourseDistribution[]
  points_trend: PointsTrendPoint[]  // Replaces course_distribution_by_level
}

export const useAcademicAnalytics = () => {
  return useQuery<AcademicAnalytics>({
    queryKey: ['academic-analytics'],
    queryFn: async () => {
      if (shouldUseDemoData()) {
        return getDemoDataAsync(getDemoData().academicAnalytics)
      }
      try {
        const response = await api.get('/analytics/academic-trends')
        return response.data
      } catch (error) {
        // Fallback to demo data on error
        console.warn('API failed, using demo data:', error)
        return getDemoDataAsync(getDemoData().academicAnalytics)
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Use cached data if available
  })
}

