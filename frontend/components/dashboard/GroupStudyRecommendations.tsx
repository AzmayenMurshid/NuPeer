'use client'

import { useMemo, useRef, useEffect, useCallback, memo } from 'react'
import { Users, Mail, Phone, BookOpen, Calendar } from 'lucide-react'
import { GroupStudyBrother } from '@/lib/hooks/useHelpRequests'
import { useRouter } from 'next/navigation'

interface GroupStudyRecommendationsProps {
  brothers: GroupStudyBrother[] | undefined
  isLoading: boolean
  error: Error | null
  userMajor?: string | null
  currentCourses?: Array<{ course_code: string; course_name?: string | null }>
}

export function GroupStudyRecommendations({ 
  brothers, 
  isLoading, 
  error,
  userMajor,
  currentCourses = []
}: GroupStudyRecommendationsProps) {
  const router = useRouter()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  const handleInviteToEvent = (userId: string) => {
    router.push(`/calendar?invite=${userId}`)
  }
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const isDragging = useRef(false)
  const scrollStartX = useRef(0)
  const lastMoveX = useRef(0)
  const lastMoveTime = useRef(0)
  const velocity = useRef(0)

  // Group brothers by course
  const coursesWithBrothers = useMemo(() => {
    if (!brothers || brothers.length === 0) return []

    // Create a map of course code -> array of brothers
    const courseMap = new Map<string, GroupStudyBrother[]>()

    brothers.forEach((brother) => {
      brother.shared_courses.forEach((courseCode) => {
        if (!courseMap.has(courseCode)) {
          courseMap.set(courseCode, [])
        }
        courseMap.get(courseCode)!.push(brother)
      })
    })

    // Convert to array and sort by number of brothers (descending)
    return Array.from(courseMap.entries())
      .map(([courseCode, brothersList]) => ({
        courseCode,
        brothers: brothersList,
        count: brothersList.length
      }))
      .sort((a, b) => b.count - a.count)
  }, [brothers])

  // Touch/Mouse event handlers for swipe - memoized with useCallback
  const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (scrollContainerRef.current) {
      scrollStartX.current = scrollContainerRef.current.scrollLeft
    }
    
    if ('touches' in e) {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
    } else {
      touchStartX.current = e.clientX
      touchStartY.current = e.clientY
      isDragging.current = true
      if (scrollContainerRef.current) {
        scrollContainerRef.current.style.cursor = 'grabbing'
        scrollContainerRef.current.style.userSelect = 'none'
      }
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (touchStartX.current === null || touchStartY.current === null || !scrollContainerRef.current) return

    let currentX: number
    let currentY: number
    const currentTime = Date.now()

    if ('touches' in e) {
      currentX = e.touches[0].clientX
      currentY = e.touches[0].clientY
    } else {
      if (!isDragging.current) return
      currentX = e.clientX
      currentY = e.clientY
    }

    const deltaX = touchStartX.current - currentX
    const deltaY = touchStartY.current - currentY

    // Only scroll horizontally if horizontal movement is greater than vertical (swipe, not scroll)
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault()
      scrollContainerRef.current.scrollLeft = scrollStartX.current + deltaX
      
      // Calculate velocity for momentum scrolling
      const timeDelta = currentTime - lastMoveTime.current
      if (timeDelta > 0) {
        const moveDelta = lastMoveX.current - currentX
        velocity.current = moveDelta / timeDelta
      }
      lastMoveX.current = currentX
      lastMoveTime.current = currentTime
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const cards = container.querySelectorAll('.carousel-card')
    
    // Apply momentum scrolling if there's velocity, then snap
    if (Math.abs(velocity.current) > 0.1 && cards.length > 0) {
      const momentum = velocity.current * 300 // Adjust multiplier for feel
      const currentScroll = container.scrollLeft
      const targetScrollWithMomentum = currentScroll + momentum
      
      // Calculate which card to snap to after momentum
      const cardWidth = (cards[0] as HTMLElement).offsetWidth
      const gap = 16
      const cardIndex = Math.round(targetScrollWithMomentum / (cardWidth + gap))
      const clampedIndex = Math.max(0, Math.min(cardIndex, cards.length - 1))
      const finalScroll = clampedIndex * (cardWidth + gap)

      // Use requestAnimationFrame for smoother animation
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTo({
            left: finalScroll,
            behavior: 'smooth'
          })
        }
      })
    } else if (cards.length > 0) {
      // Just snap to nearest card if no momentum
      const cardWidth = (cards[0] as HTMLElement).offsetWidth
      const gap = 16
      const scrollLeft = container.scrollLeft
      const cardIndex = Math.round(scrollLeft / (cardWidth + gap))
      const clampedIndex = Math.max(0, Math.min(cardIndex, cards.length - 1))
      const targetScroll = clampedIndex * (cardWidth + gap)

      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      })
    }

    touchStartX.current = null
    touchStartY.current = null
    isDragging.current = false
    velocity.current = 0
    lastMoveX.current = 0
    lastMoveTime.current = 0
    
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab'
      scrollContainerRef.current.style.userSelect = 'auto'
    }
  }, [])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      // Prevent default touch behavior for smooth scrolling
      container.style.touchAction = 'pan-y pinch-zoom'
      container.style.cursor = 'grab'
    }
  }, [coursesWithBrothers])
  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Study Group Recommendations</h2>
          <span className="text-sm font-semibold text-primary-500">ΣΝ</span>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">Loading study groups...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6 border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Study Group Recommendations</h2>
          <span className="text-sm font-semibold text-primary-500">ΣΝ</span>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400">Error loading study groups. Please try again later.</p>
        </div>
      </div>
    )
  }

  if (!brothers || brothers.length === 0 || coursesWithBrothers.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Study Group Recommendations</h2>
          <span className="text-sm font-semibold text-primary-500">ΣΝ</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Find brothers who are taking the same courses as you
        </p>
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            No study groups found
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Add current courses to find study partners
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Study Group Recommendations</h2>
        <span className="text-sm font-semibold text-primary-500">ΣΝ</span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Connect with brothers taking the same courses as you
      </p>
      {currentCourses.length > 0 && (
        <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
          <p className="text-xs font-semibold text-primary-700 dark:text-primary-300 mb-2">
            Your Current Courses:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {currentCourses.map((course, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-200"
              >
                <BookOpen className="w-3 h-3" />
                {course.course_code}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="relative">
        {/* Swipeable Container */}
        <div
          ref={scrollContainerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2 px-1 select-none carousel-container scroll-optimized"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth'
          }}
        >
          {coursesWithBrothers.map(({ courseCode, brothers: courseBrothers, count }) => (
            <div
              key={courseCode}
              className="p-4 bg-primary-50/30 dark:bg-primary-800/30 rounded-lg shadow-lg dark:shadow-xl carousel-card flex-shrink-0 w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)] min-w-[320px] transition-shadow duration-200 hover:shadow-xl dark:hover:shadow-2xl"
              style={{ scrollSnapAlign: 'start' }}
            >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                  {courseCode}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {count} {count === 1 ? 'brother' : 'brothers'}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              {courseBrothers.map((brother) => (
                <div
                  key={brother.helper_id}
                  className="p-3 bg-white dark:bg-[#0a0a0a] rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-base text-gray-900 dark:text-white mb-1">
                        {brother.helper_name}
                      </h4>
                      {brother.major && (
                        <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mb-1">
                          {brother.major}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
                        {brother.year_in_college && (
                          <span className="font-medium text-primary-600 dark:text-primary-400">{brother.year_in_college}</span>
                        )}
                        {brother.graduation_year && (
                          <span>• Class of {brother.graduation_year}</span>
                        )}
                        {brother.pledge_class && (
                          <span>• {brother.pledge_class}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <button
                      onClick={() => handleInviteToEvent(brother.helper_id)}
                      className="w-full flex items-center justify-center gap-2 px-2 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Invite to Event
                    </button>
                    {(brother.helper_email || brother.helper_phone_number) && (
                      <div className="flex flex-wrap gap-3">
                        {brother.helper_email && (
                          <a
                            href={`mailto:${brother.helper_email}?subject=${encodeURIComponent(`Group Study - ${courseCode}`)}`}
                            className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span className="truncate">{brother.helper_email}</span>
                          </a>
                        )}
                        {brother.helper_phone_number && (
                          <a
                            href={`tel:${brother.helper_phone_number}`}
                            className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{brother.helper_phone_number}</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

