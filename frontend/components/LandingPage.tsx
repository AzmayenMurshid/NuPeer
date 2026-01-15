'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Users, TrendingUp, Briefcase, MapPin, GraduationCap, ArrowRight } from 'lucide-react'

// Custom hook for scroll animations
function useScrollAnimation() {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [])

  return { ref, isVisible }
}

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
          <HeroSection />

          {/* Features - Robinhood style cards with scroll animations */}
          <FeaturesSection />

          {/* Mentorship Program Section */}
          <MentorshipSection />

          {/* Transcript Upload Appeal Section - Robinhood style with scroll animation */}
          <TranscriptSection />
        </div>
      </div>
    </div>
  )
}

// Hero Section Component with scroll animation
function HeroSection() {
  const { ref, isVisible } = useScrollAnimation()
  const { isAuthenticated } = useAuth()

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
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
    </div>
  )
}

// Features Section Component with scroll animation
function FeaturesSection() {
  const { ref, isVisible } = useScrollAnimation()

  return (
    <div
      ref={ref}
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-16 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
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
  )
}

// Mentorship Section Component with scroll animation
function MentorshipSection() {
  const { ref, isVisible } = useScrollAnimation()
  const { isAuthenticated } = useAuth()

  return (
    <div
      ref={ref}
      className={`mt-20 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      <div className="card p-8 md:p-12 border-primary-500/30">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Users className="w-12 h-12 text-primary-500" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Mentorship Program
            </h2>
          </div>
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
            Connect with Sigma Nu alumni for career guidance, academic support, and professional development. 
            Build meaningful relationships that extend beyond graduation.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-primary-50 dark:bg-primary-900/10">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">For Students</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  Find experienced alumni mentors in your field. Get career advice, industry insights, 
                  and guidance on navigating your academic and professional journey.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-primary-50 dark:bg-primary-900/10">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">For Alumni</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  Give back to the brotherhood by mentoring current students. Share your expertise, 
                  help shape the next generation, and earn points for your contributions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-primary-50 dark:bg-primary-900/10">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Smart Matching</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  Find mentors or mentees based on industry, major, location, and career interests. 
                  Connect with brothers who share your professional goals.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-primary-50 dark:bg-primary-900/10">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Earn Points</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  Get rewarded for helping each other. Complete your profile, accept mentorship requests, 
                  and contribute to the community to climb the leaderboard.
                </p>
              </div>
            </div>
          </div>

          {isAuthenticated ? (
            <Link
              href="/mentorship"
              className="inline-flex items-center gap-2 px-10 py-5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-bold text-xl transition-all active:scale-95"
            >
              Explore Mentorship Program
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-10 py-5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-bold text-xl transition-all active:scale-95"
            >
              Get Started - Join the Program
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">
            Build lasting connections with brothers across generations
          </p>
        </div>
      </div>
    </div>
  )
}

// Transcript Section Component with scroll animation
function TranscriptSection() {
  const { ref, isVisible } = useScrollAnimation()
  const { isAuthenticated } = useAuth()

  return (
    <div
      ref={ref}
      className={`mt-20 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      <div className="card p-8 md:p-12 border-primary-500/30">
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
  )
}
