'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function LandingPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
      {/* Animated Background with Greek Letters */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Sigma Letter (Σ) */}
        <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="text-[20rem] md:text-[30rem] font-bold text-[#d97706]/20 select-none animate-float-slow">
              Σ
            </div>
            <div className="absolute inset-0 text-[20rem] md:text-[30rem] font-bold text-[#d97706]/30 select-none animate-pulse-slow blur-sm">
              Σ
            </div>
          </div>
        </div>

        {/* Nu Letter (Ν) */}
        <div className="absolute top-3/4 right-1/4 transform translate-x-1/2 translate-y-1/2">
          <div className="relative">
            <div className="text-[20rem] md:text-[30rem] font-bold text-[#f59e0b]/20 select-none animate-float-slow-delayed">
              Ν
            </div>
            <div className="absolute inset-0 text-[20rem] md:text-[30rem] font-bold text-[#f59e0b]/30 select-none animate-pulse-slow-delayed blur-sm">
              Ν
            </div>
          </div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-[#d97706]/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 5}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading with 3D effect */}
          <div className="mb-6 relative">
            <h1 className="text-7xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#d97706] bg-clip-text text-transparent drop-shadow-2xl animate-gradient-x bg-[length:200%_200%]">
              NuPeer
            </h1>
            {/* 3D shadow effect */}
            <div className="absolute inset-0 text-7xl md:text-8xl font-bold bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#d97706] bg-clip-text text-transparent blur-xl opacity-50 -z-10 transform translate-y-2">
              NuPeer
            </div>
          </div>
          
          {/* Subtitle */}
          <p className="text-2xl md:text-3xl mb-4 text-gray-200 font-light">
            Connect with <span className="font-semibold text-[#d97706]">Sigma Nu</span> brothers
          </p>
          <p className="text-xl md:text-2xl mb-12 text-gray-300">
            Get academic help from brothers who excelled in your classes
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-[#d97706] hover:bg-[#f59e0b] text-white rounded-lg font-semibold text-lg shadow-2xl hover:shadow-[#d97706]/50 transition-all transform hover:scale-105 duration-300 relative overflow-hidden group"
              >
                <span className="relative z-10">Go to Dashboard</span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#f59e0b] to-[#d97706] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="px-8 py-4 bg-[#d97706] hover:bg-[#f59e0b] text-white rounded-lg font-semibold text-lg shadow-2xl hover:shadow-[#d97706]/50 transition-all transform hover:scale-105 duration-300 relative overflow-hidden group"
                >
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#f59e0b] to-[#d97706] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 bg-transparent border-2 border-[#d97706] hover:bg-[#d97706]/10 text-white rounded-lg font-semibold text-lg shadow-xl hover:shadow-[#d97706]/30 transition-all transform hover:scale-105 duration-300"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-all transform hover:scale-105 duration-300">
              <div className="text-4xl mb-4 animate-bounce-slow">📚</div>
              <h3 className="text-xl font-semibold mb-2">Upload Transcript</h3>
              <p className="text-gray-300">Automatically extract your courses and grades from your transcript</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-all transform hover:scale-105 duration-300">
              <div className="text-4xl mb-4 animate-bounce-slow-delayed">🤝</div>
              <h3 className="text-xl font-semibold mb-2">Find Help</h3>
              <p className="text-gray-300">Connect with brothers who excelled in the classes you need help with</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-all transform hover:scale-105 duration-300">
              <div className="text-4xl mb-4 animate-bounce-slow-delayed-2">📊</div>
              <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
              <p className="text-gray-300">Monitor your academic performance with detailed analytics</p>
            </div>
          </div>

          {/* Transcript Upload Appeal Section */}
          <div className="mt-20 bg-gradient-to-r from-[#d97706]/20 via-[#f59e0b]/20 to-[#d97706]/20 backdrop-blur-sm rounded-2xl p-8 md:p-12 border-2 border-[#d97706]/30 shadow-2xl">
            <div className="text-center max-w-3xl mx-auto">
              <div className="text-6xl mb-6 animate-pulse">📄</div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                Start Your Academic Journey
              </h2>
              <p className="text-xl md:text-2xl text-gray-200 mb-6 leading-relaxed">
                Upload your transcript to unlock powerful insights and connect with brothers who can help you succeed
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">✨</div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Instant Analysis</h4>
                    <p className="text-gray-300 text-sm">Get your GPA, credit progress, and course breakdown in seconds</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🎯</div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Smart Matching</h4>
                    <p className="text-gray-300 text-sm">Find brothers who excelled in the exact courses you're taking</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">📈</div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Track Progress</h4>
                    <p className="text-gray-300 text-sm">Monitor your academic performance with detailed analytics and trends</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🔒</div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Secure & Private</h4>
                    <p className="text-gray-300 text-sm">Your transcript is processed securely and only visible to you</p>
                  </div>
                </div>
              </div>
              {isAuthenticated ? (
                <Link
                  href="/upload"
                  className="inline-block px-10 py-5 bg-[#d97706] hover:bg-[#f59e0b] text-white rounded-lg font-bold text-xl shadow-2xl hover:shadow-[#d97706]/50 transition-all transform hover:scale-110 duration-300 relative overflow-hidden group"
                >
                  <span className="relative z-10">Upload Your Transcript Now</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#f59e0b] to-[#d97706] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="inline-block px-10 py-5 bg-[#d97706] hover:bg-[#f59e0b] text-white rounded-lg font-bold text-xl shadow-2xl hover:shadow-[#d97706]/50 transition-all transform hover:scale-110 duration-300 relative overflow-hidden group"
                >
                  <span className="relative z-10">Get Started - Upload Your Transcript</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#f59e0b] to-[#d97706] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              )}
              <p className="text-gray-400 text-sm mt-4">
                Simply upload your PDF transcript and we'll handle the rest
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
