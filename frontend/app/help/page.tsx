'use client'

import { useState } from 'react'
import { useCreateHelpRequest, useRecommendations, useHelpRequests } from '@/lib/hooks/useHelpRequests'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Link from 'next/link'

function HelpPageContent() {
  const [courseCode, setCourseCode] = useState('')
  const [courseName, setCourseName] = useState('')
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null)

  const createRequestMutation = useCreateHelpRequest()
  const { data: helpRequests } = useHelpRequests()
  const { data: recommendations } = useRecommendations(activeRequestId)

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
    <main className="min-h-screen p-8 bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Get Help</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Find brothers who excelled in the classes you need help with
        </p>

        {/* Create Help Request Form */}
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-6 mb-8">
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
          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Recommended Brothers</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Ranked by their grade in the course
            </p>
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div
                  key={rec.helper_id}
                  className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/30 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{rec.helper_name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
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

        {/* Previous Help Requests */}
        {helpRequests && helpRequests.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-6">
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
