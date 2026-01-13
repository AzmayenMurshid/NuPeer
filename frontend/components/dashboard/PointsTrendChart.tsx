'use client'

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

interface PointsTrendChartProps {
  data: any[]
  hasNoData: boolean
}

export function PointsTrendChart({ data, hasNoData }: PointsTrendChartProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Points Trend</h3>
        <Link
          href="/analytics#points-trend"
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm font-medium"
        >
          View Details
          <ArrowRight size={16} />
        </Link>
      </div>
      {hasNoData || !data || data.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No points trend data available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Upload your transcript to see your points progression over time</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
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
              domain={[0, 'auto']}
              stroke="#6b7280"
              className="dark:text-gray-400"
              tick={{ fill: 'currentColor' }}
              label={{ value: 'Points', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              domain={[0, 'auto']}
              stroke="#6b7280"
              className="dark:text-gray-400"
              tick={{ fill: 'currentColor' }}
              label={{ value: 'Credits', angle: 90, position: 'insideRight' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="points" 
              stroke="#10b981" 
              strokeWidth={3}
              name="Total Points"
              dot={{ fill: '#10b981', r: 5 }}
              activeDot={{ r: 8 }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="attempted_credits" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Attempted Credits"
              dot={{ fill: '#3b82f6', r: 4 }}
              strokeDasharray="5 5"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="earned_credits" 
              stroke="#f59e0b" 
              strokeWidth={2}
              name="Earned Credits"
              dot={{ fill: '#f59e0b', r: 4 }}
            />
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

