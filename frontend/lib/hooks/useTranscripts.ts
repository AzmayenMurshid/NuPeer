import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { shouldUseDemoData, getDemoDataAsync, getDemoData } from '../demoData'

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
      if (shouldUseDemoData()) {
        return getDemoDataAsync(getDemoData().transcripts.map(toTranscript))
      }
      try {
        const response = await api.get('/transcripts')
        return response.data
      } catch (error) {
        console.warn('API failed, using demo data:', error)
        return getDemoDataAsync(getDemoData().transcripts.map(toTranscript))
      }
    },
  })
}

export const useUploadTranscript = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (file: File) => {
      // In demo mode, don't hit the backend (avoids S3/MinIO dependency)
      if (shouldUseDemoData()) {
        const now = new Date()
        const demoTranscript: Transcript = {
          id: `demo-upload-${now.getTime()}`,
          file_name: file.name || 'demo_transcript.pdf',
          file_size: typeof file.size === 'number' ? file.size : null,
          upload_date: now.toISOString(),
          processing_status: 'completed',
          processed_at: now.toISOString(),
          error_message: null,
        }
        return getDemoDataAsync(demoTranscript, 500)
      }

      const formData = new FormData()
      formData.append('file', file)
      
      try {
        const response = await api.post('/transcripts/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        return response.data
      } catch (error: any) {
        // Extract error message from response
        const errorMessage = error?.response?.data?.detail || error?.message || 'Upload failed'
        throw new Error(errorMessage)
      }
    },
    onSuccess: (created: Transcript) => {
      if (shouldUseDemoData()) {
        // Update cache immediately so UI reflects the "uploaded" transcript
        queryClient.setQueryData<Transcript[]>(['transcripts'], (prev) => {
          const existing = prev ?? getDemoData().transcripts.map(toTranscript)
          // Avoid accidental duplicates if user retries quickly
          if (existing.some((t) => t.id === created.id)) return existing
          return [created, ...existing]
        })
        return
      }

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

