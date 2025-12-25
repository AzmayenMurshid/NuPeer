'use client'

import LandingPage from '@/components/LandingPage'

// Force dynamic rendering to avoid SSR issues with theme
export const dynamic = 'force-dynamic'

export default function Home() {
  return <LandingPage />
}
