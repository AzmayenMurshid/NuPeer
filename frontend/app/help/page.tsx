'use client'

import { useState, useMemo } from 'react'
import { useCreateHelpRequest, useRecommendations, useHelpRequests, usePreviousTutors, useConnectedBrothers, PreviousTutor } from '@/lib/hooks/useHelpRequests'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Link from 'next/link'

// Demo data commented out - replaced with empty array
// No demo data available. Users must upload a transcript and create help requests to see previous tutors.
const demoPreviousTutors: PreviousTutor[] = []

function HelpPageContent() {
  const [courseCode, setCourseCode] = useState('')
  const [courseName, setCourseName] = useState('')
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null)

  const createRequestMutation = useCreateHelpRequest()
  const { data: helpRequests } = useHelpRequests()
  const { data: recommendations } = useRecommendations(activeRequestId)
  const { data: previousTutors } = usePreviousTutors()
  const { data: connectedBrothers } = useConnectedBrothers()
  
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

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
    if (grade.startsWith('B')) return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
    if (grade.startsWith('C')) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
    return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50'
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Get Help</h1>
          <span className="text-xl font-semibold text-primary-600 dark:text-primary-400">ΣΝ</span>
        </div>
        <p className="text-xl text-gray-700 dark:text-gray-200 mb-8">
          Find <span className="font-semibold text-primary-600 dark:text-primary-400">Sigma Nu</span> brothers who excelled in the classes you need help with
        </p>

        {/* Create Help Request Form */}
        <div className="bg-[#d97706] dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-xl">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Request Help with a Course</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Course Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g., CS 101"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Course Name (optional)
              </label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g., Introduction to Computer Science"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={createRequestMutation.isPending}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Recommended Brothers</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Ranked by their grade in the course
            </p>
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div
                  key={rec.helper_id}
                  className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30 hover:shadow-lg transition-all shadow-md"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg text-white dark:text-white">{rec.helper_name}</h3>
                      <p className="text-sm text-primary-100 dark:text-gray-300">
                        {rec.course_code}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(rec.grade)}`}>
                        {rec.grade}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Rank #{rec.rank}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                    {rec.semester && rec.year && (
                      <span>{rec.semester} {rec.year}</span>
                    )}
                    {rec.helper_email && (
                      <a
                        href={`mailto:${rec.helper_email}`}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                      >
                        Contact
                      </a>
                    )}
                  </div>
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

        {/* Connected Brothers */}
        {connectedBrothers && connectedBrothers.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Connected Brothers</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Brothers you've connected with through help requests
            </p>
            <div className="space-y-4">
              {connectedBrothers.map((brother) => (
                <div
                  key={brother.helper_id}
                  className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30 hover:shadow-lg transition-all shadow-md"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{brother.helper_name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Helped with {brother.total_courses} course{brother.total_courses !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      {brother.helper_email && (
                        <a
                          href={`mailto:${brother.helper_email}`}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                        >
                          Contact
                        </a>
                      )}
                    </div>
                  </div>
                  
                  {/* Courses this brother helped with */}
                  <div className="mt-3 space-y-2">
                    {brother.courses_helped.map((course, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900 dark:text-white">{course.course_code}</span>
                          {course.semester && course.year && (
                            <span className="text-gray-500 dark:text-gray-400">
                              {course.semester} {course.year}
                            </span>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getGradeColor(course.grade)}`}>
                          {course.grade}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>First connected: {new Date(brother.first_connected).toLocaleDateString()}</span>
                    <span>Last connected: {new Date(brother.last_connected).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Previous Tutors */}
        {displayPreviousTutors && displayPreviousTutors.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Previous Tutors</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Brothers who have helped you in the past, ranked by their performance
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayPreviousTutors.map((tutor) => (
                <div
                  key={`${tutor.helper_id}-${tutor.course_code}`}
                  className="p-5 rounded-lg bg-gradient-to-br from-[#d97706] to-[#b45309] dark:from-gray-700 dark:to-gray-800 hover:shadow-xl transition-all shadow-lg border border-primary-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-white dark:text-white mb-1">
                        {tutor.helper_name}
                      </h3>
                      <p className="text-sm text-primary-100 dark:text-gray-300 font-medium">
                        {tutor.course_code}
                      </p>
                    </div>
                    <div className="ml-3">
                      <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${getGradeColor(tutor.grade)}`}>
                        {tutor.grade}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    {tutor.semester && tutor.year && (
                      <div className="flex items-center gap-2 text-sm text-primary-100 dark:text-gray-300">
                        <span className="font-medium">Semester:</span>
                        <span>{tutor.semester} {tutor.year}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-primary-200 dark:text-gray-400">
                      <span>Helped on:</span>
                      <span>{new Date(tutor.help_request_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {tutor.helper_email && (
                    <a
                      href={`mailto:${tutor.helper_email}`}
                      className="block w-full text-center px-4 py-2 bg-white dark:bg-gray-900 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-50 dark:hover:bg-gray-800 transition-colors font-medium text-sm shadow-sm"
                    >
                      Contact
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 mb-8 shadow-xl text-center">
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

        {/* Previous Help Requests */}
        {helpRequests && helpRequests.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Your Help Requests</h2>
            <div className="space-y-3">
              {helpRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{request.course_code}</p>
                    {request.course_name && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{request.course_name}</p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Created: {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleViewRecommendations(request.id)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                  >
                    View Recommendations
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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
