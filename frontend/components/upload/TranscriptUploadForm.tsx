'use client'

interface TranscriptUploadFormProps {
  selectedFile: File | null
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onUpload: () => void
  isPending: boolean
  isError: boolean
  isSuccess: boolean
  error: any
}

export function TranscriptUploadForm({
  selectedFile,
  onFileChange,
  onUpload,
  isPending,
  isError,
  isSuccess,
  error
}: TranscriptUploadFormProps) {
  return (
    <div className="card p-6 mb-8">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Upload Transcript</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select PDF File
        </label>
        <input
          type="file"
          accept=".pdf"
          onChange={onFileChange}
          className="block w-full text-sm text-gray-500 dark:text-gray-400
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-medium
            file:bg-primary-500 file:text-white
            hover:file:bg-primary-600 file:transition-colors"
        />
      </div>

      {selectedFile && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {selectedFile.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      )}

      <button
        onClick={onUpload}
        disabled={!selectedFile || isPending}
        className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium active:scale-95"
      >
        {isPending ? 'Uploading...' : 'Upload Transcript'}
      </button>

      {isError && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
          <p className="font-medium mb-1">Upload failed</p>
          <p className="text-xs">
            {error instanceof Error 
              ? error.message 
              : (error as any)?.response?.data?.detail || 'Please try again.'}
          </p>
          {(error as any)?.response?.data?.detail?.includes('MinIO') && (
            <p className="text-xs mt-2">
              💡 Make sure MinIO is running. Check the backend setup guide.
            </p>
          )}
        </div>
      )}

      {isSuccess && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
          <p className="text-green-800 dark:text-green-300 font-medium mb-2">Upload successful!</p>
          <p className="text-sm text-green-700 dark:text-green-400">
            Your transcript is being processed. This may take a few moments.
          </p>
        </div>
      )}
    </div>
  )
}

