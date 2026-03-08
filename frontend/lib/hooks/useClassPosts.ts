import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

export interface ClassPost {
  id: string
  user_id: string
  course_code: string | null
  course_name: string | null
  class_format: string
  professor_name: string
  professor_rating: number
  exam_format: string
  lockdown_browser_required: boolean | null
  description: string | null
  created_at: string
  updated_at: string | null
}

export interface ClassPostCreate {
  course_code?: string
  course_name?: string
  class_format: string
  professor_name: string
  professor_rating: number
  exam_format: string
  lockdown_browser_required?: boolean | null
  description?: string | null
}

export const useClassPosts = (courseCode?: string, professorName?: string) => {
  return useQuery<ClassPost[]>({
    queryKey: ['class-posts', courseCode, professorName],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (courseCode) params.append('course_code', courseCode)
      if (professorName) params.append('professor_name', professorName)
      const response = await api.get(`/class-posts?${params.toString()}`)
      return response.data
    },
  })
}

export const useSearchClassPosts = (query: string) => {
  return useQuery<ClassPost[]>({
    queryKey: ['class-posts', 'search', query],
    queryFn: async () => {
      const response = await api.get(`/class-posts/search?q=${encodeURIComponent(query)}`)
      return response.data
    },
    enabled: query.length > 0,
  })
}

export const useCreateClassPost = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (postData: ClassPostCreate) => {
      const response = await api.post('/class-posts', postData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-posts'] })
    },
  })
}

export const useMyClassPosts = () => {
  return useQuery<ClassPost[]>({
    queryKey: ['class-posts', 'my'],
    queryFn: async () => {
      const response = await api.get('/class-posts/user/me')
      return response.data
    },
  })
}

export const useDeleteClassPost = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (postId: string) => {
      await api.delete(`/class-posts/${postId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-posts'] })
    },
  })
}

