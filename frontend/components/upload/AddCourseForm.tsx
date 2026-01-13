'use client'

import { Plus, X } from 'lucide-react'
import { Course } from '@/lib/hooks/useCourses'

interface CourseFormData {
  course_code: string
  course_name: string
  credit_hours: string
  semester: string
  year: string
}

interface AddCourseFormProps {
  editingCourse: Course | null
  showAddCourseForm: boolean
  multipleCourses: CourseFormData[]
  courseForm: CourseFormData
  onToggleForm: () => void
  onCancelEdit: () => void
  onAddMultipleCourses: (e: React.FormEvent) => void
  onAddCourse: (e: React.FormEvent) => void
  onUpdateCourse: (e: React.FormEvent) => void
  onAddCourseRow: () => void
  onRemoveCourseRow: (index: number) => void
  onUpdateMultipleCourse: (index: number, field: string, value: string) => void
  onCourseFormChange: (field: keyof CourseFormData, value: string) => void
  createCourseMutation: {
    isPending: boolean
    isError: boolean
    isSuccess: boolean
    error: any
  }
  updateCourseMutation: {
    isPending: boolean
    isError: boolean
    isSuccess: boolean
    error: any
  }
}

export function AddCourseForm({
  editingCourse,
  showAddCourseForm,
  multipleCourses,
  courseForm,
  onToggleForm,
  onCancelEdit,
  onAddMultipleCourses,
  onAddCourse,
  onUpdateCourse,
  onAddCourseRow,
  onRemoveCourseRow,
  onUpdateMultipleCourse,
  onCourseFormChange,
  createCourseMutation,
  updateCourseMutation
}: AddCourseFormProps) {
  return (
    <div className="card p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editingCourse ? 'Edit Course' : 'Add Current Course'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {editingCourse ? 'Update course information' : "Manually add courses you're currently taking"}
          </p>
        </div>
        {!editingCourse && (
          <button
            onClick={onToggleForm}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
          >
            <div className="relative w-4 h-4">
              <Plus className={`w-4 h-4 absolute inset-0 transition-all duration-300 ${showAddCourseForm ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`} />
              <X className={`w-4 h-4 absolute inset-0 transition-all duration-300 ${showAddCourseForm ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`} />
            </div>
            {showAddCourseForm ? 'Cancel' : 'Add Course'}
          </button>
        )}
        {editingCourse && (
          <button
            onClick={onCancelEdit}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        )}
      </div>

      {(showAddCourseForm || editingCourse) && !editingCourse ? (
        <form onSubmit={onAddMultipleCourses} className="space-y-4">
          <div className="space-y-4">
            {multipleCourses.map((course, index) => (
              <div key={index} className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Course {index + 1}</h3>
                  {multipleCourses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveCourseRow(index)}
                      className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Remove course"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Course Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={course.course_code}
                      onChange={(e) => onUpdateMultipleCourse(index, 'course_code', e.target.value)}
                      placeholder="e.g., CS 101"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Course Name
                    </label>
                    <input
                      type="text"
                      value={course.course_name}
                      onChange={(e) => onUpdateMultipleCourse(index, 'course_name', e.target.value)}
                      placeholder="e.g., Introduction to Computer Science"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Credit Hours
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={course.credit_hours}
                      onChange={(e) => onUpdateMultipleCourse(index, 'credit_hours', e.target.value)}
                      placeholder="e.g., 3"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Semester
                    </label>
                    <select
                      value={course.semester}
                      onChange={(e) => onUpdateMultipleCourse(index, 'semester', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Auto (Current)</option>
                      <option value="Fall">Fall</option>
                      <option value="Spring">Spring</option>
                      <option value="Summer">Summer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Year
                    </label>
                    <input
                      type="number"
                      min="2000"
                      max="2100"
                      value={course.year}
                      onChange={(e) => onUpdateMultipleCourse(index, 'year', e.target.value)}
                      placeholder="Auto (Current Year)"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onAddCourseRow}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Another Course
          </button>

          {createCourseMutation.isError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
              <p className="font-medium mb-1">Failed to add courses</p>
              <p className="text-xs">
                {(createCourseMutation.error as any)?.response?.data?.detail || 'Please try again.'}
              </p>
            </div>
          )}

          {createCourseMutation.isSuccess && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-400 text-sm">
              Courses added successfully!
            </div>
          )}

          <button
            type="submit"
            disabled={!multipleCourses.some(c => c.course_code.trim()) || createCourseMutation.isPending}
            className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium active:scale-95"
          >
            {createCourseMutation.isPending ? 'Adding Courses...' : `Add ${multipleCourses.filter(c => c.course_code.trim()).length} Course(s)`}
          </button>
        </form>
      ) : (showAddCourseForm || editingCourse) && (
        <form onSubmit={editingCourse ? onUpdateCourse : onAddCourse} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Course Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={courseForm.course_code}
                onChange={(e) => onCourseFormChange('course_code', e.target.value)}
                placeholder="e.g., CS 101"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Course Name
              </label>
              <input
                type="text"
                value={courseForm.course_name}
                onChange={(e) => onCourseFormChange('course_name', e.target.value)}
                placeholder="e.g., Introduction to Computer Science"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Credit Hours
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={courseForm.credit_hours}
                onChange={(e) => onCourseFormChange('credit_hours', e.target.value)}
                placeholder="e.g., 3"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Semester
              </label>
              <select
                value={courseForm.semester}
                onChange={(e) => onCourseFormChange('semester', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Auto (Current)</option>
                <option value="Fall">Fall</option>
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Year
              </label>
              <input
                type="number"
                min="2000"
                max="2100"
                value={courseForm.year}
                onChange={(e) => onCourseFormChange('year', e.target.value)}
                placeholder="Auto (Current Year)"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {(createCourseMutation.isError || updateCourseMutation.isError) && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
              <p className="font-medium mb-1">Failed to {editingCourse ? 'update' : 'add'} course</p>
              <p className="text-xs">
                {((editingCourse ? updateCourseMutation.error : createCourseMutation.error) as any)?.response?.data?.detail || 'Please try again.'}
              </p>
            </div>
          )}

          {(createCourseMutation.isSuccess || updateCourseMutation.isSuccess) && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-400 text-sm">
              Course {editingCourse ? 'updated' : 'added'} successfully!
            </div>
          )}

          <button
            type="submit"
            disabled={!courseForm.course_code.trim() || createCourseMutation.isPending || updateCourseMutation.isPending}
            className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium active:scale-95"
          >
            {editingCourse 
              ? (updateCourseMutation.isPending ? 'Updating...' : 'Update Course')
              : (createCourseMutation.isPending ? 'Adding...' : 'Add Course')
            }
          </button>
        </form>
      )}
    </div>
  )
}
