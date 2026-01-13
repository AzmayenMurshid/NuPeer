'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area
} from 'recharts'

interface GPATrendChartProps {
  data: any[]
  showProjection: boolean
  timeFilter: string
  onTimeFilterChange: (filter: string) => void
  onProjectionToggle: (show: boolean) => void
}

export function GPATrendChart({
  data,
  showProjection,
  timeFilter,
  onTimeFilterChange,
  onProjectionToggle
}: GPATrendChartProps) {
  if (data.length === 0) {
    return (
      <div id="gpa-trend" className="card p-6 mb-8 scroll-mt-20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">GPA Trend</h2>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showProjection}
                onChange={(e) => onProjectionToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Show Projection</span>
            </label>
            <select
              value={timeFilter}
              onChange={(e) => onTimeFilterChange(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
            >
              <option value="all">All Time</option>
              <option value="last_year">Last Year</option>
              <option value="last_2_years">Last 2 Years</option>
              <option value="last_3_years">Last 3 Years</option>
              <option value="last_5_years">Last 5 Years</option>
            </select>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No GPA trend data available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Upload your transcript to see your GPA progression over time</p>
        </div>
      </div>
    )
  }

  return (
    <div id="gpa-trend" className="card p-6 mb-8 scroll-mt-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">GPA Trend</h2>
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showProjection}
              onChange={(e) => onProjectionToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Show Projection</span>
          </label>
          <select
            value={timeFilter}
            onChange={(e) => onTimeFilterChange(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
          >
            <option value="all">All Time</option>
            <option value="last_year">Last Year</option>
            <option value="last_2_years">Last 2 Years</option>
            <option value="last_3_years">Last 3 Years</option>
            <option value="last_5_years">Last 5 Years</option>
          </select>
        </div>
      </div>
      <div>
        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" opacity={0.3} />
            <XAxis 
              dataKey="period" 
              stroke="#6b7280"
              className="dark:text-gray-400"
              tick={{ fill: 'currentColor', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis 
              domain={[0, 4.0]}
              allowDataOverflow={false}
              stroke="#6b7280"
              className="dark:text-gray-400"
              tick={{ fill: 'currentColor', fontSize: 12 }}
              tickCount={9}
              label={{ value: 'GPA', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: any, name: string, props: any) => {
                if (name === 'GPA' || name === 'GPA (Projected)') {
                  const credits = props.payload.credits ? ` | Credits: ${props.payload.credits}` : ''
                  const courses = props.payload.course_count ? ` | Courses: ${props.payload.course_count}` : ''
                  return [`${value.toFixed(2)}${credits}${courses}`, name]
                }
                return [value, name]
              }}
              labelFormatter={(label) => `Period: ${label}`}
            />
            <ReferenceLine y={3.0} stroke="#ef4444" strokeDasharray="5 5" strokeOpacity={0.5} label={{ value: "3.0", position: "right", fill: "#ef4444" }} />
            <ReferenceLine y={3.5} stroke="#f59e0b" strokeDasharray="5 5" strokeOpacity={0.5} label={{ value: "3.5", position: "right", fill: "#f59e0b" }} />
            <ReferenceLine y={4.0} stroke="#10b981" strokeDasharray="5 5" strokeOpacity={0.5} label={{ value: "4.0", position: "right", fill: "#10b981" }} />
            <Legend 
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '10px' }}
            />
            <Area
              type="monotone"
              dataKey="gpa"
              stroke="none"
              fill="#f59e0b"
              fillOpacity={0.1}
              baseValue={0}
              legendType="none"
            />
            <Line 
              type="monotone" 
              dataKey="gpa" 
              stroke="#f59e0b" 
              strokeWidth={5}
              name="GPA"
              dot={(props: any) => {
                const { payload } = props
                if (payload?.isProjected) {
                  return <circle cx={props.cx} cy={props.cy} r={4} fill="#f59e0b" opacity={0.6} />
                }
                return <circle cx={props.cx} cy={props.cy} r={7} fill="#f59e0b" stroke="#fff" strokeWidth={2.5} />
              }}
              activeDot={{ r: 12, stroke: '#f59e0b', strokeWidth: 3, fill: '#fff' }}
              strokeDasharray={undefined}
              animationDuration={800}
            />
            {showProjection && (
              <>
                <Line 
                  type="monotone" 
                  dataKey="gpa" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="GPA (Projected)"
                  dot={(props: any) => {
                    const { payload } = props
                    if (payload?.isProjected) {
                      return <circle cx={props.cx} cy={props.cy} r={4} fill="#f59e0b" opacity={0.6} />
                    }
                    return null
                  }}
                  connectNulls={true}
                  data={data}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

