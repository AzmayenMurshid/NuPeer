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
  major: string | null
  phone_number: string | null
  is_alumni?: boolean
  mentor_id?: string | null
  mentee_id?: string | null
  points?: number
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
  phone_number?: string
  is_alumni?: boolean
}

export interface PasswordChangeData {
  current_password: string
  new_password: string
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
      try {
        const formData = new URLSearchParams()
        formData.append('username', credentials.email)
        formData.append('password', credentials.password)

        const response = await api.post<AuthResponse>('/auth/login', formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
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
                           'Login failed'
        
        throw new Error(errorMessage)
      }
    },
    onSuccess: (data) => {
      // Store token immediately
      localStorage.setItem('access_token', data.access_token)
      // Navigate immediately using replace for faster navigation (no history entry)
      router.replace('/dashboard')
      // Invalidate and refetch user data in parallel (non-blocking)
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.refetchQueries({ queryKey: ['user'] })
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
    onSuccess: async (userData) => {
      // Auto-login after registration for instant access
      try {
        const formData = new URLSearchParams()
        formData.append('username', userData.email)
        // We need the password, but we don't have it here. 
        // For now, redirect to login but make it faster
        router.push('/login?registered=true')
        queryClient.invalidateQueries({ queryKey: ['user'] })
      } catch (error) {
        // If auto-login fails, just redirect to login
        router.push('/login?registered=true')
      }
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

export const useChangePassword = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: PasswordChangeData) => {
      try {
        const response = await api.post<{ message: string }>('/auth/change-password', data)
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
                           'Password change failed'
        
        throw new Error(errorMessage)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

export interface MajorUpdateData {
  major: string | null
}

export const useUpdateMajor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: MajorUpdateData) => {
      try {
        const response = await api.put<User>('/auth/update-major', data)
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
                           'Major update failed'
        
        throw new Error(errorMessage)
      }
    },
    onSuccess: () => {
      // Invalidate user query to refresh user data
      queryClient.invalidateQueries({ queryKey: ['user'] })
      // Invalidate and refetch major-match-brothers to show new users immediately
      queryClient.invalidateQueries({ queryKey: ['major-match-brothers'] })
      // Refetch immediately if there are any active queries
      queryClient.refetchQueries({ queryKey: ['major-match-brothers'] })
    },
  })
}

export interface PhoneUpdateData {
  phone_number: string | null
}

export const useUpdatePhone = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: PhoneUpdateData) => {
      try {
        const response = await api.put<User>('/auth/update-phone', data)
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
                           'Phone number update failed'
        
        throw new Error(errorMessage)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

export const useDeleteAccount = () => {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      try {
        await api.delete('/auth/delete-account')
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
                           'Account deletion failed'
        
        throw new Error(errorMessage)
      }
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear()
      // Remove auth token
      localStorage.removeItem('access_token')
      // Redirect to login page
      router.push('/login')
    },
  })
}

