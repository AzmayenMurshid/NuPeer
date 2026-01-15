'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAlumniProfile, useSearchMentors, useSearchMentees, useMentorshipRequests, useCreateMentorshipRequest, useAcceptMentorshipRequest, useRejectMentorshipRequest } from '@/lib/hooks/useMentorship'
import { Search, UserPlus, MessageSquare, Check, X, Briefcase, MapPin, GraduationCap, FileText, Linkedin, Globe, Users, TrendingUp, Sparkles, ArrowRight, Filter, XCircle } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function MentorshipPage() {
  return (
    <ProtectedRoute>
      <MentorshipContent />
    </ProtectedRoute>
  )
}

function MentorshipContent() {
  const { user, isLoading: authLoading } = useAuth()
  const isAlumni = user?.is_alumni || false
  
  // CRITICAL: All hooks must be called before any early returns
  // Always call hooks unconditionally - use enabled parameter to control execution
  const { data: profile, isLoading: profileLoading } = useAlumniProfile(isAlumni)
  
  // Extract mentor/mentee status early for use in hooks
  const isMentor = profile?.is_mentor || false
  const isMentee = profile?.is_mentee || false
  const isMenteeOnly = isMentee && !isMentor // Mentee but not a mentor
  
  const [searchType, setSearchType] = useState<'mentors' | 'mentees'>('mentors')
  const [searchFilters, setSearchFilters] = useState({
    industry: '',
    major: '',
    location: '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedMentor, setSelectedMentor] = useState<any>(null)
  const [requestMessage, setRequestMessage] = useState('')

  // Always call all hooks - use enabled parameter to control when they run
  // Mentees can search for mentors, mentors can search for mentees
  const { data: mentors, isLoading: mentorsLoading } = useSearchMentors(
    searchType === 'mentors' && isAlumni ? searchFilters : undefined,
    isAlumni && searchType === 'mentors' && (isMentee || isMentor) // Allow both mentees and mentors to search
  )
  const { data: mentees, isLoading: menteesLoading } = useSearchMentees(
    searchType === 'mentees' && isAlumni ? searchFilters : undefined,
    isAlumni && searchType === 'mentees' && isMentor
  )
  const { data: requests } = useMentorshipRequests(isAlumni)
  const createRequestMutation = useCreateMentorshipRequest()
  const acceptRequestMutation = useAcceptMentorshipRequest()
  const rejectRequestMutation = useRejectMentorshipRequest()
  const pendingRequests = requests?.filter(r => r.status === 'pending') || []
  const activeMentorships = requests?.filter(r => r.status === 'accepted') || []

  // Show loading only while checking user status
  // NOTE: This early return is AFTER all hooks are called
  if (authLoading) {
    return (
      <main className="min-h-screen bg-white dark:bg-black content-with-nav">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </main>
    )
  }

  const handleRequestMentor = async () => {
    if (!selectedMentor) return
    
    try {
      await createRequestMutation.mutateAsync({
        mentor_id: selectedMentor.alumni_profile.id,
        message: requestMessage,
      })
      setShowRequestModal(false)
      setSelectedMentor(null)
      setRequestMessage('')
      alert('Mentorship request sent successfully!')
    } catch (error: any) {
      alert(error.message || 'Failed to send request')
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptRequestMutation.mutateAsync(requestId)
      alert('Mentorship request accepted!')
    } catch (error: any) {
      alert(error.message || 'Failed to accept request')
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectRequestMutation.mutateAsync(requestId)
      alert('Mentorship request rejected')
    } catch (error: any) {
      alert(error.message || 'Failed to reject request')
    }
  }

  const clearFilters = () => {
    setSearchFilters({ industry: '', major: '', location: '' })
  }

  const hasActiveFilters = searchFilters.industry || searchFilters.major || searchFilters.location

  if (!isAlumni) {
    return (
      <main className="min-h-screen bg-white dark:bg-black content-with-nav">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="card p-12 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/20 mb-4">
                <Users className="w-10 h-10 text-primary-600 dark:text-primary-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Alumni Mentorship Program
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Connect with experienced alumni to accelerate your career growth
              </p>
            </div>
            <p className="text-gray-500 dark:text-gray-500 mb-8">
              This program is exclusively for alumni. Please register as an alumnus to access the mentorship features.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
            >
              Register as Alumni
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white dark:bg-black content-with-nav">
      {/* Minimal Header - Dashboard Style */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition-colors">
                <span>←</span>
                <span>Back</span>
              </Link>
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-700"></div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-500" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mentorship</h1>
                <span className="text-xs font-semibold text-primary-500">ΣΝ</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!profile && (
                <Link
                  href="/mentorship/profile"
                  className="hidden md:flex items-center gap-2 px-4 py-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  Complete Profile
                </Link>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header with Description */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-8 h-8 text-primary-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mentorship Program</h1>
            <span className="text-sm font-semibold text-primary-500">ΣΝ</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed max-w-3xl">
            Connect with Sigma Nu alumni mentors to accelerate your career growth, or give back by mentoring 
            the next generation of brothers. Build meaningful professional relationships that strengthen our 
            brotherhood across generations.
          </p>
        </div>

        {/* Program Description Section */}
        <div className="card p-6 md:p-8 mb-6 bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-900/10 border border-primary-200 dark:border-primary-800">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                About the Mentorship Program
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                The Sigma Nu Zeta Chi Mentorship Program connects current students and recent graduates with experienced alumni 
                to foster professional growth, career development, and lasting brotherhood connections. Whether you're seeking 
                guidance or looking to give back, this platform facilitates meaningful mentorship relationships.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">For Students & Recent Graduates</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                      Find mentors who can provide career advice, industry insights, resume feedback, and guidance on navigating 
                      your professional journey. Connect with alumni in your field of interest.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">For Alumni</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                      Share your expertise and help shape the next generation of Sigma Nu brothers. Mentor students and recent 
                      graduates while earning points for your contributions to the community.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Smart Matching</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                      Our platform matches mentors and mentees based on industry, major, location, and career interests to ensure 
                      meaningful and relevant connections.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Earn Points</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                      Get rewarded for participating in the program. Complete your profile, accept mentorship requests, and 
                      contribute to the community to climb the leaderboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar - Minimal Dashboard Style */}
        <div className="flex items-center gap-6 mb-6 text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Users className="w-4 h-4" />
            <span className="font-medium text-gray-900 dark:text-white">{mentors?.length || 0}</span>
            <span>Available Mentors</span>
          </div>
          {pendingRequests.length > 0 && (
            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
              <MessageSquare className="w-4 h-4" />
              <span className="font-medium">{pendingRequests.length}</span>
              <span>Pending</span>
            </div>
          )}
          {activeMentorships.length > 0 && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <Check className="w-4 h-4" />
              <span className="font-medium">{activeMentorships.length}</span>
              <span>Active</span>
            </div>
          )}
        </div>

        {/* Profile Setup Banner */}
        {!profile && (
          <div className="card p-4 mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Complete your profile to start connecting
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Add experiences, upload resume, and set preferences
                  </p>
                </div>
              </div>
              <Link
                href="/mentorship/profile"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Set up →
              </Link>
            </div>
          </div>
        )}

        {/* Mentee Welcome Banner */}
        {isMenteeOnly && profile && (
          <div className="card p-4 mb-6 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <UserPlus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Welcome, Mentee!
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Search for mentors below and request mentorship to get guidance from experienced alumni.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Section */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Find {searchType === 'mentors' ? 'Mentors' : 'Mentees'}</h2>
              {isMenteeOnly && searchType === 'mentors' && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Browse available mentors and request mentorship to get personalized guidance
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  showFilters || hasActiveFilters
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {[searchFilters.industry, searchFilters.major, searchFilters.location].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Type Tabs */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setSearchType('mentors')}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                searchType === 'mentors'
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
              }`}
            >
              <Users className="w-5 h-5" />
              Find Mentors
              {isMenteeOnly && (
                <span className="ml-1 px-2 py-0.5 bg-white/20 dark:bg-black/20 rounded-full text-xs">
                  For You
                </span>
              )}
            </button>
            {isMentor && (
              <button
                onClick={() => setSearchType('mentees')}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  searchType === 'mentees'
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                }`}
              >
                <UserPlus className="w-5 h-5" />
                Find Mentees
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {(showFilters || hasActiveFilters) && (
            <div className="border-t border-gray-200 dark:border-gray-800 pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Industry
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchFilters.industry}
                      onChange={(e) => setSearchFilters({ ...searchFilters, industry: e.target.value })}
                      placeholder="e.g., Technology, Finance"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Major
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchFilters.major}
                      onChange={(e) => setSearchFilters({ ...searchFilters, major: e.target.value })}
                      placeholder="e.g., Computer Science"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchFilters.location}
                      onChange={(e) => setSearchFilters({ ...searchFilters, location: e.target.value })}
                      placeholder="e.g., New York, San Francisco"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
              {hasActiveFilters && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
                  >
                    <XCircle className="w-4 h-4" />
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {searchType === 'mentors' && (
            <>
              {mentorsLoading ? (
                <div className="col-span-2 text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Loading mentors...</p>
                </div>
              ) : mentors && mentors.length > 0 ? (
                mentors.map((result) => (
                  <MentorCard
                    key={result.alumni_profile.id}
                    result={result}
                    onRequest={() => {
                      setSelectedMentor(result)
                      setShowRequestModal(true)
                    }}
                  />
                ))
              ) : (
                <div className="col-span-2 card p-12 text-center">
                  <Users className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No mentors found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Try adjusting your search filters to find more mentors.
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {searchType === 'mentees' && (
            <>
              {menteesLoading ? (
                <div className="col-span-2 text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Loading mentees...</p>
                </div>
              ) : mentees && mentees.length > 0 ? (
                mentees.map((result) => (
                  <MentorCard
                    key={result.alumni_profile.id}
                    result={result}
                    onRequest={() => {
                      setSelectedMentor(result)
                      setShowRequestModal(true)
                    }}
                  />
                ))
              ) : (
                <div className="col-span-2 card p-12 text-center">
                  <UserPlus className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No mentees found</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Try adjusting your search filters to find more mentees.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Requests Section */}
        {requests && requests.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Mentorship Requests
              </h2>
              <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full text-sm font-medium">
                {requests.length} Total
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  currentProfileId={profile?.id}
                  onAccept={handleAcceptRequest}
                  onReject={handleRejectRequest}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Request Modal */}
      {showRequestModal && selectedMentor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRequestModal(false)
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6 transform transition-all">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Request Mentorship
              </h3>
              <button
                onClick={() => {
                  setShowRequestModal(false)
                  setRequestMessage('')
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                  <span className="text-primary-600 dark:text-primary-400 font-semibold text-lg">
                    {selectedMentor.user.first_name[0]}{selectedMentor.user.last_name[0]}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedMentor.user.first_name} {selectedMentor.user.last_name}
                  </p>
                  {selectedMentor.alumni_profile.current_position && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedMentor.alumni_profile.current_position}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Why would you like to be mentored by this person?
              </label>
              <textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Share your goals and what you hope to learn..."
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                rows={5}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRequestMentor}
                disabled={createRequestMutation.isPending}
                className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {createRequestMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Send Request
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowRequestModal(false)
                  setRequestMessage('')
                }}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function MentorCard({ result, onRequest }: { result: any; onRequest: () => void }) {
  return (
    <div className="card p-6 hover:shadow-lg transition-all duration-200 border-2 hover:border-primary-200 dark:hover:border-primary-800">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xl">
              {result.user.first_name[0]}{result.user.last_name[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {result.user.first_name} {result.user.last_name}
            </h3>
            {result.alumni_profile.current_position && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {result.alumni_profile.current_position}
                {result.alumni_profile.company && (
                  <span className="text-gray-500"> at {result.alumni_profile.company}</span>
                )}
              </p>
            )}
            {result.match_score && (
              <div className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                <TrendingUp className="w-3 h-3" />
                {Math.round(result.match_score * 100)}% Match
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {result.alumni_profile.industry && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Briefcase className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{result.alumni_profile.industry}</span>
          </div>
        )}
        {result.alumni_profile.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{result.alumni_profile.location}</span>
          </div>
        )}
        {result.user.major && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <GraduationCap className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{result.user.major}</span>
          </div>
        )}
        {result.resume_count > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span>{result.resume_count} Resume{result.resume_count !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {result.alumni_profile.bio && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {result.alumni_profile.bio}
        </p>
      )}

      {result.experiences && result.experiences.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-500 mb-2 uppercase tracking-wide">Experience</p>
          <div className="space-y-2">
            {result.experiences.slice(0, 2).map((exp: any) => (
              <div key={exp.id} className="text-sm">
                <span className="font-medium text-gray-900 dark:text-white">{exp.title}</span>
                {exp.company && (
                  <span className="text-gray-600 dark:text-gray-400"> at {exp.company}</span>
                )}
              </div>
            ))}
            {result.experiences.length > 2 && (
              <p className="text-xs text-gray-500 dark:text-gray-500">
                +{result.experiences.length - 2} more experience{result.experiences.length - 2 !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={onRequest}
          className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Request Mentorship
        </button>
        <div className="flex gap-2">
          {result.alumni_profile.linkedin_url && (
            <a
              href={result.alumni_profile.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors"
              title="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
          )}
          {result.alumni_profile.website_url && (
            <a
              href={result.alumni_profile.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors"
              title="Website"
            >
              <Globe className="w-5 h-5" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function RequestCard({
  request,
  currentProfileId,
  onAccept,
  onReject,
}: {
  request: any
  currentProfileId?: string
  onAccept: (id: string) => void
  onReject: (id: string) => void
}) {
  const isReceived = request.mentor_id === currentProfileId
  const statusColors = {
    pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
    accepted: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
    rejected: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
    cancelled: 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400',
  }

  return (
    <div className="p-5 border-2 border-gray-200 dark:border-gray-800 rounded-lg hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${
            isReceived ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-primary-100 dark:bg-primary-900/20'
          }`}>
            {isReceived ? (
              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <ArrowRight className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {isReceived ? 'Request Received' : 'Request Sent'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {new Date(request.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[request.status as keyof typeof statusColors]}`}>
          {request.status}
        </span>
      </div>
      
      {request.message && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          {request.message}
        </p>
      )}
      
      {isReceived && request.status === 'pending' && (
        <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => onAccept(request.id)}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Accept
          </button>
          <button
            onClick={() => onReject(request.id)}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Reject
          </button>
        </div>
      )}
    </div>
  )
}
