'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280']

interface GradeDistributionPieChartProps {
  data: any[]
  hasNoData: boolean
}

export function GradeDistributionPieChart({ data, hasNoData }: GradeDistributionPieChartProps) {
  return (
    <div className="card p-6 mb-8">
      <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Grade Distribution</h3>
      {hasNoData || data.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No grade distribution data available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Upload your transcript to see your grade distribution</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={data as any}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry: any) => `${entry.grade}: ${entry.percentage}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="count"
              nameKey="grade"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

