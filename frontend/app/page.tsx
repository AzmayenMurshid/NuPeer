'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'

// Force dynamic rendering to avoid SSR issues with theme
export const dynamic = 'force-dynamic'

export default function Home() {
  const { isAuthenticated, user } = useAuth()

  return (
    <main className="min-h-screen p-8 bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">NuPeer</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Connect with Sigma Nu brothers who can help with your classes
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <Link
                  href="/profile"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                >
                  {user?.first_name} {user?.last_name}
                </Link>
                <Link
                  href="/profile"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
        {isAuthenticated ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Link 
              href="/upload" 
              className="p-6 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-lg transition-all cursor-pointer"
            >
              <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">Upload Transcript</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Upload your transcript PDF to automatically extract your courses
              </p>
            </Link>
            <Link 
              href="/help" 
              className="p-6 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-lg transition-all cursor-pointer"
            >
              <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">Get Help</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Find brothers who excelled in the classes you need help with
              </p>
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Welcome to NuPeer</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Sign in or create an account to start connecting with brothers and getting help with your classes.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/register"
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-gray-900 dark:text-white"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

