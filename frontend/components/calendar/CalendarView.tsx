'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Calendar, momentLocalizer, View, SlotInfo } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { CalendarEvent, EventType } from '@/lib/hooks/useCalendar'
import { Calendar as CalendarIcon, Plus, Users, BookOpen, MapPin, Video } from 'lucide-react'

const localizer = momentLocalizer(moment)

interface CalendarViewProps {
  events: CalendarEvent[]
  onSelectEvent?: (event: CalendarEvent) => void
  onSelectSlot?: (slotInfo: SlotInfo) => void
  currentView?: View
  onViewChange?: (view: View) => void
  currentDate?: Date
  onNavigate?: (date: Date) => void
}

export function CalendarView({
  events,
  onSelectEvent,
  onSelectSlot,
  currentView = 'month',
  onViewChange,
  currentDate = new Date(),
  onNavigate,
}: CalendarViewProps) {
  const [view, setView] = useState<View>(currentView)
  const [date, setDate] = useState(currentDate)

  // Convert events to calendar format
  const calendarEvents = useMemo(() => {
    return events.map((event) => ({
      id: event.id,
      title: event.title,
      start: new Date(event.start_time),
      end: new Date(event.end_time),
      resource: event,
    }))
  }, [events])

  const handleViewChange = (newView: View) => {
    setView(newView)
    onViewChange?.(newView)
  }

  const handleNavigate = (newDate: Date) => {
    setDate(newDate)
    onNavigate?.(newDate)
  }

  // Set time range: 6 AM to 11 PM (23:00) for week and day views
  // Include 11 PM by setting max to 23:59 to ensure 11:00 PM slot is visible
  const minTime = useMemo(() => {
    return moment().hour(6).minute(0).second(0).toDate()
  }, [])

  const maxTime = useMemo(() => {
    // Use 23:59 to ensure 11:00 PM (23:00) is included and visible
    return moment().hour(23).minute(59).second(0).toDate()
  }, [])

  // Prevent scrolling beyond 11 PM
  const calendarRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (view !== 'week' && view !== 'day') return

    const preventScrollBeyondMax = () => {
      const timeContent = calendarRef.current?.querySelector('.rbc-time-content') as HTMLElement
      if (!timeContent) return

      // Calculate max scroll based on content height
      const scrollHeight = timeContent.scrollHeight
      const clientHeight = timeContent.clientHeight
      const maxScroll = scrollHeight - clientHeight
      
      // If scrolled beyond max, reset to max
      if (timeContent.scrollTop > maxScroll) {
        timeContent.scrollTop = maxScroll
      }
    }

    const timeContent = calendarRef.current?.querySelector('.rbc-time-content') as HTMLElement
    if (timeContent) {
      timeContent.addEventListener('scroll', preventScrollBeyondMax, { passive: false })
      return () => {
        timeContent.removeEventListener('scroll', preventScrollBeyondMax)
      }
    }
  }, [view])

  // Custom event component
  const EventComponent = ({ event }: any) => {
    const calEvent = event.resource as CalendarEvent
    
    return (
      <div className="px-1.5 py-0.5">
        <div className="text-xs font-normal text-gray-900 dark:text-gray-100 truncate leading-tight">
          {calEvent.title}
        </div>
        {calEvent.course_code && (
          <div className="text-[10px] text-gray-500 dark:text-gray-500 truncate mt-0.5">
            {calEvent.course_code}
          </div>
        )}
      </div>
    )
  }

  // Custom toolbar
  const CustomToolbar = (toolbar: any) => {
    const goToToday = () => {
      const today = new Date()
      toolbar.onNavigate('TODAY')
      handleNavigate(today)
    }

    const goToPrevious = () => {
      toolbar.onNavigate('PREV')
    }

    const goToNext = () => {
      toolbar.onNavigate('NEXT')
    }

    const changeView = (viewName: View) => {
      toolbar.onView(viewName)
      handleViewChange(viewName)
    }

    return (
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          <h2 className="text-xl font-light text-gray-900 dark:text-white tracking-tight">
            {toolbar.label}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevious}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ←
            </button>
            <button
              onClick={goToNext}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              →
            </button>
            <button
              onClick={goToToday}
              className="ml-2 px-3 py-1 text-xs font-normal text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Today
            </button>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => changeView('month')}
            className={`px-3 py-1 text-xs font-normal transition-colors ${
              view === 'month'
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Month
          </button>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <button
            onClick={() => changeView('week')}
            className={`px-3 py-1 text-xs font-normal transition-colors ${
              view === 'week'
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Week
          </button>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <button
            onClick={() => changeView('day')}
            className={`px-3 py-1 text-xs font-normal transition-colors ${
              view === 'day'
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Day
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-black" ref={calendarRef}>
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        view={view}
        onView={handleViewChange}
        date={date}
        onNavigate={handleNavigate}
        onSelectEvent={onSelectEvent ? (event) => onSelectEvent(event.resource) : undefined}
        onSelectSlot={onSelectSlot}
        selectable
        min={minTime}
        max={maxTime}
        components={{
          event: EventComponent,
          toolbar: CustomToolbar,
        }}
        eventPropGetter={(event) => {
          const calEvent = event.resource as CalendarEvent
          const isTutoring = calEvent.event_type === 'tutoring'
          return {
            className: isTutoring
              ? 'bg-gray-100 dark:bg-gray-900/40 border-l border-gray-400 dark:border-gray-600'
              : 'bg-gray-50 dark:bg-gray-900/30 border-l border-gray-300 dark:border-gray-700',
          }
        }}
      />
    </div>
  )
}

