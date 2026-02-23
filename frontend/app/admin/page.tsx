'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { Search, Plus, Minus, AlertCircle, CheckCircle2, Lock } from 'lucide-react'
import { ProtectedRoute } from '@/components/ProtectedRoute'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  points: number
  pledge_class?: string
  graduation_year?: number
}

// Admin password - Change this to your desired password
// In production, consider using an environment variable
const DEFAULT_ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'sigmanuzetachi05051956'
// Password required to change the admin password (worst case scenario recovery)
const PASSWORD_CHANGE_KEY = process.env.NEXT_PUBLIC_PASSWORD_CHANGE_KEY || 'SigmaNuAdminPasswordChangeKey!'

// Get admin password from localStorage or use default
const getAdminPassword = (): string => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('admin_password')
    return stored || DEFAULT_ADMIN_PASSWORD
  }
  return DEFAULT_ADMIN_PASSWORD
}

// Set admin password in localStorage
const saveAdminPassword = (newPassword: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_password', newPassword)
  }
}

export default function AdminPage() {
  const { user } = useAuth()
  const [adminPassword, setAdminPassword] = useState('')
  const [isPasswordVerified, setIsPasswordVerified] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [pointsToAdd, setPointsToAdd] = useState('')
  const [description, setDescription] = useState('')
  // Removed isAdmin check - password-only protection
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [changePasswordKey, setChangePasswordKey] = useState('')
  const [newAdminPassword, setNewAdminPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  // Check if password is already verified in session
  useEffect(() => {
    const verified = sessionStorage.getItem('admin_password_verified')
    if (verified === 'true') {
      setIsPasswordVerified(true)
    }
  }, [])

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const currentPassword = getAdminPassword()
    if (adminPassword === currentPassword) {
      setIsPasswordVerified(true)
      sessionStorage.setItem('admin_password_verified', 'true')
      setMessage(null)
    } else {
      setMessage({ type: 'error', text: 'Incorrect password. Access denied.' })
      setAdminPassword('')
    }
  }

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Verify change password key
    if (changePasswordKey !== PASSWORD_CHANGE_KEY) {
      setMessage({ type: 'error', text: 'Incorrect change password key.' })
      setChangePasswordKey('')
      return
    }
    
    // Validate new password
    if (!newAdminPassword || newAdminPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long.' })
      return
    }
    
    if (newAdminPassword !== confirmNewPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' })
      setConfirmNewPassword('')
      return
    }
    
    // Update password in localStorage
    saveAdminPassword(newAdminPassword)
    setMessage({ 
      type: 'success', 
      text: 'Admin password updated successfully! You will need to use the new password for future logins.' 
    })
    
    // Clear session verification so user needs to login with new password
    sessionStorage.removeItem('admin_password_verified')
    
    // Clear form
    setChangePasswordKey('')
    setNewAdminPassword('')
    setConfirmNewPassword('')
    setShowPasswordChange(false)
  }

  // Password-only protection - no backend admin check needed

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setUsers([])
      return
    }

    setLoading(true)
    try {
      const response = await api.get(`/admin/users/search?query=${encodeURIComponent(searchQuery)}&limit=20`)
      setUsers(response.data)
      setMessage(null)
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to search users' 
      })
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const updatePoints = async () => {
    if (!selectedUser) return
    
    const points = parseInt(pointsToAdd)
    if (isNaN(points) || points === 0) {
      setMessage({ type: 'error', text: 'Please enter a valid number of points' })
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/admin/points/update', {
        user_id: selectedUser.id,
        points: points,
        description: description || `Admin adjustment by ${user?.email}`
      })
      
      setMessage({ 
        type: 'success', 
        text: `Successfully ${points > 0 ? 'added' : 'removed'} ${Math.abs(points)} points. New total: ${response.data.new_total}` 
      })
      
      // Update selected user's points
      setSelectedUser({
        ...selectedUser,
        points: response.data.new_total
      })
      
      // Clear form
      setPointsToAdd('')
      setDescription('')
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to update points' 
      })
    } finally {
      setLoading(false)
    }
  }

  // Password gate - must enter password first
  if (!isPasswordVerified) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="card p-8">
              <div className="text-center mb-6">
                <Lock className="w-16 h-16 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Admin Access</h1>
                <p className="text-gray-600 dark:text-gray-400">Enter the admin password to continue</p>
              </div>
              
              {message && message.type === 'error' && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>{message.text}</span>
                </div>
              )}
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                >
                  Access Admin Panel
                </button>
              </form>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }


  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white dark:bg-black content-with-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Panel</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage NuPeer points for users</p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* User Search */}
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Search Users</h2>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                  placeholder="Search by first name, last name, or email..."
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button
                onClick={searchUsers}
                disabled={loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Search Results */}
            {users.length > 0 && (
              <div className="mt-4 space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user)
                      setPointsToAdd('')
                      setDescription('')
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedUser?.id === user.id
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500'
                        : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                        {user.pledge_class && (
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {user.pledge_class} {user.graduation_year}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary-600 dark:text-primary-400">
                          {user.points} pts
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Update Points */}
          {selectedUser && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Update Points for {selectedUser.first_name} {selectedUser.last_name}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Points: <span className="font-semibold text-primary-600 dark:text-primary-400">{selectedUser.points}</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Points to Add/Remove
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const current = parseInt(pointsToAdd) || 0
                        setPointsToAdd(String(current - 10))
                      }}
                      className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={pointsToAdd}
                      onChange={(e) => setPointsToAdd(e.target.value)}
                      placeholder="Enter points (negative to remove)"
                      className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      onClick={() => {
                        const current = parseInt(pointsToAdd) || 0
                        setPointsToAdd(String(current + 10))
                      }}
                      className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Enter positive number to add points, negative to remove. Use +/- buttons for quick adjustments of 10 points.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Reason for adjustment..."
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <button
                  onClick={updatePoints}
                  disabled={loading || !pointsToAdd || parseInt(pointsToAdd) === 0}
                  className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Updating...' : 'Update Points'}
                </button>
              </div>
            </div>
          )}

          {/* Password Change Section */}
          <div className="card p-6 mt-6 border-2 border-yellow-200 dark:border-yellow-800">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Change Admin Password</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Worst case scenario recovery - Use only if needed
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPasswordChange(!showPasswordChange)
                  setChangePasswordKey('')
                  setNewAdminPassword('')
                  setConfirmNewPassword('')
                  setMessage(null)
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium"
              >
                {showPasswordChange ? 'Cancel' : 'Change Password'}
              </button>
            </div>

            {showPasswordChange && (
              <form onSubmit={handlePasswordChange} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Change Password Key *
                  </label>
                  <input
                    type="password"
                    value={changePasswordKey}
                    onChange={(e) => setChangePasswordKey(e.target.value)}
                    placeholder="Enter change password key"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Required to change the admin password
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Admin Password *
                  </label>
                  <input
                    type="password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Enter new admin password (min 6 characters)"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new admin password"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    required
                    minLength={6}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium"
                >
                  Update Admin Password
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

