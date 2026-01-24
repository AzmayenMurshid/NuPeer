'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import { usePoints } from '@/lib/hooks/usePoints'
import { User, Trophy } from 'lucide-react'

export function DashboardHeader() {
  const { user } = useAuth()
  const { data: pointsData } = usePoints()

  return (
    <div className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">NuPeer</h1>
            <span className="text-xs font-semibold text-primary-500">ΣΝ</span>
          </div>
          <div className="flex items-center gap-3">
            {pointsData && (
              <Link
                href="/leaderboard"
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
              >
                <Trophy className="w-4 h-4 text-primary-500" />
                <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                  {pointsData.total_points}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  pts
                </span>
              </Link>
            )}
            <ThemeToggle />
            {user && (
              <Link
                href="/profile"
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
              >
                <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.first_name} {user.last_name}
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

