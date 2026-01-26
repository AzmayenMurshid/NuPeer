import axios from 'axios'

// Get API URL from environment variable
// In production (Vercel), this MUST be set to your production backend URL
// Example: https://nupeer-production.up.railway.app
let API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Ensure API_URL has a protocol (http:// or https://)
// If missing, assume https:// for production, http:// for localhost
if (!API_URL.match(/^https?:\/\//)) {
  // If it's a domain (contains .), assume https://
  if (API_URL.includes('.') && !API_URL.includes('localhost')) {
    API_URL = `https://${API_URL}`
  } else {
    // Otherwise assume http:// (for localhost)
    API_URL = `http://${API_URL}`
  }
  console.warn(
    `⚠️ NEXT_PUBLIC_API_URL was missing protocol. Auto-corrected to: ${API_URL}\n` +
    'Please update Vercel environment variable to include https://'
  )
}

// Remove trailing slashes
API_URL = API_URL.replace(/\/+$/, '')

// Warn if using localhost in production (browser will block these requests)
if (typeof window !== 'undefined') {
  if (API_URL.includes('localhost') || API_URL.includes('127.0.0.1')) {
    const isProduction = window.location.protocol === 'https:' || 
                         !window.location.hostname.includes('localhost')
    if (isProduction) {
      console.error(
        '⚠️ API URL is set to localhost but frontend is in production!\n' +
        'This will cause CORS loopback errors. Please set NEXT_PUBLIC_API_URL ' +
        'in Vercel environment variables to your production backend URL.\n' +
        'Current API_URL:', API_URL
      )
    }
  }
}

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

