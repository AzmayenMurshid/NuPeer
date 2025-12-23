'use client'

import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useTranscripts } from '@/lib/hooks/useTranscripts'
import { useHelpRequests } from '@/lib/hooks/useHelpRequests'
import Link from 'next/link'

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

  return (
    <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
            ← Back to Home
          </Link>
        </div>

        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
                {user?.first_name} {user?.last_name}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Sign Out
            </button>
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
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Transcripts</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{transcripts?.length || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Help Requests</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{helpRequests?.length || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Courses</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {transcripts?.filter(t => t.processing_status === 'completed').length || 0}
            </p>
          </div>
        </div>

        {/* Transcripts Section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-6 mb-6">
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

        {/* Help Requests Section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Help Requests</h2>
            <Link
              href="/help"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
            >
              + New Request
            </Link>
          </div>
          {helpRequests && helpRequests.length > 0 ? (
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
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No help requests yet.{' '}
              <Link href="/help" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                Create your first request
              </Link>
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
