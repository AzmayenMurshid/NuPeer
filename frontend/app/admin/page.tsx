'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { Search, Plus, Minus, AlertCircle, CheckCircle2, Lock, Users, Trash2, X } from 'lucide-react'
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
  
  // Battle Buddy Teams state
  const [teams, setTeams] = useState<any[]>([])
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamDescription, setNewTeamDescription] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null)
  const [teamPointsToAdd, setTeamPointsToAdd] = useState('')
  const [teamPointsDescription, setTeamPointsDescription] = useState('')
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [memberSearchResults, setMemberSearchResults] = useState<User[]>([])
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<string>('') // Selected team member for points
  
  // Academic Teams state
  const [academicTeams, setAcademicTeams] = useState<any[]>([])
  const [showCreateAcademicTeam, setShowCreateAcademicTeam] = useState(false)
  const [newAcademicTeamName, setNewAcademicTeamName] = useState('')
  const [newAcademicTeamDescription, setNewAcademicTeamDescription] = useState('')
  const [selectedAcademicTeam, setSelectedAcademicTeam] = useState<any | null>(null)
  const [academicMemberSearchQuery, setAcademicMemberSearchQuery] = useState('')
  const [academicMemberSearchResults, setAcademicMemberSearchResults] = useState<User[]>([])

  // Check if password is already verified in session
  useEffect(() => {
    const verified = sessionStorage.getItem('admin_password_verified')
    if (verified === 'true') {
      setIsPasswordVerified(true)
    }
  }, [])

  // Reset form when team selection changes
  useEffect(() => {
    if (selectedTeam) {
      setSelectedTeamMemberId('')
      setTeamPointsDescription('')
      setTeamPointsToAdd('')
    }
  }, [selectedTeam?.id])

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

  // Battle Buddy Teams functions
  const loadTeams = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/battle-buddy/teams')
      setTeams(response.data)
      setMessage(null)
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to load teams' 
      })
    } finally {
      setLoading(false)
    }
  }

  const createTeam = async () => {
    if (!newTeamName.trim()) {
      setMessage({ type: 'error', text: 'Team name is required' })
      return
    }

    setLoading(true)
    try {
      await api.post('/admin/battle-buddy/teams', {
        team_name: newTeamName,
        description: newTeamDescription || null
      })
      setMessage({ type: 'success', text: `Team "${newTeamName}" created successfully!` })
      setNewTeamName('')
      setNewTeamDescription('')
      setShowCreateTeam(false)
      loadTeams()
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to create team' 
      })
    } finally {
      setLoading(false)
    }
  }

  const searchUsersForTeam = async () => {
    if (!memberSearchQuery.trim()) {
      setMemberSearchResults([])
      return
    }

    setLoading(true)
    try {
      const response = await api.get(`/admin/users/search?query=${encodeURIComponent(memberSearchQuery)}&limit=20`)
      setMemberSearchResults(response.data)
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to search users' 
      })
      setMemberSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const addMemberToTeam = async (userId: string) => {
    if (!selectedTeam) return

    setLoading(true)
    try {
      await api.post('/admin/battle-buddy/teams/members', {
        team_id: selectedTeam.id,
        user_id: userId
      })
      setMessage({ type: 'success', text: 'Member added to team successfully!' })
      setMemberSearchQuery('')
      setMemberSearchResults([])
      loadTeams()
      // Update selected team
      const updatedTeams = await api.get('/admin/battle-buddy/teams')
      const updatedTeam = updatedTeams.data.find((t: any) => t.id === selectedTeam.id)
      if (updatedTeam) setSelectedTeam(updatedTeam)
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to add member to team' 
      })
    } finally {
      setLoading(false)
    }
  }

  const removeMemberFromTeam = async (memberId: string) => {
    setLoading(true)
    try {
      await api.delete(`/admin/battle-buddy/teams/members/${memberId}`)
      setMessage({ type: 'success', text: 'Member removed from team successfully!' })
      loadTeams()
      // Update selected team
      const updatedTeams = await api.get('/admin/battle-buddy/teams')
      const updatedTeam = updatedTeams.data.find((t: any) => t.id === selectedTeam.id)
      if (updatedTeam) setSelectedTeam(updatedTeam)
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to remove member from team' 
      })
    } finally {
      setLoading(false)
    }
  }



  const updateTeamPoints = async () => {
    if (!selectedTeam) return
    
    // Validate user selection is required
    if (!selectedTeamMemberId) {
      setMessage({ type: 'error', text: 'Please select a team member' })
      return
    }
    
    const points = parseInt(teamPointsToAdd)
    if (isNaN(points) || points === 0) {
      setMessage({ type: 'error', text: 'Please enter a valid number of points' })
      return
    }

    if (!teamPointsDescription.trim()) {
      setMessage({ type: 'error', text: 'Description is required' })
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/admin/battle-buddy/teams/points', {
        team_id: selectedTeam.id,
        points: points,
        description: teamPointsDescription,
        user_id: selectedTeamMemberId
      })
      
      setMessage({ 
        type: 'success', 
        text: `Successfully ${points > 0 ? 'added' : 'removed'} ${Math.abs(points)} points. New total: ${response.data.new_total}` 
      })
      
      setTeamPointsToAdd('')
      setTeamPointsDescription('')
      setSelectedTeamMemberId('')
      loadTeams()
      // Update selected team
      const updatedTeams = await api.get('/admin/battle-buddy/teams')
      const updatedTeam = updatedTeams.data.find((t: any) => t.id === selectedTeam.id)
      if (updatedTeam) setSelectedTeam(updatedTeam)
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to update team points' 
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team? This will remove all members.')) {
      return
    }

    setLoading(true)
    try {
      await api.delete(`/admin/battle-buddy/teams/${teamId}`)
      setMessage({ type: 'success', text: 'Team deleted successfully!' })
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(null)
      }
      loadTeams()
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to delete team' 
      })
    } finally {
      setLoading(false)
    }
  }

  // Academic Teams functions
  const loadAcademicTeams = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/academic-teams/teams')
      setAcademicTeams(response.data)
      setMessage(null)
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to load academic teams' 
      })
    } finally {
      setLoading(false)
    }
  }

  const createAcademicTeam = async () => {
    if (!newAcademicTeamName.trim()) {
      setMessage({ type: 'error', text: 'Team name is required' })
      return
    }

    setLoading(true)
    try {
      await api.post('/admin/academic-teams/teams', {
        team_name: newAcademicTeamName,
        description: newAcademicTeamDescription || null
      })
      setMessage({ type: 'success', text: `Academic team "${newAcademicTeamName}" created successfully!` })
      setNewAcademicTeamName('')
      setNewAcademicTeamDescription('')
      setShowCreateAcademicTeam(false)
      loadAcademicTeams()
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to create academic team' 
      })
    } finally {
      setLoading(false)
    }
  }

  const searchUsersForAcademicTeam = async () => {
    if (!academicMemberSearchQuery.trim()) {
      setAcademicMemberSearchResults([])
      return
    }

    setLoading(true)
    try {
      const response = await api.get(`/admin/users/search?query=${encodeURIComponent(academicMemberSearchQuery)}&limit=20`)
      setAcademicMemberSearchResults(response.data)
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to search users' 
      })
      setAcademicMemberSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const addMemberToAcademicTeam = async (userId: string) => {
    if (!selectedAcademicTeam) return

    setLoading(true)
    try {
      await api.post('/admin/academic-teams/teams/members', {
        team_id: selectedAcademicTeam.id,
        user_id: userId
      })
      setMessage({ type: 'success', text: 'Member added to academic team successfully!' })
      setAcademicMemberSearchQuery('')
      setAcademicMemberSearchResults([])
      loadAcademicTeams()
      // Update selected team
      const updatedTeams = await api.get('/admin/academic-teams/teams')
      const updatedTeam = updatedTeams.data.find((t: any) => t.id === selectedAcademicTeam.id)
      if (updatedTeam) setSelectedAcademicTeam(updatedTeam)
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to add member to academic team' 
      })
    } finally {
      setLoading(false)
    }
  }

  const removeMemberFromAcademicTeam = async (memberId: string) => {
    setLoading(true)
    try {
      await api.delete(`/admin/academic-teams/teams/members/${memberId}`)
      setMessage({ type: 'success', text: 'Member removed from academic team successfully!' })
      loadAcademicTeams()
      // Update selected team
      const updatedTeams = await api.get('/admin/academic-teams/teams')
      const updatedTeam = updatedTeams.data.find((t: any) => t.id === selectedAcademicTeam?.id)
      if (updatedTeam) setSelectedAcademicTeam(updatedTeam)
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to remove member from academic team' 
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteAcademicTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this academic team? This will remove all members.')) {
      return
    }

    setLoading(true)
    try {
      await api.delete(`/admin/academic-teams/teams/${teamId}`)
      setMessage({ type: 'success', text: 'Academic team deleted successfully!' })
      if (selectedAcademicTeam?.id === teamId) {
        setSelectedAcademicTeam(null)
      }
      loadAcademicTeams()
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to delete academic team' 
      })
    } finally {
      setLoading(false)
    }
  }

  // Load teams on mount
  useEffect(() => {
    if (isPasswordVerified) {
      loadTeams()
      loadAcademicTeams()
    }
  }, [isPasswordVerified])

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
                        ? 'bg-gray-100 dark:bg-gray-800'
                        : 'bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800'
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

          {/* Battle Buddy Teams Section */}
          <div className="card p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Battle Buddy Teams
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Manage academic competition teams and team points (separate from individual points)
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateTeam(!showCreateTeam)
                  setNewTeamName('')
                  setNewTeamDescription('')
                  setMessage(null)
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {showCreateTeam ? 'Cancel' : 'Create Team'}
              </button>
            </div>

            {/* Create Team Form */}
            {showCreateTeam && (
              <form onSubmit={(e) => { e.preventDefault(); createTeam(); }} className="space-y-4 mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Enter team name"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                    placeholder="Team description..."
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Team'}
                </button>
              </form>
            )}

            {/* Teams List */}
            <div className="space-y-4">
              {teams.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No teams created yet</p>
              ) : (
                teams.map((team) => (
                  <div
                    key={team.id}
                    onClick={() => {
                      setSelectedTeam(team)
                      setTeamPointsToAdd('')
                      setTeamPointsDescription('')
                      setMemberSearchQuery('')
                      setSelectedTeamMemberId('')
                      setMemberSearchResults([])
                    }}
                    className={`p-4 rounded-lg transition-colors cursor-pointer ${
                      selectedTeam?.id === team.id
                        ? 'bg-gray-100 dark:bg-gray-800'
                        : 'bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{team.team_name}</h3>
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-sm font-medium">
                            {team.points} pts
                          </span>
                        </div>
                        {team.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{team.description}</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {team.member_count} member{team.member_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteTeam(team.id)
                          }}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Team Members */}
                    {team.members.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Members:</p>
                        <div className="flex flex-wrap gap-2">
                          {team.members.map((member: any) => (
                            <div
                              key={member.id}
                              className="px-2 py-1 bg-white dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1"
                            >
                              {member.first_name} {member.last_name}
                              {selectedTeam?.id === team.id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeMemberFromTeam(member.id)
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                  title="Remove member"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Selected Team Management */}
            {selectedTeam && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Manage Team: {selectedTeam.team_name}
                </h3>

                {/* Add Member Section */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add Member</h4>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchUsersForTeam()}
                        placeholder="Search by first name, last name, or email..."
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <button
                      onClick={searchUsersForTeam}
                      disabled={loading}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Search
                    </button>
                  </div>

                  {/* Member Search Results */}
                  {memberSearchResults.length > 0 && (
                    <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                      {memberSearchResults.map((user) => {
                        const isAlreadyMember = selectedTeam.members.some((m: any) => m.user_id === user.id)
                        return (
                          <div
                            key={user.id}
                            className={`p-2 rounded flex justify-between items-center ${
                              isAlreadyMember
                                ? 'bg-gray-100 dark:bg-gray-700 opacity-50'
                                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{user.email}</p>
                            </div>
                            {isAlreadyMember ? (
                              <span className="text-xs text-gray-500">Already in team</span>
                            ) : (
                              <button
                                onClick={() => addMemberToTeam(user.id)}
                                disabled={loading}
                                className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 disabled:opacity-50"
                              >
                                Add
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Update Team Points */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Team Points: <span className="font-semibold text-blue-600 dark:text-blue-400">{selectedTeam.points}</span>
                  </h4>
                  
                  {/* Team Member Selection */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Team Member *
                    </label>
                    <select
                      value={selectedTeamMemberId}
                      onChange={(e) => setSelectedTeamMemberId(e.target.value)}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">-- Select a team member --</option>
                      {selectedTeam.members?.map((member: any) => (
                        <option key={member.user_id} value={member.user_id}>
                          {member.first_name} {member.last_name} ({member.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Points Input */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Points *
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const current = parseInt(teamPointsToAdd) || 0
                          setTeamPointsToAdd(String(current - 10))
                        }}
                        className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        value={teamPointsToAdd}
                        onChange={(e) => setTeamPointsToAdd(e.target.value)}
                        placeholder="Enter points (negative to remove)"
                        className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        onClick={() => {
                          const current = parseInt(teamPointsToAdd) || 0
                          setTeamPointsToAdd(String(current + 10))
                        }}
                        className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Description Input */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={teamPointsDescription}
                      onChange={(e) => setTeamPointsDescription(e.target.value)}
                      placeholder="Enter description"
                      className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <button
                    onClick={updateTeamPoints}
                    disabled={loading || !teamPointsToAdd || parseInt(teamPointsToAdd) === 0 || !teamPointsDescription.trim() || !selectedTeamMemberId}
                    className="w-full px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Updating...' : 'Update Team Points'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Academic Teams Section */}
          <div className="card p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Academic Teams
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Manage academic teams and assign users to teams
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateAcademicTeam(!showCreateAcademicTeam)
                  setNewAcademicTeamName('')
                  setNewAcademicTeamDescription('')
                  setMessage(null)
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {showCreateAcademicTeam ? 'Cancel' : 'Create Team'}
              </button>
            </div>

            {/* Create Academic Team Form */}
            {showCreateAcademicTeam && (
              <form onSubmit={(e) => { e.preventDefault(); createAcademicTeam(); }} className="space-y-4 mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    value={newAcademicTeamName}
                    onChange={(e) => setNewAcademicTeamName(e.target.value)}
                    placeholder="Enter team name"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={newAcademicTeamDescription}
                    onChange={(e) => setNewAcademicTeamDescription(e.target.value)}
                    placeholder="Team description..."
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Team'}
                </button>
              </form>
            )}

            {/* Academic Teams List */}
            <div className="space-y-4">
              {academicTeams.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No academic teams created yet</p>
              ) : (
                academicTeams.map((team) => (
                  <div
                    key={team.id}
                    className={`p-4 rounded-lg transition-colors ${
                      selectedAcademicTeam?.id === team.id
                        ? 'bg-gray-100 dark:bg-gray-800'
                        : 'bg-gray-50 dark:bg-gray-900'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{team.team_name}</h3>
                        </div>
                        {team.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{team.description}</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {team.member_count} member{team.member_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedAcademicTeam(team)
                            setAcademicMemberSearchQuery('')
                            setAcademicMemberSearchResults([])
                          }}
                          className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
                        >
                          {selectedAcademicTeam?.id === team.id ? 'Selected' : 'Select'}
                        </button>
                        <button
                          onClick={() => deleteAcademicTeam(team.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Team Members */}
                    {team.members.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Members:</p>
                        <div className="flex flex-wrap gap-2">
                          {team.members.map((member: any) => (
                            <div
                              key={member.id}
                              className="px-2 py-1 bg-white dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1"
                            >
                              {member.first_name} {member.last_name}
                              {selectedAcademicTeam?.id === team.id && (
                                <button
                                  onClick={() => removeMemberFromAcademicTeam(member.id)}
                                  className="text-red-500 hover:text-red-700"
                                  title="Remove member"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Selected Academic Team Management */}
            {selectedAcademicTeam && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Manage Team: {selectedAcademicTeam.team_name}
                </h3>

                {/* Add Member Section */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add Member</h4>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={academicMemberSearchQuery}
                        onChange={(e) => setAcademicMemberSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchUsersForAcademicTeam()}
                        placeholder="Search by first name, last name, or email..."
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <button
                      onClick={searchUsersForAcademicTeam}
                      disabled={loading}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Search
                    </button>
                  </div>

                  {/* Member Search Results */}
                  {academicMemberSearchResults.length > 0 && (
                    <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                      {academicMemberSearchResults.map((user) => {
                        const isAlreadyMember = selectedAcademicTeam.members.some((m: any) => m.user_id === user.id)
                        return (
                          <div
                            key={user.id}
                            className={`p-2 rounded flex justify-between items-center ${
                              isAlreadyMember
                                ? 'bg-gray-100 dark:bg-gray-700 opacity-50'
                                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{user.email}</p>
                            </div>
                            {isAlreadyMember ? (
                              <span className="text-xs text-gray-500">Already in team</span>
                            ) : (
                              <button
                                onClick={() => addMemberToAcademicTeam(user.id)}
                                disabled={loading}
                                className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 disabled:opacity-50"
                              >
                                Add
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Password Change Section */}
          <div className="card p-6 mt-6">
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
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
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
                  className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
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

