'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useCurrentUser, useLogout, User } from '@/lib/hooks/useAuth'

interface AuthContextType {
  user: User | undefined
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useCurrentUser()
  const logout = useLogout()
  const isAuthenticated = !!user && !isLoading

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

