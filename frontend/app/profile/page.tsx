'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useTranscripts } from '@/lib/hooks/useTranscripts'
import { useHelpRequests } from '@/lib/hooks/useHelpRequests'
import { useCourses } from '@/lib/hooks/useCourses'
import { useChangePassword, useUpdateMajor } from '@/lib/hooks/useAuth'
import { Settings, Lock, Bell, Shield, User, X, Search } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'

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
  const changePasswordMutation = useChangePassword()
  const updateMajorMutation = useUpdateMajor()
  
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
  
  // Account settings state
  const [profileVisibility, setProfileVisibility] = useState('brothers') // 'brothers' | 'public' | 'private'
  
  // Update major when user data changes
  useEffect(() => {
    if (user?.major !== undefined) {
      setMajor(user.major || '')
    }
  }, [user?.major])

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

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {user?.first_name} {user?.last_name}
                </h1>
                <span className="text-lg font-semibold text-primary-600 dark:text-primary-400">ΣΝ</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300">{user?.email}</p>
              {user?.pledge_class && (
                <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mt-1">
                  {user.pledge_class} Class
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Account Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 dark:bg-red-600 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            {user?.pledge_class && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pledge Class</p>
                <p className="font-medium text-gray-900 dark:text-white">{user.pledge_class}</p>
              </div>
            )}
            {user?.graduation_year && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Graduation Year</p>
                <p className="font-medium text-gray-900 dark:text-white">{user.graduation_year}</p>
              </div>
            )}
            {user?.major && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Major</p>
                <p className="font-medium text-gray-900 dark:text-white">{user.major}</p>
              </div>
            )}
          </div>
        </div>

        {/* Account Settings Panel */}
        {showSettings && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-xl">
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
                        onChange={(e) => setMajor(e.target.value)}
                        placeholder="Enter your major (e.g., Computer Science, Biology)"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
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
              <div>
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
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#d97706] dark:bg-gray-800 rounded-lg p-4 shadow-lg">
            <p className="text-sm text-primary-100 dark:text-gray-400 mb-1">Transcripts</p>
            <p className="text-2xl font-bold text-white dark:text-white">{transcripts?.length || 0}</p>
          </div>
          <div className="bg-[#d97706] dark:bg-gray-800 rounded-lg p-4 shadow-lg">
            <p className="text-sm text-primary-100 dark:text-gray-400 mb-1">Help Requests</p>
            <p className="text-2xl font-bold text-white dark:text-white">{helpRequests?.length || 0}</p>
          </div>
          <div className="bg-[#d97706] dark:bg-gray-800 rounded-lg p-4 shadow-lg">
            <p className="text-sm text-primary-100 dark:text-gray-400 mb-1">Courses</p>
            <p className="text-2xl font-bold text-white dark:text-white">
              {courses?.length || 0}
            </p>
          </div>
          <Link
            href="/analytics"
            className="bg-[#d97706] dark:bg-gray-800 rounded-lg p-4 shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            <p className="text-sm text-primary-100 dark:text-gray-400 mb-1">View Analytics</p>
            <p className="text-lg font-semibold text-white dark:text-white">→</p>
          </Link>
        </div>

        {/* Transcripts Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Transcripts</h2>
            <Link
              href="/upload"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
            >
              + Upload New
            </Link>
          </div>
          {transcripts && transcripts.length > 0 ? (
            <div className="space-y-3">
              {transcripts.map((transcript) => (
                <div
                  key={transcript.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{transcript.file_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Uploaded: {new Date(transcript.upload_date).toLocaleDateString()}
                      {transcript.file_size && (
                        <> • {(transcript.file_size / 1024 / 1024).toFixed(2)} MB</>
                      )}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      transcript.processing_status
                    )}`}
                  >
                    {transcript.processing_status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No transcripts uploaded yet.{' '}
              <Link href="/upload" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                Upload your first transcript
              </Link>
            </p>
          )}
        </div>

        {/* Courses Section */}
        <div className="bg-[#d97706] dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-4 text-white dark:text-white">Your Courses</h2>
          
          {/* Search Input */}
          {courses && courses.length > 0 && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-200 dark:text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search courses by code, name, grade, semester, or year..."
                  value={courseSearchQuery}
                  onChange={(e) => setCourseSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-primary-600 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-300 dark:focus:ring-primary-500"
                />
              </div>
            </div>
          )}
          
          {courses && courses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-primary-700 dark:border-gray-600">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white dark:text-white">Course Code</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white dark:text-white">Course Name</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-white dark:text-white">Grade</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-white dark:text-white">Credits</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-white dark:text-white">Semester</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-white dark:text-white">Year</th>
                  </tr>
                </thead>
                <tbody>
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
                      className="border-b border-primary-700/50 dark:border-gray-700/50 hover:bg-primary-700/20 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-white dark:text-white font-medium">{course.course_code}</td>
                      <td className="py-3 px-4 text-primary-100 dark:text-gray-300">{course.course_name || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        {course.grade ? (
                          <span className={`px-2 py-1 rounded text-sm font-medium ${
                            course.grade.startsWith('A') ? 'bg-green-500/30 text-green-100 dark:bg-green-900/30 dark:text-green-400' :
                            course.grade.startsWith('B') ? 'bg-blue-500/30 text-blue-100 dark:bg-blue-900/30 dark:text-blue-400' :
                            course.grade.startsWith('C') ? 'bg-yellow-500/30 text-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-gray-500/30 text-gray-100 dark:bg-gray-700/50 dark:text-gray-400'
                          }`}>
                            {course.grade}
                          </span>
                        ) : (
                          <span className="text-primary-200 dark:text-gray-500">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-primary-100 dark:text-gray-300">
                        {course.credit_hours ? course.credit_hours : '—'}
                      </td>
                      <td className="py-3 px-4 text-primary-100 dark:text-gray-300">{course.semester || '—'}</td>
                      <td className="py-3 px-4 text-center text-primary-100 dark:text-gray-300">
                        {course.year || '—'}
                      </td>
                    </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-primary-100 dark:text-gray-400">
                          No courses found matching "{courseSearchQuery}"
                        </td>
                      </tr>
                    )
                  })()}
                </tbody>
              </table>
              <div className="mt-4 text-sm text-primary-100 dark:text-gray-400 text-center">
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
            <p className="text-primary-100 dark:text-gray-400 text-center py-8">
              No courses found. Upload and process a transcript to see your courses here.
            </p>
          )}
        </div>

        {/* Help Requests Section */}
        <div className="bg-[#d97706] dark:bg-gray-800 rounded-lg p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white dark:text-white">Your Help Requests</h2>
            <Link
              href="/help"
              className="text-primary-200 dark:text-primary-400 hover:text-primary-100 dark:hover:text-primary-300 text-sm font-medium"
            >
              + New Request
            </Link>
          </div>
          {helpRequests && helpRequests.length > 0 ? (
            <div className="space-y-3">
              {helpRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 bg-primary-700/30 dark:bg-gray-700/50 rounded"
                >
                  <div>
                    <p className="font-medium text-white dark:text-white">{request.course_code}</p>
                    {request.course_name && (
                      <p className="text-sm text-primary-100 dark:text-gray-400">{request.course_name}</p>
                    )}
                    <p className="text-xs text-primary-200 dark:text-gray-500">
                      Created: {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    href={`/help?request=${request.id}`}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-primary-100 dark:text-gray-400 text-center py-8">
              No help requests yet.{' '}
              <Link href="/help" className="text-primary-200 dark:text-primary-400 hover:text-primary-100 dark:hover:text-primary-300">
                Create your first request
              </Link>
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
