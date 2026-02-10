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
  helper_phone_number: string | null
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
  helper_phone_number: string | null
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
  helper_phone_number: string | null
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

export interface MajorMatchBrother {
  helper_id: string
  helper_name: string
  helper_email: string | null
  helper_phone_number: string | null
  major: string | null
  graduation_year: number | null
  pledge_class: string | null
  total_courses: number
  average_grade_score: number
  total_credits: number
  year_in_college: string | null
}

export interface GroupStudyBrother {
  helper_id: string
  helper_name: string
  helper_email: string | null
  helper_phone_number: string | null
  shared_courses: string[]
  total_shared_courses: number
  major: string | null
  graduation_year: number | null
  pledge_class: string | null
  year_in_college: string | null
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

export const useDeleteHelpRequest = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (requestId: string) => {
      await api.delete(`/help-requests/${requestId}`)
    },
    onSuccess: () => {
      // Invalidate help requests list to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['help-requests'] })
      // Also invalidate related queries that might be affected
      queryClient.invalidateQueries({ queryKey: ['previous-tutors'] })
      queryClient.invalidateQueries({ queryKey: ['connected-brothers'] })
    },
  })
}

export const useMajorMatchBrothers = (limit: number = 10) => {
  return useQuery<MajorMatchBrother[]>({
    queryKey: ['major-match-brothers', limit],
    queryFn: async () => {
      const response = await api.get(`/recommendations/by-major?limit=${limit}`)
      return response.data || []
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes - cache for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus for better performance
  })
}

export const useGroupStudyBrothers = (limit: number = 10) => {
  return useQuery<GroupStudyBrother[]>({
    queryKey: ['group-study-brothers', limit],
    queryFn: async () => {
      const response = await api.get(`/recommendations/group-study?limit=${limit}`)
      return response.data || []
    },
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes - cache for 2 minutes (shorter since current courses change more frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache for 5 minutes
    refetchOnWindowFocus: false,
  })
}

