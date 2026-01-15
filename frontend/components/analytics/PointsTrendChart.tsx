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
  Area
} from 'recharts'

interface PointsTrendChartProps {
  data: any[]
  hasNoData: boolean
  showProjection: boolean
  timeFilter: string
  onTimeFilterChange: (filter: string) => void
  onProjectionToggle: (show: boolean) => void
}

export function PointsTrendChart({
  data,
  hasNoData,
  showProjection,
  timeFilter,
  onTimeFilterChange,
  onProjectionToggle
}: PointsTrendChartProps) {
  if (hasNoData || !data || data.length === 0) {
    return (
      <div id="points-trend" className="card p-6 scroll-mt-20 lg:col-span-2">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Points Trend</h2>
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
              className="px-4 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
          <p className="text-gray-500 dark:text-gray-400 mb-2">No points trend data available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Upload your transcript to see your points progression over time</p>
        </div>
      </div>
    )
  }

  const filteredData = data.filter((d: any) => !d.isProjected)
  const allData = data

  return (
    <div id="points-trend" className="card p-6 scroll-mt-20 lg:col-span-2">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Points Trend</h2>
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
            className="px-4 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="last_year">Last Year</option>
            <option value="last_2_years">Last 2 Years</option>
            <option value="last_3_years">Last 3 Years</option>
            <option value="last_5_years">Last 5 Years</option>
          </select>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={500}>
        <LineChart data={allData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
            allowDuplicatedCategory={false}
          />
          <YAxis 
            yAxisId="left"
            domain={[0, 'auto']}
            allowDataOverflow={false}
            stroke="#10b981"
            className="dark:text-gray-400"
            tick={{ fill: 'currentColor', fontSize: 12 }}
            label={{ value: 'Points', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            domain={[0, 'auto']}
            allowDataOverflow={false}
            stroke="#f59e0b"
            className="dark:text-gray-400"
            tick={{ fill: 'currentColor', fontSize: 12 }}
            label={{ value: 'Credits', angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value: any, name?: string, props?: any) => {
              const displayName = name || ''
              if (displayName === 'Total Points' || displayName === 'Points (Projected)') {
                const attempted = props?.payload?.attempted_credits ? ` | Attempted: ${props.payload.attempted_credits.toFixed(1)}` : ''
                const earned = props?.payload?.earned_credits ? ` | Earned: ${props.payload.earned_credits.toFixed(1)}` : ''
                return [`${value.toFixed(1)}${attempted}${earned}`, displayName]
              }
              if (displayName === 'Earned Credits' || displayName === 'Earned Credits (Projected)') {
                const points = props?.payload?.points ? ` | Points: ${props.payload.points.toFixed(1)}` : ''
                return [`${value.toFixed(1)} credits${points}`, displayName]
              }
              return [value, displayName]
            }}
            labelFormatter={(label) => `Period: ${label}`}
          />
          <Legend 
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: '10px' }}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="points"
            stroke="none"
            fill="#10b981"
            fillOpacity={0.15}
            baseValue={0}
            legendType="none"
            data={filteredData}
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="points" 
            stroke="#10b981" 
            strokeWidth={5}
            name="Total Points"
            dot={(props: any) => {
              const { payload } = props
              if (payload?.isProjected) {
                return <circle cx={props.cx} cy={props.cy} r={4} fill="#10b981" opacity={0.6} />
              }
              return <circle cx={props.cx} cy={props.cy} r={7} fill="#10b981" stroke="#fff" strokeWidth={2.5} />
            }}
            activeDot={{ r: 12, stroke: '#10b981', strokeWidth: 3, fill: '#fff' }}
            data={filteredData}
            animationDuration={800}
          />
          {showProjection && (
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="points" 
              stroke="#10b981" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Points (Projected)"
              dot={(props: any) => {
                const { payload } = props
                if (payload?.isProjected) {
                  return <circle cx={props.cx} cy={props.cy} r={4} fill="#10b981" opacity={0.6} />
                }
                return null
              }}
              connectNulls={true}
              data={allData}
            />
          )}
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="earned_credits"
            stroke="none"
            fill="#f59e0b"
            fillOpacity={0.12}
            baseValue={0}
            legendType="none"
            data={filteredData}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="earned_credits" 
            stroke="#f59e0b" 
            strokeWidth={4}
            name="Earned Credits"
            dot={(props: any) => {
              const { payload } = props
              if (payload?.isProjected) {
                return <circle cx={props.cx} cy={props.cy} r={3} fill="#f59e0b" opacity={0.6} />
              }
              return <circle cx={props.cx} cy={props.cy} r={6} fill="#f59e0b" stroke="#fff" strokeWidth={2} />
            }}
            activeDot={{ r: 10, stroke: '#f59e0b', strokeWidth: 2.5, fill: '#fff' }}
            data={filteredData}
            animationDuration={800}
          />
          {showProjection && (
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="earned_credits" 
              stroke="#f59e0b" 
              strokeWidth={1.5}
              strokeDasharray="8 4"
              name="Earned Credits (Projected)"
              dot={(props: any) => {
                const { payload } = props
                if (payload?.isProjected) {
                  return <circle cx={props.cx} cy={props.cy} r={3} fill="#f59e0b" opacity={0.5} />
                }
                return null
              }}
              connectNulls={true}
              data={allData}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

