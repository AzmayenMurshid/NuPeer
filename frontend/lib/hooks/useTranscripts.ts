import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

export interface Transcript {
  id: string
  file_name: string
  file_size: number | null
  upload_date: string
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  processed_at: string | null
  error_message: string | null
}

const VALID_TRANSCRIPT_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const

const toTranscript = (t: any): Transcript => {
  const status =
    typeof t?.processing_status === 'string' &&
    (VALID_TRANSCRIPT_STATUSES as readonly string[]).includes(t.processing_status)
      ? (t.processing_status as Transcript['processing_status'])
      : 'completed'

  return {
    id: String(t?.id ?? ''),
    file_name: String(t?.file_name ?? ''),
    file_size: typeof t?.file_size === 'number' ? t.file_size : null,
    upload_date: String(t?.upload_date ?? new Date().toISOString()),
    processing_status: status,
    processed_at: t?.processed_at ?? null,
    error_message: t?.error_message ?? null,
  }
}

export const useTranscripts = () => {
  return useQuery<Transcript[]>({
    queryKey: ['transcripts'],
    queryFn: async () => {
      const response = await api.get('/transcripts')
      return response.data
    },
  })
}

export const useUploadTranscript = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await api.post('/transcripts/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
    onSuccess: () => {
      // Invalidate transcripts to refresh the list
      queryClient.invalidateQueries({ queryKey: ['transcripts'] })
      
      // Invalidate courses and analytics to refresh data after parsing
      // This ensures analytics show the newly parsed courses
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['academic-analytics'] })
    },
  })
}

export const useTranscriptStatus = (transcriptId: string) => {
  return useQuery<Transcript>({
    queryKey: ['transcripts', transcriptId],
    queryFn: async () => {
      const response = await api.get(`/transcripts/${transcriptId}/status`)
      return response.data
    },
    enabled: !!transcriptId,
    refetchInterval: (query) => {
      // Poll every 2 seconds if still processing
      const data = query.state.data
      if (data?.processing_status === 'pending' || data?.processing_status === 'processing') {
        return 2000
      }
      return false
    },
  })
}

