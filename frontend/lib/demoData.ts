/**
 * Demo Data Utility
 * Loads and provides demo data for presentation purposes
 */

import demoDataJson from './demo-data.json'

// Check if we should use demo data (when API fails or in demo mode)
export const shouldUseDemoData = (): boolean => {
  // Use demo data if:
  // 1. NEXT_PUBLIC_USE_DEMO_DATA is set to 'true'
  // 2. We're in development mode and API fails
  if (typeof window !== 'undefined') {
    const useDemo = localStorage.getItem('use_demo_data') === 'true'
    const envDemo = process.env.NEXT_PUBLIC_USE_DEMO_DATA === 'true'
    return useDemo || envDemo
  }
  return process.env.NEXT_PUBLIC_USE_DEMO_DATA === 'true'
}

// Enable demo data mode
export const enableDemoData = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('use_demo_data', 'true')
  }
}

// Disable demo data mode
export const disableDemoData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('use_demo_data')
  }
}

// Get demo data with type safety
export const getDemoData = () => {
  return demoDataJson as typeof demoDataJson
}

// Simulate API delay for realistic demo
export const simulateApiDelay = (ms: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Helper to create a promise that resolves with demo data after delay
export const getDemoDataAsync = async <T>(data: T, delay: number = 500): Promise<T> => {
  await simulateApiDelay(delay)
  return data
}


