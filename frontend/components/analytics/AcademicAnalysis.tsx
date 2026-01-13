'use client'

interface AcademicAnalysisProps {
  hasNoData: boolean
  overallGpa: number
  insights: {
    topDepartment: { category: string; percentage: number } | null
    avgCreditsPerSemester: number
    isImproving: boolean
    bestSemester: { period: string }
    worstSemester: { period: string; gpa: number }
  }
  filteredGradeDistribution: any[]
}

export function AcademicAnalysis({
  hasNoData,
  overallGpa,
  insights,
  filteredGradeDistribution
}: AcademicAnalysisProps) {
  if (hasNoData) {
    return (
      <div className="card p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Academic Analysis</h2>
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No academic analysis available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Upload your transcript to see detailed academic insights and recommendations</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6 mb-8">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Academic Analysis</h2>
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-2 border-blue-500">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Strengths</h3>
          <ul className="list-disc list-inside text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li>Strong performance in {insights.topDepartment?.category || 'core'} courses ({insights.topDepartment?.percentage.toFixed(1) || 0}% of coursework)</li>
            <li>{filteredGradeDistribution.find(g => g.grade === 'A')?.percentage.toFixed(1) || 0}% of courses completed with an A grade</li>
            <li>Consistent credit load averaging {insights.avgCreditsPerSemester.toFixed(1)} credits per semester</li>
            {insights.isImproving && <li>Positive GPA trend showing continuous improvement</li>}
          </ul>
        </div>
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-2 border-yellow-500">
          <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-300 mb-2">Areas for Improvement</h3>
          <ul className="list-disc list-inside text-xs text-yellow-800 dark:text-yellow-200 space-y-1">
            {overallGpa < 3.5 && <li>Overall GPA below 3.5 - focus on maintaining higher grades</li>}
            {filteredGradeDistribution.find(g => g.grade === 'C') && (
              <li>{filteredGradeDistribution.find(g => g.grade === 'C')?.percentage.toFixed(1) || 0}% of courses with C grades - consider additional study support</li>
            )}
            {insights.worstSemester.gpa < insights.bestSemester.gpa && (
              <li>Performance varied between semesters - identify factors affecting {insights.worstSemester.period}</li>
            )}
          </ul>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-2 border-green-500">
          <h3 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-2">Recommendations</h3>
          <ul className="list-disc list-inside text-xs text-green-800 dark:text-green-200 space-y-1">
            <li>Continue focusing on {insights.topDepartment?.category || 'your strongest'} department courses</li>
            <li>Maintain current credit load for optimal performance</li>
            <li>Consider seeking help from brothers who excelled in challenging courses</li>
            <li>Build on the momentum from {insights.bestSemester.period} semester</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

