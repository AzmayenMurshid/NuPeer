'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function LandingPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white relative overflow-hidden">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Minimal background - Robinhood style */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-10 dark:opacity-5">
        {/* Subtle pattern */}
        <div className="absolute top-[calc(25%-350px)] left-[calc(25%-250px)]">
          <div className="text-[15rem] md:text-[20rem] font-bold text-primary-500 select-none">
            Σ
          </div>
        </div>
        <div className="absolute top-[calc(25%-350px)] left-[calc(25%-250px+18rem-170px)] md:left-[calc(25%-250px+24rem-170px)]">
          <div className="text-[15rem] md:text-[20rem] font-bold text-primary-500 select-none">
            Ν
          </div>
        </div>
        <div className="absolute top-[calc(25%-350px)] right-[calc(25%-250px+18rem-170px)] md:right-[calc(25%-250px+24rem-170px)]">
          <div className="text-[15rem] md:text-[20rem] font-bold text-primary-500 select-none">
            Ζ
          </div>
        </div>
        <div className="absolute top-[calc(25%-350px)] right-[calc(25%-250px)]">
          <div className="text-[15rem] md:text-[20rem] font-bold text-primary-500 select-none">
            Χ
          </div>
        </div>
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading - Robinhood style clean */}
          <div className="mb-8">
            <h1 className="text-6xl md:text-7xl font-bold mb-4 text-gray-900 dark:text-white">
              NuPeer
            </h1>
            <div className="flex items-center gap-2 justify-center mb-6">
              <span className="text-sm font-semibold text-primary-500">ΣΝ</span>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Sigma Nu Zeta Chi</span>
            </div>
          </div>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl mb-2 text-gray-700 dark:text-gray-300 font-medium">
            Connect with brothers who can help
          </p>
          <p className="text-lg md:text-xl mb-12 text-gray-600 dark:text-gray-400">
            Your academic success, powered by brotherhood
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold text-lg transition-all active:scale-95"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold text-lg transition-all active:scale-95"
                >
                  Get Started
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 bg-transparent border-2 border-primary-500 hover:bg-primary-500/10 text-gray-900 dark:text-white rounded-lg font-semibold text-lg transition-all active:scale-95"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Features - Robinhood style cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-16">
            <div className="card card-hover p-6">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Upload Transcript</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Automatically extract your courses and grades from PDF transcripts</p>
            </div>
            <div className="card card-hover p-6">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Find Help</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Connect with brothers who excelled in your classes</p>
            </div>
            <div className="card card-hover p-6">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Advanced Analytics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Detailed graphs, GPA trends, and performance insights</p>
            </div>
            <div className="card card-hover p-6">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Study Groups</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Find brothers taking the same courses for group study</p>
            </div>
            <div className="card card-hover p-6">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Brothers in Major</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Connect with brothers who share your academic major</p>
            </div>
            <div className="card card-hover p-6">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Track Current Courses</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage and monitor courses you're currently taking</p>
            </div>
          </div>

          {/* Transcript Upload Appeal Section - Robinhood style */}
          <div className="mt-20 card p-8 md:p-12 border-primary-500/30">
            <div className="text-center max-w-3xl mx-auto">
              <div className="text-6xl mb-6 animate-pulse">📄</div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                Start Your Academic Journey
              </h2>
              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                Upload your transcript to unlock powerful insights and connect with brothers who can help you succeed
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">✨</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Instant Analysis</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Get your GPA, credit progress, and course breakdown in seconds</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🎯</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Smart Matching</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Find brothers who excelled in the exact courses you're taking</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">👥</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Study Groups</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Find brothers taking the same current courses for group study sessions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">📈</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Advanced Analytics</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Detailed graphs, GPA trends, grade distribution, and performance insights</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🎓</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Major Connections</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Connect with brothers in your major through swipeable carousels</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🔒</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Secure & Private</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Your transcript is processed securely and only visible to you</p>
                  </div>
                </div>
              </div>
              {isAuthenticated ? (
                <Link
                  href="/upload"
                  className="inline-block px-10 py-5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-bold text-xl transition-all active:scale-95"
                >
                  Upload Your Transcript Now
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="inline-block px-10 py-5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-bold text-xl transition-all active:scale-95"
                >
                  Get Started - Upload Your Transcript
                </Link>
              )}
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">
                Simply upload your PDF transcript and we'll handle the rest
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
