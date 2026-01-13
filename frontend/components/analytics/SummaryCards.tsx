'use client'

interface SummaryCardsProps {
  hasNoData: boolean
  overallGpa: number
  totalCredits: number
  totalCourses: number
  avgCreditsPerSemester: number
  departmentCount: number
}

export function SummaryCards({
  hasNoData,
  overallGpa,
  totalCredits,
  totalCourses,
  avgCreditsPerSemester,
  departmentCount
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {hasNoData ? (
        <>
          <div className="card p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Overall GPA</p>
            <p className="metric-value text-gray-400 dark:text-gray-600">-</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">No data</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Credits</p>
            <p className="metric-value text-gray-400 dark:text-gray-600">-</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">No data</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Courses</p>
            <p className="metric-value text-gray-400 dark:text-gray-600">-</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">No data</p>
          </div>
        </>
      ) : (
        <>
          <div className="card p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Overall GPA</p>
            <p className="metric-value text-gray-900 dark:text-white">{overallGpa.toFixed(2)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {overallGpa >= 3.5 ? 'Excellent' : overallGpa >= 3.0 ? 'Good' : 'Needs Improvement'}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Credits</p>
            <p className="metric-value text-gray-900 dark:text-white">{totalCredits}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Avg: {avgCreditsPerSemester.toFixed(1)} per semester
            </p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Courses</p>
            <p className="metric-value text-gray-900 dark:text-white">{totalCourses}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {departmentCount} departments
            </p>
          </div>
        </>
      )}
    </div>
  )
}

