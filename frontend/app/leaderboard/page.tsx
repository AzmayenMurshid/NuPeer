'use client'

import { useLeaderboard, usePoints } from '@/lib/hooks/usePoints'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Trophy, Medal, Award, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function LeaderboardPage() {
  return (
    <ProtectedRoute>
      <LeaderboardContent />
    </ProtectedRoute>
  )
}

function LeaderboardContent() {
  const { user } = useAuth()
  const { data: leaderboard, isLoading } = useLeaderboard(100)
  const { data: myPoints } = usePoints()

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />
    return <Award className="w-5 h-5 text-gray-400" />
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
    if (rank === 2) return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
    if (rank === 3) return 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
    return 'bg-gray-100 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400'
  }

  const myRank = leaderboard?.findIndex(entry => entry.user_id === user?.id) ?? -1
  const myEntry = myRank >= 0 ? leaderboard?.[myRank] : null

  return (
    <main className="page-container content-with-nav">
      <div className="page-header">
        <div className="page-header-inner">
          <div className="page-header-content">
            <Link href="/dashboard" className="link-back">
              <span>←</span>
              <span>Back</span>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="mb-6">
          <h1 className="page-title flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary-500" />
            Leaderboard
          </h1>
          <p className="text-muted">
            Top contributors helping the Sigma Nu community
          </p>
        </div>

        {/* My Stats Card */}
        {myPoints && (
          <div className="card card-padding mb-6 bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">Your Ranking</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-heading">
                    #{myPoints.rank || '—'}
                  </span>
                  <span className="text-lg text-muted">
                    {myPoints.total_points} points
                  </span>
                </div>
              </div>
              <TrendingUp className="w-12 h-12 text-primary-500" />
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {isLoading ? (
          <div className="card card-padding text-center py-12">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading leaderboard...</p>
          </div>
        ) : leaderboard && leaderboard.length > 0 ? (
          <div className="card card-padding">
            <div className="space-y-3">
              {leaderboard.map((entry, index) => {
                const isMe = entry.user_id === user?.id
                return (
                  <div
                    key={entry.user_id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isMe
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700'
                        : 'border-gray-200 dark:border-gray-800 hover:border-primary-200 dark:hover:border-primary-800'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 flex items-center justify-center">
                        {getRankIcon(entry.rank)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-heading">
                            {entry.first_name} {entry.last_name}
                          </span>
                          {isMe && (
                            <span className="text-xs px-2 py-0.5 bg-primary-500 text-white rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted">
                          <span className="font-medium">{entry.points.toLocaleString()} points</span>
                          <span className="text-xs">Rank #{entry.rank}</span>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRankBadgeColor(entry.rank)}`}>
                        #{entry.rank}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="card card-padding text-center py-12">
            <Users className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-heading mb-2">No rankings yet</h3>
            <p className="text-muted">
              Start helping others to earn points and climb the leaderboard!
            </p>
          </div>
        )}

        {/* How to Earn Points */}
        <div className="card card-padding mt-6">
          <h2 className="section-title">How to Earn Points</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-primary-500" />
                <span className="font-medium text-heading">Accept Mentorship</span>
                <span className="ml-auto text-primary-600 dark:text-primary-400 font-semibold">+100</span>
              </div>
              <p className="text-sm text-muted">Accept a mentorship request from a mentee</p>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                <span className="font-medium text-heading">Help with Course</span>
                <span className="ml-auto text-primary-600 dark:text-primary-400 font-semibold">+50</span>
              </div>
              <p className="text-sm text-muted">Help a brother with a course they're struggling with</p>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-primary-500" />
                <span className="font-medium text-heading">Complete Profile</span>
                <span className="ml-auto text-primary-600 dark:text-primary-400 font-semibold">+50</span>
              </div>
              <p className="text-sm text-muted">Complete your alumni profile with all required fields</p>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Medal className="w-5 h-5 text-primary-500" />
                <span className="font-medium text-heading">Upload Resume</span>
                <span className="ml-auto text-primary-600 dark:text-primary-400 font-semibold">+25</span>
              </div>
              <p className="text-sm text-muted">Upload your resume to your profile</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

