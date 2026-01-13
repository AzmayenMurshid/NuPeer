'use client'

import { useState, useMemo, useEffect } from 'react'
import { useCreateHelpRequest, useRecommendations, useHelpRequests, usePreviousTutors, useConnectedBrothers, useDeleteHelpRequest, PreviousTutor } from '@/lib/hooks/useHelpRequests'
import { useCourses } from '@/lib/hooks/useCourses'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Edit, Trash2, Mail, Phone, X, User, Calendar } from 'lucide-react'
import { StudyTechniques } from '@/components/help/StudyTechniques'

// Demo data commented out - replaced with empty array
// No demo data available. Users must upload a transcript and create help requests to see previous tutors.
const demoPreviousTutors: PreviousTutor[] = []

function HelpPageContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [courseCode, setCourseCode] = useState('')
  const [courseName, setCourseName] = useState('')
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [expandedContacts, setExpandedContacts] = useState<Set<string>>(new Set())
  const [selectedTutorContact, setSelectedTutorContact] = useState<{helper_id: string, course_code: string, helper_email: string | null, helper_phone_number: string | null} | null>(null)
  const [selectedRecommendationContact, setSelectedRecommendationContact] = useState<{helper_id: string, course_code: string, helper_email: string | null, helper_phone_number: string | null} | null>(null)
  const [windowWidth, setWindowWidth] = useState<number>(0)
  
  const handleInviteToEvent = (userId: string) => {
    router.push(`/calendar?invite=${userId}`)
  }

  // Track window width for responsive popup
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    
    // Set initial width
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth)
      window.addEventListener('resize', handleResize)
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [])

  const createRequestMutation = useCreateHelpRequest()
  const deleteRequestMutation = useDeleteHelpRequest()
  const { data: helpRequestsData } = useHelpRequests()
  
  // Sort help requests by most recent first (created_at descending)
  const helpRequests = useMemo(() => {
    if (!helpRequestsData) return []
    return [...helpRequestsData].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [helpRequestsData])
  const { data: recommendations } = useRecommendations(activeRequestId)
  const { data: previousTutors } = usePreviousTutors()
  const { data: connectedBrothers } = useConnectedBrothers()
  const { data: courses } = useCourses()
  
  // Filter to only show manually added courses (current courses)
  const currentCourses = useMemo(() => {
    return courses?.filter(course => !course.transcript_id) || []
  }, [courses])
  
  // Filter to show completed courses from transcripts
  const completedCourses = useMemo(() => {
    return courses?.filter(course => course.transcript_id) || []
  }, [courses])
  
  // Only show real data - no demo data
  const displayPreviousTutors = useMemo(() => {
    return previousTutors || []
  }, [previousTutors])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseCode.trim()) return

    try {
      const result = await createRequestMutation.mutateAsync({
        course_code: courseCode.trim().toUpperCase(),
        course_name: courseName.trim() || undefined,
      })
      setActiveRequestId(result.id)
      setCourseCode('')
      setCourseName('')
    } catch (error) {
      console.error('Failed to create help request:', error)
    }
  }

  const handleViewRecommendations = (requestId: string) => {
    setActiveRequestId(requestId)
  }

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this help request? This action cannot be undone.')) {
      return
    }

    try {
      await deleteRequestMutation.mutateAsync(requestId)
      // If the deleted request was active, clear the active request
      if (activeRequestId === requestId) {
        setActiveRequestId(null)
      }
    } catch (error) {
      console.error('Failed to delete help request:', error)
      alert('Failed to delete help request. Please try again.')
    }
  }

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
    if (grade.startsWith('B')) return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
    if (grade.startsWith('C')) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
    return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50'
  }

  const toggleContact = (contactId: string) => {
    setExpandedContacts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(contactId)) {
        newSet.delete(contactId)
      } else {
        newSet.add(contactId)
      }
      return newSet
    })
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
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Get Help</h1>
              <span className="text-xs font-semibold text-primary-500">ΣΝ</span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                href="/profile"
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
              >
                <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.first_name} {user?.last_name}
                </span>
          </Link>
        </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Find <span className="font-semibold text-primary-500">Sigma Nu</span> brothers who excelled in the classes you need help with
        </p>

        {/* Create Help Request Form - Robinhood style */}
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Request Help</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Course Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g., CS 101"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Course Name (optional)
              </label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g., Introduction to Computer Science"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={createRequestMutation.isPending}
              className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium active:scale-95"
            >
              {createRequestMutation.isPending ? 'Searching...' : 'Find Help'}
            </button>
          </form>

          {createRequestMutation.isError && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
              Failed to create help request. Please try again.
            </div>
          )}
        </div>

        {/* Recommendations - Robinhood style */}
        {recommendations && recommendations.length > 0 && (
          <div className="card p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recommended Brothers</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Ranked by grade in {recommendations[0]?.course_code}
            </p>
            <div className="space-y-2">
              {recommendations.map((rec) => (
                <div
                  key={rec.helper_id}
                  className="p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors border border-gray-200 dark:border-gray-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{rec.helper_name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {rec.course_code}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getGradeColor(rec.grade)}`}>
                        {rec.grade}
                      </span>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">#{rec.rank}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    {rec.semester && rec.year && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">{rec.semester} {rec.year}</span>
                    )}
                    <button
                      onClick={() => handleInviteToEvent(rec.helper_id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Invite to Event
                    </button>
                    {(rec.helper_email || rec.helper_phone_number) && (
                            <button
                              onClick={() => toggleContact(`rec-${rec.helper_id}`)}
                        className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                            >
                              Contact
                            </button>
                    )}
                  </div>
                  {expandedContacts.has(`rec-${rec.helper_id}`) && (rec.helper_email || rec.helper_phone_number) && (
                    <div className="mt-3 pt-3 divider space-y-2">
                                {rec.helper_email && (
                        <a
                          href={`mailto:${rec.helper_email}?subject=${encodeURIComponent(`Help Request for ${rec.course_code}`)}`}
                          className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-600"
                                    >
                          <Mail className="w-4 h-4" />
                                      <span>{rec.helper_email}</span>
                        </a>
                                )}
                                {rec.helper_phone_number && (
                                    <a
                                      href={`tel:${rec.helper_phone_number}`}
                          className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-600"
                                    >
                          <Phone className="w-4 h-4" />
                                      <span>{rec.helper_phone_number}</span>
                                    </a>
                        )}
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>
        )}

        {recommendations && recommendations.length === 0 && activeRequestId && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
            <p className="text-yellow-800 dark:text-yellow-300">
              No brothers found who have taken this course. Try a different course code.
            </p>
          </div>
        )}

        {/* Connected Brothers - Robinhood style */}
        {connectedBrothers && connectedBrothers.length > 0 && (
          <div className="card p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Connected Brothers</h2>
            <div className="space-y-2">
              {connectedBrothers.map((brother) => (
                <div
                  key={brother.helper_id}
                  className="p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors border border-gray-200 dark:border-gray-800"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{brother.helper_name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {brother.total_courses} course{brother.total_courses !== 1 ? 's' : ''}
                      </p>
                    </div>
                      {(brother.helper_email || brother.helper_phone_number) && (
                          <button
                            onClick={() => toggleContact(`brother-${brother.helper_id}`)}
                        className="text-sm text-primary-500 hover:text-primary-600 font-medium ml-4"
                          >
                            Contact
                          </button>
                    )}
                  </div>
                  
                  {expandedContacts.has(`brother-${brother.helper_id}`) && (brother.helper_email || brother.helper_phone_number) && (
                    <div className="mb-3 pt-3 divider space-y-2">
                              {brother.helper_email && (
                        <a
                          href={`mailto:${brother.helper_email}?subject=${encodeURIComponent('Reconnecting - NuPeer')}`}
                          className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-600"
                                  >
                          <Mail className="w-4 h-4" />
                                    <span>{brother.helper_email}</span>
                        </a>
                              )}
                              {brother.helper_phone_number && (
                                  <a
                                    href={`tel:${brother.helper_phone_number}`}
                          className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-600"
                                  >
                          <Phone className="w-4 h-4" />
                                    <span>{brother.helper_phone_number}</span>
                                  </a>
                      )}
                    </div>
                  )}
                  
                  {/* Courses this brother helped with */}
                  <div className="space-y-1.5">
                    {brother.courses_helped.map((course, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">{course.course_code}</span>
                          {course.semester && course.year && (
                            <span className="text-gray-500 dark:text-gray-400">
                              {course.semester} {course.year}
                            </span>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getGradeColor(course.grade)}`}>
                          {course.grade}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Previous Tutors - Robinhood style */}
        {displayPreviousTutors && displayPreviousTutors.length > 0 ? (
          <div className="card p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Previous Tutors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayPreviousTutors.map((tutor) => (
                <div
                  key={`${tutor.helper_id}-${tutor.course_code}`}
                  className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-1">
                        {tutor.helper_name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                        {tutor.course_code}
                      </p>
                    </div>
                    <div className="ml-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(tutor.grade)}`}>
                        {tutor.grade}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 mb-3">
                    {tutor.semester && tutor.year && (
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Semester:</span>
                        <span>{tutor.semester} {tutor.year}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                      <span>Helped on:</span>
                      <span>{new Date(tutor.help_request_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => handleInviteToEvent(tutor.helper_id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 dark:bg-primary-600 text-white rounded-lg hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors font-medium text-sm"
                    >
                      <Calendar className="w-4 h-4" />
                      Invite to Event
                    </button>
                    {(tutor.helper_email || tutor.helper_phone_number) && (
                      <button
                        onClick={() => setSelectedTutorContact({
                          helper_id: tutor.helper_id,
                          course_code: tutor.course_code,
                          helper_email: tutor.helper_email,
                          helper_phone_number: tutor.helper_phone_number
                        })}
                        className="block w-full text-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium text-sm"
                      >
                        Contact
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card p-8 mb-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                No Previous Tutors
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Upload your transcript and create help requests to connect with brothers who can help with your courses.
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/upload"
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl font-medium"
                >
                  Upload Transcript
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Study Techniques Section - Show after tutors */}
        <StudyTechniques currentCourses={currentCourses} completedCourses={completedCourses} />

        {/* Previous Help Requests - Robinhood style */}
        {helpRequests && helpRequests.length > 0 && (
          <div className="card p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Help Requests</h2>
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
            </div>
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
                    <button
                      onClick={() => handleViewRecommendations(request.id)}
                      className="px-3 py-1.5 text-sm text-primary-500 hover:text-primary-600 font-medium"
                    >
                      View
                    </button>
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
          </div>
        )}
      </div>

      {/* Recommendation Contact Popup - Only for screens 320px or less */}
      {selectedRecommendationContact && windowWidth <= 320 && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-50 dark:bg-opacity-70"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedRecommendationContact(null)
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Contact Information</h3>
                <button
                  onClick={() => setSelectedRecommendationContact(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {selectedRecommendationContact.helper_email && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Email:</p>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const mailtoLink = `mailto:${selectedRecommendationContact.helper_email}?subject=${encodeURIComponent(`Help Request for ${selectedRecommendationContact.course_code}`)}`
                        window.location.href = mailtoLink
                      }}
                      className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 whitespace-nowrap underline hover:no-underline transition-all cursor-pointer bg-transparent border-none p-0 text-left w-full"
                    >
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="break-all">{selectedRecommendationContact.helper_email}</span>
                    </button>
                  </div>
                )}
                {selectedRecommendationContact.helper_phone_number && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Phone:</p>
                    <a
                      href={`tel:${selectedRecommendationContact.helper_phone_number}`}
                      className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 whitespace-nowrap underline hover:no-underline transition-all cursor-pointer"
                    >
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{selectedRecommendationContact.helper_phone_number}</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Previous Tutor Contact Popup */}
      {selectedTutorContact && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-50 dark:bg-opacity-70"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedTutorContact(null)
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Contact Information</h3>
                <button
                  onClick={() => setSelectedTutorContact(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {selectedTutorContact.helper_email && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Email:</p>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const mailtoLink = `mailto:${selectedTutorContact.helper_email}?subject=${encodeURIComponent(`Follow-up on ${selectedTutorContact.course_code} - NuPeer`)}`
                        window.location.href = mailtoLink
                      }}
                      className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 whitespace-nowrap underline hover:no-underline transition-all cursor-pointer bg-transparent border-none p-0 text-left w-full"
                    >
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="break-all">{selectedTutorContact.helper_email}</span>
                    </button>
                  </div>
                )}
                {selectedTutorContact.helper_phone_number && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Phone:</p>
                    <a
                      href={`tel:${selectedTutorContact.helper_phone_number}`}
                      className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 whitespace-nowrap underline hover:no-underline transition-all cursor-pointer"
                    >
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{selectedTutorContact.helper_phone_number}</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default function HelpPage() {
  return (
    <ProtectedRoute>
      <HelpPageContent />
    </ProtectedRoute>
  )
}
