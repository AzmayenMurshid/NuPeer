'use client'

interface SummaryStatsProps {
  overallGpa: number
  cumulativeGpa?: number
  totalCredits: number
  totalCourses: number
  departmentCount: number
  hasNoData: boolean
}

export function SummaryStats({ 
  overallGpa, 
  cumulativeGpa,
  totalCredits, 
  totalCourses, 
  departmentCount,
  hasNoData 
}: SummaryStatsProps) {
  // Always use the calculated cumulative GPA from term GPAs when available
  // This is the progressive cumulative GPA calculated from term GPAs
  const displayGpa = cumulativeGpa !== undefined ? cumulativeGpa : overallGpa
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {hasNoData ? (
        <>
          <div className="card p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Cumulative GPA</p>
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
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Cumulative GPA</p>
            <p className="metric-value text-gray-900 dark:text-white">
              {cumulativeGpa !== undefined ? cumulativeGpa.toFixed(2) : displayGpa.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {displayGpa >= 3.5 ? 'Excellent' : displayGpa >= 3.0 ? 'Good' : 'Needs Improvement'}
            </p>
            {cumulativeGpa === undefined && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Calculated from all courses
              </p>
            )}
          </div>
          <div className="card p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Credits</p>
            <p className="metric-value text-gray-900 dark:text-white">{totalCredits}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {((totalCredits / 120) * 100).toFixed(1)}% to degree
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

