import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { useRouter } from 'next/navigation'

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  pledge_class: string | null
  graduation_year: number | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  first_name: string
  last_name: string
  pledge_class?: string
  graduation_year?: number
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export const useLogin = () => {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const formData = new URLSearchParams()
      formData.append('username', credentials.email)
      formData.append('password', credentials.password)

      const response = await api.post<AuthResponse>('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      return response.data
    },
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access_token)
      queryClient.invalidateQueries({ queryKey: ['user'] })
      router.push('/')
    },
  })
}

export const useRegister = () => {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: RegisterData) => {
      try {
        const response = await api.post<User>('/auth/register', data)
        return response.data
      } catch (error: any) {
        // Handle different error types
        if (!error.response) {
          // Network error - backend not reachable
          throw new Error('Cannot connect to server. Please make sure the backend is running.')
        }
        
        // Get error message from backend
        const errorMessage = error.response?.data?.detail || 
                           error.response?.data?.message || 
                           error.message || 
                           'Registration failed'
        
        throw new Error(errorMessage)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      router.push('/login')
    },
  })
}

export const useLogout = () => {
  const router = useRouter()
  const queryClient = useQueryClient()

  return () => {
    localStorage.removeItem('access_token')
    queryClient.clear()
    router.push('/login')
  }
}

export const useCurrentUser = () => {
  return useQuery<User>({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await api.get<User>('/auth/me')
      return response.data
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

