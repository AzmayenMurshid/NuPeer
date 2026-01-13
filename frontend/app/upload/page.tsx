'use client'

import { useState } from 'react'
import { useUploadTranscript, useTranscriptStatus, useTranscripts } from '@/lib/hooks/useTranscripts'
import { useCreateCourse, useUpdateCourse, useDeleteCourse, useCourses, Course } from '@/lib/hooks/useCourses'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { UploadPageHeader } from '@/components/upload/UploadPageHeader'
import { TranscriptUploadForm } from '@/components/upload/TranscriptUploadForm'
import { ProcessingStatus } from '@/components/upload/ProcessingStatus'
import { AddCourseForm } from '@/components/upload/AddCourseForm'
import { CurrentCoursesList } from '@/components/upload/CurrentCoursesList'
import { PreviousTranscripts } from '@/components/upload/PreviousTranscripts'

type CourseFormData = {
  course_code: string
  course_name: string
  credit_hours: string
  semester: string
  year: string
}

const UploadPageContent = (): JSX.Element => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedTranscriptId, setUploadedTranscriptId] = useState<string | null>(null)
  const [showAddCourseForm, setShowAddCourseForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [courseForm, setCourseForm] = useState<CourseFormData>({
    course_code: '',
    course_name: '',
    credit_hours: '',
    semester: '',
    year: ''
  })
  const [multipleCourses, setMultipleCourses] = useState<CourseFormData[]>([{
    course_code: '',
    course_name: '',
    credit_hours: '',
    semester: '',
    year: ''
  }])
  
  const uploadMutation = useUploadTranscript()
  const createCourseMutation = useCreateCourse()
  const updateCourseMutation = useUpdateCourse()
  const deleteCourseMutation = useDeleteCourse()
  const { data: courses } = useCourses()
  const { data: transcripts } = useTranscripts()
  const { data: transcriptStatus } = useTranscriptStatus(uploadedTranscriptId || '')
  
  // Filter to only show manually added courses (current courses)
  const currentCourses = courses?.filter(course => !course.transcript_id) || []
  
  const startEdit = (course: Course) => {
    setEditingCourse(course)
    setCourseForm({
      course_code: course.course_code || '',
      course_name: course.course_name || '',
      credit_hours: course.credit_hours?.toString() || '',
      semester: course.semester || '',
      year: course.year?.toString() || ''
    })
    setShowAddCourseForm(false)
  }
  
  const cancelEdit = () => {
    setEditingCourse(null)
    setCourseForm({
      course_code: '',
      course_name: '',
      credit_hours: '',
      semester: '',
      year: ''
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      const result = await uploadMutation.mutateAsync(selectedFile)
      setUploadedTranscriptId(result.id)
      setSelectedFile(null)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!courseForm.course_code.trim()) {
      return
    }

    try {
      await createCourseMutation.mutateAsync({
        course_code: courseForm.course_code.trim(),
        course_name: courseForm.course_name.trim() || undefined,
        credit_hours: courseForm.credit_hours ? parseFloat(courseForm.credit_hours) : undefined,
        semester: courseForm.semester || undefined,
        year: courseForm.year ? parseInt(courseForm.year) : undefined
      })
      
      // Reset form
      setCourseForm({
        course_code: '',
        course_name: '',
        credit_hours: '',
        semester: '',
        year: ''
      })
      setShowAddCourseForm(false)
    } catch (error) {
      console.error('Failed to add course:', error)
    }
  }

  const handleAddMultipleCourses = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Filter out empty courses (at least course_code is required)
    const validCourses = multipleCourses.filter(course => course.course_code.trim())
    
    if (validCourses.length === 0) {
      return
    }

    try {
      // Create all courses in parallel
      await Promise.all(
        validCourses.map(course =>
          createCourseMutation.mutateAsync({
            course_code: course.course_code.trim(),
            course_name: course.course_name.trim() || undefined,
            credit_hours: course.credit_hours ? parseFloat(course.credit_hours) : undefined,
            semester: course.semester || undefined,
            year: course.year ? parseInt(course.year) : undefined
          })
        )
      )
      
      // Reset form
      setMultipleCourses([{
        course_code: '',
        course_name: '',
        credit_hours: '',
        semester: '',
        year: ''
      }])
      setShowAddCourseForm(false)
    } catch (error) {
      console.error('Failed to add courses:', error)
    }
  }

  const addCourseRow = () => {
    setMultipleCourses([...multipleCourses, {
      course_code: '',
      course_name: '',
      credit_hours: '',
      semester: '',
      year: ''
    }])
  }

  const removeCourseRow = (index: number) => {
    if (multipleCourses.length > 1) {
      setMultipleCourses(multipleCourses.filter((_, i) => i !== index))
    }
  }

  const updateMultipleCourse = (index: number, field: string, value: string) => {
    const updated = [...multipleCourses]
    updated[index] = { ...updated[index], [field]: value }
    setMultipleCourses(updated)
  }

  const handleCourseFormChange = (field: keyof CourseFormData, value: string) => {
    setCourseForm({ ...courseForm, [field]: value })
  }
  
  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingCourse || !courseForm.course_code.trim()) {
      return
    }

    try {
      await updateCourseMutation.mutateAsync({
        courseId: editingCourse.id,
        courseData: {
          course_code: courseForm.course_code.trim(),
          course_name: courseForm.course_name.trim() || undefined,
          credit_hours: courseForm.credit_hours ? parseFloat(courseForm.credit_hours) : undefined,
          semester: courseForm.semester || undefined,
          year: courseForm.year ? parseInt(courseForm.year) : undefined
        }
      })
      
      // Reset form
      cancelEdit()
    } catch (error) {
      console.error('Failed to update course:', error)
    }
  }

  const handleToggleForm = () => {
    setShowAddCourseForm(!showAddCourseForm)
    if (showAddCourseForm) {
      setMultipleCourses([{
        course_code: '',
        course_name: '',
        credit_hours: '',
        semester: '',
        year: ''
      }])
    }
  }

  const handleDeleteCourse = (courseId: string) => {
    deleteCourseMutation.mutate(courseId)
  }

  return (
    <main className="min-h-screen bg-white dark:bg-black content-with-nav">
      <UploadPageHeader />
        
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Upload your transcript PDF to automatically extract your courses
        </p>

        <TranscriptUploadForm
          selectedFile={selectedFile}
          onFileChange={handleFileChange}
          onUpload={handleUpload}
          isPending={uploadMutation.isPending}
          isError={uploadMutation.isError}
          isSuccess={uploadMutation.isSuccess && !!uploadedTranscriptId}
          error={uploadMutation.error}
        />

        <ProcessingStatus transcriptStatus={transcriptStatus || null} />

        <AddCourseForm
          editingCourse={editingCourse}
          showAddCourseForm={showAddCourseForm}
          multipleCourses={multipleCourses}
          courseForm={courseForm}
          onToggleForm={handleToggleForm}
          onCancelEdit={cancelEdit}
          onAddMultipleCourses={handleAddMultipleCourses}
          onAddCourse={handleAddCourse}
          onUpdateCourse={handleUpdateCourse}
          onAddCourseRow={addCourseRow}
          onRemoveCourseRow={removeCourseRow}
          onUpdateMultipleCourse={updateMultipleCourse}
          onCourseFormChange={handleCourseFormChange}
          createCourseMutation={createCourseMutation}
          updateCourseMutation={updateCourseMutation}
        />

        <CurrentCoursesList
          courses={currentCourses}
          onEdit={startEdit}
          onDelete={handleDeleteCourse}
          isDeleting={deleteCourseMutation.isPending}
          isUpdating={updateCourseMutation.isPending}
          deleteError={deleteCourseMutation.error}
        />

        <PreviousTranscripts transcripts={transcripts} />
      </div>
    </main>
  )
}

export default function UploadPage() {
  return (
    <ProtectedRoute>
      <UploadPageContent />
    </ProtectedRoute>
  )
}
