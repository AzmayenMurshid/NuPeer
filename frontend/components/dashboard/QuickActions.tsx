'use client'

import Link from 'next/link'
import { ArrowRight, Calendar, Users, Trophy } from 'lucide-react'

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <Link 
        href="/upload" 
        className="card card-hover p-6 group"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Upload Transcript</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Extract courses automatically
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center group-hover:bg-primary-500/20 dark:group-hover:bg-primary-500/30 transition-colors">
            <ArrowRight className="w-6 h-6 text-primary-500" />
          </div>
        </div>
      </Link>
      <Link 
        href="/calendar" 
        className="card card-hover p-6 group"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">View Calendar</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Schedule study sessions
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center group-hover:bg-primary-500/20 dark:group-hover:bg-primary-500/30 transition-colors">
            <Calendar className="w-6 h-6 text-primary-500" />
          </div>
        </div>
      </Link>
      <Link 
        href="/help" 
        className="card card-hover p-6 group"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Get Help</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Find brothers who excelled
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center group-hover:bg-primary-500/20 dark:group-hover:bg-primary-500/30 transition-colors">
            <ArrowRight className="w-6 h-6 text-primary-500" />
          </div>
        </div>
      </Link>
      <Link 
        href="/mentorship" 
        className="card card-hover p-6 group"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Mentorship</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connect with alumni mentors
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center group-hover:bg-primary-500/20 dark:group-hover:bg-primary-500/30 transition-colors">
            <Users className="w-6 h-6 text-primary-500" />
          </div>
        </div>
      </Link>
      <Link 
        href="/leaderboard" 
        className="card card-hover p-6 group"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Leaderboard</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              See top contributors
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center group-hover:bg-primary-500/20 dark:group-hover:bg-primary-500/30 transition-colors">
            <Trophy className="w-6 h-6 text-primary-500" />
          </div>
        </div>
      </Link>
    </div>
  )
}

