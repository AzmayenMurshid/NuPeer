'use client'

import { useState } from 'react'
import { useClassPosts, useSearchClassPosts, useCreateClassPost, useDeleteClassPost, ClassPost } from '@/lib/hooks/useClassPosts'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import Link from 'next/link'
import { Star, Search, Plus, Trash2, BookOpen, User, Monitor, Lock, Calendar } from 'lucide-react'

export default function ProfessorRatingsPage() {
  return (
    <ProtectedRoute>
      <ProfessorRatingsContent />
    </ProtectedRoute>
  )
}

function ProfessorRatingsContent() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  // Use search if query exists, otherwise get all posts
  const { data: searchResults, isLoading: isSearching } = useSearchClassPosts(searchQuery)
  const { data: allPosts, isLoading: isLoadingAll } = useClassPosts()
  
  const displayPosts = searchQuery ? searchResults : allPosts
  const isLoading = searchQuery ? isSearching : isLoadingAll
  
  const createPostMutation = useCreateClassPost()
  const deletePostMutation = useDeleteClassPost()
  
  const [formData, setFormData] = useState({
    course_code: '',
    course_name: '',
    class_format: 'in_person',
    professor_name: '',
    professor_rating: 0,
    exam_format: 'in_person',
    lockdown_browser_required: null as boolean | null,
    description: '',
  })
  
  const [lastClickedStar, setLastClickedStar] = useState<number | null>(null)
  
  const handleStarClick = (starIndex: number) => {
    // starIndex is 0-4 (for 5 stars)
    const halfRating = starIndex + 0.5 // First click = half star
    const fullRating = starIndex + 1    // Second click = full star
    
    // If clicking the same star that was last clicked, toggle between half and full
    if (lastClickedStar === starIndex) {
      if (formData.professor_rating === halfRating) {
        // Currently at half, make it full
        setFormData({ ...formData, professor_rating: fullRating })
      } else if (formData.professor_rating === fullRating) {
        // Currently at full, make it half (or could go to 0, but let's keep it at half)
        setFormData({ ...formData, professor_rating: halfRating })
      } else {
        // Different rating, set to half
        setFormData({ ...formData, professor_rating: halfRating })
      }
    } else {
      // Clicking a different star, set to half star
      setFormData({ ...formData, professor_rating: halfRating })
      setLastClickedStar(starIndex)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.professor_rating === 0) {
      alert('Please select a rating by clicking on the stars')
      return
    }
    try {
      await createPostMutation.mutateAsync(formData)
      setShowCreateForm(false)
      setFormData({
        course_code: '',
        course_name: '',
        class_format: 'in_person',
        professor_name: '',
        professor_rating: 0,
        exam_format: 'in_person',
        lockdown_browser_required: null,
        description: '',
      })
      setLastClickedStar(null)
    } catch (error) {
      console.error('Failed to create post:', error)
    }
  }
  
  const handleDelete = async (postId: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePostMutation.mutateAsync(postId)
      } catch (error) {
        console.error('Failed to delete post:', error)
      }
    }
  }
  
  const renderStars = (rating: number, clickable: boolean = false) => {
    return (
      <div className="flex items-center gap-1">
        {[0, 1, 2, 3, 4].map((starIndex) => {
          const starValue = starIndex + 1
          const isFull = rating >= starValue
          const isHalf = rating >= starValue - 0.5 && rating < starValue
          
          return (
            <div key={starIndex} className="relative">
              {clickable ? (
                <button
                  type="button"
                  onClick={() => handleStarClick(starIndex)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 transition-all ${
                      isFull
                        ? 'fill-yellow-400 text-yellow-400'
                        : isHalf
                        ? 'fill-yellow-400/50 text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300'
                    }`}
                  />
                </button>
              ) : (
                <Star
                  className={`w-5 h-5 ${
                    isFull
                      ? 'fill-yellow-400 text-yellow-400'
                      : isHalf
                      ? 'fill-yellow-400/50 text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              )}
            </div>
          )
        })}
        {!clickable && <span className="ml-2 text-sm font-medium text-heading">{rating.toFixed(1)}</span>}
      </div>
    )
  }
  
  return (
    <main className="page-container content-with-nav">
      <div className="page-header">
        <div className="page-header-inner">
          <div className="page-header-content">
            <Link href="/dashboard" className="link-back">
              <span>←</span>
              <span>Back</span>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="mb-6">
          <h1 className="page-title flex items-center gap-3">
            <Star className="w-8 h-8 text-primary-500" />
            Professor Ratings
          </h1>
          <p className="text-muted">
            Share and discover professor ratings and class details
          </p>
        </div>

        {/* Search Bar */}
        <div className="card card-padding mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by professor name or course code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-heading focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Create Post Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create a Post</span>
          </button>
        </div>

        {/* Create Post Form */}
        {showCreateForm && (
          <div className="card card-padding mb-6">
            <h2 className="text-xl font-semibold text-heading mb-4">Create a Post</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-heading mb-2">
                    Course Code (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.course_code}
                    onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                    placeholder="e.g., CS 101"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-heading"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-heading mb-2">
                    Course Name (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.course_name}
                    onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                    placeholder="e.g., Introduction to Computer Science"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-heading"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-heading mb-2">
                  Professor Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.professor_name}
                  onChange={(e) => setFormData({ ...formData, professor_name: e.target.value })}
                  placeholder="e.g., Dr. John Smith"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-heading"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-heading mb-2">
                  Professor Rating (click stars to rate) *
                </label>
                <div className="flex items-center gap-4">
                  {renderStars(formData.professor_rating, true)}
                  {formData.professor_rating > 0 && (
                    <span className="text-sm font-medium text-heading">{formData.professor_rating.toFixed(1)} / 5.0</span>
                  )}
                </div>
                {formData.professor_rating === 0 && (
                  <p className="text-xs text-muted mt-1">Click on a star to rate (each click = 0.5 stars)</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-heading mb-2">
                    Class Format *
                  </label>
                  <select
                    required
                    value={formData.class_format}
                    onChange={(e) => setFormData({ ...formData, class_format: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-heading"
                  >
                    <option value="in_person">In Person</option>
                    <option value="online">Online</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-heading mb-2">
                    Exam Format *
                  </label>
                  <select
                    required
                    value={formData.exam_format}
                    onChange={(e) => {
                      const examFormat = e.target.value
                      setFormData({
                        ...formData,
                        exam_format: examFormat,
                        lockdown_browser_required: examFormat === 'online' ? formData.lockdown_browser_required : null
                      })
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-heading"
                  >
                    <option value="in_person">In Person</option>
                    <option value="online">Online</option>
                  </select>
                </div>
              </div>
              
              {formData.exam_format === 'online' && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-heading">
                    <input
                      type="checkbox"
                      checked={formData.lockdown_browser_required === true}
                      onChange={(e) => setFormData({
                        ...formData,
                        lockdown_browser_required: e.target.checked ? true : false
                      })}
                      className="rounded"
                    />
                    Lockdown Browser Required
                  </label>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-heading mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Share your experience with this class..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-heading"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={createPostMutation.isPending}
                  className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {createPostMutation.isPending ? 'Submitting...' : 'Submit'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-heading hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts List */}
        {isLoading ? (
          <div className="card card-padding text-center py-12">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading ratings...</p>
          </div>
        ) : displayPosts && displayPosts.length > 0 ? (
          <div className="space-y-4">
            {displayPosts.map((post: ClassPost) => (
              <div key={post.id} className="card card-padding">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-heading">{post.professor_name}</h3>
                      {renderStars(post.professor_rating)}
                    </div>
                    {(post.course_code || post.course_name) && (
                      <div className="flex items-center gap-2 text-sm text-muted mb-2">
                        <BookOpen className="w-4 h-4" />
                        <span>
                          {post.course_code && <span className="font-medium">{post.course_code}</span>}
                          {post.course_code && post.course_name && ' • '}
                          {post.course_name}
                        </span>
                      </div>
                    )}
                  </div>
                  {post.user_id === user?.id && (
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Monitor className="w-4 h-4 text-gray-400" />
                    <span className="text-muted">Class:</span>
                    <span className="font-medium text-heading capitalize">{post.class_format.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span className="text-muted">Exam:</span>
                    <span className="font-medium text-heading capitalize">{post.exam_format.replace('_', ' ')}</span>
                    {post.exam_format === 'online' && post.lockdown_browser_required && (
                      <span className="ml-2 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded text-xs">
                        <Lock className="w-3 h-3 inline mr-1" />
                        Lockdown Browser
                      </span>
                    )}
                  </div>
                </div>
                
                {post.description && (
                  <p className="text-sm text-muted mb-4">{post.description}</p>
                )}
                
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <h3 className="text-xl font-semibold text-heading mb-2">No ratings found</h3>
            <p className="text-muted">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Be the first to share a professor rating!'}
            </p>
          </>
        )}
      </div>
    </main>
  )
}

