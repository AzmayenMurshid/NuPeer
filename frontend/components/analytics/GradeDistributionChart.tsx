'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface GradeDistributionChartProps {
  data: any[]
  hasNoData: boolean
}

export function GradeDistributionChart({ data, hasNoData }: GradeDistributionChartProps) {
  if (hasNoData || data.length === 0) {
    return (
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Grade Distribution</h2>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No grade distribution data available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Upload your transcript to see your grade distribution</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6 mb-8">
      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Grade Distribution</h2>
      <div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis 
              dataKey="grade" 
              stroke="#6b7280"
              className="dark:text-gray-400"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              domain={[0, 'auto']}
              stroke="#6b7280"
              className="dark:text-gray-400"
              tick={{ fill: 'currentColor' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="count" fill="#f59e0b" name="Number of Courses" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

