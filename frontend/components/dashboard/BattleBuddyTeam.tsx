'use client'

import { useEffect, useState } from 'react'
import { Users, Trophy, Mail, Plus, CheckCircle2, AlertCircle } from 'lucide-react'
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

interface AvailableTeam {
  id: string
  team_name: string
  description?: string
  points: number
  member_count: number
  created_at: string
}

export function BattleBuddyTeam() {
  const [team, setTeam] = useState<BattleBuddyTeam | null>(null)
  const [availableTeams, setAvailableTeams] = useState<AvailableTeam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

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

  const fetchAvailableTeams = async () => {
    try {
      const response = await api.get('/battle-buddy/teams/list')
      setAvailableTeams(response.data)
    } catch (err) {
      console.error('Failed to fetch available teams:', err)
    }
  }

  useEffect(() => {
    fetchTeam()
    fetchAvailableTeams()
  }, [])

  const handleJoinTeam = async (teamId: string) => {
    setIsJoining(true)
    setMessage(null)
    try {
      await api.post('/battle-buddy/join-team', { team_id: teamId })
      setMessage({ type: 'success', text: 'Successfully joined the team!' })
      // Refresh team data
      await fetchTeam()
      await fetchAvailableTeams()
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.detail || 'Failed to join team. Please try again.' 
      })
    } finally {
      setIsJoining(false)
    }
  }

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

        {message && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {availableTeams.length === 0 ? (
          <>
            <p className="text-gray-600 dark:text-gray-400 mb-2">No teams available yet.</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">Contact an admin to create a team.</p>
          </>
        ) : (
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Join a Battle Buddy team:</p>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {availableTeams.map((availableTeam) => (
                <div
                  key={availableTeam.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {availableTeam.team_name}
                      </h3>
                      {availableTeam.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {availableTeam.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                        <div className="flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          <span>{availableTeam.points} pts</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{availableTeam.member_count} member{availableTeam.member_count !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoinTeam(availableTeam.id)}
                      disabled={isJoining}
                      className="ml-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      {isJoining ? 'Joining...' : 'Join Team'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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

