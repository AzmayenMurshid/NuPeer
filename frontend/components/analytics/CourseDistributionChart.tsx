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

interface CourseDistributionChartProps {
  data: any[]
  hasNoData: boolean
}

export function CourseDistributionChart({ data, hasNoData }: CourseDistributionChartProps) {
  if (hasNoData || !data || data.length === 0) {
    return (
      <div className="card p-6 border-dashed">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Courses by Department</h2>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-2">No department data available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Upload your transcript to see course distribution</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Courses by Department</h2>
      <ResponsiveContainer width="100%" height={500}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
          <XAxis 
            dataKey="category" 
            stroke="#6b7280"
            className="dark:text-gray-400"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis 
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
          <Bar dataKey="count" fill="#8b5cf6" name="Number of Courses" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

