'use client'

import { useState } from 'react'
import { useUploadTranscript, useTranscriptStatus, useTranscripts } from '@/lib/hooks/useTranscripts'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Link from 'next/link'

function UploadPageContent() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedTranscriptId, setUploadedTranscriptId] = useState<string | null>(null)
  
  const uploadMutation = useUploadTranscript()
  const { data: transcripts } = useTranscripts()
  const { data: transcriptStatus } = useTranscriptStatus(uploadedTranscriptId || '')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      const result = await uploadMutation.mutateAsync(selectedFile)
      setUploadedTranscriptId(result.id)
      setSelectedFile(null)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

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
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
            ← Back to Dashboard
          </Link>
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Upload Transcript</h1>
          <span className="text-xl font-semibold text-primary-600 dark:text-primary-400">ΣΝ</span>
        </div>
        <p className="text-xl text-gray-700 dark:text-gray-200 mb-8">
          Upload your transcript PDF to automatically extract your courses
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-xl">
          <div className="mb-4">
            <label className="block text-sm font-medium text-white dark:text-gray-300 mb-2">
              Select PDF File
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-50 dark:file:bg-primary-900/30 file:text-primary-700 dark:file:text-primary-300
                hover:file:bg-primary-100 dark:hover:file:bg-primary-900/50"
            />
          </div>

          {selectedFile && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Selected: <span className="font-medium">{selectedFile.name}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload Transcript'}
          </button>

          {uploadMutation.isError && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
              <p className="font-medium mb-1">Upload failed</p>
              <p className="text-xs">
                {uploadMutation.error instanceof Error 
                  ? uploadMutation.error.message 
                  : (uploadMutation.error as any)?.response?.data?.detail || 'Please try again.'}
              </p>
              {(uploadMutation.error as any)?.response?.data?.detail?.includes('MinIO') && (
                <p className="text-xs mt-2">
                  💡 Make sure MinIO is running. Check the backend setup guide.
                </p>
              )}
            </div>
          )}

          {uploadMutation.isSuccess && uploadedTranscriptId && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
              <p className="text-green-800 dark:text-green-300 font-medium mb-2">Upload successful!</p>
              <p className="text-sm text-green-700 dark:text-green-400">
                Your transcript is being processed. This may take a few moments.
              </p>
            </div>
          )}
        </div>

        {/* Processing Status */}
        {transcriptStatus && (
          <div className="bg-[#d97706] dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Processing Status</h2>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transcriptStatus.processing_status)}`}>
                {transcriptStatus.processing_status.charAt(0).toUpperCase() + transcriptStatus.processing_status.slice(1)}
              </span>
              <span className="text-sm text-white dark:text-gray-300">
                {transcriptStatus.file_name}
              </span>
            </div>
            {transcriptStatus.error_message && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">{transcriptStatus.error_message}</p>
            )}
            {transcriptStatus.processing_status === 'completed' && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                ✓ Transcript processed successfully! Your courses have been extracted.
              </p>
            )}
          </div>
        )}

        {/* Previous Transcripts */}
        {transcripts && transcripts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Your Transcripts</h2>
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
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transcript.processing_status)}`}>
                    {transcript.processing_status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function UploadPage() {
  return (
    <ProtectedRoute>
      <UploadPageContent />
    </ProtectedRoute>
  )
}
