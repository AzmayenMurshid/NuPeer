'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAcademicAnalytics } from '@/lib/hooks/useAnalytics'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { User } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

// Force dynamic rendering to avoid SSR issues with theme
export const dynamic = 'force-dynamic'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280']

// Demo data commented out - replaced with empty data structure
// No demo data available. Users must upload a transcript to see their academic analytics.
const demoAnalytics = {
  overall_gpa: 0,
  total_credits: 0,
  total_courses: 0,
  gpa_trend: [],
  grade_distribution: [],
  credits_by_semester: [],
  course_distribution_by_department: [],
  points_trend: [],
}

type GraphView = 'gpa' | 'credits' | 'courses' | 'gpa-credits' | 'gpa-courses' | 'all'

function DashboardContent() {
  const { user } = useAuth()
  const { data: analytics } = useAcademicAnalytics()
  const [graphView, setGraphView] = useState<GraphView>('all')
  
  // Only show real data - no demo data
  const displayAnalytics = useMemo(() => {
    return analytics || demoAnalytics
  }, [analytics])
  
  const hasNoData = !analytics || (analytics?.total_courses ?? 0) === 0
  
  // Filter out grades with 0 count for pie chart
  const filteredGradeDistribution = useMemo(() => {
    return (displayAnalytics.grade_distribution || []).filter(grade => grade.count > 0)
  }, [displayAnalytics.grade_distribution])

  return (
    <main className="min-h-screen p-8 bg-white dark:bg-[#1a1a1a]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">NuPeer</h1>
              <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">ΣΝ</span>
            </div>
            <p className="text-xl text-gray-700 dark:text-gray-200">
              Connect with <span className="font-semibold text-primary-600 dark:text-primary-400">Sigma Nu</span> brothers who can help with your classes
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/profile"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              {user?.first_name} {user?.last_name}
            </Link>
            <Link
              href="/profile"
              className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center"
              title="Profile"
            >
              <User className="w-5 h-5" />
            </Link>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Link 
            href="/upload" 
            className="p-6 rounded-lg bg-[#d97706] dark:bg-gray-800 hover:shadow-2xl shadow-lg transition-all cursor-pointer group transform hover:-translate-y-1"
          >
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-semibold text-white dark:text-white group-hover:text-primary-200 dark:group-hover:text-primary-400 transition-colors">Upload Transcript</h2>
            </div>
            <p className="text-primary-100 dark:text-gray-300">
              Upload your transcript PDF to automatically extract your courses
            </p>
          </Link>
          <Link 
            href="/help" 
            className="p-6 rounded-lg bg-[#d97706] dark:bg-gray-800 hover:shadow-2xl shadow-lg transition-all cursor-pointer group transform hover:-translate-y-1"
          >
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-semibold text-white dark:text-white group-hover:text-primary-200 dark:group-hover:text-primary-400 transition-colors">Get Help</h2>
            </div>
            <p className="text-primary-100 dark:text-gray-300">
              Find brothers who excelled in the classes you need help with
            </p>
          </Link>
        </div>

        {/* Academic Analytics Section - Always show */}
        <div className="mt-12 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Your Academic Performance</h2>
              <span className="text-lg font-semibold text-primary-600 dark:text-primary-400">ΣΝ</span>
            </div>

            {/* Summary Stats - Always show */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {hasNoData ? (
                <>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 shadow-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Overall GPA</p>
                    <p className="text-4xl font-bold text-gray-400 dark:text-gray-500">-</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">No data available</p>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 shadow-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Credits</p>
                    <p className="text-4xl font-bold text-gray-400 dark:text-gray-500">-</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">No data available</p>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 shadow-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Courses</p>
                    <p className="text-4xl font-bold text-gray-400 dark:text-gray-500">-</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">No data available</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-[#d97706] dark:bg-gray-800 rounded-lg p-6 shadow-xl">
                    <p className="text-sm text-primary-100 dark:text-gray-400 mb-2">Overall GPA</p>
                    <p className="text-4xl font-bold text-white dark:text-white">{displayAnalytics.overall_gpa.toFixed(2)}</p>
                  </div>
                  <div className="bg-[#d97706] dark:bg-gray-800 rounded-lg p-6 shadow-xl">
                    <p className="text-sm text-primary-100 dark:text-gray-400 mb-2">Total Credits</p>
                    <p className="text-4xl font-bold text-white dark:text-white">{displayAnalytics.total_credits}</p>
                  </div>
                  <div className="bg-[#d97706] dark:bg-gray-800 rounded-lg p-6 shadow-xl">
                    <p className="text-sm text-primary-100 dark:text-gray-400 mb-2">Total Courses</p>
                    <p className="text-4xl font-bold text-white dark:text-white">{displayAnalytics.total_courses}</p>
                  </div>
                </>
              )}
            </div>

            {/* Long Combined Graph Section with Dropdown - Always show */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-2xl mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Academic Trends Over Time</h3>
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
              </div>
              {hasNoData || displayAnalytics.gpa_trend.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No trend data available</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Upload your transcript to see your academic trends over time</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={500}>
                  <LineChart data={displayAnalytics.gpa_trend} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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

            {/* Grade Distribution and Credits Side by Side - Always show */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Grade Distribution Bar Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-2xl">
                <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Grade Distribution</h3>
                {hasNoData || filteredGradeDistribution.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No grade distribution data available</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Upload your transcript to see your grade distribution</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={filteredGradeDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                      <XAxis 
                        dataKey="grade" 
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
                      <Bar dataKey="count" fill="#f59e0b" name="Number of Courses" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Credits Earned Over Time */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-2xl">
                <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Credits Earned Over Time</h3>
                {hasNoData || displayAnalytics.credits_by_semester.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No semester credit data available</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Upload your transcript to see your credit progression by semester</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={displayAnalytics.credits_by_semester}>
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
            </div>

            {/* Grade Distribution Pie Chart - Always show */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-2xl mb-8">
              <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Grade Distribution (Pie Chart)</h3>
              {hasNoData || filteredGradeDistribution.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No grade distribution data available</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Upload your transcript to see your grade distribution</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={filteredGradeDistribution as any}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.grade}: ${entry.percentage}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="grade"
                    >
                      {filteredGradeDistribution.map((entry, index) => (
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

            {/* Classes Distribution Section - Always show */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Course Distribution by Department */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-2xl">
                <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Courses by Department</h3>
                {hasNoData || !displayAnalytics.course_distribution_by_department || displayAnalytics.course_distribution_by_department.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No department data available</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Upload your transcript to see course distribution by department</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={displayAnalytics.course_distribution_by_department}>
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
                        formatter={(value: any) => [value, 'Number of Courses']}
                        labelFormatter={(label) => `Department: ${label}`}
                      />
                      <Legend />
                      <Bar dataKey="count" fill="#8b5cf6" name="Number of Courses" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Points Trend Over Time */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-2xl">
                <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Points Trend Over Time</h3>
                {hasNoData || !displayAnalytics.points_trend || displayAnalytics.points_trend.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No points trend data available</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Upload your transcript to see your points progression over time</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={displayAnalytics.points_trend} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
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
                        stroke="#6b7280"
                        className="dark:text-gray-400"
                        tick={{ fill: 'currentColor' }}
                        label={{ value: 'Points', angle: -90, position: 'insideLeft' }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
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
            </div>
          </div>
      </div>
    </main>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}

