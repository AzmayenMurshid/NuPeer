import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

// Types
export interface AlumniProfile {
  id: string
  user_id: string
  bio: string | null
  chapter: string | null
  current_position: string | null
  company: string | null
  industry: string | null
  location: string | null
  linkedin_url: string | null
  website_url: string | null
  is_mentor: boolean
  is_mentee: boolean
  mentor_capacity: number
  created_at: string
  updated_at: string | null
}

export interface Experience {
  id: string
  alumni_profile_id: string
  type: string
  title: string
  company: string | null
  location: string | null
  description: string | null
  start_date: string | null
  end_date: string | null
  is_current: boolean
  created_at: string
  updated_at: string | null
}

export interface Resume {
  id: string
  alumni_profile_id: string
  file_name: string
  file_size: number | null
  upload_date: string
  is_primary: boolean
}

export interface MentorshipRequest {
  id: string
  mentor_id: string
  mentee_id: string
  message: string | null
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  created_at: string
  updated_at: string | null
  responded_at: string | null
}

export interface MentorSearchResult {
  alumni_profile: AlumniProfile
  user: {
    id: string
    first_name: string
    last_name: string
    email: string
    major: string | null
    graduation_year: number | null
  }
  experiences: Experience[]
  resume_count: number
  match_score: number | null
}

export interface CreateAlumniProfile {
  bio?: string
  chapter?: string
  current_position?: string
  company?: string
  industry?: string
  location?: string
  linkedin_url?: string
  website_url?: string
  is_mentor?: boolean
  is_mentee?: boolean
  mentor_capacity?: number
}

export interface UpdateAlumniProfile {
  bio?: string
  chapter?: string
  current_position?: string
  company?: string
  industry?: string
  location?: string
  linkedin_url?: string
  website_url?: string
  is_mentor?: boolean
  is_mentee?: boolean
  mentor_capacity?: number
}

export interface CreateExperience {
  type: string
  title: string
  company?: string
  location?: string
  description?: string
  start_date?: string
  end_date?: string
  is_current?: boolean
}

export interface UpdateExperience {
  type?: string
  title?: string
  company?: string
  location?: string
  description?: string
  start_date?: string
  end_date?: string
  is_current?: boolean
}

export interface CreateMentorshipRequest {
  mentor_id: string
  message?: string
}

// Hooks
export const useAlumniProfile = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['alumniProfile'],
    queryFn: async () => {
      try {
        const response = await api.get<AlumniProfile>('/mentorship/profile')
        return response.data
      } catch (error: any) {
        // If 403, user is not an alumnus - return null instead of throwing
        if (error.response?.status === 403) {
          return null
        }
        throw error
      }
    },
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
  })
}

export const useCreateAlumniProfile = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateAlumniProfile) => {
      const response = await api.post<AlumniProfile>('/mentorship/profile', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alumniProfile'] })
    },
  })
}

export const useUpdateAlumniProfile = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: UpdateAlumniProfile) => {
      const response = await api.put<AlumniProfile>('/mentorship/profile', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alumniProfile'] })
    },
  })
}

export const useExperiences = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['experiences'],
    queryFn: async () => {
      const response = await api.get<Experience[]>('/mentorship/experiences')
      return response.data
    },
    enabled,
    retry: false,
  })
}

export const useCreateExperience = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateExperience) => {
      const response = await api.post<Experience>('/mentorship/experiences', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] })
    },
  })
}

export const useUpdateExperience = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateExperience }) => {
      const response = await api.put<Experience>(`/mentorship/experiences/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] })
    },
  })
}

export const useDeleteExperience = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/mentorship/experiences/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] })
    },
  })
}

export const useResumes = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['resumes'],
    queryFn: async () => {
      const response = await api.get<Resume[]>('/mentorship/resumes')
      return response.data
    },
    enabled,
    retry: false,
  })
}

export const useUploadResume = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const response = await api.post<Resume>('/mentorship/resumes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] })
    },
  })
}

export const useSearchMentors = (filters?: {
  industry?: string
  major?: string
  location?: string
}, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['searchMentors', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.industry) params.append('industry', filters.industry)
      if (filters?.major) params.append('major', filters.major)
      if (filters?.location) params.append('location', filters.location)
      
      const response = await api.get<MentorSearchResult[]>(
        `/mentorship/search/mentors?${params.toString()}`
      )
      return response.data
    },
    enabled,
    retry: false,
  })
}

export const useSearchMentees = (filters?: {
  industry?: string
  major?: string
  location?: string
}, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['searchMentees', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.industry) params.append('industry', filters.industry)
      if (filters?.major) params.append('major', filters.major)
      if (filters?.location) params.append('location', filters.location)
      
      const response = await api.get<MentorSearchResult[]>(
        `/mentorship/search/mentees?${params.toString()}`
      )
      return response.data
    },
    enabled,
    retry: false,
  })
}

export const useMentorshipRequests = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['mentorshipRequests'],
    queryFn: async () => {
      const response = await api.get<MentorshipRequest[]>('/mentorship/requests')
      return response.data
    },
    enabled,
    retry: false,
  })
}

export const useCreateMentorshipRequest = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateMentorshipRequest) => {
      const response = await api.post<MentorshipRequest>('/mentorship/requests', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorshipRequests'] })
    },
  })
}

export const useAcceptMentorshipRequest = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await api.put<MentorshipRequest>(
        `/mentorship/requests/${requestId}/accept`
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorshipRequests'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

export const useRejectMentorshipRequest = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await api.put<MentorshipRequest>(
        `/mentorship/requests/${requestId}/reject`
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorshipRequests'] })
    },
  })
}

