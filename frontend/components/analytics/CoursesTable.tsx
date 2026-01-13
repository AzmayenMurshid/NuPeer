'use client'

import { Search, Clock } from 'lucide-react'
import Link from 'next/link'
import { getGradeColor } from './utils'

interface CoursesTableProps {
  courses: any[]
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function CoursesTable({ courses, searchQuery, onSearchChange }: CoursesTableProps) {
  if (!courses || courses.length === 0) {
    return (
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">All Courses</h2>
        </div>
        <div className="text-center py-12">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Courses Found</p>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Upload your transcript to see your courses and grades.</p>
          <Link
            href="/upload"
            className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
          >
            Upload Transcript
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">All Courses</h2>
      </div>
      
      {/* Search Input */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
          <input
            type="text"
            placeholder="Search courses by code, name, grade, semester, or year..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
          />
        </div>
      </div>
      
      <div className="overflow-x-auto scroll-optimized">
        <div className="max-h-[600px] overflow-y-auto scroll-optimized">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                  Course Code
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                  Course Name
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                  Grade
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                  Credits
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                  Semester
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                  Year
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-black">
              {courses.map((course, index) => (
                <tr 
                  key={course.id || index}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <span>{course.course_code}</span>
                      {(!course.transcript_id || !course.grade) && (
                        <span 
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          title="Currently taking"
                        >
                          <Clock className="w-3 h-3" />
                          Current
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {course.course_name || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {course.grade ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(course.grade)}`}>
                        {course.grade}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                    {course.credit_hours ? course.credit_hours.toFixed(1) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                    {course.semester || '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                    {course.year || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
          {searchQuery ? (
            <span>
              Showing {courses.length} course{courses.length !== 1 ? 's' : ''}
            </span>
          ) : (
            <span>
              Total: {courses.length} course{courses.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

