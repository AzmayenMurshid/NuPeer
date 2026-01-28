import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { shouldUseDemoData, getDemoDataAsync, getDemoData } from '../demoData'

export interface Course {
  id: string
  course_code: string
  course_name: string | null
  grade: string | null
  grade_score: number | null
  credit_hours: number | null
  semester: string | null
  year: number | null
  transcript_id?: string | null  // Nullable for manually added courses
}

export interface CourseCreate {
  course_code: string
  course_name?: string
  credit_hours?: number
  semester?: string
  year?: number
  grade?: string
}

export const useCourses = () => {
  return useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      if (shouldUseDemoData()) {
        return getDemoDataAsync(getDemoData().courses)
      }
      try {
        const response = await api.get('/courses')
        return response.data
      } catch (error) {
        console.warn('API failed, using demo data:', error)
        return getDemoDataAsync(getDemoData().courses)
      }
    },
  })
}

export const useCreateCourse = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (courseData: CourseCreate) => {
      const response = await api.post('/courses', courseData)
      return response.data
    },
    onSuccess: () => {
      // Invalidate courses query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      // Also invalidate analytics since courses affect analytics
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export const useUpdateCourse = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ courseId, courseData }: { courseId: string; courseData: CourseCreate }) => {
      const response = await api.put(`/courses/${courseId}`, courseData)
      return response.data
    },
    onSuccess: () => {
      // Invalidate courses query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      // Also invalidate analytics since courses affect analytics
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export const useDeleteCourse = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (courseId: string) => {
      await api.delete(`/courses/${courseId}`)
    },
    onSuccess: () => {
      // Invalidate courses query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      // Also invalidate analytics since courses affect analytics
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

