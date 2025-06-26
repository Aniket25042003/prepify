import React, { useState, useEffect } from 'react'
import { Clock, LogOut, MessageCircle, Trash2, Calendar, User, BookOpen, Play, TrendingUp, Target, Award, Zap, Code, ExternalLink } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase, InterviewSession, CodingSession } from '../lib/supabase'
import { StarBorder } from '../components/ui/star-border'
import { analytics } from '../lib/analytics'

const codingPlatforms = [
  {
    name: 'LeetCode',
    url: 'https://leetcode.com',
    description: 'Popular coding interview preparation platform',
    color: 'from-orange-500 to-orange-600'
  },
  {
    name: 'HackerRank',
    url: 'https://hackerrank.com',
    description: 'Coding challenges and skill assessments',
    color: 'from-green-500 to-green-600'
  },
  {
    name: 'CodeSignal',
    url: 'https://codesignal.com',
    description: 'Technical interviews and coding assessments',
    color: 'from-blue-500 to-blue-600'
  },
  {
    name: 'Codeforces',
    url: 'https://codeforces.com',
    description: 'Competitive programming contests',
    color: 'from-red-500 to-red-600'
  },
  {
    name: 'AtCoder',
    url: 'https://atcoder.jp',
    description: 'Japanese competitive programming platform',
    color: 'from-purple-500 to-purple-600'
  },
  {
    name: 'TopCoder',
    url: 'https://topcoder.com',
    description: 'Competitive programming and development challenges',
    color: 'from-yellow-500 to-yellow-600'
  },
  {
    name: 'Codewars',
    url: 'https://codewars.com',
    description: 'Coding kata and programming challenges',
    color: 'from-indigo-500 to-indigo-600'
  },
  {
    name: 'GeeksforGeeks',
    url: 'https://practice.geeksforgeeks.org',
    description: 'Programming practice and interview preparation',
    color: 'from-teal-500 to-teal-600'
  }
]

