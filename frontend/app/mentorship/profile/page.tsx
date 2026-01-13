'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import {
  useAlumniProfile,
  useUpdateAlumniProfile,
  useExperiences,
  useCreateExperience,
  useUpdateExperience,
  useDeleteExperience,
  useResumes,
  useUploadResume,
} from '@/lib/hooks/useMentorship'
import { Plus, X, Edit, Trash2, Upload, FileText } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function AlumniProfilePage() {
  return (
    <ProtectedRoute>
      <AlumniProfileContent />
    </ProtectedRoute>
  )
}

function AlumniProfileContent() {
  // CRITICAL: All hooks must be called before any early returns
  const { data: profile, isLoading: profileLoading } = useAlumniProfile(true)
  const { data: experiences, isLoading: experiencesLoading } = useExperiences(true)
  const { data: resumes, isLoading: resumesLoading } = useResumes(true)
  const updateProfileMutation = useUpdateAlumniProfile()
  const createExperienceMutation = useCreateExperience()
  const updateExperienceMutation = useUpdateExperience()
  const deleteExperienceMutation = useDeleteExperience()
  const uploadResumeMutation = useUploadResume()
  
  // All useState hooks must also be called before early returns
  const [profileData, setProfileData] = useState({
    bio: '',
    chapter: '',
    current_position: '',
    company: '',
    industry: '',
    location: '',
    linkedin_url: '',
    website_url: '',
    is_mentor: false,
    is_mentee: false,
    mentor_capacity: 5,
  })

  const [showExperienceForm, setShowExperienceForm] = useState(false)
  const [editingExperience, setEditingExperience] = useState<any>(null)
  const [experienceForm, setExperienceForm] = useState({
    type: 'work',
    title: '',
    company: '',
    location: '',
    description: '',
    start_date: '',
    end_date: '',
    is_current: false,
  })
  
  // Update profileData when profile loads (using useEffect)
  useEffect(() => {
    if (profile) {
      setProfileData({
        bio: profile.bio || '',
        chapter: profile.chapter || '',
        current_position: profile.current_position || '',
        company: profile.company || '',
        industry: profile.industry || '',
        location: profile.location || '',
        linkedin_url: profile.linkedin_url || '',
        website_url: profile.website_url || '',
        is_mentor: profile.is_mentor || false,
        is_mentee: profile.is_mentee || false,
        mentor_capacity: profile.mentor_capacity || 5,
      })
    }
  }, [profile])
  
  // Early return AFTER all hooks are called
  if (profileLoading) {
    return (
      <main className="page-container content-with-nav">
        <div className="page-content py-12">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading profile...</p>
          </div>
        </div>
      </main>
    )
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!profileData.bio || !profileData.bio.trim()) {
      alert('Bio is required')
      return
    }
    if (!profileData.chapter || !profileData.chapter.trim()) {
      alert('Chapter is required')
      return
    }
    if (!profileData.current_position || !profileData.current_position.trim()) {
      alert('Current position is required')
      return
    }
    if (!profileData.company || !profileData.company.trim()) {
      alert('Company is required')
      return
    }
    if (!profileData.industry || !profileData.industry.trim()) {
      alert('Industry is required')
      return
    }
    if (!profileData.location || !profileData.location.trim()) {
      alert('Location is required')
      return
    }
    
    try {
      await updateProfileMutation.mutateAsync(profileData)
      alert('Profile updated successfully!')
    } catch (error: any) {
      alert(error.message || 'Failed to update profile')
    }
  }

  const handleExperienceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    const trimmedTitle = experienceForm.title?.trim()
    if (!trimmedTitle) {
      alert('Please enter a title for the experience')
      return
    }
    
    try {
      if (editingExperience) {
        await updateExperienceMutation.mutateAsync({
          id: editingExperience.id,
          data: experienceForm,
        })
        setEditingExperience(null)
        setShowExperienceForm(false)
      } else {
        await createExperienceMutation.mutateAsync(experienceForm)
        // Reset form but keep it open for adding another experience
        setExperienceForm({
          type: 'work',
          title: '',
          company: '',
          location: '',
          description: '',
          start_date: '',
          end_date: '',
          is_current: false,
        })
        // Don't close the form - allow adding multiple experiences
      }
    } catch (error: any) {
      alert(error.message || 'Failed to save experience')
    }
  }

  const handleCancelExperience = () => {
    setShowExperienceForm(false)
    setEditingExperience(null)
    setExperienceForm({
      type: 'work',
      title: '',
      company: '',
      location: '',
      description: '',
      start_date: '',
      end_date: '',
      is_current: false,
    })
  }

  const handleDeleteExperience = async (id: string) => {
    if (!confirm('Are you sure you want to delete this experience?')) return
    try {
      await deleteExperienceMutation.mutateAsync(id)
    } catch (error: any) {
      alert(error.message || 'Failed to delete experience')
    }
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.match(/\.(pdf|doc|docx)$/i)) {
      alert('Please upload a PDF, DOC, or DOCX file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    try {
      await uploadResumeMutation.mutateAsync(file)
      alert('Resume uploaded successfully!')
    } catch (error: any) {
      alert(error.message || 'Failed to upload resume')
    }
  }

  return (
    <main className="page-container content-with-nav">
      <div className="page-header">
        <div className="page-header-inner">
          <div className="page-header-content">
            <Link href="/mentorship" className="link-back">
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
        <h1 className="page-title">
          Alumni Profile
        </h1>

        {/* Profile Information */}
        <div className="card card-padding mb-6">
          <h2 className="section-title">
            Profile Information
          </h2>
          <form onSubmit={handleProfileUpdate} className="form-container">
            <div className="form-group">
              <label className="form-label-required">
                Bio
              </label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                required
                className="form-textarea"
                rows={4}
              />
            </div>

            <div className="form-group">
              <label className="form-label-required">
                Chapter
              </label>
              <input
                type="text"
                value={profileData.chapter}
                onChange={(e) => setProfileData({ ...profileData, chapter: e.target.value })}
                placeholder="e.g., Zeta Chi"
                required
                className="form-input"
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label-required">
                  Current Position
                </label>
                <input
                  type="text"
                  value={profileData.current_position}
                  onChange={(e) => setProfileData({ ...profileData, current_position: e.target.value })}
                  placeholder="e.g., Software Engineer"
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label-required">
                  Company
                </label>
                <input
                  type="text"
                  value={profileData.company}
                  onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                  placeholder="e.g., Google"
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label-required">
                  Industry
                </label>
                <input
                  type="text"
                  value={profileData.industry}
                  onChange={(e) => setProfileData({ ...profileData, industry: e.target.value })}
                  placeholder="e.g., Technology"
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label-required">
                  Location
                </label>
                <input
                  type="text"
                  value={profileData.location}
                  onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                  placeholder="e.g., San Francisco, CA"
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={profileData.linkedin_url}
                  onChange={(e) => setProfileData({ ...profileData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Website URL
                </label>
                <input
                  type="url"
                  value={profileData.website_url}
                  onChange={(e) => setProfileData({ ...profileData, website_url: e.target.value })}
                  placeholder="https://..."
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Role
              </label>
              <select
                value={profileData.is_mentor ? 'mentor' : profileData.is_mentee ? 'mentee' : ''}
                onChange={(e) => {
                  const value = e.target.value
                  setProfileData({
                    ...profileData,
                    is_mentor: value === 'mentor',
                    is_mentee: value === 'mentee',
                  })
                }}
                className="form-select"
              >
                <option value="">Select a role</option>
                <option value="mentor">Mentor</option>
                <option value="mentee">Mentee</option>
              </select>
              <p className="form-helper-text">
                Choose whether you want to be a mentor or mentee
              </p>
            </div>

            {profileData.is_mentor && (
              <div className="form-group">
                <label className="form-label">
                  Mentor Capacity (max number of mentees)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={profileData.mentor_capacity}
                  onChange={(e) => setProfileData({ ...profileData, mentor_capacity: parseInt(e.target.value) || 5 })}
                  className="form-input"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="btn btn-primary btn-lg"
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Experiences */}
        <div className="card card-padding mb-6">
          <div className="card-header">
            <div>
              <h2 className="card-title">Experiences</h2>
              <p className="section-subtitle">
                Add multiple work experiences, education, volunteer work, or projects
              </p>
            </div>
            {!showExperienceForm && (
              <button
                onClick={() => {
                  setShowExperienceForm(true)
                  setEditingExperience(null)
                  setExperienceForm({
                    type: 'work',
                    title: '',
                    company: '',
                    location: '',
                    description: '',
                    start_date: '',
                    end_date: '',
                    is_current: false,
                  })
                }}
                className="btn btn-primary btn-sm btn-icon"
              >
                <Plus className="w-4 h-4" />
                Add Experience
              </button>
            )}
          </div>

          {showExperienceForm && (
            <div className="experience-form">
              <form onSubmit={handleExperienceSubmit} className="form-container">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      Type
                    </label>
                    <select
                      value={experienceForm.type}
                      onChange={(e) => setExperienceForm({ ...experienceForm, type: e.target.value })}
                      className="form-select"
                    >
                      <option value="work">Work</option>
                      <option value="education">Education</option>
                      <option value="volunteer">Volunteer</option>
                      <option value="project">Project</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Title
                    </label>
                    <input
                      type="text"
                      value={experienceForm.title}
                      onChange={(e) => setExperienceForm({ ...experienceForm, title: e.target.value })}
                      required
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      Company/Institution
                    </label>
                    <input
                      type="text"
                      value={experienceForm.company}
                      onChange={(e) => setExperienceForm({ ...experienceForm, company: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Location
                    </label>
                    <input
                      type="text"
                      value={experienceForm.location}
                      onChange={(e) => setExperienceForm({ ...experienceForm, location: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Description
                  </label>
                  <textarea
                    value={experienceForm.description}
                    onChange={(e) => setExperienceForm({ ...experienceForm, description: e.target.value })}
                    className="form-textarea"
                    rows={3}
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={experienceForm.start_date}
                      onChange={(e) => setExperienceForm({ ...experienceForm, start_date: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={experienceForm.end_date}
                      onChange={(e) => setExperienceForm({ ...experienceForm, end_date: e.target.value })}
                      disabled={experienceForm.is_current}
                      className="form-input disabled:opacity-50"
                    />
                  </div>
                </div>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={experienceForm.is_current}
                    onChange={(e) => setExperienceForm({ ...experienceForm, is_current: e.target.checked })}
                    className="checkbox-input"
                  />
                  <span className="text-small text-body">Current position</span>
                </label>

                <div className="action-button-group">
                  <button
                    type="submit"
                    className="action-button-primary"
                  >
                    {editingExperience ? 'Update' : 'Add'} Experience
                  </button>
                  {!editingExperience && (
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault()
                        // Validate required fields
                        const trimmedTitle = experienceForm.title?.trim()
                        if (!trimmedTitle) {
                          alert('Please enter a title for the experience')
                          return
                        }
                        try {
                          await createExperienceMutation.mutateAsync(experienceForm)
                          // Reset form for another experience
                          setExperienceForm({
                            type: 'work',
                            title: '',
                            company: '',
                            location: '',
                            description: '',
                            start_date: '',
                            end_date: '',
                            is_current: false,
                          })
                        } catch (error: any) {
                          alert(error.message || 'Failed to save experience')
                        }
                      }}
                      disabled={createExperienceMutation.isPending}
                      className="action-button-secondary"
                    >
                      {createExperienceMutation.isPending ? 'Adding...' : 'Add Another'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCancelExperience}
                    className="action-button-ghost"
                  >
                    {editingExperience ? 'Cancel' : 'Done'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-3">
            {experiences && experiences.length > 0 ? (
              experiences.map((exp) => (
                <div key={exp.id} className="experience-item">
                  <div className="experience-item-header">
                    <div className="experience-item-content">
                      <h3 className="experience-item-title">{exp.title}</h3>
                      {exp.company && (
                        <p className="experience-item-meta">{exp.company}</p>
                      )}
                      {exp.location && (
                        <p className="experience-item-location">{exp.location}</p>
                      )}
                      {exp.start_date && (
                        <p className="experience-item-date">
                          {new Date(exp.start_date).toLocaleDateString()} -{' '}
                          {exp.is_current ? 'Present' : exp.end_date ? new Date(exp.end_date).toLocaleDateString() : ''}
                        </p>
                      )}
                      {exp.description && (
                        <p className="experience-item-description">{exp.description}</p>
                      )}
                    </div>
                    <div className="experience-item-actions">
                      <button
                        onClick={() => {
                          setEditingExperience(exp)
                          setShowExperienceForm(true)
                          setExperienceForm({
                            type: exp.type,
                            title: exp.title,
                            company: exp.company || '',
                            location: exp.location || '',
                            description: exp.description || '',
                            start_date: exp.start_date || '',
                            end_date: exp.end_date || '',
                            is_current: exp.is_current,
                          })
                        }}
                        className="experience-item-action-btn"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteExperience(exp.id)}
                        className="experience-item-delete-btn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="list-empty">
                No experiences yet. Add your first experience!
              </p>
            )}
          </div>
        </div>

        {/* Resumes */}
        <div className="card card-padding">
          <h2 className="section-title">Resumes</h2>
          <div className="form-group">
            <label className="resume-upload-label">
              Upload Resume (PDF, DOC, DOCX - Max 10MB)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResumeUpload}
              disabled={uploadResumeMutation.isPending}
              className="resume-upload-input"
            />
          </div>

          <div className="space-y-2">
            {resumes && resumes.length > 0 ? (
              resumes.map((resume) => (
                <div key={resume.id} className="resume-item">
                  <div className="resume-item-content">
                    <FileText className="w-5 h-5 text-muted" />
                    <div>
                      <p className="resume-item-name">{resume.file_name}</p>
                      {resume.file_size && (
                        <p className="resume-item-size">
                          {(resume.file_size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                    </div>
                    {resume.is_primary && (
                      <span className="badge badge-primary">
                        Primary
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="list-empty">
                No resumes uploaded yet
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

