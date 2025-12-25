import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  // Only access localStorage on client side
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only access localStorage and window on client side
    if (typeof window !== 'undefined') {
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token')
        // Only redirect if not already on login page or landing page
        const currentPath = window.location.pathname
        if (currentPath !== '/login' && currentPath !== '/') {
          window.location.href = '/login'
        }
      }
    }
    // Don't swallow network errors - let them propagate
    if (!error.response) {
      // Network error or server not reachable
      console.error('Network error:', error.message)
    }
    return Promise.reject(error)
  }
)

