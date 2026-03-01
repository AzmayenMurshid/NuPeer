'use client'

import { useEffect, useState } from 'react'
import { Users, Trophy, Mail, Phone } from 'lucide-react'
import { api } from '@/lib/api'

interface TeamMember {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  joined_at: string
}

interface BattleBuddyTeam {
  id: string
  team_name: string
  description?: string
  points: number
  member_count: number
  members: TeamMember[]
  created_at: string
}

export function BattleBuddyTeam() {
  const [team, setTeam] = useState<BattleBuddyTeam | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setIsLoading(true)
        const response = await api.get('/battle-buddy/my-team')
        setTeam(response.data)
        setError(null)
      } catch (err: any) {
        if (err.response?.status === 404 || err.response?.status === 200) {
          // User is not in a team - this is not an error
          setTeam(null)
          setError(null)
        } else {
          setError(err)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchTeam()
  }, [])

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-6 h-6 text-primary-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Battle Buddy Team</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Loading team information...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-6 h-6 text-primary-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Battle Buddy Team</h2>
        </div>
        <p className="text-red-600 dark:text-red-400">Error loading team information. Please try again later.</p>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-6 h-6 text-primary-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Battle Buddy Team</h2>
        </div>
        <div className="text-center py-8">
          <Users className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">You are not currently in a Battle Buddy team.</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Contact an admin to be added to a team.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-primary-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Battle Buddy Team</h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
          <Trophy className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
            {team.points} pts
          </span>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{team.team_name}</h3>
        {team.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{team.description}</p>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          {team.member_count} member{team.member_count !== 1 ? 's' : ''}
        </p>
      </div>

      {team.members.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Team Members</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {team.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {member.first_name} {member.last_name}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                      <Mail className="w-3 h-3" />
                      <span>{member.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

