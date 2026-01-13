import { useQuery } from '@tanstack/react-query'
import { api } from '../api'

export interface PointsHistory {
  id: string
  points: number
  point_type: string
  description: string | null
  related_user_id: string | null
  related_entity_id: string | null
  related_entity_type: string | null
  created_at: string
}

export interface PointsSummary {
  total_points: number
  rank: number | null
  recent_activity: PointsHistory[]
}

export interface LeaderboardEntry {
  user_id: string
  first_name: string
  last_name: string
  points: number
  rank: number
}

export interface PointValues {
  [key: string]: number
}

export const usePoints = () => {
  return useQuery<PointsSummary>({
    queryKey: ['points'],
    queryFn: async () => {
      const response = await api.get<PointsSummary>('/points')
      return response.data
    },
  })
}

export const usePointsHistory = (limit = 50, offset = 0) => {
  return useQuery<PointsHistory[]>({
    queryKey: ['points', 'history', limit, offset],
    queryFn: async () => {
      const response = await api.get<PointsHistory[]>('/points/history', {
        params: { limit, offset },
      })
      return response.data
    },
  })
}

export const useLeaderboard = (limit = 100) => {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ['points', 'leaderboard', limit],
    queryFn: async () => {
      const response = await api.get<LeaderboardEntry[]>('/points/leaderboard', {
        params: { limit },
      })
      return response.data
    },
  })
}

export const usePointValues = () => {
  return useQuery<PointValues>({
    queryKey: ['points', 'values'],
    queryFn: async () => {
      const response = await api.get<PointValues>('/points/values')
      return response.data
    },
  })
}

