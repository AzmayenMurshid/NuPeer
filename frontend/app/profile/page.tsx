'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useTranscripts } from '@/lib/hooks/useTranscripts'
import { useHelpRequests, useDeleteHelpRequest } from '@/lib/hooks/useHelpRequests'
import { useCourses } from '@/lib/hooks/useCourses'
import { useChangePassword, useUpdateMajor, useUpdatePhone, useDeleteAccount } from '@/lib/hooks/useAuth'
import { usePoints, usePointsHistory } from '@/lib/hooks/usePoints'
import { Settings, Lock, Bell, Shield, User, X, Search, Edit, Trash2, BarChart, Clock, UserCheck, Users, Trophy } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  )
}

function ProfileContent() {
  const { user, logout } = useAuth()
  const { data: transcripts } = useTranscripts()
  const { data: helpRequests } = useHelpRequests()
  const { data: courses } = useCourses()
  const { data: pointsData } = usePoints()
  const { data: pointsHistory } = usePointsHistory(10)
  const changePasswordMutation = useChangePassword()
  const updateMajorMutation = useUpdateMajor()
  const updatePhoneMutation = useUpdatePhone()
  const deleteRequestMutation = useDeleteHelpRequest()
  const deleteAccountMutation = useDeleteAccount()
  
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  
  const [showSettings, setShowSettings] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [courseSearchQuery, setCourseSearchQuery] = useState<string>('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [major, setMajor] = useState<string>(user?.major || '')
  const [majorError, setMajorError] = useState('')
  const [majorSuccess, setMajorSuccess] = useState('')
  const [phoneNumber, setPhoneNumber] = useState<string>(user?.phone_number || '')
  const [phoneError, setPhoneError] = useState('')
  const [phoneSuccess, setPhoneSuccess] = useState('')
  const [editMode, setEditMode] = useState(false)
  
  // Account settings state
  const [profileVisibility, setProfileVisibility] = useState('brothers') // 'brothers' | 'public' | 'private'
  
  // Update major and phone when user data changes
  useEffect(() => {
    if (user?.major !== undefined) {
      setMajor(user.major || '')
    }
    if (user?.phone_number !== undefined) {
      setPhoneNumber(user.phone_number || '')
    }
  }, [user?.major, user?.phone_number])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
      case 'processing':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
      case 'failed':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
      default:
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    try {
      await changePasswordMutation.mutateAsync({
        current_password: currentPassword,
        new_password: newPassword,
      })
      setPasswordSuccess('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordChange(false)
      setTimeout(() => setPasswordSuccess(''), 5000)
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to change password')
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this help request? This action cannot be undone.')) {
      return
    }

    try {
      await deleteRequestMutation.mutateAsync(requestId)
    } catch (error) {
      console.error('Failed to delete help request:', error)
      alert('Failed to delete help request. Please try again.')
    }
  }

  const handleMajorUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setMajorError('')
    setMajorSuccess('')

    try {
      await updateMajorMutation.mutateAsync({
        major: major.trim() || null,
      })
      setMajorSuccess('Major updated successfully!')
      setTimeout(() => setMajorSuccess(''), 5000)
    } catch (error: any) {
      setMajorError(error.message || 'Failed to update major')
    }
  }

  const handlePhoneUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setPhoneError('')
    setPhoneSuccess('')

    try {
      await updatePhoneMutation.mutateAsync({
        phone_number: phoneNumber.trim() || null,
      })
      setPhoneSuccess('Phone number updated successfully!')
      setTimeout(() => setPhoneSuccess(''), 5000)
    } catch (error: any) {
      setPhoneError(error.message || 'Failed to update phone number')
    }
  }

  return (
    <main className="min-h-screen bg-white dark:bg-black content-with-nav">
      {/* Minimal Header */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/dashboard" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2">
              <span>←</span>
              <span>Back</span>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                href="/profile"
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors bg-gray-100 dark:bg-gray-900"
              >
                <User className="w-5 h-5 text-primary-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.first_name} {user?.last_name}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Profile Header - Robinhood style */}
        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user?.first_name} {user?.last_name}
                </h1>
                <span className="text-xs font-semibold text-primary-500">ΣΝ</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/analytics"
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                <BarChart className="w-4 h-4" />
                View Analytics
              </Link>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Stats Grid - Robinhood style */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Transcripts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{transcripts?.length || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Help Requests</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{helpRequests?.length || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Courses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{courses?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Profile Info Card */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Profile Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {user?.pledge_class && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pledge Class</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.pledge_class}</p>
              </div>
            )}
            {user?.graduation_year && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Graduation Year</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.graduation_year}</p>
              </div>
            )}
            {user?.major && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Major</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.major}</p>
              </div>
            )}
          </div>
        </div>

        {/* Mentorship Section */}
        {(user?.mentor_id || user?.mentee_id) && (
          <MentorshipInfoSection user={user} />
        )}

        {/* Account Settings Panel */}
        {showSettings && (
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h2>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Account Information */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Account Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</p>
                    <p className="font-medium text-gray-900 dark:text-white">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">User ID</p>
                    <p className="font-medium text-gray-900 dark:text-white text-xs font-mono">{user?.id}</p>
                  </div>
                  {pointsData && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Points</p>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-primary-500" />
                        <p className="font-medium text-gray-900 dark:text-white">{pointsData.total_points}</p>
                        {pointsData.rank && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            (Rank #{pointsData.rank})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {user?.pledge_class && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Pledge Class</p>
                      <p className="font-medium text-gray-900 dark:text-white">{user.pledge_class}</p>
                    </div>
                  )}
                  {user?.graduation_year && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Graduation Year</p>
                      <p className="font-medium text-gray-900 dark:text-white">{user.graduation_year}</p>
                    </div>
                  )}
                </div>
                {pointsData && pointsHistory && pointsHistory.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Points Activity</h4>
                      <Link href="/leaderboard" className="text-xs text-primary-500 hover:text-primary-600">
                        View Leaderboard →
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {pointsHistory.slice(0, 5).map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                          <div>
                            <p className="text-sm text-gray-900 dark:text-white">{entry.description || entry.point_type}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(entry.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                            +{entry.points}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Major Field */}
                <div className="mt-4">
                  <form onSubmit={handleMajorUpdate} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Major
                      </label>
                      <input
                        type="text"
                        value={major}
                        onChange={(e) => {
                          // Convert to title case (capitalize first letter of each word)
                          const titleCase = e.target.value
                            .toLowerCase()
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ')
                          setMajor(titleCase)
                        }}
                        placeholder="Enter your major (e.g., Computer Science, Biology)"
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Your major helps match you with tutors in the same field
                      </p>
                    </div>
                    {majorError && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">{majorError}</p>
                      </div>
                    )}
                    {majorSuccess && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-sm text-green-600 dark:text-green-400">{majorSuccess}</p>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={updateMajorMutation.isPending}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updateMajorMutation.isPending ? 'Updating...' : 'Update Major'}
                    </button>
                  </form>
                </div>
                {/* Phone Number Field */}
                <div className="mt-4">
                  <form onSubmit={handlePhoneUpdate} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Enter your phone number (e.g., (555) 123-4567)"
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Your phone number helps brothers contact you
                      </p>
                    </div>
                    {phoneError && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">{phoneError}</p>
                      </div>
                    )}
                    {phoneSuccess && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-sm text-green-600 dark:text-green-400">{phoneSuccess}</p>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={updatePhoneMutation.isPending}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatePhoneMutation.isPending ? 'Updating...' : 'Update Phone Number'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Change Password */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h3>
                </div>
                {!showPasswordChange ? (
                  <button
                    onClick={() => setShowPasswordChange(true)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                  >
                    Change Password
                  </button>
                ) : (
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                        minLength={6}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Must be at least 6 characters long
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>
                    {passwordError && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
                      </div>
                    )}
                    {passwordSuccess && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-sm text-green-600 dark:text-green-400">{passwordSuccess}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={changePasswordMutation.isPending}
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                      >
                        {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordChange(false)
                          setCurrentPassword('')
                          setNewPassword('')
                          setConfirmPassword('')
                          setPasswordError('')
                          setPasswordSuccess('')
                        }}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-sm font-medium active:scale-95"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Theme Settings */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h3>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Theme</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Switch between light and dark mode</p>
                  </div>
                  <ThemeToggle />
                </div>
              </div>

              {/* Privacy Settings */}
              {/* TODO: Privacy Settings - Future feature coming soon */}
              {/* <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy Settings</h3>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Profile Visibility
                  </label>
                  <select
                    value={profileVisibility}
                    onChange={(e) => setProfileVisibility(e.target.value)}
                    className="w-full md:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="brothers">Visible to Brothers Only</option>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Control who can see your profile and academic information
                  </p>
                </div>
              </div> */}

              {/* Danger Zone */}
              <div className="border-t-2 border-red-200 dark:border-red-800 pt-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="mb-4">
                    <h4 className="font-semibold text-red-900 dark:text-red-300 mb-2">Delete Account</h4>
                    <p className="text-sm text-red-700 dark:text-red-400 mb-2">
                      Permanently delete your account and all associated data.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteAccount(true)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium active:scale-95"
                  >
                    Delete Account
                  </button>
                </div>
              </div>

              {/* Delete Account Confirmation Modal */}
              {showDeleteAccount && (
                <div 
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 dark:bg-opacity-70"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setShowDeleteAccount(false)
                      setDeleteConfirmText('')
                    }
                  }}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                          <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Delete Account</h3>
                        </div>
                        <button
                          onClick={() => {
                            setShowDeleteAccount(false)
                            setDeleteConfirmText('')
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="mb-6">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Are you sure?
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                          Once you delete your account, there is no going back. This will permanently delete:
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-2 mb-4 ml-2">
                          <li>Your profile and account information</li>
                          <li>All uploaded transcripts and course data</li>
                          <li>All help requests and recommendations</li>
                          <li>All connected brother relationships</li>
                        </ul>
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                          <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                            ⚠️ This action cannot be undone.
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Type <span className="font-mono font-bold text-red-600 dark:text-red-400">DELETE</span> to confirm
                          </label>
                          <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="DELETE"
                            className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            autoFocus
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={async () => {
                            if (deleteConfirmText !== 'DELETE') {
                              alert('Please type DELETE to confirm')
                              return
                            }
                            try {
                              await deleteAccountMutation.mutateAsync()
                            } catch (error: any) {
                              alert(error.message || 'Failed to delete account. Please try again.')
                            }
                          }}
                          disabled={deleteAccountMutation.isPending || deleteConfirmText !== 'DELETE'}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleteAccountMutation.isPending ? 'Deleting...' : 'Permanently Delete Account'}
                        </button>
                        <button
                          onClick={() => {
                            setShowDeleteAccount(false)
                            setDeleteConfirmText('')
                          }}
                          className="px-4 py-2 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-sm font-medium active:scale-95"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transcripts Section - Robinhood style */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Transcripts</h2>
            <Link
              href="/upload"
              className="text-sm text-primary-500 hover:text-primary-600 font-medium"
            >
              + Upload
            </Link>
          </div>
          {transcripts && transcripts.length > 0 ? (
            <div className="space-y-2">
              {transcripts.map((transcript) => (
                <div
                  key={transcript.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-lg transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{transcript.file_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(transcript.upload_date).toLocaleDateString()}
                      {transcript.file_size && ` • ${(transcript.file_size / 1024 / 1024).toFixed(2)} MB`}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ml-3 flex-shrink-0 ${getStatusColor(
                      transcript.processing_status
                    )}`}
                  >
                    {transcript.processing_status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No transcripts yet</p>
              <Link href="/upload" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
                Upload your first transcript →
              </Link>
            </div>
          )}
        </div>

        {/* Courses Section - Robinhood style */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Courses</h2>
          
          {/* Search Input */}
          {courses && courses.length > 0 && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={courseSearchQuery}
                  onChange={(e) => setCourseSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}
          
          {courses && courses.length > 0 ? (
            <div className="overflow-x-auto scroll-optimized">
              <div className="max-h-[600px] overflow-y-auto scroll-optimized">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                        Course Code
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                        Course Name
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                        Grade
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                        Credits
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                        Semester
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                        Year
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-black">
                    {(() => {
                      // Filter courses based on search query
                      const filteredCourses = courseSearchQuery.trim()
                        ? courses.filter((course) => {
                            const query = courseSearchQuery.toLowerCase().trim()
                            const courseCode = (course.course_code || '').toLowerCase()
                            const courseName = (course.course_name || '').toLowerCase()
                            const grade = (course.grade || '').toLowerCase()
                            const semester = (course.semester || '').toLowerCase()
                            const year = course.year ? course.year.toString() : ''
                            
                            return (
                              courseCode.includes(query) ||
                              courseName.includes(query) ||
                              grade.includes(query) ||
                              semester.includes(query) ||
                              year.includes(query)
                            )
                          })
                        : courses
                      
                      return filteredCourses.length > 0 ? (
                        filteredCourses.map((course) => (
                          <tr 
                            key={course.id}
                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                              <div className="flex items-center gap-2">
                                <span>{course.course_code}</span>
                                {(!course.transcript_id || !course.grade) && (
                                  <span 
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                    title="Currently taking"
                                  >
                                    <Clock className="w-3 h-3" />
                                    Current
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                              {course.course_name || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {course.grade ? (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  course.grade.startsWith('A') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                  course.grade.startsWith('B') ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                  course.grade.startsWith('C') ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-400'
                                }`}>
                                  {course.grade}
                                </span>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                              {course.credit_hours ? course.credit_hours : '-'}
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                              {course.semester || '-'}
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                              {course.year || '-'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                            No courses found matching "{courseSearchQuery}"
                          </td>
                        </tr>
                      )
                    })()}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
                {courseSearchQuery ? (
                  <span>
                    Showing {(() => {
                      const filtered = courses.filter((course) => {
                        const query = courseSearchQuery.toLowerCase().trim()
                        const courseCode = (course.course_code || '').toLowerCase()
                        const courseName = (course.course_name || '').toLowerCase()
                        const grade = (course.grade || '').toLowerCase()
                        const semester = (course.semester || '').toLowerCase()
                        const year = course.year ? course.year.toString() : ''
                        return (
                          courseCode.includes(query) ||
                          courseName.includes(query) ||
                          grade.includes(query) ||
                          semester.includes(query) ||
                          year.includes(query)
                        )
                      })
                      return filtered.length
                    })()} of {courses.length} course{courses.length !== 1 ? 's' : ''}
                  </span>
                ) : (
                  <span>
                    Total: {courses.length} course{courses.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Courses Found</p>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Upload and process a transcript to see your courses here.</p>
              <Link
                href="/upload"
                className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
              >
                Upload Transcript
              </Link>
            </div>
          )}
        </div>

        {/* Help Requests Section - Robinhood style */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Help Requests</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditMode(!editMode)}
                className={`text-sm font-medium transition-colors ${
                  editMode
                    ? 'text-primary-500'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {editMode ? 'Done' : 'Edit'}
              </button>
              <Link
                href="/help"
                className="text-sm text-primary-500 hover:text-primary-600 font-medium"
              >
                + New
              </Link>
            </div>
          </div>
          {helpRequests && helpRequests.length > 0 ? (
            <div className="space-y-2">
              {helpRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-lg transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{request.course_code}</p>
                    {request.course_name && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{request.course_name}</p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <Link
                      href={`/help?request=${request.id}`}
                      className="px-3 py-1.5 text-sm text-primary-500 hover:text-primary-600 font-medium"
                    >
                      View
                    </Link>
                    {editMode && (
                      <button
                        onClick={() => handleDeleteRequest(request.id)}
                        disabled={deleteRequestMutation.isPending}
                        className="p-1.5 text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No help requests yet</p>
              <Link href="/help" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
                Create your first request →
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function MentorshipInfoSection({ user }: { user: any }) {
  const { data: mentorInfo } = useQuery({
    queryKey: ['mentorInfo', user.mentor_id],
    queryFn: async () => {
      if (!user.mentor_id) return null
      const response = await api.get(`/mentorship/mentor-info/${user.mentor_id}`)
      return response.data
    },
    enabled: !!user.mentor_id,
  })

  const { data: menteeInfo } = useQuery({
    queryKey: ['menteeInfo', user.mentee_id],
    queryFn: async () => {
      if (!user.mentee_id) return null
      const response = await api.get(`/mentorship/mentor-info/${user.mentee_id}`)
      return response.data
    },
    enabled: !!user.mentee_id,
  })

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary-500" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mentorship</h2>
      </div>
      
      <div className="space-y-4">
        {mentorInfo && (
          <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-4 h-4 text-green-500" />
              <h3 className="font-medium text-gray-900 dark:text-white">My Mentor</h3>
            </div>
            <p className="text-sm text-gray-900 dark:text-white font-medium">
              {mentorInfo.user.first_name} {mentorInfo.user.last_name}
            </p>
            {mentorInfo.profile.current_position && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {mentorInfo.profile.current_position}
                {mentorInfo.profile.company && ` at ${mentorInfo.profile.company}`}
              </p>
            )}
            {mentorInfo.user.email && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Email: {mentorInfo.user.email}
              </p>
            )}
            {mentorInfo.user.phone_number && (
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Phone: {mentorInfo.user.phone_number}
              </p>
            )}
            <Link
              href="/mentorship"
              className="text-xs text-primary-500 hover:text-primary-600 mt-2 inline-block"
            >
              View Mentorship Program →
            </Link>
          </div>
        )}

        {menteeInfo && (
          <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-500" />
              <h3 className="font-medium text-gray-900 dark:text-white">My Mentee</h3>
            </div>
            <p className="text-sm text-gray-900 dark:text-white font-medium">
              {menteeInfo.user.first_name} {menteeInfo.user.last_name}
            </p>
            {menteeInfo.profile.current_position && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {menteeInfo.profile.current_position}
                {menteeInfo.profile.company && ` at ${menteeInfo.profile.company}`}
              </p>
            )}
            {menteeInfo.user.email && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Email: {menteeInfo.user.email}
              </p>
            )}
            {menteeInfo.user.phone_number && (
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Phone: {menteeInfo.user.phone_number}
              </p>
            )}
            <Link
              href="/mentorship"
              className="text-xs text-primary-500 hover:text-primary-600 mt-2 inline-block"
            >
              View Mentorship Program →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
