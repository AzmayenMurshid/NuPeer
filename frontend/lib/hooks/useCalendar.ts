import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

export type EventType = 'tutoring' | 'group_study'

export interface CalendarEvent {
  id: string
  organizer_id: string
  organizer_name: string
  title: string
  description: string | null
  event_type: EventType
  course_code: string | null
  start_time: string
  end_time: string
  location: string | null
  is_online: boolean
  max_participants: string | null
  status: string
  created_at: string
  updated_at: string | null
  participants: EventParticipant[]
}

export interface EventParticipant {
  id: string
  user_id: string
  user_name: string
  status: string
}

export interface CreateCalendarEvent {
  title: string
  description?: string
  event_type: EventType
  course_code?: string
  start_time: string
  end_time: string
  location?: string
  is_online?: boolean
  max_participants?: string
  invite_user_ids?: string[]  // List of user IDs to invite
}

export interface UpdateCalendarEvent {
  title?: string
  description?: string
  course_code?: string
  start_time?: string
  end_time?: string
  location?: string
  is_online?: boolean
  max_participants?: string
  status?: string
  invite_user_ids?: string[]  // List of user IDs to invite
}

export interface InviteSuggestion {
  user_id: string
  name: string
  email?: string
  major?: string
  graduation_year?: number
  pledge_class?: string
  reason: string
}

export const useCalendarEvents = (params?: {
  start_date?: string
  end_date?: string
  event_type?: EventType
  course_code?: string
}) => {
  return useQuery<CalendarEvent[]>({
    queryKey: ['calendar-events', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (params?.start_date) queryParams.append('start_date', params.start_date)
      if (params?.end_date) queryParams.append('end_date', params.end_date)
      if (params?.event_type) queryParams.append('event_type', params.event_type)
      if (params?.course_code) queryParams.append('course_code', params.course_code)
      
      const response = await api.get(`/calendar?${queryParams.toString()}`)
      return response.data
    },
  })
}

export const useCalendarEvent = (eventId: string | null) => {
  return useQuery<CalendarEvent>({
    queryKey: ['calendar-event', eventId],
    queryFn: async () => {
      if (!eventId) throw new Error('Event ID is required')
      const response = await api.get(`/calendar/${eventId}`)
      return response.data
    },
    enabled: !!eventId,
  })
}

export const useCreateCalendarEvent = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateCalendarEvent) => {
      try {
        console.log('Creating calendar event with data:', data)
        const response = await api.post('/calendar', data)
        console.log('Calendar event created successfully:', response.data)
        return response.data
      } catch (error: any) {
        console.error('Error creating calendar event:', error)
        console.error('Error response:', error?.response?.data)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
    },
    onError: (error: any) => {
      console.error('Mutation error:', error)
    },
  })
}

export const useUpdateCalendarEvent = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ eventId, data }: { eventId: string; data: UpdateCalendarEvent }) => {
      const response = await api.put(`/calendar/${eventId}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
    },
  })
}

export const useDeleteCalendarEvent = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (eventId: string) => {
      await api.delete(`/calendar/${eventId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
    },
  })
}

export const useJoinEvent = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (eventId: string) => {
      const response = await api.post(`/calendar/${eventId}/participants`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
    },
  })
}

export const useLeaveEvent = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ eventId, participantId }: { eventId: string; participantId: string }) => {
      await api.delete(`/calendar/${eventId}/participants/${participantId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
    },
  })
}

// Invite suggestion hooks
export const useTutorSuggestions = (courseCode: string | null) => {
  return useQuery<InviteSuggestion[]>({
    queryKey: ['tutor-suggestions', courseCode],
    queryFn: async () => {
      if (!courseCode) return []
      const response = await api.get(`/calendar/invite-suggestions/tutors?course_code=${encodeURIComponent(courseCode)}`)
      return response.data
    },
    enabled: !!courseCode,
  })
}

export const useBrothersMajorSuggestions = () => {
  return useQuery<InviteSuggestion[]>({
    queryKey: ['brothers-major-suggestions'],
    queryFn: async () => {
      const response = await api.get('/calendar/invite-suggestions/brothers-major')
      return response.data
    },
  })
}

export const useStudyGroupSuggestions = () => {
  return useQuery<InviteSuggestion[]>({
    queryKey: ['study-group-suggestions'],
    queryFn: async () => {
      const response = await api.get('/calendar/invite-suggestions/study-group')
      return response.data
    },
  })
}

