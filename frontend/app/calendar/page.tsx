'use client'

import { useState, useMemo, useEffect } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { CalendarView } from '@/components/calendar/CalendarView'
import { EventForm } from '@/components/calendar/EventForm'
import { useCalendarEvents, useCreateCalendarEvent, useUpdateCalendarEvent, useDeleteCalendarEvent, useJoinEvent, useLeaveEvent, CalendarEvent } from '@/lib/hooks/useCalendar'
import { useAuth } from '@/contexts/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import Link from 'next/link'
import { Plus, User, X, Users, BookOpen, MapPin, Video, Clock, Edit, Trash2 } from 'lucide-react'
import { View, SlotInfo } from 'react-big-calendar'

function CalendarPageContent() {
  const { user } = useAuth()
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showEventForm, setShowEventForm] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [preSelectedInvitees, setPreSelectedInvitees] = useState<string[]>([])
  const [currentView, setCurrentView] = useState<View>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Check for invite query params from navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const inviteIds = params.get('invite')
      if (inviteIds) {
        const inviteIdsArray = inviteIds.split(',').filter(Boolean)
        setPreSelectedInvitees(inviteIdsArray)
        setShowEventForm(true)
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [])

  // Calculate date range for the current view
  const dateRange = useMemo(() => {
    const start = new Date(currentDate)
    const end = new Date(currentDate)

    if (currentView === 'month') {
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(end.getMonth() + 1)
      end.setDate(0)
      end.setHours(23, 59, 59, 999)
    } else if (currentView === 'week') {
      const day = start.getDay()
      start.setDate(start.getDate() - day)
      start.setHours(0, 0, 0, 0)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
    } else {
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
    }

    return {
      start_date: start.toISOString(),
      end_date: end.toISOString(),
    }
  }, [currentDate, currentView])

  const { data: events = [] } = useCalendarEvents(dateRange)
  const createMutation = useCreateCalendarEvent()
  const updateMutation = useUpdateCalendarEvent()
  const deleteMutation = useDeleteCalendarEvent()
  const joinMutation = useJoinEvent()
  const leaveMutation = useLeaveEvent()

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event)
  }

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setSelectedSlot({
      start: slotInfo.start,
      end: slotInfo.end || new Date(slotInfo.start.getTime() + 60 * 60 * 1000), // Default 1 hour
    })
    setShowEventForm(true)
  }

  const handleCreateEvent = async (data: any) => {
    try {
      await createMutation.mutateAsync(data)
      setShowEventForm(false)
      setSelectedSlot(null)
    } catch (error: any) {
      console.error('Failed to create event:', error)
      alert(error?.response?.data?.detail || error?.message || 'Failed to create event. Please try again.')
    }
  }

  const handleUpdateEvent = async (data: any) => {
    if (!selectedEvent) return
    try {
      await updateMutation.mutateAsync({ eventId: selectedEvent.id, data })
      setShowEventForm(false)
      setSelectedEvent(null)
    } catch (error: any) {
      console.error('Failed to update event:', error)
      alert(error?.response?.data?.detail || error?.message || 'Failed to update event. Please try again.')
    }
  }

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return
    if (!confirm('Are you sure you want to delete this event?')) return
    
    await deleteMutation.mutateAsync(selectedEvent.id)
    setSelectedEvent(null)
  }

  const handleJoinEvent = async () => {
    if (!selectedEvent) return
    await joinMutation.mutateAsync(selectedEvent.id)
    setSelectedEvent(null)
  }

  const handleLeaveEvent = async () => {
    if (!selectedEvent || !user) return
    const participant = selectedEvent.participants.find((p) => p.user_id === user.id)
    if (!participant) return
    
    await leaveMutation.mutateAsync({ eventId: selectedEvent.id, participantId: participant.id })
    setSelectedEvent(null)
  }

  const isOrganizer = selectedEvent?.organizer_id === user?.id
  const isParticipant = selectedEvent?.participants.some((p) => p.user_id === user?.id) || false

  return (
    <main className="min-h-screen bg-white dark:bg-black content-with-nav">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/dashboard" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2">
              <span>←</span>
              <span>Back</span>
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Calendar</h1>
              <span className="text-xs font-semibold text-primary-500">ΣΝ</span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                href="/profile"
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
              >
                <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.first_name} {user?.last_name}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Create Event Button */}
        <div className="mb-8 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-500 font-light">
            Schedule group study sessions and tutoring appointments
          </p>
          <button
            onClick={() => {
              setSelectedEvent(null)
              setSelectedSlot(null)
              setShowEventForm(true)
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-normal"
          >
            <Plus className="w-4 h-4" />
            New Event
          </button>
        </div>

        {/* Calendar */}
        <CalendarView
          events={events}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          currentView={currentView}
          onViewChange={setCurrentView}
          currentDate={currentDate}
          onNavigate={setCurrentDate}
        />

        {/* Event Details Modal */}
        {selectedEvent && !showEventForm && (
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedEvent(null)}
          >
            <div
              className="bg-white dark:bg-black border border-gray-100 dark:border-gray-900 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white dark:bg-black border-b border-gray-100 dark:border-gray-900 p-6 flex items-center justify-between z-10">
                <h2 className="text-xl font-light text-gray-900 dark:text-white tracking-tight">{selectedEvent.title}</h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Event Type */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-500 uppercase tracking-wide">
                    {selectedEvent.event_type.replace('_', ' ')}
                  </span>
                </div>

                {/* Course Code */}
                {selectedEvent.course_code && (
                  <div>
                    <p className="text-xs font-normal text-gray-500 dark:text-gray-500 uppercase tracking-wide mb-1">Course</p>
                    <p className="text-sm text-gray-900 dark:text-white font-light">{selectedEvent.course_code}</p>
                  </div>
                )}

                {/* Time */}
                <div>
                  <p className="text-xs font-normal text-gray-500 dark:text-gray-500 uppercase tracking-wide mb-1">Time</p>
                  <p className="text-sm text-gray-900 dark:text-white font-light">
                    {new Date(selectedEvent.start_time).toLocaleString()} -{' '}
                    {new Date(selectedEvent.end_time).toLocaleString()}
                  </p>
                </div>

                {/* Location */}
                {selectedEvent.location && (
                  <div>
                    <p className="text-xs font-normal text-gray-500 dark:text-gray-500 uppercase tracking-wide mb-1">
                      {selectedEvent.is_online ? 'Online' : 'Location'}
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white font-light">{selectedEvent.location}</p>
                  </div>
                )}

                {/* Description */}
                {selectedEvent.description && (
                  <div>
                    <p className="text-xs font-normal text-gray-500 dark:text-gray-500 uppercase tracking-wide mb-1">Description</p>
                    <p className="text-sm text-gray-900 dark:text-white font-light leading-relaxed">{selectedEvent.description}</p>
                  </div>
                )}

                {/* Participants */}
                <div>
                  <p className="text-xs font-normal text-gray-500 dark:text-gray-500 uppercase tracking-wide mb-2">
                    Participants ({selectedEvent.participants.length}
                    {selectedEvent.max_participants && ` / ${selectedEvent.max_participants}`})
                  </p>
                  <div className="space-y-1.5">
                    {selectedEvent.participants.map((participant) => (
                      <div key={participant.id} className="flex items-center gap-2 text-sm">
                        <span className="text-gray-900 dark:text-white font-light">{participant.user_name}</span>
                        {participant.user_id === selectedEvent.organizer_id && (
                          <span className="text-xs text-gray-500 dark:text-gray-500 font-light">(Organizer)</span>
                        )}
                        {participant.status === 'pending' && (
                          <span className="text-xs text-gray-500 dark:text-gray-500 font-light">(Invited)</span>
                        )}
                        {participant.status === 'declined' && (
                          <span className="text-xs text-red-500 dark:text-red-400 font-light">(Declined)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 pt-6 border-t border-gray-100 dark:border-gray-900">
                  {isOrganizer ? (
                    <>
                      <button
                        onClick={() => {
                          setShowEventForm(true)
                        }}
                        className="text-sm font-normal text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={handleDeleteEvent}
                        className="text-sm font-normal text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        Delete
                      </button>
                    </>
                  ) : isParticipant ? (
                    <button
                      onClick={handleLeaveEvent}
                      className="text-sm font-normal text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      Leave
                    </button>
                  ) : (
                    <button
                      onClick={handleJoinEvent}
                      className="text-sm font-normal text-gray-900 dark:text-white hover:opacity-80 transition-opacity"
                    >
                      Join
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Event Form Modal */}
        {showEventForm && (
          <EventForm
            event={selectedEvent}
            initialStartTime={selectedSlot?.start}
            initialEndTime={selectedSlot?.end}
            initialInvitees={preSelectedInvitees}
            onClose={() => {
              setShowEventForm(false)
              setSelectedEvent(null)
              setSelectedSlot(null)
              setPreSelectedInvitees([])
            }}
            onSubmit={selectedEvent ? handleUpdateEvent : handleCreateEvent}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        )}
      </div>
    </main>
  )
}

export default function CalendarPage() {
  return (
    <ProtectedRoute>
      <CalendarPageContent />
    </ProtectedRoute>
  )
}

