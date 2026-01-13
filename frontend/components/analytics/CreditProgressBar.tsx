'use client'

interface CreditProgressBarProps {
  hasNoData: boolean
  totalCredits: number
  avgCreditsPerSemester: number
}

export function CreditProgressBar({
  hasNoData,
  totalCredits,
  avgCreditsPerSemester
}: CreditProgressBarProps) {
  if (hasNoData) {
    return (
      <div className="card p-6 mb-8">
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No degree progress data</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Upload your transcript to track progress</p>
        </div>
      </div>
    )
  }

  const progressPercentage = Math.min((totalCredits / 120) * 100, 100)
  const remainingCredits = Math.max(0, 120 - totalCredits)
  const estimatedSemesters = Math.ceil(remainingCredits / avgCreditsPerSemester)

  return (
    <div className="card p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Degree Progress</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            120 credits required
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {progressPercentage.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {totalCredits} / 120
          </p>
        </div>
      </div>
      
      <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-primary-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
        <div className="text-center">
          <p className="font-medium text-gray-700 dark:text-gray-300">Freshman</p>
          <p className="text-gray-500 dark:text-gray-400">0-30</p>
        </div>
        <div className="text-center">
          <p className="font-medium text-gray-700 dark:text-gray-300">Sophomore</p>
          <p className="text-gray-500 dark:text-gray-400">31-60</p>
        </div>
        <div className="text-center">
          <p className="font-medium text-gray-700 dark:text-gray-300">Junior</p>
          <p className="text-gray-500 dark:text-gray-400">61-90</p>
        </div>
        <div className="text-center">
          <p className="font-medium text-gray-700 dark:text-gray-300">Senior</p>
          <p className="text-gray-500 dark:text-gray-400">91-120</p>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {remainingCredits.toFixed(1)} credits
          </span>
        </div>
        {totalCredits < 120 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Est. Semesters:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {estimatedSemesters}
            </span>
          </div>
        )}
        {totalCredits >= 120 && (
          <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/30 rounded text-center">
            <span className="text-sm text-green-700 dark:text-green-400 font-medium">
              🎓 Credit requirement completed!
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

