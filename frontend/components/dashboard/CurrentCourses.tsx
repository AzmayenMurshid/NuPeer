'use client'

import Link from 'next/link'
import { Clock } from 'lucide-react'
import { Course } from '@/lib/hooks/useCourses'

interface CurrentCoursesProps {
  courses: Course[]
}

export function CurrentCourses({ courses }: CurrentCoursesProps) {
  return (
    <div className="card p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Current Courses</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Courses you're currently taking
          </p>
        </div>
        <Link
          href="/upload"
          className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          Manage →
        </Link>
      </div>
      {courses.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-600 dark:text-gray-400 mb-1">
            You're not taking any courses currently.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Enjoy your break! 🎉
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {courses.map((course) => (
            <div
              key={course.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {course.course_code}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                    <Clock className="w-3 h-3" />
                    Current
                  </span>
                </div>
                {course.course_name && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {course.course_name}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-500">
                  {course.semester && <span>{course.semester}</span>}
                  {course.year && <span>{course.year}</span>}
                  {course.credit_hours && <span>{course.credit_hours} credits</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

