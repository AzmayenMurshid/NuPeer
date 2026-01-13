'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
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

interface CreditsEarnedChartProps {
  data: any[]
  hasNoData: boolean
}

export function CreditsEarnedChart({ data, hasNoData }: CreditsEarnedChartProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Credits Earned</h3>
        <Link
          href="/analytics#credits-earned"
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm font-medium"
        >
          View Details
          <ArrowRight size={16} />
        </Link>
      </div>
      {hasNoData || data.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No semester credit data available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Upload your transcript to see your credit progression by semester</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
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
            <Bar dataKey="credits" fill="#3b82f6" name="Credits" radius={[8, 8, 0, 0]} />
            <Legend 
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ paddingTop: '20px', paddingBottom: '5px' }}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

