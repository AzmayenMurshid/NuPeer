'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Calendar, Clock, Users, BookOpen, MapPin, Video, ArrowRight, Plus } from 'lucide-react'
import { useCalendarEvents } from '@/lib/hooks/useCalendar'
import { CalendarEvent } from '@/lib/hooks/useCalendar'

export function CalendarWidget() {
  // Get events for the next 7 days
  const startDate = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date.toISOString()
  }, [])

  const endDate = useMemo(() => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    date.setHours(23, 59, 59, 999)
    return date.toISOString()
  }, [])

  const { data: events = [], isLoading } = useCalendarEvents({
    start_date: startDate,
    end_date: endDate,
  })

  // Sort events by start time and get upcoming ones
  const upcomingEvents = useMemo(() => {
    const now = new Date()
    return events
      .filter((event) => new Date(event.start_time) >= now)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 3) // Show only next 3 events
  }, [events])

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    }
  }

  return (
    <div className="card p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Events</h2>
        </div>
        <Link
          href="/calendar"
          className="flex items-center gap-1 text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-lg" />
            </div>
          ))}
        </div>
      ) : upcomingEvents.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            No upcoming events in the next 7 days
          </p>
          <Link
            href="/calendar"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingEvents.map((event: CalendarEvent) => (
            <Link
              key={event.id}
              href={`/calendar`}
              className="block p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 w-1 h-full rounded ${
                    event.event_type === 'tutoring' ? 'bg-primary-500' : 'bg-blue-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {event.event_type === 'tutoring' ? (
                      <BookOpen className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    ) : (
                      <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    )}
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {event.title}
                    </h3>
                  </div>
                  {event.course_code && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      {event.course_code}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500 mt-2">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatEventTime(event.start_time)}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1">
                        {event.is_online ? (
                          <Video className="w-3 h-3" />
                        ) : (
                          <MapPin className="w-3 h-3" />
                        )}
                        <span className="truncate max-w-[120px]">{event.location}</span>
                      </div>
                    )}
                    {event.participants.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{event.participants.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {events.length > 3 && (
            <Link
              href="/calendar"
              className="block text-center py-2 text-sm text-primary-500 hover:text-primary-600 font-medium"
            >
              View {events.length - 3} more events
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

