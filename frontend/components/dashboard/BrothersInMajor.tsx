'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Users, Mail, Phone, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { MajorMatchBrother } from '@/lib/hooks/useHelpRequests'
import { useThrottle } from '@/lib/hooks/useThrottle'
import { useRouter } from 'next/navigation'

interface BrothersInMajorProps {
  major: string
  brothers: MajorMatchBrother[] | undefined
  isLoading: boolean
  error: Error | null
}

export function BrothersInMajor({ major, brothers, isLoading, error }: BrothersInMajorProps) {
  const router = useRouter()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  
  const handleInviteToEvent = (userId: string) => {
    router.push(`/calendar?invite=${userId}`)
  }

  const checkScrollability = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }, [])

  // Throttle scroll handler for better performance
  const throttledCheckScrollability = useThrottle(checkScrollability, 100)
  const throttledResize = useThrottle(checkScrollability, 150)

  useEffect(() => {
    checkScrollability()
    const container = scrollContainerRef.current
    if (container) {
      // Use throttled handler for scroll events with passive listener
      container.addEventListener('scroll', throttledCheckScrollability, { passive: true })
      // Check on resize (throttled)
      window.addEventListener('resize', throttledResize, { passive: true })
      return () => {
        container.removeEventListener('scroll', throttledCheckScrollability)
        window.removeEventListener('resize', throttledResize)
      }
    }
  }, [brothers, checkScrollability, throttledCheckScrollability, throttledResize])

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.querySelector('.carousel-card')?.clientWidth || 0
      const gap = 16 // gap-4 = 1rem = 16px
      const scrollAmount = cardWidth + gap
      
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }, [])

  if (!major) {
    return null
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Brothers in Your Major</h2>
        <span className="text-sm font-semibold text-primary-500">ΣΝ</span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Connect with brothers who share your major: <span className="font-semibold text-primary-500">{major}</span>
      </p>
      {brothers && Array.isArray(brothers) && brothers.length > 0 ? (
        <div className="relative">
          {/* Navigation Buttons */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full p-2 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full p-2 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          )}
          
          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScrollability}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2 px-1 carousel-container scroll-optimized"
          >
            {brothers.map((brother) => (
              <div
                key={brother.helper_id}
                className="card card-hover p-4 carousel-card flex-shrink-0 w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)] min-w-[280px]"
              >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                    {brother.helper_name}
                  </h3>
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
                <Users className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
              </div>
              
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Courses:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{brother.total_courses}</span>
                </div>
              </div>

              <div className="pt-3 space-y-2">
                <button
                  onClick={() => handleInviteToEvent(brother.helper_id)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  Invite to Event
                </button>
                {(brother.helper_email || brother.helper_phone_number) && (
                  <div className="divider space-y-2">
                    {brother.helper_email && (
                      <a
                        href={`mailto:${brother.helper_email}?subject=${encodeURIComponent(`Connecting from NuPeer - ${major}`)}`}
                        className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{brother.helper_email}</span>
                      </a>
                    )}
                    {brother.helper_phone_number && (
                      <a
                        href={`tel:${brother.helper_phone_number}`}
                        className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
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
      ) : isLoading ? (
        <div className="card p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Loading brothers in your major...
          </p>
        </div>
      ) : error ? (
        <div className="card p-6 text-center border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">
            Error loading brothers. Please try again later.
          </p>
          <p className="text-xs text-red-500 dark:text-red-500 mt-2">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      ) : (
        <div className="card p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No other brothers found with the major <span className="font-semibold text-primary-500">{major}</span>
          </p>
        </div>
      )}
    </div>
  )
}

