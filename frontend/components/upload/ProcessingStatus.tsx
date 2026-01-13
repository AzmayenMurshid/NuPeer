'use client'

interface ProcessingStatusProps {
  transcriptStatus: {
    processing_status: string
    file_name: string
    error_message?: string | null
  } | null
}

function getStatusColor(status: string) {
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

export function ProcessingStatus({ transcriptStatus }: ProcessingStatusProps) {
  if (!transcriptStatus) {
    return null
  }

  return (
    <div className="card p-6 mb-8">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Processing Status</h2>
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
  )
}

