'use client'

import { useState, useEffect } from 'react'
import { enableDemoData, disableDemoData, shouldUseDemoData } from '@/lib/demoData'

export function DemoDataToggle() {
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    setIsEnabled(shouldUseDemoData())
  }, [])

  const handleToggle = () => {
    if (isEnabled) {
      disableDemoData()
      setIsEnabled(false)
      alert('Demo data disabled. Refresh the page to see changes.')
    } else {
      enableDemoData()
      setIsEnabled(true)
      alert('Demo data enabled. Refresh the page to see changes.')
    }
  }

  if (process.env.NEXT_PUBLIC_USE_DEMO_DATA === 'true') {
    return (
      <div className="fixed bottom-20 right-4 z-50 px-3 py-2 bg-green-500 text-white text-xs rounded-lg shadow-lg">
        Demo Data: ON (via env)
      </div>
    )
  }

  return (
    <button
      onClick={handleToggle}
      className="fixed bottom-20 right-4 z-50 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg shadow-lg transition-colors"
      title="Toggle demo data mode"
    >
      Demo Data: {isEnabled ? 'ON' : 'OFF'}
    </button>
  )
}


