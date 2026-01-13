'use client'

import { useState, useEffect } from 'react'
import { X, Calendar as CalendarIcon, Users, BookOpen, MapPin, Video, Clock, UserPlus, Check } from 'lucide-react'
import { CreateCalendarEvent, UpdateCalendarEvent, EventType, CalendarEvent, useTutorSuggestions, useBrothersMajorSuggestions, useStudyGroupSuggestions, InviteSuggestion } from '@/lib/hooks/useCalendar'
import { useCourses } from '@/lib/hooks/useCourses'

interface EventFormProps {
  event?: CalendarEvent | null
  initialStartTime?: Date
  initialEndTime?: Date
  initialInvitees?: string[]  // Pre-selected user IDs to invite
  onClose: () => void
  onSubmit: (data: CreateCalendarEvent | UpdateCalendarEvent) => Promise<void>
  isSubmitting?: boolean
}

export function EventForm({
  event,
  initialStartTime,
  initialEndTime,
  initialInvitees = [],
  onClose,
  onSubmit,
  isSubmitting = false,
}: EventFormProps) {
  const { data: courses } = useCourses()
  const [title, setTitle] = useState(event?.title || '')
  const [description, setDescription] = useState(event?.description || '')
  const [eventType, setEventType] = useState<EventType>(event?.event_type || 'group_study')
  const [courseCode, setCourseCode] = useState(event?.course_code || '')
  // Separate date and time states for better UI
  const getDateValue = (dateString: string | Date | undefined) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  }

  const getTimeValue = (dateString: string | Date | undefined) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toTimeString().slice(0, 5) // HH:MM format
  }

  const [startDate, setStartDate] = useState(
    event?.start_time
      ? getDateValue(event.start_time)
      : initialStartTime
      ? getDateValue(initialStartTime)
      : ''
  )
  const [startTime, setStartTime] = useState(
    event?.start_time
      ? getTimeValue(event.start_time)
      : initialStartTime
      ? getTimeValue(initialStartTime)
      : ''
  )
  const [endDate, setEndDate] = useState(
    event?.end_time
      ? getDateValue(event.end_time)
      : initialEndTime
      ? getDateValue(initialEndTime)
      : ''
  )
  const [endTime, setEndTime] = useState(
    event?.end_time
      ? getTimeValue(event.end_time)
      : initialEndTime
      ? getTimeValue(initialEndTime)
      : ''
  )
  const [location, setLocation] = useState(event?.location || '')
  const [isOnline, setIsOnline] = useState(event?.is_online || false)
  const [maxParticipants, setMaxParticipants] = useState(event?.max_participants || '')
  const [selectedInvitees, setSelectedInvitees] = useState<string[]>(initialInvitees)
  const [showInviteSuggestions, setShowInviteSuggestions] = useState(false)
  
  // Update selected invitees when initialInvitees changes
  useEffect(() => {
    if (initialInvitees.length > 0) {
      setSelectedInvitees(initialInvitees)
      setShowInviteSuggestions(true)  // Auto-show suggestions when pre-selected
    }
  }, [initialInvitees])
  
  // Fetch invite suggestions
  const { data: tutorSuggestions = [] } = useTutorSuggestions(courseCode || null)
  const { data: brothersMajorSuggestions = [] } = useBrothersMajorSuggestions()
  const { data: studyGroupSuggestions = [] } = useStudyGroupSuggestions()
  
  // Combine all suggestions
  const allSuggestions = [
    ...(courseCode ? tutorSuggestions : []),
    ...brothersMajorSuggestions,
    ...studyGroupSuggestions,
  ]
  
  // Remove duplicates based on user_id
  const uniqueSuggestions = allSuggestions.filter((suggestion, index, self) =>
    index === self.findIndex((s) => s.user_id === suggestion.user_id)
  )

  // Get unique course codes from user's courses
  const availableCourses = courses
    ? Array.from(new Set(courses.map((c) => c.course_code).filter(Boolean)))
    : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      alert('Please enter a title')
      return
    }

    if (!startDate || !startTime || !endDate || !endTime) {
      alert('Please select start and end dates and times')
      return
    }

    const startDateTime = new Date(`${startDate}T${startTime}`)
    const endDateTime = new Date(`${endDate}T${endTime}`)

    if (endDateTime <= startDateTime) {
      alert('End time must be after start time')
      return
    }

    try {
      const data: CreateCalendarEvent | UpdateCalendarEvent = {
        title: title.trim(),
        description: description.trim() || undefined,
        event_type: eventType,
        course_code: courseCode.trim() || undefined,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        location: location.trim() || undefined,
        is_online: isOnline,
        max_participants: maxParticipants.trim() || undefined,
      }

      await onSubmit(data)
    } catch (error: any) {
      console.error('Form submission error:', error)
      // Error is handled by parent component
      throw error
    }
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm">
      <div
        className="bg-white dark:bg-black border border-gray-100 dark:border-gray-900 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-black border-b border-gray-100 dark:border-gray-900 p-6 flex items-center justify-between z-10">
          <h2 className="text-xl font-light text-gray-900 dark:text-white tracking-tight">
            {event ? 'Edit Event' : 'New Event'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-normal text-gray-500 dark:text-gray-500 mb-1.5 uppercase tracking-wide">
              Title <span className="text-gray-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border-b border-gray-200 dark:border-gray-900 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-700 transition-colors"
              placeholder="e.g., CS 101 Study Group"
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-xs font-normal text-gray-500 dark:text-gray-500 mb-1.5 uppercase tracking-wide">
              Event Type <span className="text-gray-400">*</span>
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  value="group_study"
                  checked={eventType === 'group_study'}
                  onChange={(e) => setEventType(e.target.value as EventType)}
                  className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300"
                />
                <span className="font-normal">Group Study</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  value="tutoring"
                  checked={eventType === 'tutoring'}
                  onChange={(e) => setEventType(e.target.value as EventType)}
                  className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300"
                />
                <span className="font-normal">Tutoring</span>
              </label>
            </div>
          </div>

          {/* Course Code */}
          <div>
            <label className="block text-xs font-normal text-gray-500 dark:text-gray-500 mb-1.5 uppercase tracking-wide">
              Course Code <span className="text-gray-400 normal-case">(Optional)</span>
            </label>
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
              placeholder="Enter course code"
              className="w-full px-3 py-2 border-b border-gray-200 dark:border-gray-900 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-700 transition-colors"
            />
          </div>

          {/* Date and Time */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-normal text-gray-500 dark:text-gray-500 mb-3 uppercase tracking-wide">
                Event Date & Time <span className="text-gray-400">*</span>
              </label>
              
              {/* Start Date & Time */}
              <div className="pb-4 border-b border-gray-100 dark:border-gray-900">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-500 uppercase tracking-wide">Start</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value)
                        // Auto-set end date to same if not set or if end is before start
                        if (!endDate || new Date(e.target.value) > new Date(endDate)) {
                          setEndDate(e.target.value)
                        }
                      }}
                      required
                      className="w-full px-3 py-2 text-sm border-b border-gray-200 dark:border-gray-900 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-700 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value)
                        // Auto-adjust end time if needed
                        if (startDate === endDate && endTime && e.target.value >= endTime) {
                          const [hours, minutes] = e.target.value.split(':')
                          const endTimeDate = new Date()
                          endTimeDate.setHours(parseInt(hours) + 1, parseInt(minutes))
                          setEndTime(endTimeDate.toTimeString().slice(0, 5))
                        }
                      }}
                      required
                      className="w-full px-3 py-2 text-sm border-b border-gray-200 dark:border-gray-900 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-700 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* End Date & Time */}
              <div className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-500 uppercase tracking-wide">End</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || undefined}
                      required
                      className="w-full px-3 py-2 text-sm border-b border-gray-200 dark:border-gray-900 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-700 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-500 mb-1.5 uppercase tracking-wide">Time</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      min={startDate === endDate ? startTime : undefined}
                      required
                      className="w-full px-3 py-2 text-sm border-b border-gray-200 dark:border-gray-900 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-700 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Duration Buttons */}
              {startDate && startTime && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-xs text-gray-400 dark:text-gray-600 mr-2">Quick duration:</span>
                  {[30, 60, 90, 120].map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => {
                        const start = new Date(`${startDate}T${startTime}`)
                        const end = new Date(start.getTime() + minutes * 60 * 1000)
                        setEndDate(end.toISOString().split('T')[0])
                        setEndTime(end.toTimeString().slice(0, 5))
                      }}
                      className="px-3 py-1 text-xs font-normal text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
                    >
                      {minutes} min
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-normal text-gray-500 dark:text-gray-500 mb-1.5 uppercase tracking-wide">
              Location
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={isOnline}
                  onChange={(e) => setIsOnline(e.target.checked)}
                  className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300"
                />
                <span className="font-normal">Online Event</span>
              </label>
              {!isOnline && (
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Library Room 201"
                  className="w-full px-3 py-2 border-b border-gray-200 dark:border-gray-900 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-700 transition-colors"
                />
              )}
              {isOnline && (
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Zoom link, Google Meet, etc."
                  className="w-full px-3 py-2 border-b border-gray-200 dark:border-gray-900 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-700 transition-colors"
                />
              )}
            </div>
          </div>

          {/* Max Participants */}
          <div>
            <label className="block text-xs font-normal text-gray-500 dark:text-gray-500 mb-1.5 uppercase tracking-wide">
              Max Participants <span className="text-gray-400 normal-case">(Optional)</span>
            </label>
            <input
              type="text"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              placeholder="e.g., 10 or unlimited"
              className="w-full px-3 py-2 border-b border-gray-200 dark:border-gray-900 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-700 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-normal text-gray-500 dark:text-gray-500 mb-1.5 uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border-b border-gray-200 dark:border-gray-900 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-700 transition-colors resize-none"
              placeholder="Add any additional details..."
            />
          </div>

          {/* Invite Users */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-normal text-gray-500 dark:text-gray-500 uppercase tracking-wide">
                Invite Users
              </label>
              <button
                type="button"
                onClick={() => setShowInviteSuggestions(!showInviteSuggestions)}
                className="text-xs font-normal text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {showInviteSuggestions ? 'Hide' : 'Show'} Suggestions
              </button>
            </div>
            
            {showInviteSuggestions && uniqueSuggestions.length > 0 && (
              <div className="mb-3 p-3 border border-gray-100 dark:border-gray-900 rounded-lg max-h-60 overflow-y-auto">
                <div className="space-y-2">
                  {uniqueSuggestions.map((suggestion) => (
                    <label
                      key={suggestion.user_id}
                      className="flex items-start gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedInvitees.includes(suggestion.user_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInvitees([...selectedInvitees, suggestion.user_id])
                          } else {
                            setSelectedInvitees(selectedInvitees.filter(id => id !== suggestion.user_id))
                          }
                        }}
                        className="mt-1 w-3.5 h-3.5 text-gray-700 dark:text-gray-300"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-normal text-gray-900 dark:text-white">
                          {suggestion.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {suggestion.reason}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {selectedInvitees.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedInvitees.map((userId) => {
                  const suggestion = uniqueSuggestions.find(s => s.user_id === userId)
                  return (
                    <div
                      key={userId}
                      className="flex items-center gap-1.5 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-900 rounded"
                    >
                      <span className="text-gray-900 dark:text-white">
                        {suggestion?.name || userId}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedInvitees(selectedInvitees.filter(id => id !== userId))}
                        className="text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-100 dark:border-gray-900">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-normal text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-normal text-gray-900 dark:text-white hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isSubmitting ? 'Saving...' : event ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

