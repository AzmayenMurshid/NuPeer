import { useQuery } from '@tanstack/react-query'
import { api } from '../api'

export interface Course {
  id: string
  course_code: string
  course_name: string | null
  grade: string | null
  grade_score: number | null
  credit_hours: number | null
  semester: string | null
  year: number | null
}

export const useCourses = () => {
  return useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await api.get('/courses')
      return response.data
    },
  })
}

