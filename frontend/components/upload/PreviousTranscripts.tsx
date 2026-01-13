'use client'

interface Transcript {
  id: string
  file_name: string
  upload_date: string
  processing_status: string
}

interface PreviousTranscriptsProps {
  transcripts: Transcript[] | undefined
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

export function PreviousTranscripts({ transcripts }: PreviousTranscriptsProps) {
  if (!transcripts || transcripts.length === 0) {
    return null
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Previous Transcripts</h2>
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
              </p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ml-3 flex-shrink-0 ${getStatusColor(transcript.processing_status)}`}>
              {transcript.processing_status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

