'use client'

interface PerformanceInsightsProps {
  hasNoData: boolean
  insights: {
    gpaChange: number
    isImproving: boolean
    gpaTrendInsights: string[]
    bestSemester: { gpa: number; period: string }
    topDepartment: { category: string; count: number; percentage: number } | null
  }
  bestSemesterCourses: string[]
  topDepartmentBestCourses: any[]
  courseOutliers: any[]
}

export function PerformanceInsights({
  hasNoData,
  insights,
  bestSemesterCourses,
  topDepartmentBestCourses,
  courseOutliers
}: PerformanceInsightsProps) {
  if (hasNoData) {
    return (
      <div className="card p-6 mb-8">
        <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Performance Insights</h2>
        <div className="text-center py-8">
          <p className="text-responsive-base text-gray-500 dark:text-gray-400 mb-4">No performance insights available</p>
          <p className="text-responsive-sm text-gray-400 dark:text-gray-500">Upload your transcript to see GPA trends and performance metrics</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6 mb-8">
      <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Performance Insights</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">GPA Trend</p>
          <p className={`text-2xl font-bold ${insights.isImproving ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {insights.isImproving ? '↑' : '↓'} {Math.abs(insights.gpaChange).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {insights.isImproving ? 'Improving' : 'Declining'}
          </p>
          {insights.gpaTrendInsights && insights.gpaTrendInsights.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Insights:</p>
              <div className="space-y-1">
                {insights.gpaTrendInsights.slice(0, 2).map((insight: string, index: number) => (
                  <p key={index} className="text-xs text-gray-600 dark:text-gray-400">
                    • {insight}
                  </p>
                ))}
                {insights.gpaTrendInsights.length > 2 && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                    +{insights.gpaTrendInsights.length - 2} more
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Best Semester</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{insights.bestSemester.period}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            GPA: {insights.bestSemester.gpa.toFixed(2)}
          </p>
          {bestSemesterCourses.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Courses:</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {bestSemesterCourses.join(', ')}
                {bestSemesterCourses.length >= 5 && '...'}
              </p>
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Top Department</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {insights.topDepartment?.category || 'N/A'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {insights.topDepartment?.count || 0} courses ({insights.topDepartment?.percentage.toFixed(1) || 0}%)
          </p>
          {topDepartmentBestCourses.length > 0 && (
            <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Best Courses:</p>
              <div className="space-y-1">
                {topDepartmentBestCourses.map((course: any, index: number) => (
                  <p key={index} className="text-xs text-blue-600 dark:text-blue-400">
                    • {course.course_code}: {course.grade || 'N/A'} 
                    {course.grade_score && ` (${parseFloat(course.grade_score).toFixed(1)})`}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-xs text-red-600 dark:text-red-400 mb-1 font-semibold">Course Outliers</p>
          {courseOutliers.length > 0 ? (
            <>
              <p className="text-xl font-bold text-red-900 dark:text-red-300">
                {courseOutliers.length} {courseOutliers.length === 1 ? 'Course' : 'Courses'}
              </p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                Struggling (C or below)
              </p>
              <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-700 space-y-1">
                {courseOutliers.slice(0, 3).map((course: any, index: number) => (
                  <p key={index} className="text-xs text-red-600 dark:text-red-400">
                    • {course.course_code}: {course.grade || 'N/A'}
                  </p>
                ))}
                {courseOutliers.length > 3 && (
                  <p className="text-xs text-red-600 dark:text-red-400 italic">
                    +{courseOutliers.length - 3} more
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-xl font-bold text-green-900 dark:text-green-300">
                None
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                All courses above C grade
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