export function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    role: '',
    company: '',
    interviewType: '' as 'Technical' | 'Behavioral' | 'System Design' | '',
    duration: 30,
    resume: '',
    jobDescription: '',
    additionalNotes: ''
  })
  const [interviewSessions, setInterviewSessions] = useState<InterviewSession[]>([])
  const [codingSessions, setCodingSessions] = useState<CodingSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadData()
    }
    analytics.viewDashboard()
  }, [user])

  const loadData = async () => {
    try {
      // Load interview sessions
      const { data: interviewData, error: interviewError } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (interviewError) throw interviewError
      setInterviewSessions(interviewData || [])

      // Load coding sessions
      const { data: codingData, error: codingError } = await supabase
        .from('coding_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (codingError) throw codingError
      setCodingSessions(codingData || [])

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteInterviewSession = async (id: string) => {
    try {
      const { error } = await supabase
        .from('interview_sessions')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)

      if (error) throw error
      setInterviewSessions(sessions => sessions.filter(session => session.id !== id))
    } catch (error) {
      console.error('Error deleting interview session:', error)
    }
  }

  const handleCodingPlatformClick = async (platform: typeof codingPlatforms[0]) => {
    analytics.clickCodingPlatform(platform.name)
    
    try {
      // Record the coding session
      const { error } = await supabase
        .from('coding_sessions')
        .insert({
          user_id: user?.id,
          platform_name: platform.name,
          platform_url: platform.url
        })

      if (error) throw error

      // Update local state to reflect the new coding session
      setCodingSessions(prev => [{
        id: crypto.randomUUID(),
        user_id: user?.id || '',
        platform_name: platform.name,
        platform_url: platform.url,
        created_at: new Date().toISOString()
      }, ...prev])

      // Open the platform in a new tab
      window.open(platform.url, '_blank')
    } catch (error) {
      console.error('Error recording coding session:', error)
      // Still open the platform even if recording fails
      window.open(platform.url, '_blank')
    }
  }

  const startInterview = () => {
    if (formData.role && formData.company && formData.interviewType && formData.resume && formData.jobDescription) {
      const params = new URLSearchParams({
        role: formData.role,
        company: formData.company,
        interviewType: formData.interviewType,
        duration: formData.duration.toString(),
        resume: formData.resume,
        jobDescription: formData.jobDescription,
        additionalNotes: formData.additionalNotes
      })
      navigate(`/chat?${params.toString()}`)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const isFormValid = formData.role && formData.company && formData.interviewType && formData.resume && formData.jobDescription

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case 'Technical': return Target
      case 'Behavioral': return User
      case 'System Design': return TrendingUp
      default: return Award
    }
  }

  // Calculate metrics
  const totalInterviews = interviewSessions.length
  const totalCodingSessions = codingSessions.length
  const avgDuration = totalInterviews > 0 ? Math.round(interviewSessions.reduce((acc, session) => acc + session.duration, 0) / totalInterviews) : 0
  const interviewTypes = new Set(interviewSessions.map(s => s.interview_type)).size
  
  // Interview frequency (interviews this month)
  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)
  const interviewsThisMonth = interviewSessions.filter(session => 
    new Date(session.created_at) >= thisMonth
  ).length

  // Create floating particles
  const particles = Array.from({ length: 30 }, (_, i) => (
    <div
      key={i}
      className="particle"
      style={{
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 20}s`,
        animationDuration: `${15 + Math.random() * 10}s`
      }}
    />
  ))

  return (
    <div className="min-h-screen bg-professional text-white overflow-hidden relative">
      {/* Animated Background Particles */}
      <div className="particles">
        {particles}
      </div>
      

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-slate-700/20">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between animate-fade-in">
              <div className="flex items-center space-x-2 float">
                <div className="relative">
                  <img 
                    src="/Prepwiser.png" 
                    alt="Prepwiser Logo" 
                    className="h-8 w-8 object-contain pulse-glow"
                  />
                  <div className="absolute inset-0 bg-purple-400 rounded-full blur-lg opacity-20 animate-pulse"></div>
                </div>
                <span className="text-xl font-bold font-serif neon-glow">Prepwiser</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="glass px-4 py-2 rounded-lg border border-slate-700/30 interactive">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-purple-400" />
                    <span className="text-sm">{user?.user_metadata?.full_name || user?.email}</span>
                  </div>
                </div>
                <StarBorder
                  as="button"
                  onClick={signOut}
                  className="text-sm"
                  color="rgb(168, 85, 247)"
                >
                  <div className="flex items-center space-x-2">
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                  </div>
                </StarBorder>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-12">
          {/* Welcome Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-300 dark:to-orange-200 float">
              Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'Job Seeker'}!
            </h1>
            <p className="text-xl text-slate-300">
              Ready to ace your next interview with AI practice?
            </p>
          </div>

          {/* Comprehensive Metrics */}
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            <div className="glass-strong rounded-xl p-6 card-3d interactive animate-fade-in stagger-1">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Play className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{totalInterviews}</div>
                  <div className="text-slate-400 text-sm">Total Interviews</div>
                </div>
              </div>
            </div>
            
            <div className="glass-strong rounded-xl p-6 card-3d interactive animate-fade-in stagger-2">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{avgDuration}m</div>
                  <div className="text-slate-400 text-sm">Avg Duration</div>
                </div>
              </div>
            </div>
            
            <div className="glass-strong rounded-xl p-6 card-3d interactive animate-fade-in stagger-3">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-700 to-purple-800 rounded-lg flex items-center justify-center">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{interviewTypes}</div>
                  <div className="text-slate-400 text-sm">Interview Types</div>
                </div>
              </div>
            </div>

            <div className="glass-strong rounded-xl p-6 card-3d interactive animate-fade-in stagger-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-800 to-purple-900 rounded-lg flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{interviewsThisMonth}</div>
                  <div className="text-slate-400 text-sm">This Month</div>
                </div>
              </div>
            </div>

            <div className="glass-strong rounded-xl p-6 card-3d interactive animate-fade-in stagger-5">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Code className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{totalCodingSessions}</div>
                  <div className="text-slate-400 text-sm">Coding Sessions</div>
                </div>
              </div>
            </div>

          </div>

          {/* Practice Cards */}
          <div className="flex flex-col lg:flex-row gap-8 mb-12">
            {/* Interview Setup */}
            <div className="lg:w-[65%] glass-strong rounded-2xl p-8 border border-slate-700/30 card-3d animate-scale-in">
              <h2 className="text-2xl font-semibold mb-6 font-serif text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-300 dark:to-orange-200">Start a New Interview Practice</h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="animate-fade-in stagger-1">
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Role You're Applying For
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                    className="form-input w-full rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none interactive"
                  />
                </div>

                <div className="animate-fade-in stagger-2">
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="e.g., Google, Microsoft, Startup Inc."
                    className="form-input w-full rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none interactive"
                  />
                </div>

                <div className="animate-fade-in stagger-3">
                  <label className="block text-sm font-medium text-slate-300 mb-3" id="interview-type-label">
                    Interview Type
                  </label>
                  <select
                    aria-labelledby="interview-type-label"
                    value={formData.interviewType}
                    onChange={(e) => handleInputChange('interviewType', e.target.value)}
                    className="form-input w-full rounded-lg px-4 py-3 text-white focus:outline-none interactive"
                  >
                    <option value="">Select interview type...</option>
                    <option value="Technical">Technical</option>
                    <option value="Behavioral">Behavioral</option>
                    <option value="System Design">System Design</option>
                  </select>
                </div>

                <div className="animate-fade-in stagger-4">
                  <label className="block text-sm font-medium text-slate-300 mb-3" id="duration-label">
                    Interview Duration (minutes)
                  </label>
                  <select
                    aria-labelledby="duration-label"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                    className="form-input w-full rounded-lg px-4 py-3 text-white focus:outline-none interactive"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="animate-fade-in stagger-1">
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Your Resume (paste as text)
                  </label>
                  <textarea
                    value={formData.resume}
                    onChange={(e) => handleInputChange('resume', e.target.value)}
                    placeholder="Paste your resume content here..."
                    rows={8}
                    className="form-input w-full rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none resize-none interactive"
                  />
                </div>

                <div className="animate-fade-in stagger-2">
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Job Description (paste as text)
                  </label>
                  <textarea
                    value={formData.jobDescription}
                    onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                    placeholder="Paste the job description here..."
                    rows={8}
                    className="form-input w-full rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none resize-none interactive"
                  />
                </div>
              </div>

              <div className="mb-8 animate-fade-in stagger-3">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Additional Notes (optional)
                </label>
                <textarea
                  value={formData.additionalNotes}
                  onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                  placeholder="Any additional information you'd like the interviewer to know about you..."
                  rows={3}
                  className="form-input w-full rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none resize-none interactive"
                />
              </div>

              <StarBorder
                as="button"
                onClick={startInterview}
                disabled={!isFormValid}
                className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Start Interview Practice</span>
                </div>
              </StarBorder>
            </div>

            {/* Coding Practice */}
            <div className="lg:w-[35%] glass-strong rounded-2xl p-8 border border-slate-700/30 card-3d animate-scale-in">
              <h2 className="text-2xl font-semibold mb-6 font-serif text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Start a New Coding Practice</h2>
              
              <p className="text-slate-300 text-center mb-6">
                Practice your coding skills on popular platforms to prepare for technical interviews
              </p>

              <div className="grid grid-cols-1 gap-4">
                {codingPlatforms.map((platform, index) => (
                  <button
                    key={platform.name}
                    onClick={() => handleCodingPlatformClick(platform)}
                    className={`glass rounded-lg p-4 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-300 interactive animate-fade-in stagger-${(index % 4) + 1} group`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 bg-gradient-to-r ${platform.color} rounded-lg flex items-center justify-center`}>
                          <Code className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                            {platform.name}
                          </h3>
                          <p className="text-sm text-slate-400">
                            {platform.description}
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="h-5 w-5 text-slate-400 group-hover:text-purple-300 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>


            </div>
          </div>

          {/* Interview History Section - Moved to middle */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold font-serif mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-300 dark:to-orange-200">Your Interview History</h2>
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="spinner-3d mx-auto mb-4"></div>
                  <p className="text-slate-300">Loading your interview history...</p>
                </div>
              ) : interviewSessions.length === 0 ? (
                <div className="text-center py-12 glass-strong rounded-2xl border border-slate-700/30 animate-fade-in">
                  <BookOpen className="h-16 w-16 text-slate-500 mx-auto mb-4 float" />
                  <h3 className="text-xl font-semibold mb-2">No interview sessions yet</h3>
                  <p className="text-slate-400">Start your first interview practice to begin building your skills!</p>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto grid gap-6">
                  {interviewSessions.map((session, index) => {
                    const IconComponent = getInterviewTypeIcon(session.interview_type)
                    
                    return (
                      <div
                        key={session.id}
                        className={`glass-strong rounded-xl p-6 border border-slate-700/30 card-3d group animate-fade-in stagger-${(index % 4) + 1}`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className={`w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
                              <IconComponent className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-semibold text-purple-400">{session.role}</h3>
                                <span className="text-slate-500">•</span>
                                <span className="text-slate-300 text-sm">{session.company}</span>
                                <span className="text-slate-500">•</span>
                                <span className={`text-sm px-2 py-1 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 text-white`}>
                                  {session.interview_type}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-slate-400">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatDate(session.created_at)}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{session.duration} minutes</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => deleteInterviewSession(session.id)}
                            aria-label="Delete session"
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-all duration-200 p-2 hover:bg-slate-700/50 rounded-lg interactive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="text-slate-200 leading-relaxed">
                          <p className="mb-2">{session.summary}</p>
                          <p className="text-sm text-slate-400 italic">💡 Detailed feedback was provided during the interview session</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
          </div>
        </main>
      </div>
    </div>
  )
}