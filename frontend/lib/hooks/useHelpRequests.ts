import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

export interface HelpRequest {
  id: string
  course_code: string
  course_name: string | null
  status: string
  created_at: string
}

export interface Recommendation {
  helper_id: string
  helper_name: string
  helper_email: string | null
  course_code: string
  grade: string
  grade_score: number
  semester: string | null
  year: number | null
  rank: number
}

export interface PreviousTutor {
  helper_id: string
  helper_name: string
  helper_email: string | null
  course_code: string
  grade: string
  grade_score: number
  semester: string | null
  year: number | null
  help_request_id: string
  help_request_date: string
}

export interface ConnectedBrother {
  helper_id: string
  helper_name: string
  helper_email: string | null
  courses_helped: Array<{
    course_code: string
    grade: string
    grade_score: number
    semester: string | null
    year: number | null
    help_request_date: string
  }>
  total_courses: number
  first_connected: string
  last_connected: string
}

export interface CreateHelpRequest {
  course_code: string
  course_name?: string
}

export const useHelpRequests = () => {
  return useQuery<HelpRequest[]>({
    queryKey: ['help-requests'],
    queryFn: async () => {
      const response = await api.get('/help-requests')
      return response.data
    },
  })
}

export const useCreateHelpRequest = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateHelpRequest) => {
      const response = await api.post('/help-requests', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-requests'] })
    },
  })
}

export const useRecommendations = (requestId: string | null) => {
  return useQuery<Recommendation[]>({
    queryKey: ['recommendations', requestId],
    queryFn: async () => {
      if (!requestId) return []
      const response = await api.get(`/recommendations/${requestId}`)
      return response.data
    },
    enabled: !!requestId,
  })
}

export const usePreviousTutors = () => {
  return useQuery<PreviousTutor[]>({
    queryKey: ['previous-tutors'],
    queryFn: async () => {
      const response = await api.get('/recommendations/previous-tutors')
      return response.data
    },
  })
}

export const useConnectedBrothers = () => {
  return useQuery<ConnectedBrother[]>({
    queryKey: ['connected-brothers'],
    queryFn: async () => {
      const response = await api.get('/recommendations/connected-brothers')
      return response.data
    },
  })
}

