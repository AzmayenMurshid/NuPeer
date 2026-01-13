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

interface CreditsBySemesterChartProps {
  data: any[]
  hasNoData: boolean
}

export function CreditsBySemesterChart({ data, hasNoData }: CreditsBySemesterChartProps) {
  if (hasNoData || data.length === 0) {
    return (
      <div className="card p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Credits by Semester</h2>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No semester credit data available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Upload your transcript to see your credit progression by semester</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6 mb-8">
      <h2 id="credits-earned" className="text-xl font-semibold mb-6 text-gray-900 dark:text-white scroll-mt-20">Credits Earned</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
          <XAxis 
            dataKey="period" 
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
          <Bar dataKey="credits" fill="#3b82f6" name="Credits" />
          <Legend 
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ paddingTop: '20px', paddingBottom: '5px' }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

