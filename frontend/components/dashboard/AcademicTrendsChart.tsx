'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

type GraphView = 'gpa' | 'credits' | 'courses' | 'gpa-credits' | 'gpa-courses' | 'all'

interface AcademicTrendsChartProps {
  data: any[]
  hasNoData: boolean
}

export function AcademicTrendsChart({ data, hasNoData }: AcademicTrendsChartProps) {
  const [graphView, setGraphView] = useState<GraphView>('all')

  return (
    <div className="card p-6 mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Academic Trends</h3>
        <div className="flex items-center gap-responsive-sm flex-wrap">
          {!hasNoData && (
            <select
              value={graphView}
              onChange={(e) => setGraphView(e.target.value as GraphView)}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
            >
              <option value="gpa">GPA Only</option>
              <option value="credits">Credits Only</option>
              <option value="courses">Course Count Only</option>
              <option value="gpa-credits">GPA + Credits</option>
              <option value="gpa-courses">GPA + Course Count</option>
              <option value="all">All (GPA + Credits + Courses)</option>
            </select>
          )}
          <Link
            href="/analytics#gpa-trend"
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm font-medium"
          >
            View Details
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
      {hasNoData || data.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No trend data available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Upload your transcript to see your academic trends over time</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis 
              dataKey="period" 
              stroke="#6b7280"
              className="dark:text-gray-400"
              tick={{ fill: 'currentColor' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              yAxisId="left"
              domain={
                graphView === 'gpa' ? [0, 4.0] :
                graphView === 'credits' ? [0, 'auto'] :
                graphView === 'courses' ? [0, 'auto'] :
                graphView === 'gpa-credits' ? [0, 4.0] :
                graphView === 'gpa-courses' ? [0, 4.0] :
                [0, 4.0] // 'all' view - GPA on left
              }
              stroke="#6b7280"
              className="dark:text-gray-400"
              tick={{ fill: 'currentColor' }}
              label={
                graphView === 'gpa' || graphView === 'gpa-credits' || graphView === 'gpa-courses' || graphView === 'all' 
                  ? { value: 'GPA', angle: -90, position: 'insideLeft' }
                  : graphView === 'credits'
                  ? { value: 'Credits', angle: -90, position: 'insideLeft' }
                  : graphView === 'courses'
                  ? { value: 'Course Count', angle: -90, position: 'insideLeft' }
                  : undefined
              }
            />
            {(graphView === 'gpa-credits') && (
              <YAxis 
                yAxisId="right"
                orientation="right"
                domain={[0, 'auto']}
                stroke="#3b82f6"
                className="dark:text-gray-400"
                tick={{ fill: 'currentColor' }}
                label={{ value: 'Credits Earned', angle: 90, position: 'insideRight' }}
              />
            )}
            {(graphView === 'gpa-courses') && (
              <YAxis 
                yAxisId="right"
                orientation="right"
                domain={[0, 'auto']}
                stroke="#10b981"
                className="dark:text-gray-400"
                tick={{ fill: 'currentColor' }}
                label={{ value: 'Number of Courses', angle: 90, position: 'insideRight' }}
              />
            )}
            {(graphView === 'all') && (
              <YAxis 
                yAxisId="right"
                orientation="right"
                domain={[0, 'auto']}
                stroke="#6b7280"
                className="dark:text-gray-400"
                tick={{ fill: 'currentColor' }}
                label={{ value: 'Credits & Courses', angle: 90, position: 'insideRight' }}
              />
            )}
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            {(graphView === 'gpa' || graphView === 'gpa-credits' || graphView === 'gpa-courses' || graphView === 'all') && (
              <Line 
                type="monotone" 
                dataKey="gpa" 
                yAxisId="left"
                stroke="#f59e0b" 
                strokeWidth={4}
                name="GPA"
                dot={{ fill: '#f59e0b', r: 6 }}
                activeDot={{ r: 10 }}
              />
            )}
            {(graphView === 'credits' || graphView === 'gpa-credits' || graphView === 'all') && (
              <Line 
                type="monotone" 
                dataKey="credits" 
                yAxisId={graphView === 'credits' ? 'left' : 'right'}
                stroke="#3b82f6" 
                strokeWidth={4}
                name="Credits"
                dot={{ fill: '#3b82f6', r: 6 }}
                activeDot={{ r: 10 }}
              />
            )}
            {(graphView === 'courses' || graphView === 'gpa-courses' || graphView === 'all') && (
              <Line 
                type="monotone" 
                dataKey="course_count" 
                yAxisId={graphView === 'courses' ? 'left' : 'right'}
                stroke="#10b981" 
                strokeWidth={4}
                name="Course Count"
                dot={{ fill: '#10b981', r: 6 }}
                activeDot={{ r: 10 }}
              />
            )}
            <Legend 
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ paddingTop: '20px', paddingBottom: '5px' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

