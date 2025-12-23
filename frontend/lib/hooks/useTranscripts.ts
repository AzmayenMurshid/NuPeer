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
      queryClient.invalidateQueries({ queryKey: ['transcripts'] })
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

